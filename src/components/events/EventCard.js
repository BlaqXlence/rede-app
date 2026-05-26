/**
 * EventCard.js
 * Biglion-exact card:
 * - No bottom border / rounded bottom corners
 * - Date shown small on the image (top left)
 * - Heart top right
 * - Clean content below: title, location, price, attendees
 */
import React, { useState } from 'react'
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, Dimensions,
} from 'react-native'
import useThemeStore from '../../store/themeStore'
import { formatUGX, formatDateShort } from '../../utils/formatters'
import { EVENT_CATEGORIES } from '../../constants/config'

const { width } = Dimensions.get('window')
export const CARD_WIDTH_GRID  = (width - 32 - 10) / 2
export const CARD_WIDTH_HORIZ = width * 0.44

export default function EventCard({ event, onPress, horizontal = false, style }) {
  const { colors } = useThemeStore()
  const [liked, setLiked] = useState(false)

  const isFull   = event.maxAttendees && event.attendeeCount >= event.maxAttendees
  const catColor = colors.cat[event.category] || colors.primary
  const catLabel = EVENT_CATEGORIES.find(c => c.id === event.category)?.label || ''
  const cardW    = horizontal ? CARD_WIDTH_HORIZ : CARD_WIDTH_GRID

  return (
    <TouchableOpacity
      onPress={() => onPress(event)}
      activeOpacity={0.9}
      style={[
        styles.card,
        { width: cardW, backgroundColor: colors.surface },
        style,
      ]}
    >
      {/* ── Image section ──────────────────────────────────── */}
      <View style={styles.imgBox}>
        <Image
          source={{ uri: event.coverImage }}
          style={styles.img}
          resizeMode="cover"
        />

        {/* Date — top left, small pill on image */}
        <View style={styles.datePill}>
          <Text style={styles.datePillTxt}>{formatDateShort(event.startTime)}</Text>
        </View>

        {/* Heart — top right like Biglion */}
        <TouchableOpacity
          style={styles.heart}
          onPress={e => { e.stopPropagation?.(); setLiked(l => !l) }}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Text style={{ fontSize: 15, color: liked ? '#EF4444' : 'rgba(255,255,255,0.9)' }}>
            {liked ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>

        {/* Live badge */}
        {event.isNow && (
          <View style={[styles.livePill, { backgroundColor: colors.error }]}>
            <View style={styles.liveDot} />
            <Text style={styles.liveTxt}>LIVE</Text>
          </View>
        )}
      </View>

      {/* ── Content below image ────────────────────────────── */}
      <View style={styles.content}>
        {/* Category dot + name */}
        <View style={styles.catRow}>
          <View style={[styles.catDot, { backgroundColor: catColor }]} />
          <Text style={[styles.catLabel, { color: catColor }]} numberOfLines={1}>
            {catLabel}
          </Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {event.title}
        </Text>

        {/* Venue */}
        <Text style={[styles.venue, { color: colors.textSecondary }]} numberOfLines={1}>
          📍 {event.location?.venueName || event.location?.name}
        </Text>

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={[
            styles.price,
            { color: event.entryFee === 0 ? colors.success : colors.primary },
          ]}>
            {formatUGX(event.entryFee)}
          </Text>
          {event.originalFee > event.entryFee && (
            <Text style={[styles.originalPrice, { color: colors.textHint }]}>
              {formatUGX(event.originalFee)}
            </Text>
          )}
        </View>

        {/* Attendees */}
        <Text style={[
          styles.attendees,
          { color: isFull ? colors.error : colors.textHint },
        ]}>
          {isFull ? '🔴 Full' : `${event.attendeeCount} going`}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    // No explicit border — clean card with shadow effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  // Image
  imgBox: { position: 'relative' },
  img:    { width: '100%', height: 125 },

  // Date pill — top left on image
  datePill: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  datePillTxt: {
    color: '#fff', fontSize: 10, fontWeight: '700',
  },

  // Heart
  heart: {
    position: 'absolute', top: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Live
  livePill: {
    position: 'absolute', bottom: 8, right: 8,
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3, gap: 4,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' },
  liveTxt: { color: '#fff', fontSize: 9, fontWeight: '800' },

  // Content
  content: { padding: 10 },

  catRow:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  catDot:   { width: 5, height: 5, borderRadius: 3 },
  catLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },

  title: {
    fontSize: 13, fontWeight: '700', lineHeight: 18, marginBottom: 4,
  },
  venue: {
    fontSize: 11, marginBottom: 5,
  },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  price:    { fontSize: 14, fontWeight: '800' },
  originalPrice: { fontSize: 11, textDecorationLine: 'line-through' },

  attendees: { fontSize: 10 },
})
