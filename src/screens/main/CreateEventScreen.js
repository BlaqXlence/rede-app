/**
 * CreateEventScreen.js
 *
 * 3-step event creation.
 * - Back arrow on step 1 exits the screen (goes back to previous page)
 * - Back arrow on steps 2/3 goes to previous step
 * - Post Event button is ALWAYS visible in a fixed footer — never gets lost
 * - On steps 1/2 it shows "Continue →", greyed if current step invalid
 * - Max attendees: numbers only, minimum 2
 */
import React, { useState, useMemo } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, Alert, TextInput,
  KeyboardAvoidingView, Dimensions,
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

const BLANK = {
  title: '', category: null,
  date: '', startTime: '', endTime: '',
  location: { cityId: 'kampala', area: '', venueName: '', lat: 0.3476, lng: 32.5825 },
  description: '', photoUri: null, photoFile: null, maxAttendees: '',
}

// Default cover images per category if user doesn't upload one
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

export default function CreateEventScreen({ navigation }) {
  const { colors }      = useThemeStore()
  const { createEvent } = useEventsStore()
  const { user }        = useAuthStore()

  const [step,    setStep]    = useState(1)
  const [form,    setForm]    = useState(BLANK)
  const [errors,  setErrors]  = useState({})
  const [posting, setPosting] = useState(false)

  function setField(field, value) {
    setForm(p => ({ ...p, [field]: value }))
    if (errors[field]) setErrors(p => ({ ...p, [field]: null }))
  }

  // Validate current step — returns error object
  function validate(s) {
    const e = {}
    if (s === 1) {
      if (!form.title.trim() || form.title.trim().length < 5)
        e.title = 'Title needs at least 5 characters'
      if (!form.category)
        e.category = 'Pick a category'
    }
    if (s === 2) {
      if (!form.date)
        e.date = 'Pick a date'
      else if (form.startTime) {
        const d = new Date(`${form.date}T${form.startTime}:00`)
        if (d < new Date(Date.now() + 2 * 3_600_000))
          e.date = 'Event must start at least 2 hours from now'
      }
      if (!form.startTime) e.startTime = 'Set a start time'
      if (!form.endTime)   e.endTime   = 'Set an end time'
      if (form.startTime && form.endTime && form.endTime <= form.startTime)
        e.endTime = 'End time must be after start time'
      if (!form.location?.venueName?.trim())
        e.location = 'Enter the venue or landmark name'
    }
    if (s === 3) {
      if (!form.description.trim() || form.description.trim().length < 50)
        e.description = 'Describe your event (min 50 characters)'
      const max = form.maxAttendees ? parseInt(form.maxAttendees, 10) : null
      if (max !== null && (isNaN(max) || max < 2))
        e.maxAttendees = 'Must be at least 2 attendees'
    }
    return e
  }

  // Is the current step valid enough to proceed?
  const stepValid = useMemo(() => {
    return Object.keys(validate(step)).length === 0
  }, [form, step])

  function handleBack() {
    if (step === 1) {
      // Exit the create flow entirely — go back to previous screen
      navigation.goBack()
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

    if (!user?.name || user.name.trim().length < 2) {
      Alert.alert(
        'Complete your profile first',
        'Add your name in Profile before creating events.',
        [
          { text: 'Go to Profile', onPress: () => navigation.navigate('Profile') },
          { text: 'Cancel', style: 'cancel' },
        ]
      )
      return
    }

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
          lat:       form.location.lat || 0.3476,
          lng:       form.location.lng || 32.5825,
          mapsLink:  form.location.mapsLink || null,
        },
        maxAttendees: form.maxAttendees ? parseInt(form.maxAttendees, 10) : null,
        entryFee: 0, originalFee: null, tags: [],
      })

      setForm(BLANK)
      setStep(1)
      navigation.navigate('EventDetail', { eventId: event.id, event })
    } catch (err) {
      Alert.alert('Could not post event', err.message || 'Check your connection and try again.')
    } finally {
      setPosting(false)
    }
  }

  // Progress bar colour
  function barColor(i) {
    if (i < step)  return colors.primary
    if (i === step) return colors.primary
    return colors.border
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.phone, { maxWidth: MAX_W }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}
        >

          {/* ── Header — back arrow always present ──── */}
          <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={[styles.backTxt, { color: colors.primary }]}>←</Text>
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Create Event</Text>

            <Text style={[styles.stepIndicator, { color: colors.textHint }]}>{step}/3</Text>
          </View>

          {/* Progress bars */}
          <View style={[styles.progressRow, { backgroundColor: colors.surface }]}>
            {[1, 2, 3].map(i => (
              <View
                key={i}
                style={[styles.progressBar, { backgroundColor: i <= step ? colors.primary : colors.border }]}
              />
            ))}
          </View>

          {/* ── Scrollable content ───────────────────── */}
          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {/* STEP 1: Title + Category */}
            {step === 1 && (
              <>
                <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
                  What's the event?
                </Text>

                <Field label="Event Title" error={errors.title} colors={colors}>
                  {Platform.OS === 'web' ? (
                    <input
                      value={form.title}
                      onChange={e => setField('title', e.target.value)}
                      placeholder="e.g. Friday Rooftop Party"
                      maxLength={80}
                      style={webInput(colors, errors.title)}
                    />
                  ) : (
                    <TextInput
                      style={[styles.textInput, { backgroundColor: colors.surface, borderColor: errors.title ? colors.error : colors.border, color: colors.textPrimary }]}
                      value={form.title}
                      onChangeText={v => setField('title', v)}
                      placeholder="e.g. Friday Rooftop Party"
                      placeholderTextColor={colors.textHint}
                      autoCapitalize="sentences"
                      maxLength={80}
                      selectionColor={colors.primary}
                      underlineColorAndroid="transparent"
                    />
                  )}
                  <Text style={[styles.hint, { color: colors.textHint }]}>{form.title.length}/80</Text>
                </Field>

                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Category</Text>
                {errors.category && <Text style={[styles.errorTxt, { color: colors.error }]}>{errors.category}</Text>}
                <View style={styles.chipGrid}>
                  {CATS.map(cat => {
                    const active = form.category === cat.id
                    const accent = colors.cat[cat.id] || colors.primary
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => setField('category', cat.id)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active ? accent : colors.surface,
                            borderColor: active ? accent : colors.border,
                          }
                        ]}
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

            {/* STEP 2: Date, Time, Location */}
            {step === 2 && (
              <>
                <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
                  When & where?
                </Text>

                <DatePicker
                  label="Date"
                  value={form.date}
                  onChange={v => setField('date', v)}
                  error={errors.date}
                />
                <TimePicker
                  label="Start Time"
                  value={form.startTime}
                  onChange={v => setField('startTime', v)}
                  error={errors.startTime}
                />
                <TimePicker
                  label="End Time"
                  value={form.endTime}
                  onChange={v => setField('endTime', v)}
                  error={errors.endTime}
                />

                <LocationPicker
                  value={form.location}
                  onChange={loc => { setField('location', loc); setErrors(p => ({ ...p, location: null })) }}
                  error={errors.location}
                />
              </>
            )}

            {/* STEP 3: Description + Photo + Capacity */}
            {step === 3 && (
              <>
                <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
                  Tell people more
                </Text>

                <Field label="Description" error={errors.description} colors={colors}>
                  {Platform.OS === 'web' ? (
                    <textarea
                      value={form.description}
                      onChange={e => setField('description', e.target.value)}
                      placeholder="What's happening? Who should come? What to expect? (min 50 characters)"
                      maxLength={1000}
                      rows={5}
                      style={{ ...webInput(colors, errors.description), minHeight: 120, resize: 'none' }}
                    />
                  ) : (
                    <TextInput
                      style={[
                        styles.textInput, styles.textArea,
                        { backgroundColor: colors.surface, borderColor: errors.description ? colors.error : colors.border, color: colors.textPrimary }
                      ]}
                      value={form.description}
                      onChangeText={v => setField('description', v)}
                      placeholder="What's happening? Who should come? What to expect?"
                      placeholderTextColor={colors.textHint}
                      multiline numberOfLines={5}
                      autoCapitalize="sentences"
                      maxLength={1000}
                      selectionColor={colors.primary}
                      underlineColorAndroid="transparent"
                    />
                  )}
                  <Text style={[styles.hint, { color: colors.textHint }]}>
                    {form.description.length}/1000 · min 50 chars
                  </Text>
                </Field>

                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Cover Photo</Text>
                <PhotoUpload
                  uri={form.photoUri}
                  onSelect={(uri, file) => { setField('photoUri', uri); setField('photoFile', file) }}
                  onRemove={() => { setField('photoUri', null); setField('photoFile', null) }}
                />

                {/* Max attendees — numbers only, min 2 */}
                <Field
                  label="Max Attendees (optional)"
                  hint="Leave blank for unlimited. Minimum 2 if set."
                  error={errors.maxAttendees}
                  colors={colors}
                >
                  {Platform.OS === 'web' ? (
                    <input
                      value={form.maxAttendees}
                      onChange={e => {
                        const v = e.target.value.replace(/\D/g, '')
                        setField('maxAttendees', v)
                        setErrors(p => ({ ...p, maxAttendees: null }))
                      }}
                      placeholder="e.g. 50"
                      type="number"
                      min="2"
                      style={webInput(colors, errors.maxAttendees)}
                    />
                  ) : (
                    <TextInput
                      style={[
                        styles.textInput,
                        { backgroundColor: colors.surface, borderColor: errors.maxAttendees ? colors.error : colors.border, color: colors.textPrimary }
                      ]}
                      value={form.maxAttendees}
                      onChangeText={v => {
                        const clean = v.replace(/\D/g, '')
                        setField('maxAttendees', clean)
                        setErrors(p => ({ ...p, maxAttendees: null }))
                      }}
                      placeholder="e.g. 50"
                      placeholderTextColor={colors.textHint}
                      keyboardType="number-pad"
                      selectionColor={colors.primary}
                      underlineColorAndroid="transparent"
                    />
                  )}
                </Field>

                {/* Entry fee info */}
                <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.infoTitle, { color: colors.textHint }]}>Entry Fee</Text>
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>Free during beta</Text>
                  <Text style={[styles.infoNote, { color: colors.textHint }]}>
                    Paid events coming soon with MTN MoMo
                  </Text>
                </View>
              </>
            )}

            {/* Space so content isn't hidden behind footer */}
            <View style={{ height: 20 }} />
          </ScrollView>

          {/* ── Fixed footer — ALWAYS visible, never lost ── */}
          <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            {step < 3 ? (
              <TouchableOpacity
                style={[styles.footerBtn, { backgroundColor: colors.primary }]}
                onPress={handleContinue}
                activeOpacity={0.87}
              >
                <Text style={styles.footerBtnTxt}>Continue →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.footerBtn, { backgroundColor: colors.primary, opacity: posting ? 0.6 : 1 }]}
                onPress={handlePost}
                disabled={posting}
                activeOpacity={0.87}
              >
                <Text style={styles.footerBtnTxt}>
                  {posting ? 'Posting...' : '🚀  Post Event'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  )
}

