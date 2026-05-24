import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import colors from '../../constants/colors'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import useAuthStore from '../../store/authStore'
import { validatePhone, normalizePhone } from '../../utils/validators'

export default function PhoneScreen({ navigation }) {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const { sendOtp } = useAuthStore()

  async function handleContinue() {
    const err = validatePhone(phone)
    if (err) { setError(err); return }
    setLoading(true)
    try {
      const normalized = normalizePhone(phone)
      await sendOtp(normalized)
      navigation.navigate('Otp', { phone: normalized })
    } catch (e) {
      Alert.alert('Failed', e.message || 'Please try again.')
    } finally {
      setLoading(false) }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.heading}>Your phone number</Text>
          <Text style={styles.sub}>We'll send a verification code via SMS.</Text>
          <View style={styles.phoneRow}>
            <View style={styles.code}>
              <Text style={styles.flag}>🇺🇬</Text>
              <Text style={styles.codeText}>+256</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Input value={phone} onChangeText={v => { setPhone(v); if (error) setError(null) }}
                placeholder="771 234 567" keyboardType="phone-pad"
                autoComplete="tel" maxLength={12} error={error} />
            </View>
          </View>
          <Text style={styles.hint}>MTN (076, 077, 078) · Airtel (070, 075)</Text>
          <Button label="Send Code" onPress={handleContinue} loading={loading} disabled={phone.length < 9} size="lg" style={{ marginTop: 8 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingTop: 16 },
  back: { marginBottom: 32 },
  backText: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  heading: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, marginBottom: 10, letterSpacing: -0.5 },
  sub: { fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: 32 },
  phoneRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  code: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, height: 54, gap: 6 },
  flag: { fontSize: 20 },
  codeText: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  hint: { fontSize: 13, color: colors.textHint, marginTop: -8, marginBottom: 24 },
})
