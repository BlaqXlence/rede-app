/**
 * ProfileSetupScreen — first-time users only
 * Step 1: First name, Last name, Nickname (unique)
 * Step 2: Birthday (date picker like modern apps)
 * Step 3: Interests (max 3)
 *
 * - All optional (can skip) but gated features require completion
 * - Nickname checked for uniqueness against server
 * - Age calculated from birthday, must be 13+ to proceed
 */
import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Dimensions, ScrollView, Platform,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore from '../../store/themeStore'
import useAuthStore  from '../../store/authStore'
import { EVENT_CATEGORIES } from '../../constants/config'

const { width } = Dimensions.get('window')
const MAX_W = Math.min(width, 500)
const CATS  = EVENT_CATEGORIES.filter(c => c.id !== 'all')
const MAX_INTERESTS = 3

// Generate years from 1940 to (current year - 13)
const THIS_YEAR = new Date().getFullYear()
const YEARS  = Array.from({ length: THIS_YEAR - 1939 }, (_, i) => THIS_YEAR - 13 - i)
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']
const DAYS   = Array.from({ length: 31 }, (_, i) => i + 1)

function calcAge(birthday) {
  if (!birthday) return null
  const bd    = new Date(birthday)
  const today = new Date()
  let age     = today.getFullYear() - bd.getFullYear()
  const m     = today.getMonth() - bd.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--
  return age
}

