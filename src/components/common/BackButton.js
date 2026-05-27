/**
 * BackButton.js
 * Consistent back arrow used on every screen that needs one.
 * Shows as a clean left arrow — works on all screen types.
 */
import React from 'react'
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native'
import useThemeStore from '../../store/themeStore'

export default function BackButton({ onPress, style }) {
  const { colors } = useThemeStore()
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.btn, style]}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      activeOpacity={0.7}
    >
      <Text style={[styles.arrow, { color: colors.primary }]}>←</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  btn: {
    padding: 4,
  },
  arrow: {
    fontSize: 22,
    fontWeight: '600',
  },
})
