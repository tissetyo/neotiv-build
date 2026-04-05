plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.neotiv.stb"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.neotiv.stb"
        minSdk = 21
        targetSdk = 34
        versionCode = 2
        versionName = "1.1.0"

        // ═══════════════════════════════════════════════
        // SET YOUR NEOTIV DOMAIN HERE — this is baked into the APK
        // so STB users never need to type anything
        // ═══════════════════════════════════════════════
        buildConfigField("String", "NEOTIV_BASE_URL", "\"https://neotiv.vercel.app\"")
    }

    buildFeatures {
        buildConfig = true
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    kotlinOptions {
        jvmTarget = "1.8"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("androidx.webkit:webkit:1.9.0")
    // Leanback for TV-optimized components (optional but good for TV focus)
    implementation("androidx.leanback:leanback:1.0.0")
}
