/**
 * ProfileSetupScreen.js
 * Two-step profile setup:
 *  Step 1 — Name + photo
 *  Step 2 — Interests (category preferences)
 * Interests are saved locally and used to boost relevant events in the feed.
 */
import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import colors from '../../constants/colors'
import Input from '../../components/common/Input'
import Avatar from '../../components/common/Avatar'
import useAuthStore from '../../store/authStore'
import { validateEmail } from '../../utils/validators'
import { EVENT_CATEGORIES } from '../../constants/config'
import AsyncStorage from '@react-native-async-storage/async-storage'

// All categories except 'all' are valid interests
const INTEREST_CATEGORIES = EVENT_CATEGORIES.filter(c => c.id !== 'all')

export default function ProfileSetupScreen() {
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
    const r = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    })
    if (!r.canceled) setAvatar(r.assets[0].uri)
  }

  function toggleInterest(id) {
    setInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
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
      // Save interests to local storage for feed personalization
      await AsyncStorage.setItem('rede:interests', JSON.stringify(interests))
      await saveProfile({ name: name.trim(), email: email.trim() || null, avatar })
    } catch (e) {
      Alert.alert('Error', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Progress */}
        <View style={styles.progress}>
          {[1, 2].map(i => (
            <View key={i} style={[styles.bar, i <= step && styles.barActive]} />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Step 1: Profile info ─────────────────────────────────── */}
          {step === 1 && (
            <View>
              <Text style={styles.heading}>Set up your profile</Text>
              <Text style={styles.sub}>How people will see you on REDE</Text>

              {/* Avatar */}
              <TouchableOpacity style={styles.avatarWrap} onPress={pickImage}>
                <Avatar uri={avatar} name={name || '?'} size={84} />
                <View style={styles.avatarEdit}>
                  <Text style={{ fontSize: 14 }}>📷</Text>
                </View>
              </TouchableOpacity>

              <Input
                label="Full Name"
                value={name}
                onChangeText={v => { setName(v); if (errors.name) setErrors(e => ({ ...e, name: null })) }}
                placeholder="Your name"
                autoCapitalize="words"
                autoComplete="name"
                error={errors.name}
              />

              {/* Phone display — verified */}
              <View style={styles.phonePill}>
                <Text style={styles.phonePillLabel}>PHONE</Text>
                <Text style={styles.phonePillValue}>{user?.phone}</Text>
                <Text style={styles.verified}>✓ Verified</Text>
              </View>

              <Input
                label="Email (optional)"
                value={email}
                onChangeText={v => { setEmail(v); if (errors.email) setErrors(e => ({ ...e, email: null })) }}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoComplete="email"
                error={errors.email}
                hint="For event receipts and reminders"
              />

              <TouchableOpacity
                style={[styles.btn, !name.trim() && styles.btnDisabled]}
                onPress={handleNext}
                disabled={!name.trim()}
                activeOpacity={0.85}
              >
                <Text style={styles.btnText}>Continue →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Step 2: Interests ────────────────────────────────────── */}
          {step === 2 && (
            <View>
              <Text style={styles.heading}>What are you into?</Text>
              <Text style={styles.sub}>
                Pick your interests — we'll show you the events you'll love.
                You can change this anytime.
              </Text>

              <View style={styles.interestGrid}>
                {INTEREST_CATEGORIES.map(cat => {
                  const active = interests.includes(cat.id)
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.interestChip,
                        active && { backgroundColor: cat.accent, borderColor: cat.accent },
                      ]}
                      onPress={() => toggleInterest(cat.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.interestLabel, active && styles.interestLabelActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              <Text style={styles.selectionCount}>
                {interests.length === 0
                  ? 'Select at least one interest'
                  : `${interests.length} selected`}
              </Text>

              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleFinish}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.btnText}>
                  {loading ? 'Setting up...' : "Let's go 🎉"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleFinish} style={styles.skipBtn}>
                <Text style={styles.skipText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  progress: {
    flexDirection: 'row', gap: 6,
    paddingHorizontal: 24, paddingTop: 14, paddingBottom: 4,
  },
  bar: {
    flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.border,
  },
  barActive: { backgroundColor: colors.primary },
  content: { padding: 24, paddingBottom: 40 },
  heading: {
    fontSize: 26, fontWeight: '800', color: colors.textPrimary,
    marginBottom: 8, letterSpacing: -0.5,
  },
  sub: {
    fontSize: 14, color: colors.textSecondary,
    lineHeight: 20, marginBottom: 24,
  },

  // Avatar
  avatarWrap: {
    alignSelf: 'center', marginBottom: 24, position: 'relative',
  },
  avatarEdit: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },

  // Phone pill
  phonePill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 10,
    padding: 12, marginBottom: 16, gap: 8,
  },
  phonePillLabel: {
    fontSize: 10, fontWeight: '700', color: colors.primary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  phonePillValue: {
    flex: 1, fontSize: 14, fontWeight: '700', color: colors.textPrimary,
  },
  verified: { fontSize: 12, color: '#2E7D32', fontWeight: '600' },

  // Interests grid — 2 per row
  interestGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16,
  },
  interestChip: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  interestLabel: {
    fontSize: 13, fontWeight: '600', color: colors.textSecondary,
  },
  interestLabelActive: { color: '#fff' },

  selectionCount: {
    fontSize: 13, color: colors.textHint,
    textAlign: 'center', marginBottom: 20,
  },

  // Button
  btn: {
    backgroundColor: colors.primary, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  skipBtn: { alignItems: 'center', marginTop: 14 },
  skipText: {
    fontSize: 14, color: colors.textHint,
    textDecorationLine: 'underline',
  },
})
