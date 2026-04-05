package com.neotiv.stb

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Starts the Neotiv launcher automatically when the STB powers on.
 * Registered in AndroidManifest for BOOT_COMPLETED and QUICKBOOT_POWERON.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val validActions = setOf(
            Intent.ACTION_BOOT_COMPLETED,
            "android.intent.action.QUICKBOOT_POWERON",
            "com.htc.intent.action.QUICKBOOT_POWERON"
        )

        if (intent.action in validActions) {
            // Launch SetupActivity which will auto-redirect to
            // MainActivity if config already exists
            val launchIntent = Intent(context, SetupActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(launchIntent)
        }
    }
}
