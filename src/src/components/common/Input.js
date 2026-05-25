import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import colors from '../../constants/colors'

export default function Input({ label, value, onChangeText, placeholder, error, hint, secureTextEntry, keyboardType = 'default', autoCapitalize = 'none', autoComplete, maxLength, multiline = false, numberOfLines = 1, prefix, suffix, onSuffixPress, editable = true, style }) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.wrap, focused && styles.focused, !!error && styles.hasError, !editable && styles.disabled]}>
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          style={[styles.input, multiline && styles.multiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textHint}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          textAlignVertical={multiline ? 'top' : 'auto'}
        />
        {suffix ? (
          <TouchableOpacity onPress={onSuffixPress} disabled={!onSuffixPress}>
            <Text style={styles.suffix}>{suffix}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  wrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14 },
  focused: { borderColor: colors.primary },
  hasError: { borderColor: colors.error },
  disabled: { opacity: 0.5 },
  input: { flex: 1, fontSize: 16, color: colors.textPrimary, paddingVertical: 14 },
  multiline: { minHeight: 100, paddingTop: 14 },
  prefix: { fontSize: 16, color: colors.textSecondary, marginRight: 4, fontWeight: '700' },
  suffix: { fontSize: 14, color: colors.primary, fontWeight: '700', marginLeft: 4 },
  error: { fontSize: 12, color: colors.error, marginTop: 4, marginLeft: 2 },
  hint:  { fontSize: 12, color: colors.textHint, marginTop: 4, marginLeft: 2 },
})
