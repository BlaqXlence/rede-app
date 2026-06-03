/**
 * Tap — universal pressable for all platforms
 * Android: native ripple (instant, no JS thread)
 * iOS: opacity fade (standard iOS feel)
 * Web: subtle background highlight
 */
import React from 'react'
import { Pressable, Platform, StyleSheet, View } from 'react-native'

export default function Tap({
  onPress,
  onLongPress,
  style,
  children,
  disabled = false,
  rippleColor = 'rgba(0,0,0,0.12)',
  borderless = false,
  hitSlop,
  activeOpacity = 0.7,
}) {
  if (Platform.OS === 'android') {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        hitSlop={hitSlop}
        android_ripple={{ color: rippleColor, borderless }}
        style={({ pressed }) => [
          style,
          disabled && { opacity: 0.4 },
        ]}
      >
        {children}
      </Pressable>
    )
  }

  // iOS + Web
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        style,
        pressed && { opacity: activeOpacity },
        disabled && { opacity: 0.4 },
      ]}
    >
      {children}
    </Pressable>
  )
}
