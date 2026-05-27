import React from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore  from '../../store/themeStore'
import useEventsStore from '../../store/eventsStore'
import EventCard, { CARD_WIDTH_HORIZ } from '../../components/events/EventCard'
import BottomNav from '../../components/common/BottomNav'

export default function CategoryEventsScreen({ navigation, route }) {
  const { categoryId, title } = route.params
  const { colors }            = useThemeStore()
  const { feed }              = useEventsStore()

  const events = categoryId === 'all'
    ? (feed.happeningNow || [])
    : (feed.byCategory?.[categoryId] || [])

  function openEvent(e) {
    navigation.navigate('EventDetail', { eventId: e.id, event: e })
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header with back */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={[styles.back, { color: colors.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        <View style={[styles.count, { backgroundColor: colors.primary }]}>
          <Text style={styles.countTxt}>{events.length}</Text>
        </View>
      </View>

      {events.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 40 }}>🎭</Text>
          <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>No events in this category yet</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={e => e.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <EventCard event={item} onPress={openEvent} style={{ marginBottom: 10 }} />
          )}
        />
      )}

      <BottomNav navigation={navigation} activeTab="Home" />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  back: { fontSize: 22, fontWeight: '700' },
  title: { flex: 1, fontSize: 17, fontWeight: '800' },
  count: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  countTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },
  list: { padding: 16, paddingBottom: 10 },
  row: { gap: 10 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTxt: { fontSize: 15 },
})
