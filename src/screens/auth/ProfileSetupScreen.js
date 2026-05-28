/**
 * ProfileSetupScreen.js
 * 3 clean steps after OTP verification for NEW users only.
 * Existing users skip this entirely.
 *
 * Step 1: First name + Last name + Nickname
 * Step 2: Age
 * Step 3: Interests (max 3)
 *
 * Design: minimal, no gradients, clean typography.
 */
import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, Dimensions, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore from '../../store/themeStore'
import useAuthStore  from '../../store/authStore'
import { EVENT_CATEGORIES } from '../../constants/config'

const { width }   = Dimensions.get('window')
const MAX_W       = Math.min(width, 500)
const CATEGORIES  = EVENT_CATEGORIES.filter(c => c.id !== 'all')
const MAX_INTERESTS = 3

const AGES = ['16–17','18–21','22–25','26–30','31–35','36–40','41–50','50+']

export default function ProfileSetupScreen({ navigation }) {
  const { colors }      = useThemeStore()
  const { user, saveProfile } = useAuthStore()

  const [step,      setStep]      = useState(1)
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [nickname,  setNickname]  = useState('')
  const [age,       setAge]       = useState('')
  const [interests, setInterests] = useState([])
  const [saving,    setSaving]    = useState(false)

  function toggleInterest(id) {
    setInterests(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= MAX_INTERESTS) return prev
      return [...prev, id]
    })
  }

  async function finish() {
    setSaving(true)
    try {
      await saveProfile({
        first_name: firstName.trim(),
        last_name:  lastName.trim(),
        nickname:   nickname.trim() || firstName.trim(),
        name:       nickname.trim() || firstName.trim(),
        age:        AGES.indexOf(age) + 16,  // rough midpoint
        interests,
      })
      navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] })
    } catch (err) {
      Alert.alert('Error', err.message)
    } finally { setSaving(false) }
  }

  const step1Valid = firstName.trim().length >= 2 && lastName.trim().length >= 1
  const step2Valid = !!age
  const step3Valid = interests.length >= 1

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top','bottom']}>
      <View style={[s.phone, { maxWidth: MAX_W }]}>

        {/* Progress dots */}
        <View style={s.progress}>
          {[1,2,3].map(i => (
            <View
              key={i}
              style={[s.dot, {
                backgroundColor: i <= step ? colors.primary : colors.border,
                width: i === step ? 20 : 8,
              }]}
            />
          ))}
        </View>

        {/* ── Step 1: Name ─────────────────────────── */}
        {step === 1 && (
          <View style={s.stepWrap}>
            <Text style={[s.heading, { color: colors.textPrimary }]}>What's your name?</Text>
            <Text style={[s.sub, { color: colors.textSecondary }]}>
              Your real name helps organisers and friends find you.
            </Text>

            <Text style={[s.label, { color: colors.textSecondary }]}>First Name</Text>
            <WebInput
              value={firstName}
              onChange={setFirstName}
              placeholder="e.g. Aisha"
              autoCapitalize="words"
              colors={colors}
            />

            <Text style={[s.label, { color: colors.textSecondary }]}>Last Name</Text>
            <WebInput
              value={lastName}
              onChange={setLastName}
              placeholder="e.g. Nakato"
              autoCapitalize="words"
              colors={colors}
            />

            <Text style={[s.label, { color: colors.textSecondary }]}>Nickname (what people call you)</Text>
            <WebInput
              value={nickname}
              onChange={setNickname}
              placeholder={`e.g. Ace, ${firstName || 'Nak'}`}
              autoCapitalize="none"
              colors={colors}
            />
            <Text style={[s.hint, { color: colors.textHint }]}>
              This is what shows publicly. Unique and fun.
            </Text>
          </View>
        )}

        {/* ── Step 2: Age ──────────────────────────── */}
        {step === 2 && (
          <View style={s.stepWrap}>
            <Text style={[s.heading, { color: colors.textPrimary }]}>How old are you?</Text>
            <Text style={[s.sub, { color: colors.textSecondary }]}>
              Helps us show you age-appropriate events.
            </Text>
            <View style={s.ageGrid}>
              {AGES.map(a => (
                <TouchableOpacity
                  key={a}
                  style={[s.agePill, {
                    backgroundColor: age === a ? colors.primary : colors.surface,
                    borderColor:     age === a ? colors.primary : colors.border,
                  }]}
                  onPress={() => setAge(a)}
                  activeOpacity={0.75}
                >
                  <Text style={[s.ageTxt, { color: age === a ? '#fff' : colors.textSecondary }]}>
                    {a}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Step 3: Interests ────────────────────── */}
        {step === 3 && (
          <View style={s.stepWrap}>
            <Text style={[s.heading, { color: colors.textPrimary }]}>What are you into?</Text>
            <Text style={[s.sub, { color: colors.textSecondary }]}>
              Pick up to {MAX_INTERESTS}. We'll show these events first.
            </Text>
            <Text style={[s.counter, { color: interests.length === MAX_INTERESTS ? colors.primary : colors.textHint }]}>
              {interests.length}/{MAX_INTERESTS} selected
            </Text>
            <View style={s.catGrid}>
              {CATEGORIES.map(cat => {
                const active = interests.includes(cat.id)
                const accent = colors.cat[cat.id] || colors.primary
                const full   = !active && interests.length >= MAX_INTERESTS
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[s.catChip, {
                      backgroundColor: active ? accent : colors.surface,
                      borderColor:     active ? accent : colors.border,
                      opacity:         full ? 0.4 : 1,
                    }]}
                    onPress={() => toggleInterest(cat.id)}
                    disabled={full}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.catTxt, { color: active ? '#fff' : colors.textSecondary }]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={s.footer}>
          {step > 1 && (
            <TouchableOpacity onPress={() => setStep(s => s - 1)} style={s.backBtn}>
              <Text style={[s.backTxt, { color: colors.textSecondary }]}>← Back</Text>
            </TouchableOpacity>
          )}

          {step < 3 ? (
            <TouchableOpacity
              style={[s.nextBtn, {
                backgroundColor: (step === 1 ? step1Valid : step2Valid) ? colors.primary : colors.border,
                flex: step > 1 ? 1 : undefined,
                marginLeft: step > 1 ? 12 : 0,
              }]}
              onPress={() => setStep(s => s + 1)}
              disabled={!(step === 1 ? step1Valid : step2Valid)}
              activeOpacity={0.87}
            >
              <Text style={s.nextTxt}>Continue →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.nextBtn, {
                backgroundColor: step3Valid && !saving ? colors.primary : colors.border,
                flex: 1, marginLeft: 12,
              }]}
              onPress={finish}
              disabled={!step3Valid || saving}
              activeOpacity={0.87}
            >
              <Text style={s.nextTxt}>{saving ? 'Saving...' : 'Get Started 🚀'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Skip — only for interests step */}
        {step === 3 && (
          <TouchableOpacity onPress={finish} style={s.skip}>
            <Text style={[s.skipTxt, { color: colors.textHint }]}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  )
}

function WebInput({ value, onChange, placeholder, autoCapitalize, colors }) {
  if (Platform.OS === 'web') {
    return (
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoCapitalize={autoCapitalize}
        style={{
          width: '100%', boxSizing: 'border-box',
          backgroundColor: colors.surface, color: colors.textPrimary,
          border: `1.5px solid ${colors.border}`, borderRadius: 12,
          padding: '14px 16px', fontSize: 16, fontFamily: 'inherit',
          outline: 'none', display: 'block', marginBottom: 16,
        }}
      />
    )
  }
  const { TextInput } = require('react-native')
  return (
    <TextInput
      style={{
        borderWidth: 1.5, borderRadius: 12,
        paddingHorizontal: 16, paddingVertical: 14,
        fontSize: 16, marginBottom: 16,
        backgroundColor: colors.surface,
        borderColor: colors.border,
        color: colors.textPrimary,
      }}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={colors.textHint}
      autoCapitalize={autoCapitalize}
      selectionColor={colors.primary}
      underlineColorAndroid="transparent"
    />
  )
}

const s = StyleSheet.create({
  safe:     { flex: 1, alignItems: 'center' },
  phone:    { flex: 1, width: '100%', paddingHorizontal: 24 },

  progress: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 20, paddingBottom: 32 },
  dot:      { height: 8, borderRadius: 4 },

  stepWrap: { flex: 1 },
  heading:  { fontSize: 26, fontWeight: '900', letterSpacing: -0.5, marginBottom: 10 },
  sub:      { fontSize: 15, lineHeight: 22, marginBottom: 28 },
  label:    { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  hint:     { fontSize: 12, marginBottom: 16, marginTop: -10 },
  counter:  { fontSize: 13, fontWeight: '700', marginBottom: 16 },

  ageGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  agePill:  { borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 20, paddingVertical: 12 },
  ageTxt:   { fontSize: 14, fontWeight: '600' },

  catGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catChip:  { borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 10 },
  catTxt:   { fontSize: 13, fontWeight: '600' },

  footer:   { flexDirection: 'row', alignItems: 'center', paddingBottom: 16, paddingTop: 20 },
  backBtn:  { paddingVertical: 16, paddingRight: 8 },
  backTxt:  { fontSize: 15, fontWeight: '600' },
  nextBtn:  { borderRadius: 14, paddingVertical: 16, alignItems: 'center', paddingHorizontal: 32 },
  nextTxt:  { color: '#fff', fontSize: 16, fontWeight: '800' },
  skip:     { alignItems: 'center', paddingBottom: 8 },
  skipTxt:  { fontSize: 14, textDecorationLine: 'underline' },
})
