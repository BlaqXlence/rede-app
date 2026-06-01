import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView,
} from 'react-native'
import AsyncStorage   from '@react-native-async-storage/async-storage'
import useThemeStore  from '../../store/themeStore'
import Avatar         from '../common/Avatar'
import { eventsApi }  from '../../services/api'

const PAGE = 24
function cacheKey(id) { return `rede:attendees:${id}` }

export default function AttendeesSection({ eventId, attendeeCount, onPressAttendee }) {
  const { colors }               = useThemeStore()
  const [attendees, setAttendees] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [page,      setPage]      = useState(1)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const cached = await AsyncStorage.getItem(cacheKey(eventId))
        if (cached && mounted.current) {
          setAttendees(JSON.parse(cached))
          setLoading(false)
        }
      } catch {}
      try {
        const data = await eventsApi.getAttendees(eventId)
        if (!mounted.current) return
        const list = data.attendees || []
        setAttendees(list)
        setLoading(false)
        AsyncStorage.setItem(cacheKey(eventId), JSON.stringify(list)).catch(() => {})
      } catch {
        setLoading(false)
      }
    }
    load()
  }, [eventId])

  if (loading && attendees.length === 0) {
    return (
      <View style={st.center}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    )
  }

  if (attendees.length === 0) {
    return (
      <View style={st.emptyWrap}>
        <Text style={st.emptyIcon}>🎉</Text>
        <Text style={[st.emptyTxt, { color: colors.textSecondary }]}>No one has joined yet</Text>
        <Text style={[st.emptySub, { color: colors.textHint }]}>Be the first!</Text>
      </View>
    )
  }

  const total   = attendeeCount || attendees.length
  const visible = attendees.slice(0, page * PAGE)
  const hasMore = visible.length < attendees.length

  // Group into rows of 4
  const rows = []
  for (let i = 0; i < visible.length; i += 4) {
    rows.push(visible.slice(i, i + 4))
  }

  return (
    <View style={st.wrap}>
      {/* Summary row - first 5 avatars overlapping */}
      <View style={st.summaryRow}>
        <View style={st.stackWrap}>
          {attendees.slice(0, 5).map((a, i) => (
            <View key={a.id} style={[st.stackAvatar, { left: i * 22, zIndex: 5 - i }]}>
              <Avatar uri={a.avatar} name={a.name} size={36} />
            </View>
          ))}
        </View>
        <Text style={[st.countTxt, { color: colors.textPrimary, marginLeft: attendees.slice(0, 5).length * 22 + 12 }]}>
          <Text style={{ fontWeight: '900' }}>{total}</Text>
          {' '}going
        </Text>
      </View>

      {/* Grid */}
      {rows.map((row, ri) => (
        <View key={ri} style={st.row}>
          {row.map(a => (
            <TouchableOpacity
              key={a.id}
              style={st.person}
              onPress={() => onPressAttendee?.(a)}
              activeOpacity={0.75}
            >
              <View style={[st.avatarRing, { borderColor: colors.border }]}>
                <Avatar uri={a.avatar} name={a.name} size={52} />
                {a.verified && (
                  <View style={[st.verifiedDot, { backgroundColor: colors.primary }]}>
                    <Text style={st.verifiedTxt}>✓</Text>
                  </View>
                )}
              </View>
              <Text style={[st.name, { color: colors.textSecondary }]} numberOfLines={1}>
                {a.nickname || (a.name || 'Guest').split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
          {/* Fill empty slots in last row */}
          {row.length < 4 && Array.from({ length: 4 - row.length }).map((_, i) => (
            <View key={`empty-${i}`} style={st.person} />
          ))}
        </View>
      ))}

      {hasMore && (
        <TouchableOpacity
          style={[st.loadMore, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setPage(p => p + 1)}
        >
          <Text style={[st.loadMoreTxt, { color: colors.primary }]}>
            Show more · {attendees.length - visible.length} left
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const st = StyleSheet.create({
  center:     { paddingVertical: 24, alignItems: 'center' },
  emptyWrap:  { alignItems: 'center', paddingVertical: 32, gap: 6 },
  emptyIcon:  { fontSize: 40 },
  emptyTxt:   { fontSize: 16, fontWeight: '700' },
  emptySub:   { fontSize: 13 },
  wrap:       { paddingVertical: 8 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, height: 40 },
  stackWrap:  { position: 'relative', height: 36 },
  stackAvatar:{ position: 'absolute' },
  countTxt:   { fontSize: 15 },
  row:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  person:     { alignItems: 'center', width: '23%' },
  avatarRing: { borderRadius: 30, borderWidth: 2, position: 'relative', marginBottom: 6 },
  verifiedDot:{ position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  verifiedTxt:{ color: '#fff', fontSize: 9, fontWeight: '900' },
  name:       { fontSize: 11, textAlign: 'center', width: '100%' },
  loadMore:   { borderRadius: 10, borderWidth: 1, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  loadMoreTxt:{ fontSize: 13, fontWeight: '700' },
})
