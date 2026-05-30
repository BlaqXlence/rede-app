import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Switch, Alert, Platform, Modal, TouchableWithoutFeedback,
  TextInput, ActivityIndicator, Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore from '../../store/themeStore'
import useAuthStore  from '../../store/authStore'
import { uploadApi } from '../../services/api'
import { EVENT_CATEGORIES } from '../../constants/config'

const { width } = Dimensions.get('window')
const MAX_W     = Math.min(width, 500)
const AGES      = ['16–17','18–21','22–25','26–30','31–35','36–40','41–50','50+']
const CATS      = EVENT_CATEGORIES.filter(c => c.id !== 'all')
const MAX_INT   = 3

export default function SettingsScreen({ navigation }) {
  const { colors, isDark, toggle } = useThemeStore()
  const { user, logout, updateProfile } = useAuthStore()

  const [editModal,  setEditModal]  = useState(false)
  const [editField,  setEditField]  = useState(null)
  const [editValue,  setEditValue]  = useState('')
  const [saving,     setSaving]     = useState(false)
  // Interests editor
  const [intModal,   setIntModal]   = useState(false)
  const [selInts,    setSelInts]    = useState(user?.interests || [])
  // Age editor
  const [ageModal,   setAgeModal]   = useState(false)

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

  async function saveAge(a) {
    try { await updateProfile({ age: AGES.indexOf(a) + 16 }) }
    catch {}
    setAgeModal(false)
  }

  async function pickPhoto() {
    if (Platform.OS !== 'web') return
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'
    input.onchange = async e => {
      const file = e.target.files?.[0]; if (!file) return
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const res = await uploadApi.upload(reader.result)
          await updateProfile({ avatar_url: res.url, avatar: res.url })
        } catch { await updateProfile({ avatar_url: reader.result, avatar: reader.result }) }
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  async function handleSignOut() {
    Alert.alert(
      'Sign out?',
      'You can sign back in with your phone number.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            // Use setTimeout so Alert closes first, then logout fires
            setTimeout(async () => {
              try {
                await logout()
                // State change triggers NavigationContainer to show AuthNavigator
              } catch (err) {
                Alert.alert('Error signing out', err.message)
              }
            }, 100)
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[s.phone, { maxWidth: MAX_W }]}>

        <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={[s.back, { color: colors.primary }]}>←</Text>
          </TouchableOpacity>
          <Text style={[s.heading, { color: colors.textPrimary }]}>Settings</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

          <Text style={[s.sectionLabel, { color: colors.textHint }]}>APPEARANCE</Text>
          <View style={[s.card, { backgroundColor: colors.surface }]}>
            <View style={[s.row, { borderBottomColor: colors.divider, borderBottomWidth: 1 }]}>
              <Text style={[s.rowLabel, { color: colors.textPrimary }]}>
                {isDark ? '🌙  Dark Mode' : '☀️  Light Mode'}
              </Text>
              <Switch value={isDark} onValueChange={toggle}
                trackColor={{ false: colors.border, true: colors.primary + '66' }}
                thumbColor={isDark ? colors.primary : '#f4f3f4'} />
            </View>
          </View>

          <Text style={[s.sectionLabel, { color: colors.textHint }]}>IDENTITY</Text>
          <View style={[s.card, { backgroundColor: colors.surface }]}>
            <Row label="Nickname"   value={user?.nickname || user?.name || '—'} onPress={() => openEdit('nickname', user?.nickname || user?.name)} colors={colors} />
            <Row label="First Name" value={user?.firstName || '—'} onPress={() => openEdit('first_name', user?.firstName)} colors={colors} />
            <Row label="Last Name"  value={user?.lastName  || '—'} onPress={() => openEdit('last_name',  user?.lastName)}  colors={colors} />
            <Row label="Email"      value={user?.email     || 'Not set'} onPress={() => openEdit('email', user?.email)} colors={colors} last />
          </View>

          <Text style={[s.sectionLabel, { color: colors.textHint }]}>PREFERENCES</Text>
          <View style={[s.card, { backgroundColor: colors.surface }]}>
            <Row label="Age Group"
              value={AGES[user?.age - 16] || '—'}
              onPress={() => setAgeModal(true)}
              colors={colors} />
            <Row label="Interests"
              value={user?.interests?.length > 0
                ? user.interests.map(i => EVENT_CATEGORIES.find(c => c.id === i)?.label).filter(Boolean).join(', ')
                : 'None set'}
              onPress={() => { setSelInts(user?.interests || []); setIntModal(true) }}
              colors={colors} last />
          </View>

          <Text style={[s.sectionLabel, { color: colors.textHint }]}>ACCOUNT</Text>
          <View style={[s.card, { backgroundColor: colors.surface }]}>
            <Row label="Change Photo" onPress={pickPhoto} colors={colors} />
            <View style={[s.row, s.lastRow]}>
              <Text style={[s.rowLabel, { color: colors.textPrimary }]}>Phone Number</Text>
              <Text style={[s.rowValue, { color: colors.success }]}>{user?.phone} ✓</Text>
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

        {/* Edit text modal */}
        <Modal visible={editModal} transparent animationType="slide">
          <TouchableWithoutFeedback onPress={() => setEditModal(false)}>
            <View style={s.overlay} />
          </TouchableWithoutFeedback>
          <View style={[s.sheet, { backgroundColor: colors.surface }]}>
            <View style={[s.handle, { backgroundColor: colors.border }]} />
            <Text style={[s.sheetTitle, { color: colors.textPrimary }]}>
              {{
                nickname:   'Edit Nickname',
                first_name: 'Edit First Name',
                last_name:  'Edit Last Name',
                email:      'Edit Email',
              }[editField] || 'Edit'}
            </Text>
            {editField === 'nickname' && (
              <Text style={[s.sheetNote, { color: colors.textHint }]}>
                Nicknames can only be changed once every 7 days.
              </Text>
            )}
            {Platform.OS === 'web' ? (
              <input value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus
                style={{
                  width: '100%', boxSizing: 'border-box',
                  backgroundColor: colors.surfaceHigh, color: colors.textPrimary,
                  border: `1.5px solid ${colors.border}`, borderRadius: 12,
                  padding: '14px 16px', fontSize: 16, fontFamily: 'inherit',
                  outline: 'none', marginBottom: 16,
                }}
              />
            ) : (
              <TextInput
                style={[s.editInput, { backgroundColor: colors.surfaceHigh, borderColor: colors.border, color: colors.textPrimary }]}
                value={editValue} onChangeText={setEditValue}
                autoCapitalize={editField === 'email' ? 'none' : 'words'}
                keyboardType={editField === 'email' ? 'email-address' : 'default'}
                autoFocus selectionColor={colors.primary} underlineColorAndroid="transparent"
              />
            )}
            <TouchableOpacity
              style={[s.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.5 : 1 }]}
              onPress={saveEdit} disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveTxt}>Save</Text>}
            </TouchableOpacity>
          </View>
        </Modal>

        {/* Age modal */}
        <Modal visible={ageModal} transparent animationType="slide">
          <TouchableWithoutFeedback onPress={() => setAgeModal(false)}>
            <View style={s.overlay} />
          </TouchableWithoutFeedback>
          <View style={[s.sheet, { backgroundColor: colors.surface }]}>
            <View style={[s.handle, { backgroundColor: colors.border }]} />
            <Text style={[s.sheetTitle, { color: colors.textPrimary }]}>Age Group</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
              {AGES.map(a => {
                const active = AGES[user?.age - 16] === a
                return (
                  <TouchableOpacity
                    key={a}
                    style={{ borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 18, paddingVertical: 11,
                      backgroundColor: active ? colors.primary : colors.surfaceHigh,
                      borderColor: active ? colors.primary : colors.border }}
                    onPress={() => saveAge(a)}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: active ? '#fff' : colors.textPrimary }}>
                      {a}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
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
                const accent = colors.cat[cat.id] || colors.primary
                const full   = !active && selInts.length >= MAX_INT
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={{ borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 9,
                      backgroundColor: active ? accent : colors.surfaceHigh,
                      borderColor: active ? accent : colors.border,
                      opacity: full ? 0.35 : 1 }}
                    onPress={() => {
                      if (full) return
                      setSelInts(prev => active ? prev.filter(x => x !== cat.id) : [...prev, cat.id])
                    }}
                    disabled={full}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#fff' : colors.textSecondary }}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
            <TouchableOpacity
              style={[s.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.5 : 1 }]}
              onPress={saveInterests} disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveTxt}>Save Interests</Text>}
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  )
}

