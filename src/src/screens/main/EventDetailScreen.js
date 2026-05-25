/**
 * EventDetailScreen.js — Full event detail with reviews
 */
import React from 'react'
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, Share, Alert, Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import colors from '../../constants/colors'
import useEventsStore from '../../store/eventsStore'
import useAuthStore from '../../store/authStore'
import Avatar from '../../components/common/Avatar'
import ReviewSection from '../../components/events/ReviewSection'
import { formatDateRange, formatUGX, formatAttendees, timeFromNow } from '../../utils/formatters'
import { formatDistance } from '../../utils/distance'
import { EVENT_CATEGORIES } from '../../constants/config'

export default function EventDetailScreen({ navigation, route }) {
  const { eventId, event: fromParams } = route.params || {}
  const { getEventById, joinEvent, leaveEvent, isAttending } = useEventsStore()
  const { user } = useAuthStore()

  const event = fromParams || getEventById(eventId)

  if (!event) {
    return (
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity style={styles.topBackBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.topBackTxt}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.notFound}>
          <Text style={{ fontSize: 40 }}>🔍</Text>
          <Text style={styles.notFoundTxt}>Event not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  const attending   = isAttending(event.id)
  const isOrganizer = event.organizer?.id === user?.id
  const isFull      = event.maxAttendees && event.attendeeCount >= event.maxAttendees
  const catMeta     = EVENT_CATEGORIES.find(c => c.id === event.category)
  const catColor    = colors.cat[event.category] || colors.primary
  const eventEnded  = new Date(event.endTime) < new Date()

  function handleJoin() {
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

  async function handleShare() {
    try {
      await Share.share({
        message: `${event.title}\n📅 ${formatDateRange(event.startTime, event.endTime)}\n📍 ${event.location?.venueName || event.location?.name}\n${formatUGX(event.entryFee)}\n\nFound on REDE`,
      })
    } catch {}
  }

  function openMaps() {
    const loc = event.location
    if (loc?.mapsLink) {
      Linking.openURL(loc.mapsLink)
    } else if (loc?.lat && loc?.lng) {
      Linking.openURL(`https://maps.google.com/?q=${loc.lat},${loc.lng}`)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
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
          {event.isNow && (
            <View style={styles.liveBadge}>
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
            <Text style={styles.timeAway}>{timeFromNow(event.startTime)}</Text>
          </View>

          <Text style={styles.title}>{event.title}</Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statVal, { color: colors.primary }]}>{formatUGX(event.entryFee)}</Text>
              <Text style={styles.statLbl}>Entry</Text>
            </View>
            <View style={styles.statLine} />
            <View style={styles.stat}>
              <Text style={styles.statVal}>{event.attendeeCount}</Text>
              <Text style={styles.statLbl}>Going</Text>
            </View>
            <View style={styles.statLine} />
            <View style={styles.stat}>
              <Text style={styles.statVal}>{event.maxAttendees || '∞'}</Text>
              <Text style={styles.statLbl}>Capacity</Text>
            </View>
          </View>

          {/* Details card */}
          <View style={styles.detailCard}>
            <Row icon="📅" text={formatDateRange(event.startTime, event.endTime)} />
            <Row
              icon="📍"
              text={[
                event.location?.venueName || event.location?.name,
                event.location?.area,
                event.location?.city || 'Kampala',
              ].filter(Boolean).join(', ')}
            />
            {/* Open in Maps button */}
            {(event.location?.lat || event.location?.mapsLink) && (
              <TouchableOpacity style={styles.mapsBtn} onPress={openMaps}>
                <Text style={styles.mapsBtnText}>📍 Open in Google Maps</Text>
              </TouchableOpacity>
            )}
            {/* Coordinates */}
            {event.location?.lat && (
              <Text style={styles.coords}>
                GPS: {event.location.lat.toFixed(5)}, {event.location.lng.toFixed(5)}
              </Text>
            )}
            <Row icon="👥" text={formatAttendees(event.attendeeCount, event.maxAttendees)} />
          </View>

          {/* Organizer */}
          <View style={styles.organizer}>
            <Avatar uri={event.organizer?.avatar} name={event.organizer?.name} size={44} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.orgLabel}>Organised by</Text>
              <Text style={styles.orgName}>
                {event.organizer?.name}{event.organizer?.verified ? ' ✓' : ''}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.descTitle}>About this event</Text>
          <Text style={styles.desc}>{event.description}</Text>

          {/* Tags */}
          {event.tags?.length > 0 && (
            <View style={styles.tags}>
              {event.tags.map(t => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagTxt}>#{t}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Reviews */}
          <ReviewSection eventId={event.id} eventEnded={eventEnded} />
        </View>
      </ScrollView>

      {/* Footer */}
      {!isOrganizer && (
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerLabel}>Entry fee</Text>
            <Text style={styles.footerPrice}>{formatUGX(event.entryFee)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.joinBtn, attending && styles.joinBtnOut, (isFull && !attending) && { opacity: 0.5 }]}
            onPress={handleJoin}
            disabled={isFull && !attending}
            activeOpacity={0.85}
          >
            <Text style={[styles.joinBtnTxt, attending && { color: colors.primary }]}>
              {attending ? 'Leave Event' : isFull ? 'Full' : 'Join Event'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {isOrganizer && (
        <View style={styles.footer}>
          <Text style={{ flex: 1, textAlign: 'center', color: colors.textSecondary, fontWeight: '600' }}>
            You organised this event
          </Text>
        </View>
      )}
    </SafeAreaView>
  )
}

function Row({ icon, text }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
      <Text style={{ fontSize: 15, marginRight: 10, marginTop: 1 }}>{icon}</Text>
      <Text style={{ fontSize: 14, color: colors.textSecondary, flex: 1, lineHeight: 20 }}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBackBtn: { padding: 20 },
  topBackTxt: { fontSize: 15, color: colors.primary, fontWeight: '600' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundTxt: { fontSize: 16, color: colors.textSecondary },
  coverWrap: { position: 'relative' },
  cover: { width: '100%', height: 260, backgroundColor: colors.shimmer },
  backBtn: {
    position: 'absolute', top: 48, left: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  shareBtn: {
    position: 'absolute', top: 48, right: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  backBtnTxt: { color: '#fff', fontSize: 18, fontWeight: '700' },
  liveBadge: {
    position: 'absolute', bottom: 12, left: 12,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.error, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4, gap: 5,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  liveTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },
  body: { padding: 18 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  catBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  catTxt: { fontSize: 12, fontWeight: '700' },
  timeAway: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  title: { fontSize: 21, fontWeight: '800', color: colors.textPrimary, lineHeight: 28, marginBottom: 16 },
  statsRow: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: 14, padding: 14, marginBottom: 16, alignItems: 'center',
  },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  statLbl: { fontSize: 11, color: colors.textSecondary },
  statLine: { width: 1, height: 32, backgroundColor: colors.border },
  detailCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 14 },
  mapsBtn: {
    marginTop: 6, marginBottom: 4,
    backgroundColor: colors.primaryFaint, borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 12,
  },
  mapsBtnText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  coords: { fontSize: 11, color: colors.textHint, marginBottom: 8 },
  organizer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 14,
  },
  orgLabel: { fontSize: 11, color: colors.textHint, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  orgName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
  descTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  desc: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 14 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tag: { backgroundColor: colors.surface, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  tagTxt: { fontSize: 12, color: colors.textSecondary },
  footer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: 18, paddingVertical: 12, gap: 14,
  },
  footerLabel: { fontSize: 11, color: colors.textHint, textTransform: 'uppercase', fontWeight: '600' },
  footerPrice: { fontSize: 17, fontWeight: '800', color: colors.primary },
  joinBtn: {
    flex: 1, backgroundColor: colors.primary,
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  joinBtnOut: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
  joinBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
