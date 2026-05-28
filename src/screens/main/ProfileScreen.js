/**
 * ProfileScreen.js
 * Tabs: My Events | Attending | Liked | Settings
 * Sign out actually works.
 */
import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Platform, ActivityIndicator,
  Switch, Modal, TouchableWithoutFeedback, TextInput,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore  from '../../store/themeStore'
import useAuthStore   from '../../store/authStore'
import useEventsStore from '../../store/eventsStore'
import Avatar         from '../../components/common/Avatar'
import EventCard      from '../../components/events/EventCard'
import { uploadApi }  from '../../services/api'

const { width } = Dimensions.get('window')
const MAX_W     = Math.min(width, 500)
const TABS      = ['My Events', 'Attending', 'Liked', 'Settings']

export default function ProfileScreen({ navigation }) {
  const { colors, isDark, toggle: toggleTheme } = useThemeStore()
  const { user, logout, updateProfile }         = useAuthStore()
  const { events, attending, likedEvents, loadLiked } = useEventsStore()

  const [activeTab, setActiveTab] = useState('My Events')
  const [editModal, setEditModal] = useState(false)
  const [editField, setEditField] = useState('')
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving]       = useState(false)

  useEffect(() => { loadLiked?.() }, [])

  const myEvents        = events.filter(e => e.organizer?.id === user?.id)
  const attendingEvents = events.filter(e => attending.includes(e.id))
  const likedList       = events.filter(e => (likedEvents || []).includes(e.id))

  function openEvent(e) { navigation.navigate('EventDetail', { eventId: e.id, event: e }) }

  function openEdit(field) {
    setEditField(field)
    setEditValue(field === 'name' ? (user?.name || '') : (user?.email || ''))
    setEditModal(true)
  }

  async function saveEdit() {
    if (!editValue.trim()) return
    setSaving(true)
    try {
      await updateProfile({ [editField === 'name' ? 'name' : 'email']: editValue.trim() })
      setEditModal(false)
    } catch (err) {
      Alert.alert('Could not save', err.message)
    } finally {
      setSaving(false)
    }
  }

  async function pickPhoto() {
    if (Platform.OS === 'web') {
      const input = document.createElement('input')
      input.type  = 'file'
      input.accept = 'image/*'
      input.onchange = async e => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024) { Alert.alert('Too large', 'Max 5MB'); return }
        const reader = new FileReader()
        reader.onload = async () => {
          try {
            const res = await uploadApi.upload(reader.result)
            await updateProfile({ avatar_url: res.url, avatar: res.url })
          } catch {
            await updateProfile({ avatar_url: reader.result, avatar: reader.result })
          }
        }
        reader.readAsDataURL(file)
      }
      input.click()
    } else {
      try {
        const IP     = require('expo-image-picker')
        const { status } = await IP.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') return
        const r = await IP.launchImageLibraryAsync({ allowsEditing: true, aspect: [1,1], quality: 0.7, base64: true })
        if (!r.canceled) {
          const b64 = `data:image/jpeg;base64,${r.assets[0].base64}`
          try {
            const res = await uploadApi.upload(b64)
            await updateProfile({ avatar_url: res.url, avatar: res.url })
          } catch {
            await updateProfile({ avatar_url: r.assets[0].uri, avatar: r.assets[0].uri })
          }
        }
      } catch (err) { Alert.alert('Error', err.message) }
    }
  }

  function handleSignOut() {
    Alert.alert(
      'Sign out?',
      'You will need your phone number to sign back in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout()
              // Navigation resets automatically when isAuthenticated becomes false
            } catch (err) {
              Alert.alert('Error', err.message)
            }
          },
        },
      ]
    )
  }

  if (!user) return null

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.phone, { maxWidth: MAX_W }]}>
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Profile header */}
          <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
            <TouchableOpacity onPress={pickPhoto} activeOpacity={0.8} style={styles.avatarWrap}>
              <Avatar uri={user.avatar} name={user.name || user.phone} size={76} />
              <View style={[styles.photoEdit, { backgroundColor: colors.primary }]}>
                <Text style={{ fontSize: 11 }}>📷</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.profileMeta}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: colors.textPrimary }]}>
                  {user.name || 'Add your name'}
                </Text>
                <TouchableOpacity
                  style={[styles.editBtn, { backgroundColor: colors.primaryFaint }]}
                  onPress={() => openEdit('name')}
                >
                  <Text style={[styles.editBtnTxt, { color: colors.primary }]}>Edit</Text>
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
            <View style={[styles.statsRow, { backgroundColor: colors.surfaceHigh }]}>
              <StatBox label="Created"   value={myEvents.length}        colors={colors} />
              <View style={[styles.statLine, { backgroundColor: colors.border }]} />
              <StatBox label="Attending" value={attendingEvents.length} colors={colors} />
              <View style={[styles.statLine, { backgroundColor: colors.border }]} />
              <StatBox label="Liked"     value={likedList.length}       colors={colors} />
            </View>
          </View>

          {/* Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
            contentContainerStyle={styles.tabBarContent}
          >
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  activeTab === tab && { borderBottomWidth: 2, borderBottomColor: colors.primary }
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabTxt, { color: activeTab === tab ? colors.primary : colors.textSecondary }]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* My Events */}
          {activeTab === 'My Events' && (
            <View style={styles.section}>
              {myEvents.length === 0 ? (
                <Empty icon="🎭" title="No events yet" sub="Create your first event!" colors={colors}
                  action="Create Event" onAction={() => navigation.navigate('Create')} />
              ) : (
                <View style={styles.grid}>
                  {myEvents.map(e => <EventCard key={e.id} event={e} onPress={openEvent} style={{ marginBottom: 12 }} />)}
                </View>
              )}
            </View>
          )}

          {/* Attending */}
          {activeTab === 'Attending' && (
            <View style={styles.section}>
              {attendingEvents.length === 0 ? (
                <Empty icon="🎟️" title="Not attending anything" sub="Find an event and join it!" colors={colors}
                  action="Explore" onAction={() => navigation.navigate('Home')} />
              ) : (
                <View style={styles.grid}>
                  {attendingEvents.map(e => <EventCard key={e.id} event={e} onPress={openEvent} style={{ marginBottom: 12 }} />)}
                </View>
              )}
            </View>
          )}

          {/* Liked */}
          {activeTab === 'Liked' && (
            <View style={styles.section}>
              {likedList.length === 0 ? (
                <Empty icon="🤍" title="No liked events" sub="Tap ♡ on any event to save it" colors={colors} />
              ) : (
                <View style={styles.grid}>
                  {likedList.map(e => <EventCard key={e.id} event={e} onPress={openEvent} style={{ marginBottom: 12 }} />)}
                </View>
              )}
            </View>
          )}

          {/* Settings */}
          {activeTab === 'Settings' && (
            <View style={styles.section}>
              <View style={[styles.menuCard, { backgroundColor: colors.surface }]}>
                {/* Dark/light toggle */}
                <View style={[styles.menuRow, { borderBottomColor: colors.divider }]}>
                  <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
                    {isDark ? '🌙  Dark Mode' : '☀️  Light Mode'}
                  </Text>
                  <Switch
                    value={isDark}
                    onValueChange={toggleTheme}
                    trackColor={{ false: colors.border, true: colors.primary + '66' }}
                    thumbColor={isDark ? colors.primary : '#f4f3f4'}
                  />
                </View>
                <MenuRow label="Edit Name"    onPress={() => openEdit('name')}  colors={colors} />
                <MenuRow label="Edit Email"   onPress={() => openEdit('email')} colors={colors} value={user.email || ''} />
                <MenuRow label="Change Photo" onPress={pickPhoto}              colors={colors} />
                <MenuRow label="Help & Support" onPress={() => {}}             colors={colors} />
                {/* Sign out - clearly working */}
                <MenuRow label="Sign Out" onPress={handleSignOut} colors={colors} danger last />
              </View>
              <Text style={[styles.version, { color: colors.textHint }]}>REDE v1.0</Text>
            </View>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Edit modal */}
        <Modal visible={editModal} transparent animationType="slide">
          <TouchableWithoutFeedback onPress={() => setEditModal(false)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />
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
                  padding: '14px 16px', fontSize: 16, fontFamily: 'inherit', outline: 'none', marginBottom: 16,
                }}
              />
            ) : (
              <TextInput
                style={[styles.editInput, { backgroundColor: colors.surfaceHigh, borderColor: colors.border, color: colors.textPrimary }]}
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
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnTxt}>Save</Text>}
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  )
}

