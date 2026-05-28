/**
 * HomeScreen.js
 *
 * Header: City left, icons right — all in ONE compact row.
 * Categories directly below the header — no gap, no separate row feeling.
 * Filter button opens bottom sheet.
 * Cards load from DB only — skeleton shown while loading.
 */
import React, { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, FlatList,
  TouchableOpacity, StyleSheet, RefreshControl,
  Dimensions, ActivityIndicator,
} from 'react-native'
import { SafeAreaView }   from 'react-native-safe-area-context'
import { Svg, Path, Circle, Line } from 'react-native-svg'
import useThemeStore      from '../../store/themeStore'
import useEventsStore     from '../../store/eventsStore'
import EventCard, { CARD_WIDTH_HORIZ } from '../../components/events/EventCard'
import CategoryFilter     from '../../components/events/CategoryFilter'
import CitySelector       from '../../components/common/CitySelector'
import FilterModal        from '../../components/common/FilterModal'
import { HOME_SECTIONS, EVENT_CATEGORIES, UGANDA_CITIES } from '../../constants/config'

const { width } = Dimensions.get('window')
const MAX_W     = Math.min(width, 500)

/* ── Filter helpers ─────────────────────────────────────────── */
function isToday(d) {
  const n = new Date(), t = new Date(d)
  return t.getDate() === n.getDate() && t.getMonth() === n.getMonth() && t.getFullYear() === n.getFullYear()
}
function isWeekend(d) { const day = new Date(d).getDay(); return day === 0 || day === 6 }
function isThisWeek(d) { const diff = new Date(d) - new Date(); return diff >= 0 && diff <= 7 * 86400000 }

function applyFilters(events, dateFilter, priceFilter) {
  return events.filter(e => {
    if (dateFilter === 'Today'     && !isToday(e.startTime))    return false
    if (dateFilter === 'Weekend'   && !isWeekend(e.startTime))  return false
    if (dateFilter === 'This Week' && !isThisWeek(e.startTime)) return false
    if (priceFilter === 'Free'     && e.entryFee > 0)           return false
    if (priceFilter === 'Paid'     && e.entryFee === 0)         return false
    return true
  })
}

/* ── SVG icons ──────────────────────────────────────────────── */
function SearchIcon({ color }) {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2"/>
      <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  )
}
function FilterIcon({ color }) {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Line x1="4"  y1="6"  x2="20" y2="6"  stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <Line x1="7"  y1="12" x2="17" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <Line x1="10" y1="18" x2="14" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  )
}
function BellIcon({ color }) {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  )
}

/* ── Skeleton card while loading ────────────────────────────── */
function SkeletonCard({ colors }) {
  return (
    <View style={[styles.skeleton, { backgroundColor: colors.surface, width: CARD_WIDTH_HORIZ }]}>
      <View style={[styles.skeletonImg, { backgroundColor: colors.shimmer }]} />
      <View style={styles.skeletonInfo}>
        <View style={[styles.skeletonLine, { backgroundColor: colors.shimmer, width: '40%', height: 8 }]} />
        <View style={[styles.skeletonLine, { backgroundColor: colors.shimmer, width: '90%', height: 14 }]} />
        <View style={[styles.skeletonLine, { backgroundColor: colors.shimmer, width: '60%', height: 10 }]} />
      </View>
    </View>
  )
}

/* ── Section row ────────────────────────────────────────────── */
function SectionRow({ title, events, onPress, onSeeAll, isLoading, colors }) {
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 16 }}>
          {[1,2].map(i => <SkeletonCard key={i} colors={colors} />)}
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

