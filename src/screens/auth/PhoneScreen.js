import React, { useState, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Dimensions, TextInput, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native'
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
  const inputRef = useRef(null)

  const digits  = phone.replace(/\D/g, '')
  const isValid = digits.length === 9

  async function handleSend() {
    if (!isValid || loading) return
    setLoading(true)
    try {
      await sendOtp(`+256${digits}`)
      navigation.navigate('Otp', { phone: `+256${digits}` })
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not send code. Try again.')
    } finally { setLoading(false) }
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top','bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[s.inner, { maxWidth: MAX_W, alignSelf: 'center', width: '100%' }]}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
            <Text style={[s.backTxt, { color: colors.primary }]}>←</Text>
          </TouchableOpacity>

          <Text style={[s.heading, { color: colors.textPrimary }]}>Your phone number</Text>
          <Text style={[s.sub, { color: colors.textSecondary }]}>
            We'll send a one-time code to sign you in.
          </Text>

          {/* Phone input row */}
          <TouchableOpacity
            style={[s.inputRow, { backgroundColor: colors.surface, borderColor: isValid ? colors.primary : colors.border }]}
            onPress={() => inputRef.current?.focus()}
            activeOpacity={1}
          >
            <View style={[s.prefix, { borderRightColor: colors.border }]}>
              <Text style={[s.prefixTxt, { color: colors.textPrimary }]}>🇺🇬  +256</Text>
            </View>
            <TextInput
              ref={inputRef}
              style={[s.input, { color: colors.textPrimary }]}
              value={phone}
              onChangeText={v => setPhone(v.replace(/\D/g, '').slice(0, 9))}
              placeholder="7XXXXXXXX"
              placeholderTextColor={colors.textHint}
              keyboardType="phone-pad"
              maxLength={9}
              autoFocus
              selectionColor={colors.primary}
              underlineColorAndroid="transparent"
              onSubmitEditing={handleSend}
            />
          </TouchableOpacity>

          <Text style={[s.hint, { color: colors.textHint }]}>
            Uganda numbers only. Enter 9 digits after +256.
          </Text>

          <TouchableOpacity
            style={[s.btn, { backgroundColor: isValid && !loading ? colors.primary : colors.border }]}
            onPress={handleSend}
            disabled={!isValid || loading}
            activeOpacity={0.87}
          >
            <Text style={s.btnTxt}>{loading ? 'Sending...' : 'Send Code →'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:  { flex: 1 },
  inner: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  back:  { marginBottom: 32 },
  backTxt: { fontSize: 24, fontWeight: '700' },
  heading: { fontSize: 28, fontWeight: '900', marginBottom: 8, letterSpacing: -0.5 },
  sub:     { fontSize: 15, lineHeight: 22, marginBottom: 32 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 2, borderRadius: 14, height: 58,
    overflow: 'hidden', marginBottom: 12,
  },
  prefix: {
    paddingHorizontal: 14, height: '100%',
    justifyContent: 'center', borderRightWidth: 1,
  },
  prefixTxt: { fontSize: 15, fontWeight: '700' },
  input: {
    flex: 1, fontSize: 20, fontWeight: '600',
    paddingHorizontal: 14, letterSpacing: 2,
  },
  hint: { fontSize: 12, marginBottom: 28, lineHeight: 18 },
  btn:  { borderRadius: 14, paddingVertical: 17, alignItems: 'center' },
  btnTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
})
