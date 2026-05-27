/**
 * EventDetailScreen.js
 *
 * Fixes:
 * - "You organised this event" removed → "My Event" badge on the title
 * - Share icon is now the globally understood share symbol (SVG)
 * - Edit and Delete buttons actually call the API
 * - Delete shows confirmation before deleting
 * - Three tabs: Comments | Attendees | Reviews
 * - Attendee count updates live
 * - Bottom nav visible
 */
import React, { useState, useEffect } from 'react'
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Linking, Dimensions, Platform,
} from 'react-native'
import { SafeAreaView }    from 'react-native-safe-area-context'
import { Svg, Path, Circle, Line } from 'react-native-svg'
import useThemeStore       from '../../store/themeStore'
import useEventsStore      from '../../store/eventsStore'
import useAuthStore        from '../../store/authStore'
import Avatar              from '../../components/common/Avatar'
import BottomNav           from '../../components/common/BottomNav'
import CommentSection      from '../../components/events/CommentSection'
import ReviewSection       from '../../components/events/ReviewSection'
import AttendeesSection    from '../../components/events/AttendeesSection'
import { formatDateRange, formatUGX, timeFromNow } from '../../utils/formatters'
import { EVENT_CATEGORIES, APP_URL } from '../../constants/config'
import { eventsApi } from '../../services/api'

const { width } = Dimensions.get('window')
const MAX_W = Math.min(width, 500)

/* ── Globally understood share icon ─────────────────────────── */
function ShareIcon({ color }) {
  if (Platform.OS === 'ios') {
    // iOS standard share icon: box with arrow pointing up
    return (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill={color}/>
        <Path d="M4 12v6a2 2 0 002 2h12a2 2 0 002-2v-6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <Path d="M12 2v10M9 5l3-3 3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    )
  }
  // Universal: box with arrow up
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2v10M9 5l3-3 3 3" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M8 8H5a1 1 0 00-1 1v10a1 1 0 001 1h14a1 1 0 001-1V9a1 1 0 00-1-1h-3" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  )
}

const TABS = ['Comments', 'Attendees', 'Reviews']

