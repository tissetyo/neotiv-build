package com.neotiv.stb

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.KeyEvent
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.*
import android.widget.FrameLayout
import android.widget.TextView

/**
 * Main kiosk activity — loads the Neotiv TV Dashboard in a fullscreen WebView.
 *
 * Key features:
 * - Fullscreen immersive mode (no system bars)
 * - D-pad keycode → JavaScript KeyboardEvent bridge
 * - Auto-retry on network errors
 * - Back button blocked (prevents accidental exit)
 * - Screen always on
 */
class MainActivity : Activity() {

    private lateinit var webView: WebView
    private lateinit var rootLayout: FrameLayout
    private lateinit var statusText: TextView
    private val handler = Handler(Looper.getMainLooper())
    private var retryCount = 0
    private val maxRetries = 60 // 5 minutes of retrying

    companion object {
        private const val PREFS_NAME = "neotiv_stb_config"
        private const val KEY_BASE_URL = "base_url"
        private const val KEY_HOTEL_SLUG = "hotel_slug"
        private const val KEY_ROOM_CODE = "room_code"
        private const val KEY_ROOM_TOKEN = "room_session_token"
        private const val DEFAULT_BASE_URL = "https://neoscreen.site"
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Keep screen always on
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        hideSystemUI()

        // Build layout programmatically (no XML dependency)
        rootLayout = FrameLayout(this)
        rootLayout.setBackgroundColor(0xFF0f172a.toInt()) // Slate-900

        // Status text (shown during loading/errors)
        statusText = TextView(this).apply {
            text = "Connecting..."
            setTextColor(0xFFffffff.toInt())
            textSize = 18f
            gravity = android.view.Gravity.CENTER
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }
        rootLayout.addView(statusText)

        // Create WebView
        webView = WebView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            visibility = View.INVISIBLE // Hidden until page loads

            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            settings.useWideViewPort = true
            settings.loadWithOverviewMode = true
            settings.allowFileAccess = true
            settings.allowContentAccess = true

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            }

