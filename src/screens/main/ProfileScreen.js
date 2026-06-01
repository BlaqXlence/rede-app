/**
 * ProfileScreen — redesigned
 * Header: avatar | stats
 * Info: names, phone, email
 * Tabs: History | Attending | Liked
 * History/Attending: show 3 per section + "See All" expansion
 * Liked: horizontal cards only, future events
 */
import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, Alert, Image,
} from 'react-native'
import { SafeAreaView }  from 'react-native-safe-area-context'
import * as ImagePicker  from 'expo-image-picker'
import useThemeStore     from '../../store/themeStore'
import useAuthStore      from '../../store/authStore'
import useEventsStore    from '../../store/eventsStore'
import Avatar            from '../../components/common/Avatar'
import { uploadApi }     from '../../services/api'
import { formatDateShort, formatUGX } from '../../utils/formatters'
import { EVENT_CATEGORIES } from '../../constants/config'

const { width } = Dimensions.get('window')
const MAX_W     = Math.min(width, 500)
const PAD       = 14
const GAP       = 10
const GRID_CARD = (MAX_W - PAD * 2 - GAP) / 2

// ── Grid card (History — no heart, event is past) ─────────────────
function GridCard({ event, onPress, colors }) {
  const cat    = EVENT_CATEGORIES.find(c => c.id === event.category)
  const venue  = [event.location?.venueName || event.location?.name, event.location?.city].filter(Boolean).join(', ')
  return (
    <TouchableOpacity onPress={() => onPress(event)} activeOpacity={0.85}
      style={[gc.card, { width: GRID_CARD, backgroundColor: colors.surface }]}>
      <Image source={{ uri: event.coverImage }} style={gc.img} resizeMode="cover" />
      <View style={[gc.datePill]}>
        <Text style={gc.dateTxt}>{formatDateShort(event.startTime)}</Text>
      </View>
      <View style={gc.body}>
        {cat && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <View style={[gc.dot, { backgroundColor: cat.color || colors.primary }]} />
            <Text style={[gc.catTxt, { color: cat.color || colors.primary }]}>{cat.label.toUpperCase()}</Text>
          </View>
        )}
        <Text style={[gc.title, { color: colors.textPrimary }]} numberOfLines={2}>{event.title}</Text>
        {!!venue && <Text style={[gc.venue, { color: colors.textSecondary }]} numberOfLines={1}>{venue}</Text>}
        <View style={gc.footer}>
          <Text style={[gc.price, { color: event.entryFee === 0 ? colors.success : colors.primary }]}>
            {formatUGX(event.entryFee)}
          </Text>
          <Text style={[gc.going, { color: colors.textHint }]}>{event.attendeeCount || 0} went</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

// ── Horizontal card (Attending + Liked — has heart) ───────────────
function HorizCard({ event, onPress, colors }) {
  const { toggleLike, isLiked } = useEventsStore()
  const liked  = isLiked(event.id)
  const cat    = EVENT_CATEGORIES.find(c => c.id === event.category)
  const venue  = [event.location?.venueName || event.location?.name, event.location?.city].filter(Boolean).join(', ')

  return (
    <TouchableOpacity onPress={() => onPress(event)} activeOpacity={0.86}
      style={[hc.card, { backgroundColor: colors.surface }]}>
      <View>
        <Image source={{ uri: event.coverImage }} style={hc.img} resizeMode="cover" />
        {event.isNow && (
          <View style={[hc.live, { backgroundColor: '#EF4444' }]}>
            <View style={hc.liveDot} /><Text style={hc.liveTxt}>LIVE</Text>
          </View>
        )}
      </View>
      <View style={hc.info}>
        {cat && (
          <View style={[hc.catPill, { backgroundColor: (cat.color || colors.primary) + '22' }]}>
            <Text style={[hc.catTxt, { color: cat.color || colors.primary }]}>{cat.label.toUpperCase()}</Text>
          </View>
        )}
        <Text style={[hc.title, { color: colors.textPrimary }]} numberOfLines={2}>{event.title}</Text>
        <Text style={[hc.date, { color: colors.primary }]}>{formatDateShort(event.startTime)}</Text>
        {!!venue && <Text style={[hc.venue, { color: colors.textSecondary }]} numberOfLines={1}>📍 {venue}</Text>}
        <View style={hc.bottom}>
          <Text style={[hc.price, { color: event.entryFee === 0 ? colors.success : colors.primary }]}>
            {formatUGX(event.entryFee)}
          </Text>
          <TouchableOpacity
            onPress={e => { e.stopPropagation?.(); toggleLike(event.id) }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[hc.heartBtn, {
              backgroundColor: liked ? '#EF444420' : 'transparent',
              borderColor:     liked ? '#EF4444'   : colors.primary,
            }]}
          >
            <Text style={{ fontSize: 15, color: liked ? '#EF4444' : colors.primary }}>
              {liked ? '♥' : '♡'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )
}

// ── Section with "See All" (show 3 items, expand on tap) ──────────
function Section({ title, events, renderItem, colors, emptyMsg }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? events : events.slice(0, 3)
  const hasMore = events.length > 3

  if (events.length === 0) return (
    <View style={sec.emptyWrap}>
      <Text style={[sec.emptyTitle, { color: colors.textPrimary }]}>{emptyMsg.title}</Text>
      <Text style={[sec.emptySub, { color: colors.textHint }]}>{emptyMsg.sub}</Text>
    </View>
  )

  return (
    <View style={sec.wrap}>
      <View style={[sec.header, { borderBottomColor: colors.border }]}>
        <Text style={[sec.label, { color: colors.textHint }]}>{title.toUpperCase()}</Text>
        <Text style={[sec.count, { color: colors.textHint }]}>{events.length}</Text>
      </View>
      {visible.map(e => renderItem(e))}
      {hasMore && (
        <TouchableOpacity
          style={[sec.seeAllBtn, { borderColor: colors.border }]}
          onPress={() => setExpanded(x => !x)}
        >
          <Text style={[sec.seeAllTxt, { color: colors.primary }]}>
            {expanded ? 'Show less ↑' : `Show all ${events.length} ↓`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// ── Grid section (2-col) ──────────────────────────────────────────
function GridSection({ title, events, onPress, colors, emptyMsg }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? events : events.slice(0, 4) // show 4 in grid = 2 rows
  const hasMore = events.length > 4

  if (events.length === 0) return (
    <View style={sec.emptyWrap}>
      <Text style={[sec.emptyTitle, { color: colors.textPrimary }]}>{emptyMsg.title}</Text>
      <Text style={[sec.emptySub,   { color: colors.textHint    }]}>{emptyMsg.sub}</Text>
    </View>
  )

  const rows = []
  for (let i = 0; i < visible.length; i += 2) rows.push(visible.slice(i, i + 2))

  return (
    <View style={sec.wrap}>
      <View style={[sec.header, { borderBottomColor: colors.border }]}>
        <Text style={[sec.label, { color: colors.textHint }]}>{title.toUpperCase()}</Text>
        <Text style={[sec.count, { color: colors.textHint }]}>{events.length}</Text>
      </View>
      <View style={gs.grid}>
        {rows.map((row, ri) => (
          <View key={ri} style={gs.row}>
            {row.map(e => <GridCard key={e.id} event={e} onPress={onPress} colors={colors} />)}
            {row.length === 1 && <View style={{ width: GRID_CARD }} />}
          </View>
        ))}
      </View>
      {hasMore && (
        <TouchableOpacity
          style={[sec.seeAllBtn, { borderColor: colors.border }]}
          onPress={() => setExpanded(x => !x)}
        >
          <Text style={[sec.seeAllTxt, { color: colors.primary }]}>
            {expanded ? 'Show less ↑' : `Show all ${events.length} ↓`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// ── Empty full tab ────────────────────────────────────────────────
function TabEmpty({ icon, title, sub, btnLabel, onBtn, colors }) {
  return (
    <View style={em.wrap}>
      <Text style={em.icon}>{icon}</Text>
      <Text style={[em.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[em.sub,   { color: colors.textHint    }]}>{sub}</Text>
      {!!btnLabel && (
        <TouchableOpacity style={[em.btn, { backgroundColor: colors.primary }]} onPress={onBtn}>
          <Text style={em.btnTxt}>{btnLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Main screen
// ─────────────────────────────────────────────────────────────────
const TABS = ['History', 'Attending', 'Liked']

export default function ProfileScreen({ navigation }) {
  const { colors }                         = useThemeStore()
  const { user, updateProfile }            = useAuthStore()
  const { events, likedEvents, attending } = useEventsStore()
  const [tab, setTab]                      = useState('History')

  if (!user) return null

  const now = new Date()
  const isPast   = e => new Date(e.endTime || e.startTime) < now
  const isFuture = e => !isPast(e)

  const myCreated  = events.filter(e => e.organizer?.id === user.id)
  const joinedIds  = attending || []
  const joinedEvts = events.filter(e => joinedIds.includes(e.id) && e.organizer?.id !== user.id)

  // History
  const myPast       = myCreated.filter(isPast)
  const attendedPast = joinedEvts.filter(isPast)

  // Attending
  const myUpcoming     = myCreated.filter(isFuture)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
  const joiningUpcoming = joinedEvts.filter(isFuture)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))

  // Liked — future only
  const likedFuture = events.filter(e =>
    (likedEvents || []).includes(e.id) && isFuture(e)
  )

  // Stats
  const totalAttended  = myPast.length + attendedPast.length
  const totalAttending = myUpcoming.length + joiningUpcoming.length
  const totalLiked     = likedFuture.length

  function openEvent(e) {
    navigation.navigate('EventDetail', { eventId: e.id, event: e })
  }

  async function pickPhoto() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!perm.granted) { Alert.alert('Permission needed', 'Allow photo access.'); return }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType?.Images || ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, aspect: [1, 1], quality: 0.85,
      })
      if (!res.canceled && res.assets?.[0]) {
        const uri = res.assets[0].uri
        await updateProfile({ avatar: uri, avatar_url: uri })
        try { const r = await uploadApi.upload(uri); await updateProfile({ avatar: r.url, avatar_url: r.url }) } catch {}
      }
    } catch {}
  }

  // ── Tab renderers ────────────────────────────────────────────────
  function renderHistory() {
    if (myPast.length === 0 && attendedPast.length === 0) return (
      <TabEmpty icon="🕐" title="No history yet"
        sub="Events you create or attend will appear here" colors={colors} />
    )
    return (
      <>
        <GridSection title="Events I created" events={myPast} onPress={openEvent} colors={colors}
          emptyMsg={{ title: 'No past events created', sub: 'Your hosted events will appear here' }} />
        <GridSection title="Events I attended" events={attendedPast} onPress={openEvent} colors={colors}
          emptyMsg={{ title: 'No attended events', sub: 'Events you joined will appear here' }} />
      </>
    )
  }

  function renderAttending() {
    if (myUpcoming.length === 0 && joiningUpcoming.length === 0) return (
      <TabEmpty icon="🎟" title="Nothing coming up"
        sub="Events you create or join appear here" btnLabel="Explore"
        onBtn={() => navigation.navigate('Home')} colors={colors} />
    )
    return (
      <>
        <Section title="My upcoming events" events={myUpcoming} colors={colors}
          emptyMsg={{ title: 'No upcoming events created', sub: '' }}
          renderItem={e => <HorizCard key={e.id} event={e} onPress={openEvent} colors={colors} />} />
        <Section title="Events I'm joining" events={joiningUpcoming} colors={colors}
          emptyMsg={{ title: 'Not joining any events', sub: '' }}
          renderItem={e => <HorizCard key={e.id} event={e} onPress={openEvent} colors={colors} />} />
      </>
    )
  }

  function renderLiked() {
    if (likedFuture.length === 0) return (
      <TabEmpty icon="🤍" title="Nothing saved yet"
        sub="Tap ♡ on upcoming events to save them here"
        btnLabel="Explore" onBtn={() => navigation.navigate('Home')} colors={colors} />
    )
    return likedFuture.map(e => <HorizCard key={e.id} event={e} onPress={openEvent} colors={colors} />)
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[s.page, { maxWidth: MAX_W }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 64 }}>

          {/* ── Header card ── */}
          <View style={[s.headerCard, { backgroundColor: colors.surface }]}>

            {/* Settings — top right, bigger */}
            <TouchableOpacity
              style={[s.gearBtn, { backgroundColor: colors.background }]}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={[s.gearIcon, { color: colors.textSecondary }]}>⚙︎</Text>
            </TouchableOpacity>

            {/* Avatar + Stats */}
            <View style={s.avatarStatsRow}>
              <TouchableOpacity onPress={pickPhoto} activeOpacity={0.82} style={s.avatarWrap}>
                <Avatar uri={user.avatar} name={user.name || user.phone} size={82} />
                <View style={[s.editBadge, { backgroundColor: colors.primary }]}>
                  <Text style={s.editBadgeTxt}>✎</Text>
                </View>
              </TouchableOpacity>

              <View style={s.statsBlock}>
                {[
                  { n: totalAttended,  l: 'Attended'  },
                  { n: totalAttending, l: 'Attending' },
                  { n: totalLiked,     l: 'Liked'     },
                ].map((st, i, arr) => (
                  <View key={st.l} style={[s.stat,
                    i < arr.length - 1 && { borderRightWidth: 1, borderRightColor: colors.border }
                  ]}>
                    <Text style={[s.statN, { color: colors.textPrimary }]}>{st.n}</Text>
                    <Text style={[s.statL, { color: colors.textHint }]}>{st.l}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* User info */}
            <View style={[s.infoBlock, { borderTopColor: colors.border }]}>
              {/* Full name row */}
              {(user.firstName || user.lastName) ? (
                <View style={s.nameRow}>
                  {!!user.firstName && (
                    <View style={s.nameField}>
                      <Text style={[s.nameFieldLabel, { color: colors.textHint }]}>First name</Text>
                      <Text style={[s.nameFieldVal, { color: colors.textPrimary }]}>{user.firstName}</Text>
                    </View>
                  )}
                  {!!user.lastName && (
                    <View style={s.nameField}>
                      <Text style={[s.nameFieldLabel, { color: colors.textHint }]}>Last name</Text>
                      <Text style={[s.nameFieldVal, { color: colors.textPrimary }]}>{user.lastName}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <Text style={[s.displayName, { color: colors.textPrimary }]}>{user.name || 'Rede User'}</Text>
              )}
              {!!user.nickname && (
                <View style={[s.infoRow, { borderBottomColor: colors.border }]}>
                  <Text style={[s.infoLabel, { color: colors.textHint }]}>Nickname</Text>
                  <Text style={[s.infoVal, { color: colors.primary }]}>@{user.nickname}</Text>
                </View>
              )}
              {!!user.phone && (
                <View style={[s.infoRow, { borderBottomColor: colors.border }]}>
                  <Text style={[s.infoLabel, { color: colors.textHint }]}>Phone</Text>
                  <Text style={[s.infoVal, { color: colors.textSecondary }]}>{user.phone}</Text>
                </View>
              )}
              {!!user.email && (
                <View style={[s.infoRow, { borderBottomColor: colors.border }]}>
                  <Text style={[s.infoLabel, { color: colors.textHint }]}>Email</Text>
                  <Text style={[s.infoVal, { color: colors.textSecondary }]}>{user.email}</Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Tabs ── */}
          <View style={[s.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            {TABS.map(t => (
              <TouchableOpacity key={t}
                style={[s.tabBtn, tab === t && [s.tabActive, { borderBottomColor: colors.primary }]]}
                onPress={() => setTab(t)}
              >
                <Text style={[s.tabTxt, { color: tab === t ? colors.primary : colors.textSecondary }]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Content ── */}
          <View style={s.content}>
            {tab === 'History'   && renderHistory()}
            {tab === 'Attending' && renderAttending()}
            {tab === 'Liked'     && (
              <View style={{ paddingTop: 8 }}>
                {likedFuture.length > 0 && (
                  <View style={[sec.header, { borderBottomColor: colors.border, marginHorizontal: PAD }]}>
                    <Text style={[sec.label, { color: colors.textHint }]}>UPCOMING · SAVED</Text>
                    <Text style={[sec.count, { color: colors.textHint }]}>{likedFuture.length}</Text>
                  </View>
                )}
                {renderLiked()}
              </View>
            )}
          </View>

        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:   { flex: 1, alignItems: 'center' },
  page:   { flex: 1, width: '100%' },

  headerCard:     { paddingTop: 50, paddingHorizontal: PAD, paddingBottom: 0, marginBottom: 2 },
  gearBtn:        { position: 'absolute', top: 14, right: 14, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  gearIcon:       { fontSize: 26 },

  avatarStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  avatarWrap:     { position: 'relative' },
  editBadge:      { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  editBadgeTxt:   { color: '#fff', fontSize: 12, fontWeight: '900' },

  statsBlock: { flex: 1, flexDirection: 'row' },
  stat:       { flex: 1, alignItems: 'center', paddingVertical: 6 },
  statN:      { fontSize: 22, fontWeight: '900' },
  statL:      { fontSize: 10, marginTop: 3, fontWeight: '600' },

  infoBlock:      { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14, paddingBottom: 16 },
  displayName:    { fontSize: 18, fontWeight: '900', marginBottom: 10 },
  nameRow:        { flexDirection: 'row', gap: 16, marginBottom: 10 },
  nameField:      { flex: 1 },
  nameFieldLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4, marginBottom: 2 },
  nameFieldVal:   { fontSize: 15, fontWeight: '800' },
  infoRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth },
  infoLabel:      { fontSize: 12, fontWeight: '600' },
  infoVal:        { fontSize: 13, fontWeight: '700' },

  tabBar:   { flexDirection: 'row', borderBottomWidth: 1 },
  tabBtn:   { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive:{ borderBottomWidth: 2.5 },
  tabTxt:   { fontSize: 13, fontWeight: '700' },
  content:  {},
})

const gc = StyleSheet.create({
  card:    { borderRadius: 12, overflow: 'hidden', elevation: 2, shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  img:     { width: '100%', height: 120 },
  datePill:{ position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  dateTxt: { color: '#fff', fontSize: 9, fontWeight: '700' },
  body:    { padding: 10 },
  dot:     { width: 5, height: 5, borderRadius: 3 },
  catTxt:  { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  title:   { fontSize: 12, fontWeight: '800', lineHeight: 16, marginBottom: 3 },
  venue:   { fontSize: 10, marginBottom: 6 },
  footer:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price:   { fontSize: 12, fontWeight: '900' },
  going:   { fontSize: 10 },
})

const hc = StyleSheet.create({
  card:    { flexDirection: 'row', marginHorizontal: PAD, marginVertical: 5, borderRadius: 14, overflow: 'hidden', elevation: 2, shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  img:     { width: 108, height: 120 },
  live:    { position: 'absolute', bottom: 6, left: 6, flexDirection: 'row', alignItems: 'center', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, gap: 3 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' },
  liveTxt: { color: '#fff', fontSize: 8, fontWeight: '800' },
  info:    { flex: 1, padding: 12, justifyContent: 'space-between' },
  catPill: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, marginBottom: 4 },
  catTxt:  { fontSize: 9, fontWeight: '800' },
  title:   { fontSize: 13, fontWeight: '800', lineHeight: 17, marginBottom: 3 },
  date:    { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  venue:   { fontSize: 10, marginBottom: 6 },
  bottom:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price:   { fontSize: 13, fontWeight: '900' },
  heartBtn:{ width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
})

const sec = StyleSheet.create({
  wrap:      { marginBottom: 4 },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: PAD, paddingTop: 16, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  label:     { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  count:     { fontSize: 11, fontWeight: '700' },
  seeAllBtn: { marginHorizontal: PAD, marginTop: 8, marginBottom: 4, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  seeAllTxt: { fontSize: 13, fontWeight: '700' },
  emptyWrap: { paddingHorizontal: PAD, paddingVertical: 20 },
  emptyTitle:{ fontSize: 14, fontWeight: '700', marginBottom: 4 },
  emptySub:  { fontSize: 12, lineHeight: 17 },
})

const gs = StyleSheet.create({
  grid: { padding: PAD, gap: GAP },
  row:  { flexDirection: 'row', gap: GAP },
})

const em = StyleSheet.create({
  wrap:   { alignItems: 'center', paddingVertical: 52, paddingHorizontal: 32, gap: 8 },
  icon:   { fontSize: 44, marginBottom: 6 },
  title:  { fontSize: 17, fontWeight: '800', textAlign: 'center' },
  sub:    { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  btn:    { marginTop: 14, borderRadius: 12, paddingHorizontal: 26, paddingVertical: 13 },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },
})
