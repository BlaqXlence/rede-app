import React, { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore from '../../store/themeStore'
import useAuthStore  from '../../store/authStore'

const LEN = 6, RESEND = 30

export default function OtpScreen({ navigation, route }) {
  const { phone }  = route.params
  const { colors } = useThemeStore()
  const { verifyOtp, sendOtp } = useAuthStore()
  const [digits, setDigits] = useState(Array(LEN).fill(''))
  const [loading, setLoading] = useState(false)
  const [timer, setTimer]     = useState(RESEND)
  const refs = useRef([])

  useEffect(() => {
    if (timer <= 0) return
    const t = setInterval(() => setTimer(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [timer])

  function handleDigit(i, v) {
    const c = v.replace(/\D/g, '')
    if (!c && !v) {
      const n = [...digits]; n[i] = ''; setDigits(n)
      if (i > 0) refs.current[i - 1]?.focus(); return
    }
    if (c.length > 1) {
      const p = c.slice(0, LEN).split(''), n = [...digits]
      p.forEach((d, x) => { if (x < LEN) n[x] = d }); setDigits(n)
      refs.current[Math.min(p.length - 1, LEN - 1)]?.focus(); return
    }
    const n = [...digits]; n[i] = c; setDigits(n)
    if (c && i < LEN - 1) refs.current[i + 1]?.focus()
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
      setDigits(Array(LEN).fill('')); refs.current[0]?.focus()
    } finally { setLoading(false) }
  }

  const complete = digits.every(d => d !== '')

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <View style={s.content}>
        <TouchableOpacity style={{ marginBottom: 32 }} onPress={() => navigation.goBack()}>
          <Text style={[s.back, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[s.heading, { color: colors.textPrimary }]}>Enter the code</Text>
        <Text style={[s.sub, { color: colors.textSecondary }]}>
          Sent to <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{phone}</Text>
        </Text>
        <View style={s.boxes}>
          {digits.map((d, i) => (
            <TextInput key={i} ref={el => (refs.current[i] = el)}
              style={[s.box, {
                borderColor:     d ? colors.primary : colors.border,
                backgroundColor: d ? colors.primaryFaint : colors.surface,
                color:           colors.textPrimary,
              }]}
              value={d} onChangeText={v => handleDigit(i, v)}
              keyboardType="number-pad" maxLength={LEN}
              selectTextOnFocus autoFocus={i === 0}
            />
          ))}
        </View>
        <TouchableOpacity onPress={() => { if (timer <= 0) { sendOtp(phone).catch(()=>{}); setTimer(RESEND) } }}>
          <Text style={[s.resend, { color: timer > 0 ? colors.textHint : colors.primary }]}>
            {timer > 0 ? `Resend in ${timer}s` : 'Resend code'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.btn, { backgroundColor: colors.primary, opacity: (!complete || loading) ? 0.5 : 1 }]}
          onPress={handleVerify} disabled={!complete || loading} activeOpacity={0.85}
        >
          <Text style={s.btnTxt}>{loading ? 'Verifying...' : 'Verify'}</Text>
        </TouchableOpacity>
        <Text style={[s.note, { color: colors.textHint }]}>Check Railway logs for your code</Text>
      </View>
    </SafeAreaView>
  )
}

// Only layout — no colors in StyleSheet
const s = StyleSheet.create({
  safe:    { flex: 1 },
  content: { padding: 24, paddingTop: 16 },
  back:    { fontSize: 16, fontWeight: '600' },
  heading: { fontSize: 28, fontWeight: '800', marginBottom: 10, letterSpacing: -0.5 },
  sub:     { fontSize: 15, marginBottom: 36 },
  boxes:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  box:     { width: 48, height: 58, borderWidth: 2, borderRadius: 12, textAlign: 'center', fontSize: 24, fontWeight: '700' },
  resend:  { fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 24 },
  btn:     { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  btnTxt:  { color: '#fff', fontSize: 15, fontWeight: '700' },
  note:    { textAlign: 'center', marginTop: 20, fontSize: 12 },
})
