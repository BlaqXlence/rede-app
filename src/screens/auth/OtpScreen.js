/**
 * OtpScreen.js — fixed digit boxes on all platforms
 */
import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Platform, Dimensions, TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore from '../../store/themeStore'
import useAuthStore  from '../../store/authStore'

const LEN  = 6
const { width } = Dimensions.get('window')
const MAX_W = Math.min(width, 500)
const WAIT_TIMES = [60, 120, 180]

export default function OtpScreen({ navigation, route }) {
  const { phone }  = route.params
  const { colors } = useThemeStore()
  const { verifyOtp, sendOtp } = useAuthStore()

  const [digits,  setDigits]  = useState(Array(LEN).fill(''))
  const [loading, setLoading] = useState(false)
  const [timer,   setTimer]   = useState(WAIT_TIMES[0])
  const [attempt, setAttempt] = useState(0)
  const [sending, setSending] = useState(false)
  const refs     = useRef([])
  const timerRef = useRef(null)

  useEffect(() => {
    startTimer(WAIT_TIMES[0])
    return () => clearInterval(timerRef.current)
  }, [])

  function startTimer(seconds) {
    clearInterval(timerRef.current)
    setTimer(seconds)
    timerRef.current = setInterval(() => {
      setTimer(s => {
        if (s <= 1) { clearInterval(timerRef.current); return 0 }
        return s - 1
      })
    }, 1000)
  }

  function formatTimer(s) {
    if (s >= 60) return `${Math.floor(s/60)}m ${s % 60}s`
    return `${s}s`
  }

  function handleDigit(i, v) {
    // Strip non-numeric
    const c = v.replace(/\D/g, '')

    // Handle paste of full code
    if (c.length > 1) {
      const pasted = c.slice(0, LEN).split('')
      const n = [...digits]
      pasted.forEach((d, x) => { if (x < LEN) n[x] = d })
      setDigits(n)
      refs.current[Math.min(pasted.length - 1, LEN - 1)]?.focus()
      return
    }

    // Single digit
    const n = [...digits]
    n[i] = c
    setDigits(n)
    if (c && i < LEN - 1) {
      refs.current[i + 1]?.focus()
    }
  }

  function handleKeyPress(i, e) {
    if (e.nativeEvent.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus()
    }
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
      Alert.alert('Wrong code', 'Check the code and try again.')
      setDigits(Array(LEN).fill(''))
      refs.current[0]?.focus()
    } finally { setLoading(false) }
  }

  async function handleResend() {
    if (timer > 0 || sending) return
    setSending(true)
    try {
      await sendOtp(phone)
      const next = Math.min(attempt + 1, WAIT_TIMES.length - 1)
      setAttempt(next)
      startTimer(WAIT_TIMES[next])
      setDigits(Array(LEN).fill(''))
      setTimeout(() => refs.current[0]?.focus(), 100)
    } catch (err) {
      Alert.alert('Could not resend', err.message)
    } finally { setSending(false) }
  }

  const complete = digits.every(d => d !== '')

  const resendLabel = sending ? 'Sending...'
    : timer > 0 ? `Resend in ${formatTimer(timer)}`
    : 'Resend code'

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top','bottom']}>
      <View style={[s.phone, { maxWidth: MAX_W }]}>

        {/* Back */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={[s.backTxt, { color: colors.primary }]}>←</Text>
        </TouchableOpacity>

        {/* Heading */}
        <Text style={[s.heading, { color: colors.textPrimary }]}>Enter the code</Text>
        <Text style={[s.sub, { color: colors.textSecondary }]}>
          Sent via SMS to{' '}
          <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{phone}</Text>
        </Text>
        <Text style={[s.hint, { color: colors.textHint }]}>
          SMS can take up to 2 minutes on slow networks.
        </Text>

        {/* ── 6 digit boxes ── */}
        <View style={s.row}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={el => (refs.current[i] = el)}
              style={[
                s.box,
                {
                  borderColor:     d ? colors.primary : colors.border,
                  backgroundColor: d ? colors.primaryFaint : colors.surface,
                  color:           colors.textPrimary,
                }
              ]}
              value={d}
              onChangeText={v => handleDigit(i, v)}
              onKeyPress={e => handleKeyPress(i, e)}
              keyboardType="number-pad"
              maxLength={LEN}
              textAlign="center"
              selectTextOnFocus
              autoFocus={i === 0}
              selectionColor={colors.primary}
              underlineColorAndroid="transparent"
              caretHidden
            />
          ))}
        </View>

        {/* Resend */}
        <TouchableOpacity
          onPress={handleResend}
          disabled={timer > 0 || sending}
          style={s.resendBtn}
        >
          <Text style={[s.resendTxt, { color: timer > 0 || sending ? colors.textHint : colors.primary }]}>
            {resendLabel}
          </Text>
        </TouchableOpacity>

        {timer > 0 && (
          <Text style={[s.helpTxt, { color: colors.textHint }]}>
            {attempt === 0
              ? 'Check your SMS inbox. Code may take a moment to arrive.'
              : 'Still nothing? Make sure you have network signal.'}
          </Text>
        )}

        {/* Verify */}
        <TouchableOpacity
          style={[s.verifyBtn, {
            backgroundColor: complete && !loading ? colors.primary : colors.border,
          }]}
          onPress={handleVerify}
          disabled={!complete || loading}
          activeOpacity={0.87}
        >
          <Text style={s.verifyTxt}>
            {loading ? 'Verifying...' : 'Verify →'}
          </Text>
        </TouchableOpacity>

        {/* Wrong number */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.wrongBtn}>
          <Text style={[s.wrongTxt, { color: colors.textHint }]}>Wrong number? Go back</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  )
}

const BOX_SIZE = Math.min((Math.min(375, 500) - 48 - 40) / 6, 52)

const s = StyleSheet.create({
  safe:    { flex: 1, alignItems: 'center' },
  phone:   { flex: 1, width: '100%', paddingHorizontal: 24, paddingTop: 16 },

  backBtn: { marginBottom: 32 },
  backTxt: { fontSize: 24, fontWeight: '700' },

  heading: { fontSize: 28, fontWeight: '900', marginBottom: 8, letterSpacing: -0.5 },
  sub:     { fontSize: 15, marginBottom: 6 },
  hint:    { fontSize: 13, lineHeight: 18, marginBottom: 32 },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  box: {
    flex: 1,
    height: 58,
    borderWidth: 2,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },

  resendBtn: { marginBottom: 10, alignItems: 'center' },
  resendTxt: { fontSize: 14, fontWeight: '600' },

  helpTxt: {
    fontSize: 12, textAlign: 'center',
    lineHeight: 18, marginBottom: 20,
    paddingHorizontal: 8,
  },

  verifyBtn: {
    borderRadius: 14, paddingVertical: 17,
    alignItems: 'center', marginBottom: 16,
    marginTop: 8,
  },
  verifyTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },

  wrongBtn:  { alignItems: 'center' },
  wrongTxt:  { fontSize: 13, textDecorationLine: 'underline' },
})
