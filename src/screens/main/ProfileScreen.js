/**
 * ProfileScreen.js
 * - Dark/Light mode toggle in settings
 * - Photo upload
 * - Name edit (7-day cooldown)
 * - Clean minimalistic settings list
 */
import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, TextInput, Modal,
  TouchableWithoutFeedback, Platform, ActivityIndicator, Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore  from '../../store/themeStore'
import useAuthStore   from '../../store/authStore'
import useEventsStore from '../../store/eventsStore'
import Avatar         from '../../components/common/Avatar'
import EventCard      from '../../components/events/EventCard'

export default function ProfileScreen({ navigation }) {
  const { colors, isDark, toggle: toggleTheme } = useThemeStore()
  const { user, logout, updateProfile }         = useAuthStore()
  const { events, attending }                   = useEventsStore()

  const [editModal, setEditModal]   = useState(false)
  const [editField, setEditField]   = useState('')
  const [editValue, setEditValue]   = useState('')
  const [saving, setSaving]         = useState(false)
  const [showMyEvents, setShowMyEvents] = useState(false)

  const myEvents        = events.filter(e => e.organizer?.id === user?.id)
  const attendingEvents = events.filter(e => attending.includes(e.id))

  function openEvent(e) { navigation.navigate('EventDetail', { eventId: e.id, event: e }) }

  function openEdit(field) {
    setEditField(field)
    setEditValue(field === 'name' ? (user?.name || '') : (user?.email || ''))
    setEditModal(true)
  }

  async function handleSaveEdit() {
    if (!editValue.trim()) return
    setSaving(true)
    try {
      await updateProfile({ [editField]: editValue.trim() })
      setEditModal(false)
    } catch (err) {
      Alert.alert('Could not save', err.message)
    } finally { setSaving(false) }
  }

  async function handleAvatarPick() {
    if (Platform.OS === 'web') {
      const input = document.createElement('input')
      input.type = 'file'; input.accept = 'image/*'
      input.onchange = async e => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024) { Alert.alert('Too large', 'Max 5MB'); return }
        const blobUrl = URL.createObjectURL(file)
        try { await updateProfile({ avatar_url: blobUrl, avatar: blobUrl }) }
        catch (err) { Alert.alert('Error', err.message) }
      }
      input.click()
    } else {
      try {
        const IP = require('expo-image-picker')
        const { status } = await IP.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') { Alert.alert('Permission needed'); return }
        const r = await IP.launchImageLibraryAsync({ allowsEditing: true, aspect: [1,1], quality: 0.7 })
        if (!r.canceled) await updateProfile({ avatar_url: r.assets[0].uri, avatar: r.assets[0].uri })
      } catch (err) { Alert.alert('Error', err.message) }
    }
  }

  function handleLogout() {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ])
  }

  if (!user) return null

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
          <TouchableOpacity style={styles.avatarWrap} onPress={handleAvatarPick} activeOpacity={0.8}>
            <Avatar uri={user.avatar} name={user.name || user.phone} size={80} />
            <View style={[styles.editPhotoBadge, { backgroundColor: colors.primary }]}>
              <Text style={{ fontSize: 11 }}>📷</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>
                {user.name || 'Add your name'}
              </Text>
              <TouchableOpacity
                style={[styles.editChip, { backgroundColor: colors.primaryFaint }]}
                onPress={() => openEdit('name')}
              >
                <Text style={[styles.editChipTxt, { color: colors.primary }]}>Edit</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.phone, { color: colors.primary }]}>{user.phone}</Text>
            <TouchableOpacity onPress={() => openEdit('email')}>
              <Text style={[styles.email, { color: colors.textSecondary }]}>
                {user.email || '+ Add email'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={[styles.stats, { backgroundColor: colors.surfaceHigh }]}>
            <Stat label="Created"   value={myEvents.length}        colors={colors} />
            <View style={[styles.statLine, { backgroundColor: colors.border }]} />
            <Stat label="Attending" value={attendingEvents.length} colors={colors} />
            <View style={[styles.statLine, { backgroundColor: colors.border }]} />
            <Stat label="Reviews"   value={0}                      colors={colors} />
          </View>
        </View>

        {/* My Events */}
        {myEvents.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.sectionToggle} onPress={() => setShowMyEvents(s => !s)}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                My Events ({myEvents.length})
              </Text>
              <Text style={{ color: colors.textHint }}>{showMyEvents ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showMyEvents && (
              <View style={styles.grid}>
                {myEvents.map(e => <EventCard key={e.id} event={e} onPress={openEvent} style={{ marginBottom: 10 }} />)}
              </View>
            )}
          </View>
        )}

        {/* Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Settings</Text>
          <View style={[styles.menuCard, { backgroundColor: colors.surface }]}>

            {/* Theme toggle */}
            <View style={[styles.menuRow, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
                {isDark ? '🌙  Dark Mode' : '☀️  Light Mode'}
              </Text>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary + '66' }}
                thumbColor={isDark ? colors.primary : colors.textHint}
              />
            </View>

            <MenuRow label="Edit Name"      onPress={() => openEdit('name')}    colors={colors} />
            <MenuRow label="Edit Email"     onPress={() => openEdit('email')}   colors={colors} value={user.email || ''} />
            <MenuRow label="Change Photo"   onPress={handleAvatarPick}          colors={colors} />
            <MenuRow label="Notifications"  onPress={() => {}}                  colors={colors} value="On" />
            <MenuRow label="Help & Support" onPress={() => {}}                  colors={colors} />
            <MenuRow label="Sign Out"       onPress={handleLogout}              colors={colors} danger />
          </View>
        </View>

        <Text style={[styles.version, { color: colors.textHint }]}>REDE v1.0</Text>
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Edit modal */}
      <Modal visible={editModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setEditModal(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={[styles.editSheet, { backgroundColor: colors.surface }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.editTitle, { color: colors.textPrimary }]}>
            {editField === 'name' ? 'Edit Name' : 'Edit Email'}
          </Text>
          {editField === 'name' && (
            <Text style={[styles.editHint, { color: colors.textHint }]}>
              Names can only be changed once every 7 days.
            </Text>
          )}
          <TextInput
            style={[styles.editInput, { backgroundColor: colors.surfaceHigh, borderColor: colors.border, color: colors.textPrimary }]}
            value={editValue}
            onChangeText={setEditValue}
            placeholder={editField === 'name' ? 'Your name' : 'your@email.com'}
            placeholderTextColor={colors.textHint}
            autoCapitalize={editField === 'name' ? 'words' : 'none'}
            keyboardType={editField === 'email' ? 'email-address' : 'default'}
            autoFocus
          />
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.5 : 1 }]}
            onPress={handleSaveEdit}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnTxt}>Save</Text>
            }
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

