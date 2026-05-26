/**
 * HomeScreen.js
 * - Horizontal scroll cards per category (swipe right to left)
 * - Search icon in header (goes to Search screen)
 * - City selector
 * - Responsive for big screens
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
const isTablet   = width > 768

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
      {/* Horizontal scroll — swipe right to left */}
      <FlatList
        data={events}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={e => e.id}
        contentContainerStyle={styles.horizList}
        snapToInterval={CARD_WIDTH_HORIZ + 10}
        decelerationRate="fast"
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={onPress}
            horizontal
            style={{ marginRight: 10 }}
          />
        )}
      />
    </View>
  )
}

export default function HomeScreen({ navigation }) {
  const { colors }                                     = useThemeStore()
  const { feed, selectedCategory, setCategory, requestLocation } = useEventsStore()
  const [refreshing, setRefreshing]                    = useState(false)
  const [cityModal, setCityModal]                      = useState(false)
  const [currentCity, setCurrentCity]                  = useState(UGANDA_CITIES[0])

  async function handleRefresh() {
    setRefreshing(true)
    await requestLocation()
    setRefreshing(false)
  }

  function openEvent(e) {
    navigation.navigate('EventDetail', { eventId: e.id, event: e })
  }

  function openCategory(categoryId, title) {
    navigation.navigate('CategoryEvents', { categoryId, title })
  }

  const isFiltered = selectedCategory !== 'all'
  const allEvents  = feed.all || []
  const filtered   = isFiltered ? allEvents.filter(e => e.category === selectedCategory) : []

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { maxWidth: isTablet ? 900 : undefined, alignSelf: 'center', width: '100%' }]}>
        <Text style={[styles.logo, { color: colors.primary }]}>REDE</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.cityPill, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setCityModal(true)}>
            <Text style={styles.cityPin}>📍</Text>
            <Text style={[styles.cityTxt, { color: colors.textPrimary }]}>{currentCity.name}</Text>
            <Text style={[styles.cityChev, { color: colors.textHint }]}>▾</Text>
          </TouchableOpacity>
          {/* Search icon */}
          <TouchableOpacity style={[styles.searchIcon, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.navigate('Search')}>
            <Text style={{ fontSize: 16 }}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category filter */}
      <CategoryFilter selected={selectedCategory} onSelect={setCategory} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        contentContainerStyle={[styles.feed, { maxWidth: isTablet ? 900 : undefined, alignSelf: 'center', width: '100%' }]}
      >
        {isFiltered ? (
          // Filtered — horizontal scroll of filtered events
          <View style={styles.section}>
            <Text style={[styles.filteredTitle, { color: colors.textPrimary }]}>
              {EVENT_CATEGORIES.find(c => c.id === selectedCategory)?.label}
              {filtered.length > 0 ? ` (${filtered.length})` : ''}
            </Text>
            {filtered.length > 0 ? (
              <FlatList
                data={filtered}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={e => e.id}
                contentContainerStyle={styles.horizList}
                snapToInterval={CARD_WIDTH_HORIZ + 10}
                decelerationRate="fast"
                renderItem={({ item }) => (
                  <EventCard event={item} onPress={openEvent} horizontal style={{ marginRight: 10 }} />
                )}
              />
            ) : (
              <Text style={[styles.emptyTxt, { color: colors.textHint }]}>No events in this category yet</Text>
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
                  contentContainerStyle={styles.horizList}
                  snapToInterval={CARD_WIDTH_HORIZ + 10}
                  decelerationRate="fast"
                  renderItem={({ item }) => (
                    <EventCard event={item} onPress={openEvent} horizontal style={{ marginRight: 10 }} />
                  )}
                />
              </View>
            )}

            {/* One horizontal row per category */}
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
                <Text style={[styles.emptyTxt, { color: colors.textHint }]}>Be the first to create one!</Text>
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
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
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
  cityPin:  { fontSize: 12 },
  cityTxt:  { fontSize: 12, fontWeight: '700' },
  cityChev: { fontSize: 10 },
  searchIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  feed: { paddingBottom: 20 },
  section: { paddingHorizontal: 16, marginTop: 12 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  seeAll: { fontSize: 13, fontWeight: '600' },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  horizList: { paddingRight: 16 },
  filteredTitle: { fontSize: 18, fontWeight: '800', marginTop: 8, marginBottom: 12 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6, marginTop: 12 },
  emptyTxt: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
})
