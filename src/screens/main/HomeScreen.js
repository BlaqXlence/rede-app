/**
 * HomeScreen.js
 *
 * Clean header: City — Search, Filter, Bell (all in one row)
 * NO category row on the home page.
 * Categories live inside the filter sheet now.
 *
 * Filter button turns orange when any filter is active.
 */
import React, { useState } from 'react'
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, Dimensions, ActivityIndicator,
} from 'react-native'
import { SafeAreaView }  from 'react-native-safe-area-context'
import { Svg, Path, Circle, Line } from 'react-native-svg'
import useThemeStore     from '../../store/themeStore'
import useEventsStore    from '../../store/eventsStore'
import EventCard, { CARD_WIDTH_HORIZ } from '../../components/events/EventCard'
import CitySelector      from '../../components/common/CitySelector'
import FilterModal       from '../../components/common/FilterModal'
import { HOME_SECTIONS, EVENT_CATEGORIES, UGANDA_CITIES } from '../../constants/config'

const { width } = Dimensions.get('window')
const MAX_W     = Math.min(width, 500)

/* ── Filter helpers ─────────────────────────────────────────── */
function passesFilter(event, filters) {
  const { category, when, price } = filters

  if (category && category !== 'all' && event.category !== category) return false

  if (when === 'Today') {
    const n = new Date(), d = new Date(event.startTime)
    if (!(d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear())) return false
  }
  if (when === 'Weekend') {
    const day = new Date(event.startTime).getDay()
    if (day !== 0 && day !== 6) return false
  }
  if (when === 'This Week') {
    const diff = new Date(event.startTime) - new Date()
    if (diff < 0 || diff > 7 * 86400000) return false
  }

  if (price === 'Free only' && event.entryFee > 0)  return false
  if (price === 'Paid only' && event.entryFee === 0) return false

  return true
}

/* ── Header icons ───────────────────────────────────────────── */
function SearchIcon({ color }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2"/>
      <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  )
}
function FilterIcon({ color }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Line x1="4"  y1="6"  x2="20" y2="6"  stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <Line x1="7"  y1="12" x2="17" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <Line x1="10" y1="18" x2="14" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
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

/* ── Skeleton card ──────────────────────────────────────────── */
function SkeletonCard({ colors }) {
  return (
    <View style={[skStyles.card, { backgroundColor: colors.surface, width: CARD_WIDTH_HORIZ }]}>
      <View style={[skStyles.img, { backgroundColor: colors.shimmer }]} />
      <View style={skStyles.body}>
        {[0.4, 0.9, 0.6].map((w, i) => (
          <View key={i} style={[skStyles.line, { backgroundColor: colors.shimmer, width: `${w * 100}%` }]} />
        ))}
      </View>
    </View>
  )
}
const skStyles = StyleSheet.create({
  card: { borderRadius: 14, overflow: 'hidden' },
  img:  { width: '100%', height: 160 },
  body: { padding: 10, gap: 8 },
  line: { height: 10, borderRadius: 4 },
})

/* ── Section row ────────────────────────────────────────────── */
function Section({ title, events, isLoading, onPress, onSeeAll, colors }) {
  if (!isLoading && !events?.length) return null
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={[styles.seeAll, { color: colors.textSecondary }]}>All ›</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingRight: 16 }}>
          <SkeletonCard colors={colors} />
          <SkeletonCard colors={colors} />
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

