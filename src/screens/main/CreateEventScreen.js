/**
 * CreateEventScreen.js
 * - Checks profile name before allowing any creation
 * - 30-day planning window (was 7)
 * - After post, navigates to Home (not back to create)
 * - Back button on step 1 goes to Home, not create loop
 */
import React, { useState, useEffect, useMemo } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, Alert, TextInput,
  KeyboardAvoidingView, Dimensions, Modal,
  TouchableWithoutFeedback,
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
const MAX_W     = Math.min(width, 500)
const CATS      = EVENT_CATEGORIES.filter(c => c.id !== 'all')

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
  title: '', category: null,
  date: '', startTime: '', endTime: '',
  location: { cityId: 'kampala', area: '', venueName: '', lat: 0.3476, lng: 32.5825 },
  description: '', photoUri: null, photoFile: null, maxAttendees: '',
}

export default function CreateEventScreen({ navigation }) {
  const { colors }      = useThemeStore()
  const { createEvent } = useEventsStore()
  const { user }        = useAuthStore()

  const [ready,    setReady]    = useState(false)  // passed the profile check
  const [step,     setStep]     = useState(1)
  const [form,     setForm]     = useState(BLANK)
  const [errors,   setErrors]   = useState({})
  const [posting,  setPosting]  = useState(false)

  // Check profile name on mount — show gate modal if missing
  useEffect(() => {
    if (user?.name && user.name.trim().length >= 2) {
      setReady(true)
    }
    // else the gate modal shows
  }, [user])

  function setField(field, value) {
    setForm(p => ({ ...p, [field]: value }))
    if (errors[field]) setErrors(p => ({ ...p, [field]: null }))
  }

  function validate(s) {
    const e = {}
    if (s === 1) {
      if (!form.title.trim() || form.title.trim().length < 5)
        e.title = 'Title needs at least 5 characters'
      if (!form.category)
        e.category = 'Pick a category'
    }
    if (s === 2) {
      if (!form.date)         e.date      = 'Pick a date'
      if (!form.startTime)    e.startTime = 'Set a start time'
      if (!form.endTime)      e.endTime   = 'Set an end time'
      if (form.startTime && form.endTime && form.endTime <= form.startTime)
        e.endTime = 'End time must be after start time'
      if (!form.location?.venueName?.trim())
        e.location = 'Enter the venue name'
    }
    if (s === 3) {
      if (!form.description.trim() || form.description.trim().length < 50)
        e.description = 'Describe your event — at least 50 characters'
      const max = form.maxAttendees ? parseInt(form.maxAttendees, 10) : null
      if (max !== null && (isNaN(max) || max < 2))
        e.maxAttendees = 'Minimum 2 attendees'
    }
    return e
  }

  function handleBack() {
    if (step === 1) {
      // Go to Home — not back to create loop
      navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] })
    } else {
      setStep(s => s - 1)
    }
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

      const event = await createEvent({
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
          lat:       form.location.lat   || 0.3476,
          lng:       form.location.lng   || 32.5825,
          mapsLink:  form.location.mapsLink || null,
        },
        maxAttendees: form.maxAttendees ? parseInt(form.maxAttendees, 10) : null,
        entryFee: 0, originalFee: null, tags: [],
      })

      // Reset form
      setForm(BLANK)
      setStep(1)

      // Go to the event — back from there goes HOME not create
      navigation.reset({
        index: 1,
        routes: [
          { name: 'Tabs' },
          { name: 'EventDetail', params: { eventId: event.id, event } },
        ],
      })
    } catch (err) {
      Alert.alert('Could not post event', err.message || 'Check your connection and try again.')
    } finally {
      setPosting(false)
    }
  }

  // ── Gate modal — shown when name is missing ──────────────
  if (!ready) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={[styles.phone, { maxWidth: MAX_W }]}>
          {/* Still show a back arrow so user isn't trapped */}
          <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={[styles.backTxt, { color: colors.primary }]}>←</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Create Event</Text>
            <View style={{ width: 30 }} />
          </View>

          <View style={styles.gateWrap}>
            <Text style={{ fontSize: 56, marginBottom: 20 }}>👤</Text>
            <Text style={[styles.gateTitle, { color: colors.textPrimary }]}>
              Set up your profile first
            </Text>
            <Text style={[styles.gateSub, { color: colors.textSecondary }]}>
              Before creating an event, people need to know who you are. Add your name to your profile so attendees can trust the event is legitimate.
            </Text>

            <View style={[styles.gateChecklist, { backgroundColor: colors.surface }]}>
              <GateItem done={!!(user?.name?.trim()?.length >= 2)} label="Add your name" colors={colors} />
              <GateItem done={!!user?.verified}                    label="Verify your phone number" colors={colors} />
            </View>

            <TouchableOpacity
              style={[styles.gateBtn, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.gateBtnTxt}>Go to Settings →</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 14 }}>
              <Text style={[styles.gateSkip, { color: colors.textHint }]}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  // ── Main creation flow ───────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.phone, { maxWidth: MAX_W }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={[styles.backTxt, { color: colors.primary }]}>←</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Create Event</Text>
            <Text style={[styles.stepNum, { color: colors.textHint }]}>{step}/3</Text>
          </View>

          {/* Progress */}
          <View style={[styles.progressRow, { backgroundColor: colors.surface }]}>
            {[1,2,3].map(i => (
              <View key={i} style={[styles.bar, { backgroundColor: i <= step ? colors.primary : colors.border }]} />
            ))}
          </View>

          {/* Scrollable form */}
          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Step 1: What ── */}
            {step === 1 && (
              <>
                <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>What's the event?</Text>

                <FieldWrap label="Title" error={errors.title} hint={`${form.title.length}/80`} colors={colors}>
                  <WebOrNative
                    value={form.title}
                    onChange={v => setField('title', v)}
                    placeholder="e.g. Friday Rooftop Party"
                    maxLength={80}
                    autoCapitalize="sentences"
                    error={errors.title}
                    colors={colors}
                  />
                </FieldWrap>

                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Category</Text>
                {errors.category && <Text style={[styles.errorTxt, { color: colors.error }]}>{errors.category}</Text>}
                <View style={styles.chips}>
                  {CATS.map(cat => {
                    const active = form.category === cat.id
                    const accent = colors.cat[cat.id] || colors.primary
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => setField('category', cat.id)}
                        style={[styles.chip, {
                          backgroundColor: active ? accent : colors.surface,
                          borderColor:     active ? accent : colors.border,
                        }]}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.chipTxt, { color: active ? '#fff' : colors.textSecondary }]}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </>
            )}

            {/* ── Step 2: When & Where ── */}
            {step === 2 && (
              <>
                <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>When & where?</Text>
                <DatePicker  label="Date"       value={form.date}      onChange={v => setField('date', v)}      error={errors.date} />
                <TimePicker  label="Start Time" value={form.startTime} onChange={v => setField('startTime', v)} error={errors.startTime} />
                <TimePicker  label="End Time"   value={form.endTime}   onChange={v => setField('endTime', v)}   error={errors.endTime} />
                <LocationPicker
                  value={form.location}
                  onChange={loc => { setField('location', loc); setErrors(p => ({ ...p, location: null })) }}
                  error={errors.location}
                />
              </>
            )}

            {/* ── Step 3: Details ── */}
            {step === 3 && (
              <>
                <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Tell people more</Text>

                <FieldWrap label="Description" error={errors.description}
                  hint={`${form.description.length}/1000 · min 50 chars`} colors={colors}>
                  <WebOrNative
                    value={form.description}
                    onChange={v => setField('description', v)}
                    placeholder="What's happening? Who should come? What to expect?"
                    maxLength={1000}
                    multiline
                    autoCapitalize="sentences"
                    error={errors.description}
                    colors={colors}
                  />
                </FieldWrap>

                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Cover Photo</Text>
                <PhotoUpload
                  uri={form.photoUri}
                  onSelect={(uri, file) => { setField('photoUri', uri); setField('photoFile', file) }}
                  onRemove={() => { setField('photoUri', null); setField('photoFile', null) }}
                />

                <FieldWrap label="Max Attendees (optional)"
                  hint="Leave blank for unlimited. Minimum 2."
                  error={errors.maxAttendees} colors={colors}>
                  <WebOrNative
                    value={form.maxAttendees}
                    onChange={v => setField('maxAttendees', v.replace(/\D/g, ''))}
                    placeholder="e.g. 50"
                    keyboardType="number-pad"
                    inputType="number"
                    error={errors.maxAttendees}
                    colors={colors}
                  />
                </FieldWrap>

                <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.infoLabel, { color: colors.textHint }]}>ENTRY FEE</Text>
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>Free during beta</Text>
                  <Text style={[styles.infoNote, { color: colors.textHint }]}>Paid events with MTN MoMo coming soon</Text>
                </View>
              </>
            )}

            <View style={{ height: 16 }} />
          </ScrollView>

          {/* Fixed footer button — never scrolls away */}
          <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.footerBtn, { backgroundColor: colors.primary, opacity: posting ? 0.6 : 1 }]}
              onPress={step < 3 ? handleContinue : handlePost}
              disabled={posting}
              activeOpacity={0.87}
            >
              <Text style={styles.footerBtnTxt}>
                {step < 3 ? 'Continue →' : posting ? 'Posting...' : '🚀  Post Event'}
              </Text>
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  )
}

