/**
 * EventDetailScreen.js
 *
 * Accepts event via params.event (freshly created) OR looks up by params.eventId.
 * The params.event fallback prevents "Event not found" right after creation.
 */
import React from 'react'
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Share, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import colors from '../../constants/colors'
import useEventsStore from '../../store/eventsStore'
import useAuthStore from '../../store/authStore'
import Avatar from '../../components/common/Avatar'
import { formatDateRange, formatUGX, formatAttendees, timeFromNow, discountPercent } from '../../utils/formatters'
import { formatDistance } from '../../utils/distance'
import { EVENT_CATEGORIES } from '../../constants/config'

export default function EventDetailScreen({ navigation, route }) {
  const { eventId, event: eventFromParams } = route.params || {}
  const { getEventById, joinEvent, leaveEvent, isAttending } = useEventsStore()
  const { user } = useAuthStore()

  // Use freshly created event from params first, then fall back to store
  const event = eventFromParams || getEventById(eventId)

  if (!event) {
    return (
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity style={styles.topBack} onPress={() => navigation.goBack()}>
          <Text style={styles.topBackText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.notFound}>
          <Text style={{ fontSize: 48 }}>🔍</Text>
          <Text style={styles.notFoundText}>Event not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  const attending   = isAttending(event.id)
  const isOrganizer = event.organizer?.id === user?.id
  const isFull      = event.maxAttendees && event.attendeeCount >= event.maxAttendees
  const catMeta     = EVENT_CATEGORIES.find(c => c.id === event.category)
  const discount    = discountPercent(event.originalFee, event.entryFee)

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
        message: `${event.title}\n📅 ${formatDateRange(event.startTime, event.endTime)}\n📍 ${event.location?.name}\n${formatUGX(event.entryFee)}\n\nFound on REDE — rede-app.netlify.app`,
      })
    } catch {}
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.coverWrap}>
          <Image source={{ uri: event.coverImage }} style={styles.cover} resizeMode="cover" />
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backTxt}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.backTxt}>↗</Text>
          </TouchableOpacity>
          {discount ? (
            <View style={styles.discountBadge}><Text style={styles.discountTxt}>{discount}%</Text></View>
          ) : null}
          {event.isNow ? (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveTxt}>LIVE NOW</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <View style={styles.topRow}>
            <View style={styles.catBadge}>
              <Text style={styles.catTxt}>{catMeta?.emoji} {catMeta?.label}</Text>
            </View>
            <Text style={styles.timeAway}>{timeFromNow(event.startTime)}</Text>
          </View>

          <Text style={styles.title}>{event.title}</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{discount ? `${discount}%` : '—'}</Text>
              <Text style={styles.statLbl}>Discount</Text>
            </View>
            <View style={styles.statLine} />
            <View style={styles.stat}>
              <Text style={[styles.statVal, { color: colors.primary }]}>{formatUGX(event.entryFee)}</Text>
              <Text style={styles.statLbl}>Entry</Text>
            </View>
            <View style={styles.statLine} />
            <View style={styles.stat}>
              <Text style={styles.statVal}>{event.attendeeCount}</Text>
              <Text style={styles.statLbl}>Going</Text>
            </View>
          </View>

          <View style={styles.detailCard}>
            {[
              { icon: '📅', text: formatDateRange(event.startTime, event.endTime) },
              { icon: '📍', text: `${event.location?.name} · ${event.location?.address}` },
              event.distance != null && { icon: '🗺️', text: `${formatDistance(event.distance)} away` },
              { icon: '👥', text: formatAttendees(event.attendeeCount, event.maxAttendees) },
            ].filter(Boolean).map((row, i) => (
              <View key={i} style={styles.detailRow}>
                <Text style={styles.detailIcon}>{row.icon}</Text>
                <Text style={styles.detailTxt}>{row.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.organizer}>
            <Avatar uri={event.organizer?.avatar} name={event.organizer?.name} size={44} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.orgLbl}>Organised by</Text>
              <Text style={styles.orgName}>{event.organizer?.name}{event.organizer?.verified ? ' ✓' : ''}</Text>
            </View>
          </View>

          <Text style={styles.descTitle}>About this event</Text>
          <Text style={styles.desc}>{event.description}</Text>

          {event.tags?.length > 0 && (
            <View style={styles.tags}>
              {event.tags.map(t => (
                <View key={t} style={styles.tag}><Text style={styles.tagTxt}>#{t}</Text></View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {!isOrganizer && (
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerLbl}>Entry</Text>
            <Text style={styles.footerPrice}>{formatUGX(event.entryFee)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.joinBtn, attending && styles.joinBtnLeave, isFull && !attending && { opacity: 0.5 }]}
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBack: { padding: 20 },
  topBackText: { fontSize: 15, color: colors.primary, fontWeight: '600' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: 16, color: colors.textSecondary },
  coverWrap: { position: 'relative' },
  cover: { width: '100%', height: 260, backgroundColor: colors.shimmer },
  backBtn: { position: 'absolute', top: 48, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  shareBtn: { position: 'absolute', top: 48, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#fff', fontSize: 18, fontWeight: '700' },
  discountBadge: { position: 'absolute', bottom: 12, left: 12, backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  discountTxt: { color: '#fff', fontSize: 14, fontWeight: '800' },
  liveBadge: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.error, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff', marginRight: 5 },
  liveTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },
  body: { padding: 18 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  catBadge: { backgroundColor: colors.primaryFaint, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  catTxt: { fontSize: 12, fontWeight: '700', color: colors.primary },
  timeAway: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  title: { fontSize: 21, fontWeight: '800', color: colors.textPrimary, lineHeight: 28, marginBottom: 16, letterSpacing: -0.3 },
  statsRow: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 16, alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  statLbl: { fontSize: 11, color: colors.textSecondary },
  statLine: { width: 1, height: 32, backgroundColor: colors.border },
  detailCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 14, gap: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start' },
  detailIcon: { fontSize: 15, marginRight: 10, marginTop: 1 },
  detailTxt: { fontSize: 14, color: colors.textSecondary, flex: 1, lineHeight: 20 },
  organizer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 14 },
  orgLbl: { fontSize: 11, color: colors.textHint, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  orgName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
  descTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  desc: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 14 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: colors.surface, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  tagTxt: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  footer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 18, paddingVertical: 12, gap: 14 },
  footerLbl: { fontSize: 11, color: colors.textHint, textTransform: 'uppercase', fontWeight: '600' },
  footerPrice: { fontSize: 17, fontWeight: '800', color: colors.primary },
  joinBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  joinBtnLeave: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
  joinBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