export default function EventDetailScreen({ navigation, route }) {
  const { eventId, event: fromParams } = route.params || {}
  const { colors }   = useThemeStore()
  const { getEventById, joinEvent, leaveEvent, isAttending, checkAttending } = useEventsStore()
  const { user }     = useAuthStore()
  const [activeTab, setActiveTab] = useState('Comments')
  const [deleting, setDeleting]   = useState(false)

  const storeEvent  = getEventById(eventId || fromParams?.id)
  const event       = storeEvent || fromParams

  const attending   = isAttending(event?.id)
  const isOrganizer = event?.organizer?.id === user?.id
  const isFull      = event?.maxAttendees && event.attendeeCount >= event.maxAttendees
  const catMeta     = EVENT_CATEGORIES.find(c => c.id === event?.category)
  const catColor    = colors.cat[event?.category] || colors.primary
  const eventEnded  = event ? new Date(event.endTime) < new Date() : false
  const canDelete   = isOrganizer && event?.attendeeCount === 0

  // Sync attending from server on mount
  useEffect(() => {
    if (user && event?.id) checkAttending(event.id).catch(() => {})
  }, [event?.id, user?.id])

  if (!event) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <TouchableOpacity style={styles.topBack} onPress={() => navigation.goBack()}>
          <Text style={[styles.topBackTxt, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={{ color: colors.textSecondary }}>Event not found</Text>
        </View>
        <BottomNav navigation={navigation} activeTab="" />
      </SafeAreaView>
    )
  }

  /* ── Actions ─────────────────────────────────────────────── */
  function handleJoin() {
    if (!user) {
      Alert.alert('Sign in required', 'Sign in to join events.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Phone') },
      ])
      return
    }
    if (attending) {
      Alert.alert('Leave event?', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => leaveEvent(event.id) },
      ])
    } else {
      joinEvent(event.id)
        .then(() => Alert.alert("You're in! 🎉", `See you at ${event.title}`))
        .catch(err => Alert.alert('Error', err.message))
    }
  }

  function handleShare() {
    const link    = `${APP_URL}?event=${event.id}`
    const message = `${event.title}\n📅 ${formatDateRange(event.startTime, event.endTime)}\n📍 ${event.location?.venueName || event.location?.name}\n\n${link}`

    // WhatsApp first, then native share
    const waUrl  = `whatsapp://send?text=${encodeURIComponent(message)}`
    const webUrl = `https://wa.me/?text=${encodeURIComponent(message)}`

    if (Platform.OS === 'web') {
      // Try to copy link to clipboard
      if (navigator?.clipboard) {
        navigator.clipboard.writeText(link).then(() => Alert.alert('Link copied!', link))
      } else {
        Alert.alert('Event link', link)
      }
    } else {
      Linking.canOpenURL(waUrl).then(can => {
        Linking.openURL(can ? waUrl : webUrl)
      })
    }
  }

  function handleEdit() {
    navigation.navigate('EditEvent', { event })
  }

  // Delete with confirmation — only if 0 attendees
  function handleDelete() {
    if (!canDelete) {
      Alert.alert(
        'Cannot delete',
        'You can only delete an event if no one has joined yet.'
      )
      return
    }
    Alert.alert(
      'Delete event?',
      `"${event.title}" will be permanently removed. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            setDeleting(true)
            try {
              await eventsApi.delete(event.id)
              navigation.goBack()
            } catch (err) {
              Alert.alert('Could not delete', err.message)
              setDeleting(false)
            }
          },
        },
      ]
    )
  }

  function openMaps() {
    const loc = event.location
    if (loc?.mapsLink) Linking.openURL(loc.mapsLink)
    else if (loc?.lat && loc?.lng) Linking.openURL(`https://maps.google.com/?q=${loc.lat},${loc.lng}`)
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.phone, { maxWidth: MAX_W }]}>
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>

          {/* Cover image */}
          <View style={styles.coverWrap}>
            <Image source={{ uri: event.coverImage }} style={styles.cover} resizeMode="cover" />

            {/* Back arrow */}
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.overlayTxt}>←</Text>
            </TouchableOpacity>

            {/* Share — universal share icon */}
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <ShareIcon color="#fff" />
            </TouchableOpacity>

            {/* "My Event" badge — replaces the old footer text */}
            {isOrganizer && (
              <View style={[styles.myEventBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.myEventTxt}>My Event</Text>
              </View>
            )}

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

            {/* Organizer edit/delete — these actually call the API */}
            {isOrganizer && (
              <View style={styles.orgActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                  onPress={handleEdit}
                  activeOpacity={0.85}
                >
                  <Text style={styles.actionBtnTxt}>Edit Event</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      borderWidth: 1.5,
                      borderColor: colors.error,
                      opacity: deleting ? 0.5 : (canDelete ? 1 : 0.4),
                    }
                  ]}
                  onPress={handleDelete}
                  disabled={deleting}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.actionBtnTxt, { color: colors.error }]}>
                    {deleting ? 'Deleting...' : 'Delete'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Stats */}
            <View style={[styles.statsRow, { backgroundColor: colors.surface }]}>
              <StatCell value={formatUGX(event.entryFee)}     label="Entry"    highlight colors={colors} />
              <View style={[styles.statLine, { backgroundColor: colors.border }]} />
              <StatCell value={`${event.attendeeCount}`}      label="Going"    colors={colors} />
              <View style={[styles.statLine, { backgroundColor: colors.border }]} />
              <StatCell
                value={event.avgRating > 0 ? `${Number(event.avgRating).toFixed(1)} ★` : '—'}
                label="Rating"
                colors={colors}
              />
            </View>

            {/* Details card */}
            <View style={[styles.detailCard, { backgroundColor: colors.surface }]}>
              <DetailRow icon="📅" text={formatDateRange(event.startTime, event.endTime)} colors={colors} />
              <DetailRow
                icon="📍"
                text={[
                  event.location?.venueName || event.location?.name,
                  event.location?.area,
                  event.location?.city || 'Kampala',
                ].filter(Boolean).join(', ')}
                colors={colors}
              />
              {(event.location?.lat || event.location?.mapsLink) && (
                <TouchableOpacity
                  style={[styles.mapsBtn, { backgroundColor: colors.primaryFaint }]}
                  onPress={openMaps}
                >
                  <Text style={[styles.mapsBtnTxt, { color: colors.primary }]}>
                    📍 Open in Google Maps
                  </Text>
                </TouchableOpacity>
              )}
              {event.location?.lat && (
                <Text style={[styles.coords, { color: colors.textHint }]}>
                  GPS: {Number(event.location.lat).toFixed(5)}, {Number(event.location.lng).toFixed(5)}
                </Text>
              )}
            </View>

            {/* Organizer — tappable */}
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

            {/* Tabs */}
            <View style={[styles.tabs, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {TABS.map(tab => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tab,
                    activeTab === tab && { borderBottomWidth: 2, borderBottomColor: colors.primary }
                  ]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[
                    styles.tabTxt,
                    { color: activeTab === tab ? colors.primary : colors.textSecondary }
                  ]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {activeTab === 'Comments'  && <CommentSection   eventId={event.id} isOrganizer={isOrganizer} />}
            {activeTab === 'Attendees' && <AttendeesSection eventId={event.id} attendeeCount={event.attendeeCount} />}
            {activeTab === 'Reviews'   && <ReviewSection    eventId={event.id} eventEnded={eventEnded} />}
          </View>
        </ScrollView>

        {/* Footer */}
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

        <BottomNav navigation={navigation} activeTab="" />
      </View>
    </SafeAreaView>
  )
}

function StatCell({ value, label, highlight, colors }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={[{ fontSize: 15, fontWeight: '800', marginBottom: 2 },
        { color: highlight ? colors.primary : colors.textPrimary }
      ]}>
        {value}
      </Text>
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

const styles = StyleSheet.create({
  safe:  { flex: 1, alignItems: 'center' },
  phone: { flex: 1, width: '100%' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBack: { padding: 20 },
  topBackTxt: { fontSize: 15, fontWeight: '600' },

  coverWrap: { position: 'relative' },
  cover: { width: '100%', height: 280 },

  backBtn: {
    position: 'absolute', top: 48, left: 16,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  shareBtn: {
    position: 'absolute', top: 48, right: 16,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  overlayTxt: { color: '#fff', fontSize: 18, fontWeight: '700' },

  // "My Event" badge — top left on cover, replaces footer text
  myEventBadge: {
    position: 'absolute', bottom: 12, left: 12,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
  },
  myEventTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },

  liveBadge: {
    position: 'absolute', bottom: 12, right: 12,
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4, gap: 5,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  liveTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },

  body: { padding: 18 },

  topRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  catBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  catTxt:   { fontSize: 12, fontWeight: '700' },
  timeAway: { fontSize: 13, fontWeight: '600' },
  title:    { fontSize: 21, fontWeight: '900', lineHeight: 28, marginBottom: 14 },

  orgActions: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  actionBtn:  { borderRadius: 10, paddingHorizontal: 18, paddingVertical: 9 },
  actionBtnTxt: { fontWeight: '700', fontSize: 13, color: '#fff' },

  statsRow: {
    flexDirection: 'row', borderRadius: 14, padding: 14,
    marginBottom: 14, alignItems: 'center',
  },
  statLine: { width: 1, height: 32 },

  detailCard: { borderRadius: 14, padding: 16, marginBottom: 14 },
  mapsBtn:    { borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 6 },
  mapsBtnTxt: { fontSize: 13, fontWeight: '600' },
  coords:     { fontSize: 11, marginBottom: 8 },

  organizer: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, padding: 14, marginBottom: 14,
  },
  orgLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  orgName:  { fontSize: 15, fontWeight: '700', marginTop: 2 },

  descTitle: { fontSize: 15, fontWeight: '800', marginBottom: 8 },
  desc:      { fontSize: 14, lineHeight: 22, marginBottom: 16 },

  tabs: {
    flexDirection: 'row', borderRadius: 12, borderWidth: 1,
    marginBottom: 16, overflow: 'hidden',
  },
  tab:    { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabTxt: { fontSize: 13, fontWeight: '700' },

  footer: {
    flexDirection: 'row', alignItems: 'center', borderTopWidth: 1,
    paddingHorizontal: 18, paddingVertical: 12, gap: 14,
  },
  footerLabel: { fontSize: 11, textTransform: 'uppercase', fontWeight: '600' },
  footerPrice: { fontSize: 17, fontWeight: '900' },
  joinBtn:     { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  joinBtnTxt:  { color: '#fff', fontSize: 15, fontWeight: '700' },
})
