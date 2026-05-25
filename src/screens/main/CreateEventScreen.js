/**
 * CreateEventScreen.js
 * 3-step event creation with:
 * - Step 1: Title + Category
 * - Step 2: Date/Time + Venue Name + Full Address (separate fields)
 * - Step 3: Description + Photo + Capacity
 *
 * THE BUG FIX: createEvent is properly awaited.
 */
import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import colors from '../../constants/colors'
import Input from '../../components/common/Input'
import { DatePicker, TimePicker } from '../../components/common/DateTimePicker'
import AddressSearch from '../../components/common/AddressSearch'
import PhotoUpload from '../../components/common/PhotoUpload'
import useEventsStore from '../../store/eventsStore'
import useAuthStore from '../../store/authStore'
import { EVENT_CATEGORIES } from '../../constants/config'

const CATEGORIES = EVENT_CATEGORIES.filter(c => c.id !== 'all')

const BLANK = {
  title: '', category: null,
  date: '', startTime: '', endTime: '',
  venueName: '',       // e.g. "Kololo Heights Club"
  venueAddress: '',    // e.g. "Acacia Ave, Kololo, Kampala"
  locationLat: null,
  locationLng: null,
  description: '',
  photoUri: null, photoFile: null,
  maxAttendees: '',
}

export default function CreateEventScreen({ navigation }) {
  const [step, setStep]       = useState(1)
  const [form, setForm]       = useState(BLANK)
  const [errors, setErrors]   = useState({})
  const [posting, setPosting] = useState(false)

  const { createEvent } = useEventsStore()
  const { user }        = useAuthStore()

  function f(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  // Address search fills venue name + address + coords
  function handleAddressSelect(loc) {
    setForm(prev => ({
      ...prev,
      venueName:    prev.venueName || loc.name,  // don't overwrite if already typed
      venueAddress: loc.address,
      locationLat:  loc.lat,
      locationLng:  loc.lng,
    }))
    if (errors.venueAddress) setErrors(prev => ({ ...prev, venueAddress: null }))
  }

  function validate(s) {
    const errs = {}
    if (s === 1) {
      if (!form.title.trim() || form.title.trim().length < 5)
        errs.title = 'Title needs at least 5 characters'
      if (!form.category) errs.category = 'Pick a category'
    }
    if (s === 2) {
      if (!form.date) {
        errs.date = 'Pick a date'
      } else if (form.startTime) {
        const start = new Date(`${form.date}T${form.startTime}:00`)
        if (start < new Date(Date.now() + 2 * 3_600_000))
          errs.date = 'Event must start at least 2 hours from now'
      }
      if (!form.startTime) errs.startTime = 'Set a start time'
      if (!form.endTime)   errs.endTime   = 'Set an end time'
      if (form.startTime && form.endTime && form.endTime <= form.startTime)
        errs.endTime = 'End time must be after start time'
      if (!form.venueName.trim())
        errs.venueName = 'Enter the venue name'
    }
    if (s === 3) {
      if (!form.description.trim() || form.description.trim().length < 50)
        errs.description = 'Describe your event (min 50 characters)'
    }
    return errs
  }

  function handleNext() {
    const errs = validate(step)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setStep(s => s + 1)
  }

  function checkProfile() {
    if (!user?.name || user.name.trim().length < 2) {
      Alert.alert(
        'Complete your profile first',
        'Add your name in Profile before creating events.',
        [
          { text: 'Go to Profile', onPress: () => navigation.navigate('Profile') },
          { text: 'Cancel', style: 'cancel' },
        ]
      )
      return false
    }
    return true
  }

  async function handlePost() {
    const errs = validate(3)
    if (Object.keys(errs).length) { setErrors(errs); return }
    if (!checkProfile()) return

    setPosting(true)
    try {
      const startTime = new Date(`${form.date}T${form.startTime}:00`).toISOString()
      const endTime   = new Date(`${form.date}T${form.endTime}:00`).toISOString()

      const defaultCovers = {
        party:   'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600',
        sports:  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600',
        dancing: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=600',
        food:    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
        music:   'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600',
        games:   'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=600',
        outdoor: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600',
        art:     'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600',
        wellness:'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600',
        comedy:  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600',
        kids:    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600',
        fashion: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600',
        tech:    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600',
      }

      // Await properly — this was the bug that caused "Event not found"
      const event = await createEvent({
        title:        form.title.trim(),
        category:     form.category,
        description:  form.description.trim(),
        coverImage:   form.photoUri || defaultCovers[form.category] || defaultCovers.party,
        startTime,
        endTime,
        location: {
          name:    form.venueName.trim(),
          address: form.venueAddress.trim() || form.venueName.trim(),
          lat:     form.locationLat || 0.3136,
          lng:     form.locationLng || 32.5811,
        },
        maxAttendees: form.maxAttendees ? parseInt(form.maxAttendees, 10) : null,
        entryFee: 0,
        originalFee: null,
        tags: [],
      })

      setForm(BLANK)
      setStep(1)
      navigation.navigate('EventDetail', { eventId: event.id, event })
    } catch (err) {
      Alert.alert('Could not post event', err.message || 'Please try again.')
    } finally {
      setPosting(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {step > 1
              ? <TouchableOpacity onPress={() => setStep(s => s - 1)}>
                  <Text style={styles.back}>← Back</Text>
                </TouchableOpacity>
              : <View style={{ minWidth: 60 }} />
            }
            <Text style={styles.heading}>Create Event</Text>
            <Text style={styles.stepNum}>{step}/3</Text>
          </View>
          <View style={styles.progressRow}>
            {[1,2,3].map(i => (
              <View
                key={i}
                style={[styles.bar, i <= step && styles.barActive, i === step && styles.barCurrent]}
              />
            ))}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Step 1 — Title + Category */}
          {step === 1 && (
            <View>
              <Text style={styles.stepTitle}>What's the event?</Text>
              <Input
                label="Event Title"
                value={form.title}
                onChangeText={v => f('title', v)}
                placeholder="e.g. Friday Night Rooftop Party"
                autoCapitalize="sentences"
                maxLength={80}
                error={errors.title}
                hint={`${form.title.length}/80`}
              />
              <Text style={styles.fieldLabel}>Category</Text>
              {errors.category ? <Text style={styles.fieldErr}>{errors.category}</Text> : null}
              <View style={styles.chips}>
                {CATEGORIES.map(cat => {
                  const active = form.category === cat.id
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.chip,
                        active && { backgroundColor: cat.accent, borderColor: cat.accent },
                      ]}
                      onPress={() => f('category', cat.id)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          )}

          {/* Step 2 — When & Where */}
          {step === 2 && (
            <View>
              <Text style={styles.stepTitle}>When & where?</Text>

              <DatePicker
                label="Date"
                value={form.date}
                onChange={v => f('date', v)}
                error={errors.date}
              />

              <View style={styles.timeRow}>
                <View style={{ flex: 1 }}>
                  <TimePicker
                    label="Start Time"
                    value={form.startTime}
                    onChange={v => f('startTime', v)}
                    error={errors.startTime}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TimePicker
                    label="End Time"
                    value={form.endTime}
                    onChange={v => f('endTime', v)}
                    error={errors.endTime}
                  />
                </View>
              </View>

              {/* Venue name — what people call the place */}
              <Input
                label="Venue Name"
                value={form.venueName}
                onChangeText={v => f('venueName', v)}
                placeholder="e.g. Kololo Heights Club, Tank Hill Garden"
                autoCapitalize="words"
                error={errors.venueName}
              />

              {/* Address search — populates address + coordinates */}
              <AddressSearch
                value={form.venueAddress ? { name: form.venueAddress } : null}
                onSelect={handleAddressSelect}
                error={errors.venueAddress}
              />

              {/* If coords are set from search, show confirmation */}
              {form.locationLat && (
                <View style={styles.locConfirm}>
                  <Text style={styles.locConfirmText}>
                    ✓ Location pinned — {form.venueAddress || form.venueName}
                  </Text>
                </View>
              )}

              {/* Full address override */}
              <Input
                label="Full Address (optional)"
                value={form.venueAddress}
                onChangeText={v => f('venueAddress', v)}
                placeholder="Street, area, city"
                autoCapitalize="words"
                hint="Edit or add more detail to the address above"
              />
            </View>
          )}

          {/* Step 3 — Details */}
          {step === 3 && (
            <View>
              <Text style={styles.stepTitle}>Tell people more</Text>
              <Input
                label="Description"
                value={form.description}
                onChangeText={v => f('description', v)}
                placeholder="What's happening? Who should come? What to expect?"
                multiline numberOfLines={5}
                autoCapitalize="sentences"
                maxLength={1000}
                error={errors.description}
                hint={`${form.description.length}/1000 · min 50 characters`}
              />
              <Text style={styles.fieldLabel}>Cover Photo</Text>
              <PhotoUpload
                uri={form.photoUri}
                onSelect={(uri, file) => { f('photoUri', uri); f('photoFile', file) }}
                onRemove={() => { f('photoUri', null); f('photoFile', null) }}
              />
              <Input
                label="Max Attendees (optional)"
                value={form.maxAttendees}
                onChangeText={v => f('maxAttendees', v)}
                placeholder="Leave blank for unlimited"
                keyboardType="number-pad"
              />
              <View style={styles.feeLocked}>
                <Text style={styles.feeTitle}>Entry Fee</Text>
                <Text style={styles.feeValue}>Free during beta</Text>
                <Text style={styles.feeNote}>Paid events coming soon</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {step < 3
            ? (
              <TouchableOpacity style={styles.continueBtn} onPress={handleNext} activeOpacity={0.85}>
                <Text style={styles.continueBtnText}>Continue →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.postBtn, posting && { opacity: 0.5 }]}
                onPress={handlePost}
                disabled={posting}
                activeOpacity={0.85}
              >
                <Text style={styles.postBtnText}>{posting ? 'Posting...' : 'Post Event'}</Text>
              </TouchableOpacity>
            )
          }
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  back: { fontSize: 14, color: colors.primary, fontWeight: '600', minWidth: 60 },
  heading: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  stepNum: { fontSize: 13, color: colors.textHint, fontWeight: '600', minWidth: 60, textAlign: 'right' },
  progressRow: { flexDirection: 'row', gap: 6 },
  bar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.border },
  barActive: { backgroundColor: 'rgba(255,102,0,0.4)' },
  barCurrent: { backgroundColor: colors.primary },
  content: { padding: 20, paddingBottom: 12 },
  stepTitle: {
    fontSize: 20, fontWeight: '800', color: colors.textPrimary,
    marginBottom: 20, letterSpacing: -0.3,
  },
  fieldLabel: {
    fontSize: 12, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  fieldErr: { fontSize: 12, color: colors.error, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 20, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 8,
  },
  chipLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipLabelActive: { color: '#fff' },
  timeRow: { flexDirection: 'row', gap: 12 },
  locConfirm: {
    backgroundColor: colors.primaryFaint, borderRadius: 8,
    padding: 10, marginBottom: 12,
  },
  locConfirmText: { fontSize: 13, color: colors.primary, fontWeight: '500' },
  feeLocked: {
    backgroundColor: colors.surface, borderRadius: 10,
    padding: 14, marginTop: 4,
  },
  feeTitle: {
    fontSize: 11, fontWeight: '700', color: colors.textHint,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  feeValue: { fontSize: 16, fontWeight: '700', color: colors.textSecondary, marginTop: 4 },
  feeNote: { fontSize: 12, color: colors.textHint, marginTop: 3 },
  footer: {
    padding: 16, backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  continueBtn: {
    backgroundColor: colors.primary, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  continueBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  postBtn: {
    backgroundColor: colors.primary, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  postBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
