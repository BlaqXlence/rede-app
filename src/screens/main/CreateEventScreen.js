import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import colors from '../../constants/colors'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import CategoryFilter from '../../components/events/CategoryFilter'
import useEventsStore from '../../store/eventsStore'
import { validateEventTitle, validateEventDescription, validateEventDate, validateEventLocation, validateMaxAttendees } from '../../utils/validators'
import { PAYMENT } from '../../constants/config'

const TOTAL_STEPS = 3

const BLANK = {
  title: '', category: null, description: '', coverImage: null,
  startDate: '', startTime: '', endTime: '',
  locationName: '', locationAddress: '', locationLat: null, locationLng: null,
  maxAttendees: '', entryFee: '0',
}

export default function CreateEventScreen({ navigation }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(BLANK)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const { createEvent, userLocation } = useEventsStore()

  function f(field, value) {
    setForm(p => ({ ...p, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  async function pickCover() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') return
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [16, 9], quality: 0.8 })
    if (!result.canceled) f('coverImage', result.assets[0].uri)
  }

  function buildISO(date, time) {
    if (!date || !time) return null
    try { return new Date(`${date}T${time}`).toISOString() } catch { return null }
  }

  function validateStep(s) {
    const errs = {}
    if (s === 1) {
      const te = validateEventTitle(form.title)
      if (te) errs.title = te
      if (!form.category) errs.category = 'Pick a category'
    }
    if (s === 2) {
      const de = validateEventDate(buildISO(form.startDate, form.startTime))
      if (de) errs.startDate = de
      if (!form.endTime) errs.endTime = 'Add an end time'
      const le = validateEventLocation({ name: form.locationName })
      if (le) errs.locationName = le
    }
    if (s === 3) {
      const de = validateEventDescription(form.description)
      if (de) errs.description = de
      const ae = validateMaxAttendees(form.maxAttendees)
      if (ae) errs.maxAttendees = ae
    }
    return errs
  }

  function handleNext() {
    const errs = validateStep(step)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setStep(s => s + 1)
  }

  async function handleSubmit() {
    const errs = validateStep(3)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitting(true)
    try {
      const event = createEvent({
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
        coverImage: form.coverImage || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600',
        startTime: buildISO(form.startDate, form.startTime),
        endTime: buildISO(form.startDate, form.endTime) || buildISO(form.startDate, form.startTime),
        location: {
          lat: userLocation?.lat || 0.3136,
          lng: userLocation?.lng || 32.5811,
          name: form.locationName.trim(),
          address: form.locationAddress.trim() || form.locationName.trim(),
        },
        maxAttendees: form.maxAttendees ? parseInt(form.maxAttendees, 10) : null,
        entryFee: 0,
        originalFee: null,
        tags: [],
      })
      setForm(BLANK)
      setStep(1)
      navigation.navigate('EventDetail', { eventId: event.id })
    } catch (e) {
      Alert.alert('Could not create event', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.heading}>Create Event</Text>
          <View style={styles.steps}>
            {[1, 2, 3].map(i => (
              <View key={i} style={[styles.stepDot, i <= step && styles.stepDotActive, i === step && styles.stepDotCurrent]} />
            ))}
          </View>
          <Text style={styles.stepLabel}>Step {step} of {TOTAL_STEPS}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Step 1 */}
          {step === 1 && (
            <View>
              <Text style={styles.stepTitle}>What's happening? 🎭</Text>
              <Input label="Event Title" value={form.title} onChangeText={v => f('title', v)}
                placeholder="e.g. Friday Night Rooftop Party"
                autoCapitalize="sentences" maxLength={80} error={errors.title}
                hint={`${form.title.length}/80`} />
              <Text style={styles.fieldLabel}>Category</Text>
              {errors.category && <Text style={styles.fieldError}>{errors.category}</Text>}
              <CategoryFilter selected={form.category || 'all'} onSelect={v => f('category', v === 'all' ? null : v)} />
            </View>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <View>
              <Text style={styles.stepTitle}>When & where? 📍</Text>
              <Input label="Date" value={form.startDate} onChangeText={v => f('startDate', v)}
                placeholder="YYYY-MM-DD  e.g. 2025-08-15"
                keyboardType="numbers-and-punctuation" error={errors.startDate} />
              <View style={styles.row}>
                <Input label="Start Time" value={form.startTime} onChangeText={v => f('startTime', v)}
                  placeholder="19:00" keyboardType="numbers-and-punctuation" style={styles.half} />
                <Input label="End Time" value={form.endTime} onChangeText={v => f('endTime', v)}
                  placeholder="23:00" keyboardType="numbers-and-punctuation" error={errors.endTime} style={styles.half} />
              </View>
              <Input label="Venue Name" value={form.locationName} onChangeText={v => f('locationName', v)}
                placeholder="e.g. Kololo Heights Club" autoCapitalize="words" error={errors.locationName} />
              <Input label="Full Address" value={form.locationAddress} onChangeText={v => f('locationAddress', v)}
                placeholder="e.g. Acacia Ave, Kololo, Kampala" autoCapitalize="words"
                hint="The more specific the better" />
            </View>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <View>
              <Text style={styles.stepTitle}>Tell people more 📝</Text>
              <Input label="Description" value={form.description} onChangeText={v => f('description', v)}
                placeholder="What's happening? Who should come? What to bring?"
                multiline numberOfLines={5} autoCapitalize="sentences"
                maxLength={1000} error={errors.description}
                hint={`${form.description.length}/1000`} />
              <Text style={styles.fieldLabel}>Cover Photo</Text>
              <TouchableOpacity style={styles.photoPicker} onPress={pickCover}>
                <Text style={styles.photoText}>
                  {form.coverImage ? '✅  Photo selected — tap to change' : '📷  Add a cover photo'}
                </Text>
              </TouchableOpacity>
              <Input label="Max Attendees (optional)" value={form.maxAttendees}
                onChangeText={v => f('maxAttendees', v)}
                placeholder="Leave blank for unlimited"
                keyboardType="number-pad" error={errors.maxAttendees} />
              <View style={styles.feeLocked}>
                <Text style={styles.feeLockedLabel}>Entry Fee</Text>
                <Text style={styles.feeLockedValue}>Free during beta</Text>
                <Text style={styles.feeLockedNote}>💳 Paid events unlock when payment goes live</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.nav}>
          {step > 1 && <Button label="Back" variant="secondary" onPress={() => setStep(s => s - 1)} style={styles.navBack} />}
          {step < 3
            ? <Button label="Next →" onPress={handleNext} style={styles.navNext} />
            : <Button label="Publish 🎉" onPress={handleSubmit} loading={submitting} style={styles.navNext} />
          }
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.surface, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  heading: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 10 },
  steps: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  stepDot: { height: 4, flex: 1, borderRadius: 2, backgroundColor: colors.border },
  stepDotActive: { backgroundColor: colors.primaryLight },
  stepDotCurrent: { backgroundColor: colors.primary },
  stepLabel: { fontSize: 12, color: colors.textHint, fontWeight: '600' },
  content: { padding: 20, paddingBottom: 10 },
  stepTitle: { fontSize: 19, fontWeight: '800', color: colors.textPrimary, marginBottom: 18 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  fieldError: { fontSize: 12, color: colors.error, marginBottom: 4 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  photoPicker: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, borderStyle: 'dashed', padding: 18, alignItems: 'center', marginBottom: 16 },
  photoText: { fontSize: 14, color: colors.textSecondary },
  feeLocked: { backgroundColor: colors.surface, borderRadius: 10, padding: 14 },
  feeLockedLabel: { fontSize: 11, fontWeight: '700', color: colors.textHint, textTransform: 'uppercase', letterSpacing: 0.5 },
  feeLockedValue: { fontSize: 16, fontWeight: '700', color: colors.textSecondary, marginTop: 4 },
  feeLockedNote: { fontSize: 12, color: colors.textHint, marginTop: 4 },
  nav: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  navBack: { flex: 1 },
  navNext: { flex: 2 },
})