function Row({ label, value, onPress, last, colors }) {
  return (
    <TouchableOpacity
      style={[s.row, !last && { borderBottomColor: colors.divider, borderBottomWidth: 1 }, last && s.lastRow]}
      onPress={onPress} activeOpacity={0.7}
    >
      <Text style={[s.rowLabel, { color: colors.textPrimary }]}>{label}</Text>
      {value && <Text style={[s.rowValue, { color: colors.textSecondary }]} numberOfLines={1}>{value}</Text>}
      <Text style={[s.rowChev, { color: colors.textHint }]}>›</Text>
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
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginTop: 20, marginBottom: 8, paddingHorizontal: 4 },
  card:    { borderRadius: 14, overflow: 'hidden' },
  row:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, minHeight: 52 },
  lastRow: {},
  rowLabel:{ flex: 1, fontSize: 15 },
  rowValue:{ fontSize: 13, marginRight: 8, maxWidth: '45%' },
  rowChev: { fontSize: 20 },
  signOutBtn: { marginTop: 24, borderRadius: 12, borderWidth: 1.5, paddingVertical: 14, alignItems: 'center' },
  signOutTxt: { fontSize: 15, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: 12, marginTop: 24 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:   { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22, paddingBottom: 44 },
  handle:  { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  sheetTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  sheetNote:  { fontSize: 12, marginBottom: 14 },
  editInput: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 16 },
  saveBtn:   { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  saveTxt:   { color: '#fff', fontSize: 16, fontWeight: '700' },
})
