import React, { useState, useMemo } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, TextInput, KeyboardAvoidingView,
  Platform, Dimensions, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore    from '../../store/themeStore'
import useEventsStore   from '../../store/eventsStore'
import useAuthStore     from '../../store/authStore'
import { DatePicker, TimePicker } from '../../components/common/DateTimePicker'
import LocationPicker   from '../../components/common/LocationPicker'
import PhotoUpload      from '../../components/common/PhotoUpload'
import { EVENT_CATEGORIES } from '../../constants/config'

const { width } = Dimensions.get('window')
const MAX_W = Math.min(width, 500)
const CATS  = EVENT_CATEGORIES.filter(c => c.id !== 'all')

const DEFAULT_COVERS = {
  party:   'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600',
  sports:  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600',
  dancing: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=600',
  food:    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
  music:   'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600',
  games:   'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=600',
  outdoor: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600',
  art:     'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600',
}

const BLANK = {
  title: '', category: null, date: '', startTime: '', endTime: '',
  location: { cityId: 'kampala', area: '', venueName: '', lat: 0.3476, lng: 32.5825 },
  description: '', photoUri: null, maxAttendees: '',
}

function calcAge(birthday) {
  if (!birthday) return null
  const bd  = new Date(birthday)
  const now = new Date()
  let age   = now.getFullYear() - bd.getFullYear()
  const m   = now.getMonth() - bd.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) age--
  return age
}

