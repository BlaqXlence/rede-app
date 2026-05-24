/**
 * DateTimePicker.js
 * Native HTML date/time inputs for web — renders the OS picker on iPhone Safari.
 * colorScheme: dark makes the calendar widget match the app theme.
 */
import React from 'react'
import { View, Text, StyleSheet, Platform, TextInput } from 'react-native'
import colors from '../../constants/colors'

function Field({ label, error, children }) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

function webStyle(hasError) {
  return {
    width: '100%',
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    border: `1.5px solid ${hasError ? colors.error : colors.border}`,
    borderRadius: 10,
    padding: '13px 14px',
    fontSize: 16,
    outline: 'none',
    boxSizing: 'border-box',
    colorScheme: 'dark',
  }
}

export function DatePicker({ label, value, onChange, error }) {
  const today   = new Date().toISOString().split('T')[0]
  const maxDate = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]

  if (Platform.OS === 'web') {
    return (
      <Field label={label} error={error}>
        <input
          type="date"
          value={value}
          min={today}
          max={maxDate}
          onChange={e => onChange(e.target.value)}
          style={webStyle(!!error)}
        />
      </Field>
    )
  }
  return (
    <Field label={label} error={error}>
      <TextInput
        style={[styles.native, error && styles.nativeError]}
        value={value}
        onChangeText={onChange}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textHint}
        keyboardType="numbers-and-punctuation"
      />
    </Field>
  )
}

export function TimePicker({ label, value, onChange, error }) {
  if (Platform.OS === 'web') {
    return (
      <Field label={label} error={error}>
        <input
          type="time"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={webStyle(!!error)}
        />
      </Field>
    )
  }
  return (
    <Field label={label} error={error}>
      <TextInput
        style={[styles.native, error && styles.nativeError]}
        value={value}
        onChangeText={onChange}
        placeholder="HH:MM"
        placeholderTextColor={colors.textHint}
        keyboardType="numbers-and-punctuation"
      />
    </Field>
  )
}

const styles = StyleSheet.create({
  field: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  error: { fontSize: 12, color: colors.error, marginTop: 4 },
  native: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: colors.textPrimary },
  nativeError: { borderColor: colors.error },
})
