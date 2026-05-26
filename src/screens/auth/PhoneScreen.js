/**
 * PhoneScreen.js
 * Clean Uganda phone entry.
 * +256 is shown as a fixed prefix — user only types the 9 digits after it.
 * Validates MTN (076,077,078) and Airtel (070,075).
 */
import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
  Alert, TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore from '../../store/themeStore'
import useAuthStore  from '../../store/authStore'

// Uganda valid prefixes after +256
const VALID_PREFIXES = ['70', '75', '76', '77', '78']

export default function PhoneScreen({ navigation }) {
  const { colors }   = useThemeStore()
  const { sendOtp }  = useAuthStore()

  // User types only the 9 digits — we prepend +256
  const [localNumber, setLocalNumber] = useState('')
  const [error, setError]   = useState(null)
  const [loading, setLoading] = useState(false)

  function handleChange(text) {
    // Strip everything except digits
    const digits = text.replace(/\D/g, '')
    // Max 9 digits (Uganda number without country code)
    if (digits.length <= 9) {
      setLocalNumber(digits)
      if (error) setError(null)
    }
  }

  function validate() {
    if (localNumber.length < 9) return 'Enter all 9 digits'
    const prefix = localNumber.slice(0, 2)
    if (!VALID_PREFIXES.includes(prefix)) {
      return 'Enter a valid number (MTN: 076/077/078 · Airtel: 070/075)'
    }
    return null
  }

  async function handleContinue() {
    const err = validate()
    if (err) { setError(err); return }

    // Full international format: +256 + 9 digits
    const fullPhone = `+256${localNumber}`
    setLoading(true)
    try {
      await sendOtp(fullPhone)
      navigation.navigate('Otp', { phone: fullPhone })
    } catch (e) {
      Alert.alert('Could not send code', e.message || 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isReady = localNumber.length === 9

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 32 }}>
            <Text style={[styles.back, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>

          <Text style={[styles.heading, { color: colors.textPrimary }]}>Your phone number</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            We'll send a 6-digit verification code via SMS.
          </Text>

          {/* Phone input row */}
          <View style={styles.inputRow}>
            {/* Country code — fixed, not editable */}
            <View style={[styles.countryCode, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.flag}>🇺🇬</Text>
              <Text style={[styles.code, { color: colors.textPrimary }]}>+256</Text>
            </View>

            {/* Number input */}
            <View style={[
              styles.numberWrap,
              { backgroundColor: colors.surface, borderColor: error ? colors.error : colors.border },
            ]}>
              <TextInput
                style={[styles.numberInput, { color: colors.textPrimary }]}
                value={localNumber}
                onChangeText={handleChange}
                placeholder="771 234 567"
                placeholderTextColor={colors.textHint}
                keyboardType="number-pad"
                maxLength={9}
                autoFocus
              />
            </View>
          </View>

          {/* Full number preview */}
          {localNumber.length > 0 && (
            <Text style={[styles.preview, { color: colors.textHint }]}>
              Full number: +256{localNumber}
            </Text>
          )}

          {error && (
            <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
          )}

          <Text style={[styles.hint, { color: colors.textHint }]}>
            MTN: 076, 077, 078 · Airtel: 070, 075
          </Text>

          <TouchableOpacity
            style={[
              styles.btn,
              { backgroundColor: colors.primary, opacity: (!isReady || loading) ? 0.5 : 1 },
            ]}
            onPress={handleContinue}
            disabled={!isReady || loading}
            activeOpacity={0.85}
          >
            <Text style={styles.btnTxt}>{loading ? 'Sending...' : 'Send Code'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  content: { padding: 24, paddingTop: 16 },
  back:    { fontSize: 16, fontWeight: '600' },
  heading: { fontSize: 28, fontWeight: '800', marginBottom: 10, letterSpacing: -0.5 },
  sub:     { fontSize: 15, lineHeight: 22, marginBottom: 28 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },

  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 15,
  },
  flag: { fontSize: 22 },
  code: { fontSize: 17, fontWeight: '700' },

  numberWrap: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  numberInput: {
    fontSize: 20,
    fontWeight: '600',
    paddingVertical: 14,
    letterSpacing: 2,
  },

  preview: { fontSize: 13, marginBottom: 6 },
  error:   { fontSize: 13, marginBottom: 8, fontWeight: '500' },
  hint:    { fontSize: 12, marginBottom: 28 },

  btn:    { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
