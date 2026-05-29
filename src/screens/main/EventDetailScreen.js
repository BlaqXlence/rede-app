/**
 * EventDetailScreen.js
 * - Leave works (persisted + server)
 * - Delete works (removes from store + server)
 * - No Reviews tab — replaced with Organiser Rating concept
 * - Tabs: Comments | Attendees only
 */
import React, { useState, useEffect } from 'react'
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Linking, Dimensions, Platform,
} from 'react-native'
import { SafeAreaView }  from 'react-native-safe-area-context'
import { Svg, Path, Circle } from 'react-native-svg'
import useThemeStore     from '../../store/themeStore'
import useEventsStore    from '../../store/eventsStore'
import useAuthStore      from '../../store/authStore'
import Avatar            from '../../components/common/Avatar'
import CommentSection    from '../../components/events/CommentSection'
import AttendeesSection  from '../../components/events/AttendeesSection'
import ShareModal        from '../../components/common/ShareModal'
import { formatDateRange, formatUGX, timeFromNow } from '../../utils/formatters'
import { EVENT_CATEGORIES, APP_URL } from '../../constants/config'
import { eventsApi } from '../../services/api'

const { width } = Dimensions.get('window')
const MAX_W = Math.min(width, 500)
const TABS  = ['Comments', 'Attendees']

function ShareIcon({ color }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v13M8 7l4-4 4 4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M20 16v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  )
}

