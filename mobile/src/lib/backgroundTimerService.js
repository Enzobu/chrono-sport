import { Platform } from 'react-native'
import BackgroundService from 'react-native-background-actions'

let snapshotProvider = null

const sleep = (duration) => new Promise((resolve) => setTimeout(resolve, duration))

const getNotificationDescription = () => {
  if (!snapshotProvider) {
    return 'Chrono en cours'
  }

  const snapshot = snapshotProvider()
  if (!snapshot) {
    return 'Chrono en cours'
  }

  return `${snapshot.sessionName} - ${snapshot.phase} - ${snapshot.remaining}`
}

const task = async ({ delay }) => {
  while (BackgroundService.isRunning()) {
    await BackgroundService.updateNotification({
      taskDesc: getNotificationDescription(),
    })
    await sleep(delay)
  }
}

const options = {
  taskName: 'Chrono-Sport',
  taskTitle: 'Chrono-Sport actif',
  taskDesc: 'Chrono en cours',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#ffffff',
  linkingURI: 'com.chronosport.mobile://timer',
  parameters: {
    delay: 1000,
  },
}

export function setTimerSnapshotProvider(provider) {
  snapshotProvider = provider
}

export async function ensureBackgroundChronoRunning() {
  if (Platform.OS !== 'android' || BackgroundService.isRunning()) {
    return
  }

  await BackgroundService.start(task, options)
}

export async function refreshBackgroundChronoNotification() {
  if (Platform.OS !== 'android' || !BackgroundService.isRunning()) {
    return
  }

  await BackgroundService.updateNotification({
    taskDesc: getNotificationDescription(),
  })
}

export async function stopBackgroundChrono() {
  if (Platform.OS !== 'android' || !BackgroundService.isRunning()) {
    return
  }

  await BackgroundService.stop()
}
