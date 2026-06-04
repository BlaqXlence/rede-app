import React, { useEffect, useRef } from 'react'
import { StatusBar }       from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Platform }         from 'react-native'
import RootNavigator        from './src/navigation'
import useThemeStore        from './src/store/themeStore'
import useAuthStore         from './src/store/authStore'
import useNotificationStore from './src/store/notificationStore'
import ErrorBoundary        from './src/components/common/ErrorBoundary'
import {
  registerForPushNotifications,
  onNotificationTap,
  onForegroundNotification,
} from './src/services/notifications'

if (Platform.OS !== 'web') {
  require('react-native-gesture-handler')
}

export default function App() {
  const { isDark, colors, initialize } = useThemeStore()
  const { user }                       = useAuthStore()
  const { fetchNotifications, addLocal } = useNotificationStore()
  const navRef                         = useRef(null)

  useEffect(() => { initialize() }, [])

  // Register for push when user logs in
  useEffect(() => {
    if (user?.id) {
      registerForPushNotifications()
      fetchNotifications()
    }
  }, [user?.id])

  // Handle notification tap — navigate to event
  useEffect(() => {
    const unsub = onNotificationTap(data => {
      if (data.eventId && navRef.current) {
        navRef.current.navigate('EventDetail', { eventId: data.eventId })
      }
    })
    return unsub
  }, [])

  // Handle foreground notification — add to store instantly
  useEffect(() => {
    const unsub = onForegroundNotification(notification => {
      const { title, body, data } = notification.request.content
      addLocal({ type: data?.type || 'update', title, body, event_id: data?.eventId })
    })
    return unsub
  }, [])

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
        <RootNavigator navRef={navRef} />
      </SafeAreaProvider>
    </ErrorBoundary>
  )
}
