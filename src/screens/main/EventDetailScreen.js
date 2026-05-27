/**
 * EventDetailScreen.js
 * - Three tabs: Comments | Attendees | Reviews
 * - Attendee count updates live (optimistic)
 * - Server-side attending check on mount
 * - Bottom nav always visible
 * - Back arrow goes to previous screen
 */
import React, { useState, useEffect } from 'react'
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Linking, Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore      from '../../store/themeStore'
import useEventsStore     from '../../store/eventsStore'
import useAuthStore       from '../../store/authStore'
import Avatar             from '../../components/common/Avatar'
import ShareButton        from '../../components/common/ShareButton'
import BottomNav          from '../../components/common/BottomNav'
import CommentSection     from '../../components/events/CommentSection'
import ReviewSection      from '../../components/events/ReviewSection'
import AttendeesSection   from '../../components/events/AttendeesSection'
import { formatDateRange, formatUGX, formatAttendees, timeFromNow } from '../../utils/formatters'
import { EVENT_CATEGORIES } from '../../constants/config'
import { eventsApi } from '../../services/api'

const { width } = Dimensions.get('window')
const MAX_W = Math.min(width, 500)

const TABS = ['Comments', 'Attendees', 'Reviews']

export default function EventDetailScreen({ navigation, route }) {
  const { eventId, event: fromParams } = route.params || {}
  const { colors }     = useThemeStore()
  const { getEventById, joinEvent, leaveEvent, isAttending, checkAttending, events } = useEventsStore()
  const { user }       = useAuthStore()
  const [activeTab, setActiveTab]   = useState('Comments')
  const [localEvent, setLocalEvent] = useState(fromParams || null)

  // Get latest event data (for live attendee count)
  const storeEvent = getEventById(eventId || fromParams?.id)
  const event = storeEvent || localEvent

  const attending   = isAttending(event?.id)
  const isOrganizer = event?.organizer?.id === user?.id
  const isFull      = event?.maxAttendees && event.attendeeCount >= event.maxAttendees
  const catMeta     = EVENT_CATEGORIES.find(c => c.id === event?.category)
  const catColor    = colors.cat[event?.category] || colors.primary
  const eventEnded  = event ? new Date(event.endTime) < new Date() : false
  const canDelete   = isOrganizer && event?.attendeeCount === 0

  // Sync attending status from server on mount
  useEffect(() => {
    if (user && event?.id) {
      checkAttending(event.id).catch(() => {})
    }
  }, [event?.id, user?.id])

  if (!event) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <TouchableOpacity style={styles.topBack} onPress={() => navigation.goBack()}>
          <Text style={[styles.topBackTxt, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={{ fontSize: 40 }}>🔍</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 16, marginTop: 12 }}>Event not found</Text>
        </View>
        <BottomNav navigation={navigation} activeTab="" />
      </SafeAreaView>
    )
  }

  async function handleJoin() {
    if (!user) {
      Alert.alert('Sign in required', '', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Phone') },
      ])
      return
    }
    try {
      if (attending) {
        Alert.alert('Leave event?', '', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: () => leaveEvent(event.id) },
        ])
      } else {
        await joinEvent(event.id)
        Alert.alert("You're in! 🎉", `See you at ${event.title}`)
      }
    } catch (err) {
      Alert.alert('Error', err.message)
    }
  }

  function openMaps() {
    const loc = event.location
    if (loc?.mapsLink) Linking.openURL(loc.mapsLink)
    else if (loc?.lat && loc?.lng) Linking.openURL(`https://maps.google.com/?q=${loc.lat},${loc.lng}`)
  }

  async function handleDelete() {
    Alert.alert('Delete event?', 'Cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await eventsApi.delete(event.id); navigation.goBack() }
          catch (err) { Alert.alert('Could not delete', err.message) }
        },
      },
    ])
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.phoneWrap, { maxWidth: MAX_W }]}>
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {/* Cover */}
          <View style={styles.coverWrap}>
            <Image source={{ uri: event.coverImage }} style={styles.cover} resizeMode="cover" />
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.overlayTxt}>←</Text>
            </TouchableOpacity>
            <View style={styles.shareWrap}>
              <ShareButton event={event} />
            </View>
            {event.isNow && (
              <View style={[styles.liveBadge, { backgroundColor: colors.error }]}>
                <View style={styles.liveDot} />
                <Text style={styles.liveTxt}>LIVE NOW</Text>
              </View>
            )}
          </View>

          <View style={styles.body}>
            {/* Category + time */}
            <View style={styles.topRow}>
              <View style={[styles.catBadge, { backgroundColor: catColor + '22', borderColor: catColor + '44' }]}>
                <Text style={[styles.catTxt, { color: catColor }]}>{catMeta?.label}</Text>
              </View>
              <Text style={[styles.timeAway, { color: colors.textSecondary }]}>
                {timeFromNow(event.startTime)}
              </Text>
            </View>

            <Text style={[styles.title, { color: colors.textPrimary }]}>{event.title}</Text>

            {/* Organizer actions */}
            {isOrganizer && (
              <View style={styles.orgActions}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                  onPress={() => navigation.navigate('EditEvent', { event })}>
                  <Text style={styles.actionBtnTxt}>Edit</Text>
                </TouchableOpacity>
                {canDelete && (
                  <TouchableOpacity style={[styles.actionBtn, { borderWidth: 1.5, borderColor: colors.error }]}
                    onPress={handleDelete}>
                    <Text style={[styles.actionBtnTxt, { color: colors.error }]}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Stats — attendeeCount updates live */}
            <View style={[styles.statsRow, { backgroundColor: colors.surface }]}>
              <View style={styles.stat}>
                <Text style={[styles.statVal, { color: colors.primary }]}>{formatUGX(event.entryFee)}</Text>
                <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Entry</Text>
              </View>
              <View style={[styles.statLine, { backgroundColor: colors.border }]} />
              <View style={styles.stat}>
                {/* Live count */}
                <Text style={[styles.statVal, { color: colors.textPrimary }]}>{event.attendeeCount}</Text>
                <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Going</Text>
              </View>
              <View style={[styles.statLine, { backgroundColor: colors.border }]} />
              <View style={styles.stat}>
                <Text style={[styles.statVal, { color: colors.textPrimary }]}>
                  {event.avgRating > 0 ? `${Number(event.avgRating).toFixed(1)} ★` : '—'}
                </Text>
                <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Rating</Text>
              </View>
            </View>

            {/* Details */}
            <View style={[styles.detailCard, { backgroundColor: colors.surface }]}>
              <Row icon="📅" text={formatDateRange(event.startTime, event.endTime)} color={colors.textSecondary} />
              <Row icon="📍" color={colors.textSecondary}
                text={[event.location?.venueName || event.location?.name, event.location?.area, event.location?.city || 'Kampala'].filter(Boolean).join(', ')}
              />
              {(event.location?.lat || event.location?.mapsLink) && (
                <TouchableOpacity style={[styles.mapsBtn, { backgroundColor: colors.primaryFaint }]} onPress={openMaps}>
                  <Text style={[styles.mapsBtnTxt, { color: colors.primary }]}>📍 Open in Google Maps</Text>
                </TouchableOpacity>
              )}
              {event.location?.lat && (
                <Text style={[styles.coords, { color: colors.textHint }]}>
                  GPS: {Number(event.location.lat).toFixed(5)}, {Number(event.location.lng).toFixed(5)}
                </Text>
              )}
            </View>

            {/* Organizer */}
            <TouchableOpacity
              style={[styles.organizer, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('Organizer', { organizerId: event.organizer?.id })}
              activeOpacity={0.8}
            >
              <Avatar uri={event.organizer?.avatar} name={event.organizer?.name} size={44} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[styles.orgLabel, { color: colors.textHint }]}>Organised by</Text>
                <Text style={[styles.orgName, { color: colors.textPrimary }]}>
                  {event.organizer?.name}{event.organizer?.verified ? ' ✓' : ''}
                </Text>
              </View>
              <Text style={{ color: colors.textHint, fontSize: 20 }}>›</Text>
            </TouchableOpacity>

            {/* Description */}
            <Text style={[styles.descTitle, { color: colors.textPrimary }]}>About</Text>
            <Text style={[styles.desc, { color: colors.textSecondary }]}>{event.description}</Text>

            {/* Three tabs */}
            <View style={[styles.tabs, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {TABS.map(tab => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && { borderBottomWidth: 2, borderBottomColor: colors.primary }]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabTxt, { color: activeTab === tab ? colors.primary : colors.textSecondary }]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {activeTab === 'Comments' && (
              <CommentSection eventId={event.id} isOrganizer={isOrganizer} />
            )}
            {activeTab === 'Attendees' && (
              <AttendeesSection eventId={event.id} attendeeCount={event.attendeeCount} />
            )}
            {activeTab === 'Reviews' && (
              <ReviewSection eventId={event.id} eventEnded={eventEnded} />
            )}
          </View>
        </ScrollView>

        {/* Join footer */}
        {!isOrganizer && (
          <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <View>
              <Text style={[styles.footerLabel, { color: colors.textHint }]}>Entry</Text>
              <Text style={[styles.footerPrice, { color: colors.primary }]}>{formatUGX(event.entryFee)}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.joinBtn,
                { backgroundColor: attending ? 'transparent' : colors.primary },
                attending && { borderWidth: 1.5, borderColor: colors.primary },
                (isFull && !attending) && { opacity: 0.5 },
              ]}
              onPress={handleJoin}
              disabled={isFull && !attending}
              activeOpacity={0.85}
            >
              <Text style={[styles.joinBtnTxt, attending && { color: colors.primary }]}>
                {!user ? 'Sign in to Join' : attending ? 'Leave' : isFull ? 'Full' : 'Join Event'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {isOrganizer && (
          <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <Text style={{ flex: 1, textAlign: 'center', color: colors.textSecondary, fontWeight: '600' }}>
              You organised this event
            </Text>
          </View>
        )}

        <BottomNav navigation={navigation} activeTab="" />
      </View>
    </SafeAreaView>
  )
}

function Row({ icon, text, color }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
      <Text style={{ fontSize: 15, marginRight: 10, marginTop: 1 }}>{icon}</Text>
      <Text style={{ fontSize: 14, color, flex: 1, lineHeight: 20 }}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe:      { flex: 1, alignItems: 'center' },
  phoneWrap: { flex: 1, width: '100%' },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBack:   { padding: 20 },
  topBackTxt: { fontSize: 15, fontWeight: '600' },
  coverWrap: { position: 'relative' },
  cover: { width: '100%', height: 260 },
  backBtn: { position: 'absolute', top: 48, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  shareWrap: { position: 'absolute', top: 48, right: 16 },
  overlayTxt: { color: '#fff', fontSize: 18, fontWeight: '700' },
  liveBadge: { position: 'absolute', bottom: 12, left: 12, flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, gap: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  liveTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },
  body: { padding: 18 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  catBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  catTxt: { fontSize: 12, fontWeight: '700' },
  timeAway: { fontSize: 13, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '800', lineHeight: 28, marginBottom: 14 },
  orgActions: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  actionBtn: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  actionBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  statsRow: { flexDirection: 'row', borderRadius: 14, padding: 14, marginBottom: 14, alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  statLbl: { fontSize: 11 },
  statLine: { width: 1, height: 32 },
  detailCard: { borderRadius: 14, padding: 16, marginBottom: 14 },
  mapsBtn: { borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 6 },
  mapsBtnTxt: { fontSize: 13, fontWeight: '600' },
  coords: { fontSize: 11, marginBottom: 8 },
  organizer: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 14 },
  orgLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  orgName: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  descTitle: { fontSize: 15, fontWeight: '800', marginBottom: 8 },
  desc: { fontSize: 14, lineHeight: 22, marginBottom: 16 },
  tabs: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  tab:  { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabTxt: { fontSize: 13, fontWeight: '700' },
  footer: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingHorizontal: 18, paddingVertical: 12, gap: 14 },
  footerLabel: { fontSize: 11, textTransform: 'uppercase', fontWeight: '600' },
  footerPrice: { fontSize: 17, fontWeight: '800' },
  joinBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  joinBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
