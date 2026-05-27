import React, { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore from '../../store/themeStore'
import Button from '../../components/common/Button'
import useAuthStore from '../../store/authStore'

const LEN = 6
const RESEND = 30

export default function OtpScreen({ navigation, route }) {
  const { phone } = route.params
  const { colors } = useThemeStore()
  const [digits, setDigits] = useState(Array(LEN).fill(''))
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(RESEND)
  const refs = useRef([])
  const { verifyOtp, sendOtp } = useAuthStore()

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
      const { isNewUser } = await verifyOtp(phone, code)
      if (isNewUser) navigation.replace('ProfileSetup')
      else navigation.reset({ index: 0, routes: [{ name: 'ProfileSetup' }] })
    } catch (e) {
      Alert.alert('Wrong code', e.message)
      setDigits(Array(LEN).fill(''))
      refs.current[0]?.focus()
    } finally { setLoading(false) }
  }

  async function handleResend() {
    if (timer > 0) return
    try { await sendOtp(phone); setTimer(RESEND) } catch {}
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <TouchableOpacity style={{ marginBottom: 32 }} onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Enter the code</Text>
        <Text style={styles.sub}>Sent to <Text style={styles.phone}>{phone}</Text></Text>
        <View style={styles.boxes}>
          {digits.map((d, i) => (
            <TextInput key={i} ref={el => (refs.current[i] = el)}
              style={[styles.box, d && styles.boxFilled]}
              value={d} onChangeText={v => handleDigit(i, v)}
              keyboardType="number-pad" maxLength={LEN} selectTextOnFocus autoFocus={i === 0} />
          ))}
        </View>
        <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
          <Text style={[styles.resend, timer > 0 && styles.resendOff]}>
            {timer > 0 ? `Resend code in ${timer}s` : 'Resend code'}
          </Text>
        </TouchableOpacity>
        <Button label="Verify" onPress={handleVerify} loading={loading} disabled={digits.every(d => d === '')} size="lg" style={{ marginTop: 8 }} />
        <Text style={styles.devNote}>Dev: any 6-digit code works</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingTop: 16 },
  back: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  heading: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, marginBottom: 10, letterSpacing: -0.5 },
  sub: { fontSize: 15, color: colors.textSecondary, marginBottom: 36 },
  phone: { color: colors.textPrimary, fontWeight: '700' },
  boxes: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  box: { width: 48, height: 58, borderWidth: 2, borderColor: colors.border, borderRadius: 12, textAlign: 'center', fontSize: 24, fontWeight: '700', color: colors.textPrimary, backgroundColor: colors.surface },
  boxFilled: { borderColor: colors.primary, backgroundColor: colors.primaryFaint },
  resend: { fontSize: 14, color: colors.primary, fontWeight: '600', textAlign: 'center', marginBottom: 24 },
  resendOff: { color: colors.textHint },
  devNote: { textAlign: 'center', marginTop: 20, fontSize: 12, color: colors.textHint },
})
