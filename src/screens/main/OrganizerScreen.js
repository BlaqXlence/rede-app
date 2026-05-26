/**
 * OrganizerScreen.js
 * Tap an organizer name → see their profile, all events, avg rating.
 * Builds trust — good organizers get exposed, bad ones get called out.
 */
import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore from '../../store/themeStore'
import Avatar        from '../../components/common/Avatar'
import EventCard     from '../../components/events/EventCard'
import { authApi }   from '../../services/api'

export default function OrganizerScreen({ navigation, route }) {
  const { organizerId } = route.params
  const { colors }      = useThemeStore()
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
    navigation.navigate('EventDetail', { eventId: event.id, event })
  }

  const upcoming = data?.events?.filter(e => new Date(e.end_time || e.endTime) > new Date()) || []
  const past     = data?.events?.filter(e => new Date(e.end_time || e.endTime) <= new Date()) || []

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.back, { color: colors.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>Organizer</Text>
        <View style={{ width: 30 }} />
      </View>

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
          {/* Profile card */}
          <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
            <Avatar uri={data.organizer.avatar} name={data.organizer.name} size={72} />
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: colors.textPrimary }]}>
                  {data.organizer.name}
                </Text>
                {data.organizer.verified && (
                  <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.verifiedTxt}>✓ Verified</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.joinDate, { color: colors.textHint }]}>
                Organiser since {new Date(data.organizer.joinedAt).getFullYear()}
              </Text>
            </View>
          </View>

          {/* Stats */}
          <View style={[styles.statsRow, { backgroundColor: colors.surface }]}>
            <Stat label="Events"   value={data.totalEvents} colors={colors} />
            <View style={[styles.statLine, { backgroundColor: colors.border }]} />
            <Stat label="Avg Rating" value={data.avgRating ? `${data.avgRating} ★` : '—'} colors={colors} />
            <View style={[styles.statLine, { backgroundColor: colors.border }]} />
            <Stat label="Upcoming" value={upcoming.length} colors={colors} />
          </View>

          {/* Upcoming events */}
          {upcoming.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Upcoming Events
              </Text>
              <View style={styles.grid}>
                {upcoming.map(e => (
                  <EventCard key={e.id} event={e} onPress={openEvent} style={{ marginBottom: 10 }} />
                ))}
              </View>
            </View>
          )}

          {/* Past events */}
          {past.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Past Events
              </Text>
              <View style={styles.grid}>
                {past.slice(0, 6).map(e => (
                  <EventCard key={e.id} event={e} onPress={openEvent} style={{ marginBottom: 10, opacity: 0.7 }} />
                ))}
              </View>
            </View>
          )}

          {data.totalEvents === 0 && (
            <View style={styles.center}>
              <Text style={{ color: colors.textHint, marginTop: 20 }}>No events yet</Text>
            </View>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      )}
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
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  back:    { fontSize: 22, fontWeight: '700' },
  heading: { fontSize: 17, fontWeight: '800' },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, padding: 16, marginBottom: 12,
  },
  profileInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontSize: 19, fontWeight: '800' },
  verifiedBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  verifiedTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  joinDate: { fontSize: 13, marginTop: 3 },
  statsRow: {
    flexDirection: 'row', borderRadius: 14, padding: 14,
    marginBottom: 16, alignItems: 'center',
  },
  statLine: { width: 1, height: 30 },
  section: { marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
})
