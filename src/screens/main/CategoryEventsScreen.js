import React, { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  Image, Pressable, Dimensions,
} from 'react-native'
import { SafeAreaView }  from 'react-native-safe-area-context'
import BackButton from '../../components/common/BackButton'
import { ListScreenSkeleton } from '../../components/common/SkeletonLoader'
import useThemeStore     from '../../store/themeStore'
import useEventsStore    from '../../store/eventsStore'
import { formatDateShort, formatUGX } from '../../utils/formatters'
import { EVENT_CATEGORIES } from '../../constants/config'

const { width } = Dimensions.get('window')
const MAX_W     = Math.min(width, 500)
const PAGE      = 15

function ListCard({ event, onPress, colors }) {
  const { toggleLike, isLiked } = useEventsStore()
  const liked    = isLiked(event.id)
  const cat      = EVENT_CATEGORIES.find(c => c.id === event.category)
  const catColor = cat?.color || colors.primary
  const venue    = [
    event.location?.venueName || event.location?.name,
    event.location?.area,
    event.location?.city,
  ].filter(Boolean).join(', ')

  return (
    <Pressable
      onPress={() => onPress(event)}
      android_ripple={{ color: colors.primary + '12' }}
      style={[lc.card, { borderBottomColor: colors.border }]}
    >
      {/* Image left */}
      <View style={lc.imgWrap}>
        <Image
          source={{ uri: event.coverImage }}
          style={lc.img}
          resizeMode="cover"
        />
        {/* Heart */}
        <Pressable
          onPress={e => { e.stopPropagation?.(); toggleLike(event.id) }}
          style={lc.heart}
          android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: true }}
          hitSlop={8}
        >
          <Text style={{ fontSize: 14, color: liked ? '#EF4444' : 'rgba(255,255,255,0.85)' }}>
            {liked ? '♥' : '♡'}
          </Text>
        </Pressable>
        {event.isNow && (
          <View style={[lc.live, { backgroundColor: colors.error }]}>
            <View style={lc.liveDot} />
            <Text style={lc.liveTxt}>LIVE</Text>
          </View>
        )}
      </View>

      {/* Info right */}
      <View style={lc.info}>
        {/* Category + area */}
        <View style={lc.topRow}>
          {cat && (
            <View style={[lc.catPill, { backgroundColor: catColor + '20' }]}>
              <Text style={[lc.catTxt, { color: catColor }]}>{cat.label.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={[lc.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {event.title}
        </Text>

        {/* Venue */}
        {!!venue && (
          <Text style={[lc.venue, { color: colors.textSecondary }]} numberOfLines={1}>
            {venue}
          </Text>
        )}

        {/* Date */}
        <Text style={[lc.date, { color: colors.primary }]}>
          {formatDateShort(event.startTime)}
        </Text>

        {/* Price + going */}
        <View style={lc.bottom}>
          <Text style={[lc.price, {
            color: event.entryFee === 0 ? colors.success : colors.textPrimary,
          }]}>
            {formatUGX(event.entryFee)}
          </Text>
          <Text style={[lc.going, { color: colors.textHint }]}>
            {event.attendeeCount || 0} going
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

export default function CategoryEventsScreen({ navigation, route }) {
  const { categoryId, title } = route.params
  const { colors }            = useThemeStore()
  const { feed, isLoadingEvents } = useEventsStore()
  const [page, setPage]       = useState(1)

  const allEvents = categoryId === 'all'
    ? (feed.all || [])
    : (feed.byCategory?.[categoryId] || [])

  const visible = allEvents.slice(0, page * PAGE)
  const hasMore = visible.length < allEvents.length
  const remaining = allEvents.length - visible.length

  function openEvent(e) {
    navigation.navigate('EventDetail', { eventId: e.id, event: e })
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>

      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={s.backBtn}
          android_ripple={{ color: colors.border, borderless: true }}
          hitSlop={10}
        >
          <Text style={[s.backTxt, { color: colors.primary }]}>←</Text>
        </Pressable>
        <Text style={[s.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={[s.countBadge, { backgroundColor: colors.primary }]}>
          <Text style={s.countTxt}>{allEvents.length}</Text>
        </View>
      </View>

      {allEvents.length === 0 ? (
        isLoadingEvents ? (
          <ListScreenSkeleton count={8} />
        ) : (
          <View style={s.empty}>
            <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>No events yet</Text>
            <Text style={[s.emptySub,   { color: colors.textHint }]}>
              Check back soon or try another category
            </Text>
          </View>
        )
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View style={[s.list, { maxWidth: MAX_W, alignSelf: 'center', width: '100%' }]}>
            {visible.map(e => (
              <ListCard key={e.id} event={e} onPress={openEvent} colors={colors} />
            ))}
          </View>

          {/* Show more — small pill button */}
          {hasMore && (
            <Pressable
              style={[s.moreBtn, { borderColor: colors.border }]}
              onPress={() => setPage(p => p + 1)}
              android_ripple={{ color: colors.primary + '18' }}
            >
              <Text style={[s.moreTxt, { color: colors.primary }]}>
                Show {Math.min(PAGE, remaining)} more  ↓
              </Text>
            </Pressable>
          )}

          {!hasMore && allEvents.length > PAGE && (
            <Text style={[s.endTxt, { color: colors.textHint }]}>
              All {allEvents.length} events shown
            </Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

// ── List card styles ──────────────────────────────────────────────
const IMG_W = 110
const lc = StyleSheet.create({
  card:    { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  imgWrap: { position: 'relative' },
  img:     { width: IMG_W, height: 110, borderRadius: 12 },
  heart:   { position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  live:    { position: 'absolute', bottom: 6, left: 6, flexDirection: 'row', alignItems: 'center', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2, gap: 3 },
  liveDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff' },
  liveTxt: { color: '#fff', fontSize: 8, fontWeight: '800' },
  info:    { flex: 1, justifyContent: 'space-between' },
  topRow:  { flexDirection: 'row', gap: 6, marginBottom: 4 },
  catPill: { borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  catTxt:  { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  title:   { fontSize: 14, fontWeight: '800', lineHeight: 19, marginBottom: 3 },
  venue:   { fontSize: 11, marginBottom: 2 },
  date:    { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  bottom:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price:   { fontSize: 14, fontWeight: '900' },
  going:   { fontSize: 11 },
})

// ── Screen styles ─────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },

  title:      { flex: 1, fontSize: 17, fontWeight: '800' },
  countBadge: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 },
  countTxt:   { fontSize: 12, fontWeight: '700', color: '#fff' },
  list:       {},
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptySub:   { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  moreBtn:    { alignSelf: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 24, paddingVertical: 9, marginVertical: 16, overflow: 'hidden' },
  moreTxt:    { fontSize: 13, fontWeight: '700' },
  endTxt:     { textAlign: 'center', fontSize: 12, paddingVertical: 16 },
})
