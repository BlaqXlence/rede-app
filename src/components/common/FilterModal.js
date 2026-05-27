/**
 * FilterModal.js
 *
 * A bottom sheet with all filters:
 * - Date: Today / Weekend / This Week
 * - Price: Free / Paid
 *
 * Opened by a single filter button in the header.
 * Keeps the home screen clean.
 */
import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, Modal,
  StyleSheet, TouchableWithoutFeedback,
} from 'react-native'
import useThemeStore from '../../store/themeStore'

const DATE_OPTIONS  = ['All', 'Today', 'Weekend', 'This Week']
const PRICE_OPTIONS = ['All prices', 'Free', 'Paid']

export default function FilterModal({ visible, onClose, dateFilter, priceFilter, onApply }) {
  const { colors } = useThemeStore()

  // Local state so changes only apply when user taps Apply
  const [localDate,  setLocalDate]  = useState(dateFilter)
  const [localPrice, setLocalPrice] = useState(priceFilter)

  function handleApply() {
    onApply(localDate, localPrice)
    onClose()
  }

  function handleClear() {
    setLocalDate('All')
    setLocalPrice('All prices')
    onApply('All', 'All prices')
    onClose()
  }

  const hasFilters = localDate !== 'All' || localPrice !== 'All prices'

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Filter Events</Text>
          {hasFilters && (
            <TouchableOpacity onPress={handleClear}>
              <Text style={[styles.clearBtn, { color: colors.error }]}>Clear all</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Date filter */}
        <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>When</Text>
        <View style={styles.optionRow}>
          {DATE_OPTIONS.map(opt => {
            const active = localDate === opt
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => setLocalDate(opt)}
                style={[
                  styles.option,
                  {
                    backgroundColor: active ? colors.primary : colors.surfaceHigh,
                    borderColor:     active ? colors.primary : colors.border,
                  }
                ]}
                activeOpacity={0.8}
              >
                <Text style={[styles.optionTxt, { color: active ? '#fff' : colors.textSecondary }]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Price filter */}
        <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>Price</Text>
        <View style={styles.optionRow}>
          {PRICE_OPTIONS.map(opt => {
            const active = localPrice === opt
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => setLocalPrice(opt)}
                style={[
                  styles.option,
                  {
                    backgroundColor: active ? colors.primary : colors.surfaceHigh,
                    borderColor:     active ? colors.primary : colors.border,
                  }
                ]}
                activeOpacity={0.8}
              >
                <Text style={[styles.optionTxt, { color: active ? '#fff' : colors.textSecondary }]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <TouchableOpacity
          style={[styles.applyBtn, { backgroundColor: colors.primary }]}
          onPress={handleApply}
          activeOpacity={0.88}
        >
          <Text style={styles.applyBtnTxt}>Show Events</Text>
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
  handle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800' },
  clearBtn:   { fontSize: 14, fontWeight: '600' },
  groupLabel: {
    fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 8, marginBottom: 20,
  },
  option: {
    borderRadius: 20, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  optionTxt: { fontSize: 13, fontWeight: '600' },
  applyBtn: {
    borderRadius: 12, paddingVertical: 15, alignItems: 'center',
  },
  applyBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
