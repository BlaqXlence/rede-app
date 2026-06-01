import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView, Image,
} from 'react-native'
import AsyncStorage  from '@react-native-async-storage/async-storage'
import useThemeStore from '../../store/themeStore'
import { eventsApi } from '../../services/api'

const PAGE = 20

function cacheKey(id) { return `rede:attendees:${id}` }

function AttendeeRow({ attendee, onPress, colors, index }) {
  const name = attendee.nickname || attendee.name || 'Guest'
  const initials = name.slice(0, 2).toUpperCase()

  return (
    <TouchableOpacity
      onPress={() => onPress?.(attendee)}
      activeOpacity={0.75}
      style={[ar.row, { borderBottomColor: colors.border }]}
    >
      {/* Avatar */}
      <View style={[ar.avatarWrap, { backgroundColor: colors.primary + '22' }]}>
        {attendee.avatar
          ? <Image source={{ uri: attendee.avatar }} style={ar.avatar} />
          : <Text style={[ar.initials, { color: colors.primary }]}>{initials}</Text>
        }
        {attendee.verified && (
          <View style={[ar.verBadge, { backgroundColor: colors.primary }]}>
            <Text style={ar.verTxt}>✓</Text>
          </View>
        )}
      </View>

      {/* Name + number */}
      <View style={ar.info}>
        <Text style={[ar.name, { color: colors.textPrimary }]}>{name}</Text>
        {attendee.verified && (
          <Text style={[ar.verLabel, { color: colors.primary }]}>Verified</Text>
        )}
      </View>

      {/* Index */}
      <Text style={[ar.num, { color: colors.textHint }]}>#{index + 1}</Text>
      <Text style={[ar.arrow, { color: colors.textHint }]}>›</Text>
    </TouchableOpacity>
  )
}

export default function AttendeesSection({ eventId, attendeeCount, onPressAttendee }) {
  const { colors }               = useThemeStore()
  const [attendees, setAttendees] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [page,      setPage]      = useState(1)
  const mounted                  = useRef(true)

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
        const data = await eventsApi.attendees(eventId)
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
        <Text style={[st.loadingTxt, { color: colors.textHint }]}>Loading attendees...</Text>
      </View>
    )
  }

  if (attendees.length === 0) {
    return (
      <View style={st.center}>
        <Text style={[st.emptyTitle, { color: colors.textPrimary }]}>No attendees yet</Text>
        <Text style={[st.emptySub, { color: colors.textHint }]}>Be the first to join this event</Text>
      </View>
    )
  }

  const total   = attendeeCount || attendees.length
  const visible = attendees.slice(0, page * PAGE)
  const hasMore = visible.length < attendees.length

  return (
    <View style={st.wrap}>
      {/* Count header */}
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <Text style={[st.headerTxt, { color: colors.textPrimary }]}>
          {total} {total === 1 ? 'person' : 'people'} going
        </Text>
      </View>

      {/* Avatar stack preview */}
      {attendees.length > 0 && (
        <View style={[st.stackRow, { borderBottomColor: colors.border }]}>
          <View style={st.stack}>
            {attendees.slice(0, 6).map((a, i) => (
              <View key={a.id} style={[st.stackAvatar, { left: i * 20, zIndex: 6 - i, borderColor: colors.surface }]}>
                {a.avatar
                  ? <Image source={{ uri: a.avatar }} style={st.stackImg} />
                  : <View style={[st.stackPlaceholder, { backgroundColor: colors.primary + '33' }]}>
                      <Text style={[st.stackInitials, { color: colors.primary }]}>
                        {(a.nickname || a.name || 'G').slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                }
              </View>
            ))}
          </View>
          {total > 6 && (
            <Text style={[st.moreCount, { color: colors.textSecondary, marginLeft: 6 * 20 + 16 }]}>
              +{total - 6} more
            </Text>
          )}
        </View>
      )}

      {/* Full list */}
      {visible.map((a, i) => (
        <AttendeeRow
          key={a.id}
          attendee={a}
          index={i}
          onPress={onPressAttendee}
          colors={colors}
        />
      ))}

      {/* Load more */}
      {hasMore && (
        <TouchableOpacity
          style={[st.loadMore, { borderColor: colors.border }]}
          onPress={() => setPage(p => p + 1)}
        >
          <Text style={[st.loadMoreTxt, { color: colors.primary }]}>
            Show more — {attendees.length - visible.length} remaining
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const ar = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  avatarWrap:{ width: 40, height: 40, borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatar:    { width: 40, height: 40, borderRadius: 20 },
  initials:  { fontSize: 15, fontWeight: '800' },
  verBadge:  { position: 'absolute', bottom: -1, right: -1, width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  verTxt:    { color: '#fff', fontSize: 8, fontWeight: '900' },
  info:      { flex: 1, marginLeft: 12 },
  name:      { fontSize: 14, fontWeight: '700' },
  verLabel:  { fontSize: 11, fontWeight: '600', marginTop: 1 },
  num:       { fontSize: 12, marginRight: 8 },
  arrow:     { fontSize: 20 },
})

const st = StyleSheet.create({
  wrap:       { paddingBottom: 16 },
  center:     { paddingVertical: 32, alignItems: 'center', gap: 8 },
  loadingTxt: { fontSize: 13 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptySub:   { fontSize: 13 },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTxt:  { fontSize: 15, fontWeight: '800' },
  stackRow:   { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center' },
  stack:      { position: 'relative', height: 36 },
  stackAvatar:{ position: 'absolute', width: 36, height: 36, borderRadius: 18, borderWidth: 2, overflow: 'hidden' },
  stackImg:   { width: '100%', height: '100%' },
  stackPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  stackInitials:    { fontSize: 14, fontWeight: '800' },
  moreCount:  { fontSize: 13, fontWeight: '600', position: 'absolute' },
  loadMore:   { margin: 16, borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  loadMoreTxt:{ fontSize: 13, fontWeight: '700' },
})
