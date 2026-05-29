import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Dimensions, TextInput, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore from '../../store/themeStore'
import useAuthStore  from '../../store/authStore'

const LEN        = 6
const WAIT_TIMES = [60, 120, 180]
const SCREEN_W   = Dimensions.get('window').width
const MAX_W      = Math.min(SCREEN_W, 500)
// Fixed box width — never flex, always exact pixels
const PAD        = 24
const GAP        = 8
const BOX_W      = Math.floor((MAX_W - PAD * 2 - GAP * (LEN - 1)) / LEN)
const BOX_H      = Math.floor(BOX_W * 1.15)

export default function OtpScreen({ navigation, route }) {
  const { phone }  = route.params
  const { colors } = useThemeStore()
  const { verifyOtp, sendOtp } = useAuthStore()

  const [digits,  setDigits]  = useState(Array(LEN).fill(''))
  const [loading, setLoading] = useState(false)
  const [timer,   setTimer]   = useState(WAIT_TIMES[0])
  const [attempt, setAttempt] = useState(0)
  const [sending, setSending] = useState(false)
  const inputs   = useRef([])
  const timerRef = useRef(null)

  useEffect(() => {
    tick(WAIT_TIMES[0])
    return () => clearInterval(timerRef.current)
  }, [])

  function tick(s) {
    clearInterval(timerRef.current)
    setTimer(s)
    timerRef.current = setInterval(() => {
      setTimer(p => { if (p <= 1) { clearInterval(timerRef.current); return 0 } return p - 1 })
    }, 1000)
  }

  function fmt(s) { return s >= 60 ? `${Math.floor(s/60)}m ${s%60}s` : `${s}s` }

  function onChange(i, raw) {
    const val = raw.replace(/\D/g, '')
    if (val.length > 1) {
      // paste
      const arr = val.slice(0, LEN).split('')
      const next = Array(LEN).fill('')
      arr.forEach((c, x) => { next[x] = c })
      setDigits(next)
      inputs.current[Math.min(arr.length - 1, LEN - 1)]?.focus()
      return
    }
    const next = [...digits]
    next[i] = val
    setDigits(next)
    if (val && i < LEN - 1) inputs.current[i + 1]?.focus()
  }

  function onKeyPress(i, key) {
    if (key === 'Backspace' && !digits[i] && i > 0) {
      const next = [...digits]; next[i-1] = ''
      setDigits(next)
      inputs.current[i - 1]?.focus()
    }
  }

  async function verify() {
    const code = digits.join('')
    if (code.length < LEN) return
    setLoading(true)
    try {
      const { isNewUser } = await verifyOtp(phone, code)
      if (isNewUser) navigation.replace('ProfileSetup')
      else navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] })
    } catch {
      Alert.alert('Wrong code', 'Check the code and try again.')
      setDigits(Array(LEN).fill(''))
      inputs.current[0]?.focus()
    } finally { setLoading(false) }
  }

  async function resend() {
    if (timer > 0 || sending) return
    setSending(true)
    try {
      await sendOtp(phone)
      const n = Math.min(attempt + 1, WAIT_TIMES.length - 1)
      setAttempt(n); tick(WAIT_TIMES[n])
      setDigits(Array(LEN).fill(''))
      setTimeout(() => inputs.current[0]?.focus(), 100)
    } catch (err) { Alert.alert('Error', err.message) }
    finally { setSending(false) }
  }

  const complete = digits.every(d => d !== '')

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top','bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[s.inner, { maxWidth: MAX_W, alignSelf: 'center', width: '100%' }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
            <Text style={[s.backTxt, { color: colors.primary }]}>←</Text>
          </TouchableOpacity>

          <Text style={[s.h1, { color: colors.textPrimary }]}>Enter the code</Text>
          <Text style={[s.sub, { color: colors.textSecondary }]}>
            Sent via SMS to{' '}
            <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{phone}</Text>
          </Text>
          <Text style={[s.hint, { color: colors.textHint }]}>
            Can take up to 2 minutes on slow networks.
          </Text>

          {/* ── 6 boxes — FIXED pixel width, never flex ── */}
          <View style={s.boxRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={el => (inputs.current[i] = el)}
                style={[
                  s.box,
                  {
                    width:           BOX_W,
                    height:          BOX_H,
                    borderColor:     d ? colors.primary : colors.border,
                    backgroundColor: d ? colors.primaryFaint : colors.surface,
                    color:           colors.textPrimary,
                  }
                ]}
                value={d}
                onChangeText={v => onChange(i, v)}
                onKeyPress={({ nativeEvent }) => onKeyPress(i, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={6}
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
          <TouchableOpacity onPress={resend} disabled={timer > 0 || sending} style={s.resendBtn}>
            <Text style={[s.resendTxt, { color: timer > 0 || sending ? colors.textHint : colors.primary }]}>
              {sending ? 'Sending...' : timer > 0 ? `Resend in ${fmt(timer)}` : 'Resend code'}
            </Text>
          </TouchableOpacity>

          {timer > 0 && (
            <Text style={[s.helpTxt, { color: colors.textHint }]}>
              {attempt === 0
                ? 'Check your SMS inbox.'
                : 'Still nothing? Check network signal and number.'}
            </Text>
          )}

          {/* Verify */}
          <TouchableOpacity
            style={[s.btn, { backgroundColor: complete && !loading ? colors.primary : colors.border }]}
            onPress={verify}
            disabled={!complete || loading}
            activeOpacity={0.87}
          >
            <Text style={s.btnTxt}>{loading ? 'Verifying...' : 'Verify →'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={s.wrongBtn}>
            <Text style={[s.wrongTxt, { color: colors.textHint }]}>Wrong number? Go back</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  inner:  { paddingHorizontal: PAD, paddingTop: 16, paddingBottom: 40 },
  back:   { marginBottom: 32 },
  backTxt:{ fontSize: 24, fontWeight: '700' },
  h1:     { fontSize: 28, fontWeight: '900', marginBottom: 8, letterSpacing: -0.5 },
  sub:    { fontSize: 15, marginBottom: 6 },
  hint:   { fontSize: 13, lineHeight: 18, marginBottom: 32 },

  // Fixed-size boxes — the key fix
  boxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  box: {
    borderWidth:  2,
    borderRadius: 12,
    fontSize:     26,
    fontWeight:   '800',
  },

  resendBtn: { alignItems: 'center', paddingVertical: 8, marginBottom: 4 },
  resendTxt: { fontSize: 14, fontWeight: '600' },
  helpTxt:   { fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 16 },

  btn:    { borderRadius: 14, paddingVertical: 17, alignItems: 'center', marginTop: 8, marginBottom: 16 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  wrongBtn: { alignItems: 'center', paddingVertical: 8 },
  wrongTxt: { fontSize: 13, textDecorationLine: 'underline' },
})
