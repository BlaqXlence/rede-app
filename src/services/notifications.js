/**
 * OneSignal v5 — initialize FIRST before any listeners
 * This fixes "Must call initWithContext before use" crash
 */
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const APP_ID = process.env.EXPO_PUBLIC_ONE_SIGNAL_APP_ID
const BASE   = process.env.EXPO_PUBLIC_API_URL

// ── Initialize OneSignal immediately on module load ────────────
// Must happen before any listener registration
let _initialized = false

function getOneSignal() {
  if (Platform.OS === 'web') return null
  try {
    const { OneSignal } = require('react-native-onesignal')
    if (!_initialized && APP_ID) {
      OneSignal.initialize(APP_ID)
      _initialized = true
      console.log('✅ OneSignal initialized')
    }
    return OneSignal
  } catch (err) {
    console.log('OneSignal unavailable:', err.message)
    return null
  }
}

// Call on module load — native needs this before anything else
getOneSignal()

// ── Save player ID to backend ──────────────────────────────────
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
    console.log('✅ Player ID saved to backend')
  } catch (err) {
    console.log('Could not save player ID:', err.message)
  }
}

// ── Register + request permission ─────────────────────────────
export async function registerForPushNotifications() {
  const OS = getOneSignal()
  if (!OS) return

  try {
    // Request permission
    await OS.Notifications.requestPermission(true)

    // Get current player ID
    const onesignalId = await OS.User.getOnesignalId()
    if (onesignalId) await savePlayerIdToBackend(onesignalId)

    // Watch for subscription changes
    OS.User.pushSubscription.addEventListener('change', async sub => {
      const id = sub?.current?.id
      if (id) await savePlayerIdToBackend(id)
    })
  } catch (err) {
    console.log('Push registration error:', err.message)
  }
}

// ── Notification tap handler ───────────────────────────────────
export function onNotificationTap(handler) {
  const OS = getOneSignal()
  if (!OS) return () => {}
  try {
    OS.Notifications.addEventListener('click', event => {
      const data = event?.notification?.additionalData || {}
      handler(data)
    })
  } catch (err) {
    console.log('Tap listener error:', err.message)
  }
  return () => {}
}

// ── Foreground notification handler ───────────────────────────
export function onForegroundNotification(handler) {
  const OS = getOneSignal()
  if (!OS) return () => {}
  try {
    OS.Notifications.addEventListener('foregroundWillDisplay', event => {
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
      event?.notification?.display?.()
    })
  } catch (err) {
    console.log('Foreground listener error:', err.message)
  }
  return () => {}
}

export function clearBadge() {
  const OS = getOneSignal()
  if (!OS) return
  try { OS.Notifications.clearAll() } catch {}
}
