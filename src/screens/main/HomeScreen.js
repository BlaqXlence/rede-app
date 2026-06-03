/**
 * HomeScreen.js
 *
 * City selector filters events by that city.
 * SVG location pin icon (no emoji).
 * Filter button opens sheet with categories + date + price.
 * No category row on the page — everything is in the filter sheet.
 */
import React, { useState, useMemo, useEffect } from 'react'
import {
  View, Text, ScrollView, Image,
  StyleSheet, RefreshControl, Dimensions, ActivityIndicator,
} from 'react-native'
import { SafeAreaView }   from 'react-native-safe-area-context'
import { Svg, Path, Circle } from 'react-native-svg'
import useThemeStore      from '../../store/themeStore'
import useEventsStore     from '../../store/eventsStore'
import useAuthStore      from '../../store/authStore'
import EventCard, { CARD_WIDTH_HORIZ } from '../../components/events/EventCard'
import CitySelector       from '../../components/common/CitySelector'
import FilterModal        from '../../components/common/FilterModal'
import { HOME_SECTIONS, EVENT_CATEGORIES, UGANDA_CITIES } from '../../constants/config'
import Tap from '../../components/common/Tap'
import { HomeScreenSkeleton, ListScreenSkeleton } from '../../components/common/SkeletonLoader'
import { formatDateShort, formatUGX } from '../../utils/formatters'

const { width } = Dimensions.get('window')
const MAX_W     = Math.min(width, 500)

/* ── Filter logic ───────────────────────────────────────────── */
function passes(event, city, filters) {
  // City filter — match location address
  if (city.name !== 'All Uganda') {
    const addr = (event.location?.address || event.location?.name || '').toLowerCase()
    const city2 = (event.location?.city || '').toLowerCase()
    if (!addr.includes(city.name.toLowerCase()) && !city2.includes(city.name.toLowerCase())) {
      return false
    }
  }

  if (filters.category !== 'all' && event.category !== filters.category) return false

  if (filters.when === 'Today') {
    const n = new Date(), d = new Date(event.startTime)
    if (!(d.getDate() === n.getDate() && d.getMonth() === n.getMonth())) return false
  }
  if (filters.when === 'Weekend') {
    const day = new Date(event.startTime).getDay()
    if (day !== 0 && day !== 6) return false
  }
  if (filters.when === 'This Week') {
    const diff = new Date(event.startTime) - new Date()
    if (diff < 0 || diff > 7 * 86400000) return false
  }

  if (filters.price === 'Free only' && event.entryFee > 0)  return false
  if (filters.price === 'Paid only' && event.entryFee === 0) return false

  return true
}

/* ── SVG icons ──────────────────────────────────────────────── */
function LocationIcon({ color }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
      <Circle cx="12" cy="9" r="2.5" stroke={color} strokeWidth="2"/>
    </Svg>
  )
}
function SearchIcon({ color }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2"/>
      <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  )
}
function FilterIcon({ color }) {
  // Standard funnel/filter icon used by Google Maps, Airbnb, Eventbrite etc
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M22 3H2l8 9.46V19l4 2V12.46L22 3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  )
}
function BellIcon({ color }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  )
}

/* ── Skeleton ───────────────────────────────────────────────── */
function Skeleton({ colors }) {
  return (
    <View style={[sk.card, { backgroundColor: colors.surface, width: CARD_WIDTH_HORIZ }]}>
      <View style={[sk.img, { backgroundColor: colors.shimmer }]} />
      <View style={sk.body}>
        {[0.4, 0.9, 0.6].map((w2, i) => (
          <View key={i} style={[sk.line, { backgroundColor: colors.shimmer, width: `${w2*100}%` }]} />
        ))}
      </View>
    </View>
  )
}
const sk = StyleSheet.create({
  card: { borderRadius: 14, overflow: 'hidden' },
  img:  { width: '100%', height: 160 },
  body: { padding: 10, gap: 8 },
  line: { height: 10, borderRadius: 4 },
})

/* ── Section ────────────────────────────────────────────────── */
const GUTTER  = 12
const GAP     = 8
const CARD_W  = (MAX_W - GUTTER * 2 - GAP) / 2 + 6

