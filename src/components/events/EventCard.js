/**
 * EventCard.js
 * Shows: photo, date, heart, category, title, venue + city, price + going
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
export const CARD_WIDTH_HORIZ = MAX_W * 0.68

export default function EventCard({ event, onPress, horizontal = false, style }) {
  const { colors }              = useThemeStore()
  const { toggleLike, isLiked } = useEventsStore()

  const liked    = isLiked(event.id)
  const catColor = colors.cat[event.category] || colors.primary
  const catLabel = EVENT_CATEGORIES.find(c => c.id === event.category)?.label || ''
  const isFull   = event.maxAttendees && event.attendeeCount >= event.maxAttendees
  const cardW    = horizontal ? CARD_WIDTH_HORIZ : CARD_WIDTH_GRID

  // Build location string: venue, area, city
  const venueParts = [
    event.location?.venueName || event.location?.name,
    event.location?.area,
    event.location?.city,
  ].filter(Boolean)
  const venueStr = venueParts.length > 0
    ? venueParts.join(', ')
    : event.location?.address || ''

  return (
    <TouchableOpacity
      onPress={() => onPress(event)}
      activeOpacity={0.92}
      style={[styles.card, { width: cardW, backgroundColor: colors.surface, shadowColor: colors.isDark ? '#000' : '#bbb' }, style]}
    >
      {/* Photo */}
      <View style={styles.imgWrap}>
        <Image
          source={{ uri: event.coverImage }}
          style={[styles.img, { height: horizontal ? 190 : 150 }]}
          resizeMode="cover"
        />
        <View style={styles.dateBadge}>
          <Text style={styles.dateTxt}>{formatDateShort(event.startTime)}</Text>
        </View>
        <TouchableOpacity
          style={styles.heart}
          onPress={e => { e.stopPropagation?.(); toggleLike(event.id) }}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Text style={[styles.heartIcon, { color: liked ? '#EF4444' : '#fff' }]}>
            {liked ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
        {event.isNow && (
          <View style={[styles.liveBadge, { backgroundColor: colors.error }]}>
            <View style={styles.liveDot} />
            <Text style={styles.liveTxt}>LIVE</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.catRow}>
          <View style={[styles.catDot, { backgroundColor: catColor }]} />
          <Text style={[styles.catLabel, { color: catColor }]} numberOfLines={1}>
            {catLabel.toUpperCase()}
          </Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {event.title}
        </Text>

        {/* Venue + city */}
        {venueStr ? (
          <Text style={[styles.venue, { color: colors.textSecondary }]} numberOfLines={2}>
            {venueStr}
          </Text>
        ) : null}

        {/* Price + going */}
        <View style={styles.bottom}>
          <Text style={[styles.price, { color: event.entryFee === 0 ? colors.success : colors.primary }]}>
            {formatUGX(event.entryFee)}
          </Text>
          <Text style={[styles.going, { color: isFull ? colors.error : colors.textHint }]}>
            {isFull ? 'Full' : `${event.attendeeCount || 0} going`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14, overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  imgWrap:  { position: 'relative' },
  img:      { width: '100%' },
  dateBadge: {
    position: 'absolute', top: 9, left: 9,
    backgroundColor: 'rgba(0,0,0,0.52)', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  dateTxt:  { color: '#fff', fontSize: 10, fontWeight: '700' },
  heart: {
    position: 'absolute', top: 8, right: 8,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center', justifyContent: 'center',
  },
  heartIcon: { fontSize: 17 },
  liveBadge: {
    position: 'absolute', bottom: 8, right: 8,
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, gap: 4,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' },
  liveTxt: { color: '#fff', fontSize: 9, fontWeight: '800' },

  info:     { padding: 10, paddingBottom: 12 },
  catRow:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  catDot:   { width: 6, height: 6, borderRadius: 3 },
  catLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  title:    { fontSize: 14, fontWeight: '800', lineHeight: 19, marginBottom: 3 },
  venue:    { fontSize: 11, lineHeight: 15, marginBottom: 7 },
  bottom:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price:    { fontSize: 14, fontWeight: '900' },
  going:    { fontSize: 11 },
})
