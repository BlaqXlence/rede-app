/**
 * EventDetailScreen.js
 * - Share button shares real app link
 * - Edit button for event creator
 * - Delete button (only if 0 attendees)
 * - Anyone can view, must login to join
 */
import React from 'react'
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, Share, Alert, Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore  from '../../store/themeStore'
import useEventsStore from '../../store/eventsStore'
import useAuthStore   from '../../store/authStore'
import Avatar         from '../../components/common/Avatar'
import ReviewSection  from '../../components/events/ReviewSection'
import { formatDateRange, formatUGX, formatAttendees, timeFromNow } from '../../utils/formatters'
import { EVENT_CATEGORIES, APP_URL } from '../../constants/config'
import { eventsApi } from '../../services/api'

export default function EventDetailScreen({ navigation, route }) {
  const { eventId, event: fromParams } = route.params || {}
  const { colors } = useThemeStore()
  const { getEventById, joinEvent, leaveEvent, isAttending, events, setEvents } = useEventsStore()
  const { user } = useAuthStore()

  const event = fromParams || getEventById(eventId)

  if (!event) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={styles.topBack} onPress={() => navigation.goBack()}>
          <Text style={[styles.topBackTxt, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.notFound}>
          <Text style={{ fontSize: 40 }}>🔍</Text>
          <Text style={[styles.notFoundTxt, { color: colors.textSecondary }]}>Event not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  const attending    = isAttending(event.id)
  const isOrganizer  = event.organizer?.id === user?.id
  const isFull       = event.maxAttendees && event.attendeeCount >= event.maxAttendees
  const catMeta      = EVENT_CATEGORIES.find(c => c.id === event.category)
  const catColor     = colors.cat[event.category] || colors.primary
  const eventEnded   = new Date(event.endTime) < new Date()
  const canDelete    = isOrganizer && event.attendeeCount === 0

  function handleJoin() {
    if (!user) {
      // Not logged in — redirect to auth
      Alert.alert(
        'Sign in required',
        'You need to sign in to join events.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Phone') },
        ]
      )
      return
    }
    if (attending) {
      Alert.alert('Leave event?', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => leaveEvent(event.id) },
      ])
    } else {
      joinEvent(event.id)
      Alert.alert("You're in! 🎉", `See you at ${event.title}`)
    }
  }

  // Share the real app link to this event
  async function handleShare() {
    const link = `${APP_URL}?event=${event.id}`
    try {
      await Share.share({
        message: `${event.title}\n📅 ${formatDateRange(event.startTime, event.endTime)}\n📍 ${event.location?.venueName || event.location?.name}\n${formatUGX(event.entryFee)}\n\n${link}`,
        url: link,
        title: event.title,
      })
    } catch {}
  }

  function openMaps() {
    const loc = event.location
    if (loc?.mapsLink) Linking.openURL(loc.mapsLink)
    else if (loc?.lat && loc?.lng) Linking.openURL(`https://maps.google.com/?q=${loc.lat},${loc.lng}`)
  }

  async function handleDelete() {
    Alert.alert(
      'Delete event?',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await eventsApi.delete(event.id)
              navigation.goBack()
            } catch (err) {
              Alert.alert('Could not delete', err.message)
            }
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover */}
        <View style={styles.coverWrap}>
          <Image source={{ uri: event.coverImage }} style={styles.cover} resizeMode="cover" />
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnTxt}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.backBtnTxt}>↗</Text>
          </TouchableOpacity>
          {event.entryFee === 0 && (
            <View style={[styles.freeBadge, { backgroundColor: colors.success }]}>
              <Text style={styles.freeBadgeTxt}>Free</Text>
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
            <View style={[styles.catBadge, { backgroundColor: catColor + '22', borderColor: catColor + '55' }]}>
              <Text style={[styles.catTxt, { color: catColor }]}>{catMeta?.label}</Text>
            </View>
            <Text style={[styles.timeAway, { color: colors.textSecondary }]}>{timeFromNow(event.startTime)}</Text>
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>{event.title}</Text>

          {/* Organizer actions */}
          {isOrganizer && (
            <View style={styles.orgActions}>
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('EditEvent', { event })}
              >
                <Text style={styles.editBtnTxt}>Edit Event</Text>
              </TouchableOpacity>
              {canDelete && (
                <TouchableOpacity
                  style={[styles.deleteBtn, { borderColor: colors.error }]}
                  onPress={handleDelete}
                >
                  <Text style={[styles.deleteBtnTxt, { color: colors.error }]}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Stats */}
          <View style={[styles.statsRow, { backgroundColor: colors.surface }]}>
            <View style={styles.stat}>
              <Text style={[styles.statVal, { color: colors.primary }]}>{formatUGX(event.entryFee)}</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Entry</Text>
            </View>
            <View style={[styles.statLine, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statVal, { color: colors.textPrimary }]}>{event.attendeeCount}</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Going</Text>
            </View>
            <View style={[styles.statLine, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statVal, { color: colors.textPrimary }]}>{event.maxAttendees || '∞'}</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Capacity</Text>
            </View>
          </View>

          {/* Details */}
          <View style={[styles.detailCard, { backgroundColor: colors.surface }]}>
            <Row icon="📅" text={formatDateRange(event.startTime, event.endTime)} color={colors.textSecondary} />
            <Row icon="📍" color={colors.textSecondary}
              text={[
                event.location?.venueName || event.location?.name,
                event.location?.area,
                event.location?.city || 'Kampala',
              ].filter(Boolean).join(', ')}
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
            <Row icon="👥" text={formatAttendees(event.attendeeCount, event.maxAttendees)} color={colors.textSecondary} />
          </View>

          {/* Organizer */}
          <View style={[styles.organizer, { backgroundColor: colors.surface }]}>
            <Avatar uri={event.organizer?.avatar} name={event.organizer?.name} size={44} />
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.orgLabel, { color: colors.textHint }]}>Organised by</Text>
              <Text style={[styles.orgName, { color: colors.textPrimary }]}>
                {event.organizer?.name}{event.organizer?.verified ? ' ✓' : ''}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={[styles.descTitle, { color: colors.textPrimary }]}>About this event</Text>
          <Text style={[styles.desc, { color: colors.textSecondary }]}>{event.description}</Text>

          {/* Reviews */}
          <ReviewSection eventId={event.id} eventEnded={eventEnded} />
        </View>
      </ScrollView>

      {/* Footer — anyone can see, must login to join */}
      {!isOrganizer && (
        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <View>
            <Text style={[styles.footerLabel, { color: colors.textHint }]}>Entry fee</Text>
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
              {!user ? 'Sign in to Join' : attending ? 'Leave Event' : isFull ? 'Full' : 'Join Event'}
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
  safe: { flex: 1 },
  topBack: { padding: 20 },
  topBackTxt: { fontSize: 15, fontWeight: '600' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundTxt: { fontSize: 16 },
  coverWrap: { position: 'relative' },
  cover: { width: '100%', height: 260 },
  backBtn: { position: 'absolute', top: 48, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  shareBtn: { position: 'absolute', top: 48, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  backBtnTxt: { color: '#fff', fontSize: 18, fontWeight: '700' },
  freeBadge: { position: 'absolute', bottom: 12, left: 12, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  freeBadgeTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  liveBadge: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, gap: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  liveTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },
  body: { padding: 18 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  catBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  catTxt: { fontSize: 12, fontWeight: '700' },
  timeAway: { fontSize: 13, fontWeight: '600' },
  title: { fontSize: 21, fontWeight: '800', lineHeight: 28, marginBottom: 14 },
  orgActions: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  editBtn: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  editBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  deleteBtn: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1.5 },
  deleteBtnTxt: { fontWeight: '700', fontSize: 13 },
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
  desc: { fontSize: 14, lineHeight: 22, marginBottom: 14 },
  footer: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingHorizontal: 18, paddingVertical: 12, gap: 14 },
  footerLabel: { fontSize: 11, textTransform: 'uppercase', fontWeight: '600' },
  footerPrice: { fontSize: 17, fontWeight: '800' },
  joinBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  joinBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