function Stat({ label, value, colors }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '900', color: colors.primary }}>{value}</Text>
      <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>{label}</Text>
    </View>
  )
}

function MenuRow({ label, value, onPress, danger, colors }) {
  return (
    <TouchableOpacity
      style={[styles.menuRow, { borderBottomColor: colors.divider }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.menuLabel, { color: danger ? colors.error : colors.textPrimary }]}>{label}</Text>
      {value ? <Text style={[styles.menuVal, { color: colors.textSecondary }]}>{value}</Text> : null}
      <Text style={[styles.chev, { color: danger ? colors.error : colors.textHint }]}>›</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  profileCard: { padding: 20, alignItems: 'center', marginBottom: 8 },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  editPhotoBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  profileInfo: { alignItems: 'center', marginBottom: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  name: { fontSize: 20, fontWeight: '800' },
  editChip: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  editChipTxt: { fontSize: 12, fontWeight: '700' },
  phone: { fontSize: 14, fontWeight: '600', marginBottom: 3 },
  email: { fontSize: 13 },
  stats: { flexDirection: 'row', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, width: '100%', alignItems: 'center' },
  statLine: { width: 1, height: 30 },
  section: { paddingHorizontal: 16, paddingTop: 16 },
  sectionToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  menuCard: { borderRadius: 14, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1 },
  menuLabel: { flex: 1, fontSize: 15 },
  menuVal: { fontSize: 14, marginRight: 6 },
  chev: { fontSize: 20 },
  version: { textAlign: 'center', fontSize: 12, marginTop: 20 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  editSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  editTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  editHint: { fontSize: 12, marginBottom: 14 },
  editInput: { borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 16 },
  saveBtn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  saveBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
