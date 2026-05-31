/**
 * OtpScreen - works perfectly on Android, iOS and web
 * Single hidden TextInput captures input, visual boxes show digits
 * This is the standard pattern used by WhatsApp, Twitter, etc
 */
import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Dimensions, TextInput, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore from '../../store/themeStore'
import useAuthStore  from '../../store/authStore'

const LEN        = 6
const WAIT_TIMES = [60, 120, 180]
const { width }  = Dimensions.get('window')
const MAX_W      = Math.min(width, 500)
const PAD        = 24
const BOX_SIZE   = Math.floor((MAX_W - PAD * 2 - 8 * 5) / 6)

export default function OtpScreen({ navigation, route }) {
  const { phone }  = route.params
  const { colors } = useThemeStore()
  const { verifyOtp, sendOtp } = useAuthStore()

  const [code,    setCode]    = useState('')
  const [loading, setLoading] = useState(false)
  const [timer,   setTimer]   = useState(WAIT_TIMES[0])
  const [attempt, setAttempt] = useState(0)
  const [sending, setSending] = useState(false)
  const inputRef  = useRef(null)
  const timerRef  = useRef(null)

  useEffect(() => {
    startTimer(WAIT_TIMES[0])
    // Auto focus
    setTimeout(() => inputRef.current?.focus(), 400)
    return () => clearInterval(timerRef.current)
  }, [])

  function startTimer(s) {
    clearInterval(timerRef.current)
    setTimer(s)
    timerRef.current = setInterval(() => {
      setTimer(p => { if (p <= 1) { clearInterval(timerRef.current); return 0 } return p - 1 })
    }, 1000)
  }

  function fmt(s) {
    return s >= 60 ? `${Math.floor(s/60)}m ${s % 60}s` : `${s}s`
  }

  async function verify(codeToVerify) {
    const c = codeToVerify || code
    if (c.length < LEN) return
    setLoading(true)
    try {
      const { isNewUser } = await verifyOtp(phone, c)
      const { user } = require('../../store/authStore').default.getState()
      const needsSetup = isNewUser || !user?.profileComplete || !user?.nickname
      if (needsSetup) navigation.replace('ProfileSetup')
      else navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] })
    } catch {
      Alert.alert('Wrong code', 'Check the code and try again.')
      setCode('')
    } finally { setLoading(false) }
  }

  async function resend() {
    if (timer > 0 || sending) return
    setSending(true)
    try {
      await sendOtp(phone)
      const n = Math.min(attempt + 1, WAIT_TIMES.length - 1)
      setAttempt(n)
      startTimer(WAIT_TIMES[n])
      setCode('')
      setTimeout(() => inputRef.current?.focus(), 100)
    } catch (err) {
      Alert.alert('Error', err.message)
    } finally { setSending(false) }
  }

  const digits = code.split('').concat(Array(LEN).fill('')).slice(0, LEN)

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top','bottom']}>
      <View style={[s.container, { maxWidth: MAX_W }]}>

        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={[s.backTxt, { color: colors.primary }]}>←</Text>
        </TouchableOpacity>

        <Text style={[s.h1, { color: colors.textPrimary }]}>Enter the code</Text>
        <Text style={[s.sub, { color: colors.textSecondary }]}>
          Sent to <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{phone}</Text>
        </Text>
        <Text style={[s.hint, { color: colors.textHint }]}>
          SMS can take up to 2 minutes. Check your messages.
        </Text>

        {/* Invisible input captures all typing */}
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={v => {
            const clean = v.replace(/\D/g, '').slice(0, LEN)
            setCode(clean)
            if (clean.length === LEN) verify(clean)
          }}
          keyboardType="number-pad"
          maxLength={LEN}
          style={s.hidden}
          autoFocus
          caretHidden
        />

        {/* Visual boxes — tap any to focus the hidden input */}
        <TouchableOpacity
          style={s.boxes}
          onPress={() => inputRef.current?.focus()}
          activeOpacity={1}
        >
          {digits.map((d, i) => (
            <View
              key={i}
              style={[
                s.box,
                {
                  borderColor:     i === code.length ? colors.primary : (d ? colors.primary : colors.border),
                  backgroundColor: d ? colors.primaryFaint : colors.surface,
                  // Active box gets a highlighted border
                  borderWidth: i === code.length ? 2.5 : 2,
                }
              ]}
            >
              <Text style={[s.digit, { color: colors.textPrimary }]}>{d}</Text>
            </View>
          ))}
        </TouchableOpacity>

        {/* Resend */}
        <TouchableOpacity onPress={resend} disabled={timer > 0 || sending} style={s.resendBtn}>
          <Text style={[s.resendTxt, { color: timer > 0 || sending ? colors.textHint : colors.primary }]}>
            {sending ? 'Sending...' : timer > 0 ? `Resend in ${fmt(timer)}` : 'Resend code'}
          </Text>
        </TouchableOpacity>

        {timer > 0 && attempt === 0 && (
          <Text style={[s.helpTxt, { color: colors.textHint }]}>
            Check your SMS inbox. Code may take a moment.
          </Text>
        )}
        {timer > 0 && attempt > 0 && (
          <Text style={[s.helpTxt, { color: colors.textHint }]}>
            Still nothing? Make sure you have signal and the number is correct.
          </Text>
        )}

        {/* Verify button */}
        <TouchableOpacity
          style={[s.btn, { backgroundColor: code.length === LEN && !loading ? colors.primary : colors.border }]}
          onPress={() => verify()}
          disabled={code.length < LEN || loading}
          activeOpacity={0.87}
        >
          <Text style={s.btnTxt}>{loading ? 'Verifying...' : 'Verify →'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={s.wrongBtn}>
          <Text style={[s.wrongTxt, { color: colors.textHint }]}>Wrong number? Go back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:      { flex: 1, alignItems: 'center' },
  container: { flex: 1, width: '100%', paddingHorizontal: PAD },
  back:      { paddingTop: 16, marginBottom: 32 },
  backTxt:   { fontSize: 24, fontWeight: '700' },
  h1:        { fontSize: 28, fontWeight: '900', marginBottom: 8, letterSpacing: -0.5 },
  sub:       { fontSize: 15, marginBottom: 6 },
  hint:      { fontSize: 13, lineHeight: 18, marginBottom: 32 },

  hidden: {
    position: 'absolute',
    width: 1, height: 1,
    opacity: 0,
  },

  boxes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  box: {
    width:        BOX_SIZE,
    height:       BOX_SIZE + 8,
    borderRadius: 12,
    borderWidth:  2,
    alignItems:   'center',
    justifyContent: 'center',
  },
  digit: {
    fontSize:   26,
    fontWeight: '800',
  },

  resendBtn: { alignItems: 'center', paddingVertical: 8, marginBottom: 6 },
  resendTxt: { fontSize: 14, fontWeight: '600' },
  helpTxt:   { fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 16, paddingHorizontal: 8 },

  btn:    { borderRadius: 14, paddingVertical: 17, alignItems: 'center', marginTop: 8, marginBottom: 16 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },

  wrongBtn:  { alignItems: 'center', paddingVertical: 8 },
  wrongTxt:  { fontSize: 13, textDecorationLine: 'underline' },
})
