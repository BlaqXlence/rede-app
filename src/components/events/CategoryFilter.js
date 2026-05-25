import React from 'react'
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native'
import colors from '../../constants/colors'
import { EVENT_CATEGORIES } from '../../constants/config'

export default function CategoryFilter({ selected, onSelect }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {EVENT_CATEGORIES.map(cat => {
        const active = selected === cat.id
        const accent = cat.id === 'all' ? colors.primary : (colors.cat[cat.id] || colors.primary)
        return (
          <TouchableOpacity
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            style={[styles.chip, active && { backgroundColor: accent, borderColor: accent }]}
            activeOpacity={0.75}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{cat.label}</Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  chip: {
    borderRadius: 20, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 7,
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  labelActive: { color: '#fff' },
})
