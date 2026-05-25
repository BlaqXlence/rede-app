/**
 * HomeScreen.js — Biglion-style home with city selector
 */
import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import colors from '../../constants/colors'
import useEventsStore from '../../store/eventsStore'
import EventCard from '../../components/events/EventCard'
import CategoryFilter from '../../components/events/CategoryFilter'
import CitySelector from '../../components/common/CitySelector'
import { HOME_SECTIONS, EVENT_CATEGORIES, UGANDA_CITIES } from '../../constants/config'

const PREVIEW = 4

function Section({ title, events, onPress, onSeeAll }) {
  const [expanded, setExpanded] = useState(false)
  if (!events?.length) return null
  const shown = expanded ? events : events.slice(0, PREVIEW)
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAll}>ALL ›</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.grid}>
        {shown.map(e => <EventCard key={e.id} event={e} onPress={onPress} />)}
      </View>
      {events.length > PREVIEW && !expanded && (
        <TouchableOpacity style={styles.showMore} onPress={() => setExpanded(true)}>
          <Text style={styles.showMoreText}>See all {events.length} offers</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

export default function HomeScreen({ navigation }) {
  const { feed, locationName, selectedCategory, setCategory, requestLocation } = useEventsStore()
  const [refreshing, setRefreshing] = useState(false)
  const [cityModal, setCityModal]   = useState(false)
  const [currentCity, setCurrentCity] = useState(UGANDA_CITIES[0])

  async function handleRefresh() {
    setRefreshing(true)
    await requestLocation()
    setRefreshing(false)
  }

  function handleCitySelect(city) {
    setCurrentCity(city)
    // TODO: filter events by city
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header — REDE logo + city pill like Biglion */}
      <View style={styles.header}>
        <Text style={styles.logo}>REDE</Text>
        <TouchableOpacity style={styles.cityPill} onPress={() => setCityModal(true)} activeOpacity={0.8}>
          <Text style={styles.cityPin}>📍</Text>
          <Text style={styles.cityText}>{currentCity.name}</Text>
          <Text style={styles.cityChev}>▾</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <TouchableOpacity style={styles.search} onPress={() => navigation.navigate('Search')} activeOpacity={0.8}>
        <Text style={styles.searchIcon}>🔍</Text>
        <Text style={styles.searchHint}>Search events in {currentCity.name}...</Text>
      </TouchableOpacity>

      {/* Category filter */}
      <CategoryFilter selected={selectedCategory} onSelect={setCategory} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.feed}
      >
        {isFiltered ? (
          <View style={styles.section}>
            <Text style={styles.filteredLabel}>
              {EVENT_CATEGORIES.find(c => c.id === selectedCategory)?.label}
              {filtered.length > 0 ? ` (${filtered.length})` : ''}
            </Text>
            {filtered.length > 0
              ? <View style={styles.grid}>{filtered.map(e => <EventCard key={e.id} event={e} onPress={openEvent} />)}</View>
              : <Text style={styles.emptyTxt}>No events in this category yet</Text>
            }
          </View>
        ) : (
          <>
            {/* Happening Now */}
            {feed.happeningNow?.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.liveRow}>
                    <View style={styles.liveDot} />
                    <Text style={styles.sectionTitle}>Happening Now</Text>
                  </View>
                  <TouchableOpacity onPress={() => openCategory('all', 'Happening Now')}>
                    <Text style={styles.seeAll}>ALL ›</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.grid}>
                  {feed.happeningNow.slice(0, 4).map(e => <EventCard key={e.id} event={e} onPress={openEvent} />)}
                </View>
              </View>
            )}

            {HOME_SECTIONS.filter(s => s.categoryId !== null).map(s => (
              <Section
                key={s.id}
                title={s.title}
                events={feed.byCategory?.[s.categoryId]}
                onPress={openEvent}
                onSeeAll={() => openCategory(s.categoryId, s.title)}
              />
            ))}

            {allEvents.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🎭</Text>
                <Text style={styles.emptyTitle}>No events yet</Text>
                <Text style={styles.emptyTxt}>Be the first to create one!</Text>
              </View>
            )}
          </>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      <CitySelector
        visible={cityModal}
        currentCity={currentCity}
        onSelect={handleCitySelect}
        onClose={() => setCityModal(false)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  logo: { fontSize: 26, fontWeight: '900', color: colors.primary, letterSpacing: -0.5 },
  cityPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7, gap: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  cityPin: { fontSize: 12 },
  cityText: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  cityChev: { fontSize: 10, color: colors.textSecondary },
  search: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 12,
    marginHorizontal: 16, marginBottom: 2,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: colors.border, gap: 10,
  },
  searchIcon: { fontSize: 15 },
  searchHint: { fontSize: 14, color: colors.textHint, flex: 1 },
  feed: { paddingBottom: 20 },
  section: { paddingHorizontal: 16, marginTop: 12 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  seeAll: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  showMore: {
    backgroundColor: colors.surface, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', marginTop: 6,
    borderWidth: 1, borderColor: colors.border,
  },
  showMoreText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600', textDecorationLine: 'underline' },
  filteredLabel: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginTop: 8, marginBottom: 12 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  emptyTxt: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
})
