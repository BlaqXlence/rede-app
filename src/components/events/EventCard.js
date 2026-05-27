/**
 * EventCard.js
 * Biglion-exact card — photo fills top, minimal info below, NO border.
 * Clean rounded card with subtle shadow only.
 */
import React, { useState } from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import useThemeStore from '../../store/themeStore'
import { formatUGX, formatDateShort } from '../../utils/formatters'
import { EVENT_CATEGORIES } from '../../constants/config'

const { width } = Dimensions.get('window')
export const CARD_WIDTH_GRID  = (width - 32 - 10) / 2
export const CARD_WIDTH_HORIZ = width * 0.46

export default function EventCard({ event, onPress, horizontal = false, style }) {
  const { colors } = useThemeStore()
  const [liked, setLiked] = useState(false)

  const catColor = colors.cat[event.category] || colors.primary
  const catLabel = EVENT_CATEGORIES.find(c => c.id === event.category)?.label || ''
  const isFull   = event.maxAttendees && event.attendeeCount >= event.maxAttendees
  const cardW    = horizontal ? CARD_WIDTH_HORIZ : CARD_WIDTH_GRID

  return (
    <TouchableOpacity
      onPress={() => onPress(event)}
      activeOpacity={0.92}
      style={[
        styles.card,
        {
          width: cardW,
          backgroundColor: colors.surface,
          // Subtle shadow — no visible border
          shadowColor: colors.isDark ? '#000' : '#999',
        },
        style,
      ]}
    >
      {/* ── Full photo top ───────────────────────────────── */}
      <View style={styles.imgBox}>
        <Image
          source={{ uri: event.coverImage }}
          style={styles.img}
          resizeMode="cover"
        />

        {/* Date pill — small, top left */}
        <View style={styles.datePill}>
          <Text style={styles.datePillTxt}>{formatDateShort(event.startTime)}</Text>
        </View>

        {/* Heart — top right */}
        <TouchableOpacity
          style={styles.heart}
          onPress={e => { e.stopPropagation?.(); setLiked(l => !l) }}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Text style={{ fontSize: 15, color: liked ? '#EF4444' : '#fff' }}>
            {liked ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>

        {/* Live */}
        {event.isNow && (
          <View style={[styles.livePill, { backgroundColor: colors.error }]}>
            <View style={styles.liveDot} />
            <Text style={styles.liveTxt}>LIVE</Text>
          </View>
        )}
      </View>

      {/* ── Minimal info below — NO border ──────────────── */}
      <View style={styles.info}>
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
          {event.location?.venueName || event.location?.name}
        </Text>

        {/* Price + attendees row */}
        <View style={styles.bottomRow}>
          <Text style={[
            styles.price,
            { color: event.entryFee === 0 ? colors.success : colors.primary }
          ]}>
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
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    // Shadow only — zero border
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  // Photo
  imgBox: { position: 'relative' },
  img: { width: '100%', height: 118 },

  // Date pill
  datePill: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2,
  },
  datePillTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },

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
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, gap: 3,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' },
  liveTxt: { color: '#fff', fontSize: 9, fontWeight: '800' },

  // Info — clean, no border
  info: { padding: 9 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  catDot: { width: 5, height: 5, borderRadius: 3 },
  catLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.2 },
  title: { fontSize: 13, fontWeight: '700', lineHeight: 17, marginBottom: 3 },
  venue: { fontSize: 11, marginBottom: 6 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: 13, fontWeight: '800' },
  going: { fontSize: 10 },
})
