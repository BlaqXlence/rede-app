/**
 * EditEventScreen.js
 * Save button is only active when the user has changed something.
 * Calls the API and navigates back on success.
 */
import React, { useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore  from '../../store/themeStore'
import useEventsStore from '../../store/eventsStore'
import { eventsApi }  from '../../services/api'

export default function EditEventScreen({ navigation, route }) {
  const { event }   = route.params
  const { colors }  = useThemeStore()
  const { events, setEventsLocal } = useEventsStore()

  const hoursUntil = (new Date(event.startTime) - Date.now()) / 3_600_000

  const [title,        setTitle]        = useState(event.title || '')
  const [description,  setDescription]  = useState(event.description || '')
  const [maxAttendees, setMaxAttendees] = useState(event.maxAttendees?.toString() || '')
  const [saving,       setSaving]       = useState(false)

  // Save button only active when something actually changed
  const isDirty = useMemo(() => {
    return (
      title.trim()       !== (event.title || '').trim()       ||
      description.trim() !== (event.description || '').trim() ||
      maxAttendees       !== (event.maxAttendees?.toString() || '')
    )
  }, [title, description, maxAttendees])

  async function handleSave() {
    if (!isDirty) return
    if (title.trim().length < 5) { Alert.alert('Title too short', 'At least 5 characters'); return }
    if (description.trim().length < 50) { Alert.alert('Description too short', 'At least 50 characters'); return }

    setSaving(true)
    try {
      const res = await eventsApi.update(event.id, {
        title:         title.trim(),
        description:   description.trim(),
        max_attendees: maxAttendees ? parseInt(maxAttendees) : null,
      })
      // Update local store so EventDetail refreshes immediately
      const updated = events.map(e => e.id === event.id ? res.event : e)
      setEventsLocal(updated)
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
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={[styles.back, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.heading, { color: colors.textPrimary }]}>Edit Event</Text>

          {/* Save — only active when something changed */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={!isDirty || saving}
            style={[styles.saveChip, { backgroundColor: isDirty ? colors.primary : colors.border }]}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.saveChipTxt}>Save</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {hoursUntil < 5 && (
            <View style={[styles.warning, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
              <Text style={[styles.warningTxt, { color: colors.warning }]}>
                ⚠️ Event starts soon — date and time cannot be changed.
              </Text>
            </View>
          )}

          <Field label="Title" hint={`${title.length}/80`} colors={colors}>
            {Platform.OS === 'web' ? (
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={80}
                style={webInputStyle(colors)}
              />
            ) : (
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                value={title} onChangeText={setTitle}
                autoCapitalize="sentences" maxLength={80}
                selectionColor={colors.primary} underlineColorAndroid="transparent"
              />
            )}
          </Field>

          <Field label="Description" hint={`${description.length}/1000`} colors={colors}>
            {Platform.OS === 'web' ? (
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={1000}
                rows={5}
                style={{ ...webInputStyle(colors), minHeight: 120, resize: 'none' }}
              />
            ) : (
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                value={description} onChangeText={setDescription}
                multiline numberOfLines={5}
                autoCapitalize="sentences" maxLength={1000}
                selectionColor={colors.primary} underlineColorAndroid="transparent"
              />
            )}
          </Field>

          <Field label="Max Attendees (optional)" colors={colors}>
            {Platform.OS === 'web' ? (
              <input
                value={maxAttendees}
                onChange={e => setMaxAttendees(e.target.value.replace(/\D/g, ''))}
                placeholder="Leave blank for unlimited"
                type="number"
                style={webInputStyle(colors)}
              />
            ) : (
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                value={maxAttendees} onChangeText={v => setMaxAttendees(v.replace(/\D/g, ''))}
                placeholder="Leave blank for unlimited"
                placeholderTextColor={colors.textHint}
                keyboardType="number-pad"
                selectionColor={colors.primary} underlineColorAndroid="transparent"
              />
            )}
          </Field>

          <View style={[styles.readOnly, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.readOnlyLabel, { color: colors.textHint }]}>DATE & TIME — cannot be edited</Text>
            <Text style={[styles.readOnlyVal, { color: colors.textSecondary }]}>
              {new Date(event.startTime).toLocaleString()}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function Field({ label, hint, children, colors }) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
        {hint && <Text style={[styles.fieldHint, { color: colors.textHint }]}>{hint}</Text>}
      </View>
      {children}
    </View>
  )
}

function webInputStyle(colors) {
  return {
    width: '100%', boxSizing: 'border-box',
    backgroundColor: colors.surface, color: colors.textPrimary,
    border: `1.5px solid ${colors.border}`, borderRadius: 10,
    padding: '13px 14px', fontSize: 16, fontFamily: 'inherit',
    outline: 'none', display: 'block',
  }
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1 },
  back:    { fontSize: 15, fontWeight: '600' },
  heading: { fontSize: 17, fontWeight: '800' },
  saveChip: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  saveChipTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  content: { padding: 20, paddingBottom: 60 },
  warning: { borderRadius: 10, borderWidth: 1.5, padding: 12, marginBottom: 18 },
  warningTxt: { fontSize: 13, lineHeight: 18 },
  field:    { marginBottom: 18 },
  fieldHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldHint:  { fontSize: 12 },
  input: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  textArea: { minHeight: 120, textAlignVertical: 'top', paddingTop: 13 },
  readOnly: { borderRadius: 10, borderWidth: 1.5, padding: 14 },
  readOnlyLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  readOnlyVal:   { fontSize: 14 },
})
