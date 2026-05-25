import React from 'react'
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native'
import colors from '../../constants/colors'

export default function Button({ label, onPress, variant = 'primary', size = 'md', loading = false, disabled = false, icon = null, style }) {
  const isDisabled = disabled || loading
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[styles.base, styles[variant], styles[`size_${size}`], isDisabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : colors.primary} size="small" />
      ) : (
        <View style={styles.inner}>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text style={[styles.label, styles[`label_${variant}`], styles[`labelSize_${size}`]]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: { borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  inner: { flexDirection: 'row', alignItems: 'center' },
  primary:   { backgroundColor: colors.primary },
  secondary: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
  ghost:     { backgroundColor: 'transparent' },
  danger:    { backgroundColor: colors.error },
  size_sm:   { paddingVertical: 8,  paddingHorizontal: 16 },
  size_md:   { paddingVertical: 14, paddingHorizontal: 24 },
  size_lg:   { paddingVertical: 16, paddingHorizontal: 32 },
  disabled:  { opacity: 0.4 },
  label:     { fontWeight: '700', letterSpacing: 0.2 },
  label_primary:   { color: '#fff' },
  label_secondary: { color: colors.primary },
  label_ghost:     { color: colors.primary },
  label_danger:    { color: '#fff' },
  labelSize_sm: { fontSize: 13 },
  labelSize_md: { fontSize: 15 },
  labelSize_lg: { fontSize: 16 },
})
