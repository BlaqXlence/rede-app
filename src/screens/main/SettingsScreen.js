import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Switch, Alert, Modal, TextInput,
  ActivityIndicator, Dimensions, TouchableWithoutFeedback,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import useThemeStore from '../../store/themeStore'
import useAuthStore  from '../../store/authStore'
import { uploadApi } from '../../services/api'
import { EVENT_CATEGORIES } from '../../constants/config'

const { width } = Dimensions.get('window')
const MAX_W     = Math.min(width, 500)
const CATS      = EVENT_CATEGORIES.filter(c => c.id !== 'all')
const MAX_INT   = 3

export default function SettingsScreen({ navigation }) {
  const { colors, isDark, toggle } = useThemeStore()
  const { user, logout, updateProfile } = useAuthStore()

  const [editModal,  setEditModal]  = useState(false)
  const [editField,  setEditField]  = useState(null)
  const [editValue,  setEditValue]  = useState('')
  const [saving,     setSaving]     = useState(false)
  const [intModal,   setIntModal]   = useState(false)
  const [selInts,    setSelInts]    = useState(user?.interests || [])

  function openEdit(field, current) {
    setEditField(field); setEditValue(current || ''); setEditModal(true)
  }

  async function saveEdit() {
    if (!editValue.trim()) return
    setSaving(true)
    try {
      await updateProfile({ [editField]: editValue.trim() })
      setEditModal(false)
    } catch (err) { Alert.alert('Could not save', err.message) }
    finally { setSaving(false) }
  }

  async function saveInterests() {
    setSaving(true)
    try { await updateProfile({ interests: selInts }); setIntModal(false) }
    catch (err) { Alert.alert('Error', err.message) }
    finally { setSaving(false) }
  }

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) { Alert.alert('Permission needed', 'Allow photo access to change your picture.'); return }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1,1], quality: 0.8,
    })
    if (!result.canceled && result.assets[0]) {
      try {
        const res = await uploadApi.upload(result.assets[0].uri)
        await updateProfile({ avatar_url: res.url, avatar: res.url })
      } catch (err) { Alert.alert('Upload failed', err.message) }
    }
  }

  function handleSignOut() {
    Alert.alert('Sign out?', 'You can sign back in with your phone number.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout() } },
    ])
  }

  const fieldLabel = { nickname: 'Edit Nickname', first_name: 'Edit First Name', last_name: 'Edit Last Name', email: 'Edit Email' }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[s.phone, { maxWidth: MAX_W }]}>

        <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top:10,bottom:10,left:10,right:10 }}>
            <Text style={[s.back, { color: colors.primary }]}>←</Text>
          </TouchableOpacity>
          <Text style={[s.heading, { color: colors.textPrimary }]}>Settings</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

          <SectionLabel text="APPEARANCE" colors={colors} />
          <View style={[s.card, { backgroundColor: colors.surface }]}>
            <View style={s.row}>
              <Text style={[s.rowLabel, { color: colors.textPrimary }]}>
                {isDark ? '🌙  Dark Mode' : '☀️  Light Mode'}
              </Text>
              <Switch value={isDark} onValueChange={toggle}
                trackColor={{ false: colors.border, true: colors.primary + '66' }}
                thumbColor={isDark ? colors.primary : '#f4f3f4'} />
            </View>
          </View>

          <SectionLabel text="IDENTITY" colors={colors} />
          <View style={[s.card, { backgroundColor: colors.surface }]}>
            <Row label="Nickname"   value={user?.nickname   || '—'} onPress={() => openEdit('nickname',   user?.nickname)}   colors={colors} />
            <Row label="First Name" value={user?.firstName  || '—'} onPress={() => openEdit('first_name', user?.firstName)}  colors={colors} border />
            <Row label="Last Name"  value={user?.lastName   || '—'} onPress={() => openEdit('last_name',  user?.lastName)}   colors={colors} border />
            <Row label="Email"      value={user?.email      || 'Not set'} onPress={() => openEdit('email', user?.email)} colors={colors} border />
          </View>

          <SectionLabel text="PREFERENCES" colors={colors} />
          <View style={[s.card, { backgroundColor: colors.surface }]}>
            <Row label="Birthday"
              value={user?.birthday
                ? (() => { const bd = new Date(user.birthday); const age = new Date().getFullYear() - bd.getFullYear(); return `${bd.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })} · ${age} yrs` })()
                : 'Not set'}
              onPress={() => openEdit('birthday', user?.birthday)}
              colors={colors} />
            <Row label="Interests"
              value={user?.interests?.length > 0
                ? user.interests.map(i => EVENT_CATEGORIES.find(c => c.id === i)?.label).filter(Boolean).join(', ')
                : 'None set'}
              onPress={() => { setSelInts(user?.interests || []); setIntModal(true) }}
              colors={colors} border />
          </View>

          <SectionLabel text="ACCOUNT" colors={colors} />
          <View style={[s.card, { backgroundColor: colors.surface }]}>
            <Row label="Change Photo" onPress={pickPhoto} colors={colors} />
            <View style={[s.row, { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <Text style={[s.rowLabel, { color: colors.textPrimary }]}>Phone</Text>
              <Text style={[s.rowValue, { color: colors.success || colors.primary }]}>{user?.phone} ✓</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[s.signOutBtn, { backgroundColor: colors.error + '12', borderColor: colors.error }]}
            onPress={handleSignOut} activeOpacity={0.8}
          >
            <Text style={[s.signOutTxt, { color: colors.error }]}>Sign Out</Text>
          </TouchableOpacity>

          <Text style={[s.version, { color: colors.textHint }]}>REDE v1.0 · Uganda</Text>
        </ScrollView>

        {/* Edit modal */}
        <Modal visible={editModal} transparent animationType="slide">
          <TouchableWithoutFeedback onPress={() => setEditModal(false)}>
            <View style={s.overlay} />
          </TouchableWithoutFeedback>
          <View style={[s.sheet, { backgroundColor: colors.surface }]}>
            <View style={[s.handle, { backgroundColor: colors.border }]} />
            <Text style={[s.sheetTitle, { color: colors.textPrimary }]}>
              {fieldLabel[editField] || 'Edit'}
            </Text>
            {editField === 'nickname' && (
              <Text style={[s.sheetNote, { color: colors.textHint }]}>Must be unique.</Text>
            )}
            {editField === 'birthday' && (
              <Text style={[s.sheetNote, { color: colors.textHint }]}>Format: YYYY-MM-DD e.g. 1998-04-15</Text>
            )}
            <TextInput
              style={[s.editInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
              value={editValue}
              onChangeText={setEditValue}
              autoCapitalize={editField === 'email' || editField === 'nickname' || editField === 'birthday' ? 'none' : 'words'}
              keyboardType={editField === 'email' ? 'email-address' : editField === 'birthday' ? 'numeric' : 'default'}
              autoFocus
              selectionColor={colors.primary}
              underlineColorAndroid="transparent"
              placeholder={editField === 'birthday' ? 'YYYY-MM-DD' : ''}
              placeholderTextColor={colors.textHint}
            />
            <TouchableOpacity
              style={[s.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.5 : 1 }]}
              onPress={saveEdit} disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveTxt}>Save</Text>}
            </TouchableOpacity>
          </View>
        </Modal>

        {/* Interests modal */}
        <Modal visible={intModal} transparent animationType="slide">
          <TouchableWithoutFeedback onPress={() => setIntModal(false)}>
            <View style={s.overlay} />
          </TouchableWithoutFeedback>
          <View style={[s.sheet, { backgroundColor: colors.surface }]}>
            <View style={[s.handle, { backgroundColor: colors.border }]} />
            <Text style={[s.sheetTitle, { color: colors.textPrimary }]}>
              Interests · {selInts.length}/{MAX_INT}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {CATS.map(cat => {
                const active = selInts.includes(cat.id)
                const accent = colors.cat?.[cat.id] || colors.primary
                const full   = !active && selInts.length >= MAX_INT
                return (
                  <TouchableOpacity key={cat.id} disabled={full}
                    style={{ borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 9,
                      backgroundColor: active ? accent : colors.background,
                      borderColor: active ? accent : colors.border, opacity: full ? 0.35 : 1 }}
                    onPress={() => setSelInts(p => active ? p.filter(x => x !== cat.id) : [...p, cat.id])}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#fff' : colors.textSecondary }}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
            <TouchableOpacity style={[s.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.5 : 1 }]}
              onPress={saveInterests} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveTxt}>Save Interests</Text>}
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  )
}