            // Add JS interface for native communication
            addJavascriptInterface(NeotivBridge(), "NeotivNative")

            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    retryCount = 0
                    statusText.visibility = View.GONE
                    webView.visibility = View.VISIBLE
                    injectDpadBridge()
                }

                override fun onReceivedError(
                    view: WebView?,
                    request: WebResourceRequest?,
                    error: WebResourceError?
                ) {
                    // Only handle main frame errors
                    if (request?.isForMainFrame == true) {
                        handleLoadError()
                    }
                }

                @Deprecated("Keep for older Android versions on STBs")
                override fun onReceivedError(
                    view: WebView?,
                    errorCode: Int,
                    description: String?,
                    failingUrl: String?
                ) {
                    handleLoadError()
                }

                override fun shouldOverrideUrlLoading(
                    view: WebView?,
                    request: WebResourceRequest?
                ): Boolean {
                    val url = request?.url?.toString() ?: return false

                    // Handle Android intents for native app launching
                    if (url.startsWith("intent://") || url.startsWith("market://")) {
                        try {
                            val intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
                            // We don't use resolveActivity here due to Android 11+ package visibility rules
                            // Just try to start it, and catch ActivityNotFoundException
                            try {
                                startActivity(intent)
                            } catch (e: android.content.ActivityNotFoundException) {
                                // App not installed, try fallback
                                val fallback = intent.getStringExtra("browser_fallback_url")
                                if (fallback != null) {
                                    if (fallback.startsWith("http")) {
                                        view?.loadUrl(fallback)
                                    } else if (fallback.startsWith("market://") || fallback.startsWith("intent://")) {
                                        try {
                                            val fallbackIntent = Intent.parseUri(fallback, Intent.URI_INTENT_SCHEME)
                                            startActivity(fallbackIntent)
                                        } catch (fallbackEx: Exception) {
                                            android.widget.Toast.makeText(this@MainActivity, "App Not Installed", android.widget.Toast.LENGTH_SHORT).show()
                                        }
                                    }
                                } else if (url.startsWith("intent://")) {
                                    val pkg = intent.getPackage()
                                    if (pkg != null) {
                                        try {
                                            startActivity(Intent(Intent.ACTION_VIEW, android.net.Uri.parse("market://details?id=" + pkg)))
                                        } catch (ex2: Exception) {
                                            android.widget.Toast.makeText(this@MainActivity, "App or Store Not Installed", android.widget.Toast.LENGTH_SHORT).show()
                                        }
                                    }
                                }
                            }
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                        return true
                    }

                    return false
                }
            }

            webChromeClient = object : WebChromeClient() {
                override fun onConsoleMessage(msg: ConsoleMessage?): Boolean {
                    android.util.Log.d("NeotivWebView", "${msg?.message()} [${msg?.sourceId()}:${msg?.lineNumber()}]")
                    return true
                }
            }
        }

        rootLayout.addView(webView)
        setContentView(rootLayout)

        loadDashboard()
    }

    private fun loadDashboard() {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val baseUrl = prefs.getString(KEY_BASE_URL, DEFAULT_BASE_URL) ?: DEFAULT_BASE_URL
        val hotelSlug = prefs.getString(KEY_HOTEL_SLUG, "") ?: ""
        val roomCode = prefs.getString(KEY_ROOM_CODE, "") ?: ""
        val roomToken = prefs.getString(KEY_ROOM_TOKEN, "") ?: ""

        if (hotelSlug.isEmpty() || roomCode.isEmpty() || roomToken.isEmpty()) {
            startActivity(Intent(this, SetupActivity::class.java))
            finish()
            return
        }

        val dashboardUrl = "${baseUrl.trimEnd('/')}/d/${hotelSlug}/${roomCode}/main"

        if (isNetworkAvailable()) {
            statusText.text = "Loading Neoscreen Dashboard..."
            CookieManager.getInstance().setAcceptCookie(true)
            CookieManager.getInstance().setCookie(baseUrl, "neotiv_room_session=$roomToken; Path=/; SameSite=Lax")
            CookieManager.getInstance().flush()
            webView.loadUrl(dashboardUrl)
        } else {
            handleLoadError()
        }
    }

    private fun handleLoadError() {
        if (retryCount < maxRetries) {
            retryCount++
            statusText.visibility = View.VISIBLE
            statusText.text = "Connecting... (attempt $retryCount)\nWaiting for network"
            webView.visibility = View.INVISIBLE
            handler.postDelayed({ loadDashboard() }, 5000)
        } else {
            statusText.text = "Cannot connect.\nPress OK to retry."
        }
    }

    private fun isNetworkAvailable(): Boolean {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val network = cm.activeNetwork ?: return false
            val capabilities = cm.getNetworkCapabilities(network) ?: return false
            return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        } else {
            @Suppress("DEPRECATION")
            val info = cm.activeNetworkInfo
            return info?.isConnected == true
        }
    }

    private fun injectDpadBridge() {
        webView.evaluateJavascript("""
            (function() {
                if (window.__neotivBridge) return;
                window.__neotivBridge = true;

                setTimeout(function() {
                    var el = document.querySelector('.tv-focusable');
                    if (el) el.focus();
                }, 500);

                console.log('[Neotiv STB] D-pad bridge active');
            })();
        """.trimIndent(), null)
    }

    private fun dispatchJsKey(key: String, code: String, keyCode: Int) {
        webView.evaluateJavascript("""
            (function() {
                var target = document.activeElement || document.body;
                var ev = new KeyboardEvent('keydown', {
                    key: '$key',
                    code: '$code',
                    keyCode: $keyCode,
                    which: $keyCode,
                    bubbles: true,
                    cancelable: true
                });
                target.dispatchEvent(ev);
            })();
        """.trimIndent(), null)
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        when (keyCode) {
            KeyEvent.KEYCODE_DPAD_UP -> { dispatchJsKey("ArrowUp", "ArrowUp", 38); return true }
            KeyEvent.KEYCODE_DPAD_DOWN -> { dispatchJsKey("ArrowDown", "ArrowDown", 40); return true }
            KeyEvent.KEYCODE_DPAD_LEFT -> { dispatchJsKey("ArrowLeft", "ArrowLeft", 37); return true }
            KeyEvent.KEYCODE_DPAD_RIGHT -> { dispatchJsKey("ArrowRight", "ArrowRight", 39); return true }
            KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER, KeyEvent.KEYCODE_NUMPAD_ENTER -> { dispatchJsKey("Enter", "Enter", 13); return true }
            KeyEvent.KEYCODE_BACK -> { dispatchJsKey("Escape", "Escape", 27); return true }
            KeyEvent.KEYCODE_0, KeyEvent.KEYCODE_NUMPAD_0 -> { dispatchJsKey("0", "Digit0", 48); return true }
            KeyEvent.KEYCODE_1, KeyEvent.KEYCODE_NUMPAD_1 -> { dispatchJsKey("1", "Digit1", 49); return true }
            KeyEvent.KEYCODE_2, KeyEvent.KEYCODE_NUMPAD_2 -> { dispatchJsKey("2", "Digit2", 50); return true }
            KeyEvent.KEYCODE_3, KeyEvent.KEYCODE_NUMPAD_3 -> { dispatchJsKey("3", "Digit3", 51); return true }
            KeyEvent.KEYCODE_4, KeyEvent.KEYCODE_NUMPAD_4 -> { dispatchJsKey("4", "Digit4", 52); return true }
            KeyEvent.KEYCODE_5, KeyEvent.KEYCODE_NUMPAD_5 -> { dispatchJsKey("5", "Digit5", 53); return true }
            KeyEvent.KEYCODE_6, KeyEvent.KEYCODE_NUMPAD_6 -> { dispatchJsKey("6", "Digit6", 54); return true }
            KeyEvent.KEYCODE_7, KeyEvent.KEYCODE_NUMPAD_7 -> { dispatchJsKey("7", "Digit7", 55); return true }
            KeyEvent.KEYCODE_8, KeyEvent.KEYCODE_NUMPAD_8 -> { dispatchJsKey("8", "Digit8", 56); return true }
            KeyEvent.KEYCODE_9, KeyEvent.KEYCODE_NUMPAD_9 -> { dispatchJsKey("9", "Digit9", 57); return true }
            KeyEvent.KEYCODE_DEL -> { dispatchJsKey("Backspace", "Backspace", 8); return true }
            KeyEvent.KEYCODE_VOLUME_UP, KeyEvent.KEYCODE_VOLUME_DOWN, KeyEvent.KEYCODE_VOLUME_MUTE -> return super.onKeyDown(keyCode, event)
        }
        return true
    }

    override fun onKeyUp(keyCode: Int, event: KeyEvent?): Boolean {
        return when (keyCode) {
            KeyEvent.KEYCODE_VOLUME_UP, KeyEvent.KEYCODE_VOLUME_DOWN, KeyEvent.KEYCODE_VOLUME_MUTE -> super.onKeyUp(keyCode, event)
            else -> true
        }
    }

    private fun hideSystemUI() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                val insetsController = window.insetsController
                if (insetsController != null) {
                    insetsController.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                    insetsController.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                    return
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("NeotivSTB", "Failed to use insetsController: \${e.message}")
        }
        try {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or View.SYSTEM_UI_FLAG_FULLSCREEN or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_LAYOUT_STABLE or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN)
        } catch (e: Exception) {
            android.util.Log.e("NeotivSTB", "Failed to use systemUiVisibility: \${e.message}")
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideSystemUI()
    }

    override fun onResume() {
        super.onResume()
        hideSystemUI()
        webView.onResume()
    }

    override fun onPause() {
        webView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    inner class NeotivBridge {
        @JavascriptInterface
        fun getDeviceInfo(): String {
            return """{"model":"${Build.MODEL}","manufacturer":"${Build.MANUFACTURER}","android":"${Build.VERSION.RELEASE}","sdk":${Build.VERSION.SDK_INT}}"""
        }

        @JavascriptInterface
        fun reconfigure() {
            handler.post { startActivity(Intent(this@MainActivity, SetupActivity::class.java)) }
        }

        @JavascriptInterface
        fun launchExternalApp(packageName: String) {
            handler.post {
                try {
                    val pm = packageManager
                    val launchIntent = pm.getLaunchIntentForPackage(packageName)
                    if (launchIntent != null) {
                        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        startActivity(launchIntent)
                    } else {
                        android.widget.Toast.makeText(this@MainActivity, "App Not Installed. Please install from Play Store.", android.widget.Toast.LENGTH_SHORT).show()
                    }
                } catch (e: Exception) {
                    android.widget.Toast.makeText(this@MainActivity, "Error launching app: " + e.message, android.widget.Toast.LENGTH_SHORT).show()
                }
            }
        }

        @JavascriptInterface
        fun exitApp() {
            handler.post {
                try {
                    // Try to launch Android Settings for maintenance
                    startActivity(Intent(android.provider.Settings.ACTION_SETTINGS))
                } catch (e: Exception) {
                    // If settings isn't accessible, just finish the task (loops to home)
                    finishAffinity()
                    System.exit(0)
                }
            }
        }

        @JavascriptInterface
        fun openSystemSettings() {
            handler.post {
                try {
                    startActivity(Intent(android.provider.Settings.ACTION_SETTINGS))
                } catch (e: Exception) {
                    android.widget.Toast.makeText(this@MainActivity, "Cannot open settings", android.widget.Toast.LENGTH_SHORT).show()
                }
            }
        }

        @JavascriptInterface
        fun getNetworkInfo(): String {
            return try {
                val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
                val isConnected = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    val network = cm.activeNetwork
                    val capabilities = cm.getNetworkCapabilities(network)
                    capabilities?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true
                } else {
                    @Suppress("DEPRECATION")
                    cm.activeNetworkInfo?.isConnected == true
                }

                val wifiManager = applicationContext.getSystemService(Context.WIFI_SERVICE) as? android.net.wifi.WifiManager
                val ssid = wifiManager?.connectionInfo?.ssid?.replace("\"", "") ?: "Unknown"
                val rssi = wifiManager?.connectionInfo?.rssi ?: -100
                val signalLevel = android.net.wifi.WifiManager.calculateSignalLevel(rssi, 5)
                val ip = wifiManager?.connectionInfo?.ipAddress?.let { ip ->
                    "${ip and 0xFF}.${ip shr 8 and 0xFF}.${ip shr 16 and 0xFF}.${ip shr 24 and 0xFF}"
                } ?: "0.0.0.0"

                """{"connected":$isConnected,"ssid":"$ssid","signalLevel":$signalLevel,"ip":"$ip"}"""
            } catch (e: Exception) {
                """{"connected":false,"ssid":"","signalLevel":0,"ip":""}"""
            }
        }
    }
}