function GridCard({ event, onPress, colors }) {
  const { toggleLike, isLiked } = useEventsStore()
  const liked    = isLiked(event.id)
  const cat      = EVENT_CATEGORIES.find(c => c.id === event.category)
  const catColor = cat?.color || colors.primary

  return (
    <Tap onPress={() => onPress(event)} style={[gc.card, { width: CARD_W }]}>
      {/* Image */}
      <View>
        <Image source={{ uri: event.coverImage }} style={gc.img} resizeMode="cover" />
        {/* Category badge — bottom left like screenshot */}
        <View style={[gc.catBadge, { backgroundColor: colors.primary }]}>
          <Text style={gc.catBadgeTxt}>{cat?.label || ''}</Text>
        </View>
        {/* Heart — top right */}
        <Tap
          style={gc.heart}
          onPress={e => { e?.stopPropagation?.(); toggleLike(event.id) }}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Text style={[gc.heartTxt, { color: liked ? '#EF4444' : '#fff' }]}>
            {liked ? '♥' : '♡'}
          </Text>
        </Tap>
        {event.isNow && (
          <View style={[gc.live, { backgroundColor: colors.error }]}>
            <View style={gc.liveDot} />
            <Text style={gc.liveTxt}>LIVE</Text>
          </View>
        )}
      </View>
      {/* Info below image */}
      <View style={gc.body}>
        <Text style={[gc.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {event.title}
        </Text>
        {!!(event.location?.city || event.location?.area) && (
          <Text style={[gc.city, { color: colors.textHint }]} numberOfLines={1}>
            {[event.location?.area, event.location?.city].filter(Boolean).join(', ')}
          </Text>
        )}
        <View style={gc.priceRow}>
          <Text style={[gc.price, { color: event.entryFee === 0 ? colors.success : colors.textPrimary }]}>
            {formatUGX(event.entryFee)}
          </Text>
          <Text style={[gc.going, { color: colors.textHint }]}>
            {event.attendeeCount || 0} going
          </Text>
        </View>
      </View>
    </Tap>
  )
}

function Section({ title, events, onPress, onSeeAll, colors }) {
  if (!events?.length) return null

  // Pages of 4 (2x2)
  const pages = []
  for (let i = 0; i < events.length; i += 4) pages.push(events.slice(i, i + 4))

  return (
    <View style={s.section}>
      {/* Header — big bold title + ALL › */}
      <View style={s.sectionHead}>
        <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Tap onPress={onSeeAll} style={s.seeAllTap}>
          <Text style={[s.seeAll, { color: colors.textSecondary }]}>ALL  ›</Text>
        </Tap>
      </View>

      {/* Horizontal scrolling 2×2 pages */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={MAX_W}
        snapToAlignment="start"
        contentContainerStyle={{ paddingHorizontal: GUTTER }}
      >
        {pages.map((page, pi) => (
          <View key={pi} style={[gc.page, { marginRight: pi < pages.length - 1 ? GAP : 0 }]}>
            <View style={gc.row}>
              {page[0] && <GridCard event={page[0]} onPress={onPress} colors={colors} />}
              {page[1] && <GridCard event={page[1]} onPress={onPress} colors={colors} />}
              {!page[1] && <View style={{ width: CARD_W }} />}
            </View>
            {(page[2] || page[3]) && (
              <View style={[gc.row, { marginTop: GAP }]}>
                {page[2] && <GridCard event={page[2]} onPress={onPress} colors={colors} />}
                {page[3] && <GridCard event={page[3]} onPress={onPress} colors={colors} />}
                {!page[3] && page[2] && <View style={{ width: CARD_W }} />}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* "See all" wide pill — exactly like screenshot */}
      <Tap
        style={[gc.seeAllBtn, { backgroundColor: colors.surface }]}
        onPress={onSeeAll}
      >
        <Text style={[gc.seeAllTxt, { color: colors.textSecondary }]}>
          See all {events.length} events  ›
        </Text>
      </Tap>
    </View>
  )
}


/* ── Filtered list card (image left, info right) ────────────── */
function FilteredCard({ event, onPress, colors }) {
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
    <Tap
      onPress={() => onPress(event)}
      style={[fc.card, { borderBottomColor: colors.border }]}
    >
      {/* Image — left, square */}
      <View style={fc.imgWrap}>
        <Image source={{ uri: event.coverImage }} style={fc.img} resizeMode="cover" />
        {/* Category badge bottom-left */}
        <View style={[fc.catBadge, { backgroundColor: catColor }]}>
          <Text style={fc.catBadgeTxt}>{cat?.label || ''}</Text>
        </View>
        {/* Heart top-right */}
        <Tap
          style={fc.heart}
          onPress={e => { e?.stopPropagation?.(); toggleLike(event.id) }}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Text style={{ fontSize: 13, color: liked ? '#EF4444' : 'rgba(255,255,255,0.9)' }}>
            {liked ? '♥' : '♡'}
          </Text>
        </Tap>
      </View>

      {/* Info — right */}
      <View style={fc.info}>
        {/* Venue / area */}
        {!!venue && (
          <Text style={[fc.venue, { color: colors.textSecondary }]} numberOfLines={1}>
            {venue}
          </Text>
        )}
        {/* Title */}
        <Text style={[fc.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {event.title}
        </Text>
        {/* Date */}
        <Text style={[fc.date, { color: colors.primary }]}>
          {formatDateShort(event.startTime)}
        </Text>
        {/* Price + going */}
        <View style={fc.bottom}>
          <Text style={[fc.price, {
            color: event.entryFee === 0 ? colors.success : colors.textPrimary,
          }]}>
            {formatUGX(event.entryFee)}
          </Text>
          <Text style={[fc.going, { color: colors.textHint }]}>
            {event.attendeeCount || 0} going
          </Text>
        </View>
      </View>
    </Tap>
  )
}

/* ── Main ───────────────────────────────────────────────────── */
const DEFAULT_FILTERS = { category: 'all', when: 'All time', price: 'Any price' }
// Add "All Uganda" as first option
const ALL_CITIES = [{ name: 'All Uganda', lat: 1.3733, lng: 32.2903 }, ...UGANDA_CITIES]

export default function HomeScreen({ navigation }) {
  const { user }   = useAuthStore()
  const { colors }  = useThemeStore()
  const { feed, requestLocation, isLoadingEvents } = useEventsStore()

  const [refreshing,  setRefreshing]  = useState(false)
  const [cityModal,   setCityModal]   = useState(false)
  const [filterModal, setFilterModal] = useState(false)
  const [currentCity, setCurrentCity] = useState(ALL_CITIES[0])
  const [filters,     setFilters]     = useState(DEFAULT_FILTERS)
  const [filteredPage, setFilteredPage] = useState(1)

  const hasFilter = filters.category !== 'all' || filters.when !== 'All time' || filters.price !== 'Any price'

  // userInterests comes from useAuthStore hook at top of component
  const userInterests = user?.interests || []

  // Auto-refresh every 60 seconds while app is open
  // New events appear without user doing anything
  useEffect(() => {
    const interval = setInterval(() => {
      requestLocation()
    }, 60000)
    return () => clearInterval(interval)
  }, [])
  const hasAnyFilter = hasFilter || currentCity.name !== 'All Uganda'
  const PAGE_SIZE = 15

  async function refresh() {
    setRefreshing(true)
    await requestLocation()
    setRefreshing(false)
  }

  function openEvent(e)            { navigation.navigate('EventDetail', { eventId: e.id, event: e }) }
  function openCategory(id, title) { navigation.navigate('CategoryEvents', { categoryId: id, title }) }

  const allEvents = feed.all || []

  // Apply city + filters
  const filtered = useMemo(() => {
    return allEvents.filter(e => passes(e, currentCity, filters))
  }, [allEvents, currentCity, filters])

  const showFiltered = hasAnyFilter

  // For category sections — also apply city filter
  function sectionEvents(categoryId) {
    const base = feed.byCategory?.[categoryId] || []
    if (currentCity.name === 'All Uganda') return base
    return base.filter(e => passes(e, currentCity, DEFAULT_FILTERS))
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.phone, { maxWidth: MAX_W }]}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>

          {/* ── Header ─────────────────────────────────── */}
          <View style={s.header}>
            {/* City — SVG location icon, tapping opens city selector */}
            <Tap style={s.cityBtn} onPress={() => setCityModal(true)}>
              <LocationIcon color={colors.primary} />
              <Text style={[s.cityName, { color: colors.textPrimary }]}>{currentCity.name}</Text>
              <Text style={[s.cityChev, { color: colors.textHint }]}>▾</Text>
            </Tap>

            <View style={s.iconRow}>
              <Tap style={[s.iconBtn, { backgroundColor: colors.surface }]} onPress={() => navigation.navigate('Search')}>
                <SearchIcon color={colors.textSecondary} />
              </Tap>
              <Tap
                style={[s.iconBtn, { backgroundColor: hasAnyFilter ? colors.primary : colors.surface }]}
                onPress={() => setFilterModal(true)}
              >
                <FilterIcon color={hasAnyFilter ? '#fff' : colors.textSecondary} />
              </Tap>
              <Tap style={[s.iconBtn, { backgroundColor: colors.surface }]} onPress={() => {}}>
                <BellIcon color={colors.textSecondary} />
              </Tap>
            </View>
          </View>

          {/* Active filter pills */}
          {hasAnyFilter && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pills}>
              {currentCity.name !== 'All Uganda' && (
                <View style={[s.pill, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
                  <Text style={[s.pillTxt, { color: colors.primary }]}>{currentCity.name}</Text>
                </View>
              )}
              {filters.category !== 'all' && (
                <View style={[s.pill, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
                  <Text style={[s.pillTxt, { color: colors.primary }]}>
                    {EVENT_CATEGORIES.find(c => c.id === filters.category)?.label}
                  </Text>
                </View>
              )}
              {filters.when !== 'All time' && (
                <View style={[s.pill, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
                  <Text style={[s.pillTxt, { color: colors.primary }]}>{filters.when}</Text>
                </View>
              )}
              {filters.price !== 'Any price' && (
                <View style={[s.pill, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
                  <Text style={[s.pillTxt, { color: colors.primary }]}>{filters.price}</Text>
                </View>
              )}
              <Tap
                style={[s.pill, { backgroundColor: colors.error + '15', borderColor: colors.error }]}
                onPress={() => { setFilters(DEFAULT_FILTERS); setCurrentCity(ALL_CITIES[0]); setFilteredPage(1) }}
              >
                <Text style={[s.pillTxt, { color: colors.error }]}>✕ Clear</Text>
              </Tap>
            </ScrollView>
          )}

          {/* ── Feed ────────────────────────────────────── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
            contentContainerStyle={s.feed}
          >
            {showFiltered ? (() => {
              const visibleFiltered = filtered.slice(0, filteredPage * PAGE_SIZE)
              const hasMoreFiltered = visibleFiltered.length < filtered.length
              const remaining = filtered.length - visibleFiltered.length
              return (
                <View>
                  <View style={[s.filteredHeader, { borderBottomColor: colors.border }]}>
                    <Text style={[s.filteredCount, { color: colors.textPrimary }]}>
                      {filtered.length} {filtered.length === 1 ? 'event' : 'events'} found
                    </Text>
                  </View>
                  {filtered.length > 0 ? (
                    <>
                      {visibleFiltered.map(e => (
                        <FilteredCard key={e.id} event={e} onPress={openEvent} colors={colors} />
                      ))}
                      {hasMoreFiltered && (
                        <Tap
                          style={[s.showMoreBtn, { borderColor: colors.border }]}
                          onPress={() => setFilteredPage(p => p + 1)}
                        >
                          <Text style={[s.showMoreTxt, { color: colors.primary }]}>
                            Show {Math.min(PAGE_SIZE, remaining)} more
                          </Text>
                        </Tap>
                      )}
                      {!hasMoreFiltered && filtered.length > PAGE_SIZE && (
                        <Text style={[s.allShownTxt, { color: colors.textHint }]}>
                          All {filtered.length} events shown
                        </Text>
                      )}
                    </>
                  ) : (
                    {isLoadingEvents ? (
                      <ListScreenSkeleton count={6} />
                    ) : (
                      <View style={s.emptyFilter}>
                        <Text style={[s.emptyTxt, { color: colors.textHint }]}>No events match your filter</Text>
                        <Text style={[s.emptyHint, { color: colors.textHint }]}>Try adjusting your filters</Text>
                      </View>
                    )}
                  )}
                </View>
              )
            })() : (
              <>
                {/* Happening now */}
                {(feed.happeningNow?.length > 0) && (
                  <View style={s.section}>
                    <View style={s.sectionHead}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                        <View style={[s.liveDot, { backgroundColor: colors.error }]} />
                        <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Happening Now</Text>
                      </View>
                      <Tap onPress={() => openCategory('all', 'Happening Now')}>
                        <Text style={[s.seeAll, { color: colors.textSecondary }]}>All ›</Text>
                      </Tap>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingRight: 16 }}>
                        {feed.happeningNow.map(item => (
                          <EventCard key={item.id} event={item} onPress={openEvent} horizontal style={{ marginRight: 12 }} />
                        ))}
                      </ScrollView>
                  </View>
                )}

                {[...HOME_SECTIONS.filter(sc => sc.categoryId !== null)]
                  .sort((a, b) => {
                    const aMatch = userInterests.includes(a.categoryId) ? -1 : 0
                    const bMatch = userInterests.includes(b.categoryId) ? -1 : 0
                    return aMatch - bMatch
                  })
                  .map(sc => (
                  <Section
                    key={sc.id}
                    title={sc.title}
                    events={sectionEvents(sc.categoryId)}
                    onPress={openEvent}
                    onSeeAll={() => openCategory(sc.categoryId, sc.title)}
                    colors={colors}
                  />
                ))}

                {allEvents.length === 0 && (
                  <View style={s.empty}>
                    <Text style={{ fontSize: 52 }}>🎭</Text>
                    <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>No events yet</Text>
                    <Text style={[s.emptyTxt, { color: colors.textHint }]}>Be the first to create one!</Text>
                  </View>
                )}
              </>
            )}
            <View style={{ height: 90 }} />
          </ScrollView>

          {/* Modals */}
          <CitySelector
            visible={cityModal}
            currentCity={currentCity}
            onSelect={city => { setCurrentCity(city); setFilteredPage(1) }}
            onClose={() => setCityModal(false)}
            cities={ALL_CITIES}
          />
          <FilterModal
            visible={filterModal}
            onClose={() => setFilterModal(false)}
            filters={filters}
            onApply={f => { setFilters(f); setFilteredPage(1) }}
          />
        </SafeAreaView>
      </View>
    </View>
  )
}
const fc = StyleSheet.create({
  card:      { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  imgWrap:   { position: 'relative' },
  img:       { width: 96, height: 96, borderRadius: 12 },
  catBadge:  { position: 'absolute', bottom: 6, left: 6, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  catBadgeTxt:{ color: '#fff', fontSize: 9, fontWeight: '800' },
  heart:     { position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  info:      { flex: 1, justifyContent: 'space-between' },
  venue:     { fontSize: 11, marginBottom: 2 },
  title:     { fontSize: 14, fontWeight: '800', lineHeight: 19, marginBottom: 3 },
  date:      { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  bottom:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price:     { fontSize: 15, fontWeight: '900' },
  going:     { fontSize: 11 },
})


const gc = StyleSheet.create({
  page:       { flexDirection: 'column' },
  row:        { flexDirection: 'row', gap: GAP },
  card:       { backgroundColor: 'transparent' },
  img:        { width: CARD_W, height: CARD_W * 0.70, borderRadius: 12 },
  catBadge:   { position: 'absolute', bottom: 8, left: 8, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  catBadgeTxt:{ color: '#fff', fontSize: 11, fontWeight: '800' },
  heart:      { position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  heartTxt:   { fontSize: 15 },
  live:       { position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2, gap: 3 },
  liveDot:    { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff' },
  liveTxt:    { color: '#fff', fontSize: 8, fontWeight: '800' },
  body:       { paddingTop: 8, paddingHorizontal: 2 },
  title:      { fontSize: 13, fontWeight: '700', lineHeight: 17, marginBottom: 3 },
  city:       { fontSize: 10, marginBottom: 4 },
  priceRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price:      { fontSize: 15, fontWeight: '900' },
  going:      { fontSize: 11 },
  seeAllBtn:  { marginHorizontal: GUTTER, marginTop: 14, borderRadius: 14, paddingVertical: 14, alignItems: 'center', overflow: 'hidden' },
  seeAllTxt:  { fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
})



const s = StyleSheet.create({
  root:  { flex: 1, alignItems: 'center' },
  phone: { flex: 1, width: '100%' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
  },
  cityBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cityName: { fontSize: 17, fontWeight: '800' },
  cityChev: { fontSize: 11 },
  iconRow:  { flexDirection: 'row', gap: 8 },
  iconBtn:  { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  pills:    { paddingHorizontal: 16, paddingBottom: 8, gap: 6 },
  pill:     { borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 11, paddingVertical: 5 },
  pillTxt:  { fontSize: 12, fontWeight: '700' },
  feed:     { paddingBottom: 20 },
  section:  { paddingLeft: 16, marginTop: 14 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingRight: 16 },
  sectionTitle:{ fontSize: 17, fontWeight: '800' },
  seeAll:   { fontSize: 14, fontWeight: '600' },
  liveDot:  { width: 8, height: 8, borderRadius: 4 },
  grid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingRight: 16 },
  emptyFilter:   { alignItems: 'center', paddingVertical: 48, gap: 8 },
  filteredHeader:{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  filteredCount: { fontSize: 15, fontWeight: '700' },
  emptyHint:     { fontSize: 13 },
  showMoreBtn:   { alignSelf: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 28, paddingVertical: 10, marginVertical: 16, overflow: 'hidden' },
  showMoreTxt:   { fontSize: 13, fontWeight: '700' },
  allShownTxt:   { textAlign: 'center', fontSize: 12, paddingVertical: 16 },
  empty:    { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptyTxt:   { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
})
