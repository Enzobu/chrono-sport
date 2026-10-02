package com.chronosport.mobile

import android.content.Intent
import android.os.Build
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray

class TimerNotificationModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "TimerNotification"

  @ReactMethod
  fun sync(
    restEndTimestamps: ReadableArray,
    phaseEndAt: Double,
    phaseLabel: String,
    seriesLabel: String,
    soundEnabled: Boolean,
  ) {
    val timestamps = LongArray(restEndTimestamps.size()) { index ->
      restEndTimestamps.getDouble(index).toLong()
    }

    val intent = Intent(reactContext, TimerNotificationService::class.java).apply {
      action = TimerNotificationService.ACTION_SYNC
      putExtra(TimerNotificationService.EXTRA_REST_END_TIMESTAMPS, timestamps)
      putExtra(TimerNotificationService.EXTRA_PHASE_END_AT, phaseEndAt.toLong())
      putExtra(TimerNotificationService.EXTRA_PHASE_LABEL, phaseLabel)
      putExtra(TimerNotificationService.EXTRA_SERIES_LABEL, seriesLabel)
      putExtra(TimerNotificationService.EXTRA_SOUND_ENABLED, soundEnabled)
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      ContextCompat.startForegroundService(reactContext, intent)
    } else {
      reactContext.startService(intent)
    }
  }

  @ReactMethod
  fun dismissRestFinishedNotification() {
    val manager = reactContext.getSystemService(android.content.Context.NOTIFICATION_SERVICE)
      as android.app.NotificationManager
    manager.cancel(42002)
  }

  @ReactMethod
  fun stop() {
    reactContext.stopService(Intent(reactContext, TimerNotificationService::class.java))
  }
}
