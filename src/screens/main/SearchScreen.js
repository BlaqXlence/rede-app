/**
 * SearchScreen.js
 * Real database search with debounce.
 * Filters by category, shows results as cards.
 */
import React, { useState, useRef, useCallback } from 'react'
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore  from '../../store/themeStore'
import EventCard, { CARD_WIDTH_GRID } from '../../components/events/EventCard'
import CategoryFilter from '../../components/events/CategoryFilter'
import { searchApi }  from '../../services/api'

export default function SearchScreen({ navigation }) {
  const { colors }    = useThemeStore()
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [searched, setSearched] = useState(false)
  const [category, setCategory] = useState('all')
  const debounce = useRef(null)

  const doSearch = useCallback(async (q, cat) => {
    if (!q || q.trim().length < 2) { setResults([]); setSearched(false); return }
    setLoading(true)
    setSearched(true)
    try {
      const params = cat && cat !== 'all' ? { category: cat } : {}
      const data   = await searchApi.search(q.trim(), params)
      setResults(data.results || [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  function handleChange(text) {
    setQuery(text)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => doSearch(text, category), 500)
  }

  function handleCategory(cat) {
    setCategory(cat)
    doSearch(query, cat)
  }

  function openEvent(event) {
    navigation.navigate('EventDetail', { eventId: event.id, event })
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Search bar */}
      <View style={[styles.bar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.back, { color: colors.primary }]}>←</Text>
        </TouchableOpacity>
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          value={query}
          onChangeText={handleChange}
          placeholder="Search events..."
          placeholderTextColor={colors.textHint}
          autoFocus
          returnKeyType="search"
          onSubmitEditing={() => doSearch(query, category)}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false) }}>
            <Text style={{ color: colors.textHint, fontSize: 18 }}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category filter */}
      <CategoryFilter selected={category} onSelect={handleCategory} />

      {/* Results */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : searched && results.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 36 }}>🔍</Text>
          <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>
            No events found for "{query}"
          </Text>
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={e => e.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <EventCard event={item} onPress={openEvent} style={{ marginBottom: 10 }} />
          )}
        />
      ) : (
        <View style={styles.center}>
          <Text style={{ fontSize: 36 }}>🎭</Text>
          <Text style={[styles.hint, { color: colors.textHint }]}>
            Search for parties, sports, music...
          </Text>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  bar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    margin: 12, borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  back:  { fontSize: 22, fontWeight: '700' },
  input: { flex: 1, fontSize: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTxt: { fontSize: 15, textAlign: 'center', paddingHorizontal: 32 },
  hint:     { fontSize: 14, textAlign: 'center' },
  list:  { padding: 16, paddingBottom: 80 },
  row:   { gap: 10 },
})
