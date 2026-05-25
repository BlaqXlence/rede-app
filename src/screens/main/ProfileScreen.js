/**
 * ProfileScreen.js
 * Clean profile with stats, created events, attending, settings.
 */
import React from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import colors from '../../constants/colors'
import useAuthStore from '../../store/authStore'
import useEventsStore from '../../store/eventsStore'
import Avatar from '../../components/common/Avatar'
import EventCard from '../../components/events/EventCard'

function StatBox({ label, value }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function MenuRow({ label, value, onPress, danger }) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.menuLabel, danger && styles.danger]}>{label}</Text>
      {value ? <Text style={styles.menuValue}>{value}</Text> : null}
      <Text style={[styles.menuChev, danger && styles.danger]}>›</Text>
    </TouchableOpacity>
  )
}

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuthStore()
  const { events, attending } = useEventsStore()

  const myEvents        = events.filter(e => e.organizer?.id === user?.id)
  const attendingEvents = events.filter(e => attending.includes(e.id))

  function openEvent(event) {
    navigation.navigate('EventDetail', { eventId: event.id, event })
  }

  function handleLogout() {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ])
  }

  if (!user) return null

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <Avatar uri={user.avatar} name={user.name || user.phone} size={70} />
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{user.name || 'Complete your profile'}</Text>
              <Text style={styles.phone}>{user.phone}</Text>
              {user.email ? <Text style={styles.email}>{user.email}</Text> : null}
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatBox label="Created" value={myEvents.length} />
            <View style={styles.statDivider} />
            <StatBox label="Attending" value={attendingEvents.length} />
            <View style={styles.statDivider} />
            <StatBox label="Reviews" value={0} />
          </View>
        </View>

        {/* My Events */}
        {myEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Events</Text>
            <View style={styles.grid}>
              {myEvents.map(e => (
                <EventCard key={e.id} event={e} onPress={openEvent} />
              ))}
            </View>
          </View>
        )}

        {/* Attending */}
        {attendingEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attending</Text>
            <View style={styles.grid}>
              {attendingEvents.map(e => (
                <EventCard key={e.id} event={e} onPress={openEvent} />
              ))}
            </View>
          </View>
        )}

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            <MenuRow label="Edit Profile"    onPress={() => {}} />
            <MenuRow label="My Interests"    onPress={() => {}} />
            <MenuRow label="Notifications"   value="On" onPress={() => {}} />
            <MenuRow label="Help & Support"  onPress={() => {}} />
            <MenuRow label="Sign Out"        onPress={handleLogout} danger />
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  profileCard: {
    backgroundColor: colors.surface,
    padding: 20, marginBottom: 8,
  },
  profileTop: {
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16,
  },
  profileInfo: { flex: 1 },
  name: { fontSize: 19, fontWeight: '800', color: colors.textPrimary },
  phone: { fontSize: 14, color: colors.primary, fontWeight: '600', marginTop: 3 },
  email: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceHigh, borderRadius: 12, padding: 12,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },

  section: { paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: {
    fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 12,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  menuCard: {
    backgroundColor: colors.surface, borderRadius: 14, overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  menuLabel: { flex: 1, fontSize: 15, color: colors.textPrimary },
  menuValue: { fontSize: 14, color: colors.textSecondary, marginRight: 6 },
  menuChev: { fontSize: 20, color: colors.textHint },
  danger: { color: colors.error },
})
