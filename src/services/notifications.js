/**
 * OneSignal push notifications — frontend
 * Uses react-native-onesignal v5 + onesignal-expo-plugin
 * Safe no-op on web
 */
import { Platform }  from 'react-native'
import AsyncStorage  from '@react-native-async-storage/async-storage'

const ONE_SIGNAL_APP_ID = process.env.EXPO_PUBLIC_ONE_SIGNAL_APP_ID
const BASE              = process.env.EXPO_PUBLIC_API_URL

let OneSignal    = null
let LogLevel     = null
let OSNotificationPermission = null

if (Platform.OS !== 'web') {
  try {
    const pkg = require('react-native-onesignal')
    OneSignal = pkg.OneSignal
    LogLevel  = pkg.LogLevel
  } catch (e) {
    console.log('OneSignal not available:', e.message)
  }
}

async function saveTokenToBackend(playerId) {
  try {
    const token = await AsyncStorage.getItem('rede:token')
    if (!token || !playerId) return
    await fetch(`${BASE}/auth/profile`, {
      method:  'PUT',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ push_token: playerId }),
    })
    await AsyncStorage.setItem('rede:push_player_id', playerId)
    console.log('OneSignal player ID saved')
  } catch (err) {
    console.log('Could not save push token:', err.message)
  }
}

export async function registerForPushNotifications() {
  if (Platform.OS === 'web' || !OneSignal || !ONE_SIGNAL_APP_ID) return

  try {
    // v5 API
    OneSignal.initialize(ONE_SIGNAL_APP_ID)
    OneSignal.Debug.setLogLevel(LogLevel?.None ?? 0)

    // Request permission
    await OneSignal.Notifications.requestPermission(true)

    // Get and save player ID
    const { userId } = await OneSignal.User.getOnesignalId() || {}
    if (userId) await saveTokenToBackend(userId)

    // Listen for changes
    OneSignal.User.pushSubscription.addEventListener('change', async sub => {
      if (sub.current?.id) await saveTokenToBackend(sub.current.id)
    })

    console.log('OneSignal v5 initialized')
  } catch (err) {
    console.log('OneSignal init error:', err.message)
  }
}

export function onNotificationTap(handler) {
  if (Platform.OS === 'web' || !OneSignal) return () => {}
  try {
    OneSignal.Notifications.addEventListener('click', event => {
      const data = event.notification?.additionalData || {}
      handler(data)
    })
  } catch {}
  return () => {}
}

export function onForegroundNotification(handler) {
  if (Platform.OS === 'web' || !OneSignal) return () => {}
  try {
    OneSignal.Notifications.addEventListener('foregroundWillDisplay', event => {
      const notif = event.notification
      handler({
        request: {
          content: {
            title: notif.title,
            body:  notif.body,
            data:  notif.additionalData || {},
          },
        },
      })
      event.preventDefault() // we handle display ourselves
      event.notification.display()
    })
  } catch {}
  return () => {}
}

export function clearBadge() {
  if (Platform.OS !== 'web' && OneSignal) {
    try { OneSignal.Notifications.clearAll() } catch {}
  }
}
