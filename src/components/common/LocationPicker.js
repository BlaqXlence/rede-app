/**
 * LocationPicker.js
 * Uganda-specific location input.
 *
 * Uganda doesn't have structured addresses like Russia/Europe.
 * Instead we use:
 *   - City selector
 *   - Area/neighbourhood (Kololo, Ntinda, etc)
 *   - Venue/landmark name
 *   - Optional: Google Maps link or lat/lng coordinates
 *
 * This is how SafeBoda and Uber work in Uganda —
 * they show a pin on map + a landmark name.
 */
import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Modal, ScrollView,
  TouchableWithoutFeedback, Platform,
} from 'react-native'
import useThemeStore from '../../store/themeStore'
import { UGANDA_CITIES, KAMPALA_AREAS } from '../../constants/config'

export default function LocationPicker({ value, onChange, error }) {
  const { colors } = useThemeStore()
  const [showCityModal, setShowCityModal]   = useState(false)
  const [showAreaModal, setShowAreaModal]   = useState(false)
  const [mapsLink, setMapsLink]             = useState(value?.mapsLink || '')

  const city = UGANDA_CITIES.find(c => c.id === value?.cityId) || UGANDA_CITIES[0]

  function update(changes) {
    onChange({ ...value, ...changes })
  }

  // Parse lat/lng from a Google Maps link
  function parseMapsLink(link) {
    try {
      // Handles: maps.app.goo.gl, google.com/maps/@lat,lng
      const match = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
      if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) }
      // Try ?q=lat,lng format
      const qMatch = link.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
      if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) }
    } catch {}
    return null
  }

  function handleMapsLink(link) {
    setMapsLink(link)
    const coords = parseMapsLink(link)
    if (coords) {
      update({ mapsLink: link, lat: coords.lat, lng: coords.lng })
    } else {
      update({ mapsLink: link })
    }
  }

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Location</Text>

      {/* City selector */}
      <View style={styles.row}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>City</Text>
        <TouchableOpacity
          style={[styles.selector, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowCityModal(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.selectorText, { color: colors.textPrimary }]}>📍 {city.name}</Text>
          <Text style={[styles.chevron, { color: colors.textHint }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Area/Neighbourhood */}
      <View style={styles.row}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Area</Text>
        <TouchableOpacity
          style={[styles.selector, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowAreaModal(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.selectorText, !value?.area && styles.placeholder]}>
            {value?.area || 'Select area (e.g. Kololo)'}
          </Text>
          <Text style={[styles.chevron, { color: colors.textHint }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Venue / Landmark name */}
      <View style={styles.fieldWrap}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Venue / Landmark</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
          value={value?.venueName || ''}
          onChangeText={v => update({ venueName: v })}
          placeholder="e.g. Tank Hill Garden, Kololo Heights Club"
          placeholderTextColor={colors.textHint}
          autoCapitalize="words"
        />
      </View>

      {/* Google Maps link */}
      <View style={styles.fieldWrap}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
          Google Maps Link (optional but recommended)
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
          value={mapsLink}
          onChangeText={handleMapsLink}
          placeholder="Paste a Google Maps link or share location URL"
          placeholderTextColor={colors.textHint}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {/* Show if coordinates were parsed */}
        {value?.lat && value?.lng && (
          <Text style={[styles.coordsFound, { color: colors.success }]}>
            ✓ Coordinates found: {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </Text>
        )}
        <Text style={[styles.hint, { color: colors.textHint }]}>
          Open Google Maps → tap your venue → tap Share → copy the link
        </Text>
      </View>

      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

      {/* City modal */}
      <Modal visible={showCityModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowCityModal(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.textPrimary, borderBottomColor: colors.border }]}>Select City</Text>
          <ScrollView>
            {UGANDA_CITIES.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.modalRow, { borderBottomColor: colors.divider }]}
                onPress={() => { update({ cityId: c.id, lat: c.lat, lng: c.lng }); setShowCityModal(false) }}
              >
                <Text style={[styles.modalRowText, { color: colors.textPrimary }]}>📍 {c.name}</Text>
                {value?.cityId === c.id && <Text style={{ color: colors.primary }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Area modal */}
      <Modal visible={showAreaModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowAreaModal(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.textPrimary, borderBottomColor: colors.border }]}>Select Area in {city.name}</Text>
          <ScrollView>
            {KAMPALA_AREAS.map(area => (
              <TouchableOpacity
                key={area}
                style={[styles.modalRow, { borderBottomColor: colors.divider }]}
                onPress={() => { update({ area }); setShowAreaModal(false) }}
              >
                <Text style={[styles.modalRowText, { color: colors.textPrimary }]}>{area}</Text>
                {value?.area === area && <Text style={{ color: colors.primary }}>✓</Text>}
              </TouchableOpacity>
            ))}
            {/* Allow custom input */}
            <TouchableOpacity
              style={[styles.modalRow, { borderBottomColor: colors.divider }]}
              onPress={() => { setShowAreaModal(false) }}
            >
              <Text style={[styles.modalRowText, { color: colors.primary }]}>
                + Type a custom area
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

// Only layout — all colors are applied inline in JSX
const styles = StyleSheet.create({
  wrapper:      { marginBottom: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '800', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  row:          { marginBottom: 10 },
  fieldWrap:    { marginBottom: 10 },
  fieldLabel:   { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5 },
  selector:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13 },
  selectorText: { flex: 1, fontSize: 15 },
  chevron:      { fontSize: 20 },
  input:        { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  coordsFound:  { fontSize: 12, marginTop: 5 },
  hint:         { fontSize: 11, marginTop: 4, lineHeight: 16 },
  error:        { fontSize: 12, marginTop: 4 },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modal:        { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40, maxHeight: '70%' },
  handle:       { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  modalTitle:   { fontSize: 16, fontWeight: '800', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1 },
  modalRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  modalRowText: { fontSize: 15 },
})