export default function CreateEventScreen({ navigation }) {
  const { colors }      = useThemeStore()
  const { createEvent } = useEventsStore()
  const { user }        = useAuthStore()

  const [step,    setStep]    = useState(1)
  const [form,    setForm]    = useState(BLANK)
  const [errors,  setErrors]  = useState({})
  const [posting, setPosting] = useState(false)

  const age        = calcAge(user?.birthday)
  const hasName    = user?.name?.trim()?.length >= 2 || user?.nickname?.trim()?.length >= 2
  const isAdult    = !user?.birthday || age === null || age >= 18
  const canCreate  = hasName && isAdult

  function setField(k, v) {
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => ({ ...p, [k]: null }))
  }

  function validate(s) {
    const e = {}
    if (s === 1) {
      if (!form.title.trim() || form.title.trim().length < 5) e.title = 'Title needs at least 5 characters'
      if (!form.category) e.category = 'Pick a category'
    }
    if (s === 2) {
      if (!form.date)      e.date      = 'Pick a date'
      if (!form.startTime) e.startTime = 'Set a start time'
      if (!form.endTime)   e.endTime   = 'Set an end time'
      if (form.startTime && form.endTime && form.endTime <= form.startTime)
        e.endTime = 'End time must be after start time'
      if (!form.location?.venueName?.trim()) e.location = 'Enter the venue name'
    }
    if (s === 3) {
      if (!form.description.trim() || form.description.trim().length < 50)
        e.description = 'Describe your event (min 50 characters)'
      const max = form.maxAttendees ? parseInt(form.maxAttendees) : null
      if (max !== null && (isNaN(max) || max < 2)) e.maxAttendees = 'Minimum 2'
    }
    return e
  }

  function handleBack() {
    if (step === 1) navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] })
    else setStep(s => s - 1)
  }

  function handleContinue() {
    const e = validate(step)
    if (Object.keys(e).length) { setErrors(e); return }
    setStep(s => s + 1)
  }

  async function handlePost() {
    const e = validate(3)
    if (Object.keys(e).length) { setErrors(e); return }
    setPosting(true)
    try {
      const startTime = new Date(`${form.date}T${form.startTime}:00`).toISOString()
      const endTime   = new Date(`${form.date}T${form.endTime}:00`).toISOString()
      const event     = await createEvent({
        title:       form.title.trim(),
        category:    form.category,
        description: form.description.trim(),
        coverImage:  form.photoUri || DEFAULT_COVERS[form.category] || DEFAULT_COVERS.party,
        startTime, endTime,
        location: {
          name:      form.location.venueName.trim(),
          address:   [form.location.area, form.location.venueName].filter(Boolean).join(', '),
          venueName: form.location.venueName.trim(),
          area:      form.location.area || '',
          city:      form.location.cityId || 'kampala',
          lat:       form.location.lat || 0.3476,
          lng:       form.location.lng || 32.5825,
          mapsLink:  form.location.mapsLink || null,
        },
        maxAttendees: form.maxAttendees ? parseInt(form.maxAttendees) : null,
        entryFee: 0, tags: [],
      })
      setForm(BLANK); setStep(1)
      navigation.reset({ index: 1, routes: [{ name: 'Tabs' }, { name: 'EventDetail', params: { eventId: event.id, event } }] })
    } catch (err) {
      Alert.alert('Could not post', err.message || 'Check your connection.')
    } finally { setPosting(false) }
  }

  // Gate
  if (!canCreate) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top','bottom']}>
        <View style={[s.phone, { maxWidth: MAX_W }]}>
          <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Text style={[s.backTxt, { color: colors.primary }]}>←</Text>
            </TouchableOpacity>
            <Text style={[s.headerTitle, { color: colors.textPrimary }]}>Create Event</Text>
            <View style={{ width: 30 }} />
          </View>
          <View style={s.gateWrap}>
            <Text style={{ fontSize: 56, marginBottom: 20 }}>👤</Text>
            <Text style={[s.gateTitle, { color: colors.textPrimary }]}>Complete your profile first</Text>
            <Text style={[s.gateSub, { color: colors.textSecondary }]}>
              To create events you need a name and must be 18 or older.
            </Text>
            <View style={[s.gateList, { backgroundColor: colors.surface }]}>
              <GateItem done={hasName}  label="Add your name in Settings" colors={colors} />
              <GateItem done={isAdult}  label="Must be 18+ years old"     colors={colors} />
            </View>
            <TouchableOpacity
              style={[s.gateBtn, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={s.gateBtnTxt}>Go to Settings →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top','bottom']}>
      <View style={[s.phone, { maxWidth: MAX_W }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

          <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={handleBack} style={s.backBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={[s.backTxt, { color: colors.primary }]}>←</Text>
            </TouchableOpacity>
            <Text style={[s.headerTitle, { color: colors.textPrimary }]}>Create Event</Text>
            <Text style={[s.stepNum, { color: colors.textHint }]}>{step}/3</Text>
          </View>

          <View style={[s.progressRow, { backgroundColor: colors.surface }]}>
            {[1,2,3].map(i => (
              <View key={i} style={[s.bar, { backgroundColor: i <= step ? colors.primary : colors.border }]} />
            ))}
          </View>

          <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Step 1 */}
            {step === 1 && <>
              <Text style={[s.stepTitle, { color: colors.textPrimary }]}>What's the event?</Text>

              <Text style={[s.label, { color: colors.textSecondary }]}>Title *</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.surface, borderColor: errors.title ? colors.error : colors.border, color: colors.textPrimary }]}
                value={form.title}
                onChangeText={v => setField('title', v)}
                placeholder="e.g. Friday Rooftop Party"
                placeholderTextColor={colors.textHint}
                autoCapitalize="sentences"
                maxLength={80}
                selectionColor={colors.primary}
                underlineColorAndroid="transparent"
              />
              {errors.title && <Text style={[s.errTxt, { color: colors.error }]}>{errors.title}</Text>}
              <Text style={[s.hint, { color: colors.textHint }]}>{form.title.length}/80</Text>

              <Text style={[s.label, { color: colors.textSecondary }]}>Category *</Text>
              {errors.category && <Text style={[s.errTxt, { color: colors.error }]}>{errors.category}</Text>}
              <View style={s.chips}>
                {CATS.map(cat => {
                  const active = form.category === cat.id
                  const accent = colors.cat[cat.id] || colors.primary
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setField('category', cat.id)}
                      style={[s.chip, { backgroundColor: active ? accent : colors.surface, borderColor: active ? accent : colors.border }]}
                      activeOpacity={0.75}
                    >
                      <Text style={[s.chipTxt, { color: active ? '#fff' : colors.textSecondary }]}>{cat.label}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </>}

            {/* Step 2 */}
            {step === 2 && <>
              <Text style={[s.stepTitle, { color: colors.textPrimary }]}>When & where?</Text>
              <DatePicker label="Date"       value={form.date}      onChange={v => setField('date', v)}      error={errors.date} />
              <TimePicker label="Start Time" value={form.startTime} onChange={v => setField('startTime', v)} error={errors.startTime} />
              <TimePicker label="End Time"   value={form.endTime}   onChange={v => setField('endTime', v)}   error={errors.endTime} />
              <LocationPicker
                value={form.location}
                onChange={loc => { setField('location', loc); setErrors(p => ({ ...p, location: null })) }}
                error={errors.location}
              />
            </>}

            {/* Step 3 */}
            {step === 3 && <>
              <Text style={[s.stepTitle, { color: colors.textPrimary }]}>Tell people more</Text>

              <Text style={[s.label, { color: colors.textSecondary }]}>Description *</Text>
              <TextInput
                style={[s.input, s.textArea, { backgroundColor: colors.surface, borderColor: errors.description ? colors.error : colors.border, color: colors.textPrimary }]}
                value={form.description}
                onChangeText={v => setField('description', v)}
                placeholder="What's happening? Who should come? What to expect?"
                placeholderTextColor={colors.textHint}
                multiline
                numberOfLines={6}
                autoCapitalize="sentences"
                maxLength={1000}
                selectionColor={colors.primary}
                underlineColorAndroid="transparent"
                textAlignVertical="top"
              />
              {errors.description
                ? <Text style={[s.errTxt, { color: colors.error }]}>{errors.description}</Text>
                : <Text style={[s.hint, { color: colors.textHint }]}>{form.description.length}/1000 · min 50 chars</Text>
              }

              <Text style={[s.label, { color: colors.textSecondary, marginTop: 8 }]}>Cover Photo</Text>
              <PhotoUpload
                uri={form.photoUri}
                onSelect={(uri) => setField('photoUri', uri)}
                onRemove={() => setField('photoUri', null)}
              />

              <Text style={[s.label, { color: colors.textSecondary }]}>Max Attendees (optional)</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.surface, borderColor: errors.maxAttendees ? colors.error : colors.border, color: colors.textPrimary }]}
                value={form.maxAttendees}
                onChangeText={v => setField('maxAttendees', v.replace(/\D/g, ''))}
                placeholder="Leave blank for unlimited"
                placeholderTextColor={colors.textHint}
                keyboardType="number-pad"
                selectionColor={colors.primary}
                underlineColorAndroid="transparent"
              />
              {errors.maxAttendees && <Text style={[s.errTxt, { color: colors.error }]}>{errors.maxAttendees}</Text>}

              <View style={[s.infoBox, { backgroundColor: colors.surface }]}>
                <Text style={[s.infoLabel, { color: colors.textHint }]}>ENTRY FEE</Text>
                <Text style={[s.infoVal, { color: colors.textPrimary }]}>Free during beta</Text>
              </View>
            </>}

            <View style={{ height: 16 }} />
          </ScrollView>

          <View style={[s.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[s.footerBtn, { backgroundColor: colors.primary, opacity: posting ? 0.6 : 1 }]}
              onPress={step < 3 ? handleContinue : handlePost}
              disabled={posting}
              activeOpacity={0.87}
            >
              {posting
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.footerBtnTxt}>{step < 3 ? 'Continue →' : '🚀  Post Event'}</Text>
              }
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  )
}