export default function HomeScreen({ navigation }) {
  const { colors }     = useThemeStore()
  const { feed, requestLocation, isLoadingEvents } = useEventsStore()

  const [refreshing,   setRefreshing]   = useState(false)
  const [cityModal,    setCityModal]    = useState(false)
  const [filterModal,  setFilterModal]  = useState(false)
  const [currentCity,  setCurrentCity]  = useState(UGANDA_CITIES[0])
  const [filters,      setFilters]      = useState(DEFAULT_FILTERS)

  const hasFilter = filters.category !== 'all' || filters.when !== 'All time' || filters.price !== 'Any price'

  async function handleRefresh() {
    setRefreshing(true)
    await requestLocation()
    setRefreshing(false)
  }

  function openEvent(e)            { navigation.navigate('EventDetail', { eventId: e.id, event: e }) }
  function openCategory(id, title) { navigation.navigate('CategoryEvents', { categoryId: id, title }) }

  const allEvents = feed.all || []

  // Apply filters
  const filtered = hasFilter ? allEvents.filter(e => passesFilter(e, filters)) : null

  // Active category label for filtered heading
  const activeCatLabel = filters.category !== 'all'
    ? EVENT_CATEGORIES.find(c => c.id === filters.category)?.label
    : null

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.phone, { maxWidth: MAX_W }]}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>

          {/* ── Single clean header row ─────────────────── */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.cityBtn} onPress={() => setCityModal(true)} activeOpacity={0.7}>
              <Text style={styles.cityPin}>📍</Text>
              <Text style={[styles.cityName, { color: colors.textPrimary }]}>{currentCity.name}</Text>
              <Text style={[styles.cityChev, { color: colors.textHint }]}>▾</Text>
            </TouchableOpacity>

            <View style={styles.iconRow}>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: colors.surface }]}
                onPress={() => navigation.navigate('Search')}
              >
                <SearchIcon color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Filter — orange when active */}
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: hasFilter ? colors.primary : colors.surface }]}
                onPress={() => setFilterModal(true)}
              >
                <FilterIcon color={hasFilter ? '#fff' : colors.textSecondary} />
                {hasFilter && <View style={[styles.filterDot, { backgroundColor: '#fff' }]} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: colors.surface }]}
                onPress={() => {}}
              >
                <BellIcon color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Active filter pill — shows what's active, tap to clear */}
          {hasFilter && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activePills}>
              {filters.category !== 'all' && (
                <View style={[styles.activePill, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
                  <Text style={[styles.activePillTxt, { color: colors.primary }]}>
                    {activeCatLabel}
                  </Text>
                </View>
              )}
              {filters.when !== 'All time' && (
                <View style={[styles.activePill, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
                  <Text style={[styles.activePillTxt, { color: colors.primary }]}>{filters.when}</Text>
                </View>
              )}
              {filters.price !== 'Any price' && (
                <View style={[styles.activePill, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
                  <Text style={[styles.activePillTxt, { color: colors.primary }]}>{filters.price}</Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.activePill, { backgroundColor: colors.error + '22', borderColor: colors.error }]}
                onPress={() => setFilters(DEFAULT_FILTERS)}
              >
                <Text style={[styles.activePillTxt, { color: colors.error }]}>✕ Clear</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* ── Feed ──────────────────────────────────── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
            contentContainerStyle={styles.feed}
          >
            {hasFilter ? (
              // Filtered grid view
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 14 }]}>
                  {activeCatLabel || 'Events'}
                  {filtered.length > 0 ? ` (${filtered.length})` : ''}
                </Text>
                {isLoadingEvents ? (
                  <ActivityIndicator size="large" color={colors.primary} />
                ) : filtered.length > 0 ? (
                  <View style={styles.grid}>
                    {filtered.map(e => (
                      <EventCard key={e.id} event={e} onPress={openEvent} style={{ marginBottom: 12 }} />
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyFilter}>
                    <Text style={{ fontSize: 40 }}>🔍</Text>
                    <Text style={[styles.emptyTxt, { color: colors.textHint }]}>
                      No events match your filters
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <>
                {/* Happening Now */}
                {(isLoadingEvents || feed.happeningNow?.length > 0) && (
                  <View style={styles.section}>
                    <View style={styles.sectionHead}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                        <View style={[styles.liveDot, { backgroundColor: colors.error }]} />
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                          Happening Now
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => openCategory('all', 'Happening Now')}>
                        <Text style={[styles.seeAll, { color: colors.textSecondary }]}>All ›</Text>
                      </TouchableOpacity>
                    </View>
                    {isLoadingEvents ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 12, paddingRight: 16 }}>
                        <SkeletonCard colors={colors} />
                        <SkeletonCard colors={colors} />
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

                {HOME_SECTIONS.filter(s => s.categoryId !== null).map(s => (
                  <Section
                    key={s.id}
                    title={s.title}
                    events={feed.byCategory?.[s.categoryId]}
                    isLoading={isLoadingEvents}
                    onPress={openEvent}
                    onSeeAll={() => openCategory(s.categoryId, s.title)}
                    colors={colors}
                  />
                ))}

                {!isLoadingEvents && allEvents.length === 0 && (
                  <View style={styles.empty}>
                    <Text style={{ fontSize: 52 }}>🎭</Text>
                    <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No events yet</Text>
                    <Text style={[styles.emptyTxt, { color: colors.textHint }]}>
                      Be the first to create one!
                    </Text>
                  </View>
                )}
              </>
            )}

            <View style={{ height: 90 }} />
          </ScrollView>

          {/* Modals */}
          <CitySelector visible={cityModal} currentCity={currentCity}
            onSelect={city => setCurrentCity(city)} onClose={() => setCityModal(false)} />

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

const styles = StyleSheet.create({
  root:  { flex: 1, alignItems: 'center' },
  phone: { flex: 1, width: '100%' },

  // Header — one row only
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
  },
  cityBtn:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cityPin:  { fontSize: 14 },
  cityName: { fontSize: 18, fontWeight: '900' },
  cityChev: { fontSize: 11, marginLeft: 1 },

  iconRow:   { flexDirection: 'row', gap: 8 },
  iconBtn:   { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  filterDot: { position: 'absolute', top: 7, right: 7, width: 6, height: 6, borderRadius: 3 },

  // Active filter pills
  activePills: { paddingHorizontal: 16, paddingBottom: 8, gap: 6 },
  activePill:  { borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 11, paddingVertical: 5 },
  activePillTxt: { fontSize: 12, fontWeight: '700' },

  // Feed
  feed: { paddingBottom: 20 },
  section: { paddingLeft: 16, marginTop: 14 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingRight: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  seeAll:       { fontSize: 14, fontWeight: '600' },
  liveDot:      { width: 8, height: 8, borderRadius: 4 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingRight: 16 },

  emptyFilter: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptyTxt: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
})
