/**
 * SettingsScreen — full page with back arrow.
 * No popup. Gear icon on profile opens this.
 */
import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Switch, Alert, Platform, Modal, TouchableWithoutFeedback,
  TextInput, ActivityIndicator, Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore  from '../../store/themeStore'
import useAuthStore   from '../../store/authStore'
import { uploadApi }  from '../../services/api'

const { width } = Dimensions.get('window')
const MAX_W     = Math.min(width, 500)

export default function SettingsScreen({ navigation }) {
  const { colors, isDark, toggle: toggleTheme } = useThemeStore()
  const { user, logout, updateProfile }         = useAuthStore()

  const [editField, setEditField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saving,    setSaving]    = useState(false)

  async function saveEdit() {
    if (!editValue.trim()) return
    setSaving(true)
    try {
      await updateProfile({ [editField]: editValue.trim() })
      setEditField(null)
    } catch (err) {
      Alert.alert('Could not save', err.message)
    } finally { setSaving(false) }
  }

  async function pickPhoto() {
    if (Platform.OS !== 'web') return
    const input  = document.createElement('input')
    input.type   = 'file'
    input.accept = 'image/*'
    input.onchange = async e => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const res = await uploadApi.upload(reader.result)
          await updateProfile({ avatar_url: res.url, avatar: res.url })
          Alert.alert('Photo updated!')
        } catch {
          await updateProfile({ avatar_url: reader.result, avatar: reader.result })
        }
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  function handleSignOut() {
    Alert.alert(
      'Sign out?',
      'You will need your phone number to sign back in.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: async () => {
          try { await logout() } catch {}
        }},
      ]
    )
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.phone, { maxWidth: MAX_W }]}>

        {/* Header with back arrow */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.back, { color: colors.primary }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.heading, { color: colors.textPrimary }]}>Settings</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

          {/* Appearance */}
          <Text style={[styles.sectionLabel, { color: colors.textHint }]}>APPEARANCE</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={[styles.row, { borderBottomColor: colors.divider, borderBottomWidth: 1 }]}>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                {isDark ? '🌙  Dark Mode' : '☀️  Light Mode'}
              </Text>
              <Switch
                value={isDark} onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary + '66' }}
                thumbColor={isDark ? colors.primary : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Account */}
          <Text style={[styles.sectionLabel, { color: colors.textHint }]}>ACCOUNT</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Row label="Edit Name"
              value={user?.name}
              onPress={() => { setEditField('name'); setEditValue(user?.name || '') }}
              colors={colors} />
            <Row label="Edit Email"
              value={user?.email || 'Not set'}
              onPress={() => { setEditField('email'); setEditValue(user?.email || '') }}
              colors={colors} />
            <Row label="Change Photo"
              onPress={pickPhoto}
              colors={colors} last />
          </View>

          {/* Phone (read only) */}
          <Text style={[styles.sectionLabel, { color: colors.textHint }]}>PHONE NUMBER</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={[styles.row, styles.lastRow]}>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{user?.phone}</Text>
              <Text style={[styles.rowValue, { color: colors.success }]}>✓ Verified</Text>
            </View>
          </View>

          {/* Support */}
          <Text style={[styles.sectionLabel, { color: colors.textHint }]}>SUPPORT</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Row label="Help & Support" onPress={() => {}} colors={colors} last />
          </View>

          {/* Sign out */}
          <TouchableOpacity
            style={[styles.signOutBtn, { backgroundColor: colors.error + '15', borderColor: colors.error }]}
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <Text style={[styles.signOutTxt, { color: colors.error }]}>Sign Out</Text>
          </TouchableOpacity>

          <Text style={[styles.version, { color: colors.textHint }]}>REDE v1.0</Text>
        </ScrollView>

        {/* Edit sheet */}
        <Modal visible={!!editField} transparent animationType="slide">
          <TouchableWithoutFeedback onPress={() => setEditField(null)}>
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
              {editField === 'name' ? 'Edit Name' : 'Edit Email'}
            </Text>
            {editField === 'name' && (
              <Text style={[styles.sheetNote, { color: colors.textHint }]}>
                Names can only be changed once every 7 days.
              </Text>
            )}
            {Platform.OS === 'web' ? (
              <input
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                placeholder={editField === 'name' ? 'Your name' : 'your@email.com'}
                autoFocus
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
                style={[styles.editInput, {
                  backgroundColor: colors.surfaceHigh,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                }]}
                value={editValue}
                onChangeText={setEditValue}
                placeholder={editField === 'name' ? 'Your name' : 'your@email.com'}
                placeholderTextColor={colors.textHint}
                autoCapitalize={editField === 'name' ? 'words' : 'none'}
                keyboardType={editField === 'email' ? 'email-address' : 'default'}
                autoFocus
                selectionColor={colors.primary}
                underlineColorAndroid="transparent"
              />
            )}
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.5 : 1 }]}
              onPress={saveEdit} disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnTxt}>Save</Text>
              }
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
      style={[styles.row, !last && { borderBottomColor: colors.divider, borderBottomWidth: 1 }, last && styles.lastRow]}
      onPress={onPress} activeOpacity={0.7}
    >
      <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{label}</Text>
      {value && <Text style={[styles.rowValue, { color: colors.textSecondary }]} numberOfLines={1}>{value}</Text>}
      <Text style={[styles.rowChev, { color: colors.textHint }]}>›</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  safe:    { flex: 1, alignItems: 'center' },
  phone:   { flex: 1, width: '100%' },
  header:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1,
  },
  back:    { fontSize: 22, fontWeight: '700' },
  heading: { fontSize: 17, fontWeight: '800' },
  content: { padding: 16, paddingBottom: 60 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.6,
    marginTop: 20, marginBottom: 8, paddingHorizontal: 4,
  },
  card: { borderRadius: 14, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 15,
    minHeight: 52,
  },
  lastRow: {},
  rowLabel: { flex: 1, fontSize: 15 },
  rowValue: { fontSize: 13, marginRight: 8, maxWidth: '40%' },
  rowChev:  { fontSize: 20 },

  signOutBtn: {
    marginTop: 24, borderRadius: 12, borderWidth: 1.5,
    paddingVertical: 14, alignItems: 'center',
  },
  signOutTxt: { fontSize: 15, fontWeight: '700' },
  version:    { textAlign: 'center', fontSize: 12, marginTop: 24, color: '#888' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: 22, paddingBottom: 44,
  },
  handle:    { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  sheetTitle:{ fontSize: 18, fontWeight: '800', marginBottom: 6 },
  sheetNote: { fontSize: 12, marginBottom: 14 },
  editInput: {
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, marginBottom: 16,
  },
  saveBtn:    { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  saveBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
