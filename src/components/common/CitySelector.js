import React, { useState, useMemo } from 'react'
import {
  View, Text, Modal, TextInput, Pressable,
  StyleSheet, ScrollView, Platform, StatusBar,
  Dimensions, TouchableWithoutFeedback,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import useThemeStore from '../../store/themeStore'
import { UGANDA_CITIES } from '../../constants/ugandaLocations'

const { height: SCREEN_H } = Dimensions.get('window')
// Start the sheet lower — leave room at top so status bar is never covered
const SHEET_TOP = Platform.OS === 'android' ? 72 : 56

export default function CitySelector({ visible, currentCity, onSelect, onClose }) {
  const { colors }        = useThemeStore()
  const insets            = useSafeAreaInsets()
  const [query, setQuery] = useState('')

  const ALL = { id: 'all', name: 'All Uganda' }

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
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Tappable backdrop */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={[s.backdrop]} />
      </TouchableWithoutFeedback>

      {/* Sheet — starts below status bar, never covers it */}
      <View style={[s.sheet, {
        backgroundColor: colors.background,
        top: SHEET_TOP,
        paddingBottom: insets.bottom + 16,
      }]}>

        {/* Drag handle */}
        <View style={[s.handle, { backgroundColor: colors.border }]} />

        {/* Header row */}
        <View style={[s.header, { borderBottomColor: colors.border }]}>
          <Text style={[s.title, { color: colors.textPrimary }]}>Select city</Text>
          <Pressable
            onPress={handleClose}
            style={[s.cancelBtn, { backgroundColor: colors.surface }]}
            android_ripple={{ color: colors.primary + '20', borderless: false }}
          >
            <Text style={[s.cancelTxt, { color: colors.primary }]}>Cancel</Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={[s.searchWrap]}>
          <View style={[s.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[s.searchIconWrap]}>
              <Text style={[s.searchIconTxt, { color: colors.textHint }]}>⌕</Text>
            </View>
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
              <Pressable onPress={() => setQuery('')} hitSlop={10}>
                <Text style={[s.clearX, { color: colors.textHint }]}>✕</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* List */}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
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
                  style={[s.row, {
                    borderBottomColor: colors.border,
                    backgroundColor: active ? colors.primary + '0D' : 'transparent',
                  }]}
                  onPress={() => handleSelect(city)}
                  android_ripple={{ color: colors.primary + '18' }}
                >
                  <Text style={[s.cityName, {
                    color:      active ? colors.primary : colors.textPrimary,
                    fontWeight: active ? '800' : '400',
                  }]}>
                    {city.name}
                  </Text>
                  {active && (
                    <View style={[s.checkCircle, { backgroundColor: colors.primary }]}>
                      <Text style={s.checkTxt}>✓</Text>
                    </View>
                  )}
                </Pressable>
              )
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:        { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  handle:       { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  title:        { fontSize: 18, fontWeight: '800' },
  cancelBtn:    { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7, overflow: 'hidden' },
  cancelTxt:    { fontSize: 14, fontWeight: '700' },
  searchWrap:   { paddingHorizontal: 16, paddingVertical: 12 },
  searchBox:    { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 10 : 7, gap: 8 },
  searchIconWrap:{ width: 22, alignItems: 'center' },
  searchIconTxt: { fontSize: 18 },
  searchInput:  { flex: 1, fontSize: 16 },
  clearX:       { fontSize: 14, paddingHorizontal: 4 },
  row:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 17, borderBottomWidth: StyleSheet.hairlineWidth },
  cityName:     { flex: 1, fontSize: 17 },
  checkCircle:  { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  checkTxt:     { color: '#fff', fontSize: 12, fontWeight: '900' },
  emptyWrap:    { paddingTop: 40, alignItems: 'center' },
  emptyTxt:     { fontSize: 15 },
})
