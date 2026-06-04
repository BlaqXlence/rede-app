import React, { useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  Image, Pressable, ActivityIndicator,
  Dimensions, RefreshControl,
} from 'react-native'
import { SafeAreaView }        from 'react-native-safe-area-context'
import useThemeStore           from '../../store/themeStore'
import useNotificationStore    from '../../store/notificationStore'
import BackButton              from '../../components/common/BackButton'
import { clearBadge }          from '../../services/notifications'

const { width } = Dimensions.get('window')

// ── Notification type config ──────────────────────────────────
const TYPE = {
  join:        { icon: '●', color: '#22C55E', label: 'Attendee' },
  leave:       { icon: '●', color: '#F59E0B', label: 'Left'     },
  cancel:      { icon: '●', color: '#EF4444', label: 'Cancelled'},
  update:      { icon: '●', color: '#3B82F6', label: 'Updated'  },
  comment:     { icon: '●', color: '#8B5CF6', label: 'Comment'  },
  reminder_1h: { icon: '●', color: '#FF6600', label: 'Soon'     },
  reminder_24h:{ icon: '●', color: '#FF6600', label: 'Tomorrow' },
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m    = Math.floor(diff / 60_000)
  if (m < 1)   return 'Just now'
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7)   return `${d}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function NotifCard({ notif, onPress, colors }) {
  const meta = TYPE[notif.type] || TYPE.update

  return (
    <Pressable
      onPress={() => onPress(notif)}
      android_ripple={{ color: colors.primary + '10' }}
      style={[nc.row, {
        borderBottomColor: colors.border,
        backgroundColor:   notif.read ? 'transparent' : colors.primary + '08',
      }]}
    >
      {/* Unread dot */}
      {!notif.read && (
        <View style={[nc.unreadDot, { backgroundColor: colors.primary }]} />
      )}

      {/* Event image or type icon */}
      <View style={[nc.iconWrap, { backgroundColor: meta.color + '18' }]}>
        {notif.cover_image ? (
          <Image source={{ uri: notif.cover_image }} style={nc.eventImg} resizeMode="cover" />
        ) : (
          <View style={[nc.typeDot, { backgroundColor: meta.color }]} />
        )}
      </View>

      {/* Text */}
      <View style={nc.content}>
        <View style={nc.topRow}>
          <View style={[nc.typePill, { backgroundColor: meta.color + '18' }]}>
            <Text style={[nc.typeLabel, { color: meta.color }]}>{meta.label.toUpperCase()}</Text>
          </View>
          <Text style={[nc.time, { color: colors.textHint }]}>{timeAgo(notif.created_at)}</Text>
        </View>
        <Text style={[nc.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {notif.title}
        </Text>
        <Text style={[nc.body, { color: colors.textSecondary }]} numberOfLines={2}>
          {notif.body}
        </Text>
      </View>
    </Pressable>
  )
}

function EmptyState({ colors }) {
  return (
    <View style={em.wrap}>
      <View style={[em.iconWrap, { backgroundColor: colors.surface }]}>
        <View style={[em.bell, { borderColor: colors.border }]}>
          <View style={[em.bellTop, { backgroundColor: colors.border }]} />
          <View style={[em.bellBody, { borderColor: colors.border }]} />
          <View style={[em.bellBase, { backgroundColor: colors.border }]} />
        </View>
      </View>
      <Text style={[em.title, { color: colors.textPrimary }]}>All caught up</Text>
      <Text style={[em.sub,   { color: colors.textHint }]}>
        Notifications about events you create or attend will appear here
      </Text>
    </View>
  )
}

export default function NotificationsScreen({ navigation }) {
  const { colors }                                       = useThemeStore()
  const { notifications, unread, loading, fetchNotifications, markAllRead, markRead } = useNotificationStore()

  useEffect(() => {
    fetchNotifications()
    clearBadge()
  }, [])

  function handlePress(notif) {
    markRead(notif.id)
    if (notif.event_id) {
      navigation.navigate('EventDetail', { eventId: notif.event_id })
    }
  }

  const onRefresh = useCallback(() => { fetchNotifications() }, [])

  // Group by date
  const grouped = notifications.reduce((acc, n) => {
    const d   = new Date(n.created_at)
    const now = new Date()
    let label = ''
    const diffDays = Math.floor((now - d) / 86_400_000)
    if (diffDays === 0)      label = 'Today'
    else if (diffDays === 1) label = 'Yesterday'
    else                     label = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
    if (!acc[label]) acc[label] = []
    acc[label].push(n)
    return acc
  }, {})

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>

      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <BackButton onPress={() => navigation.goBack()} variant="plain" />
        <Text style={[s.title, { color: colors.textPrimary }]}>Notifications</Text>
        {unread > 0 ? (
          <Pressable onPress={markAllRead} hitSlop={8}>
            <Text style={[s.markAll, { color: colors.primary }]}>Mark all read</Text>
          </Pressable>
        ) : (
          <View style={{ width: 72 }} />
        )}
      </View>

      {loading && notifications.length === 0 ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : notifications.length === 0 ? (
        <EmptyState colors={colors} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {Object.entries(grouped).map(([label, items]) => (
            <View key={label}>
              <View style={[s.dateLabel, { backgroundColor: colors.background }]}>
                <Text style={[s.dateTxt, { color: colors.textHint }]}>{label.toUpperCase()}</Text>
              </View>
              {items.map(n => (
                <NotifCard key={n.id} notif={n} onPress={handlePress} colors={colors} />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:      { flex: 1 },
  header:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  title:     { flex: 1, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  markAll:   { fontSize: 13, fontWeight: '700', width: 72, textAlign: 'right' },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dateLabel: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
  dateTxt:   { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
})

const nc = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12, position: 'relative' },
  unreadDot: { position: 'absolute', left: 4, top: '50%', width: 6, height: 6, borderRadius: 3 },
  iconWrap:  { width: 46, height: 46, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  eventImg:  { width: 46, height: 46 },
  typeDot:   { width: 14, height: 14, borderRadius: 7 },
  content:   { flex: 1 },
  topRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  typePill:  { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  typeLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  time:      { fontSize: 11 },
  title:     { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  body:      { fontSize: 12, lineHeight: 17 },
})

const em = StyleSheet.create({
  wrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  iconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  bell:     { width: 32, height: 36, alignItems: 'center' },
  bellTop:  { width: 8, height: 4, borderRadius: 4 },
  bellBody: { width: 26, height: 22, borderRadius: 13, borderWidth: 3, marginTop: 2 },
  bellBase: { width: 14, height: 4, borderRadius: 2, marginTop: 2 },
  title:    { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  sub:      { fontSize: 13, textAlign: 'center', lineHeight: 20 },
})
