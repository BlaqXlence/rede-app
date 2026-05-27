/**
 * HomeScreen.js
 * - TikTok-style usability: instant, smooth, clear
 * - Instagram-on-desktop: max-width 500px centered, phone layout always
 * - Date filter: Today / Weekend / This Week
 * - Price filter: Free / Paid
 * - Horizontal scroll cards per category
 */
import React, { useState } from 'react'
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore    from '../../store/themeStore'
import useEventsStore   from '../../store/eventsStore'
import EventCard, { CARD_WIDTH_HORIZ } from '../../components/events/EventCard'
import CategoryFilter   from '../../components/events/CategoryFilter'
import CitySelector     from '../../components/common/CitySelector'
import { HOME_SECTIONS, EVENT_CATEGORIES, UGANDA_CITIES } from '../../constants/config'

const { width } = Dimensions.get('window')
// Instagram-style: phone width max, centered on desktop
const MAX_W = Math.min(width, 500)

const DATE_FILTERS = [
  { id: 'all',     label: 'All' },
  { id: 'today',   label: 'Today' },
  { id: 'weekend', label: 'Weekend' },
  { id: 'week',    label: 'This Week' },
]

const PRICE_FILTERS = [
  { id: 'all',  label: 'All prices' },
  { id: 'free', label: 'Free' },
  { id: 'paid', label: 'Paid' },
]

function isToday(d) {
  const now = new Date(); const dt = new Date(d)
  return dt.getDate() === now.getDate() && dt.getMonth() === now.getMonth()
}
function isWeekend(d) {
  const day = new Date(d).getDay(); return day === 0 || day === 6
}
function isThisWeek(d) {
  const now = new Date(); const dt = new Date(d)
  const diff = dt - now
  return diff >= 0 && diff <= 7 * 86400000
}

function applyFilters(events, dateFilter, priceFilter) {
  return events.filter(e => {
    if (dateFilter === 'today'   && !isToday(e.startTime))   return false
    if (dateFilter === 'weekend' && !isWeekend(e.startTime)) return false
    if (dateFilter === 'week'    && !isThisWeek(e.startTime)) return false
    if (priceFilter === 'free'   && e.entryFee > 0)          return false
    if (priceFilter === 'paid'   && e.entryFee === 0)        return false
    return true
  })
}

function SectionRow({ title, events, onPress, onSeeAll, colors }) {
  if (!events?.length) return null
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={[styles.seeAll, { color: colors.textSecondary }]}>ALL ›</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={events}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={e => e.id}
        contentContainerStyle={{ paddingRight: 16 }}
        snapToInterval={CARD_WIDTH_HORIZ + 10}
        decelerationRate="fast"
        renderItem={({ item }) => (
          <EventCard event={item} onPress={onPress} horizontal style={{ marginRight: 10 }} />
        )}
      />
    </View>
  )
}

