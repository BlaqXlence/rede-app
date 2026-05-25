/**
 * EventCard.js
 * Biglion-style 2-column event card.
 * - Discount % badge bottom-left on image (orange pill)
 * - Title, venue, date below image
 * - Price with strikethrough original
 * - Attendee count
 */
import React from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import colors from '../../constants/colors'
import { formatUGX, formatDate, discountPercent } from '../../utils/formatters'
import { formatDistance } from '../../utils/distance'
import { EVENT_CATEGORIES } from '../../constants/config'

const { width } = Dimensions.get('window')
// Two columns with 16px padding each side and 10px gap between
const CARD_WIDTH = (width - 32 - 10) / 2

export default function EventCard({ event, onPress, style }) {
  const discount = discountPercent(event.originalFee, event.entryFee)
  const isFull   = event.maxAttendees && event.attendeeCount >= event.maxAttendees
  const cat      = EVENT_CATEGORIES.find(c => c.id === event.category)

  return (
    <TouchableOpacity
      onPress={() => onPress(event)}
      activeOpacity={0.88}
      style={[styles.card, { width: CARD_WIDTH }, style]}
    >
      {/* Cover image */}
      <View style={styles.imgWrap}>
        <Image
          source={{ uri: event.coverImage }}
          style={styles.img}
          resizeMode="cover"
        />

        {/* Discount badge — orange pill, bottom left */}
        {discount ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}%</Text>
          </View>
        ) : event.entryFee === 0 ? (
          <View style={[styles.discountBadge, styles.freeBadge]}>
            <Text style={styles.discountText}>Free</Text>
          </View>
        ) : null}

        {/* Live pill */}
        {event.isNow && (
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Category label */}
        {cat && (
          <Text style={[styles.catLabel, { color: cat.accent }]}>{cat.label}</Text>
        )}

        <Text style={styles.title} numberOfLines={2}>{event.title}</Text>

        <Text style={styles.venue} numberOfLines={1}>
          {event.location?.name}
        </Text>

        <Text style={styles.date}>{formatDate(event.startTime)}</Text>

        {/* Price row */}
        <View style={styles.priceRow}>
          <Text style={[styles.price, event.entryFee === 0 && styles.free]}>
            {formatUGX(event.entryFee)}
          </Text>
          {event.originalFee > event.entryFee && (
            <Text style={styles.original}>{formatUGX(event.originalFee)}</Text>
          )}
        </View>

        <Text style={[styles.attendees, isFull && styles.fullText]}>
          {isFull ? 'Full' : `${event.attendeeCount} going`}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  imgWrap: {
    position: 'relative',
  },
  img: {
    width: '100%',
    height: 120,
    backgroundColor: colors.shimmer,
  },
  discountBadge: {
    position: 'absolute',
    bottom: 7,
    left: 7,
    backgroundColor: colors.primary,
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  freeBadge: {
    backgroundColor: '#2E7D32',
  },
  discountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  livePill: {
    position: 'absolute',
    top: 7,
    right: 7,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  content: {
    padding: 9,
  },
  catLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 17,
    marginBottom: 4,
  },
  venue: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  date: {
    fontSize: 11,
    color: colors.textHint,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  price: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  free: {
    color: '#2E7D32',
  },
  original: {
    fontSize: 10,
    color: colors.textHint,
    textDecorationLine: 'line-through',
  },
  attendees: {
    fontSize: 10,
    color: colors.textHint,
  },
  fullText: {
    color: colors.error,
    fontWeight: '700',
  },
})
