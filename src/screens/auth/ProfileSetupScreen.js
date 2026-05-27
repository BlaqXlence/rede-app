/**
 * ProfileSetupScreen.js
 * Step 1: Name + photo
 * Step 2: Pick interests
 */
import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import useThemeStore from '../../store/themeStore'
import useAuthStore  from '../../store/authStore'
import Input  from '../../components/common/Input'
import Avatar from '../../components/common/Avatar'
import BackButton from '../../components/common/BackButton'
import { validateEmail } from '../../utils/validators'
import { EVENT_CATEGORIES } from '../../constants/config'
import AsyncStorage from '@react-native-async-storage/async-storage'

const INTERESTS = EVENT_CATEGORIES.filter(c => c.id !== 'all')

export default function ProfileSetupScreen({ navigation }) {
  const { colors }    = useThemeStore()
  const { user, saveProfile } = useAuthStore()

  const [step, setStep]           = useState(1)
  const [name, setName]           = useState('')
  const [email, setEmail]         = useState('')
  const [avatar, setAvatar]       = useState(null)
  const [interests, setInterests] = useState([])
  const [errors, setErrors]       = useState({})
  const [loading, setLoading]     = useState(false)

  async function pickImage() {
    if (Platform.OS === 'web') return
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') return
    const r = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1,1], quality: 0.7 })
    if (!r.canceled) setAvatar(r.assets[0].uri)
  }

  function toggleInterest(id) {
    setInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  function validateStep1() {
    const errs = {}
    if (!name.trim() || name.trim().length < 2) errs.name = 'Enter your name'
    const ee = validateEmail(email)
    if (ee) errs.email = ee
    return errs
  }

  function handleNext() {
    const errs = validateStep1()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setStep(2)
  }

  async function handleFinish() {
    setLoading(true)
    try {
      await AsyncStorage.setItem('rede:interests', JSON.stringify(interests))
      await saveProfile({ name: name.trim(), email: email.trim() || null, avatar })
    } catch (e) {
      Alert.alert('Error', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        {/* Header with back button */}
        <View style={styles.headerRow}>
          {step > 1
            ? <BackButton onPress={() => setStep(1)} />
            : <View style={{ width: 30 }} />
          }
          <View style={styles.progress}>
            {[1,2].map(i => (
              <View key={i} style={[styles.bar, { backgroundColor: i <= step ? colors.primary : colors.border }]} />
            ))}
          </View>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {step === 1 && (
            <View>
              <Text style={[styles.heading, { color: colors.textPrimary }]}>Set up your profile</Text>
              <Text style={[styles.sub, { color: colors.textSecondary }]}>How people will see you</Text>

              <TouchableOpacity style={styles.avatarWrap} onPress={pickImage}>
                <Avatar uri={avatar} name={name || '?'} size={84} />
                <View style={[styles.avatarEdit, { backgroundColor: colors.primary }]}>
                  <Text style={{ fontSize: 12 }}>📷</Text>
                </View>
              </TouchableOpacity>

              <Input
                label="Full Name"
                value={name}
                onChangeText={v => { setName(v); if (errors.name) setErrors(e => ({ ...e, name: null })) }}
                placeholder="Your name"
                autoCapitalize="words"
                error={errors.name}
              />

              <View style={[styles.phonePill, { backgroundColor: colors.surface }]}>
                <Text style={[styles.phonePillLabel, { color: colors.primary }]}>PHONE</Text>
                <Text style={[styles.phonePillValue, { color: colors.textPrimary }]}>{user?.phone}</Text>
                <Text style={[styles.verified, { color: colors.success }]}>✓ Verified</Text>
              </View>

              <Input
                label="Email (optional)"
                value={email}
                onChangeText={v => { setEmail(v); if (errors.email) setErrors(e => ({ ...e, email: null })) }}
                placeholder="your@email.com"
                keyboardType="email-address"
                error={errors.email}
                hint="For event receipts and reminders"
              />

              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.primary, opacity: !name.trim() ? 0.45 : 1 }]}
                onPress={handleNext}
                disabled={!name.trim()}
                activeOpacity={0.85}
              >
                <Text style={styles.btnTxt}>Continue →</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={[styles.heading, { color: colors.textPrimary }]}>What are you into?</Text>
              <Text style={[styles.sub, { color: colors.textSecondary }]}>
                Pick your interests — we'll show you events you'll love.
              </Text>

              <View style={styles.chips}>
                {INTERESTS.map(cat => {
                  const active = interests.includes(cat.id)
                  const accent = colors.cat[cat.id] || colors.primary
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.chip, { backgroundColor: active ? accent : colors.surface, borderColor: active ? accent : colors.border }]}
                      onPress={() => toggleInterest(cat.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipTxt, { color: active ? '#fff' : colors.textSecondary }]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              <Text style={[styles.selCount, { color: colors.textHint }]}>
                {interests.length === 0 ? 'Select at least one' : `${interests.length} selected`}
              </Text>

              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.primary, opacity: loading ? 0.5 : 1 }]}
                onPress={handleFinish}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.btnTxt}>{loading ? 'Setting up...' : "Let's go 🎉"}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleFinish} style={styles.skipBtn}>
                <Text style={[styles.skipTxt, { color: colors.textHint }]}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },
  progress: { flex: 1, flexDirection: 'row', gap: 8, marginHorizontal: 16 },
  bar: { flex: 1, height: 3, borderRadius: 2 },
  content: { padding: 24, paddingBottom: 40 },
  heading: { fontSize: 26, fontWeight: '800', marginBottom: 8, letterSpacing: -0.5 },
  sub: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  avatarWrap: { alignSelf: 'center', marginBottom: 24, position: 'relative' },
  avatarEdit: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  phonePill: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 12, marginBottom: 16, gap: 8 },
  phonePillLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  phonePillValue: { flex: 1, fontSize: 14, fontWeight: '700' },
  verified: { fontSize: 12, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 9 },
  chipTxt: { fontSize: 13, fontWeight: '600' },
  selCount: { fontSize: 13, textAlign: 'center', marginBottom: 20 },
  btn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  btnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  skipBtn: { alignItems: 'center', marginTop: 14 },
  skipTxt: { fontSize: 14, textDecorationLine: 'underline' },
})
