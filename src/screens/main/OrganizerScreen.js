/**
 * OrganizerScreen.js
 * - Back arrow goes back to previous screen correctly
 * - Bottom nav always visible
 * - Proper camelCase data from API
 * - Verified badge logic: 3+ events with reviews
 */
import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore from '../../store/themeStore'
import Avatar        from '../../components/common/Avatar'
import EventCard     from '../../components/events/EventCard'
import BottomNav     from '../../components/common/BottomNav'
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
    // Navigate to event — back from there comes back HERE not home
    navigation.push('EventDetail', { eventId: event.id, event })
  }

  const now      = new Date()
  const upcoming = data?.events?.filter(e => new Date(e.endTime) > now) || []
  const past     = data?.events?.filter(e => new Date(e.endTime) <= now) || []

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.back, { color: colors.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>Organiser</Text>
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
                <Text style={[styles.name, { color: colors.textPrimary }]}>{data.organizer.name}</Text>
                {data.organizer.verified && (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.badgeTxt}>✓ Verified</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.joinDate, { color: colors.textHint }]}>
                Organiser since {new Date(data.organizer.joinedAt).getFullYear()}
              </Text>

              {/* Verification info */}
              {!data.organizer.verified && (
                <Text style={[styles.verifyNote, { color: colors.textHint }]}>
                  {data.totalEvents >= 3
                    ? 'Eligible for verification — pending review'
                    : `${3 - data.totalEvents} more event${3 - data.totalEvents > 1 ? 's' : ''} needed to get verified`}
                </Text>
              )}
            </View>
          </View>

          {/* Stats */}
          <View style={[styles.statsRow, { backgroundColor: colors.surface }]}>
            <Stat label="Events"   value={data.totalEvents}          colors={colors} />
            <View style={[styles.statLine, { backgroundColor: colors.border }]} />
            <Stat label="Avg Rating" value={data.avgRating ? `${data.avgRating} ★` : '—'} colors={colors} />
            <View style={[styles.statLine, { backgroundColor: colors.border }]} />
            <Stat label="Upcoming" value={upcoming.length}           colors={colors} />
          </View>

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Upcoming Events</Text>
              <View style={styles.grid}>
                {upcoming.map(e => (
                  <EventCard key={e.id} event={e} onPress={openEvent} style={{ marginBottom: 10 }} />
                ))}
              </View>
            </View>
          )}

          {/* Past */}
          {past.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Past Events</Text>
              <View style={styles.grid}>
                {past.slice(0, 6).map(e => (
                  <EventCard key={e.id} event={e} onPress={openEvent} style={{ marginBottom: 10, opacity: 0.75 }} />
                ))}
              </View>
            </View>
          )}

          {data.totalEvents === 0 && (
            <View style={styles.center}>
              <Text style={{ color: colors.textHint, marginTop: 20 }}>No events yet</Text>
            </View>
          )}

          <View style={{ height: 10 }} />
        </ScrollView>
      )}

      <BottomNav navigation={navigation} activeTab="" />
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  back: { fontSize: 22, fontWeight: '700' },
  heading: { fontSize: 17, fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16 },
  profileCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderRadius: 16, padding: 16, marginBottom: 12 },
  profileInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 },
  name: { fontSize: 18, fontWeight: '800' },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  joinDate: { fontSize: 13 },
  verifyNote: { fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  statsRow: { flexDirection: 'row', borderRadius: 14, padding: 14, marginBottom: 16, alignItems: 'center' },
  statLine: { width: 1, height: 30 },
  section: { marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
})
