/**
 * EventCard.js
 *
 * Card design matching the reference photo:
 * - Large tall image fills top
 * - Heart top-right — tapping saves to liked events (persisted)
 * - Bold title, venue, price below
 * - No heavy borders or shadows
 */
import React from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import useThemeStore  from '../../store/themeStore'
import useEventsStore from '../../store/eventsStore'
import { formatUGX, formatDateShort } from '../../utils/formatters'
import { EVENT_CATEGORIES } from '../../constants/config'

const { width } = Dimensions.get('window')
const MAX_W = Math.min(width, 500)

export const CARD_WIDTH_GRID  = (MAX_W - 32 - 12) / 2
export const CARD_WIDTH_HORIZ = MAX_W * 0.72

export default function EventCard({ event, onPress, horizontal = false, style }) {
  const { colors }     = useThemeStore()
  const { toggleLike, isLiked } = useEventsStore()

  const liked    = isLiked(event.id)
  const catColor = colors.cat[event.category] || colors.primary
  const catLabel = EVENT_CATEGORIES.find(c => c.id === event.category)?.label || ''
  const isFull   = event.maxAttendees && event.attendeeCount >= event.maxAttendees
  const cardW    = horizontal ? CARD_WIDTH_HORIZ : CARD_WIDTH_GRID

  return (
    <TouchableOpacity
      onPress={() => onPress(event)}
      activeOpacity={0.93}
      style={[styles.card, { width: cardW, backgroundColor: colors.surface }, style]}
    >
      {/* Image */}
      <View style={styles.imgBox}>
        <Image
          source={{ uri: event.coverImage }}
          style={[styles.img, { height: horizontal ? 180 : 150 }]}
          resizeMode="cover"
        />

        {/* Date pill */}
        <View style={styles.datePill}>
          <Text style={styles.datePillTxt}>{formatDateShort(event.startTime)}</Text>
        </View>

        {/* Heart — persisted like */}
        <TouchableOpacity
          style={styles.heart}
          onPress={e => { e.stopPropagation?.(); toggleLike(event.id) }}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Text style={{ fontSize: 18, color: liked ? '#EF4444' : 'rgba(255,255,255,0.9)' }}>
            {liked ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>

        {event.isNow && (
          <View style={[styles.livePill, { backgroundColor: colors.error }]}>
            <View style={styles.liveDot} />
            <Text style={styles.liveTxt}>LIVE</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.catRow}>
          <View style={[styles.catDot, { backgroundColor: catColor }]} />
          <Text style={[styles.catLabel, { color: catColor }]} numberOfLines={1}>{catLabel}</Text>
        </View>

        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {event.title}
        </Text>

        <Text style={[styles.venue, { color: colors.textSecondary }]} numberOfLines={1}>
          {event.location?.venueName || event.location?.name}
        </Text>

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: event.entryFee === 0 ? colors.success : colors.primary }]}>
            {formatUGX(event.entryFee)}
          </Text>
          <Text style={[styles.going, { color: isFull ? colors.error : colors.textHint }]}>
            {isFull ? 'Full' : `${event.attendeeCount} going`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card:    { borderRadius: 14, overflow: 'hidden' },
  imgBox:  { position: 'relative' },
  img:     { width: '100%' },
  datePill: {
    position: 'absolute', top: 9, left: 9,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
  },
  datePillTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },
  heart: {
    position: 'absolute', top: 9, right: 9,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  livePill: {
    position: 'absolute', bottom: 9, right: 9,
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, gap: 3,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' },
  liveTxt: { color: '#fff', fontSize: 9, fontWeight: '800' },
  info:     { padding: 10 },
  catRow:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 },
  catDot:   { width: 6, height: 6, borderRadius: 3 },
  catLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  title:    { fontSize: 15, fontWeight: '800', lineHeight: 20, marginBottom: 4 },
  venue:    { fontSize: 12, marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price:    { fontSize: 15, fontWeight: '900' },
  going:    { fontSize: 11 },
})
