/**
 * HomeScreen.js
 *
 * Clean minimalist header:
 *   [City]          [Search] [Filter] [Bell]
 *
 * Categories scroll left-right in one row.
 * Filter button opens a bottom sheet — no ugly inline chips.
 * Cards match the reference photo design.
 */
import React, { useState } from 'react'
import {
  View, Text, ScrollView, FlatList,
  TouchableOpacity, StyleSheet, RefreshControl, Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Svg, Path, Circle, Line } from 'react-native-svg'
import useThemeStore  from '../../store/themeStore'
import useEventsStore from '../../store/eventsStore'
import EventCard, { CARD_WIDTH_HORIZ } from '../../components/events/EventCard'
import CategoryFilter  from '../../components/events/CategoryFilter'
import CitySelector    from '../../components/common/CitySelector'
import FilterModal     from '../../components/common/FilterModal'
import { HOME_SECTIONS, EVENT_CATEGORIES, UGANDA_CITIES } from '../../constants/config'

const { width } = Dimensions.get('window')
const MAX_W = Math.min(width, 500)

/* ── Filter helpers ─────────────────────────────────────────── */
function isToday(d) {
  const n = new Date(); const t = new Date(d)
  return t.getDate() === n.getDate() && t.getMonth() === n.getMonth() && t.getFullYear() === n.getFullYear()
}
function isWeekend(d) {
  const day = new Date(d).getDay(); return day === 0 || day === 6
}
function isThisWeek(d) {
  const diff = new Date(d) - new Date()
  return diff >= 0 && diff <= 7 * 86400000
}
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

/* ── Header icons (SVG, minimalist) ────────────────────────── */
function SearchIcon({ color }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2"/>
      <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  )
}
function FilterIcon({ color, active }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6"  x2="20" y2="6"  stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <Line x1="7" y1="12" x2="17" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <Line x1="10" y1="18" x2="14" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  )
}
function BellIcon({ color }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  )
}

/* ── Section row (horizontal scroll) ───────────────────────── */
function SectionRow({ title, events, onPress, onSeeAll, colors }) {
  if (!events?.length) return null
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={[styles.seeAll, { color: colors.textSecondary }]}>All ›</Text>
        </TouchableOpacity>
      </View>
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
    </View>
  )
}

