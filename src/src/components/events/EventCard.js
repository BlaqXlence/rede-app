/**
 * EventCard.js
 * Biglion-exact card design:
 * - Full image top, rounded card corners
 * - Heart icon top-right
 * - Title, location text, date, price below
 * - "X going" bottom
 * No discount badges for now
 */
import React, { useState } from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import colors from '../../constants/colors'
import { formatUGX, formatDate } from '../../utils/formatters'
import { EVENT_CATEGORIES } from '../../constants/config'

const { width } = Dimensions.get('window')
const CARD_WIDTH = (width - 32 - 10) / 2

export default function EventCard({ event, onPress, style }) {
  const [liked, setLiked] = useState(false)
  const isFull = event.maxAttendees && event.attendeeCount >= event.maxAttendees
  const catColor = colors.cat[event.category] || colors.primary

  return (
    <TouchableOpacity
      onPress={() => onPress(event)}
      activeOpacity={0.9}
      style={[styles.card, { width: CARD_WIDTH }, style]}
    >
      {/* Image */}
      <View style={styles.imgBox}>
        <Image
          source={{ uri: event.coverImage }}
          style={styles.img}
          resizeMode="cover"
        />

        {/* Heart — top right like Biglion */}
        <TouchableOpacity
          style={styles.heart}
          onPress={e => { e.stopPropagation?.(); setLiked(l => !l) }}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Text style={[styles.heartIcon, liked && styles.heartLiked]}>
            {liked ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>

        {/* Live pill */}
        {event.isNow && (
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}

        {/* Free badge */}
        {event.entryFee === 0 && (
          <View style={styles.freeBadge}>
            <Text style={styles.freeBadgeText}>Free</Text>
          </View>
        )}
      </View>

      {/* Content — exactly like Biglion */}
      <View style={styles.content}>
        {/* Category dot + label */}
        <View style={styles.catRow}>
          <View style={[styles.catDot, { backgroundColor: catColor }]} />
          <Text style={[styles.catLabel, { color: catColor }]} numberOfLines={1}>
            {EVENT_CATEGORIES.find(c => c.id === event.category)?.label || event.category}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>{event.title}</Text>

        {/* Location */}
        <Text style={styles.location} numberOfLines={1}>
          {event.location?.city ? `${event.location.city} · ` : ''}
          {event.location?.venueName || event.location?.name}
        </Text>

        {/* Date */}
        <Text style={styles.date}>{formatDate(event.startTime)}</Text>

        {/* Price row */}
        <View style={styles.priceRow}>
          <Text style={[styles.price, event.entryFee === 0 && { color: colors.success }]}>
            {formatUGX(event.entryFee)}
          </Text>
          {event.originalFee > event.entryFee && (
            <Text style={styles.originalPrice}>{formatUGX(event.originalFee)}</Text>
          )}
        </View>

        {/* Attendees */}
        <Text style={[styles.attendees, isFull && { color: colors.error }]}>
          {isFull ? 'Full' : `${event.attendeeCount} going`}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
  },
  imgBox: { position: 'relative' },
  img: {
    width: '100%',
    height: 130,
    backgroundColor: colors.shimmer,
  },
  heart: {
    position: 'absolute',
    top: 8, right: 8,
    width: 30, height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  heartIcon: { color: '#fff', fontSize: 15 },
  heartLiked: { color: '#EF4444' },
  livePill: {
    position: 'absolute', top: 8, left: 8,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.error, borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 3, gap: 4,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  freeBadge: {
    position: 'absolute', bottom: 8, left: 8,
    backgroundColor: colors.success, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  freeBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  content: { padding: 10 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  catDot: { width: 6, height: 6, borderRadius: 3 },
  catLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  title: {
    fontSize: 13, fontWeight: '700',
    color: colors.textPrimary, lineHeight: 18, marginBottom: 4,
  },
  location: { fontSize: 11, color: colors.textSecondary, marginBottom: 2 },
  date: { fontSize: 11, color: colors.textHint, marginBottom: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  price: { fontSize: 14, fontWeight: '800', color: colors.primary },
  originalPrice: { fontSize: 11, color: colors.textHint, textDecorationLine: 'line-through' },
  attendees: { fontSize: 10, color: colors.textHint },
})
