import React, { useState, useRef, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore from '../../store/themeStore'
import useAuthStore  from '../../store/authStore'

const LEN   = 6
const WAIT  = 60  // seconds before resend allowed
const { width } = Dimensions.get('window')
const MAX_W = Math.min(width, 500)

export default function OtpScreen({ navigation, route }) {
  const { phone }  = route.params
  const { colors } = useThemeStore()
  const { verifyOtp, sendOtp } = useAuthStore()

  const [digits,  setDigits]  = useState(Array(LEN).fill(''))
  const [loading, setLoading] = useState(false)
  const [timer,   setTimer]   = useState(WAIT)
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
      const p = c.slice(0, LEN).split('')
      const n = [...digits]
      p.forEach((d, x) => { if (x < LEN) n[x] = d })
      setDigits(n)
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
      else navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] })
    } catch (e) {
      Alert.alert('Wrong code', e.message || 'Check the code and try again.')
      setDigits(Array(LEN).fill(''))
      refs.current[0]?.focus()
    } finally { setLoading(false) }
  }

  async function handleResend() {
    if (timer > 0) return
    try { await sendOtp(phone); setTimer(WAIT) } catch {}
  }

  const complete = digits.every(d => d !== '')

  if (Platform.OS === 'web') {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: colors.background,
        display: 'flex', justifyContent: 'center',
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}>
        <div style={{ width: '100%', maxWidth: MAX_W, padding: '0 24px', paddingTop: 48 }}>

          <button onClick={() => navigation.goBack()} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: colors.primary, fontSize: 22, fontWeight: 700,
            padding: 0, marginBottom: 36,
          }}>←</button>

          <h1 style={{ color: colors.textPrimary, fontSize: 28, fontWeight: 900, marginBottom: 10, letterSpacing: -0.5 }}>
            Enter the code
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: 15, marginBottom: 36 }}>
            Sent to <strong style={{ color: colors.textPrimary }}>{phone}</strong>
          </p>

          {/* 6 boxes */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => { refs.current[i] = el }}
                value={d}
                onChange={e => handleDigit(i, e.target.value)}
                maxLength={6}
                inputMode="numeric"
                autoFocus={i === 0}
                style={{
                  flex: 1, height: 60, textAlign: 'center',
                  fontSize: 24, fontWeight: 700,
                  backgroundColor: d ? colors.primaryFaint : colors.surface,
                  border: `2px solid ${d ? colors.primary : colors.border}`,
                  borderRadius: 12, color: colors.textPrimary,
                  outline: 'none', fontFamily: 'inherit',
                  transition: 'border-color .15s',
                }}
              />
            ))}
          </div>

          <button onClick={handleResend} disabled={timer > 0} style={{
            background: 'none', border: 'none', cursor: timer > 0 ? 'default' : 'pointer',
            color: timer > 0 ? colors.textHint : colors.primary,
            fontSize: 14, fontWeight: 600, marginBottom: 24, padding: 0, display: 'block', width: '100%',
          }}>
            {timer > 0 ? `Resend code in ${timer}s` : 'Resend code'}
          </button>

          <button onClick={handleVerify} disabled={!complete || loading} style={{
            width: '100%', backgroundColor: colors.primary,
            color: '#fff', border: 'none', borderRadius: 14,
            padding: '16px', fontSize: 16, fontWeight: 800,
            cursor: !complete || loading ? 'not-allowed' : 'pointer',
            opacity: !complete || loading ? 0.5 : 1,
            fontFamily: 'inherit',
          }}>
            {loading ? 'Verifying...' : 'Verify →'}
          </button>

          <p style={{ color: colors.textHint, fontSize: 12, textAlign: 'center', marginTop: 20 }}>
            Check Railway logs if SMS is not working yet
          </p>
        </div>
      </div>
    )
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[s.phone, { maxWidth: MAX_W }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={[s.backTxt, { color: colors.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[s.heading, { color: colors.textPrimary }]}>Enter the code</Text>
        <Text style={[s.sub, { color: colors.textSecondary }]}>
          Sent to <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{phone}</Text>
        </Text>
        <View style={s.boxes}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { refs.current[i] = el }}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              maxLength={6}
              inputMode="numeric"
              autoFocus={i === 0}
              style={{
                width: 48, height: 58, textAlign: 'center', fontSize: 24, fontWeight: 700,
                backgroundColor: d ? colors.primaryFaint : colors.surface,
                border: `2px solid ${d ? colors.primary : colors.border}`,
                borderRadius: 12, color: colors.textPrimary,
                outline: 'none', fontFamily: 'inherit',
              }}
            />
          ))}
        </View>
        <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
          <Text style={[s.resend, { color: timer > 0 ? colors.textHint : colors.primary }]}>
            {timer > 0 ? `Resend in ${timer}s` : 'Resend code'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.btn, { backgroundColor: colors.primary, opacity: !complete || loading ? 0.5 : 1 }]}
          onPress={handleVerify} disabled={!complete || loading}
        >
          <Text style={s.btnTxt}>{loading ? 'Verifying...' : 'Verify →'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:    { flex: 1, alignItems: 'center' },
  phone:   { flex: 1, width: '100%', paddingHorizontal: 24, paddingTop: 16 },
  back:    { marginBottom: 36 },
  backTxt: { fontSize: 22, fontWeight: '700' },
  heading: { fontSize: 28, fontWeight: '900', marginBottom: 10, letterSpacing: -0.5 },
  sub:     { fontSize: 15, marginBottom: 36 },
  boxes:   { flexDirection: 'row', gap: 8, marginBottom: 24 },
  resend:  { fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 24 },
  btn:     { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnTxt:  { color: '#fff', fontSize: 16, fontWeight: '800' },
})
