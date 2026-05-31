import React, { useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, TextInput, Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore  from '../../store/themeStore'
import useEventsStore from '../../store/eventsStore'
import { eventsApi }  from '../../services/api'
import { DatePicker, TimePicker } from '../../components/common/DateTimePicker'
import PhotoUpload    from '../../components/common/PhotoUpload'

const { width } = Dimensions.get('window')
const MAX_W = Math.min(width, 500)

export default function EditEventScreen({ navigation, route }) {
  const { event }   = route.params
  const { colors }  = useThemeStore()
  const { setEventsLocal, events } = useEventsStore()

  const existingStart = new Date(event.startTime)
  const existingEnd   = new Date(event.endTime)
  const toDate = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  const toTime = d => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`

  const [title,        setTitle]        = useState(event.title || '')
  const [description,  setDescription]  = useState(event.description || '')
  const [maxAttendees, setMaxAttendees] = useState(event.maxAttendees?.toString() || '')
  const [date,         setDate]         = useState(toDate(existingStart))
  const [startTime,    setStartTime]    = useState(toTime(existingStart))
  const [endTime,      setEndTime]      = useState(toTime(existingEnd))
  const [photoUri,     setPhotoUri]     = useState(event.coverImage || null)
  const [saving,       setSaving]       = useState(false)

  const isDirty = useMemo(() => (
    title.trim()       !== (event.title       || '').trim() ||
    description.trim() !== (event.description || '').trim() ||
    maxAttendees       !== (event.maxAttendees?.toString() || '') ||
    date               !== toDate(existingStart) ||
    startTime          !== toTime(existingStart) ||
    endTime            !== toTime(existingEnd)   ||
    photoUri           !== (event.coverImage || null)
  ), [title, description, maxAttendees, date, startTime, endTime, photoUri])

  async function handleSave() {
    if (!isDirty) return
    if (title.trim().length < 5)        { Alert.alert('Title too short'); return }
    if (description.trim().length < 20) { Alert.alert('Description too short (min 20 chars)'); return }
    if (!date || !startTime || !endTime){ Alert.alert('Set date and time'); return }
    if (endTime <= startTime)           { Alert.alert('End time must be after start time'); return }

    setSaving(true)
    try {
      const res = await eventsApi.update(event.id, {
        title:         title.trim(),
        description:   description.trim(),
        max_attendees: maxAttendees ? parseInt(maxAttendees) : null,
        start_time:    new Date(`${date}T${startTime}:00`).toISOString(),
        end_time:      new Date(`${date}T${endTime}:00`).toISOString(),
        cover_image:   photoUri || event.coverImage,
      })
      const updated = events.map(e => e.id === event.id ? { ...e, ...res.event } : e)
      setEventsLocal(updated)
      navigation.goBack()
    } catch (err) {
      Alert.alert('Could not save', err.message)
    } finally { setSaving(false) }
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[s.phone, { maxWidth: MAX_W }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

          <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={[s.back, { color: colors.primary }]}>← Back</Text>
            </TouchableOpacity>
            <Text style={[s.heading, { color: colors.textPrimary }]}>Edit Event</Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={!isDirty || saving}
              style={[s.saveChip, { backgroundColor: isDirty ? colors.primary : colors.border }]}
            >
              {saving ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.saveChipTxt}>Save</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Label text="Cover Photo" colors={colors} />
            <PhotoUpload uri={photoUri} onSelect={setPhotoUri} onRemove={() => setPhotoUri(event.coverImage)} />

            <Label text="Title" colors={colors} />
            <TextInput
              style={[s.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
              value={title} onChangeText={setTitle}
              autoCapitalize="sentences" maxLength={80}
              selectionColor={colors.primary} underlineColorAndroid="transparent"
            />

            <DatePicker label="Date"       value={date}      onChange={setDate}      />
            <TimePicker label="Start Time" value={startTime} onChange={setStartTime} />
            <TimePicker label="End Time"   value={endTime}   onChange={setEndTime}   />

            <Label text="Description" colors={colors} />
            <TextInput
              style={[s.input, s.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
              value={description} onChangeText={setDescription}
              multiline numberOfLines={5}
              autoCapitalize="sentences" maxLength={1000}
              selectionColor={colors.primary} underlineColorAndroid="transparent"
              textAlignVertical="top"
            />

            <Label text="Max Attendees (optional)" colors={colors} />
            <TextInput
              style={[s.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
              value={maxAttendees} onChangeText={v => setMaxAttendees(v.replace(/\D/g, ''))}
              placeholder="Leave blank = unlimited" placeholderTextColor={colors.textHint}
              keyboardType="number-pad" selectionColor={colors.primary} underlineColorAndroid="transparent"
            />
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  )
}

function Label({ text, colors }) {
  return <Text style={[{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7, color: colors.textSecondary }]}>{text}</Text>
}

const s = StyleSheet.create({
  safe:    { flex: 1, alignItems: 'center' },
  phone:   { flex: 1, width: '100%' },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1 },
  back:    { fontSize: 15, fontWeight: '600' },
  heading: { fontSize: 17, fontWeight: '800' },
  saveChip:    { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  saveChipTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  content: { padding: 20, paddingBottom: 60 },
  input:   { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, marginBottom: 16 },
  textArea:{ minHeight: 120, textAlignVertical: 'top', paddingTop: 13 },
})
