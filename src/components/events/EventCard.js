import React from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import colors from '../../constants/colors'
import { formatUGX, formatTime, formatDate, discountPercent } from '../../utils/formatters'
import { formatDistance } from '../../utils/distance'

const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2

export default function EventCard({ event, onPress, style }) {
  const discount = discountPercent(event.originalFee, event.entryFee)
  const isFull = event.maxAttendees && event.attendeeCount >= event.maxAttendees
  const isNow = event.isNow

  return (
    <TouchableOpacity
      onPress={() => onPress(event)}
      activeOpacity={0.85}
      style={[styles.card, style]}
    >
      {/* Cover image */}
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: event.coverImage }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Discount badge — bottom left like Biglion */}
        {discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}%</Text>
          </View>
        )}

        {/* Live pill */}
        {isNow && (
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}

        {/* Distance */}
        {event.distance != null && (
          <View style={styles.distancePill}>
            <Text style={styles.distanceText}>📍 {formatDistance(event.distance)}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{event.title}</Text>

        <Text style={styles.location} numberOfLines={1}>📍 {event.location.name}</Text>
        <Text style={styles.date}>{formatDate(event.startTime)}</Text>

        {/* Price row */}
        <View style={styles.priceRow}>
          <Text style={[styles.price, event.entryFee === 0 && styles.free]}>
            {formatUGX(event.entryFee)}
          </Text>
          {event.originalFee && event.originalFee > event.entryFee && (
            <Text style={styles.originalPrice}>{formatUGX(event.originalFee)}</Text>
          )}
        </View>

        <Text style={[styles.attendees, isFull && styles.fullText]}>
          {isFull ? '🔴 Full' : `👥 ${event.attendeeCount} going`}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 130,
    backgroundColor: colors.shimmer,
  },
  discountBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  livePill: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginRight: 4,
  },
  liveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  distancePill: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  distanceText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    padding: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 18,
    marginBottom: 5,
  },
  location: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  date: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  price: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  free: {
    color: colors.success,
  },
  originalPrice: {
    fontSize: 11,
    color: colors.textHint,
    textDecorationLine: 'line-through',
  },
  attendees: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  fullText: {
    color: colors.error,
    fontWeight: '700',
  },
})
