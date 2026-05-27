/**
 * AddressSearch.js
 * Autocomplete powered by OpenStreetMap Nominatim — no API key, Uganda-scoped.
 * Returns { name, address, lat, lng } so events can be geo-sorted.
 */
import React, { useState, useRef, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import useThemeStore from '../../store/themeStore'

export default function AddressSearch({ value, onSelect, error }) {
  const [query, setQuery]       = useState(value?.name || '')
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [showList, setShowList] = useState(false)
  const timer                   = useRef(null)

  const search = useCallback((text) => {
    setQuery(text)
    setShowList(false)
    clearTimeout(timer.current)
    if (text.trim().length < 3) { setResults([]); return }

    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&countrycodes=ug&format=json&limit=6&addressdetails=1`
        const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'REDE-App/1.0' } })
        const data = await res.json()
        setResults(data)
        setShowList(data.length > 0)
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 500)
  }, [])

  function pick(place) {
    const addr = place.address || {}
    const name = addr.amenity || addr.building || addr.road || place.display_name.split(',')[0]
    const parts = [addr.road, addr.suburb || addr.neighbourhood, addr.city || addr.town || 'Kampala', 'Uganda'].filter(Boolean)
    onSelect({ name: name.trim(), address: parts.join(', '), lat: parseFloat(place.lat), lng: parseFloat(place.lon) })
    setQuery(name.trim())
    setShowList(false)
    setResults([])
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>VENUE / LOCATION</Text>
      <View style={[styles.row, error && styles.rowError]}>
        <Text style={{ fontSize: 16 }}>📍</Text>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={search}
          placeholder="Search venue or area in Uganda..."
          placeholderTextColor={colors.textHint}
          autoCorrect={false}
          autoCapitalize="words"
        />
        {loading && <ActivityIndicator size="small" color={colors.primary} />}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {showList && results.length > 0 && (
        <View style={styles.dropdown}>
          {results.map((place, i) => {
            const addr = place.address || {}
            const name = addr.amenity || addr.building || addr.road || place.display_name.split(',')[0]
            const sub  = [addr.suburb, addr.city || addr.town || 'Kampala'].filter(Boolean).join(', ')
            return (
              <TouchableOpacity
                key={place.place_id || i}
                style={[styles.result, i < results.length - 1 && styles.resultBorder]}
                onPress={() => pick(place)}
              >
                <Text style={styles.resultName} numberOfLines={1}>{name}</Text>
                <Text style={styles.resultSub}  numberOfLines={1}>{sub}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16, zIndex: 99 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, gap: 8 },
  rowError: { borderColor: colors.error },
  input: { flex: 1, fontSize: 15, color: colors.textPrimary, paddingVertical: 13 },
  error: { fontSize: 12, color: colors.error, marginTop: 4 },
  dropdown: { backgroundColor: colors.surfaceHigh, borderRadius: 10, borderWidth: 1, borderColor: colors.border, marginTop: 4, overflow: 'hidden' },
  result: { paddingHorizontal: 14, paddingVertical: 12 },
  resultBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  resultName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
  resultSub: { fontSize: 12, color: colors.textSecondary },
})
