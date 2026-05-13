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
        versionCode = 9
        versionName = "2.0.2"

        // ═══════════════════════════════════════════════
        // SET YOUR NEOTIV DOMAIN HERE — this is baked into the APK
        // so STB users never need to type anything
        // ═══════════════════════════════════════════════
        buildConfigField("String", "NEOTIV_BASE_URL", "\"https://neoscreen.site\"")
    }

    buildFeatures {
        buildConfig = true
    }

    signingConfigs {
        create("release") {
            storeFile = file("keystore.jks")
            storePassword = "password"
            keyAlias = "neotiv"
            keyPassword = "password"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")
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
}
