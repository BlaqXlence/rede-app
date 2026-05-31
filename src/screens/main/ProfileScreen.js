/**
 * ProfileScreen — bulletproof scroll, fixed width always.
 * Uses a single FlatList with the header as ListHeaderComponent.
 * Grid cards rendered inside the list so ONE scroll handles everything.
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Dimensions, ScrollView, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Svg, Path } from 'react-native-svg'
import useThemeStore  from '../../store/themeStore'
import useAuthStore   from '../../store/authStore'
import useEventsStore from '../../store/eventsStore'
import Avatar         from '../../components/common/Avatar'
import EventCard      from '../../components/events/EventCard'
import { uploadApi }  from '../../services/api'

const SCREEN_W = Dimensions.get('window').width
const MAX_W    = Math.min(SCREEN_W, 500)
const PAD      = 16
const GAP      = 12
const CARD_W   = (MAX_W - PAD * 2 - GAP) / 2

const TABS = [
  { key: 'own',       label: 'Own Events'  },
  { key: 'attended',  label: 'Attended'    },
  { key: 'attending', label: 'Attending'   },
  { key: 'liked',     label: 'Liked'       },
]

const EMPTY_COPY = {
  own:       { icon: '🎭', title: 'No events yet',          sub: 'Create your first event' },
  attended:  { icon: '✅', title: 'No past events',         sub: 'Events you attended show here' },
  attending: { icon: '🎟️', title: 'Not attending anything', sub: 'Join an event to see it here' },
  liked:     { icon: '🤍', title: 'No liked events',        sub: 'Tap ♡ on any card to save it' },
}

function GearIcon({ color }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  )
}

export default function ProfileScreen({ navigation }) {
  const { colors }  = useThemeStore()
  const { user }    = useAuthStore()
  const { events, attending, likedEvents, loadLiked } = useEventsStore()
  const [tab, setTab] = useState('own')

  useEffect(() => { loadLiked?.() }, [])

  if (!user) return null

  const now   = new Date()
  const sets  = {
    own:       events.filter(e => e.organizer?.id === user.id),
    attending: events.filter(e => (attending||[]).includes(e.id) && new Date(e.endTime) > now),
    attended:  events.filter(e => (attending||[]).includes(e.id) && new Date(e.endTime) <= now),
    liked:     events.filter(e => (likedEvents||[]).includes(e.id)),
  }
  const cards = sets[tab] || []

  function openEvent(e) { navigation.navigate('EventDetail', { eventId: e.id, event: e }) }

  async function pickPhoto() {
    const perm = await require('expo-image-picker').requestMediaLibraryPermissionsAsync()
    if (!perm.granted) { Alert.alert('Permission needed', 'Allow photo access to change your picture.'); return }
    const result = await require('expo-image-picker').launchImageLibraryAsync({
      mediaTypes: require('expo-image-picker').MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1,1], quality: 0.8,
    })
    if (!result.canceled && result.assets[0]) {
      try {
        const res = await uploadApi.upload(result.assets[0].uri)
        const { updateProfile } = require('../../store/authStore').default.getState()
        await updateProfile({ avatar_url: res.url, avatar: res.url })
      } catch {}
    }
  }

  // Header rendered above the grid
  const Header = useCallback(() => (
    <View>
      {/* Top bar */}
      <View style={s.topBar}>
        <Text style={[s.topName, { color: colors.textPrimary }]}>
          {user.nickname || user.name || 'Profile'}
        </Text>
        <TouchableOpacity
          style={[s.gear, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <GearIcon color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Hero */}
      <View style={s.hero}>
        <TouchableOpacity onPress={pickPhoto} activeOpacity={0.85} style={s.avatarWrap}>
          <Avatar uri={user.avatar} name={user.name || user.phone} size={80} />
          <View style={[s.plus, { backgroundColor: colors.primary }]}>
            <Text style={s.plusTxt}>+</Text>
          </View>
        </TouchableOpacity>
        <View style={s.statsRow}>
          {[
            { n: sets.own.length,       l: 'Events'    },
            { n: sets.attending.length, l: 'Attending' },
            { n: sets.liked.length,     l: 'Liked'     },
          ].map(({ n, l }) => (
            <View key={l} style={s.stat}>
              <Text style={[s.statN, { color: colors.textPrimary }]}>{n}</Text>
              <Text style={[s.statL, { color: colors.textSecondary }]}>{l}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bio */}
      <View style={s.bio}>
        <Text style={[s.name, { color: colors.textPrimary }]}>
          {user.nickname || user.name || 'Add your name'}
        </Text>
        <Text style={[s.phone, { color: colors.textSecondary }]}>{user.phone}</Text>
        {!!user.email && <Text style={[s.email, { color: colors.textHint }]}>{user.email}</Text>}
      </View>

      {/* Tab bar — horizontal scroll */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={[s.tabBar, { borderBottomColor: colors.border }]}
        contentContainerStyle={s.tabBarInner}
      >
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.tabBtn, tab === t.key && { borderBottomWidth: 2, borderBottomColor: colors.primary }]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[s.tabTxt, { color: tab === t.key ? colors.primary : colors.textSecondary }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Spacing before grid */}
      <View style={{ height: PAD }} />

      {/* Empty state lives inside header so FlatList doesn't fight it */}
      {cards.length === 0 && (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>{EMPTY_COPY[tab].icon}</Text>
          <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>{EMPTY_COPY[tab].title}</Text>
          <Text style={[s.emptySub,   { color: colors.textHint   }]}>{EMPTY_COPY[tab].sub}</Text>
          {(tab === 'own' || tab === 'attending') && (
            <TouchableOpacity
              style={[s.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate(tab === 'own' ? 'Create' : 'Home')}
            >
              <Text style={s.emptyBtnTxt}>
                {tab === 'own' ? 'Create Event' : 'Explore Events'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  ), [tab, colors, user, sets])

  // Pair cards into rows of 2 for the grid
  const rows = []
  for (let i = 0; i < cards.length; i += 2) {
    rows.push(cards.slice(i, i + 2))
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[s.container, { maxWidth: MAX_W }]}>
        <FlatList
          data={rows}
          keyExtractor={(_, i) => String(i)}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={Header}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item: row }) => (
            <View style={s.gridRow}>
              {row.map(e => (
                <EventCard
                  key={e.id}
                  event={e}
                  onPress={openEvent}
                  style={{ width: CARD_W }}
                />
              ))}
              {/* spacer if odd */}
              {row.length === 1 && <View style={{ width: CARD_W }} />}
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:      { flex: 1, alignItems: 'center' },
  container: { flex: 1, width: '100%' },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PAD, paddingTop: 12, paddingBottom: 4,
  },
  topName: { fontSize: 17, fontWeight: '800' },
  gear:    { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },

  hero: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: PAD, paddingTop: 12, paddingBottom: 8,
    gap: 16,
  },
  avatarWrap: { position: 'relative' },
  plus: {
    position: 'absolute', bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  plusTxt: { color: '#fff', fontSize: 16, fontWeight: '800', lineHeight: 22 },

  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  stat:  { alignItems: 'center' },
  statN: { fontSize: 20, fontWeight: '900' },
  statL: { fontSize: 11, marginTop: 2 },

  bio:   { paddingHorizontal: PAD, paddingBottom: 12 },
  name:  { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  phone: { fontSize: 13, marginBottom: 1 },
  email: { fontSize: 12 },

  tabBar:      { borderBottomWidth: 1, flexGrow: 0 },
  tabBarInner: { paddingHorizontal: 4 },
  tabBtn:      { paddingHorizontal: 16, paddingVertical: 12 },
  tabTxt:      { fontSize: 13, fontWeight: '700' },

  // Grid row
  gridRow: {
    flexDirection: 'row',
    paddingHorizontal: PAD,
    gap: GAP,
    marginBottom: GAP,
  },

  // Empty state
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: PAD,
  },
  emptyIcon:  { fontSize: 46, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  emptySub:   { fontSize: 14, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  emptyBtn:   { borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnTxt:{ color: '#fff', fontWeight: '700', fontSize: 14 },
})