export default function EventDetailScreen({ navigation, route }) {
  const { eventId, event: fromParams } = route.params || {}
  const { colors }  = useThemeStore()
  const { getEventById, joinEvent, leaveEvent, isAttending, checkAttending, deleteEventLocal } = useEventsStore()
  const { user }    = useAuthStore()

  const [activeTab,  setActiveTab]  = useState('Comments')
  const [deleting,   setDeleting]   = useState(false)
  const [shareModal, setShareModal] = useState(false)
  const [justJoined, setJustJoined] = useState(false)

  const storeEvent = getEventById(eventId || fromParams?.id)
  const event      = storeEvent || fromParams

  const attending   = isAttending(event?.id)
  const isOrganizer = event?.organizer?.id === user?.id
  const isFull      = event?.maxAttendees && (event?.attendeeCount || 0) >= event?.maxAttendees
  const catColor    = colors.cat?.[event?.category] || colors.primary
  const catMeta     = EVENT_CATEGORIES.find(c => c.id === event?.category)
  const eventEnded  = event ? new Date(event.endTime) < new Date() : false

  // Check server truth on mount
  useEffect(() => {
    if (user && event?.id) checkAttending(event.id).catch(() => {})
  }, [event?.id, user?.id])

  if (!event) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <TouchableOpacity style={{ padding: 20 }} onPress={() => navigation.goBack()}>
          <Text style={[s.backTxt, { color: colors.primary }]}>←</Text>
        </TouchableOpacity>
        <View style={s.center}>
          <Text style={{ color: colors.textSecondary }}>Event not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  // JOIN or LEAVE
  function handleJoin() {
    if (!user) {
      Alert.alert('Sign in required', '', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Phone') },
      ]); return
    }
    if (attending) {
      Alert.alert('Leave event?', 'You will be removed from the attendees list.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: async () => {
          try { await leaveEvent(event.id) }
          catch { Alert.alert('Error', 'Could not leave. Try again.') }
        }},
      ])
    } else {
      joinEvent(event.id)
        .then(() => {
          setJustJoined(true)  // immediately unlock comment box
          Alert.alert("You're in! 🎉", `See you at ${event.title}`)
        })
        .catch(err => Alert.alert('Could not join', err.message))
    }
  }

  // DELETE
  function handleDelete() {
    if (!isOrganizer) return
    if ((event.attendeeCount || 0) > 0) {
      Alert.alert('Cannot delete', 'Events with attendees cannot be deleted. Remove all attendees first.'); return
    }
    Alert.alert(
      'Delete event?',
      `"${event.title}" will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          setDeleting(true)
          try {
            await eventsApi.delete(event.id)
            deleteEventLocal(event.id)
            navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] })
          } catch (err) {
            Alert.alert('Could not delete', err.message)
            setDeleting(false)
          }
        }},
      ]
    )
  }

  function openMaps() {
    const loc = event.location
    if (loc?.mapsLink) Linking.openURL(loc.mapsLink)
    else if (loc?.lat && loc?.lng) Linking.openURL(`https://maps.google.com/?q=${loc.lat},${loc.lng}`)
  }

  const venueStr = [event.location?.venueName || event.location?.name, event.location?.area, event.location?.city]
    .filter(Boolean).join(', ')

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[s.phone, { maxWidth: MAX_W }]}>
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Cover */}
          <View style={s.coverWrap}>
            <Image source={{ uri: event.coverImage }} style={s.cover} resizeMode="cover" />
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
              <Text style={s.backTxt}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.shareBtn} onPress={() => setShareModal(true)}>
              <ShareIcon color="#fff" />
            </TouchableOpacity>
            {isOrganizer && (
              <View style={[s.myBadge, { backgroundColor: colors.primary }]}>
                <Text style={s.myBadgeTxt}>My Event</Text>
              </View>
            )}
            {event.isNow && (
              <View style={[s.liveBadge, { backgroundColor: colors.error }]}>
                <View style={s.liveDot} /><Text style={s.liveTxt}>LIVE NOW</Text>
              </View>
            )}
          </View>

          <View style={s.body}>
            {/* Category + time */}
            <View style={s.topRow}>
              <View style={[s.catBadge, { backgroundColor: catColor + '22', borderColor: catColor + '44' }]}>
                <Text style={[s.catTxt, { color: catColor }]}>{catMeta?.label}</Text>
              </View>
              <Text style={[s.timeAway, { color: colors.textSecondary }]}>{timeFromNow(event.startTime)}</Text>
            </View>

            <Text style={[s.title, { color: colors.textPrimary }]}>{event.title}</Text>

            {/* Organiser actions */}
            {isOrganizer && (
              <View style={s.orgActions}>
                <TouchableOpacity
                  style={[s.actionBtn, { backgroundColor: colors.primary }]}
                  onPress={() => navigation.navigate('EditEvent', { event })}
                >
                  <Text style={s.actionBtnTxt}>Edit Event</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.actionBtn, { borderWidth: 1.5, borderColor: colors.error }]}
                  onPress={handleDelete} disabled={deleting}
                >
                  <Text style={[s.actionBtnTxt, { color: colors.error }]}>
                    {deleting ? 'Deleting...' : 'Delete'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Stats */}
            <View style={[s.stats, { backgroundColor: colors.surface }]}>
              <StatCell label="Entry"  value={formatUGX(event.entryFee)} color={colors.primary} colors={colors} />
              <View style={[s.statLine, { backgroundColor: colors.border }]} />
              <StatCell label="Going"  value={String(event.attendeeCount || 0)} color={colors.textPrimary} colors={colors} />
              <View style={[s.statLine, { backgroundColor: colors.border }]} />
              <StatCell label="Rating" value={event.organizer?.avgRating ? `${Number(event.organizer.avgRating).toFixed(1)} ★` : '—'} color={colors.textPrimary} colors={colors} />
            </View>

            {/* Details */}
            <View style={[s.detailCard, { backgroundColor: colors.surface }]}>
              <DetailRow icon="📅" text={formatDateRange(event.startTime, event.endTime)} colors={colors} />
              <DetailRow icon="📍" text={venueStr || 'Kampala'} colors={colors} />
              {(event.location?.lat || event.location?.mapsLink) && (
                <TouchableOpacity style={[s.mapsBtn, { backgroundColor: colors.primaryFaint }]} onPress={openMaps}>
                  <Text style={[s.mapsBtnTxt, { color: colors.primary }]}>Open in Google Maps →</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Organiser */}
            <TouchableOpacity
              style={[s.organizer, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('Organizer', { organizerId: event.organizer?.id })}
              activeOpacity={0.8}
            >
              <Avatar uri={event.organizer?.avatar} name={event.organizer?.name} size={44} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[s.orgLabel, { color: colors.textHint }]}>Organised by</Text>
                <Text style={[s.orgName, { color: colors.textPrimary }]}>
                  {event.organizer?.name}{event.organizer?.verified ? ' ✓' : ''}
                </Text>
              </View>
              <Text style={{ color: colors.textHint, fontSize: 20 }}>›</Text>
            </TouchableOpacity>

            {/* Description */}
            <Text style={[s.descTitle, { color: colors.textPrimary }]}>About</Text>
            <Text style={[s.desc, { color: colors.textSecondary }]}>{event.description}</Text>

            {/* Tabs — Comments + Attendees only (no Reviews) */}
            <View style={[s.tabBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {TABS.map(tab => (
                <TouchableOpacity
                  key={tab}
                  style={[s.tab, activeTab === tab && { borderBottomWidth: 2, borderBottomColor: colors.primary }]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[s.tabTxt, { color: activeTab === tab ? colors.primary : colors.textSecondary }]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {activeTab === 'Comments'  && <CommentSection   eventId={event.id} isOrganizer={isOrganizer} justJoined={justJoined} />}
            {activeTab === 'Attendees' && <AttendeesSection eventId={event.id} attendeeCount={event.attendeeCount} />}
          </View>
        </ScrollView>

        {/* Footer */}
        {!isOrganizer && (
          <View style={[s.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <View>
              <Text style={[s.footerLabel, { color: colors.textHint }]}>Entry</Text>
              <Text style={[s.footerPrice, { color: colors.primary }]}>{formatUGX(event.entryFee)}</Text>
            </View>
            <TouchableOpacity
              style={[
                s.joinBtn,
                { backgroundColor: attending ? 'transparent' : colors.primary },
                attending && { borderWidth: 1.5, borderColor: colors.primary },
                (isFull && !attending) && { opacity: 0.45 },
              ]}
              onPress={handleJoin}
              disabled={isFull && !attending}
              activeOpacity={0.85}
            >
              <Text style={[s.joinTxt, attending && { color: colors.primary }]}>
                {!user ? 'Sign in to Join' : attending ? 'Leave Event' : isFull ? 'Full' : 'Join Event'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {isOrganizer && (
          <View style={[s.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, justifyContent: 'center' }]}>
            <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 14 }}>
              You organised this event
            </Text>
          </View>
        )}

        <ShareModal visible={shareModal} onClose={() => setShareModal(false)} event={event} />
      </View>
    </SafeAreaView>
  )
}

function StatCell({ label, value, color, colors }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 15, fontWeight: '800', color, marginBottom: 2 }}>{value}</Text>
      <Text style={{ fontSize: 11, color: colors.textSecondary }}>{label}</Text>
    </View>
  )
}

function DetailRow({ icon, text, colors }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
      <Text style={{ fontSize: 15, marginRight: 10, marginTop: 1 }}>{icon}</Text>
      <Text style={{ fontSize: 14, color: colors.textSecondary, flex: 1, lineHeight: 20 }}>{text}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  safe:    { flex: 1, alignItems: 'center' },
  phone:   { flex: 1, width: '100%' },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backTxt: { fontSize: 15, fontWeight: '600' },
  coverWrap: { position: 'relative' },
  cover:     { width: '100%', height: 270 },
  backBtn:   { position: 'absolute', top: 48, left: 16, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' },
  shareBtn:  { position: 'absolute', top: 48, right: 16, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' },
  myBadge:   { position: 'absolute', bottom: 12, left: 12, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  myBadgeTxt:{ color: '#fff', fontSize: 12, fontWeight: '800' },
  liveBadge: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4, gap: 5 },
  liveDot:   { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  liveTxt:   { color: '#fff', fontSize: 11, fontWeight: '800' },
  body:      { padding: 18 },
  topRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  catBadge:  { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  catTxt:    { fontSize: 12, fontWeight: '700' },
  timeAway:  { fontSize: 13, fontWeight: '600' },
  title:     { fontSize: 21, fontWeight: '900', lineHeight: 28, marginBottom: 14 },
  orgActions:{ flexDirection: 'row', gap: 10, marginBottom: 14 },
  actionBtn: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9 },
  actionBtnTxt: { fontWeight: '700', fontSize: 13, color: '#fff' },
  stats:     { flexDirection: 'row', borderRadius: 14, padding: 14, marginBottom: 14, alignItems: 'center' },
  statLine:  { width: 1, height: 32 },
  detailCard:{ borderRadius: 14, padding: 16, marginBottom: 14 },
  mapsBtn:   { borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginTop: 4 },
  mapsBtnTxt:{ fontSize: 13, fontWeight: '600' },
  organizer: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 14 },
  orgLabel:  { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  orgName:   { fontSize: 15, fontWeight: '700', marginTop: 2 },
  descTitle: { fontSize: 15, fontWeight: '800', marginBottom: 8 },
  desc:      { fontSize: 14, lineHeight: 22, marginBottom: 16 },
  tabBar:    { flexDirection: 'row', borderRadius: 12, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  tab:       { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabTxt:    { fontSize: 13, fontWeight: '700' },
  footer:    { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingHorizontal: 18, paddingVertical: 12, gap: 14 },
  footerLabel:{ fontSize: 11, textTransform: 'uppercase', fontWeight: '600' },
  footerPrice:{ fontSize: 17, fontWeight: '900' },
  joinBtn:   { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  joinTxt:   { color: '#fff', fontSize: 15, fontWeight: '700' },
})
