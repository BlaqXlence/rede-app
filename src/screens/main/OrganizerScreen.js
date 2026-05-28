/**
 * OrganizerScreen.js
 * No static header — avatar and name IS the header.
 * Past and upcoming events clearly separated.
 */
import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore from '../../store/themeStore'
import Avatar        from '../../components/common/Avatar'
import EventCard     from '../../components/events/EventCard'
import { authApi }   from '../../services/api'

const { width } = Dimensions.get('window')
const MAX_W = Math.min(width, 500)

export default function OrganizerScreen({ navigation, route }) {
  const { organizerId }  = route.params
  const { colors }       = useThemeStore()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => { load() }, [organizerId])

  async function load() {
    try {
      const res = await authApi.getOrganizer(organizerId)
      setData(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function openEvent(event) {
    navigation.push('EventDetail', { eventId: event.id, event })
  }

  const now      = new Date()
  const upcoming = data?.events?.filter(e => new Date(e.endTime || e.end_time) > now) || []
  const past     = data?.events?.filter(e => new Date(e.endTime || e.end_time) <= now) || []

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.phone, { maxWidth: MAX_W }]}>

        {/* Minimal back arrow — no big header */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={[styles.backTxt, { color: colors.primary }]}>←</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={{ color: colors.error }}>{error}</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

            {/* Profile — avatar is the visual header */}
            <View style={styles.profileTop}>
              <Avatar uri={data.organizer.avatar} name={data.organizer.name} size={80} />
              <View style={styles.profileRight}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, { color: colors.textPrimary }]}>
                    {data.organizer.name}
                  </Text>
                  {data.organizer.verified && (
                    <View style={[styles.verBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.verTxt}>✓</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.since, { color: colors.textHint }]}>
                  Organiser since {new Date(data.organizer.joinedAt).getFullYear()}
                </Text>
                {!data.organizer.verified && (
                  <Text style={[styles.verNote, { color: colors.textHint }]}>
                    {data.totalEvents >= 3
                      ? 'Verification pending'
                      : `${3 - data.totalEvents} more events to get verified`}
                  </Text>
                )}
              </View>
            </View>

            {/* Stats */}
            <View style={[styles.stats, { backgroundColor: colors.surface }]}>
              <Stat label="Events"   value={data.totalEvents}                                     colors={colors} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Stat label="Rating"   value={data.avgRating ? `${data.avgRating} ★` : '—'}        colors={colors} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Stat label="Upcoming" value={upcoming.length}                                      colors={colors} />
            </View>

            {/* Upcoming events */}
            {upcoming.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Upcoming
                </Text>
                <View style={styles.grid}>
                  {upcoming.map(e => (
                    <EventCard key={e.id} event={e} onPress={openEvent} style={{ marginBottom: 12 }} />
                  ))}
                </View>
              </View>
            )}

            {/* Past events */}
            {past.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Past</Text>
                <View style={styles.grid}>
                  {past.slice(0, 6).map(e => (
                    <EventCard key={e.id} event={e} onPress={openEvent} style={{ marginBottom: 12, opacity: 0.7 }} />
                  ))}
                </View>
              </View>
            )}

            {data.totalEvents === 0 && (
              <View style={styles.center}>
                <Text style={{ color: colors.textHint, marginTop: 32 }}>No events yet</Text>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  )
}

function Stat({ label, value, colors }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: '900', color: colors.primary }}>{value}</Text>
      <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe:    { flex: 1, alignItems: 'center' },
  phone:   { flex: 1, width: '100%' },
  backBtn: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  backTxt: { fontSize: 22, fontWeight: '700' },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingTop: 8 },

  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  profileRight: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
  name:    { fontSize: 20, fontWeight: '800' },
  verBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  verTxt:   { color: '#fff', fontSize: 11, fontWeight: '700' },
  since:    { fontSize: 13 },
  verNote:  { fontSize: 12, marginTop: 3, fontStyle: 'italic' },

  stats:   { flexDirection: 'row', borderRadius: 14, padding: 16, marginBottom: 20, alignItems: 'center' },
  divider: { width: 1, height: 30 },

  section:      { marginBottom: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
})
