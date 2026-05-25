/**
 * CitySelector.js
 * Modal that shows all major Uganda cities.
 * Tapping a city updates the location and reloads events.
 * Like Biglion's city selector.
 */
import React from 'react'
import {
  View, Text, TouchableOpacity, Modal,
  ScrollView, StyleSheet, TouchableWithoutFeedback,
} from 'react-native'
import colors from '../../constants/colors'
import { UGANDA_CITIES } from '../../constants/config'

export default function CitySelector({ visible, currentCity, onSelect, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        {/* Handle bar */}
        <View style={styles.handle} />

        <Text style={styles.heading}>Choose City</Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          {UGANDA_CITIES.map(city => {
            const active = currentCity?.id === city.id
            return (
              <TouchableOpacity
                key={city.id}
                style={[styles.cityRow, active && styles.cityRowActive]}
                onPress={() => { onSelect(city); onClose() }}
                activeOpacity={0.7}
              >
                <Text style={styles.cityPin}>📍</Text>
                <Text style={[styles.cityName, active && styles.cityNameActive]}>
                  {city.name}
                </Text>
                {active && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 40, maxHeight: '75%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center', marginTop: 12, marginBottom: 8,
  },
  heading: {
    fontSize: 17, fontWeight: '800', color: colors.textPrimary,
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  cityRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
    gap: 12,
  },
  cityRowActive: {
    backgroundColor: colors.primaryFaint,
  },
  cityPin: { fontSize: 16 },
  cityName: { flex: 1, fontSize: 16, color: colors.textPrimary, fontWeight: '500' },
  cityNameActive: { color: colors.primary, fontWeight: '700' },
  checkmark: { fontSize: 16, color: colors.primary, fontWeight: '700' },
})