// ── Small helpers ────────────────────────────────────────────

function GateItem({ done, label, colors }) {
  return (
    <View style={styles.gateItem}>
      <View style={[styles.gateDot, { backgroundColor: done ? colors.success : colors.border }]}>
        {done && <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>✓</Text>}
      </View>
      <Text style={[styles.gateItemTxt, { color: done ? colors.textPrimary : colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  )
}

function FieldWrap({ label, hint, error, children, colors }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      {children}
      {error
        ? <Text style={[styles.errorTxt, { color: colors.error }]}>{error}</Text>
        : hint
        ? <Text style={[styles.hint, { color: colors.textHint }]}>{hint}</Text>
        : null
      }
    </View>
  )
}

function WebOrNative({ value, onChange, placeholder, maxLength, multiline, autoCapitalize, keyboardType, inputType, error, colors }) {
  const borderColor = error ? colors.error : colors.border
  if (Platform.OS === 'web') {
    if (multiline) {
      return (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength || 1000}
          rows={5}
          style={{
            width: '100%', boxSizing: 'border-box',
            backgroundColor: colors.surface, color: colors.textPrimary,
            border: `1.5px solid ${borderColor}`, borderRadius: 12,
            padding: '13px 14px', fontSize: 16, fontFamily: 'inherit',
            resize: 'none', outline: 'none', display: 'block', minHeight: 120,
          }}
        />
      )
    }
    return (
      <input
        value={value}
        onChange={e => {
          let v = e.target.value
          if (inputType === 'number') v = v.replace(/\D/g, '')
          onChange(v)
        }}
        placeholder={placeholder}
        maxLength={maxLength || 80}
        type={inputType === 'number' ? 'number' : 'text'}
        min={inputType === 'number' ? 2 : undefined}
        style={{
          width: '100%', boxSizing: 'border-box',
          backgroundColor: colors.surface, color: colors.textPrimary,
          border: `1.5px solid ${borderColor}`, borderRadius: 12,
          padding: '13px 14px', fontSize: 16, fontFamily: 'inherit',
          outline: 'none', display: 'block',
        }}
      />
    )
  }
  return (
    <TextInput
      style={[
        styles.textInput,
        multiline && styles.textArea,
        { backgroundColor: colors.surface, borderColor, color: colors.textPrimary }
      ]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={colors.textHint}
      multiline={multiline}
      numberOfLines={multiline ? 5 : 1}
      autoCapitalize={autoCapitalize || 'none'}
      keyboardType={keyboardType || 'default'}
      maxLength={maxLength}
      selectionColor={colors.primary}
      underlineColorAndroid="transparent"
    />
  )
}

const styles = StyleSheet.create({
  safe:  { flex: 1, alignItems: 'center' },
  phone: { flex: 1, width: '100%' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  backBtn:     { padding: 4 },
  backTxt:     { fontSize: 22, fontWeight: '700' },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  stepNum:     { fontSize: 13, fontWeight: '600', minWidth: 30, textAlign: 'right' },

  progressRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 10 },
  bar: { flex: 1, height: 3, borderRadius: 2 },

  body:      { padding: 20, paddingBottom: 16 },
  stepTitle: { fontSize: 22, fontWeight: '900', marginBottom: 20, letterSpacing: -0.3 },

  fieldWrap:  { marginBottom: 18 },
  fieldLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7 },
  errorTxt:   { fontSize: 12, marginTop: 4 },
  hint:       { fontSize: 11, marginTop: 4 },

  textInput: {
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14, fontSize: 15,
  },
  textArea: { minHeight: 120, textAlignVertical: 'top' },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    borderRadius: 20, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  chipTxt: { fontSize: 13, fontWeight: '600' },

  infoBox:   { borderRadius: 12, padding: 14, marginTop: 4 },
  infoLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  infoNote:  { fontSize: 12, marginTop: 3 },

  footer: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  footerBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  footerBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },

  // Gate screen
  gateWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  gateTitle: { fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  gateSub:   { fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 28 },
  gateChecklist: { borderRadius: 14, padding: 16, width: '100%', marginBottom: 24, gap: 14 },
  gateItem:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gateDot:   { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  gateItemTxt: { fontSize: 15, fontWeight: '600' },
  gateBtn:   { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  gateBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  gateSkip:  { fontSize: 14, textDecorationLine: 'underline' },
})
