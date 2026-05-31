import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore    from '../../store/themeStore'
import useEventsStore   from '../../store/eventsStore'
import Avatar           from '../../components/common/Avatar'
import EventCard        from '../../components/events/EventCard'
import { authApi }      from '../../services/api'

const { width } = Dimensions.get('window')
const MAX_W = Math.min(width, 500)
const PAD   = 16
const GAP   = 12
const CARD_W = (MAX_W - PAD * 2 - GAP) / 2

export default function SearchScreen({ navigation }) {
  const { colors } = useThemeStore()
  const { events } = useEventsStore()

  const [query,      setQuery]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [evResults,  setEvResults]  = useState([])
  const [orgResults, setOrgResults] = useState([])
  const [activeType, setActiveType] = useState('events')
  const inputRef = useRef(null)
  const timer    = useRef(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [])

  useEffect(() => {
    clearTimeout(timer.current)
    if (!query.trim()) { setEvResults([]); setOrgResults([]); return }
    timer.current = setTimeout(() => doSearch(query.trim()), 400)
    return () => clearTimeout(timer.current)
  }, [query])

  async function doSearch(q) {
    setLoading(true)
    try {
      const lower = q.toLowerCase()
      const localEvents = events.filter(e =>
        e.title?.toLowerCase().includes(lower) ||
        e.location?.name?.toLowerCase().includes(lower) ||
        e.location?.venueName?.toLowerCase().includes(lower) ||
        e.location?.city?.toLowerCase().includes(lower) ||
        e.category?.toLowerCase().includes(lower)
      )
      setEvResults(localEvents)

      try {
        const res = await authApi.searchOrganisers(q)
        setOrgResults(res.organisers || [])
      } catch { setOrgResults([]) }
    } finally { setLoading(false) }
  }

  function openEvent(e) { navigation.navigate('EventDetail', { eventId: e.id, event: e }) }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[s.phone, { maxWidth: MAX_W }]}>

        <View style={[s.bar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingRight: 12 }}>
            <Text style={[s.back, { color: colors.primary }]}>←</Text>
          </TouchableOpacity>
          <TextInput
            ref={inputRef}
            style={[s.input, { color: colors.textPrimary }]}
            value={query}
            onChangeText={setQuery}
            placeholder="Search events or organisers..."
            placeholderTextColor={colors.textHint}
            returnKeyType="search"
            selectionColor={colors.primary}
            underlineColorAndroid="transparent"
            autoFocus
          />
          {loading && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />}
          {query.length > 0 && !loading && (
            <TouchableOpacity onPress={() => setQuery('')} style={{ paddingLeft: 8 }}>
              <Text style={{ color: colors.textHint, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {query.length > 0 && (
          <View style={[s.typeBar, { borderBottomColor: colors.border }]}>
            {['events','organisers'].map(t => (
              <TouchableOpacity key={t}
                style={[s.typeBtn, activeType === t && { borderBottomWidth: 2, borderBottomColor: colors.primary }]}
                onPress={() => setActiveType(t)}
              >
                <Text style={[s.typeTxt, { color: activeType === t ? colors.primary : colors.textSecondary }]}>
                  {t === 'events'
                    ? `Events${evResults.length > 0 ? ` (${evResults.length})` : ''}`
                    : `Organisers${orgResults.length > 0 ? ` (${orgResults.length})` : ''}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
          {!query.trim() && (
            <View style={s.empty}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>🔍</Text>
              <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>Search REDE</Text>
              <Text style={[s.emptySub, { color: colors.textHint }]}>
                Find events by name, venue or category.{'\n'}Or search for your favourite organisers.
              </Text>
            </View>
          )}

          {query.trim() && activeType === 'events' && (
            evResults.length > 0 ? (
              <View style={s.grid}>
                {evResults.map(e => (
                  <EventCard key={e.id} event={e} onPress={openEvent} style={{ width: CARD_W }} />
                ))}
              </View>
            ) : !loading ? (
              <View style={s.empty}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>🎭</Text>
                <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>No events found</Text>
                <Text style={[s.emptySub, { color: colors.textHint }]}>Try searching for organisers</Text>
              </View>
            ) : null
          )}

          {query.trim() && activeType === 'organisers' && (
            orgResults.length > 0 ? (
              <View>
                {orgResults.map(org => (
                  <TouchableOpacity
                    key={org.id}
                    style={[s.orgCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => navigation.navigate('Organizer', { organizerId: org.id })}
                    activeOpacity={0.8}
                  >
                    <Avatar uri={org.avatar} name={org.name} size={48} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[s.orgName, { color: colors.textPrimary }]}>
                        {org.name}{org.verified ? ' ✓' : ''}
                      </Text>
                      <Text style={[s.orgMeta, { color: colors.textSecondary }]}>
                        {org.eventCount || 0} events
                        {org.avgRating ? ` · ${Number(org.avgRating).toFixed(1)} ★` : ''}
                      </Text>
                    </View>
                    <Text style={{ color: colors.textHint, fontSize: 20 }}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : !loading ? (
              <View style={s.empty}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>👤</Text>
                <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>No organisers found</Text>
              </View>
            ) : null
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:  { flex: 1, alignItems: 'center' },
  phone: { flex: 1, width: '100%' },
  bar:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  back:  { fontSize: 22, fontWeight: '700' },
  input: { flex: 1, fontSize: 16, paddingVertical: 4 },
  typeBar: { flexDirection: 'row', borderBottomWidth: 1 },
  typeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  typeTxt: { fontSize: 13, fontWeight: '700' },
  content: { padding: PAD },
  grid:    { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  empty:   { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub:   { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  orgCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  orgName: { fontSize: 15, fontWeight: '700' },
  orgMeta: { fontSize: 12, marginTop: 2 },
})
