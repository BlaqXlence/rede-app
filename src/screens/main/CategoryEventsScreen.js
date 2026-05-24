import React from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import colors from '../../constants/colors'
import useEventsStore from '../../store/eventsStore'
import EventCard from '../../components/events/EventCard'

export default function CategoryEventsScreen({ navigation, route }) {
  const { categoryId, title } = route.params
  const { feed, events } = useEventsStore()

  const categoryEvents = categoryId === 'all'
    ? (feed.happeningNow || [])
    : (feed.byCategory?.[categoryId] || [])

  function openEvent(event) {
    navigation.navigate('EventDetail', { eventId: event.id })
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.count}>{categoryEvents.length}</Text>
      </View>

      {categoryEvents.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🎭</Text>
          <Text style={styles.emptyText}>No events in this category yet</Text>
        </View>
      ) : (
        <FlatList
          data={categoryEvents}
          keyExtractor={e => e.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <EventCard event={item} onPress={openEvent} />}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
    gap: 12,
  },
  back: { padding: 4 },
  backText: { fontSize: 22, color: colors.primary, fontWeight: '700' },
  title: { flex: 1, fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  count: {
    fontSize: 12, fontWeight: '700', color: '#fff',
    backgroundColor: colors.primary, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  list: { padding: 16, paddingBottom: 80 },
  row: { gap: 12, marginBottom: 0 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: colors.textSecondary },
})
