import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, Dimensions, FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import colors from '../../constants/colors'
import useEventsStore from '../../store/eventsStore'
import useAuthStore from '../../store/authStore'
import EventCard from '../../components/events/EventCard'
import CategoryFilter from '../../components/events/CategoryFilter'
import { HOME_SECTIONS, EVENT_CATEGORIES } from '../../constants/config'

const INITIAL_VISIBLE = 4  // 2 rows of 2

function SectionHeader({ title, count, onSeeAll }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {count > 0 && (
        <TouchableOpacity onPress={onSeeAll} style={styles.seeAllBtn}>
          <Text style={styles.seeAllText}>See all  ›</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// 2-column grid for a list of events
function EventGrid({ events, onPress }) {
  return (
    <View style={styles.grid}>
      {events.map(event => (
        <EventCard key={event.id} event={event} onPress={onPress} />
      ))}
    </View>
  )
}

// A single category section: header + 2-col grid + "show more" button
function CategorySection({ title, categoryId, events, onPress, onSeeAll }) {
  const [expanded, setExpanded] = useState(false)
  if (!events || events.length === 0) return null

  const visible = expanded ? events : events.slice(0, INITIAL_VISIBLE)
  const hasMore = events.length > INITIAL_VISIBLE

  return (
    <View style={styles.section}>
      <SectionHeader title={title} count={events.length} onSeeAll={onSeeAll} />
      <EventGrid events={visible} onPress={onPress} />
      {hasMore && !expanded && (
        <TouchableOpacity style={styles.showMoreBtn} onPress={() => setExpanded(true)}>
          <Text style={styles.showMoreText}>
            Show all {events.length} {title.replace(/[^\w\s]/gi, '').trim()} →
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
    setCategory, requestLocation, events,
  } = useEventsStore()

  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    await requestLocation()
    setRefreshing(false)
  }

  function openEvent(event) {
    navigation.navigate('EventDetail', { eventId: event.id })
  }

  function openCategory(categoryId, title) {
    navigation.navigate('CategoryEvents', { categoryId, title })
  }

  function goToSearch() {
    navigation.navigate('Search')
  }

  // Filter all events by selected category or show all
  const allEvents = feed.all || []
  const filteredEvents = selectedCategory === 'all'
    ? allEvents
    : allEvents.filter(e => e.category === selectedCategory)

  const isFiltered = selectedCategory !== 'all'

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>REDE</Text>
          <TouchableOpacity onPress={requestLocation} style={styles.locationBtn}>
            <Text style={styles.locationText}>📍 {locationName}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      <TouchableOpacity style={styles.searchBar} onPress={goToSearch} activeOpacity={0.8}>
        <Text style={styles.searchIcon}>🔍</Text>
        <Text style={styles.searchPlaceholder}>Search events in {locationName}...</Text>
      </TouchableOpacity>

      {/* Category filter chips */}
      <CategoryFilter selected={selectedCategory} onSelect={setCategory} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* When a specific category is selected — show filtered grid */}
        {isFiltered ? (
          <View style={styles.section}>
            <Text style={styles.filteredTitle}>
              {EVENT_CATEGORIES.find(c => c.id === selectedCategory)?.emoji}{' '}
              {EVENT_CATEGORIES.find(c => c.id === selectedCategory)?.label}
              {' '}({filteredEvents.length})
            </Text>
            {filteredEvents.length > 0 ? (
              <EventGrid events={filteredEvents} onPress={openEvent} />
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🎭</Text>
                <Text style={styles.emptyText}>No events in this category yet</Text>
              </View>
            )}
          </View>
        ) : (
          // Default: show all category sections like Biglion
          <>
            {/* Happening Now section */}
            {feed.happeningNow && feed.happeningNow.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  title="🔴 Happening Now"
                  count={feed.happeningNow.length}
                  onSeeAll={() => openCategory('all', 'Happening Now')}
                />
                <EventGrid events={feed.happeningNow.slice(0, 4)} onPress={openEvent} />
              </View>
            )}

            {/* One section per category */}
            {HOME_SECTIONS.filter(s => s.categoryId !== null).map(section => {
              const sectionEvents = feed.byCategory?.[section.categoryId] || []
              return (
                <CategorySection
                  key={section.id}
                  title={section.title}
                  categoryId={section.categoryId}
                  events={sectionEvents}
                  onPress={openEvent}
                  onSeeAll={() => openCategory(section.categoryId, section.title)}
                />
              )
            })}

            {allEvents.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🎭</Text>
                <Text style={styles.emptyTitle}>No events near you yet</Text>
                <Text style={styles.emptyText}>
                  Be the first to create one in {locationName}!
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  locationText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: colors.textHint,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  seeAllBtn: {
    paddingHorizontal: 4,
  },
  seeAllText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  showMoreBtn: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  showMoreText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  filteredTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 14,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
})