function StatBox({ label, value, colors }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: '900', color: colors.primary }}>{value}</Text>
      <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>{label}</Text>
    </View>
  )
}

function MenuRow({ label, value, onPress, danger, last, colors }) {
  return (
    <TouchableOpacity
      style={[styles.menuRow, !last && { borderBottomColor: colors.divider, borderBottomWidth: 1 }]}
      onPress={onPress} activeOpacity={0.7}
    >
      <Text style={[styles.menuLabel, { color: danger ? colors.error : colors.textPrimary }]}>{label}</Text>
      {value ? <Text style={[styles.menuVal, { color: colors.textSecondary }]}>{value}</Text> : null}
      <Text style={[styles.chev, { color: danger ? colors.error : colors.textHint }]}>›</Text>
    </TouchableOpacity>
  )
}

function Empty({ icon, title, sub, colors, action, onAction }) {
  return (
    <View style={styles.empty}>
      <Text style={{ fontSize: 40 }}>{icon}</Text>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.emptySub, { color: colors.textHint }]}>{sub}</Text>
      {action && (
        <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: colors.primary }]} onPress={onAction}>
          <Text style={styles.emptyBtnTxt}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  safe:    { flex: 1, alignItems: 'center' },
  phone:   { flex: 1, width: '100%' },
  profileCard: { alignItems: 'center', padding: 20, marginBottom: 0 },
  avatarWrap:  { position: 'relative', marginBottom: 12 },
  photoEdit: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  profileMeta: { alignItems: 'center', marginBottom: 16, width: '100%' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  name:    { fontSize: 20, fontWeight: '800' },
  editBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  editBtnTxt: { fontSize: 12, fontWeight: '700' },
  phone:   { fontSize: 14, fontWeight: '600', marginBottom: 3 },
  email:   { fontSize: 13 },
  statsRow: { flexDirection: 'row', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, width: '100%', alignItems: 'center' },
  statLine: { width: 1, height: 30 },
  tabBar: { borderBottomWidth: 1, marginTop: 8 },
  tabBarContent: { paddingHorizontal: 4 },
  tab:    { paddingHorizontal: 16, paddingVertical: 13, alignItems: 'center' },
  tabTxt: { fontSize: 13, fontWeight: '700' },
  section: { padding: 16 },
  grid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  empty:   { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptySub:   { fontSize: 14 },
  emptyBtn:   { borderRadius: 10, paddingHorizontal: 20, paddingVertical: 11, marginTop: 6 },
  emptyBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  menuCard: { borderRadius: 14, overflow: 'hidden' },
  menuRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15 },
  menuLabel: { flex: 1, fontSize: 15 },
  menuVal:   { fontSize: 14, marginRight: 6 },
  chev:      { fontSize: 20 },
  version:   { textAlign: 'center', fontSize: 12, marginTop: 20 },
  editSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  handle:    { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  editTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  editHint:  { fontSize: 12, marginBottom: 14 },
  editInput: { borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 16 },
  saveBtn:   { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  saveBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