/* ── Small helpers ──────────────────────────────────────────── */
function Field({ label, hint, error, colors, children }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      {children}
      {error ? (
        <Text style={[styles.errorTxt, { color: colors.error }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.hint, { color: colors.textHint }]}>{hint}</Text>
      ) : null}
    </View>
  )
}

function webInput(colors, error) {
  return {
    width: '100%', boxSizing: 'border-box',
    backgroundColor: colors.surface, color: colors.textPrimary,
    border: `1.5px solid ${error ? colors.error : colors.border}`,
    borderRadius: 12, padding: '13px 14px',
    fontSize: 16, fontFamily: 'inherit',
    outline: 'none', display: 'block',
  }
}

const styles = StyleSheet.create({
  safe:  { flex: 1, alignItems: 'center' },
  phone: { flex: 1, width: '100%' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn:       { padding: 4 },
  backTxt:       { fontSize: 22, fontWeight: '700' },
  headerTitle:   { fontSize: 17, fontWeight: '800' },
  stepIndicator: { fontSize: 13, fontWeight: '600', minWidth: 30, textAlign: 'right' },

  // Progress bars
  progressRow: {
    flexDirection: 'row', gap: 6,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12,
  },
  progressBar: { flex: 1, height: 3, borderRadius: 2 },

  // Body
  body: { padding: 20, paddingBottom: 16 },
  stepTitle: { fontSize: 22, fontWeight: '900', marginBottom: 20, letterSpacing: -0.3 },

  // Fields
  fieldWrap:  { marginBottom: 18 },
  fieldLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7 },
  errorTxt:   { fontSize: 12, marginTop: 4 },
  hint:       { fontSize: 11, marginTop: 4 },

  // Text inputs
  textInput: {
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15,
  },
  textArea: { minHeight: 120, textAlignVertical: 'top' },

  // Category chips
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    borderRadius: 20, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  chipTxt: { fontSize: 13, fontWeight: '600' },

  // Info box
  infoBox: { borderRadius: 12, padding: 14, marginTop: 4 },
  infoTitle: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  infoNote:  { fontSize: 12, marginTop: 3 },

  // Footer — fixed, always visible
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  footerBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerBtnTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
})
