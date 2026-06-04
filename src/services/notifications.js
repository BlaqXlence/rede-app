/**
 * OneSignal v5 push notifications
 * react-native-onesignal@5.x + onesignal-expo-plugin@2.x
 * Safe no-op on web
 */
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const APP_ID = process.env.EXPO_PUBLIC_ONE_SIGNAL_APP_ID
const BASE   = process.env.EXPO_PUBLIC_API_URL

async function savePlayerIdToBackend(playerId) {
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
    await AsyncStorage.setItem('rede:onesignal_id', playerId)
    console.log('✅ OneSignal player ID saved to backend')
  } catch (err) {
    console.log('Could not save player ID:', err.message)
  }
}

export async function registerForPushNotifications() {
  if (Platform.OS === 'web') return

  try {
    const { OneSignal } = require('react-native-onesignal')

    // Initialize with your app ID
    OneSignal.initialize(APP_ID)

    // Request permission — shows dialog on Android 13+ and iOS
    await OneSignal.Notifications.requestPermission(true)

    // Get player ID and save to backend
    const onesignalId = await OneSignal.User.getOnesignalId()
    if (onesignalId) {
      await savePlayerIdToBackend(onesignalId)
    }

    // Watch for subscription changes (catches first-time registration)
    OneSignal.User.pushSubscription.addEventListener('change', async (sub) => {
      const id = sub?.current?.id
      if (id) await savePlayerIdToBackend(id)
    })

    console.log('✅ OneSignal initialized, App ID:', APP_ID?.slice(0, 8) + '...')
  } catch (err) {
    console.log('OneSignal init error:', err.message)
  }
}

export function onNotificationTap(handler) {
  if (Platform.OS === 'web') return () => {}
  try {
    const { OneSignal } = require('react-native-onesignal')
    OneSignal.Notifications.addEventListener('click', (event) => {
      const data = event?.notification?.additionalData || {}
      handler(data)
    })
  } catch (err) {
    console.log('OneSignal tap listener error:', err.message)
  }
  return () => {}
}

export function onForegroundNotification(handler) {
  if (Platform.OS === 'web') return () => {}
  try {
    const { OneSignal } = require('react-native-onesignal')
    OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
      const notif = event?.notification
      if (notif) {
        handler({
          request: {
            content: {
              title: notif.title,
              body:  notif.body,
              data:  notif.additionalData || {},
            },
          },
        })
      }
      event?.preventDefault?.()
      event?.notification?.display?.()
    })
  } catch (err) {
    console.log('OneSignal foreground listener error:', err.message)
  }
  return () => {}
}

export function clearBadge() {
  if (Platform.OS === 'web') return
  try {
    const { OneSignal } = require('react-native-onesignal')
    OneSignal.Notifications.clearAll()
  } catch {}
}
