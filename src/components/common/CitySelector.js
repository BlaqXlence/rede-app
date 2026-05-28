import React from 'react'
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, TouchableWithoutFeedback } from 'react-native'
import useThemeStore from '../../store/themeStore'
import { UGANDA_CITIES } from '../../constants/config'

export default function CitySelector({ visible, currentCity, onSelect, onClose, cities }) {
  const { colors } = useThemeStore()
  const cityList = cities || UGANDA_CITIES
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <Text style={[styles.heading, { color: colors.textPrimary, borderBottomColor: colors.border }]}>Choose City</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {cityList.map(city => {
            const active = currentCity?.id === city.id
            return (
              <TouchableOpacity
                key={city.id}
                style={[styles.row, { borderBottomColor: colors.divider, backgroundColor: active ? colors.primaryFaint : 'transparent' }]}
                onPress={() => { onSelect(city); onClose() }}
                activeOpacity={0.7}
              >
                <Text style={styles.pin}>📍</Text>
                <Text style={[styles.cityName, { color: active ? colors.primary : colors.textPrimary }]}>{city.name}</Text>
                {active && <Text style={[styles.check, { color: colors.primary }]}>✓</Text>}
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40, maxHeight: '75%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  heading: { fontSize: 17, fontWeight: '800', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, gap: 12 },
  pin: { fontSize: 16 },
  cityName: { flex: 1, fontSize: 16, fontWeight: '500' },
  check: { fontSize: 16, fontWeight: '700' },
})
