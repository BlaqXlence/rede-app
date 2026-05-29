/**
 * PhoneScreen — minimal, clean
 */
import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore from '../../store/themeStore'
import useAuthStore  from '../../store/authStore'

const { width } = Dimensions.get('window')
const MAX_W = Math.min(width, 500)

export default function PhoneScreen({ navigation }) {
  const { colors }  = useThemeStore()
  const { sendOtp } = useAuthStore()
  const [phone,   setPhone]   = useState('')
  const [loading, setLoading] = useState(false)

  const full    = `+256${phone}`
  const isValid = phone.replace(/\s/g, '').length === 9

  async function handleSend() {
    if (!isValid) return
    setLoading(true)
    try {
      await sendOtp(full)
      navigation.navigate('Otp', { phone: full })
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not send code. Try again.')
    } finally { setLoading(false) }
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top','bottom']}>
      <View style={[s.phone, { maxWidth: MAX_W }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={[s.backTxt, { color: colors.primary }]}>←</Text>
        </TouchableOpacity>

        <Text style={[s.heading, { color: colors.textPrimary }]}>Your phone number</Text>
        <Text style={[s.sub, { color: colors.textSecondary }]}>
          We'll send you a one-time code to sign in.
        </Text>

        {/* Input row */}
        <View style={[s.inputRow, { backgroundColor: colors.surface, borderColor: isValid ? colors.primary : colors.border }]}>
          <View style={[s.prefix, { borderRightColor: colors.border }]}>
            <Text style={[s.prefixTxt, { color: colors.textPrimary }]}>🇺🇬  +256</Text>
          </View>
          {Platform.OS === 'web' ? (
            <input
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
              placeholder="7XXXXXXXX"
              inputMode="numeric"
              autoFocus
              style={{
                flex: 1, border: 'none', background: 'transparent',
                color: colors.textPrimary, fontSize: 20, fontWeight: 600,
                outline: 'none', padding: '0 16px', fontFamily: 'inherit',
                letterSpacing: 1,
              }}
            />
          ) : (
            <Text style={[s.nativeInput, { color: colors.textPrimary }]}>{phone || '7XXXXXXXX'}</Text>
          )}
        </View>

        <Text style={[s.hint, { color: colors.textHint }]}>
          Uganda numbers only (+256). Enter 9 digits after the prefix.
        </Text>

        <TouchableOpacity
          style={[s.btn, { backgroundColor: colors.primary, opacity: !isValid || loading ? 0.45 : 1 }]}
          onPress={handleSend}
          disabled={!isValid || loading}
          activeOpacity={0.87}
        >
          <Text style={s.btnTxt}>{loading ? 'Sending...' : 'Send Code →'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:      { flex: 1, alignItems: 'center' },
  phone:     { flex: 1, width: '100%', paddingHorizontal: 24, paddingTop: 16 },
  back:      { marginBottom: 36 },
  backTxt:   { fontSize: 22, fontWeight: '700' },
  heading:   { fontSize: 28, fontWeight: '900', marginBottom: 10, letterSpacing: -0.5 },
  sub:       { fontSize: 15, lineHeight: 22, marginBottom: 32 },
  inputRow:  { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderRadius: 14, height: 60, overflow: 'hidden', marginBottom: 12 },
  prefix:    { paddingHorizontal: 14, height: '100%', justifyContent: 'center', borderRightWidth: 1 },
  prefixTxt: { fontSize: 16, fontWeight: '700' },
  nativeInput:{ flex: 1, fontSize: 20, fontWeight: '600', paddingHorizontal: 16, letterSpacing: 1 },
  hint:      { fontSize: 12, marginBottom: 28, lineHeight: 18 },
  btn:       { borderRadius: 14, paddingVertical: 17, alignItems: 'center' },
  btnTxt:    { color: '#fff', fontSize: 17, fontWeight: '800' },
})