export default function HomeScreen({ navigation }) {
  const { colors }  = useThemeStore()
  const { feed, locationName, selectedCategory, setCategory, requestLocation } = useEventsStore()

  const [refreshing, setRefreshing]   = useState(false)
  const [cityModal, setCityModal]     = useState(false)
  const [currentCity, setCurrentCity] = useState(UGANDA_CITIES[0])
  const [dateFilter, setDateFilter]   = useState('all')
  const [priceFilter, setPriceFilter] = useState('all')

  async function handleRefresh() {
    setRefreshing(true)
    await requestLocation()
    setRefreshing(false)
  }

  function openEvent(e) { navigation.navigate('EventDetail', { eventId: e.id, event: e }) }
  function openCategory(id, title) { navigation.navigate('CategoryEvents', { categoryId: id, title }) }

  const isFiltered = selectedCategory !== 'all'
  const allEvents  = feed.all || []

  // Apply date + price filters to everything
  const filtered = applyFilters(
    isFiltered ? allEvents.filter(e => e.category === selectedCategory) : allEvents,
    dateFilter, priceFilter
  )

  const hasFilters = dateFilter !== 'all' || priceFilter !== 'all'

  return (
    // Center on desktop like Instagram
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.phoneWrap, { maxWidth: MAX_W }]}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.logo, { color: colors.primary }]}>REDE</Text>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={[styles.cityPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setCityModal(true)}
              >
                <Text style={styles.cityPin}>📍</Text>
                <Text style={[styles.cityTxt, { color: colors.textPrimary }]}>{currentCity.name}</Text>
                <Text style={[styles.cityChev, { color: colors.textHint }]}>▾</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => navigation.navigate('Search')}
              >
                <Text style={{ fontSize: 16 }}>🔍</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Category filter */}
          <CategoryFilter selected={selectedCategory} onSelect={setCategory} />

          {/* Date filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {DATE_FILTERS.map(f => (
              <TouchableOpacity
                key={f.id}
                onPress={() => setDateFilter(f.id)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: dateFilter === f.id ? colors.primary : colors.surface,
                    borderColor: dateFilter === f.id ? colors.primary : colors.border,
                  }
                ]}
              >
                <Text style={[styles.filterTxt, { color: dateFilter === f.id ? '#fff' : colors.textSecondary }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={[styles.filterDivider, { backgroundColor: colors.border }]} />
            {PRICE_FILTERS.map(f => (
              <TouchableOpacity
                key={f.id}
                onPress={() => setPriceFilter(f.id)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: priceFilter === f.id ? colors.primary : colors.surface,
                    borderColor: priceFilter === f.id ? colors.primary : colors.border,
                  }
                ]}
              >
                <Text style={[styles.filterTxt, { color: priceFilter === f.id ? '#fff' : colors.textSecondary }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
            contentContainerStyle={styles.feed}
          >
            {(isFiltered || hasFilters) ? (
              // Filtered view
              <View style={styles.section}>
                <Text style={[styles.filteredTitle, { color: colors.textPrimary }]}>
                  {isFiltered ? EVENT_CATEGORIES.find(c => c.id === selectedCategory)?.label : 'Events'}
                  {filtered.length > 0 ? ` (${filtered.length})` : ''}
                </Text>
                {filtered.length > 0 ? (
                  <FlatList
                    data={filtered}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={e => e.id}
                    contentContainerStyle={{ paddingRight: 16 }}
                    snapToInterval={CARD_WIDTH_HORIZ + 10}
                    decelerationRate="fast"
                    renderItem={({ item }) => (
                      <EventCard event={item} onPress={openEvent} horizontal style={{ marginRight: 10 }} />
                    )}
                  />
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
                    <View style={styles.sectionHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                        <View style={[styles.liveDot, { backgroundColor: colors.error }]} />
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Happening Now</Text>
                      </View>
                      <TouchableOpacity onPress={() => openCategory('all', 'Happening Now')}>
                        <Text style={[styles.seeAll, { color: colors.textSecondary }]}>ALL ›</Text>
                      </TouchableOpacity>
                    </View>
                    <FlatList
                      data={feed.happeningNow}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      keyExtractor={e => e.id}
                      contentContainerStyle={{ paddingRight: 16 }}
                      snapToInterval={CARD_WIDTH_HORIZ + 10}
                      decelerationRate="fast"
                      renderItem={({ item }) => (
                        <EventCard event={item} onPress={openEvent} horizontal style={{ marginRight: 10 }} />
                      )}
                    />
                  </View>
                )}

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
                    <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No events yet</Text>
                    <Text style={[styles.emptyTxt, { color: colors.textHint }]}>
                      Be the first to create one!
                    </Text>
                  </View>
                )}
              </>
            )}
            <View style={{ height: 80 }} />
          </ScrollView>

          <CitySelector
            visible={cityModal}
            currentCity={currentCity}
            onSelect={city => setCurrentCity(city)}
            onClose={() => setCityModal(false)}
          />
        </SafeAreaView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root:      { flex: 1, alignItems: 'center' },
  phoneWrap: { flex: 1, width: '100%' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  logo: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cityPill: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, gap: 4,
  },
  cityPin: { fontSize: 12 },
  cityTxt: { fontSize: 12, fontWeight: '700' },
  cityChev: { fontSize: 10 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  // Date/price filter row
  filterRow: { paddingHorizontal: 16, paddingBottom: 8, gap: 6, alignItems: 'center' },
  filterChip: {
    borderRadius: 16, borderWidth: 1.5,
    paddingHorizontal: 12, paddingVertical: 5,
    height: 30, justifyContent: 'center',
  },
  filterTxt:     { fontSize: 12, fontWeight: '600' },
  filterDivider: { width: 1, height: 20, marginHorizontal: 4 },
  // Feed
  feed:          { paddingBottom: 20 },
  section:       { paddingLeft: 16, marginTop: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingRight: 16 },
  sectionTitle:  { fontSize: 16, fontWeight: '800' },
  seeAll:        { fontSize: 13, fontWeight: '600' },
  liveDot:       { width: 8, height: 8, borderRadius: 4 },
  filteredTitle: { fontSize: 18, fontWeight: '800', marginTop: 8, marginBottom: 12 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6, marginTop: 12 },
  emptyTxt: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
})
