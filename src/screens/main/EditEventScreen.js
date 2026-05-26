/**
 * EditEventScreen.js
 * Creator can edit their event.
 * Cannot edit date if event starts within 5 hours.
 */
import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore  from '../../store/themeStore'
import useEventsStore from '../../store/eventsStore'
import Input          from '../../components/common/Input'
import { eventsApi }  from '../../services/api'

export default function EditEventScreen({ navigation, route }) {
  const { event }   = route.params
  const { colors }  = useThemeStore()
  const { events, setEventsLocal } = useEventsStore()

  const hoursUntilStart = (new Date(event.startTime) - Date.now()) / 3_600_000
  const canEditDate     = hoursUntilStart > 5

  const [title, setTitle]             = useState(event.title)
  const [description, setDescription] = useState(event.description)
  const [maxAttendees, setMaxAttendees] = useState(event.maxAttendees?.toString() || '')
  const [saving, setSaving]           = useState(false)
  const [errors, setErrors]           = useState({})

  function validate() {
    const e = {}
    if (!title.trim() || title.trim().length < 5) e.title = 'At least 5 characters'
    if (!description.trim() || description.trim().length < 50) e.description = 'At least 50 characters'
    return e
  }

  async function handleSave() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    try {
      const updated = await eventsApi.update(event.id, {
        title:        title.trim(),
        description:  description.trim(),
        max_attendees: maxAttendees ? parseInt(maxAttendees, 10) : null,
      })
      Alert.alert('Saved!', 'Your event has been updated.')
      navigation.goBack()
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
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.back, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.heading, { color: colors.textPrimary }]}>Edit Event</Text>
          <View style={{ minWidth: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {!canEditDate && (
            <View style={[styles.notice, { backgroundColor: colors.warning + '22', borderColor: colors.warning }]}>
              <Text style={[styles.noticeTxt, { color: colors.warning }]}>
                Event starts in less than 5 hours — date and time cannot be changed.
              </Text>
            </View>
          )}

          <Input
            label="Event Title"
            value={title}
            onChangeText={v => { setTitle(v); if (errors.title) setErrors(e => ({ ...e, title: null })) }}
            placeholder="Event title"
            autoCapitalize="sentences"
            maxLength={80}
            error={errors.title}
            hint={`${title.length}/80`}
          />

          <Input
            label="Description"
            value={description}
            onChangeText={v => { setDescription(v); if (errors.description) setErrors(e => ({ ...e, description: null })) }}
            placeholder="Describe your event..."
            multiline numberOfLines={5}
            autoCapitalize="sentences"
            maxLength={1000}
            error={errors.description}
            hint={`${description.length}/1000`}
          />

          <Input
            label="Max Attendees (optional)"
            value={maxAttendees}
            onChangeText={setMaxAttendees}
            placeholder="Leave blank for unlimited"
            keyboardType="number-pad"
          />

          {/* Read-only date display */}
          <View style={[styles.readOnly, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.readOnlyLabel, { color: colors.textHint }]}>DATE & TIME</Text>
            <Text style={[styles.readOnlyValue, { color: colors.textSecondary }]}>
              {new Date(event.startTime).toLocaleString()} – {new Date(event.endTime).toLocaleTimeString()}
            </Text>
            {!canEditDate && (
              <Text style={[styles.readOnlyNote, { color: colors.textHint }]}>
                Cannot be edited within 5 hours of start
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.5 : 1 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnTxt}>{saving ? 'Saving...' : 'Save Changes'}</Text>
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
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  back: { fontSize: 14, fontWeight: '600', minWidth: 60 },
  heading: { fontSize: 17, fontWeight: '800' },
  content: { padding: 20, paddingBottom: 40 },
  notice: { borderRadius: 10, borderWidth: 1.5, padding: 12, marginBottom: 16 },
  noticeTxt: { fontSize: 13, lineHeight: 18 },
  readOnly: { borderRadius: 10, borderWidth: 1.5, padding: 14, marginBottom: 20 },
  readOnlyLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  readOnlyValue: { fontSize: 14 },
  readOnlyNote: { fontSize: 12, marginTop: 4 },
  saveBtn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  saveBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