function GateItem({ done, label, colors }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
      <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? colors.success : colors.border }}>
        {done && <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>✓</Text>}
      </View>
      <Text style={{ fontSize: 15, color: done ? colors.textPrimary : colors.textSecondary }}>{label}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  safe:    { flex: 1, alignItems: 'center' },
  phone:   { flex: 1, width: '100%' },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  backTxt: { fontSize: 22, fontWeight: '700' },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  stepNum: { fontSize: 13, fontWeight: '600', minWidth: 30, textAlign: 'right' },
  progressRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 10 },
  bar: { flex: 1, height: 3, borderRadius: 2 },
  body: { padding: 20, paddingBottom: 16 },
  stepTitle: { fontSize: 22, fontWeight: '900', marginBottom: 20, letterSpacing: -0.3 },
  label:  { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7 },
  errTxt: { fontSize: 12, marginTop: 4, marginBottom: 4 },
  hint:   { fontSize: 11, marginTop: 4 },
  input:  { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, marginBottom: 4 },
  textArea: { minHeight: 130, textAlignVertical: 'top' },
  chips:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip:   { borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 9 },
  chipTxt:{ fontSize: 13, fontWeight: '600' },
  infoBox:   { borderRadius: 12, padding: 14, marginTop: 8 },
  infoLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoVal:   { fontSize: 15, fontWeight: '700', marginTop: 4 },
  footer:    { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  footerBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  footerBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  gateWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  gateTitle:{ fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  gateSub:  { fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 28 },
  gateList: { borderRadius: 14, padding: 16, width: '100%', marginBottom: 24 },
  gateBtn:  { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  gateBtnTxt:{ color: '#fff', fontSize: 15, fontWeight: '700' },
})
