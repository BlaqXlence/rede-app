import React, { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore from '../../store/themeStore'
import useAuthStore from '../../store/authStore'

const LEN = 6
const RESEND_SEC = 30

export default function OtpScreen({ navigation, route }) {
  const { phone }  = route.params
  const { colors } = useThemeStore()
  const { verifyOtp, sendOtp } = useAuthStore()

  const [digits, setDigits]   = useState(Array(LEN).fill(''))
  const [loading, setLoading] = useState(false)
  const [timer, setTimer]     = useState(RESEND_SEC)
  const refs = useRef([])

  useEffect(() => {
    if (timer <= 0) return
    const t = setInterval(() => setTimer(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [timer])

  function handleDigit(i, v) {
    const cleaned = v.replace(/\D/g, '')
    if (!cleaned && !v) {
      const next = [...digits]; next[i] = ''; setDigits(next)
      if (i > 0) refs.current[i - 1]?.focus()
      return
    }
    if (cleaned.length > 1) {
      const pasted = cleaned.slice(0, LEN).split('')
      const next = [...digits]
      pasted.forEach((d, idx) => { if (idx < LEN) next[idx] = d })
      setDigits(next)
      refs.current[Math.min(pasted.length - 1, LEN - 1)]?.focus()
      return
    }
    const next = [...digits]; next[i] = cleaned; setDigits(next)
    if (cleaned && i < LEN - 1) refs.current[i + 1]?.focus()
  }

  async function handleVerify() {
    const code = digits.join('')
    if (code.length < LEN) return
    setLoading(true)
    try {
      // verifyOtp sets isAuthenticated = true
      // RootNavigator automatically switches to MainNavigator
      // For new users we push ProfileSetup BEFORE that switch happens
      const result = await verifyOtp(phone, code)
      // Navigation to ProfileSetup happens inside MainNavigator now
      // isAuthenticated triggers the switch — no manual navigation needed
    } catch (e) {
      Alert.alert('Wrong code', e.message)
      setDigits(Array(LEN).fill(''))
      refs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (timer > 0) return
    try { await sendOtp(phone); setTimer(RESEND_SEC) } catch {}
  }

  const complete = digits.every(d => d !== '')

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <TouchableOpacity style={{ marginBottom: 32 }} onPress={() => navigation.goBack()}>
          <Text style={[styles.back, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>Enter the code</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          Sent to <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{phone}</Text>
        </Text>
        <View style={styles.boxes}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={el => (refs.current[i] = el)}
              style={[styles.box, { backgroundColor: colors.surface, borderColor: d ? colors.primary : colors.border, color: colors.textPrimary }]}
              value={d}
              onChangeText={v => handleDigit(i, v)}
              keyboardType="number-pad"
              maxLength={LEN}
              selectTextOnFocus
              autoFocus={i === 0}
            />
          ))}
        </View>
        <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
          <Text style={[styles.resend, { color: timer > 0 ? colors.textHint : colors.primary }]}>
            {timer > 0 ? `Resend in ${timer}s` : 'Resend code'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary, opacity: (!complete || loading) ? 0.5 : 1 }]}
          onPress={handleVerify}
          disabled={!complete || loading}
          activeOpacity={0.85}
        >
          <Text style={styles.btnTxt}>{loading ? 'Verifying...' : 'Verify'}</Text>
        </TouchableOpacity>
        <Text style={[styles.devNote, { color: colors.textHint }]}>
          Check Railway logs for your OTP code
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 24, paddingTop: 16 },
  back: { fontSize: 16, fontWeight: '600' },
  heading: { fontSize: 28, fontWeight: '800', marginBottom: 10, letterSpacing: -0.5 },
  sub: { fontSize: 15, marginBottom: 36 },
  boxes: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  box: { width: 46, height: 56, borderWidth: 2, borderRadius: 12, textAlign: 'center', fontSize: 24, fontWeight: '700' },
  resend: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 24 },
  btn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  btnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  devNote: { textAlign: 'center', marginTop: 16, fontSize: 12 },
})
