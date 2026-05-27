import React from 'react'
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native'
import useThemeStore from '../../store/themeStore'

export default function Button({ label, onPress, variant = 'primary', loading, disabled, style }) {
  const { colors } = useThemeStore()

  const bgColor = variant === 'primary'   ? colors.primary
               : variant === 'danger'    ? colors.error
               : 'transparent'

  const textColor = variant === 'secondary' || variant === 'ghost'
    ? colors.primary : '#fff'

  const borderStyle = variant === 'secondary'
    ? { borderWidth: 1.5, borderColor: colors.primary } : {}

  return (
    <TouchableOpacity
      style={[
        styles.base,
        { backgroundColor: bgColor },
        borderStyle,
        (disabled || loading) && { opacity: 0.5 },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading
        ? <ActivityIndicator color={textColor} />
        : <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      }
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base:  { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  label: { fontSize: 15, fontWeight: '700' },
})
