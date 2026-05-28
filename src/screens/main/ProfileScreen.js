/**
 * ProfileScreen — 4 tabs: Own Events | Attended | Attending | Liked
 * Single ScrollView. Consistent width always.
 */
import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, Dimensions, FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Svg, Path, Circle } from 'react-native-svg'
import useThemeStore  from '../../store/themeStore'
import useAuthStore   from '../../store/authStore'
import useEventsStore from '../../store/eventsStore'
import Avatar         from '../../components/common/Avatar'
import EventCard      from '../../components/events/EventCard'
import { uploadApi }  from '../../services/api'

const { width } = Dimensions.get('window')
const MAX_W  = Math.min(width, 500)
const GAP    = 12
const PAD    = 16
const CARD_W = (MAX_W - PAD * 2 - GAP) / 2

const TABS = [
  { key: 'own',       label: 'Own Events' },
  { key: 'attended',  label: 'Attended'   },
  { key: 'attending', label: 'Attending'  },
  { key: 'liked',     label: 'Liked'      },
]

const EMPTY = {
  own:       { icon: '🎭', title: 'No events yet',         sub: 'Create your first event' },
  attended:  { icon: '✅', title: 'No past events',        sub: 'Events you attended show here' },
  attending: { icon: '🎟️', title: 'Not attending anything', sub: 'Join an event to see it here' },
  liked:     { icon: '🤍', title: 'No liked events',       sub: 'Tap ♡ on any card to save it' },
}

function GearIcon({ color }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  )
}

export default function ProfileScreen({ navigation }) {
  const { colors }  = useThemeStore()
  const { user }    = useAuthStore()
  const { events, attending, likedEvents, loadLiked } = useEventsStore()

  const [activeTab, setActiveTab] = useState('own')

  useEffect(() => { loadLiked?.() }, [])

  if (!user) return null

  const now = new Date()

  const ownEvents       = events.filter(e => e.organizer?.id === user.id)
  const attendingEvents = events.filter(e => (attending || []).includes(e.id) && new Date(e.endTime) > now)
  const attendedEvents  = events.filter(e => (attending || []).includes(e.id) && new Date(e.endTime) <= now)
  const likedList       = events.filter(e => (likedEvents || []).includes(e.id))

  const tabData = {
    own:       ownEvents,
    attending: attendingEvents,
    attended:  attendedEvents,
    liked:     likedList,
  }

  const current = tabData[activeTab] || []

  function openEvent(e) { navigation.navigate('EventDetail', { eventId: e.id, event: e }) }

  async function pickPhoto() {
    if (Platform.OS !== 'web') return
    const input  = document.createElement('input')
    input.type   = 'file'; input.accept = 'image/*'
    input.onchange = async e => {
      const file = e.target.files?.[0]; if (!file) return
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const { updateProfile } = require('../../store/authStore').default.getState()
          const res = await uploadApi.upload(reader.result)
          await updateProfile({ avatar_url: res.url, avatar: res.url })
        } catch {}
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[s.phone, { maxWidth: MAX_W }]}>

        {/* Top bar */}
        <View style={s.topBar}>
          <Text style={[s.topName, { color: colors.textPrimary }]}>{user.name || 'Profile'}</Text>
          <TouchableOpacity
            style={[s.gearBtn, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <GearIcon color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* Hero — avatar left, stats right */}
          <View style={s.hero}>
            <TouchableOpacity onPress={pickPhoto} style={s.avatarWrap} activeOpacity={0.85}>
              <Avatar uri={user.avatar} name={user.name || user.phone} size={80} />
              <View style={[s.plusBtn, { backgroundColor: colors.primary }]}>
                <Text style={{ color: '#fff', fontSize: 14, lineHeight: 20, fontWeight: '800' }}>+</Text>
              </View>
            </TouchableOpacity>
            <View style={s.stats}>
              <StatBox value={ownEvents.length}       label="Events"    colors={colors} />
              <StatBox value={attendingEvents.length} label="Attending" colors={colors} />
              <StatBox value={likedList.length}       label="Liked"     colors={colors} />
            </View>
          </View>

          {/* Bio */}
          <View style={s.bio}>
            <Text style={[s.name, { color: colors.textPrimary }]}>{user.name || 'Add your name'}</Text>
            <Text style={[s.phone, { color: colors.textSecondary }]}>{user.phone}</Text>
            {user.email && <Text style={[s.email, { color: colors.textHint }]}>{user.email}</Text>}
          </View>

          {/* Tabs — 4 of them */}
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            style={[s.tabBar, { borderBottomColor: colors.border }]}
            contentContainerStyle={{ paddingHorizontal: 4 }}
          >
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[s.tab, activeTab === tab.key && { borderBottomWidth: 2, borderBottomColor: colors.primary }]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[s.tabTxt, { color: activeTab === tab.key ? colors.primary : colors.textSecondary }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Content — full width always */}
          <View style={s.gridWrap}>
            {current.length === 0 ? (
              <View style={s.empty}>
                <Text style={{ fontSize: 44, marginBottom: 10 }}>{EMPTY[activeTab].icon}</Text>
                <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>{EMPTY[activeTab].title}</Text>
                <Text style={[s.emptySub,   { color: colors.textHint }]}>{EMPTY[activeTab].sub}</Text>
                {(activeTab === 'own' || activeTab === 'attending') && (
                  <TouchableOpacity
                    style={[s.emptyBtn, { backgroundColor: colors.primary }]}
                    onPress={() => navigation.navigate(activeTab === 'own' ? 'Create' : 'Home')}
                  >
                    <Text style={s.emptyBtnTxt}>
                      {activeTab === 'own' ? 'Create Event' : 'Explore Events'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={s.grid}>
                {current.map(e => (
                  <EventCard key={e.id} event={e} onPress={openEvent} style={{ width: CARD_W, marginBottom: GAP }} />
                ))}
                {current.length % 2 !== 0 && <View style={{ width: CARD_W }} />}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

function StatBox({ value, label, colors }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: '900', color: colors.textPrimary }}>{value}</Text>
      <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>{label}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  safe:    { flex: 1, alignItems: 'center' },
  phone:   { flex: 1, width: '100%' },
  topBar:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  topName: { fontSize: 17, fontWeight: '800' },
  gearBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  hero:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 16 },
  avatarWrap: { position: 'relative' },
  plusBtn: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  stats:   { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  bio:     { paddingHorizontal: 16, paddingBottom: 14 },
  name:    { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  phone:   { fontSize: 13, marginBottom: 1 },
  email:   { fontSize: 12 },
  tabBar:  { borderBottomWidth: 1, flexGrow: 0 },
  tab:     { paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
  tabTxt:  { fontSize: 13, fontWeight: '700' },
  gridWrap:{ width: '100%', minHeight: 300 },
  grid:    { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, padding: PAD },
  empty:   { alignItems: 'center', paddingVertical: 50, paddingHorizontal: PAD, width: '100%' },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  emptySub:   { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  emptyBtn:   { borderRadius: 10, paddingHorizontal: 22, paddingVertical: 11 },
  emptyBtnTxt:{ color: '#fff', fontWeight: '700', fontSize: 14 },
})
