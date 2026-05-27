/**
 * EditEventScreen.js
 *
 * Fixed: Save Changes actually calls the API and shows feedback.
 * Theme-aware: respects dark/light mode.
 * Date cannot be changed if the event starts in less than 5 hours.
 */
import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore  from '../../store/themeStore'
import useEventsStore from '../../store/eventsStore'
import Input          from '../../components/common/Input'
import { eventsApi }  from '../../services/api'

export default function EditEventScreen({ navigation, route }) {
  const { event }    = route.params
  const { colors }   = useThemeStore()
  const { events, setEventsLocal } = useEventsStore()

  const hoursUntilStart = (new Date(event.startTime) - Date.now()) / 3_600_000
  const canEditDate     = hoursUntilStart > 5

  const [title,       setTitle]       = useState(event.title)
  const [description, setDescription] = useState(event.description)
  const [maxAttendees,setMaxAttendees]= useState(event.maxAttendees?.toString() || '')
  const [saving, setSaving]           = useState(false)
  const [errors, setErrors]           = useState({})

  function validate() {
    const e = {}
    if (!title.trim() || title.trim().length < 5)
      e.title = 'Title needs at least 5 characters'
    if (!description.trim() || description.trim().length < 50)
      e.description = 'Description needs at least 50 characters'
    if (maxAttendees && (isNaN(parseInt(maxAttendees)) || parseInt(maxAttendees) < 2))
      e.maxAttendees = 'Must be at least 2'
    return e
  }

  async function handleSave() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    setSaving(true)
    try {
      const res = await eventsApi.update(event.id, {
        title:        title.trim(),
        description:  description.trim(),
        max_attendees: maxAttendees ? parseInt(maxAttendees) : null,
      })

      // Update local store so the detail screen shows new data immediately
      const updated = events.map(ev => ev.id === event.id ? res.event : ev)
      setEventsLocal(updated)

      Alert.alert('Saved!', 'Your event has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ])
    } catch (err) {
      Alert.alert('Could not save', err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={[styles.back, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.heading, { color: colors.textPrimary }]}>Edit Event</Text>
          <View style={{ minWidth: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Warning if event starts soon */}
          {!canEditDate && (
            <View style={[styles.warning, { backgroundColor: colors.warning + '22', borderColor: colors.warning }]}>
              <Text style={[styles.warningTxt, { color: colors.warning }]}>
                ⚠️ Event starts in less than 5 hours. Date and time cannot be changed.
              </Text>
            </View>
          )}

          <Input
            label="Event Title"
            value={title}
            onChangeText={v => { setTitle(v); setErrors(p => ({ ...p, title: null })) }}
            placeholder="Event title"
            autoCapitalize="sentences"
            maxLength={80}
            error={errors.title}
            hint={`${title.length}/80`}
          />

          <Input
            label="Description"
            value={description}
            onChangeText={v => { setDescription(v); setErrors(p => ({ ...p, description: null })) }}
            placeholder="Describe your event..."
            multiline
            numberOfLines={5}
            autoCapitalize="sentences"
            maxLength={1000}
            error={errors.description}
            hint={`${description.length}/1000`}
          />

          <Input
            label="Max Attendees (optional)"
            value={maxAttendees}
            onChangeText={v => { setMaxAttendees(v); setErrors(p => ({ ...p, maxAttendees: null })) }}
            placeholder="Leave blank for unlimited"
            keyboardType="number-pad"
            error={errors.maxAttendees}
          />

          {/* Read-only date info */}
          <View style={[styles.readOnly, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.readOnlyLabel, { color: colors.textHint }]}>DATE & TIME (cannot be edited)</Text>
            <Text style={[styles.readOnlyValue, { color: colors.textSecondary }]}>
              {new Date(event.startTime).toLocaleString()} → {new Date(event.endTime).toLocaleTimeString()}
            </Text>
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.5 : 1 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnTxt}>Save Changes</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  back:    { fontSize: 14, fontWeight: '600' },
  heading: { fontSize: 17, fontWeight: '800' },
  content: { padding: 20, paddingBottom: 40 },
  warning: { borderRadius: 10, borderWidth: 1.5, padding: 12, marginBottom: 16 },
  warningTxt: { fontSize: 13, lineHeight: 18 },
  readOnly: { borderRadius: 10, borderWidth: 1.5, padding: 14, marginBottom: 20 },
  readOnlyLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  readOnlyValue: { fontSize: 14 },
  saveBtn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  saveBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
