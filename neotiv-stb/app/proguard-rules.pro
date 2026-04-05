# Proguard rules for Neotiv STB Launcher
-keepattributes *Annotation*
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class com.neotiv.stb.** { *; }
-dontwarn androidx.leanback.**
