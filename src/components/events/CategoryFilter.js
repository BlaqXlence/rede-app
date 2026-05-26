import React from 'react'
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native'
import useThemeStore from '../../store/themeStore'
import { EVENT_CATEGORIES } from '../../constants/config'

export default function CategoryFilter({ selected, onSelect }) {
  const { colors } = useThemeStore()
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {EVENT_CATEGORIES.map(cat => {
        const active = selected === cat.id
        const accent = cat.id === 'all' ? colors.primary : (colors.cat[cat.id] || colors.primary)
        return (
          <TouchableOpacity
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            style={[
              styles.chip,
              { backgroundColor: active ? accent : colors.surface, borderColor: active ? accent : colors.border }
            ]}
            activeOpacity={0.75}
          >
            <Text style={[styles.label, { color: active ? '#fff' : colors.textSecondary }]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  chip: { borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 7 },
  label: { fontSize: 13, fontWeight: '600' },
})
