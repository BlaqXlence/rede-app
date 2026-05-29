/**
 * AttendeesSection.js
 * Loads cached attendees instantly, refreshes in background.
 * Attendee count badge updates when user joins/leaves.
 */
import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import AsyncStorage  from '@react-native-async-storage/async-storage'
import useThemeStore from '../../store/themeStore'
import Avatar        from '../common/Avatar'
import { eventsApi } from '../../services/api'

function cacheKey(id) { return `rede:attendees:${id}` }

export default function AttendeesSection({ eventId, attendeeCount }) {
  const { colors }                  = useThemeStore()
  const [attendees,  setAttendees]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    async function load() {
      // Step 1: show cache instantly
      try {
        const cached = await AsyncStorage.getItem(cacheKey(eventId))
        if (cached && mounted.current) {
          setAttendees(JSON.parse(cached))
          setLoading(false)
        }
      } catch {}

      // Step 2: fetch fresh
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
      <Text style={[st.empty, { color: colors.textHint }]}>
        No one has joined yet. Be the first! 🎉
      </Text>
    )
  }

  return (
    <View style={st.wrap}>
      <Text style={[st.count, { color: colors.textSecondary }]}>
        {attendeeCount || attendees.length} going
      </Text>
      <View style={st.grid}>
        {attendees.map(a => (
          <View key={a.id} style={st.person}>
            <Avatar uri={a.avatar} name={a.name} size={44} />
            <Text style={[st.name, { color: colors.textSecondary }]} numberOfLines={1}>
              {a.name || 'Guest'}
            </Text>
            {a.verified && (
              <Text style={[st.badge, { color: colors.primary }]}>✓</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  )
}

const st = StyleSheet.create({
  center: { paddingVertical: 20, alignItems: 'center' },
  empty:  { fontSize: 13, paddingVertical: 16, textAlign: 'center' },
  wrap:   { paddingVertical: 8 },
  count:  { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
  grid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  person: { alignItems: 'center', width: 60 },
  name:   { fontSize: 11, marginTop: 5, textAlign: 'center', width: 60 },
  badge:  { fontSize: 10, marginTop: 1 },
})