function SectionLabel({ text, colors }) {
  return <Text style={[{ fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginTop: 20, marginBottom: 8, paddingHorizontal: 4, color: colors.textHint }]}>{text}</Text>
}

function Row({ label, value, onPress, colors, border }) {
  return (
    <TouchableOpacity
      style={[{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15 },
        border && { borderTopWidth: 1, borderTopColor: colors.border }]}
      onPress={onPress} activeOpacity={0.7}
    >
      <Text style={{ flex: 1, fontSize: 15, color: colors.textPrimary }}>{label}</Text>
      {value && <Text style={{ fontSize: 13, color: colors.textSecondary, marginRight: 8, maxWidth: '50%' }} numberOfLines={1}>{value}</Text>}
      <Text style={{ fontSize: 20, color: colors.textHint }}>›</Text>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  safe:    { flex: 1, alignItems: 'center' },
  phone:   { flex: 1, width: '100%' },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1 },
  back:    { fontSize: 22, fontWeight: '700' },
  heading: { fontSize: 17, fontWeight: '800' },
  content: { padding: 16, paddingBottom: 60 },
  card:    { borderRadius: 14, overflow: 'hidden' },
  row:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15 },
  rowLabel:{ flex: 1, fontSize: 15 },
  rowValue:{ fontSize: 13, marginRight: 8, maxWidth: '45%' },
  signOutBtn: { marginTop: 24, borderRadius: 12, borderWidth: 1.5, paddingVertical: 16, alignItems: 'center' },
  signOutTxt: { fontSize: 16, fontWeight: '800' },
  version: { textAlign: 'center', fontSize: 12, marginTop: 24 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:   { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22, paddingBottom: 44 },
  handle:  { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  sheetTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  sheetNote:  { fontSize: 12, marginBottom: 12, opacity: 0.7 },
  editInput:  { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 16 },
  saveBtn:    { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  saveTxt:    { color: '#fff', fontSize: 16, fontWeight: '700' },
})
