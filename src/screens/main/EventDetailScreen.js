import React from 'react'
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, Share, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import colors from '../../constants/colors'
import useEventsStore from '../../store/eventsStore'
import useAuthStore from '../../store/authStore'
import Avatar from '../../components/common/Avatar'
import Button from '../../components/common/Button'
import { formatDateRange, formatUGX, formatAttendees, timeFromNow, discountPercent } from '../../utils/formatters'
import { formatDistance } from '../../utils/distance'
import { EVENT_CATEGORIES, PAYMENT } from '../../constants/config'

export default function EventDetailScreen({ navigation, route }) {
  const { eventId } = route.params
  const { getEventById, joinEvent, leaveEvent, isAttending } = useEventsStore()
  const { user } = useAuthStore()
  const event = getEventById(eventId)

  if (!event) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ color: colors.textSecondary, padding: 24 }}>Event not found</Text>
      </SafeAreaView>
    )
  }

  const attending = isAttending(eventId)
  const isOrganizer = event.organizer.id === user?.id
  const isFull = event.maxAttendees && event.attendeeCount >= event.maxAttendees
  const catMeta = EVENT_CATEGORIES.find(c => c.id === event.category)
  const discount = discountPercent(event.originalFee, event.entryFee)

  function handleJoin() {
    if (attending) {
      Alert.alert('Leave event?', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => leaveEvent(eventId) },
      ])
    } else {
      joinEvent(eventId)
      Alert.alert("You're in! 🎉", `See you at ${event.title}`)
    }
  }

  async function handleShare() {
    try {
      await Share.share({
        message: `${event.title}\n📅 ${formatDateRange(event.startTime, event.endTime)}\n📍 ${event.location.name}\n${formatUGX(event.entryFee)}\n\nFound on REDE`,
      })
    } catch {}
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover */}
        <View style={styles.coverWrap}>
          <Image source={{ uri: event.coverImage }} style={styles.cover} resizeMode="cover" />

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareText}>↗</Text>
          </TouchableOpacity>

          {discount && (
            <View style={styles.discountOverlay}>
              <Text style={styles.discountOverlayText}>{discount}%</Text>
            </View>
          )}

          {event.isNow && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE NOW</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          {/* Category + time */}
          <View style={styles.topRow}>
            <View style={styles.catBadge}>
              <Text style={styles.catText}>{catMeta?.emoji} {catMeta?.label}</Text>
            </View>
            <Text style={styles.timeAway}>{timeFromNow(event.startTime)}</Text>
          </View>

          <Text style={styles.title}>{event.title}</Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{discount ? `${discount}%` : '—'}</Text>
              <Text style={styles.statLabel}>Discount</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatUGX(event.entryFee)}</Text>
              <Text style={styles.statLabel}>Entry</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{event.attendeeCount}</Text>
              <Text style={styles.statLabel}>Going</Text>
            </View>
          </View>

          {/* Details card */}
          <View style={styles.detailsCard}>
            <DetailRow icon="📅" text={formatDateRange(event.startTime, event.endTime)} />
            <DetailRow icon="📍" text={`${event.location.name} · ${event.location.address}`} />
            {event.distance != null && <DetailRow icon="🗺️" text={`${formatDistance(event.distance)} away`} />}
            <DetailRow icon="👥" text={formatAttendees(event.attendeeCount, event.maxAttendees)} />
          </View>

          {/* Organizer */}
          <View style={styles.organizer}>
            <Avatar uri={event.organizer.avatar} name={event.organizer.name} size={44} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.orgLabel}>Organised by</Text>
              <Text style={styles.orgName}>
                {event.organizer.name}{event.organizer.verified ? ' ✓' : ''}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.descTitle}>About this event</Text>
          <Text style={styles.description}>{event.description}</Text>

          {/* Tags */}
          {event.tags?.length > 0 && (
            <View style={styles.tags}>
              {event.tags.map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky bottom */}
      {!isOrganizer && (
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerLabel}>Entry fee</Text>
            <View style={styles.footerPriceRow}>
              <Text style={styles.footerPrice}>{formatUGX(event.entryFee)}</Text>
              {event.originalFee && event.originalFee > event.entryFee && (
                <Text style={styles.footerOriginal}>{formatUGX(event.originalFee)}</Text>
              )}
            </View>
          </View>
          <Button
            label={attending ? 'Leave Event' : isFull ? 'Full' : 'Join Event'}
            onPress={handleJoin}
            variant={attending ? 'secondary' : 'primary'}
            disabled={isFull && !attending}
            size="md"
            style={styles.joinBtn}
          />
        </View>
      )}

      {isOrganizer && (
        <View style={styles.footer}>
          <Text style={{ color: colors.textSecondary, flex: 1, textAlign: 'center', fontWeight: '600' }}>
            You're organising this event
          </Text>
        </View>
      )}
    </SafeAreaView>
  )
}

function DetailRow({ icon, text }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailIcon}>{icon}</Text>
      <Text style={styles.detailText}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  coverWrap: { position: 'relative' },
  cover: { width: '100%', height: 280, backgroundColor: colors.shimmer },
  backBtn: {
    position: 'absolute', top: 48, left: 16,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  shareBtn: {
    position: 'absolute', top: 48, right: 16,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  shareText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  discountOverlay: {
    position: 'absolute', bottom: 12, left: 12,
    backgroundColor: colors.primary, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  discountOverlayText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  liveBadge: {
    position: 'absolute', bottom: 12, right: 12,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.error, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff', marginRight: 5 },
  liveText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  body: { padding: 20 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  catBadge: { backgroundColor: colors.primaryFaint, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  catText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  timeAway: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, lineHeight: 30, marginBottom: 16, letterSpacing: -0.3 },
  statsRow: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: 14, padding: 16, marginBottom: 16,
    alignItems: 'center',
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 15, fontWeight: '800', color: colors.primary, marginBottom: 2 },
  statLabel: { fontSize: 11, color: colors.textSecondary },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  detailsCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 16, gap: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start' },
  detailIcon: { fontSize: 15, marginRight: 10, marginTop: 1 },
  detailText: { fontSize: 14, color: colors.textSecondary, flex: 1, lineHeight: 20 },
  organizer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 16 },
  orgLabel: { fontSize: 11, color: colors.textHint, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  orgName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
  descTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  description: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 16 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: colors.surface, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  footer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: 20, paddingVertical: 14, gap: 14,
  },
  footerLabel: { fontSize: 11, color: colors.textHint, textTransform: 'uppercase', fontWeight: '600' },
  footerPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  footerPrice: { fontSize: 18, fontWeight: '800', color: colors.primary },
  footerOriginal: { fontSize: 13, color: colors.textHint, textDecorationLine: 'line-through' },
  joinBtn: { flex: 1 },
})