/* ── Main screen ────────────────────────────────────────────── */
export default function HomeScreen({ navigation }) {
  const { colors }   = useThemeStore()
  const { feed, locationName, selectedCategory, setCategory, requestLocation } = useEventsStore()

  const [refreshing,    setRefreshing]    = useState(false)
  const [cityModal,     setCityModal]     = useState(false)
  const [filterModal,   setFilterModal]   = useState(false)
  const [currentCity,   setCurrentCity]   = useState(UGANDA_CITIES[0])
  const [dateFilter,    setDateFilter]    = useState('All')
  const [priceFilter,   setPriceFilter]   = useState('All prices')

  const hasActiveFilter = dateFilter !== 'All' || priceFilter !== 'All prices'

  async function handleRefresh() {
    setRefreshing(true)
    await requestLocation()
    setRefreshing(false)
  }

  function openEvent(e) { navigation.navigate('EventDetail', { eventId: e.id, event: e }) }
  function openCategory(id, title) { navigation.navigate('CategoryEvents', { categoryId: id, title }) }

  function handleApplyFilter(date, price) {
    setDateFilter(date)
    setPriceFilter(price)
  }

  const isFiltered = selectedCategory !== 'all'
  const allEvents  = feed.all || []

  // Apply date + price filters
  const filteredEvents = applyFilters(
    isFiltered ? allEvents.filter(e => e.category === selectedCategory) : allEvents,
    dateFilter, priceFilter
  )

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.phone, { maxWidth: MAX_W }]}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>

          {/* ── Header ──────────────────────────────────── */}
          <View style={styles.header}>
            {/* Left: City */}
            <TouchableOpacity
              style={styles.cityBtn}
              onPress={() => setCityModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.cityPin}>📍</Text>
              <Text style={[styles.cityName, { color: colors.textPrimary }]}>{currentCity.name}</Text>
              <Text style={[styles.cityChev, { color: colors.textHint }]}>▾</Text>
            </TouchableOpacity>

            {/* Right: Search, Filter, Bell */}
            <View style={styles.headerIcons}>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: colors.surface }]}
                onPress={() => navigation.navigate('Search')}
              >
                <SearchIcon color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Filter — shows orange dot when active */}
              <TouchableOpacity
                style={[
                  styles.iconBtn,
                  { backgroundColor: hasActiveFilter ? colors.primary : colors.surface }
                ]}
                onPress={() => setFilterModal(true)}
              >
                <FilterIcon color={hasActiveFilter ? '#fff' : colors.textSecondary} active={hasActiveFilter} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: colors.surface }]}
                onPress={() => {/* notifications */}}
              >
                <BellIcon color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Category chips (single row, scroll left-right) ── */}
          <CategoryFilter selected={selectedCategory} onSelect={setCategory} />

          {/* ── Feed ────────────────────────────────────── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
            contentContainerStyle={styles.feed}
          >
            {/* Filtered view */}
            {(isFiltered || hasActiveFilter) ? (
              <View style={styles.section}>
                <Text style={[styles.filteredTitle, { color: colors.textPrimary }]}>
                  {isFiltered
                    ? EVENT_CATEGORIES.find(c => c.id === selectedCategory)?.label
                    : 'Events'}
                  {filteredEvents.length > 0 ? ` (${filteredEvents.length})` : ''}
                </Text>
                {filteredEvents.length > 0 ? (
                  <View style={styles.grid}>
                    {filteredEvents.map(e => (
                      <EventCard
                        key={e.id}
                        event={e}
                        onPress={openEvent}
                        style={{ marginBottom: 12 }}
                      />
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.emptyTxt, { color: colors.textHint }]}>
                    No events match your filters
                  </Text>
                )}
              </View>
            ) : (
              <>
                {/* Happening Now */}
                {feed.happeningNow?.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHead}>
                      <View style={styles.liveRow}>
                        <View style={[styles.liveDot, { backgroundColor: colors.error }]} />
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                          Happening Now
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => openCategory('all', 'Happening Now')}>
                        <Text style={[styles.seeAll, { color: colors.textSecondary }]}>All ›</Text>
                      </TouchableOpacity>
                    </View>
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
                  </View>
                )}

                {/* Category sections */}
                {HOME_SECTIONS.filter(s => s.categoryId !== null).map(s => (
                  <SectionRow
                    key={s.id}
                    title={s.title}
                    events={feed.byCategory?.[s.categoryId]}
                    onPress={openEvent}
                    onSeeAll={() => openCategory(s.categoryId, s.title)}
                    colors={colors}
                  />
                ))}

                {allEvents.length === 0 && (
                  <View style={styles.empty}>
                    <Text style={{ fontSize: 48 }}>🎭</Text>
                    <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                      No events yet
                    </Text>
                    <Text style={[styles.emptyTxt, { color: colors.textHint }]}>
                      Be the first to create one!
                    </Text>
                  </View>
                )}
              </>
            )}

            <View style={{ height: 90 }} />
          </ScrollView>

          {/* ── Modals ──────────────────────────────────── */}
          <CitySelector
            visible={cityModal}
            currentCity={currentCity}
            onSelect={city => setCurrentCity(city)}
            onClose={() => setCityModal(false)}
          />

          <FilterModal
            visible={filterModal}
            onClose={() => setFilterModal(false)}
            dateFilter={dateFilter}
            priceFilter={priceFilter}
            onApply={handleApplyFilter}
          />
        </SafeAreaView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root:  { flex: 1, alignItems: 'center' },
  phone: { flex: 1, width: '100%' },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  cityBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  cityPin:  { fontSize: 14 },
  cityName: { fontSize: 16, fontWeight: '800' },
  cityChev: { fontSize: 11, marginLeft: 2 },
  headerIcons: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Feed */
  feed: { paddingBottom: 20 },
  section: { paddingLeft: 16, marginTop: 16 },
  sectionHead: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12, paddingRight: 16,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  seeAll:       { fontSize: 14, fontWeight: '600' },
  liveRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot:      { width: 8, height: 8, borderRadius: 4 },

  /* 2-column grid for filtered view */
  grid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingRight: 16 },
  filteredTitle:  { fontSize: 18, fontWeight: '800', marginBottom: 14 },
  emptyTxt:       { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginTop: 12, marginBottom: 6 },
})
