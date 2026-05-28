/**
 * FilterModal.js
 *
 * Single filter button opens this sheet.
 * Contains:
 * - Categories (replaces the home page chip row)
 * - When: Today / Weekend / This Week
 * - Price: Free / Paid
 *
 * Keeps the home page header clean and uncluttered.
 */
import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, Modal,
  StyleSheet, TouchableWithoutFeedback, ScrollView,
} from 'react-native'
import useThemeStore from '../../store/themeStore'
import { EVENT_CATEGORIES } from '../../constants/config'

const WHEN_OPTIONS  = ['All time', 'Today', 'Weekend', 'This Week']
const PRICE_OPTIONS = ['Any price', 'Free only', 'Paid only']

export default function FilterModal({ visible, onClose, filters, onApply }) {
  const { colors } = useThemeStore()

  const [category, setCategory] = useState(filters.category || 'all')
  const [when,     setWhen]     = useState(filters.when     || 'All time')
  const [price,    setPrice]    = useState(filters.price    || 'Any price')

  function handleApply() {
    onApply({ category, when, price })
    onClose()
  }

  function handleClear() {
    setCategory('all')
    setWhen('All time')
    setPrice('Any price')
    onApply({ category: 'all', when: 'All time', price: 'Any price' })
    onClose()
  }

  const isActive = category !== 'all' || when !== 'All time' || price !== 'Any price'

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Filter Events</Text>
          {isActive && (
            <TouchableOpacity onPress={handleClear}>
              <Text style={[styles.clearTxt, { color: colors.error }]}>Clear all</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>

          {/* Category */}
          <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>Category</Text>
          <View style={styles.chips}>
            {EVENT_CATEGORIES.map(cat => {
              const active = category === cat.id
              const accent = cat.id === 'all' ? colors.primary : (colors.cat[cat.id] || colors.primary)
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setCategory(cat.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? accent : colors.surfaceHigh,
                      borderColor:     active ? accent : colors.border,
                    }
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipTxt, { color: active ? '#fff' : colors.textSecondary }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* When */}
          <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>When</Text>
          <View style={styles.chips}>
            {WHEN_OPTIONS.map(opt => {
              const active = when === opt
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setWhen(opt)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.primary : colors.surfaceHigh,
                      borderColor:     active ? colors.primary : colors.border,
                    }
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipTxt, { color: active ? '#fff' : colors.textSecondary }]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Price */}
          <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>Price</Text>
          <View style={styles.chips}>
            {PRICE_OPTIONS.map(opt => {
              const active = price === opt
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setPrice(opt)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.primary : colors.surfaceHigh,
                      borderColor:     active ? colors.primary : colors.border,
                    }
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipTxt, { color: active ? '#fff' : colors.textSecondary }]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </ScrollView>

        {/* Apply */}
        <TouchableOpacity
          style={[styles.applyBtn, { backgroundColor: colors.primary }]}
          onPress={handleApply}
          activeOpacity={0.88}
        >
          <Text style={styles.applyTxt}>Show Events</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: 20, paddingBottom: 40,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 16,
  },
  title:    { fontSize: 18, fontWeight: '800' },
  clearTxt: { fontSize: 14, fontWeight: '600' },
  groupLabel: {
    fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: 10, marginTop: 6,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: {
    borderRadius: 20, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  chipTxt: { fontSize: 13, fontWeight: '600' },
  applyBtn: {
    borderRadius: 12, paddingVertical: 15,
    alignItems: 'center', marginTop: 8,
  },
  applyTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
