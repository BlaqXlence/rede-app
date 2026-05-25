/**
 * DateTimePicker.js
 * Clean, non-overlapping date and time inputs for web and native.
 * On web: native HTML inputs with dark color scheme.
 * Each picker is in its own full-width block — no side-by-side overlap.
 */
import React from 'react'
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native'
import colors from '../../constants/colors'

function Label({ text }) {
  return <Text style={styles.label}>{text}</Text>
}

function ErrorText({ text }) {
  return text ? <Text style={styles.error}>{text}</Text> : null
}

// Web date input with full dark styling
function WebDateInput({ value, onChange, min, max }) {
  if (Platform.OS !== 'web') return null
  return (
    <input
      type="date"
      value={value || ''}
      min={min}
      max={max}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', boxSizing: 'border-box',
        backgroundColor: colors.surface,
        color: value ? colors.textPrimary : colors.textHint,
        border: `1.5px solid ${colors.border}`,
        borderRadius: 10,
        padding: '14px 14px',
        fontSize: 16,
        outline: 'none',
        colorScheme: 'dark',
        fontFamily: 'inherit',
      }}
    />
  )
}

// Web time input
function WebTimeInput({ value, onChange }) {
  if (Platform.OS !== 'web') return null
  return (
    <input
      type="time"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', boxSizing: 'border-box',
        backgroundColor: colors.surface,
        color: value ? colors.textPrimary : colors.textHint,
        border: `1.5px solid ${colors.border}`,
        borderRadius: 10,
        padding: '14px 14px',
        fontSize: 16,
        outline: 'none',
        colorScheme: 'dark',
        fontFamily: 'inherit',
      }}
    />
  )
}

export function DatePicker({ label, value, onChange, error }) {
  const today   = new Date().toISOString().split('T')[0]
  const maxDate = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]

  return (
    <View style={styles.field}>
      <Label text={label || 'Date'} />
      {Platform.OS === 'web'
        ? <WebDateInput value={value} onChange={onChange} min={today} max={maxDate} />
        : (
          <TextInput
            style={[styles.input, error && styles.inputError]}
            value={value}
            onChangeText={onChange}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textHint}
            keyboardType="numbers-and-punctuation"
          />
        )
      }
      <ErrorText text={error} />
    </View>
  )
}

export function TimePicker({ label, value, onChange, error }) {
  return (
    <View style={styles.field}>
      <Label text={label || 'Time'} />
      {Platform.OS === 'web'
        ? <WebTimeInput value={value} onChange={onChange} />
        : (
          <TextInput
            style={[styles.input, error && styles.inputError]}
            value={value}
            onChangeText={onChange}
            placeholder="HH:MM (e.g. 19:00)"
            placeholderTextColor={colors.textHint}
            keyboardType="numbers-and-punctuation"
          />
        )
      }
      <ErrorText text={error} />
    </View>
  )
}

const styles = StyleSheet.create({
  field: { marginBottom: 14 },
  label: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface, borderWidth: 1.5,
    borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 16, color: colors.textPrimary,
  },
  inputError: { borderColor: colors.error },
  error: { fontSize: 12, color: colors.error, marginTop: 4 },
})
