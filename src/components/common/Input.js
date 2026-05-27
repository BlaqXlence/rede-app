/**
 * Input.js
 * WhatsApp-style text input:
 * - NO blue outline when focused (outline: none on web)
 * - NO border highlight on focus
 * - Clean, minimal like WhatsApp chat input
 */
import React, { useState } from 'react'
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native'
import useThemeStore from '../../store/themeStore'

export default function Input({
  label, value, onChangeText, placeholder,
  error, hint, multiline, numberOfLines,
  keyboardType, autoCapitalize, autoComplete,
  maxLength, secureTextEntry, autoFocus,
  style, inputStyle,
}) {
  const { colors } = useThemeStore()
  const [focused, setFocused] = useState(false)

  const borderColor = error ? colors.error : colors.border

  return (
    <View style={[styles.field, style]}>
      {label ? (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      ) : null}

      {Platform.OS === 'web' ? (
        <textarea
          value={value}
          onChange={e => onChangeText(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={multiline ? (numberOfLines || 4) : 1}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            backgroundColor: colors.surface,
            color: colors.textPrimary,
            border: `1.5px solid ${borderColor}`,
            borderRadius: 10,
            padding: '13px 14px',
            fontSize: 15,
            fontFamily: 'inherit',
            resize: 'none',
            outline: 'none',        // removes blue outline on web
            WebkitAppearance: 'none',
            lineHeight: '1.5',
            minHeight: multiline ? 100 : 48,
          }}
        />
      ) : (
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor,
              color: colors.textPrimary,
              minHeight: multiline ? (numberOfLines || 4) * 24 : 48,
              textAlignVertical: multiline ? 'top' : 'center',
            },
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textHint}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize || 'none'}
          autoComplete={autoComplete}
          maxLength={maxLength}
          secureTextEntry={secureTextEntry}
          autoFocus={autoFocus}
          // Remove focus glow on native
          selectionColor={colors.primary}
          underlineColorAndroid="transparent"
        />
      )}

      {error ? (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.hint, { color: colors.textHint }]}>{hint}</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  field:  { marginBottom: 14 },
  label:  { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  error: { fontSize: 12, marginTop: 4 },
  hint:  { fontSize: 11, marginTop: 4 },
})
