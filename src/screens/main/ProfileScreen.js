/**
 * ProfileScreen — TikTok-style layout
 * Avatar + name + stats at top, tab bar, grid of cards below.
 * Settings opens as a modal sheet.
 */
import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, Platform, ActivityIndicator, Switch,
  Modal, TouchableWithoutFeedback, TextInput,
  Dimensions, FlatList,
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
const CARD_W    = (MAX_W - 3) / 3   // 3-column grid like TikTok

const TABS = [
  { key: 'my',       label: 'My Events' },
  { key: 'attending', label: 'Attending' },
  { key: 'liked',    label: 'Liked' },
]

export default function ProfileScreen({ navigation }) {
  const { colors, isDark, toggle: toggleTheme } = useThemeStore()
  const { user, logout, updateProfile }         = useAuthStore()
  const { events, attending, likedEvents, loadLiked } = useEventsStore()

  const [activeTab,   setActiveTab]   = useState('my')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editField,   setEditField]   = useState(null)  // 'name' | 'email' | null
  const [editValue,   setEditValue]   = useState('')
  const [saving,      setSaving]      = useState(false)

  useEffect(() => { loadLiked?.() }, [])

  const myEvents        = events.filter(e => e.organizer?.id === user?.id)
  const attendingEvents = events.filter(e => (attending || []).includes(e.id))
  const likedList       = events.filter(e => (likedEvents || []).includes(e.id))

  const tabData = {
    my:        myEvents,
    attending: attendingEvents,
    liked:     likedList,
  }

  function openEvent(e) { navigation.navigate('EventDetail', { eventId: e.id, event: e }) }

  async function pickPhoto() {
    if (Platform.OS === 'web') {
      const input = document.createElement('input')
      input.type  = 'file'
      input.accept = 'image/*'
      input.onchange = async e => {
        const file = e.target.files?.[0]
        if (!file) return
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
    }
  }

  async function saveEdit() {
    if (!editValue.trim()) return
    setSaving(true)
    try {
      await updateProfile({ [editField]: editValue.trim() })
      setEditField(null)
    } catch (err) {
      Alert.alert('Could not save', err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleSignOut() {
    Alert.alert('Sign out?', '', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        try { await logout() } catch {}
      }},
    ])
  }

  const currentData = tabData[activeTab] || []

  if (!user) return null

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.phone, { maxWidth: MAX_W }]}>
        <FlatList
          data={currentData}
          keyExtractor={e => e.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{ gap: 10, paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingBottom: 40 }}

          // Header = profile + tabs
          ListHeaderComponent={() => (
            <View>
              {/* Top bar */}
              <View style={styles.topBar}>
                <Text style={[styles.topName, { color: colors.textPrimary }]}>
                  {user.name || 'Profile'}
                </Text>
                <TouchableOpacity
                  style={[styles.settingsBtn, { backgroundColor: colors.surface }]}
                  onPress={() => setSettingsOpen(true)}
                >
                  <Text style={{ fontSize: 18 }}>☰</Text>
                </TouchableOpacity>
              </View>

              {/* Avatar + stats row */}
              <View style={styles.heroRow}>
                {/* Avatar */}
                <TouchableOpacity onPress={pickPhoto} style={styles.avatarWrap}>
                  <Avatar uri={user.avatar} name={user.name || user.phone} size={80} />
                  <View style={[styles.photoBtn, { backgroundColor: colors.primary }]}>
                    <Text style={{ fontSize: 10, color: '#fff' }}>+</Text>
                  </View>
                </TouchableOpacity>

                {/* Stats */}
                <View style={styles.statsRow}>
                  <StatBox value={myEvents.length}        label="Events"    colors={colors} />
                  <StatBox value={attendingEvents.length} label="Attending"  colors={colors} />
                  <StatBox value={likedList.length}       label="Liked"      colors={colors} />
                </View>
              </View>

              {/* Name + phone */}
              <View style={styles.bioSection}>
                <TouchableOpacity
                  style={styles.nameRow}
                  onPress={() => { setEditField('name'); setEditValue(user.name || '') }}
                >
                  <Text style={[styles.displayName, { color: colors.textPrimary }]}>
                    {user.name || 'Add your name'}
                  </Text>
                  <Text style={[styles.editHint, { color: colors.textHint }]}>  ✎</Text>
                </TouchableOpacity>
                <Text style={[styles.phone, { color: colors.textSecondary }]}>{user.phone}</Text>
                {user.email ? (
                  <Text style={[styles.emailTxt, { color: colors.textHint }]}>{user.email}</Text>
                ) : (
                  <TouchableOpacity onPress={() => { setEditField('email'); setEditValue('') }}>
                    <Text style={[styles.addEmail, { color: colors.primary }]}>+ Add email</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Tab bar */}
              <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
                {TABS.map(tab => (
                  <TouchableOpacity
                    key={tab.key}
                    style={[
                      styles.tab,
                      activeTab === tab.key && { borderBottomWidth: 2, borderBottomColor: colors.primary }
                    ]}
                    onPress={() => setActiveTab(tab.key)}
                  >
                    <Text style={[
                      styles.tabTxt,
                      { color: activeTab === tab.key ? colors.primary : colors.textSecondary }
                    ]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Padding before grid */}
              <View style={{ height: 12 }} />
            </View>
          )}

          // Empty state
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text style={{ fontSize: 44 }}>
                {activeTab === 'my' ? '🎭' : activeTab === 'attending' ? '🎟️' : '🤍'}
              </Text>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {activeTab === 'my' ? 'No events yet'
                  : activeTab === 'attending' ? 'Not attending anything'
                  : 'No liked events'}
              </Text>
              <Text style={[styles.emptySub, { color: colors.textHint }]}>
                {activeTab === 'my' ? 'Tap Create to post your first event'
                  : activeTab === 'attending' ? 'Join an event to see it here'
                  : 'Tap ♡ on any event card'}
              </Text>
              {activeTab !== 'liked' && (
                <TouchableOpacity
                  style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                  onPress={() => navigation.navigate(activeTab === 'my' ? 'Create' : 'Home')}
                >
                  <Text style={styles.emptyBtnTxt}>
                    {activeTab === 'my' ? 'Create Event' : 'Explore Events'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          renderItem={({ item, index }) => (
            <View style={{ flex: 1 }}>
              <EventCard event={item} onPress={openEvent} style={{ marginBottom: 10 }} />
            </View>
          )}
        />

        {/* ── Settings sheet ─────────────────────────── */}
        <Modal visible={settingsOpen} transparent animationType="slide">
          <TouchableWithoutFeedback onPress={() => setSettingsOpen(false)}>
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Settings</Text>

            <View style={styles.settingsGroup}>
              {/* Theme */}
              <View style={[styles.settingRow, { borderBottomColor: colors.divider, borderBottomWidth: 1 }]}>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                  {isDark ? '🌙  Dark Mode' : '☀️  Light Mode'}
                </Text>
                <Switch
                  value={isDark} onValueChange={toggleTheme}
                  trackColor={{ false: colors.border, true: colors.primary + '66' }}
                  thumbColor={isDark ? colors.primary : '#f4f3f4'}
                />
              </View>

              <SettingItem label="Edit Name"    onPress={() => { setSettingsOpen(false); setTimeout(() => { setEditField('name');  setEditValue(user.name || '') }, 300) }} colors={colors} />
              <SettingItem label="Edit Email"   onPress={() => { setSettingsOpen(false); setTimeout(() => { setEditField('email'); setEditValue(user.email || '') }, 300) }} colors={colors} />
              <SettingItem label="Change Photo" onPress={() => { setSettingsOpen(false); setTimeout(pickPhoto, 300) }} colors={colors} />
              <SettingItem label="Help & Support" onPress={() => {}} colors={colors} />
              <SettingItem label="Sign Out" onPress={() => { setSettingsOpen(false); setTimeout(handleSignOut, 300) }} colors={colors} danger last />
            </View>
          </View>
        </Modal>

        {/* ── Edit name/email sheet ──────────────────── */}
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
              <Text style={[styles.editNote, { color: colors.textHint }]}>
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

function StatBox({ value, label, colors }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statNum, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  )
}

function SettingItem({ label, onPress, danger, last, colors }) {
  return (
    <TouchableOpacity
      style={[styles.settingRow, !last && { borderBottomColor: colors.divider, borderBottomWidth: 1 }]}
      onPress={onPress} activeOpacity={0.7}
    >
      <Text style={[styles.settingLabel, { color: danger ? colors.error : colors.textPrimary }]}>
        {label}
      </Text>
      <Text style={[styles.settingChev, { color: danger ? colors.error : colors.textHint }]}>›</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  safe:  { flex: 1, alignItems: 'center' },
  phone: { flex: 1, width: '100%' },

  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4,
  },
  topName:     { fontSize: 17, fontWeight: '800' },
  settingsBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  // Hero row — avatar left, stats right (TikTok style)
  heroRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 20,
  },
  avatarWrap: { position: 'relative' },
  photoBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statBox:  { alignItems: 'center' },
  statNum:  { fontSize: 18, fontWeight: '900' },
  statLabel:{ fontSize: 11, marginTop: 2 },

  // Bio
  bioSection: { paddingHorizontal: 16, paddingBottom: 14 },
  nameRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  displayName:{ fontSize: 16, fontWeight: '700' },
  editHint:   { fontSize: 14 },
  phone:      { fontSize: 13, marginBottom: 2 },
  emailTxt:   { fontSize: 12 },
  addEmail:   { fontSize: 13, fontWeight: '600' },

  // Tabs
  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1,
  },
  tab:    { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabTxt: { fontSize: 13, fontWeight: '700' },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 50, paddingHorizontal: 32, gap: 10, width: '100%' },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptySub:   { fontSize: 14, textAlign: 'center' },
  emptyBtn:   { borderRadius: 10, paddingHorizontal: 22, paddingVertical: 11, marginTop: 4 },
  emptyBtnTxt:{ color: '#fff', fontWeight: '700', fontSize: 14 },

  // Modals
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: 22, paddingBottom: 44,
  },
  handle:     { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  sheetTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },

  settingsGroup: { borderRadius: 14, overflow: 'hidden' },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 4, paddingVertical: 15,
  },
  settingLabel: { flex: 1, fontSize: 15 },
  settingChev:  { fontSize: 20 },

  editNote:   { fontSize: 12, marginBottom: 14 },
  editInput: {
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, marginBottom: 16,
  },
  saveBtn:    { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  saveBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
