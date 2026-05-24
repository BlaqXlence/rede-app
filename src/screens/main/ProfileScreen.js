import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import colors from '../../constants/colors'
import useAuthStore from '../../store/authStore'
import useEventsStore from '../../store/eventsStore'
import Avatar from '../../components/common/Avatar'
import EventCard from '../../components/events/EventCard'

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuthStore()
  const { events, attending } = useEventsStore()

  const myEvents = events.filter(e => e.organizer?.id === user?.id)
  const attendingEvents = events.filter(e => attending.includes(e.id))

  function openEvent(event) {
    navigation.navigate('EventDetail', { eventId: event.id })
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
        {/* Header */}
        <View style={styles.profileCard}>
          <View style={styles.topRow}>
            <Avatar uri={user.avatar} name={user.name} size={72} />
            <TouchableOpacity style={styles.settingsBtn}>
              <Text style={styles.settingsText}>Settings</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.phone}>{user.phone}</Text>
          {user.email ? <Text style={styles.email}>{user.email}</Text> : null}

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{myEvents.length}</Text>
              <Text style={styles.statLabel}>Created</Text>
            </View>
            <View style={styles.statLine} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{attendingEvents.length}</Text>
              <Text style={styles.statLabel}>Attending</Text>
            </View>
          </View>
        </View>

        {/* My Events */}
        {myEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Events</Text>
            <View style={styles.grid}>
              {myEvents.map(e => <EventCard key={e.id} event={e} onPress={openEvent} />)}
            </View>
          </View>
        )}

        {/* Attending */}
        {attendingEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attending</Text>
            <View style={styles.grid}>
              {attendingEvents.map(e => <EventCard key={e.id} event={e} onPress={openEvent} />)}
            </View>
          </View>
        )}

        {/* Settings menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menu}>
            {[
              { label: 'Edit Profile', onPress: () => {} },
              { label: 'Notifications', value: 'On', onPress: () => {} },
              { label: 'Help & Support', onPress: () => {} },
            ].map((item, i) => (
              <TouchableOpacity key={i} style={styles.menuRow} onPress={item.onPress}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                {item.value && <Text style={styles.menuValue}>{item.value}</Text>}
                <Text style={styles.menuChevron}>›</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.menuRow} onPress={handleLogout}>
              <Text style={[styles.menuLabel, { color: colors.error }]}>Sign Out</Text>
              <Text style={[styles.menuChevron, { color: colors.error }]}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.version}>REDE v1.0 · Made in Uganda 🇺🇬</Text>
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  profileCard: { backgroundColor: colors.surface, padding: 20, marginBottom: 8 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  settingsBtn: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  settingsText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  name: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  phone: { fontSize: 14, color: colors.primary, fontWeight: '600', marginTop: 3 },
  email: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  stats: { flexDirection: 'row', alignItems: 'center', marginTop: 16, backgroundColor: colors.surfaceHigh, borderRadius: 12, padding: 14 },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  statLine: { width: 1, height: 36, backgroundColor: colors.border },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  menu: { backgroundColor: colors.surface, borderRadius: 14, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.divider },
  menuLabel: { flex: 1, fontSize: 15, color: colors.textPrimary },
  menuValue: { fontSize: 14, color: colors.textSecondary, marginRight: 6 },
  menuChevron: { fontSize: 20, color: colors.textHint },
  version: { textAlign: 'center', fontSize: 12, color: colors.textHint, marginTop: 24 },
})
