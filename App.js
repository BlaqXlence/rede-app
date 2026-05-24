import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Platform } from 'react-native'
import RootNavigator from './src/navigation'

// GestureHandler only needed on native — importing it on web breaks the bundle
if (Platform.OS !== 'web') {
  require('react-native-gesture-handler')
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#1A1A1A" />
      <RootNavigator />
    </SafeAreaProvider>
  )
}
