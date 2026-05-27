/**
 * CreateEventScreen.js — 3-step event creation
 * Step 1: Title + Category
 * Step 2: Date/Time (stacked, no overlap) + Location
 * Step 3: Description + Photo + Capacity
 */
import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore from '../../store/themeStore'
import Input from '../../components/common/Input'
import { DatePicker, TimePicker } from '../../components/common/DateTimePicker'
import LocationPicker from '../../components/common/LocationPicker'
import PhotoUpload from '../../components/common/PhotoUpload'
import useEventsStore from '../../store/eventsStore'
import useAuthStore from '../../store/authStore'
import { EVENT_CATEGORIES } from '../../constants/config'

const CATS = EVENT_CATEGORIES.filter(c => c.id !== 'all')

const BLANK = {
  title: '', category: null,
  date: '', startTime: '', endTime: '',
  location: { cityId: 'kampala', area: '', venueName: '', lat: 0.3476, lng: 32.5825 },
  description: '', photoUri: null, photoFile: null, maxAttendees: '',
}

export default function CreateEventScreen({ navigation }) {
  const { colors } = useThemeStore()
  const [step, setStep]       = useState(1)
  const [form, setForm]       = useState(BLANK)
  const [errors, setErrors]   = useState({})
  const [posting, setPosting] = useState(false)
  const { createEvent } = useEventsStore()
  const { user }        = useAuthStore()

  function f(field, value) {
    setForm(p => ({ ...p, [field]: value }))
    if (errors[field]) setErrors(p => ({ ...p, [field]: null }))
  }

  function validate(s) {
    const e = {}
    if (s === 1) {
      if (!form.title.trim() || form.title.trim().length < 5)
        e.title = 'Title needs at least 5 characters'
      if (!form.category) e.category = 'Pick a category'
    }
    if (s === 2) {
      if (!form.date) {
        e.date = 'Pick a date'
      } else if (form.startTime) {
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
        e.description = 'Describe your event (minimum 50 characters)'
    }
    return e
  }

  function handleNext() {
    const e = validate(step)
    if (Object.keys(e).length) { setErrors(e); return }
    setStep(s => s + 1)
  }

  function checkProfile() {
    if (!user?.name || user.name.trim().length < 2) {
      Alert.alert(
        'Complete profile first',
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
    const e = validate(3)
    if (Object.keys(e).length) { setErrors(e); return }
    if (!checkProfile()) return
    setPosting(true)
    try {
      const startTime = new Date(`${form.date}T${form.startTime}:00`).toISOString()
      const endTime   = new Date(`${form.date}T${form.endTime}:00`).toISOString()
      const defaults = {
        party: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600',
        sports: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600',
        dancing: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=600',
        food: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
        music: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600',
        games: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=600',
        outdoor: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600',
        art: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600',
      }
      const event = await createEvent({
        title:        form.title.trim(),
        category:     form.category,
        description:  form.description.trim(),
        coverImage:   form.photoUri || defaults[form.category] || defaults.party,
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
      Alert.alert('Could not post event', err.message || 'Try again.')
    } finally {
      setPosting(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {step > 1
              ? <TouchableOpacity onPress={() => setStep(s => s - 1)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
              : <View style={{ width: 60 }} />
            }
            <Text style={styles.headingText}>Create Event</Text>
            <Text style={styles.stepText}>{step}/3</Text>
          </View>
          <View style={styles.bars}>
            {[1,2,3].map(i => (
              <View key={i} style={[styles.bar, i <= step && styles.barOn, i === step && styles.barCurr]} />
            ))}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ─── Step 1: Title + Category ─── */}
          {step === 1 && (
            <View>
              <Text style={styles.stepHeading}>What's the event?</Text>
              <Input
                label="Event Title"
                value={form.title}
                onChangeText={v => f('title', v)}
                placeholder="e.g. Friday Night Rooftop Party"
                autoCapitalize="sentences" maxLength={80}
                error={errors.title} hint={`${form.title.length}/80`}
              />
              <Text style={styles.sectionLabel}>Category</Text>
              {errors.category ? <Text style={styles.errText}>{errors.category}</Text> : null}
              <View style={styles.chips}>
                {CATS.map(cat => {
                  const active = form.category === cat.id
                  const accent = colors.cat[cat.id] || colors.primary
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.chip, active && { backgroundColor: accent, borderColor: accent }]}
                      onPress={() => f('category', cat.id)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, active && { color: '#fff' }]}>{cat.label}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          )}

          {/* ─── Step 2: Date, Time, Location ─── */}
          {step === 2 && (
            <View>
              <Text style={styles.stepHeading}>When & where?</Text>

              {/* Date — full width, its own block */}
              <DatePicker label="Date" value={form.date} onChange={v => f('date', v)} error={errors.date} />

              {/* Start and end time — each in their own block, stacked */}
              <TimePicker label="Start Time" value={form.startTime} onChange={v => f('startTime', v)} error={errors.startTime} />
              <TimePicker label="End Time"   value={form.endTime}   onChange={v => f('endTime', v)}   error={errors.endTime} />

              {/* Location */}
              <LocationPicker
                value={form.location}
                onChange={loc => { f('location', loc); if (errors.location) setErrors(p => ({ ...p, location: null })) }}
                error={errors.location}
              />
            </View>
          )}

          {/* ─── Step 3: Description + Photo ─── */}
          {step === 3 && (
            <View>
              <Text style={styles.stepHeading}>Tell people more</Text>
              <Input
                label="Description"
                value={form.description}
                onChangeText={v => f('description', v)}
                placeholder="What's happening? Who should come? What to expect?"
                multiline numberOfLines={5}
                autoCapitalize="sentences" maxLength={1000}
                error={errors.description}
                hint={`${form.description.length}/1000 · min 50 characters`}
              />
              <Text style={styles.sectionLabel}>Cover Photo</Text>
              <PhotoUpload
                uri={form.photoUri}
                onSelect={(uri, file) => { f('photoUri', uri); f('photoFile', file) }}
                onRemove={() => { f('photoUri', null); f('photoFile', null) }}
              />
              <Input
                label="Max Attendees (optional)"
                value={form.maxAttendees} onChangeText={v => f('maxAttendees', v)}
                placeholder="Leave blank for unlimited" keyboardType="number-pad"
              />
              <View style={styles.feeBox}>
                <Text style={styles.feeTitle}>Entry Fee</Text>
                <Text style={styles.feeValue}>Free during beta</Text>
                <Text style={styles.feeNote}>Paid events coming with MTN MoMo integration</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step < 3
            ? <TouchableOpacity style={styles.btn} onPress={handleNext} activeOpacity={0.85}>
                <Text style={styles.btnText}>Continue →</Text>
              </TouchableOpacity>
            : <TouchableOpacity style={[styles.btn, posting && { opacity: 0.5 }]} onPress={handlePost} disabled={posting} activeOpacity={0.85}>
                <Text style={styles.btnText}>{posting ? 'Posting...' : 'Post Event'}</Text>
              </TouchableOpacity>
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
  backText: { fontSize: 14, color: colors.primary, fontWeight: '600', minWidth: 60 },
  headingText: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  stepText: { fontSize: 13, color: colors.textHint, fontWeight: '600', minWidth: 60, textAlign: 'right' },
  bars: { flexDirection: 'row', gap: 6 },
  bar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.border },
  barOn: { backgroundColor: 'rgba(124,58,237,0.35)' },
  barCurr: { backgroundColor: colors.primary },
  body: { padding: 20, paddingBottom: 16 },
  stepHeading: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  errText: { fontSize: 12, color: colors.error, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  feeBox: { backgroundColor: colors.surface, borderRadius: 10, padding: 14 },
  feeTitle: { fontSize: 11, fontWeight: '700', color: colors.textHint, textTransform: 'uppercase', letterSpacing: 0.5 },
  feeValue: { fontSize: 15, fontWeight: '700', color: colors.textSecondary, marginTop: 4 },
  feeNote: { fontSize: 12, color: colors.textHint, marginTop: 3 },
  footer: { padding: 16, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  btn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
