/**
 * ProfileSetupScreen
 * Step 1: Photo (required)
 * Step 2: Names + Nickname
 * Step 3: Birthday (DD/MM/YYYY calendar picker — East African standard)
 * Step 4: Interests
 * All required: photo, first name, last name, nickname, birthday
 */
import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Dimensions, ScrollView, Platform,
  ActivityIndicator, TextInput, KeyboardAvoidingView,
  Image, Modal,
} from 'react-native'
import { SafeAreaView }      from 'react-native-safe-area-context'
import * as ImagePicker      from 'expo-image-picker'
import useThemeStore         from '../../store/themeStore'
import useAuthStore          from '../../store/authStore'
import { uploadApi }         from '../../services/api'
import { EVENT_CATEGORIES }  from '../../constants/config'

const { width } = Dimensions.get('window')
const MAX_W     = Math.min(width, 500)
const CATS      = EVENT_CATEGORIES.filter(c => c.id !== 'all')
const MAX_INT   = 3

const THIS_YEAR = new Date().getFullYear()
const YEARS     = Array.from({ length: 70 }, (_, i) => THIS_YEAR - 13 - i) // min age 13
const MONTHS    = [
  { n: 'January', d: 31 }, { n: 'February', d: 29 }, { n: 'March', d: 31 },
  { n: 'April', d: 30 },   { n: 'May', d: 31 },      { n: 'June', d: 30 },
  { n: 'July', d: 31 },    { n: 'August', d: 31 },   { n: 'September', d: 30 },
  { n: 'October', d: 31 }, { n: 'November', d: 30 }, { n: 'December', d: 31 },
]

function daysInMonth(month0, year) {
  if (!month0 && month0 !== 0) return 31
  return new Date(year || THIS_YEAR, month0 + 1, 0).getDate()
}

function calcAge(day, month0, year) {
  if (!day || month0 === null || month0 === undefined || !year) return null
  const bd  = new Date(year, month0, day)
  const now = new Date()
  let age   = now.getFullYear() - bd.getFullYear()
  const m   = now.getMonth() - bd.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) age--
  return age
}

