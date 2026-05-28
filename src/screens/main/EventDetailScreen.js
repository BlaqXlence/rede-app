/**
 * EventDetailScreen.js
 * Fixed: share button works, "My Event" badge, working comments,
 * attendees show correctly, 3 tabs (Comments | Attendees | Reviews)
 */
import React, { useState, useEffect } from 'react'
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Linking, Dimensions, Platform, Share,
} from 'react-native'
import { SafeAreaView }    from 'react-native-safe-area-context'
import { Svg, Path, Circle } from 'react-native-svg'
import useThemeStore       from '../../store/themeStore'
import useEventsStore      from '../../store/eventsStore'
import useAuthStore        from '../../store/authStore'
import Avatar              from '../../components/common/Avatar'
import CommentSection      from '../../components/events/CommentSection'
import ReviewSection       from '../../components/events/ReviewSection'
import AttendeesSection    from '../../components/events/AttendeesSection'
import { formatDateRange, formatUGX, timeFromNow } from '../../utils/formatters'
import { EVENT_CATEGORIES, APP_URL } from '../../constants/config'
import { eventsApi } from '../../services/api'

const { width } = Dimensions.get('window')
const MAX_W = Math.min(width, 500)
const TABS  = ['Comments', 'Attendees', 'Reviews']

function ShareSVG({ color }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v13" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
      <Path d="M8 7l4-4 4 4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M20 16v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  )
}

