/**
 * ProfileScreen — clean, consistent, scrollable.
 *
 * Layout:
 *   SafeAreaView (flex:1)
 *     ScrollView (fills everything, one scroll for the whole page)
 *       Profile header (avatar, stats, bio)
 *       Tab bar (sticky-ish, always same width)
 *       Grid of cards
 *
 * Card grid uses fixed column width so it never changes size.
 * Settings opens as a pushed screen — gear icon top right.
 */
import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, Dimensions,
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
const MAX_W     = Math.min(width, 500)
// Two-column grid — same width always, whether 0 or 20 events
const COL_GAP   = 12
const GRID_PAD  = 16
const CARD_W    = (MAX_W - GRID_PAD * 2 - COL_GAP) / 2

const TABS = [
  { key: 'my',       label: 'My Events'  },
  { key: 'attending',label: 'Attending'  },
  { key: 'liked',    label: 'Liked'      },
]

function GearIcon({ color }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  )
}

export default function ProfileScreen({ navigation }) {
  const { colors }  = useThemeStore()
  const { user }    = useAuthStore()
  const { events, attending, likedEvents, loadLiked } = useEventsStore()

  const [activeTab, setActiveTab] = useState('my')

  useEffect(() => { loadLiked?.() }, [])

  const myEvents        = events.filter(e => e.organizer?.id === user?.id)
  const attendingEvents = events.filter(e => (attending || []).includes(e.id))
  const likedList       = events.filter(e => (likedEvents || []).includes(e.id))

  const tabData = { my: myEvents, attending: attendingEvents, liked: likedList }
  const current = tabData[activeTab] || []

  function openEvent(e) { navigation.navigate('EventDetail', { eventId: e.id, event: e }) }

  function pickPhoto() {
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
          const { updateProfile } = require('../../store/authStore').default.getState()
          const res = await uploadApi.upload(reader.result)
          await updateProfile({ avatar_url: res.url, avatar: res.url })
        } catch {}
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  if (!user) return null

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.phone, { maxWidth: MAX_W }]}>

        {/* Fixed top bar — always same width */}
        <View style={styles.topBar}>
          <Text style={[styles.topName, { color: colors.textPrimary }]}>
            {user.name || 'Profile'}
          </Text>
          {/* Gear icon — opens Settings as a screen, not a popup */}
          <TouchableOpacity
            style={[styles.gearBtn, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <GearIcon color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Single ScrollView wraps everything */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── Avatar + stats row (TikTok style) ────── */}
          <View style={styles.heroRow}>
            <TouchableOpacity onPress={pickPhoto} style={styles.avatarWrap} activeOpacity={0.85}>
              <Avatar uri={user.avatar} name={user.name || user.phone} size={82} />
              <View style={[styles.photoPlus, { backgroundColor: colors.primary }]}>
                <Text style={styles.photoPlusTxt}>+</Text>
              </View>
            </TouchableOpacity>

            {/* Stats — number on top, label below */}
            <View style={styles.statsRow}>
              <Stat value={myEvents.length}        label="Events"    colors={colors} />
              <Stat value={attendingEvents.length}  label="Attending" colors={colors} />
              <Stat value={likedList.length}        label="Liked"     colors={colors} />
            </View>
          </View>

          {/* ── Bio ──────────────────────────────────── */}
          <View style={styles.bio}>
            <Text style={[styles.displayName, { color: colors.textPrimary }]}>
              {user.name || 'Add your name'}
            </Text>
            <Text style={[styles.phoneNum, { color: colors.textSecondary }]}>
              {user.phone}
            </Text>
            {user.email
              ? <Text style={[styles.emailTxt, { color: colors.textHint }]}>{user.email}</Text>
              : null
            }
          </View>

          {/* ── Tab bar ──────────────────────────────── */}
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

          {/* ── Content grid ─────────────────────────── */}
          {/* Always full width — empty or full */}
          <View style={styles.gridWrap}>
            {current.length === 0 ? (
              // Empty state — same width as grid
              <View style={styles.empty}>
                <Text style={{ fontSize: 44, marginBottom: 10 }}>
                  {activeTab === 'my' ? '🎭' : activeTab === 'attending' ? '🎟️' : '🤍'}
                </Text>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  {activeTab === 'my'       ? 'No events yet'
                  : activeTab === 'attending' ? 'Not attending anything'
                  :                             'No liked events'}
                </Text>
                <Text style={[styles.emptySub, { color: colors.textHint }]}>
                  {activeTab === 'my'       ? 'Create your first event below'
                  : activeTab === 'attending' ? 'Go to Home and join one'
                  :                             'Tap ♡ on any event card'}
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
            ) : (
              // Two-column grid — consistent card width
              <View style={styles.grid}>
                {current.map(e => (
                  <EventCard
                    key={e.id}
                    event={e}
                    onPress={openEvent}
                    style={{ width: CARD_W, marginBottom: COL_GAP }}
                  />
                ))}
                {/* If odd number of cards, add a spacer so last card doesn't stretch */}
                {current.length % 2 !== 0 && (
                  <View style={{ width: CARD_W }} />
                )}
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

function Stat({ value, label, colors }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statNum, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe:  { flex: 1, alignItems: 'center' },
  phone: { flex: 1, width: '100%' },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
  },
  topName:  { fontSize: 17, fontWeight: '800' },
  gearBtn:  { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },

  scrollContent: { paddingBottom: 20 },

  // Hero
  heroRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
    gap: 16,
  },
  avatarWrap: { position: 'relative' },
  photoPlus: {
    position: 'absolute', bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  photoPlusTxt: { color: '#fff', fontSize: 16, lineHeight: 22, fontWeight: '700' },

  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  stat:      { alignItems: 'center' },
  statNum:   { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 11, marginTop: 2 },

  // Bio
  bio: { paddingHorizontal: 16, paddingBottom: 14 },
  displayName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  phoneNum:    { fontSize: 13, marginBottom: 1 },
  emailTxt:    { fontSize: 12 },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1, paddingVertical: 12,
    alignItems: 'center',
  },
  tabTxt: { fontSize: 13, fontWeight: '700' },

  // Grid — always full page width
  gridWrap: {
    width: '100%',
    minHeight: 300,   // ensures page height stays consistent even when empty
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: COL_GAP,
    padding: GRID_PAD,
  },

  // Empty state — centered but same full width
  empty: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: GRID_PAD,
    width: '100%',
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  emptySub:   { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  emptyBtn:   { borderRadius: 10, paddingHorizontal: 22, paddingVertical: 11 },
  emptyBtnTxt:{ color: '#fff', fontWeight: '700', fontSize: 14 },
})
