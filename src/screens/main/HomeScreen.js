/**
 * HomeScreen.js
 * Biglion-style home feed:
 * - Logo + location header
 * - Search bar
 * - Horizontal category chips
 * - Sections per category: 2-column grid + "See all" button
 */
import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import colors from '../../constants/colors'
import useEventsStore from '../../store/eventsStore'
import useAuthStore from '../../store/authStore'
import EventCard from '../../components/events/EventCard'
import CategoryFilter from '../../components/events/CategoryFilter'
import { HOME_SECTIONS, EVENT_CATEGORIES } from '../../constants/config'

// How many events to show per section before "See all"
const PREVIEW_COUNT = 4

function SectionHeader({ title, count, accent, onSeeAll }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {count > 0 && (
        <TouchableOpacity onPress={onSeeAll} style={styles.seeAllBtn}>
          <Text style={styles.seeAllText}>ALL  ›</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

function EventGrid({ events, onPress }) {
  return (
    <View style={styles.grid}>
      {events.map(e => (
        <EventCard key={e.id} event={e} onPress={onPress} />
      ))}
    </View>
  )
}

function CategorySection({ title, categoryId, events, onPress, onSeeAll }) {
  const [expanded, setExpanded] = useState(false)
  if (!events || events.length === 0) return null

  const shown  = expanded ? events : events.slice(0, PREVIEW_COUNT)
  const hasMore = events.length > PREVIEW_COUNT
  const cat    = EVENT_CATEGORIES.find(c => c.id === categoryId)

  return (
    <View style={styles.section}>
      <SectionHeader
        title={title}
        count={events.length}
        accent={cat?.accent}
        onSeeAll={onSeeAll}
      />
      <EventGrid events={shown} onPress={onPress} />
      {hasMore && !expanded && (
        <TouchableOpacity style={styles.showMoreBtn} onPress={() => setExpanded(true)}>
          <Text style={styles.showMoreText}>
            See all {events.length} offers
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuthStore()
  const {
    feed, locationName, selectedCategory,
    setCategory, requestLocation,
  } = useEventsStore()

  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    await requestLocation()
    setRefreshing(false)
  }

  function openEvent(event) {
    navigation.navigate('EventDetail', { eventId: event.id, event })
  }

  function openCategory(categoryId, title) {
    navigation.navigate('CategoryEvents', { categoryId, title })
  }

  const isFiltered = selectedCategory !== 'all'
  const allEvents  = feed.all || []
  const filtered   = isFiltered
    ? allEvents.filter(e => e.category === selectedCategory)
    : allEvents

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>REDE</Text>
        <TouchableOpacity onPress={requestLocation} style={styles.locationPill}>
          <Text style={styles.locationPin}>📍</Text>
          <Text style={styles.locationName} numberOfLines={1}>{locationName}</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar — tappable, goes to search screen */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => navigation.navigate('Search')}
        activeOpacity={0.8}
      >
        <Text style={styles.searchIcon}>🔍</Text>
        <Text style={styles.searchPlaceholder}>
          Search events in {locationName}...
        </Text>
      </TouchableOpacity>

      {/* Category chips */}
      <CategoryFilter selected={selectedCategory} onSelect={setCategory} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.feedContent}
      >
        {/* Filtered view — when a category chip is selected */}
        {isFiltered ? (
          <View style={styles.section}>
            <Text style={styles.filteredTitle}>
              {EVENT_CATEGORIES.find(c => c.id === selectedCategory)?.label}
              {filtered.length > 0 ? ` (${filtered.length})` : ''}
            </Text>
            {filtered.length > 0
              ? <EventGrid events={filtered} onPress={openEvent} />
              : <Text style={styles.emptyText}>No events in this category yet</Text>
            }
          </View>
        ) : (
          // Default home — section per category like Biglion
          <>
            {/* Happening Now */}
            {feed.happeningNow?.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  title="Happening Now"
                  count={feed.happeningNow.length}
                  onSeeAll={() => openCategory('all', 'Happening Now')}
                />
                <EventGrid events={feed.happeningNow.slice(0, 4)} onPress={openEvent} />
              </View>
            )}

            {/* One section per category */}
            {HOME_SECTIONS.filter(s => s.categoryId !== null).map(section => (
              <CategorySection
                key={section.id}
                title={section.title}
                categoryId={section.categoryId}
                events={feed.byCategory?.[section.categoryId] || []}
                onPress={openEvent}
                onSeeAll={() => openCategory(section.categoryId, section.title)}
              />
            ))}

            {/* Empty state */}
            {allEvents.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🎭</Text>
                <Text style={styles.emptyTitle}>No events near you yet</Text>
                <Text style={styles.emptyText}>
                  Be the first to create one!
                </Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
  },
  logo: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
    maxWidth: 160,
  },
  locationPin: {
    fontSize: 12,
  },
  locationName: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { fontSize: 15 },
  searchPlaceholder: {
    fontSize: 14,
    color: colors.textHint,
    flex: 1,
  },

  // Feed
  feedContent: {
    paddingTop: 4,
    paddingBottom: 20,
  },

  // Section
  section: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  seeAllBtn: { paddingHorizontal: 2 },
  seeAllText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  // 2-column grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  // "See all X offers" button — grey like Biglion
  showMoreBtn: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  showMoreText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // Filtered header
  filteredTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 10,
    marginBottom: 12,
  },

  // Empty state
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
})
