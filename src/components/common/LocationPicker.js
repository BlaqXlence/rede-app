/**
 * LocationPicker
 * 1. Google Places search (Uganda scoped, debounced)
 * 2. Manual fallback — city → area → venue name
 * 3. Profanity filter on venue name
 * Works on Android, iOS, Web, Expo Go — no native modules
 */
import React, { useState, useRef, useCallback } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  Modal, Pressable, Platform, Dimensions,
} from 'react-native'
import useThemeStore from '../../store/themeStore'
import { searchPlaces, getPlaceDetails, newSessionToken } from '../../services/places'
import { UGANDA_CITIES } from '../../constants/ugandaLocations'
import { checkVenueName } from '../../utils/profanityFilter'

const { width } = Dimensions.get('window')

let searchTimer = null
function debounceSearch(fn, ms = 400) {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(fn, ms)
}

export default function LocationPicker({ value, onChange, colors: colorsProp }) {
  const { colors: themeColors } = useThemeStore()
  const colors = colorsProp || themeColors

  const [mode,        setMode]        = useState('search')  // 'search' | 'manual'
  const [query,       setQuery]       = useState('')
  const [results,     setResults]     = useState([])
  const [searching,   setSearching]   = useState(false)
  const [cityPicker,  setCityPicker]  = useState(false)
  const [areaPicker,  setAreaPicker]  = useState(false)
  const [venueErr,    setVenueErr]    = useState('')

  const sessionToken = useRef(newSessionToken())

  // Manual fields
  const [manualCity,  setManualCity]  = useState(null)
  const [manualArea,  setManualArea]  = useState('')
  const [manualVenue, setManualVenue] = useState('')

  const areaList = manualCity
    ? UGANDA_CITIES.find(c => c.id === manualCity.id)?.areas || []
    : []

  // ── Google search ──────────────────────────────────────────────
  function handleSearchChange(text) {
    setQuery(text)
    if (text.length < 2) { setResults([]); return }
    setSearching(true)
    debounceSearch(async () => {
      const preds = await searchPlaces(text, sessionToken.current)
      setResults(preds)
      setSearching(false)
    }, 400)
  }

  async function handleSelect(prediction) {
    setSearching(true)
    setResults([])
    const details = await getPlaceDetails(prediction.place_id, sessionToken.current)
    sessionToken.current = newSessionToken() // reset after session completes
    if (details) {
      onChange({
        venueName: details.name || prediction.structured_formatting?.main_text || '',
        area:      details.area || '',
        city:      details.city || '',
        lat:       details.lat,
        lng:       details.lng,
        source:    'google',
      })
      setQuery(details.name || prediction.structured_formatting?.main_text || '')
    }
    setSearching(false)
  }

  // ── Manual entry ───────────────────────────────────────────────
  function handleManualVenueChange(text) {
    setManualVenue(text)
    setVenueErr('')
  }

  function applyManual() {
    const check = checkVenueName(manualVenue)
    if (!check.ok) { setVenueErr(check.message); return }
    if (!manualCity) { setVenueErr('Please select a city.'); return }
    onChange({
      venueName: manualVenue.trim(),
      area:      manualArea,
      city:      manualCity.name,
      lat:       null,
      lng:       null,
      source:    'manual',
    })
    setVenueErr('')
  }

  function clear() {
    setQuery('')
    setResults([])
    setManualCity(null)
    setManualArea('')
    setManualVenue('')
    setVenueErr('')
    setMode('search')
    onChange(null)
  }

  // ── Render current value ───────────────────────────────────────
  if (value) {
    return (
      <View style={[lp.valueCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={lp.valueInfo}>
          <Text style={[lp.valueName, { color: colors.textPrimary }]}>{value.venueName}</Text>
          <Text style={[lp.valueSub,  { color: colors.textSecondary }]}>
            {[value.area, value.city].filter(Boolean).join(', ')}
          </Text>
          {value.source === 'google' && (
            <Text style={[lp.valueTag, { color: colors.primary }]}>Verified location</Text>
          )}
        </View>
        <Pressable onPress={clear} style={lp.clearBtn}
          android_ripple={{ color: colors.border, borderless: true }}>
          <Text style={[lp.clearTxt, { color: colors.error }]}>Change</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View>
      {/* ── Tab: Search / Manual ── */}
      <View style={[lp.tabs, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Pressable
          style={[lp.tab, mode === 'search' && { borderBottomWidth: 2, borderBottomColor: colors.primary }]}
          onPress={() => setMode('search')}
          android_ripple={{ color: colors.primary + '22' }}
        >
          <Text style={[lp.tabTxt, { color: mode === 'search' ? colors.primary : colors.textSecondary }]}>
            Search venue
          </Text>
        </Pressable>
        <Pressable
          style={[lp.tab, mode === 'manual' && { borderBottomWidth: 2, borderBottomColor: colors.primary }]}
          onPress={() => setMode('manual')}
          android_ripple={{ color: colors.primary + '22' }}
        >
          <Text style={[lp.tabTxt, { color: mode === 'manual' ? colors.primary : colors.textSecondary }]}>
            Enter manually
          </Text>
        </Pressable>
      </View>

      {/* ── Google Search mode ── */}
      {mode === 'search' && (
        <View>
          <View style={[lp.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[lp.searchInput, { color: colors.textPrimary }]}
              value={query}
              onChangeText={handleSearchChange}
              placeholder="Type venue name, e.g. Serena Hotel"
              placeholderTextColor={colors.textHint}
              autoCorrect={false}
              underlineColorAndroid="transparent"
              selectionColor={colors.primary}
            />
            {searching && <ActivityIndicator size="small" color={colors.primary} />}
          </View>

          {results.length > 0 && (
            <View style={[lp.resultsList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {results.map(p => (
                <Pressable
                  key={p.place_id}
                  style={[lp.resultRow, { borderBottomColor: colors.border }]}
                  onPress={() => handleSelect(p)}
                  android_ripple={{ color: colors.primary + '22' }}
                >
                  <View style={[lp.resultIcon, { backgroundColor: colors.primary + '18' }]}>
                    <Text style={[lp.resultIconTxt, { color: colors.primary }]}>P</Text>
                  </View>
                  <View style={lp.resultText}>
                    <Text style={[lp.resultMain, { color: colors.textPrimary }]} numberOfLines={1}>
                      {p.structured_formatting?.main_text || p.description}
                    </Text>
                    <Text style={[lp.resultSub, { color: colors.textSecondary }]} numberOfLines={1}>
                      {p.structured_formatting?.secondary_text || ''}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          <Text style={[lp.hint, { color: colors.textHint }]}>
            Venue not on Google?{' '}
            <Text style={{ color: colors.primary, fontWeight: '700' }}
              onPress={() => setMode('manual')}>
              Enter manually →
            </Text>
          </Text>
        </View>
      )}

      {/* ── Manual mode ── */}
      {mode === 'manual' && (
        <View style={lp.manualWrap}>

          {/* City picker */}
          <Text style={[lp.fieldLabel, { color: colors.textSecondary }]}>City</Text>
          <Pressable
            style={[lp.selector, { backgroundColor: colors.surface, borderColor: manualCity ? colors.primary : colors.border }]}
            onPress={() => setCityPicker(true)}
            android_ripple={{ color: colors.primary + '22' }}
          >
            <Text style={[lp.selectorTxt, { color: manualCity ? colors.textPrimary : colors.textHint }]}>
              {manualCity ? manualCity.name : 'Select city'}
            </Text>
            <Text style={[lp.selectorArrow, { color: colors.textHint }]}>›</Text>
          </Pressable>

          {/* Area picker */}
          {manualCity && (
            <>
              <Text style={[lp.fieldLabel, { color: colors.textSecondary }]}>Area</Text>
              <Pressable
                style={[lp.selector, { backgroundColor: colors.surface, borderColor: manualArea ? colors.primary : colors.border }]}
                onPress={() => setAreaPicker(true)}
                android_ripple={{ color: colors.primary + '22' }}
              >
                <Text style={[lp.selectorTxt, { color: manualArea ? colors.textPrimary : colors.textHint }]}>
                  {manualArea || 'Select area'}
                </Text>
                <Text style={[lp.selectorArrow, { color: colors.textHint }]}>›</Text>
              </Pressable>
            </>
          )}

          {/* Venue name */}
          {manualCity && (
            <>
              <Text style={[lp.fieldLabel, { color: colors.textSecondary }]}>Venue name</Text>
              <TextInput
                style={[lp.venueInput, {
                  backgroundColor: colors.surface,
                  borderColor: venueErr ? colors.error : colors.border,
                  color: colors.textPrimary,
                }]}
                value={manualVenue}
                onChangeText={handleManualVenueChange}
                placeholder="e.g. Kiza Lounge, Ntinda"
                placeholderTextColor={colors.textHint}
                autoCorrect={false}
                underlineColorAndroid="transparent"
                selectionColor={colors.primary}
                maxLength={120}
              />
              {!!venueErr && (
                <Text style={[lp.errTxt, { color: colors.error }]}>{venueErr}</Text>
              )}

              <Pressable
                style={[lp.applyBtn, { backgroundColor: colors.primary }]}
                onPress={applyManual}
                android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
              >
                <Text style={lp.applyTxt}>Confirm location</Text>
              </Pressable>
            </>
          )}
        </View>
      )}

      {/* ── City bottom sheet ── */}
      <BottomSheet
        visible={cityPicker}
        title="Select city"
        onClose={() => setCityPicker(false)}
        colors={colors}
      >
        {UGANDA_CITIES.map(c => (
          <SheetRow
            key={c.id}
            label={c.name}
            active={manualCity?.id === c.id}
            onPress={() => { setManualCity(c); setManualArea(''); setCityPicker(false) }}
            colors={colors}
          />
        ))}
      </BottomSheet>

      {/* ── Area bottom sheet ── */}
      <BottomSheet
        visible={areaPicker}
        title={`Areas in ${manualCity?.name || ''}`}
        onClose={() => setAreaPicker(false)}
        colors={colors}
      >
        {areaList.map(a => (
          <SheetRow
            key={a}
            label={a}
            active={manualArea === a}
            onPress={() => { setManualArea(a); setAreaPicker(false) }}
            colors={colors}
          />
        ))}
      </BottomSheet>
    </View>
  )
}

// ── Reusable bottom sheet ──────────────────────────────────────────
function BottomSheet({ visible, title, onClose, children, colors }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={bs.backdrop} onPress={onClose} />
      <View style={[bs.sheet, { backgroundColor: colors.surface }]}>
        <View style={[bs.handle, { backgroundColor: colors.border }]} />
        <Text style={[bs.title, { color: colors.textPrimary, borderBottomColor: colors.border }]}>
          {title}
        </Text>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View>{children}</View>
        </ScrollView>
      </View>
    </Modal>
  )
}

function SheetRow({ label, active, onPress, colors }) {
  return (
    <Pressable
      style={[bs.row, { borderBottomColor: colors.border, backgroundColor: active ? colors.primary + '11' : 'transparent' }]}
      onPress={onPress}
      android_ripple={{ color: colors.primary + '22' }}
    >
      <Text style={[bs.rowTxt, { color: active ? colors.primary : colors.textPrimary, fontWeight: active ? '800' : '500' }]}>
        {label}
      </Text>
      {active && <Text style={[bs.check, { color: colors.primary }]}>✓</Text>}
    </Pressable>
  )
}

// ── Styles ───────────────────────────────────────────────────────
const lp = StyleSheet.create({
  tabs:       { flexDirection: 'row', borderBottomWidth: 1, marginBottom: 14, borderRadius: 0 },
  tab:        { flex: 1, paddingVertical: 11, alignItems: 'center' },
  tabTxt:     { fontSize: 13, fontWeight: '700' },
  searchBox:  { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 13 : 10, gap: 8, marginBottom: 4 },
  searchInput:{ flex: 1, fontSize: 15 },
  hint:       { fontSize: 12, marginTop: 10, marginBottom: 4 },
  resultsList:{ borderWidth: 1, borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
  resultRow:  { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 10 },
  resultIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  resultIconTxt: { fontSize: 14, fontWeight: '800' },
  resultText: { flex: 1 },
  resultMain: { fontSize: 14, fontWeight: '600' },
  resultSub:  { fontSize: 11, marginTop: 1 },
  manualWrap: { gap: 4 },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4, marginTop: 10, marginBottom: 6, textTransform: 'uppercase' },
  selector:   { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectorTxt:{ fontSize: 15, fontWeight: '500' },
  selectorArrow: { fontSize: 20 },
  venueInput: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 13 : 10, fontSize: 15 },
  errTxt:     { fontSize: 12, marginTop: 4 },
  applyBtn:   { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 14 },
  applyTxt:   { color: '#fff', fontSize: 15, fontWeight: '800' },
  valueCard:  { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 12, padding: 14, gap: 12 },
  valueInfo:  { flex: 1 },
  valueName:  { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  valueSub:   { fontSize: 12 },
  valueTag:   { fontSize: 11, fontWeight: '700', marginTop: 3 },
  clearBtn:   { paddingVertical: 6, paddingHorizontal: 4 },
  clearTxt:   { fontSize: 13, fontWeight: '700' },
})

const bs = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:    { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', paddingBottom: 32 },
  handle:   { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  title:    { fontSize: 16, fontWeight: '800', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  row:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth },
  rowTxt:   { flex: 1, fontSize: 15 },
  check:    { fontSize: 16, fontWeight: '800' },
})