/* ── Main screen ────────────────────────────────────────────── */
export default function HomeScreen({ navigation }) {
  const { colors }     = useThemeStore()
  const { feed, selectedCategory, setCategory, requestLocation, isLoadingEvents } = useEventsStore()

  const [refreshing,  setRefreshing]  = useState(false)
  const [cityModal,   setCityModal]   = useState(false)
  const [filterModal, setFilterModal] = useState(false)
  const [currentCity, setCurrentCity] = useState(UGANDA_CITIES[0])
  const [dateFilter,  setDateFilter]  = useState('All')
  const [priceFilter, setPriceFilter] = useState('All prices')

  const hasFilter = dateFilter !== 'All' || priceFilter !== 'All prices'

  async function handleRefresh() {
    setRefreshing(true)
    await requestLocation()
    setRefreshing(false)
  }

  function openEvent(e)           { navigation.navigate('EventDetail', { eventId: e.id, event: e }) }
  function openCategory(id, title){ navigation.navigate('CategoryEvents', { categoryId: id, title }) }

  const allEvents   = feed.all || []
  const isFiltered  = selectedCategory !== 'all'
  const showFiltered = isFiltered || hasFilter

  const filteredEvents = applyFilters(
    isFiltered ? allEvents.filter(e => e.category === selectedCategory) : allEvents,
    dateFilter, priceFilter
  )

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.phone, { maxWidth: MAX_W }]}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>

          {/* ── Header row (city + icons all in one line) ── */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.cityBtn} onPress={() => setCityModal(true)} activeOpacity={0.7}>
              <Text style={styles.cityPin}>📍</Text>
              <Text style={[styles.cityName, { color: colors.textPrimary }]}>{currentCity.name}</Text>
              <Text style={[styles.cityChev, { color: colors.textHint }]}>▾</Text>
            </TouchableOpacity>

            <View style={styles.icons}>
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surface }]} onPress={() => navigation.navigate('Search')}>
                <SearchIcon color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: hasFilter ? colors.primary : colors.surface }]}
                onPress={() => setFilterModal(true)}
              >
                <FilterIcon color={hasFilter ? '#fff' : colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surface }]} onPress={() => {}}>
                <BellIcon color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Categories directly below header, no gap ── */}
          <CategoryFilter selected={selectedCategory} onSelect={setCategory} />

          {/* ── Feed ──────────────────────────────────── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
            contentContainerStyle={styles.feed}
          >
            {showFiltered ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 14 }]}>
                  {isFiltered ? EVENT_CATEGORIES.find(c => c.id === selectedCategory)?.label : 'Events'}
                  {filteredEvents.length > 0 ? ` (${filteredEvents.length})` : ''}
                </Text>
                {isLoadingEvents ? (
                  <View style={styles.loadingCenter}>
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                ) : filteredEvents.length > 0 ? (
                  <View style={styles.grid}>
                    {filteredEvents.map(e => (
                      <EventCard key={e.id} event={e} onPress={openEvent} style={{ marginBottom: 12 }} />
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.emptyTxt, { color: colors.textHint }]}>No events match your filters</Text>
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
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Happening Now</Text>
                      </View>
                      <TouchableOpacity onPress={() => openCategory('all', 'Happening Now')}>
                        <Text style={[styles.seeAll, { color: colors.textSecondary }]}>All ›</Text>
                      </TouchableOpacity>
                    </View>
                    {isLoadingEvents ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 16 }}>
                        {[1,2].map(i => <SkeletonCard key={i} colors={colors} />)}
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
                  <SectionRow
                    key={s.id}
                    title={s.title}
                    events={feed.byCategory?.[s.categoryId]}
                    onPress={openEvent}
                    onSeeAll={() => openCategory(s.categoryId, s.title)}
                    isLoading={isLoadingEvents}
                    colors={colors}
                  />
                ))}

                {/* Empty state — only after loading is done */}
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

          <CitySelector visible={cityModal} currentCity={currentCity}
            onSelect={city => setCurrentCity(city)} onClose={() => setCityModal(false)} />

          <FilterModal visible={filterModal} onClose={() => setFilterModal(false)}
            dateFilter={dateFilter} priceFilter={priceFilter}
            onApply={(d, p) => { setDateFilter(d); setPriceFilter(p) }} />

        </SafeAreaView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root:  { flex: 1, alignItems: 'center' },
  phone: { flex: 1, width: '100%' },

  /* Single compact header row */
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop:     10,
    paddingBottom:  6,
  },
  cityBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cityPin:  { fontSize: 14 },
  cityName: { fontSize: 17, fontWeight: '800' },
  cityChev: { fontSize: 11, marginLeft: 2 },

  icons:  { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  /* Feed */
  feed: { paddingBottom: 20 },
  section: { paddingLeft: 16, marginTop: 14 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingRight: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  seeAll:       { fontSize: 14, fontWeight: '600' },
  liveDot:      { width: 8, height: 8, borderRadius: 4 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingRight: 16 },
  emptyTxt:     { fontSize: 14, paddingHorizontal: 4 },
  loadingCenter:{ alignItems: 'center', paddingVertical: 20 },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800' },

  /* Skeleton */
  skeleton:    { borderRadius: 14, overflow: 'hidden', marginRight: 0 },
  skeletonImg: { width: '100%', height: 160 },
  skeletonInfo:{ padding: 10, gap: 8 },
  skeletonLine:{ borderRadius: 4 },
})