// Simple scroll picker modal
function PickerModal({ visible, title, items, selected, onSelect, onClose, colors }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={pm.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[pm.sheet, { backgroundColor: colors.surface }]}>
        <View style={[pm.header, { borderBottomColor: colors.border }]}>
          <Text style={[pm.title, { color: colors.textPrimary }]}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[pm.done, { color: colors.primary }]}>Done</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={pm.list} showsVerticalScrollIndicator={false}>
          {items.map(item => {
            const val   = typeof item === 'object' ? item.value : item
            const label = typeof item === 'object' ? item.label : String(item)
            const isSel = val === selected
            return (
              <TouchableOpacity key={val} style={[pm.item, isSel && { backgroundColor: colors.primaryFaint || colors.primary + '18' }]}
                onPress={() => { onSelect(val); onClose() }}>
                <Text style={[pm.itemTxt, { color: isSel ? colors.primary : colors.textPrimary, fontWeight: isSel ? '800' : '400' }]}>
                  {label}
                </Text>
                {isSel && <Text style={{ color: colors.primary, fontSize: 16 }}>✓</Text>}
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>
    </Modal>
  )
}

export default function ProfileSetupScreen({ navigation }) {
  const { colors }      = useThemeStore()
  const { saveProfile } = useAuthStore()

  const [step,      setStep]      = useState(1)  // 1=photo 2=names 3=birthday 4=interests
  const [photo,     setPhoto]     = useState(null)
  const [photoUrl,  setPhotoUrl]  = useState(null)
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [nickname,  setNickname]  = useState('')
  const [nickErr,   setNickErr]   = useState('')
  const [bdDay,     setBdDay]     = useState(null)
  const [bdMonth,   setBdMonth]   = useState(null)  // 0-based
  const [bdYear,    setBdYear]    = useState(null)
  const [interests, setInterests] = useState([])
  const [saving,    setSaving]    = useState(false)
  const [picker,    setPicker]    = useState(null) // 'day'|'month'|'year'

  const age       = calcAge(bdDay, bdMonth, bdYear)
  const ageOk     = age !== null && age >= 13
  const ageErr    = age !== null && age < 13
  const bdFull    = bdDay !== null && bdMonth !== null && bdYear !== null

  // East African date format: DD/MM/YYYY
  const bdDisplay = bdFull
    ? `${String(bdDay).padStart(2,'0')}/${String(bdMonth + 1).padStart(2,'0')}/${bdYear}`
    : 'DD / MM / YYYY'

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) { Alert.alert('Permission needed', 'Allow photo access to set a profile picture.'); return }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType?.Images || ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.85,
    })
    if (!res.canceled && res.assets?.[0]) {
      setPhoto(res.assets[0].uri)
      // Upload in background
      try {
        const r = await uploadApi.upload(res.assets[0].uri)
        setPhotoUrl(r.url)
      } catch {
        setPhotoUrl(res.assets[0].uri)
      }
    }
  }

  function toggleInterest(id) {
    setInterests(p => p.includes(id) ? p.filter(x => x !== id) : p.length >= MAX_INT ? p : [...p, id])
  }

  async function finish() {
    setSaving(true)
    try {
      const birthday = bdFull
        ? `${bdYear}-${String(bdMonth + 1).padStart(2,'0')}-${String(bdDay).padStart(2,'0')}`
        : null
      const avatarUri = photoUrl || photo
      await saveProfile({
        first_name:       firstName.trim(),
        last_name:        lastName.trim(),
        nickname:         nickname.trim(),
        name:             nickname.trim(),
        birthday,
        interests,
        avatar:           avatarUri,
        avatar_url:       avatarUri,
        profile_complete: true,
      })
      navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] })
    } catch (err) {
      if (err.message?.toLowerCase().includes('nickname')) {
        setNickErr(err.message); setStep(2)
      } else {
        Alert.alert('Error', err.message)
      }
    } finally { setSaving(false) }
  }

  const step1Valid = !!photo
  const step2Valid = firstName.trim().length >= 2 && lastName.trim().length >= 1 && nickname.trim().length >= 2
  const step3Valid = bdFull && ageOk

  const dayItems   = Array.from({ length: daysInMonth(bdMonth, bdYear) }, (_, i) => ({ value: i + 1, label: String(i + 1).padStart(2, '0') }))
  const monthItems = MONTHS.map((m, i) => ({ value: i, label: m.n }))
  const yearItems  = YEARS.map(y => ({ value: y, label: String(y) }))

  const TOTAL = 4

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top','bottom']}>
        <View style={[s.phone, { maxWidth: MAX_W }]}>

          {/* Progress bar */}
          <View style={s.progressBar}>
            <View style={[s.progressFill, { backgroundColor: colors.primary, width: `${(step / TOTAL) * 100}%` }]} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.scroll}>

            {/* ── Step 1: Photo ── */}
            {step === 1 && (
              <>
                <Text style={[s.h1, { color: colors.textPrimary }]}>Add your photo</Text>
                <Text style={[s.sub, { color: colors.textSecondary }]}>
                  A real photo helps organisers and attendees recognise you.
                </Text>
                <TouchableOpacity onPress={pickPhoto} activeOpacity={0.82} style={s.photoCircleWrap}>
                  {photo ? (
                    <Image source={{ uri: photo }} style={s.photoCircle} />
                  ) : (
                    <View style={[s.photoCirclePlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Text style={{ fontSize: 48 }}>📷</Text>
                      <Text style={[s.photoHint, { color: colors.textSecondary }]}>Tap to add photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {photo && (
                  <TouchableOpacity onPress={pickPhoto} style={[s.changePhotoBtn, { borderColor: colors.border }]}>
                    <Text style={[s.changePhotoTxt, { color: colors.primary }]}>Change photo</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* ── Step 2: Names ── */}
            {step === 2 && (
              <>
                <Text style={[s.h1, { color: colors.textPrimary }]}>What's your name?</Text>
                <Text style={[s.sub, { color: colors.textSecondary }]}>
                  Your real name helps organisers trust you. Your nickname is shown publicly.
                </Text>
                {[
                  { label: 'First name', value: firstName, set: setFirstName, ph: 'e.g. David', min: 2 },
                  { label: 'Last name',  value: lastName,  set: setLastName,  ph: 'e.g. Musoke', min: 1 },
                  { label: 'Nickname (shown publicly)', value: nickname, set: v => { setNickname(v); setNickErr('') }, ph: 'e.g. davo256', min: 2 },
                ].map(f => (
                  <View key={f.label} style={s.field}>
                    <Text style={[s.label, { color: colors.textSecondary }]}>{f.label}</Text>
                    <TextInput
                      style={[s.input, { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.border }]}
                      value={f.value} onChangeText={f.set} placeholder={f.ph}
                      placeholderTextColor={colors.textHint} autoCorrect={false} autoCapitalize={f.label.includes('Nickname') ? 'none' : 'words'}
                      underlineColorAndroid="transparent" selectionColor={colors.primary}
                    />
                  </View>
                ))}
                {!!nickErr && <Text style={[s.errTxt, { color: colors.error }]}>{nickErr}</Text>}
              </>
            )}

            {/* ── Step 3: Birthday ── */}
            {step === 3 && (
              <>
                <Text style={[s.h1, { color: colors.textPrimary }]}>When's your birthday?</Text>
                <Text style={[s.sub, { color: colors.textSecondary }]}>
                  Required to access certain events. Format: DD / MM / YYYY
                </Text>

                {/* Three picker buttons side by side */}
                <View style={s.bdRow}>
                  {/* Day */}
                  <TouchableOpacity
                    style={[s.bdBtn, { backgroundColor: colors.surface, borderColor: bdDay ? colors.primary : colors.border, flex: 1 }]}
                    onPress={() => setPicker('day')}
                  >
                    <Text style={[s.bdBtnLabel, { color: colors.textHint }]}>Day</Text>
                    <Text style={[s.bdBtnVal, { color: bdDay ? colors.textPrimary : colors.textHint }]}>
                      {bdDay !== null ? String(bdDay).padStart(2,'0') : 'DD'}
                    </Text>
                  </TouchableOpacity>

                  {/* Month */}
                  <TouchableOpacity
                    style={[s.bdBtn, { backgroundColor: colors.surface, borderColor: bdMonth !== null ? colors.primary : colors.border, flex: 2 }]}
                    onPress={() => setPicker('month')}
                  >
                    <Text style={[s.bdBtnLabel, { color: colors.textHint }]}>Month</Text>
                    <Text style={[s.bdBtnVal, { color: bdMonth !== null ? colors.textPrimary : colors.textHint }]}>
                      {bdMonth !== null ? MONTHS[bdMonth].n : 'Month'}
                    </Text>
                  </TouchableOpacity>

                  {/* Year */}
                  <TouchableOpacity
                    style={[s.bdBtn, { backgroundColor: colors.surface, borderColor: bdYear ? colors.primary : colors.border, flex: 1.3 }]}
                    onPress={() => setPicker('year')}
                  >
                    <Text style={[s.bdBtnLabel, { color: colors.textHint }]}>Year</Text>
                    <Text style={[s.bdBtnVal, { color: bdYear ? colors.textPrimary : colors.textHint }]}>
                      {bdYear || 'YYYY'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Display full date */}
                {bdFull && (
                  <View style={[s.bdDisplay, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[s.bdDisplayTxt, { color: ageOk ? colors.primary : colors.error }]}>
                      {bdDisplay} {ageOk ? `· ${age} years old` : ''}
                    </Text>
                  </View>
                )}

                {ageErr && (
                  <Text style={[s.errTxt, { color: colors.error }]}>
                    You must be at least 13 years old to use REDE.
                  </Text>
                )}
              </>
            )}

            {/* ── Step 4: Interests ── */}
            {step === 4 && (
              <>
                <Text style={[s.h1, { color: colors.textPrimary }]}>What do you love?</Text>
                <Text style={[s.sub, { color: colors.textSecondary }]}>
                  Pick up to 3. We'll show you more of what you care about.
                </Text>
                <View style={s.interestsGrid}>
                  {CATS.map(c => {
                    const sel = interests.includes(c.id)
                    return (
                      <TouchableOpacity key={c.id}
                        style={[s.intChip, {
                          backgroundColor: sel ? colors.primary : colors.surface,
                          borderColor:     sel ? colors.primary : colors.border,
                        }]}
                        onPress={() => toggleInterest(c.id)}
                      >
                        <Text style={s.intEmoji}>{c.emoji || '🎉'}</Text>
                        <Text style={[s.intLabel, { color: sel ? '#fff' : colors.textPrimary }]}>
                          {c.label}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </>
            )}

          </ScrollView>

          {/* ── Bottom CTA ── */}
          <View style={[s.bottom, { borderTopColor: colors.border }]}>
            {step > 1 && (
              <TouchableOpacity style={[s.backBtn, { borderColor: colors.border }]} onPress={() => setStep(s => s - 1)}>
                <Text style={[s.backTxt, { color: colors.textSecondary }]}>← Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[s.nextBtn, {
                flex: step > 1 ? undefined : 1,
                backgroundColor: (
                  (step === 1 && step1Valid) ||
                  (step === 2 && step2Valid) ||
                  (step === 3 && step3Valid) ||
                  step === 4
                ) ? colors.primary : colors.border,
              }]}
              disabled={
                (step === 1 && !step1Valid) ||
                (step === 2 && !step2Valid) ||
                (step === 3 && !step3Valid) ||
                saving
              }
              onPress={() => {
                if (step < 4) { setStep(s => s + 1) }
                else { finish() }
              }}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.nextTxt}>
                    {step === 4 ? '🎉 Start using REDE' : `Continue →`}
                  </Text>
              }
            </TouchableOpacity>
          </View>

          {/* ── Picker modals ── */}
          <PickerModal visible={picker === 'day'} title="Select Day"
            items={dayItems} selected={bdDay}
            onSelect={v => { setBdDay(v); const max = daysInMonth(bdMonth, bdYear); if (v > max) setBdDay(max) }}
            onClose={() => setPicker(null)} colors={colors} />

          <PickerModal visible={picker === 'month'} title="Select Month"
            items={monthItems} selected={bdMonth}
            onSelect={v => { setBdMonth(v); const max = daysInMonth(v, bdYear); if (bdDay > max) setBdDay(max) }}
            onClose={() => setPicker(null)} colors={colors} />

          <PickerModal visible={picker === 'year'} title="Select Year"
            items={yearItems} selected={bdYear}
            onSelect={v => { setBdYear(v); const max = daysInMonth(bdMonth, v); if (bdDay > max) setBdDay(max) }}
            onClose={() => setPicker(null)} colors={colors} />

        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  safe:   { flex: 1, alignItems: 'center' },
  phone:  { flex: 1, width: '100%' },
  progressBar: { height: 3, width: '100%', backgroundColor: 'transparent' },
  progressFill:{ height: 3, borderRadius: 2 },
  scroll:  { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24 },
  h1:      { fontSize: 26, fontWeight: '900', marginBottom: 8, letterSpacing: -0.5 },
  sub:     { fontSize: 14, lineHeight: 20, marginBottom: 28, opacity: 0.75 },
  field:   { marginBottom: 16 },
  label:   { fontSize: 12, fontWeight: '700', marginBottom: 6, letterSpacing: 0.3 },
  input:   { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, fontWeight: '500' },
  errTxt:  { fontSize: 13, marginTop: 4 },

  // Photo step
  photoCircleWrap:       { alignItems: 'center', marginVertical: 16 },
  photoCircle:           { width: 160, height: 160, borderRadius: 80 },
  photoCirclePlaceholder:{ width: 160, height: 160, borderRadius: 80, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8 },
  photoHint:             { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  changePhotoBtn:        { alignSelf: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 9, marginTop: 8 },
  changePhotoTxt:        { fontSize: 13, fontWeight: '700' },

  // Birthday
  bdRow:      { flexDirection: 'row', gap: 8, marginBottom: 16 },
  bdBtn:      { borderWidth: 1.5, borderRadius: 12, padding: 12, alignItems: 'center' },
  bdBtnLabel: { fontSize: 10, fontWeight: '700', marginBottom: 4, letterSpacing: 0.3 },
  bdBtnVal:   { fontSize: 15, fontWeight: '800' },
  bdDisplay:  { borderWidth: 1, borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 8 },
  bdDisplayTxt:{ fontSize: 15, fontWeight: '700' },

  // Interests
  interestsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  intChip:       { borderWidth: 1.5, borderRadius: 24, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  intEmoji:      { fontSize: 16 },
  intLabel:      { fontSize: 13, fontWeight: '700' },

  // Bottom
  bottom:  { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
  backBtn: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  backTxt: { fontSize: 14, fontWeight: '700' },
  nextBtn: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' },
  nextTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
})

const pm = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:    { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '65%' },
  header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  title:    { fontSize: 16, fontWeight: '800' },
  done:     { fontSize: 15, fontWeight: '700' },
  list:     { paddingVertical: 8 },
  item:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  itemTxt:  { fontSize: 16 },
})
