/**
 * CategoryFilter.js
 *
 * Horizontally scrollable category chips.
 * Fixed height so they never get cut. Consistent sizing.
 * Active chip fills with category accent colour.
 */
import React from 'react'
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native'
import useThemeStore from '../../store/themeStore'
import { EVENT_CATEGORIES } from '../../constants/config'

export default function CategoryFilter({ selected, onSelect }) {
  const { colors } = useThemeStore()

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      // Give enough vertical space so chips never clip
      style={{ flexGrow: 0 }}
    >
      {EVENT_CATEGORIES.map(cat => {
        const active = selected === cat.id
        const accent = cat.id === 'all' ? colors.primary : (colors.cat[cat.id] || colors.primary)

        return (
          <TouchableOpacity
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? accent : colors.surface,
                borderColor:     active ? accent : colors.border,
              }
            ]}
            activeOpacity={0.75}
          >
            <Text
              style={[styles.label, { color: active ? '#fff' : colors.textSecondary }]}
              numberOfLines={1}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingVertical:   12,
    gap:               8,
    alignItems:        'center',
  },
  chip: {
    height:          36,
    borderRadius:    18,
    borderWidth:     1.5,
    paddingHorizontal: 16,
    justifyContent:  'center',
    alignItems:      'center',
  },
  label: {
    fontSize:   13,
    fontWeight: '600',
  },
})
