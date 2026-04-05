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
import android.view.Gravity
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.*
import android.widget.FrameLayout
import android.widget.TextView

/**
 * Zero-typing setup:
 * 1. App opens → loads {BuildConfig.NEOTIV_BASE_URL}/setup-stb
 * 2. QR code appears automatically on the TV
 * 3. Staff scans from phone → pairs device to a room
 * 4. JS bridge detects pairing → saves config → dashboard launches
 *
 * The domain URL is baked into the APK via build.gradle.kts buildConfigField,
 * so the user installing on the STB never types anything.
 *
 * ADB headless setup also supported:
 *   adb shell am start -n com.neotiv.stb/.SetupActivity \
 *     --es hotel_slug "amartha-bali" --es room_code "101"
 */
class SetupActivity : Activity() {

    companion object {
        private const val PREFS_NAME = "neotiv_stb_config"
        private const val KEY_BASE_URL = "base_url"
        private const val KEY_HOTEL_SLUG = "hotel_slug"
        private const val KEY_ROOM_CODE = "room_code"
    }

    private val handler = Handler(Looper.getMainLooper())
    private var webView: WebView? = null
    private var statusText: TextView? = null
    private var retryCount = 0

    // Domain URL comes from BuildConfig — set in build.gradle.kts
    private val baseUrl: String
        get() = BuildConfig.NEOTIV_BASE_URL.trimEnd('/')

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        hideSystemUI()

        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        // Save base URL from BuildConfig
        prefs.edit().putString(KEY_BASE_URL, baseUrl).apply()

        // ── ADB headless setup ──
        val intentSlug = intent.getStringExtra("hotel_slug")
        val intentRoom = intent.getStringExtra("room_code")
        if (!intentSlug.isNullOrBlank() && !intentRoom.isNullOrBlank()) {
            prefs.edit()
                .putString(KEY_HOTEL_SLUG, intentSlug)
                .putString(KEY_ROOM_CODE, intentRoom)
                .apply()
            launchDashboard()
            return
        }

        // ── Already configured → go to dashboard ──
        val existingSlug = prefs.getString(KEY_HOTEL_SLUG, "") ?: ""
        val existingRoom = prefs.getString(KEY_ROOM_CODE, "") ?: ""
        if (existingSlug.isNotBlank() && existingRoom.isNotBlank()) {
            launchDashboard()
            return
        }

        // ── Load QR setup page immediately — zero typing ──
        showQrSetup(prefs)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun showQrSetup(prefs: android.content.SharedPreferences) {
        val root = FrameLayout(this).apply {
            setBackgroundColor(0xFF0f172a.toInt())
        }

        statusText = TextView(this).apply {
            text = "Loading QR setup..."
            setTextColor(0xFFffffff.toInt())
            textSize = 18f
            gravity = Gravity.CENTER
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }
        root.addView(statusText)

        webView = WebView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            visibility = View.INVISIBLE

            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            settings.useWideViewPort = true
            settings.loadWithOverviewMode = true

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            }

            setLayerType(View.LAYER_TYPE_HARDWARE, null)
            addJavascriptInterface(SetupBridge(prefs), "NeotivSetup")

            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    retryCount = 0
                    statusText?.visibility = View.GONE
                    webView?.visibility = View.VISIBLE
                    injectPairingListener()
                }

                override fun onReceivedError(
                    view: WebView?, request: WebResourceRequest?, error: WebResourceError?
                ) {
                    if (request?.isForMainFrame == true) handleLoadError()
                }

                @Deprecated("Keep for older Android")
                override fun onReceivedError(
                    view: WebView?, errorCode: Int, description: String?, failingUrl: String?
                ) {
                    handleLoadError()
                }
            }

            webChromeClient = object : WebChromeClient() {
                override fun onConsoleMessage(msg: ConsoleMessage?): Boolean {
                    android.util.Log.d("NeotivSetup", "${msg?.message()}")
                    return true
                }
            }
        }

        root.addView(webView)
        setContentView(root)

        loadSetupPage()
    }

    private fun loadSetupPage() {
        if (isNetworkAvailable()) {
            statusText?.text = "Loading QR setup..."
            webView?.loadUrl("$baseUrl/setup-stb")
        } else {
            handleLoadError()
        }
    }

    private fun injectPairingListener() {
        webView?.evaluateJavascript("""
            (function() {
                if (window.__neotivSetupWatcher) return;
                window.__neotivSetupWatcher = true;
                var _setItem = localStorage.setItem.bind(localStorage);
                localStorage.setItem = function(key, value) {
                    _setItem(key, value);
                    if (key === 'neotiv_stb_setup') {
                        try {
                            var d = JSON.parse(value);
                            if (d.hotelSlug && d.roomCode) {
                                NeotivSetup.onPaired(d.hotelSlug, d.roomCode);
                            }
                        } catch(e) {}
                    }
                };
                console.log('[Neotiv] Pairing listener active');
            })();
        """.trimIndent(), null)
    }

    private fun handleLoadError() {
        if (retryCount < 30) {
            retryCount++
            statusText?.visibility = View.VISIBLE
            statusText?.text = "Connecting to $baseUrl...\nAttempt $retryCount — check WiFi"
            webView?.visibility = View.INVISIBLE
            handler.postDelayed({ loadSetupPage() }, 5000)
        } else {
            statusText?.text = "Cannot connect to $baseUrl\nRestart app to try again"
        }
    }

    private fun isNetworkAvailable(): Boolean {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val net = cm.activeNetwork ?: return false
            val cap = cm.getNetworkCapabilities(net) ?: return false
            return cap.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        } else {
            @Suppress("DEPRECATION")
            return cm.activeNetworkInfo?.isConnected == true
        }
    }

    private fun launchDashboard() {
        startActivity(Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
        })
        finish()
    }

    private fun hideSystemUI() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.let {
                it.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                it.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            )
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideSystemUI()
    }

    inner class SetupBridge(private val prefs: android.content.SharedPreferences) {
        @JavascriptInterface
        fun onPaired(hotelSlug: String, roomCode: String) {
            prefs.edit()
                .putString(KEY_HOTEL_SLUG, hotelSlug)
                .putString(KEY_ROOM_CODE, roomCode)
                .apply()
            handler.post { launchDashboard() }
        }
    }
}