export default function EventDetailScreen({ navigation, route }) {
  const { eventId, event: fromParams } = route.params || {}
  const { colors }   = useThemeStore()
  const { getEventById, joinEvent, leaveEvent, isAttending, checkAttending } = useEventsStore()
  const { user }     = useAuthStore()
  const [activeTab, setActiveTab] = useState('Comments')
  const [deleting,  setDeleting]  = useState(false)

  const storeEvent = getEventById(eventId || fromParams?.id)
  const event      = storeEvent || fromParams

  const attending   = isAttending(event?.id)
  const isOrganizer = event?.organizer?.id === user?.id
  const isFull      = event?.maxAttendees && event.attendeeCount >= event.maxAttendees
  const catMeta     = EVENT_CATEGORIES.find(c => c.id === event?.category)
  const catColor    = colors.cat?.[event?.category] || colors.primary
  const eventEnded  = event ? new Date(event.endTime) < new Date() : false
  const canDelete   = isOrganizer && (event?.attendeeCount || 0) === 0

  // Sync attending status from server on mount
  useEffect(() => {
    if (user && event?.id) checkAttending(event.id).catch(() => {})
  }, [event?.id, user?.id])

  if (!event) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <TouchableOpacity style={{ padding: 20 }} onPress={() => navigation.goBack()}>
          <Text style={[styles.backTxt, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={{ color: colors.textSecondary }}>Event not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  function handleJoin() {
    if (!user) {
      Alert.alert('Sign in required', '', [
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

  // Share button — works on web (clipboard) and native (WhatsApp + Share sheet)
  async function handleShare() {
    const link    = `${APP_URL}?event=${event.id}`
    const message = `${event.title}\n📅 ${formatDateRange(event.startTime, event.endTime)}\n📍 ${event.location?.name || ''}\n\n${link}`

    if (Platform.OS === 'web') {
      // Try WhatsApp first, then clipboard
      const encoded = encodeURIComponent(message)
      const waUrl   = `https://wa.me/?text=${encoded}`
      try {
        window.open(waUrl, '_blank')
      } catch {
        if (navigator?.clipboard) {
          navigator.clipboard.writeText(link)
          Alert.alert('Link copied!', link)
        }
      }
    } else {
      // Native: try WhatsApp directly, fall back to system share sheet
      const waUrl = `whatsapp://send?text=${encodeURIComponent(message)}`
      const canWa = await Linking.canOpenURL(waUrl).catch(() => false)
      if (canWa) {
        Linking.openURL(waUrl)
      } else {
        Share.share({ message, url: link, title: event.title })
      }
    }
  }

  function handleDelete() {
    if (!canDelete) {
      Alert.alert('Cannot delete', 'Events with attendees cannot be deleted.')
      return
    }
    Alert.alert(
      'Delete event?',
      `"${event.title}" will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            setDeleting(true)
            try { await eventsApi.delete(event.id); navigation.goBack() }
            catch (err) { Alert.alert('Could not delete', err.message); setDeleting(false) }
          },
        },
      ]
    )
  }

  function openMaps() {
    const loc = event.location
    if (loc?.mapsLink)     Linking.openURL(loc.mapsLink)
    else if (loc?.lat && loc?.lng) Linking.openURL(`https://maps.google.com/?q=${loc.lat},${loc.lng}`)
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.phone, { maxWidth: MAX_W }]}>
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>

          {/* Cover */}
          <View style={styles.coverWrap}>
            <Image source={{ uri: event.coverImage }} style={styles.cover} resizeMode="cover" />

            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.btnTxt}>←</Text>
            </TouchableOpacity>

            {/* Universal share icon */}
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <ShareSVG color="#fff" />
            </TouchableOpacity>

            {/* My Event badge instead of footer text */}
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
            <View style={styles.topRow}>
              <View style={[styles.catBadge, { backgroundColor: catColor + '22', borderColor: catColor + '44' }]}>
                <Text style={[styles.catTxt, { color: catColor }]}>{catMeta?.label}</Text>
              </View>
              <Text style={[styles.timeAway, { color: colors.textSecondary }]}>
                {timeFromNow(event.startTime)}
              </Text>
            </View>

            <Text style={[styles.title, { color: colors.textPrimary }]}>{event.title}</Text>

            {isOrganizer && (
              <View style={styles.orgActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                  onPress={() => navigation.navigate('EditEvent', { event })}
                >
                  <Text style={styles.actionTxt}>Edit Event</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { borderWidth: 1.5, borderColor: colors.error, opacity: canDelete ? 1 : 0.4 }]}
                  onPress={handleDelete} disabled={deleting}
                >
                  <Text style={[styles.actionTxt, { color: colors.error }]}>
                    {deleting ? 'Deleting...' : 'Delete'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Stats */}
            <View style={[styles.stats, { backgroundColor: colors.surface }]}>
              <StatCell value={formatUGX(event.entryFee)} label="Entry"  color={colors.primary}    colors={colors} />
              <View style={[styles.statLine, { backgroundColor: colors.border }]} />
              <StatCell value={`${event.attendeeCount || 0}`} label="Going" color={colors.textPrimary} colors={colors} />
              <View style={[styles.statLine, { backgroundColor: colors.border }]} />
              <StatCell
                value={event.avgRating > 0 ? `${Number(event.avgRating).toFixed(1)} ★` : '—'}
                label="Rating" color={colors.textPrimary} colors={colors}
              />
            </View>

            {/* Details */}
            <View style={[styles.detailCard, { backgroundColor: colors.surface }]}>
              <DetailRow icon="📅" text={formatDateRange(event.startTime, event.endTime)} colors={colors} />
              <DetailRow
                icon="📍"
                text={[event.location?.venueName || event.location?.name, event.location?.area, event.location?.city || 'Kampala'].filter(Boolean).join(', ')}
                colors={colors}
              />
              {(event.location?.lat || event.location?.mapsLink) && (
                <TouchableOpacity style={[styles.mapsBtn, { backgroundColor: colors.primaryFaint }]} onPress={openMaps}>
                  <Text style={[styles.mapsBtnTxt, { color: colors.primary }]}>📍 Open in Google Maps</Text>
                </TouchableOpacity>
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

            <Text style={[styles.descTitle, { color: colors.textPrimary }]}>About</Text>
            <Text style={[styles.desc, { color: colors.textSecondary }]}>{event.description}</Text>

            {/* Tabs */}
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

            {activeTab === 'Comments'  && <CommentSection   eventId={event.id} isOrganizer={isOrganizer} />}
            {activeTab === 'Attendees' && <AttendeesSection eventId={event.id} attendeeCount={event.attendeeCount} />}
            {activeTab === 'Reviews'   && <ReviewSection    eventId={event.id} eventEnded={eventEnded} />}
          </View>
        </ScrollView>

        {/* Footer */}
        {!isOrganizer ? (
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
                isFull && !attending && { opacity: 0.45 },
              ]}
              onPress={handleJoin}
              disabled={isFull && !attending}
              activeOpacity={0.85}
            >
              <Text style={[styles.joinTxt, attending && { color: colors.primary }]}>
                {!user ? 'Sign in to Join' : attending ? 'Leave' : isFull ? 'Full' : 'Join Event'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <Text style={{ flex: 1, textAlign: 'center', color: colors.textSecondary, fontWeight: '600', fontSize: 14 }}>
              You organised this event
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

function StatCell({ value, label, color, colors }) {
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

const styles = StyleSheet.create({
  safe:  { flex: 1, alignItems: 'center' },
  phone: { flex: 1, width: '100%' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backTxt: { fontSize: 15, fontWeight: '600' },

  coverWrap: { position: 'relative' },
  cover: { width: '100%', height: 270 },
  backBtn: { position: 'absolute', top: 48, left: 16, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  shareBtn: { position: 'absolute', top: 48, right: 16, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  btnTxt: { color: '#fff', fontSize: 18, fontWeight: '700' },
  myEventBadge: { position: 'absolute', bottom: 12, left: 12, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  myEventTxt:   { color: '#fff', fontSize: 12, fontWeight: '800' },
  liveBadge: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4, gap: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  liveTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },

  body: { padding: 18 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  catBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  catTxt:   { fontSize: 12, fontWeight: '700' },
  timeAway: { fontSize: 13, fontWeight: '600' },
  title:    { fontSize: 21, fontWeight: '900', lineHeight: 28, marginBottom: 14 },
  orgActions: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  actionBtn:  { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9 },
  actionTxt:  { fontWeight: '700', fontSize: 13, color: '#fff' },

  stats:    { flexDirection: 'row', borderRadius: 14, padding: 14, marginBottom: 14, alignItems: 'center' },
  statLine: { width: 1, height: 32 },

  detailCard: { borderRadius: 14, padding: 16, marginBottom: 14 },
  mapsBtn:    { borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 6 },
  mapsBtnTxt: { fontSize: 13, fontWeight: '600' },

  organizer: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 14 },
  orgLabel:  { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  orgName:   { fontSize: 15, fontWeight: '700', marginTop: 2 },

  descTitle: { fontSize: 15, fontWeight: '800', marginBottom: 8 },
  desc:      { fontSize: 14, lineHeight: 22, marginBottom: 16 },

  tabs: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  tab:  { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabTxt: { fontSize: 13, fontWeight: '700' },

  footer: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingHorizontal: 18, paddingVertical: 12, gap: 14 },
  footerLabel: { fontSize: 11, textTransform: 'uppercase', fontWeight: '600' },
  footerPrice: { fontSize: 17, fontWeight: '900' },
  joinBtn:  { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  joinTxt:  { color: '#fff', fontSize: 15, fontWeight: '700' },
})
