package com.chronosport.mobile

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import androidx.core.app.NotificationCompat

class TimerNotificationService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private val scheduledCallbacks = mutableListOf<Runnable>()
  private var wakeLock: PowerManager.WakeLock? = null

  override fun onCreate() {
    super.onCreate()
    createNotificationChannels()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) {
      stopTimerService()
      return START_NOT_STICKY
    }

    val timestamps = intent?.getLongArrayExtra(EXTRA_REST_END_TIMESTAMPS) ?: longArrayOf()
    val phaseEndAt = intent?.getLongExtra(EXTRA_PHASE_END_AT, 0L) ?: 0L
    val phaseLabel = intent?.getStringExtra(EXTRA_PHASE_LABEL) ?: "Serie"
    val seriesLabel = intent?.getStringExtra(EXTRA_SERIES_LABEL) ?: ""

    ensureWakeLock()
    startForeground(
      SERVICE_NOTIFICATION_ID,
      buildServiceNotification(phaseEndAt, phaseLabel, seriesLabel),
    )

    scheduleRestNotifications(timestamps)
    return START_NOT_STICKY
  }

  override fun onTaskRemoved(rootIntent: Intent?) {
    stopTimerService()
    super.onTaskRemoved(rootIntent)
  }

  override fun onDestroy() {
    clearScheduledCallbacks()
    releaseWakeLock()
    notificationManager().cancel(ALERT_NOTIFICATION_ID)
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun buildServiceNotification(
    phaseEndAt: Long,
    phaseLabel: String,
    seriesLabel: String,
  ): Notification {
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
      flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
    }

    val pendingIntent = launchIntent?.let {
      PendingIntent.getActivity(
        this,
        0,
        it,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
    }

    val content = listOf(phaseLabel, seriesLabel)
      .filter { it.isNotBlank() }
      .joinToString(" • ")

    return NotificationCompat.Builder(this, SERVICE_CHANNEL_ID)
      .setSmallIcon(R.mipmap.ic_launcher)
      .setContentTitle("Chrono-Sport actif")
      .setContentText(content)
      .setOngoing(true)
      .setSilent(true)
      .setOnlyAlertOnce(true)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .setWhen(phaseEndAt)
      .setUsesChronometer(true)
      .setChronometerCountDown(true)
      .setContentIntent(pendingIntent)
      .build()
  }

  private fun scheduleRestNotifications(timestamps: LongArray) {
    clearScheduledCallbacks()
    notificationManager().cancel(ALERT_NOTIFICATION_ID)

    val now = System.currentTimeMillis()
    timestamps
      .filter { it > now }
      .forEach { timestamp ->
        val callback = Runnable {
          notificationManager().notify(
            ALERT_NOTIFICATION_ID,
            NotificationCompat.Builder(this, ALERT_CHANNEL_ID)
              .setSmallIcon(R.mipmap.ic_launcher)
              .setContentTitle("Chrono-Sport")
              .setContentText("Repos termine, on repart.")
              .setAutoCancel(true)
              .setPriority(NotificationCompat.PRIORITY_MAX)
              .setCategory(NotificationCompat.CATEGORY_ALARM)
              .setDefaults(Notification.DEFAULT_ALL)
              .build(),
          )
        }

        scheduledCallbacks.add(callback)
        handler.postDelayed(callback, timestamp - now)
      }
  }

  private fun clearScheduledCallbacks() {
    scheduledCallbacks.forEach(handler::removeCallbacks)
    scheduledCallbacks.clear()
  }

  private fun stopTimerService() {
    clearScheduledCallbacks()
    notificationManager().cancel(ALERT_NOTIFICATION_ID)
    releaseWakeLock()
    stopForeground(STOP_FOREGROUND_REMOVE)
    stopSelf()
  }

  private fun ensureWakeLock() {
    if (wakeLock?.isHeld == true) {
      return
    }

    val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
    wakeLock = powerManager.newWakeLock(
      PowerManager.PARTIAL_WAKE_LOCK,
      "ChronoSport::TimerWakeLock",
    ).apply {
      setReferenceCounted(false)
      acquire()
    }
  }

  private fun releaseWakeLock() {
    wakeLock?.let {
      if (it.isHeld) {
        it.release()
      }
    }
    wakeLock = null
  }

  private fun notificationManager(): NotificationManager =
    getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

  private fun createNotificationChannels() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }

    notificationManager().createNotificationChannel(
      NotificationChannel(
        SERVICE_CHANNEL_ID,
        "Chrono en cours",
        NotificationManager.IMPORTANCE_LOW,
      ),
    )

    notificationManager().createNotificationChannel(
      NotificationChannel(
        ALERT_CHANNEL_ID,
        "Fin de repos",
        NotificationManager.IMPORTANCE_HIGH,
      ).apply {
        enableVibration(true)
        vibrationPattern = longArrayOf(0, 250, 150, 250)
      },
    )
  }

  companion object {
    const val ACTION_SYNC = "com.chronosport.mobile.timer.SYNC"
    const val ACTION_STOP = "com.chronosport.mobile.timer.STOP"
    const val EXTRA_REST_END_TIMESTAMPS = "restEndTimestamps"
    const val EXTRA_PHASE_END_AT = "phaseEndAt"
    const val EXTRA_PHASE_LABEL = "phaseLabel"
    const val EXTRA_SERIES_LABEL = "seriesLabel"

    private const val SERVICE_CHANNEL_ID = "chrono-timer-service"
    private const val ALERT_CHANNEL_ID = "rest-finished-native"
    private const val SERVICE_NOTIFICATION_ID = 42001
    private const val ALERT_NOTIFICATION_ID = 42002
  }
}
