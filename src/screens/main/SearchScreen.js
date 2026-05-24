import React, { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import colors from '../../constants/colors'
import useEventsStore from '../../store/eventsStore'
import EventCard from '../../components/events/EventCard'
import CategoryFilter from '../../components/events/CategoryFilter'

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const inputRef = useRef(null)
  const { search, searchResults, recentSearches, addRecentSearch } = useEventsStore()

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 200) }, [])

  useEffect(() => { if (query.trim()) search(query) }, [query])

  function handleSubmit() {
    if (!query.trim()) return
    addRecentSearch(query.trim())
    search(query)
  }

  function openEvent(event) {
    addRecentSearch(event.title)
    navigation.navigate('EventDetail', { eventId: event.id })
  }

  const filtered = activeCategory === 'all' ? searchResults : searchResults.filter(e => e.category === activeCategory)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.searchBar}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSubmit}
          placeholder="Search events, venues..."
          placeholderTextColor={colors.textHint}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.clear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {query.trim() && <CategoryFilter selected={activeCategory} onSelect={setActiveCategory} />}

      {!query.trim() && recentSearches.length > 0 && (
        <View style={styles.recent}>
          <Text style={styles.recentTitle}>Recent</Text>
          {recentSearches.map(term => (
            <TouchableOpacity key={term} style={styles.recentRow} onPress={() => setQuery(term)}>
              <Text style={styles.recentIcon}>🕒</Text>
              <Text style={styles.recentText}>{term}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!query.trim() && recentSearches.length === 0 && (
        <View style={styles.hint}>
          <Text style={{ fontSize: 40 }}>🔍</Text>
          <Text style={styles.hintText}>Search by name, venue or category</Text>
        </View>
      )}

      {query.trim() && (
        filtered.length > 0 ? (
          <FlatList
            data={filtered}
            keyExtractor={e => e.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <EventCard event={item} onPress={openEvent} />}
          />
        ) : (
          <View style={styles.hint}>
            <Text style={{ fontSize: 40 }}>😕</Text>
            <Text style={styles.hintText}>No events found for "{query}"</Text>
          </View>
        )
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    margin: 16, backgroundColor: colors.surface,
    borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: 12, paddingHorizontal: 14,
  },
  input: { flex: 1, fontSize: 16, color: colors.textPrimary, paddingVertical: 14 },
  clear: { fontSize: 14, color: colors.textHint, padding: 4 },
  recent: { paddingHorizontal: 16 },
  recentTitle: { fontSize: 12, fontWeight: '700', color: colors.textHint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  recentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider },
  recentIcon: { fontSize: 14, marginRight: 12 },
  recentText: { fontSize: 15, color: colors.textPrimary },
  list: { padding: 16, paddingBottom: 80 },
  row: { gap: 12 },
  hint: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  hintText: { fontSize: 14, color: colors.textSecondary, marginTop: 10, textAlign: 'center', paddingHorizontal: 32 },
})
