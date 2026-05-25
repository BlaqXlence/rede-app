/**
 * PhotoUpload.js
 * WhatsApp-style photo picker — shows preview with delete (×) and "Change photo" overlay.
 */
import React, { useRef } from 'react'
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform, Alert } from 'react-native'
import colors from '../../constants/colors'

export default function PhotoUpload({ uri, onSelect, onRemove }) {
  const fileRef = useRef(null)

  function handleWebChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { Alert.alert('Invalid file', 'Pick an image.'); return }
    if (file.size > 5 * 1024 * 1024) { Alert.alert('Too large', 'Pick an image under 5MB.'); return }
    onSelect(URL.createObjectURL(file), file)
  }

  async function handleNativePick() {
    try {
      const IP = require('expo-image-picker')
      const { status } = await IP.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo access.'); return }
      const r = await IP.launchImageLibraryAsync({ allowsEditing: true, aspect: [16, 9], quality: 0.8 })
      if (!r.canceled) onSelect(r.assets[0].uri, null)
    } catch {}
  }

  function handlePick() {
    if (Platform.OS === 'web') fileRef.current?.click()
    else handleNativePick()
  }

  if (uri) {
    return (
      <View style={styles.previewWrap}>
        <Image source={{ uri }} style={styles.preview} resizeMode="cover" />
        <TouchableOpacity style={styles.deleteBtn} onPress={onRemove}>
          <Text style={styles.deleteX}>×</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.changeOverlay} onPress={handlePick}>
          <Text style={styles.changeText}>Change photo</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={{ marginBottom: 16 }}>
      <TouchableOpacity style={styles.picker} onPress={handlePick} activeOpacity={0.8}>
        <Text style={{ fontSize: 28 }}>📷</Text>
        <Text style={styles.pickerTitle}>Add cover photo</Text>
        <Text style={styles.pickerSub}>Tap to choose · Max 5MB</Text>
      </TouchableOpacity>
      {Platform.OS === 'web' && (
        <input ref={fileRef} type="file" accept="image/*" onChange={handleWebChange} style={{ display: 'none' }} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  picker: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, borderStyle: 'dashed', paddingVertical: 28, alignItems: 'center', gap: 6 },
  pickerTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  pickerSub: { fontSize: 12, color: colors.textHint },
  previewWrap: { borderRadius: 12, overflow: 'hidden', marginBottom: 16, position: 'relative' },
  preview: { width: '100%', height: 180, backgroundColor: colors.shimmer },
  deleteBtn: { position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' },
  deleteX: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 22 },
  changeOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 8, alignItems: 'center' },
  changeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
})