export default function ProfileSetupScreen({ navigation }) {
  const { colors }      = useThemeStore()
  const { user, saveProfile } = useAuthStore()

  const [step,      setStep]      = useState(1)
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [nickname,  setNickname]  = useState('')
  const [nickErr,   setNickErr]   = useState('')
  const [bdDay,     setBdDay]     = useState('')
  const [bdMonth,   setBdMonth]   = useState('')
  const [bdYear,    setBdYear]    = useState('')
  const [interests, setInterests] = useState([])
  const [saving,    setSaving]    = useState(false)

  const birthday = bdDay && bdMonth && bdYear
    ? `${bdYear}-${String(MONTHS.indexOf(bdMonth)+1).padStart(2,'0')}-${String(bdDay).padStart(2,'0')}`
    : null

  const age     = calcAge(birthday)
  const step1OK = firstName.trim().length >= 2 && lastName.trim().length >= 1 && nickname.trim().length >= 2
  const step2OK = birthday && age >= 13
  const ageErr  = birthday && age !== null && age < 13

  function toggleInterest(id) {
    setInterests(prev =>
      prev.includes(id) ? prev.filter(x => x !== id)
      : prev.length >= MAX_INTERESTS ? prev
      : [...prev, id]
    )
  }

  async function finish() {
    setSaving(true)
    try {
      await saveProfile({
        first_name: firstName.trim(),
        last_name:  lastName.trim(),
        nickname:   nickname.trim(),
        name:       nickname.trim(),
        birthday,
        interests,
      })
      navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] })
    } catch (err) {
      // Nickname taken
      if (err.message?.toLowerCase().includes('nickname')) {
        setNickErr(err.message)
        setStep(1)
      } else {
        Alert.alert('Error', err.message)
      }
    } finally { setSaving(false) }
  }

  function goNext() {
    if (step === 1) {
      setNickErr('')
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    }
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top','bottom']}>
      <View style={[s.phone, { maxWidth: MAX_W }]}>

        {/* Progress dots */}
        <View style={s.dots}>
          {[1,2,3].map(i => (
            <View key={i} style={[s.dot, {
              backgroundColor: i <= step ? colors.primary : colors.border,
              width: i === step ? 24 : 8,
            }]} />
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled">

          {/* ── Step 1: Names ─────────────────────────── */}
          {step === 1 && (
            <View>
              <Text style={[s.h1, { color: colors.textPrimary }]}>What's your name?</Text>
              <Text style={[s.sub, { color: colors.textSecondary }]}>
                Your real name is only shown to event organisers. Your nickname is what everyone sees.
              </Text>

              <Text style={[s.label, { color: colors.textSecondary }]}>First Name *</Text>
              <WebInput value={firstName} onChange={setFirstName}
                placeholder="e.g. Aisha" autoCapitalize="words" colors={colors} />

              <Text style={[s.label, { color: colors.textSecondary }]}>Last Name *</Text>
              <WebInput value={lastName} onChange={setLastName}
                placeholder="e.g. Nakato" autoCapitalize="words" colors={colors} />

              <Text style={[s.label, { color: colors.textSecondary }]}>Nickname * (public, must be unique)</Text>
              <WebInput value={nickname} onChange={v => { setNickname(v); setNickErr('') }}
                placeholder="e.g. Ace, NakKing, SoftLife" autoCapitalize="none" colors={colors} />
              {nickErr ? (
                <Text style={[s.errTxt, { color: colors.error }]}>{nickErr}</Text>
              ) : (
                <Text style={[s.hint, { color: colors.textHint }]}>
                  Unique — no two people can have the same nickname
                </Text>
              )}
            </View>
          )}

          {/* ── Step 2: Birthday ──────────────────────── */}
          {step === 2 && (
            <View>
              <Text style={[s.h1, { color: colors.textPrimary }]}>When were you born?</Text>
              <Text style={[s.sub, { color: colors.textSecondary }]}>
                Helps us show age-appropriate events. You must be at least 13 to use REDE.
              </Text>

              {/* Day */}
              <Text style={[s.label, { color: colors.textSecondary }]}>Day</Text>
              <View style={s.pickerRow}>
                {DAYS.map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[s.pickerChip, {
                      backgroundColor: bdDay === d ? colors.primary : colors.surface,
                      borderColor:     bdDay === d ? colors.primary : colors.border,
                    }]}
                    onPress={() => setBdDay(d)}
                  >
                    <Text style={[s.pickerChipTxt, { color: bdDay === d ? '#fff' : colors.textSecondary }]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Month */}
              <Text style={[s.label, { color: colors.textSecondary, marginTop: 16 }]}>Month</Text>
              <View style={s.pickerRow}>
                {MONTHS.map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[s.pickerChip, {
                      backgroundColor: bdMonth === m ? colors.primary : colors.surface,
                      borderColor:     bdMonth === m ? colors.primary : colors.border,
                    }]}
                    onPress={() => setBdMonth(m)}
                  >
                    <Text style={[s.pickerChipTxt, { color: bdMonth === m ? '#fff' : colors.textSecondary }]}>
                      {m.slice(0,3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Year */}
              <Text style={[s.label, { color: colors.textSecondary, marginTop: 16 }]}>Year</Text>
              <ScrollView
                horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
              >
                {YEARS.map(y => (
                  <TouchableOpacity
                    key={y}
                    style={[s.yearChip, {
                      backgroundColor: bdYear === y ? colors.primary : colors.surface,
                      borderColor:     bdYear === y ? colors.primary : colors.border,
                    }]}
                    onPress={() => setBdYear(y)}
                  >
                    <Text style={[s.pickerChipTxt, { color: bdYear === y ? '#fff' : colors.textSecondary }]}>
                      {y}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Age display */}
              {age !== null && (
                <View style={[s.ageDisplay, {
                  backgroundColor: ageErr ? colors.error + '15' : colors.primaryFaint,
                  borderColor:     ageErr ? colors.error : colors.primary,
                }]}>
                  <Text style={[s.ageTxt, { color: ageErr ? colors.error : colors.primary }]}>
                    {ageErr
                      ? '❌ You must be at least 13 years old to use REDE'
                      : `✓ Age: ${age} years old`}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ── Step 3: Interests ────────────────────── */}
          {step === 3 && (
            <View>
              <Text style={[s.h1, { color: colors.textPrimary }]}>What are you into?</Text>
              <Text style={[s.sub, { color: colors.textSecondary }]}>
                Pick up to {MAX_INTERESTS}. We show these events first on your home feed.
              </Text>
              <Text style={[s.counter, { color: interests.length === MAX_INTERESTS ? colors.primary : colors.textHint }]}>
                {interests.length}/{MAX_INTERESTS} selected
              </Text>
              <View style={s.catGrid}>
                {CATS.map(cat => {
                  const active = interests.includes(cat.id)
                  const accent = colors.cat[cat.id] || colors.primary
                  const full   = !active && interests.length >= MAX_INTERESTS
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[s.catChip, {
                        backgroundColor: active ? accent : colors.surface,
                        borderColor:     active ? accent : colors.border,
                        opacity:         full ? 0.35 : 1,
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
        </ScrollView>

        {/* ── Footer ───────────────────────────────── */}
        <View style={s.footer}>
          {step > 1 && (
            <TouchableOpacity onPress={() => setStep(s => s - 1)} style={s.backBtn}>
              <Text style={[s.backTxt, { color: colors.textSecondary }]}>← Back</Text>
            </TouchableOpacity>
          )}

          {step < 3 ? (
            <TouchableOpacity
              style={[s.nextBtn, {
                backgroundColor: (step === 1 ? step1OK : step2OK) ? colors.primary : colors.border,
                flex: step > 1 ? 1 : undefined,
                marginLeft: step > 1 ? 12 : 0,
                minWidth: step === 1 ? '100%' : undefined,
              }]}
              onPress={goNext}
              disabled={!(step === 1 ? step1OK : step2OK)}
              activeOpacity={0.87}
            >
              <Text style={s.nextTxt}>Continue →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.nextBtn, {
                backgroundColor: !saving ? colors.primary : colors.border,
                flex: 1, marginLeft: 12,
              }]}
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

        {/* Skip — step 3 only */}
        {step === 3 && (
          <TouchableOpacity onPress={finish} style={s.skipBtn}>
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
  safe:   { flex: 1, alignItems: 'center' },
  phone:  { flex: 1, width: '100%', paddingHorizontal: 24 },
  dots:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 20, paddingBottom: 28 },
  dot:    { height: 8, borderRadius: 4 },
  scroll: { paddingBottom: 20 },

  h1:   { fontSize: 26, fontWeight: '900', letterSpacing: -0.5, marginBottom: 10 },
  sub:  { fontSize: 15, lineHeight: 22, marginBottom: 24 },
  label:{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  hint: { fontSize: 12, marginBottom: 16, marginTop: -10 },
  errTxt:{ fontSize: 13, fontWeight: '600', marginBottom: 12, marginTop: -10 },
  counter:{ fontSize: 13, fontWeight: '700', marginBottom: 16 },

  pickerRow:{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  pickerChip: { borderRadius: 8, borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 8, minWidth: 36, alignItems: 'center' },
  yearChip:   { borderRadius: 8, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  pickerChipTxt: { fontSize: 13, fontWeight: '600' },

  ageDisplay: { borderRadius: 10, borderWidth: 1.5, padding: 12, marginTop: 16 },
  ageTxt:     { fontSize: 14, fontWeight: '700' },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catChip: { borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 10 },
  catTxt:  { fontSize: 13, fontWeight: '600' },

  footer:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  backBtn: { paddingRight: 8, paddingVertical: 16 },
  backTxt: { fontSize: 15, fontWeight: '600' },
  nextBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', paddingHorizontal: 24 },
  nextTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  skipBtn: { alignItems: 'center', paddingBottom: 8 },
  skipTxt: { fontSize: 14, textDecorationLine: 'underline' },
})
