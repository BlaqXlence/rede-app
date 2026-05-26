import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Platform } from 'react-native'
import RootNavigator from './src/navigation'
import useThemeStore from './src/store/themeStore'

if (Platform.OS !== 'web') {
  require('react-native-gesture-handler')
}

export default function App() {
  const { isDark, colors, initialize } = useThemeStore()

  useEffect(() => {
    initialize()
  }, [])

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
      <RootNavigator />
    </SafeAreaProvider>
  )
}
