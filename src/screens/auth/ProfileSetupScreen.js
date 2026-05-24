import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import colors from '../../constants/colors'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Avatar from '../../components/common/Avatar'
import useAuthStore from '../../store/authStore'
import { validateEmail } from '../../utils/validators'

export default function ProfileSetupScreen() {
  const { user, saveProfile } = useAuthStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avatar, setAvatar] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') return
    const r = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 })
    if (!r.canceled) setAvatar(r.assets[0].uri)
  }

  async function handleSave() {
    const errs = {}
    if (!name.trim() || name.trim().length < 2) errs.name = 'Enter your name'
    const ee = validateEmail(email)
    if (ee) errs.email = ee
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await saveProfile({ name: name.trim(), email: email.trim() || null, avatar })
    } catch (e) {
      Alert.alert('Error', e.message)
    } finally { setLoading(false) }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Set up your profile</Text>
          <Text style={styles.sub}>How other people will see you on REDE.</Text>
          <TouchableOpacity style={styles.avatarWrap} onPress={pickImage}>
            <Avatar uri={avatar} name={name || '?'} size={88} />
            <View style={styles.editBadge}><Text>📷</Text></View>
          </TouchableOpacity>
          <Input label="Full Name" value={name}
            onChangeText={v => { setName(v); if (errors.name) setErrors(e => ({ ...e, name: null })) }}
            placeholder="Your name" autoCapitalize="words" autoComplete="name" error={errors.name} />
          <View style={styles.phoneDisplay}>
            <Text style={styles.phoneLabel}>PHONE</Text>
            <Text style={styles.phoneValue}>{user?.phone}</Text>
            <Text style={styles.verified}>✓ Verified</Text>
          </View>
          <Input label="Email (optional)" value={email}
            onChangeText={v => { setEmail(v); if (errors.email) setErrors(e => ({ ...e, email: null })) }}
            placeholder="your@email.com" keyboardType="email-address"
            autoComplete="email" error={errors.email} hint="For event reminders" />
          <Button label="Let's Go 🎉" onPress={handleSave} loading={loading} disabled={!name.trim()} size="lg" style={{ marginTop: 8 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingBottom: 40 },
  heading: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, marginBottom: 10, marginTop: 12, letterSpacing: -0.5 },
  sub: { fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: 28 },
  avatarWrap: { alignSelf: 'center', marginBottom: 28, position: 'relative' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  phoneDisplay: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 10, padding: 14, marginBottom: 16, gap: 10 },
  phoneLabel: { fontSize: 11, fontWeight: '700', color: colors.primary, letterSpacing: 0.5 },
  phoneValue: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  verified: { fontSize: 12, color: colors.success, fontWeight: '600' },
})
