/**
 * HomeScreen.js
 *
 * City selector filters events by that city.
 * SVG location pin icon (no emoji).
 * Filter button opens sheet with categories + date + price.
 * No category row on the page — everything is in the filter sheet.
 */
import React, { useState, useMemo } from 'react'
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, Dimensions, ActivityIndicator,
} from 'react-native'
import { SafeAreaView }   from 'react-native-safe-area-context'
import { Svg, Path, Circle } from 'react-native-svg'
import useThemeStore      from '../../store/themeStore'
import useEventsStore     from '../../store/eventsStore'
import EventCard, { CARD_WIDTH_HORIZ } from '../../components/events/EventCard'
import CitySelector       from '../../components/common/CitySelector'
import FilterModal        from '../../components/common/FilterModal'
import { HOME_SECTIONS, EVENT_CATEGORIES, UGANDA_CITIES } from '../../constants/config'

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
function Section({ title, events, loading, onPress, onSeeAll, colors }) {
  if (!loading && !events?.length) return null
  return (
    <View style={s.section}>
      <View style={s.sectionHead}>
        <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={[s.seeAll, { color: colors.textSecondary }]}>All ›</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 16 }}>
          <Skeleton colors={colors} /><Skeleton colors={colors} />
        </ScrollView>
      ) : (
        <FlatList
          data={events}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={e => e.id}
          contentContainerStyle={{ paddingRight: 16 }}
          snapToInterval={CARD_WIDTH_HORIZ + 12}
          decelerationRate="fast"
          renderItem={({ item }) => (
            <EventCard event={item} onPress={onPress} horizontal style={{ marginRight: 12 }} />
          )}
        />
      )}
    </View>
  )
}

/* ── Main ───────────────────────────────────────────────────── */
const DEFAULT_FILTERS = { category: 'all', when: 'All time', price: 'Any price' }
// Add "All Uganda" as first option
const ALL_CITIES = [{ name: 'All Uganda', lat: 1.3733, lng: 32.2903 }, ...UGANDA_CITIES]

export default function HomeScreen({ navigation }) {
  const { colors }  = useThemeStore()
  const { feed, requestLocation, isLoadingEvents } = useEventsStore()

  const [refreshing,  setRefreshing]  = useState(false)
  const [cityModal,   setCityModal]   = useState(false)
  const [filterModal, setFilterModal] = useState(false)
  const [currentCity, setCurrentCity] = useState(ALL_CITIES[0])
  const [filters,     setFilters]     = useState(DEFAULT_FILTERS)

  const hasFilter = filters.category !== 'all' || filters.when !== 'All time' || filters.price !== 'Any price'
  const hasAnyFilter = hasFilter || currentCity.name !== 'All Uganda'

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
            <TouchableOpacity style={s.cityBtn} onPress={() => setCityModal(true)} activeOpacity={0.7}>
              <LocationIcon color={colors.primary} />
              <Text style={[s.cityName, { color: colors.textPrimary }]}>{currentCity.name}</Text>
              <Text style={[s.cityChev, { color: colors.textHint }]}>▾</Text>
            </TouchableOpacity>

            <View style={s.iconRow}>
              <TouchableOpacity style={[s.iconBtn, { backgroundColor: colors.surface }]} onPress={() => navigation.navigate('Search')}>
                <SearchIcon color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.iconBtn, { backgroundColor: hasAnyFilter ? colors.primary : colors.surface }]}
                onPress={() => setFilterModal(true)}
              >
                <FilterIcon color={hasAnyFilter ? '#fff' : colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={[s.iconBtn, { backgroundColor: colors.surface }]} onPress={() => {}}>
                <BellIcon color={colors.textSecondary} />
              </TouchableOpacity>
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
              <TouchableOpacity
                style={[s.pill, { backgroundColor: colors.error + '15', borderColor: colors.error }]}
                onPress={() => { setFilters(DEFAULT_FILTERS); setCurrentCity(ALL_CITIES[0]) }}
              >
                <Text style={[s.pillTxt, { color: colors.error }]}>✕ Clear</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* ── Feed ────────────────────────────────────── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
            contentContainerStyle={s.feed}
          >
            {showFiltered ? (
              // Filtered grid
              <View style={s.section}>
                <Text style={[s.sectionTitle, { color: colors.textPrimary, marginBottom: 14 }]}>
                  {filtered.length} {filtered.length === 1 ? 'event' : 'events'} found
                </Text>
                {isLoadingEvents ? (
                  <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
                ) : filtered.length > 0 ? (
                  <View style={s.grid}>
                    {filtered.map(e => (
                      <EventCard key={e.id} event={e} onPress={openEvent} style={{ marginBottom: 12 }} />
                    ))}
                  </View>
                ) : (
                  <View style={s.emptyFilter}>
                    <Text style={{ fontSize: 40 }}>🔍</Text>
                    <Text style={[s.emptyTxt, { color: colors.textHint }]}>No events match</Text>
                  </View>
                )}
              </View>
            ) : (
              <>
                {/* Happening now */}
                {(isLoadingEvents || (feed.happeningNow?.length > 0)) && (
                  <View style={s.section}>
                    <View style={s.sectionHead}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                        <View style={[s.liveDot, { backgroundColor: colors.error }]} />
                        <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Happening Now</Text>
                      </View>
                      <TouchableOpacity onPress={() => openCategory('all', 'Happening Now')}>
                        <Text style={[s.seeAll, { color: colors.textSecondary }]}>All ›</Text>
                      </TouchableOpacity>
                    </View>
                    {isLoadingEvents ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 16 }}>
                        <Skeleton colors={colors} /><Skeleton colors={colors} />
                      </ScrollView>
                    ) : (
                      <FlatList
                        data={feed.happeningNow}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={e => e.id}
                        contentContainerStyle={{ paddingRight: 16 }}
                        snapToInterval={CARD_WIDTH_HORIZ + 12}
                        decelerationRate="fast"
                        renderItem={({ item }) => (
                          <EventCard event={item} onPress={openEvent} horizontal style={{ marginRight: 12 }} />
                        )}
                      />
                    )}
                  </View>
                )}

                {HOME_SECTIONS.filter(sc => sc.categoryId !== null).map(sc => (
                  <Section
                    key={sc.id}
                    title={sc.title}
                    events={sectionEvents(sc.categoryId)}
                    loading={isLoadingEvents}
                    onPress={openEvent}
                    onSeeAll={() => openCategory(sc.categoryId, sc.title)}
                    colors={colors}
                  />
                ))}

                {!isLoadingEvents && allEvents.length === 0 && (
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
            onSelect={city => setCurrentCity(city)}
            onClose={() => setCityModal(false)}
            cities={ALL_CITIES}
          />
          <FilterModal
            visible={filterModal}
            onClose={() => setFilterModal(false)}
            filters={filters}
            onApply={setFilters}
          />
        </SafeAreaView>
      </View>
    </View>
  )
}

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
  emptyFilter: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  empty:    { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptyTxt:   { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
})
