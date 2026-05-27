/**
 * AttendeesSection.js
 * Shows who is going to an event.
 * Live count + avatar list.
 */
import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import useThemeStore from '../../store/themeStore'
import Avatar        from '../common/Avatar'
import { eventsApi } from '../../services/api'

export default function AttendeesSection({ eventId, attendeeCount }) {
  const { colors }    = useThemeStore()
  const [list, setList]     = useState([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => { load() }, [eventId])

  async function load() {
    try {
      const data = await eventsApi.attendees(eventId)
      setList(data.attendees || [])
    } catch {}
    finally { setLoading(false) }
  }

  const shown = showAll ? list : list.slice(0, 12)

  if (loading) return <ActivityIndicator size="small" color={colors.primary} />

  return (
    <View style={styles.wrapper}>
      {/* Count header */}
      <Text style={[styles.count, { color: colors.textPrimary }]}>
        {attendeeCount > 0
          ? `${attendeeCount} ${attendeeCount === 1 ? 'person' : 'people'} going`
          : 'No one yet — be the first!'}
      </Text>

      {/* Avatar grid */}
      {list.length > 0 && (
        <View style={styles.grid}>
          {shown.map(a => (
            <View key={a.id} style={styles.person}>
              <Avatar uri={a.avatar} name={a.name} size={44} />
              <Text style={[styles.personName, { color: colors.textSecondary }]} numberOfLines={1}>
                {a.name?.split(' ')[0] || 'User'}
              </Text>
              {a.verified && (
                <Text style={[styles.verified, { color: colors.primary }]}>✓</Text>
              )}
            </View>
          ))}

          {/* Show more */}
          {list.length > 12 && !showAll && (
            <TouchableOpacity style={styles.person} onPress={() => setShowAll(true)}>
              <View style={[styles.moreCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.moreText, { color: colors.primary }]}>
                  +{list.length - 12}
                </Text>
              </View>
              <Text style={[styles.personName, { color: colors.textHint }]}>more</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {list.length === 0 && (
        <Text style={[styles.emptyTxt, { color: colors.textHint }]}>
          Join this event and be the first!
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 8 },
  count:   { fontSize: 15, fontWeight: '700', marginBottom: 14 },
  grid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  person:  { alignItems: 'center', width: 56 },
  personName: { fontSize: 11, marginTop: 4, textAlign: 'center', width: 56 },
  verified:   { fontSize: 10, marginTop: 1 },
  moreCircle: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  moreText:  { fontSize: 13, fontWeight: '700' },
  emptyTxt:  { fontSize: 13 },
})
