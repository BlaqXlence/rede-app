/**
 * ProfileScreen.js
 * Full profile management:
 * - Photo upload (web file input or expo-image-picker)
 * - Name edit with 7-day cooldown
 * - Email edit
 * - Stats: created, attending, reviews
 */
import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, TextInput, Modal,
  TouchableWithoutFeedback, Platform, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import colors from '../../constants/colors'
import useAuthStore from '../../store/authStore'
import useEventsStore from '../../store/eventsStore'
import Avatar from '../../components/common/Avatar'
import EventCard from '../../components/events/EventCard'

function MenuRow({ label, value, onPress, danger }) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.menuLabel, danger && styles.danger]}>{label}</Text>
      {value ? <Text style={styles.menuVal}>{value}</Text> : null}
      <Text style={[styles.chev, danger && styles.danger]}>›</Text>
    </TouchableOpacity>
  )
}

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateProfile } = useAuthStore()
  const { events, attending }           = useEventsStore()

  const [editModal, setEditModal] = useState(false)
  const [editField, setEditField] = useState('')  // 'name' or 'email'
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving]       = useState(false)
  const [showMyEvents, setShowMyEvents] = useState(false)

  const myEvents        = events.filter(e => e.organizer?.id === user?.id)
  const attendingEvents = events.filter(e => attending.includes(e.id))

  function openEvent(event) {
    navigation.navigate('EventDetail', { eventId: event.id, event })
  }

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
      Alert.alert('Saved', `${editField === 'name' ? 'Name' : 'Email'} updated.`)
    } catch (err) {
      Alert.alert('Could not save', err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarPick() {
    if (Platform.OS === 'web') {
      // Create a hidden file input
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024) {
          Alert.alert('Too large', 'Pick an image under 5MB')
          return
        }
        const blobUrl = URL.createObjectURL(file)
        // For now save locally — in production upload to Cloudinary/S3
        try {
          await updateProfile({ avatar_url: blobUrl, avatar: blobUrl })
          Alert.alert('Photo updated', 'Profile photo changed.')
        } catch (err) {
          Alert.alert('Error', err.message)
        }
      }
      input.click()
    } else {
      try {
        const IP = require('expo-image-picker')
        const { status } = await IP.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') { Alert.alert('Permission needed'); return }
        const r = await IP.launchImageLibraryAsync({ allowsEditing: true, aspect: [1,1], quality: 0.7 })
        if (!r.canceled) {
          await updateProfile({ avatar_url: r.assets[0].uri, avatar: r.assets[0].uri })
          Alert.alert('Photo updated!')
        }
      } catch (err) {
        Alert.alert('Error', err.message)
      }
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          {/* Avatar with edit tap */}
          <TouchableOpacity style={styles.avatarWrap} onPress={handleAvatarPick} activeOpacity={0.8}>
            <Avatar uri={user.avatar} name={user.name || user.phone} size={80} />
            <View style={styles.editPhotoBadge}>
              <Text style={styles.editPhotoIcon}>📷</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{user.name || 'Add your name'}</Text>
              <TouchableOpacity onPress={() => openEdit('name')} style={styles.editBtn}>
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.phone}>{user.phone}</Text>
            <TouchableOpacity onPress={() => openEdit('email')}>
              <Text style={styles.email}>
                {user.email || '+ Add email'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{myEvents.length}</Text>
              <Text style={styles.statLabel}>Created</Text>
            </View>
            <View style={styles.statLine} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{attendingEvents.length}</Text>
              <Text style={styles.statLabel}>Attending</Text>
            </View>
            <View style={styles.statLine} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>0</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        </View>

        {/* My events toggle */}
        {myEvents.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionToggle}
              onPress={() => setShowMyEvents(s => !s)}
            >
              <Text style={styles.sectionTitle}>My Events ({myEvents.length})</Text>
              <Text style={styles.toggleChev}>{showMyEvents ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showMyEvents && (
              <View style={styles.grid}>
                {myEvents.map(e => <EventCard key={e.id} event={e} onPress={openEvent} />)}
              </View>
            )}
          </View>
        )}

        {/* Attending */}
        {attendingEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attending ({attendingEvents.length})</Text>
            <View style={styles.grid}>
              {attendingEvents.map(e => <EventCard key={e.id} event={e} onPress={openEvent} />)}
            </View>
          </View>
        )}

        {/* Settings menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.menuCard}>
            <MenuRow label="Edit Name"         onPress={() => openEdit('name')} />
            <MenuRow label="Edit Email"        onPress={() => openEdit('email')} value={user.email || ''} />
            <MenuRow label="Change Photo"      onPress={handleAvatarPick} />
            <MenuRow label="My Interests"      onPress={() => {}} />
            <MenuRow label="Notifications"     value="On" onPress={() => {}} />
            <MenuRow label="Help & Support"    onPress={() => {}} />
            <MenuRow label="Sign Out"          onPress={handleLogout} danger />
          </View>
        </View>

        <Text style={styles.version}>REDE v1.0</Text>
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Edit modal */}
      <Modal visible={editModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setEditModal(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={styles.editSheet}>
          <View style={styles.handle} />
          <Text style={styles.editTitle}>
            Edit {editField === 'name' ? 'Name' : 'Email'}
          </Text>
          {editField === 'name' && (
            <Text style={styles.editHint}>
              Names can only be changed once every 7 days.
            </Text>
          )}
          <TextInput
            style={styles.editInput}
            value={editValue}
            onChangeText={setEditValue}
            placeholder={editField === 'name' ? 'Your name' : 'your@email.com'}
            placeholderTextColor={colors.textHint}
            autoCapitalize={editField === 'name' ? 'words' : 'none'}
            keyboardType={editField === 'email' ? 'email-address' : 'default'}
            autoFocus
          />
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.5 }]}
            onPress={handleSaveEdit}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>Save</Text>
            }
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  profileCard: {
    backgroundColor: colors.surface, padding: 20, alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  editPhotoBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  editPhotoIcon: { fontSize: 12 },
  profileInfo: { alignItems: 'center', marginBottom: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  name: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  editBtn: {
    backgroundColor: colors.primaryFaint, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  editBtnText: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  phone: { fontSize: 14, color: colors.primary, fontWeight: '600', marginBottom: 3 },
  email: { fontSize: 13, color: colors.textSecondary },
  stats: {
    flexDirection: 'row', backgroundColor: colors.surfaceHigh,
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20,
    width: '100%', alignItems: 'center',
  },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '900', color: colors.primary },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  statLine: { width: 1, height: 30, backgroundColor: colors.border },
  section: { paddingHorizontal: 16, paddingTop: 16 },
  sectionToggle: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 12 },
  toggleChev: { fontSize: 13, color: colors.textHint },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  menuCard: {
    backgroundColor: colors.surface, borderRadius: 14, overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  menuLabel: { flex: 1, fontSize: 15, color: colors.textPrimary },
  menuVal: { fontSize: 14, color: colors.textSecondary, marginRight: 6 },
  chev: { fontSize: 20, color: colors.textHint },
  danger: { color: colors.error },
  version: { textAlign: 'center', fontSize: 12, color: colors.textHint, marginTop: 20 },
  // Edit modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  editSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border,
    alignSelf: 'center', marginBottom: 16,
  },
  editTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  editHint: { fontSize: 12, color: colors.textHint, marginBottom: 14 },
  editInput: {
    backgroundColor: colors.surfaceHigh, borderRadius: 12, borderWidth: 1.5,
    borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: colors.textPrimary, marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
