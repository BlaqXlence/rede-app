import React, { useState, useMemo } from 'react'
import {
  View, Text, Modal, TextInput, Pressable,
  StyleSheet, ScrollView, SafeAreaView, Platform,
} from 'react-native'
import useThemeStore from '../../store/themeStore'
import { UGANDA_CITIES } from '../../constants/ugandaLocations'

export default function CitySelector({ visible, currentCity, onSelect, onClose }) {
  const { colors }        = useThemeStore()
  const [query, setQuery] = useState('')

  const ALL = { id: 'all', name: 'All Cities' }

  const filtered = useMemo(() => {
    const list = [ALL, ...UGANDA_CITIES]
    if (!query.trim()) return list
    return list.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
  }, [query])

  function handleSelect(city) { onSelect(city); onClose(); setQuery('') }
  function handleClose()      { onClose(); setQuery('') }

  const isActive = c =>
    c.id === 'all'
      ? !currentCity || currentCity.id === 'all'
      : currentCity?.id === c.id

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>

        {/* Header */}
        <View style={[s.header, { borderBottomColor: colors.border }]}>
          <Text style={[s.title, { color: colors.textPrimary }]}>Select city</Text>
          <Pressable onPress={handleClose} style={s.cancelBtn}
            android_ripple={{ color: colors.border, borderless: true }}>
            <Text style={[s.cancelTxt, { color: colors.primary }]}>Cancel</Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={[s.searchWrap, { backgroundColor: colors.background }]}>
          <View style={[s.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.searchIcon, { color: colors.textHint }]}>⌕</Text>
            <TextInput
              style={[s.searchInput, { color: colors.textPrimary }]}
              value={query}
              onChangeText={setQuery}
              placeholder="Search city"
              placeholderTextColor={colors.textHint}
              autoCorrect={false}
              underlineColorAndroid="transparent"
              selectionColor={colors.primary}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Text style={[s.clearBtn, { color: colors.textHint }]}>✕</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* List */}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <View>
            {filtered.length === 0 ? (
              <View style={s.emptyWrap}>
                <Text style={[s.emptyTxt, { color: colors.textHint }]}>No cities found</Text>
              </View>
            ) : filtered.map(city => {
              const active = isActive(city)
              return (
                <Pressable
                  key={city.id}
                  style={[s.row, { borderBottomColor: colors.border }]}
                  onPress={() => handleSelect(city)}
                  android_ripple={{ color: colors.primary + '18' }}
                >
                  <Text style={[s.cityName, {
                    color:      active ? colors.primary : colors.textPrimary,
                    fontWeight: active ? '800' : '400',
                  }]}>
                    {city.name}
                  </Text>
                  {active && <Text style={[s.check, { color: colors.primary }]}>✓</Text>}
                </Pressable>
              )
            })}
          </View>
        </ScrollView>

      </SafeAreaView>
    </Modal>
  )
}

const s = StyleSheet.create({
  safe:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  title:      { fontSize: 20, fontWeight: '800' },
  cancelBtn:  { paddingVertical: 4, paddingHorizontal: 4 },
  cancelTxt:  { fontSize: 16 },
  searchWrap: { paddingHorizontal: 16, paddingVertical: 12 },
  searchBox:  { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 10 : 8, gap: 8 },
  searchIcon: { fontSize: 18 },
  searchInput:{ flex: 1, fontSize: 16 },
  clearBtn:   { fontSize: 14, paddingHorizontal: 4 },
  row:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: StyleSheet.hairlineWidth },
  cityName:   { flex: 1, fontSize: 17 },
  check:      { fontSize: 18, fontWeight: '800' },
  emptyWrap:  { paddingTop: 40, alignItems: 'center' },
  emptyTxt:   { fontSize: 15 },
})
