/**
 * ProfileSetupScreen - first time users only
 * Step 1: First name, Last name, Nickname
 * Step 2: Birthday (proper native date selection)  
 * Step 3: Interests (max 3)
 */
import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Dimensions, ScrollView, Platform,
  ActivityIndicator, TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore from '../../store/themeStore'
import useAuthStore  from '../../store/authStore'
import { EVENT_CATEGORIES } from '../../constants/config'

const { width }     = Dimensions.get('window')
const MAX_W         = Math.min(width, 500)
const CATS          = EVENT_CATEGORIES.filter(c => c.id !== 'all')
const MAX_INTERESTS = 3

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const THIS_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 70 }, (_, i) => THIS_YEAR - 13 - i)
const DAYS  = Array.from({ length: 31 }, (_, i) => i + 1)

function calcAge(day, month, year) {
  if (!day || !month || !year) return null
  const bd    = new Date(year, month, day)
  const today = new Date()
  let age     = today.getFullYear() - bd.getFullYear()
  const m     = today.getMonth() - bd.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--
  return age
}

export default function ProfileSetupScreen({ navigation }) {
  const { colors }      = useThemeStore()
  const { saveProfile } = useAuthStore()

  const [step,      setStep]      = useState(1)
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [nickname,  setNickname]  = useState('')
  const [nickErr,   setNickErr]   = useState('')
  const [bdDay,     setBdDay]     = useState(null)
  const [bdMonth,   setBdMonth]   = useState(null)  // 0-based
  const [bdYear,    setBdYear]    = useState(null)
  const [interests, setInterests] = useState([])
  const [saving,    setSaving]    = useState(false)

  const age     = calcAge(bdDay, bdMonth, bdYear)
  const ageOk   = age !== null && age >= 13
  const ageErr  = age !== null && age < 13
  const bdSet   = bdDay && bdMonth !== null && bdYear

  function toggleInterest(id) {
    setInterests(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length >= MAX_INTERESTS ? prev
        : [...prev, id]
    )
  }

  async function finish() {
    setSaving(true)
    try {
      const birthday = bdSet
        ? `${bdYear}-${String(bdMonth + 1).padStart(2,'0')}-${String(bdDay).padStart(2,'0')}`
        : null

      await saveProfile({
        first_name: firstName.trim(),
        last_name:  lastName.trim(),
        nickname:   nickname.trim(),
        name:       nickname.trim(),
        birthday,
        interests,
        profile_complete: true,
      })
      navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] })
    } catch (err) {
      if (err.message?.toLowerCase().includes('nickname')) {
        setNickErr(err.message)
        setStep(1)
      } else {
        Alert.alert('Error', err.message)
      }
    } finally { setSaving(false) }
  }

  const step1Valid = firstName.trim().length >= 2 && lastName.trim().length >= 1 && nickname.trim().length >= 2
  const step2Valid = !bdSet || ageOk  // birthday optional but if set must be valid

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top','bottom']}>
      <View style={[s.phone, { maxWidth: MAX_W }]}>

        {/* Progress */}
        <View style={s.dots}>
          {[1,2,3].map(i => (
            <View key={i} style={[s.dot, {
              backgroundColor: i <= step ? colors.primary : colors.border,
              width: i === step ? 24 : 8,
            }]} />
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled">

          {/* Step 1 — Names */}
          {step === 1 && <>
            <Text style={[s.h1, { color: colors.textPrimary }]}>What's your name?</Text>
            <Text style={[s.sub, { color: colors.textSecondary }]}>
              Your real name helps organisers trust you. Your nickname is what everyone sees publicly.
            </Text>

            <Text style={[s.label, { color: colors.textSecondary }]}>First Name *</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
              value={firstName} onChangeText={setFirstName}
              placeholder="e.g. Aisha" placeholderTextColor={colors.textHint}
              autoCapitalize="words" selectionColor={colors.primary} underlineColorAndroid="transparent"
            />

            <Text style={[s.label, { color: colors.textSecondary }]}>Last Name *</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
              value={lastName} onChangeText={setLastName}
              placeholder="e.g. Nakato" placeholderTextColor={colors.textHint}
              autoCapitalize="words" selectionColor={colors.primary} underlineColorAndroid="transparent"
            />

            <Text style={[s.label, { color: colors.textSecondary }]}>Nickname * (public, unique)</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.surface, borderColor: nickErr ? colors.error : colors.border, color: colors.textPrimary }]}
              value={nickname} onChangeText={v => { setNickname(v); setNickErr('') }}
              placeholder="e.g. Ace, SoftLife, NakKing" placeholderTextColor={colors.textHint}
              autoCapitalize="none" autoCorrect={false}
              selectionColor={colors.primary} underlineColorAndroid="transparent"
            />
            {nickErr
              ? <Text style={[s.errTxt, { color: colors.error }]}>{nickErr}</Text>
              : <Text style={[s.hint, { color: colors.textHint }]}>Must be unique — no two people share a nickname</Text>
            }
          </>}

          {/* Step 2 — Birthday */}
          {step === 2 && <>
            <Text style={[s.h1, { color: colors.textPrimary }]}>When were you born?</Text>
            <Text style={[s.sub, { color: colors.textSecondary }]}>
              Optional but you must be 18+ to create events. We only show your age, never your exact birthday.
            </Text>

            {/* Day */}
            <Text style={[s.label, { color: colors.textSecondary }]}>Day</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.scrollRow}>
              {DAYS.map(d => (
                <TouchableOpacity
                  key={d}
                  style={[s.chip, {
                    backgroundColor: bdDay === d ? colors.primary : colors.surface,
                    borderColor:     bdDay === d ? colors.primary : colors.border,
                  }]}
                  onPress={() => setBdDay(d)}
                >
                  <Text style={[s.chipTxt, { color: bdDay === d ? '#fff' : colors.textSecondary }]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Month */}
            <Text style={[s.label, { color: colors.textSecondary, marginTop: 16 }]}>Month</Text>
            <View style={s.chipWrap}>
              {MONTHS.map((m, i) => (
                <TouchableOpacity
                  key={m}
                  style={[s.chip, {
                    backgroundColor: bdMonth === i ? colors.primary : colors.surface,
                    borderColor:     bdMonth === i ? colors.primary : colors.border,
                  }]}
                  onPress={() => setBdMonth(i)}
                >
                  <Text style={[s.chipTxt, { color: bdMonth === i ? '#fff' : colors.textSecondary }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Year */}
            <Text style={[s.label, { color: colors.textSecondary, marginTop: 16 }]}>Year</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.scrollRow}>
              {YEARS.map(y => (
                <TouchableOpacity
                  key={y}
                  style={[s.chip, {
                    backgroundColor: bdYear === y ? colors.primary : colors.surface,
                    borderColor:     bdYear === y ? colors.primary : colors.border,
                    minWidth: 64,
                  }]}
                  onPress={() => setBdYear(y)}
                >
                  <Text style={[s.chipTxt, { color: bdYear === y ? '#fff' : colors.textSecondary }]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Age feedback */}
            {bdSet && (
              <View style={[s.ageBadge, {
                backgroundColor: ageErr ? colors.error + '15' : colors.primaryFaint,
                borderColor:     ageErr ? colors.error : colors.primary,
              }]}>
                <Text style={[s.ageTxt, { color: ageErr ? colors.error : colors.primary }]}>
                  {ageErr
                    ? '❌  You must be at least 13 years old to use REDE'
                    : `✓  Age: ${age} years old${age >= 18 ? ' — can create events' : ' — under 18, cannot create events'}`}
                </Text>
              </View>
            )}
          </>}

          {/* Step 3 — Interests */}
          {step === 3 && <>
            <Text style={[s.h1, { color: colors.textPrimary }]}>What are you into?</Text>
            <Text style={[s.sub, { color: colors.textSecondary }]}>
              Pick up to {MAX_INTERESTS}. Your home feed shows these categories first.
            </Text>
            <Text style={[s.counter, { color: interests.length === MAX_INTERESTS ? colors.primary : colors.textHint }]}>
              {interests.length}/{MAX_INTERESTS} selected
            </Text>
            <View style={s.chipWrap}>
              {CATS.map(cat => {
                const active = interests.includes(cat.id)
                const accent = colors.cat[cat.id] || colors.primary
                const full   = !active && interests.length >= MAX_INTERESTS
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[s.chip, {
                      backgroundColor: active ? accent : colors.surface,
                      borderColor:     active ? accent : colors.border,
                      opacity:         full ? 0.4 : 1,
                    }]}
                    onPress={() => toggleInterest(cat.id)}
                    disabled={full}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.chipTxt, { color: active ? '#fff' : colors.textSecondary }]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </>}

        </ScrollView>

        {/* Footer */}
        <View style={s.footer}>
          {step > 1 && (
            <TouchableOpacity onPress={() => setStep(p => p - 1)} style={s.backBtn}>
              <Text style={[s.backBtnTxt, { color: colors.textSecondary }]}>← Back</Text>
            </TouchableOpacity>
          )}

          {step < 3 ? (
            <TouchableOpacity
              style={[s.nextBtn, {
                backgroundColor: (step === 1 ? step1Valid : step2Valid) ? colors.primary : colors.border,
                flex: step > 1 ? 1 : undefined,
                marginLeft: step > 1 ? 12 : 0,
                alignSelf: step === 1 ? 'stretch' : undefined,
              }]}
              onPress={() => setStep(p => p + 1)}
              disabled={!(step === 1 ? step1Valid : step2Valid)}
              activeOpacity={0.87}
            >
              <Text style={s.nextTxt}>Continue →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.nextBtn, { backgroundColor: !saving ? colors.primary : colors.border, flex: 1, marginLeft: step > 1 ? 12 : 0 }]}
              onPress={finish}
              disabled={saving}
              activeOpacity={0.87}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.nextTxt}>Get Started 🚀</Text>
              }
            </TouchableOpacity>
          )}
        </View>

        {step === 3 && (
          <TouchableOpacity onPress={finish} style={s.skipBtn}>
            <Text style={[s.skipTxt, { color: colors.textHint }]}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:    { flex: 1, alignItems: 'center' },
  phone:   { flex: 1, width: '100%', paddingHorizontal: 24 },
  dots:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 20, paddingBottom: 28 },
  dot:     { height: 8, borderRadius: 4 },
  scroll:  { paddingBottom: 24 },
  h1:      { fontSize: 26, fontWeight: '900', letterSpacing: -0.5, marginBottom: 10 },
  sub:     { fontSize: 15, lineHeight: 22, marginBottom: 24 },
  label:   { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  hint:    { fontSize: 12, marginTop: -8, marginBottom: 16 },
  errTxt:  { fontSize: 13, fontWeight: '600', marginTop: -8, marginBottom: 12 },
  counter: { fontSize: 13, fontWeight: '700', marginBottom: 16 },
  input:   { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 16 },
  scrollRow: { flexGrow: 0, marginBottom: 4 },
  chipWrap:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip:    { borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 9, marginRight: 4, alignItems: 'center' },
  chipTxt: { fontSize: 13, fontWeight: '600' },
  ageBadge:{ borderRadius: 10, borderWidth: 1.5, padding: 12, marginTop: 16 },
  ageTxt:  { fontSize: 14, fontWeight: '600' },
  footer:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  backBtn: { paddingRight: 8, paddingVertical: 16 },
  backBtnTxt: { fontSize: 15, fontWeight: '600' },
  nextBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', paddingHorizontal: 24 },
  nextTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  skipBtn: { alignItems: 'center', paddingBottom: 8 },
  skipTxt: { fontSize: 14, textDecorationLine: 'underline' },
})
