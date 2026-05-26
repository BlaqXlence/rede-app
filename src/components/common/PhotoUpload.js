/**
 * PhotoUpload.js
 * 
 * IMPORTANT FIX: Blob URLs are temporary and die when the browser closes.
 * This component converts picked images to base64 data URLs which persist
 * and can be stored in the database permanently.
 * 
 * For production at scale: upload to Cloudinary/S3 and store the URL.
 * For now: base64 data URL stored directly — works reliably.
 */
import React, { useRef } from 'react'
import {
  View, Text, TouchableOpacity, Image,
  StyleSheet, Platform, Alert,
} from 'react-native'
import useThemeStore from '../../store/themeStore'

// Convert a File object to a base64 data URL
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export default function PhotoUpload({ uri, onSelect, onRemove }) {
  const { colors }  = useThemeStore()
  const fileRef     = useRef(null)

  async function handleWebChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      Alert.alert('Invalid file', 'Please pick an image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      Alert.alert('Too large', 'Pick an image under 5MB.')
      return
    }

    try {
      // Convert to base64 — this persists unlike blob URLs
      const base64 = await fileToBase64(file)
      onSelect(base64, null)
    } catch (err) {
      Alert.alert('Error', 'Could not load image. Try another one.')
    }
  }

  async function handleNativePick() {
    try {
      const IP = require('expo-image-picker')
      const { status } = await IP.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow photo access to add a cover photo.')
        return
      }
      const r = await IP.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
        base64: true,  // Get base64 on native too
      })
      if (!r.canceled) {
        // Use base64 if available, else local URI
        const imageData = r.assets[0].base64
          ? `data:image/jpeg;base64,${r.assets[0].base64}`
          : r.assets[0].uri
        onSelect(imageData, null)
      }
    } catch (err) {
      Alert.alert('Error', err.message)
    }
  }

  function handlePick() {
    if (Platform.OS === 'web') fileRef.current?.click()
    else handleNativePick()
  }

  if (uri) {
    return (
      <View style={styles.previewWrap}>
        <Image source={{ uri }} style={styles.preview} resizeMode="cover" />

        {/* Delete X — top right */}
        <TouchableOpacity style={styles.deleteBtn} onPress={onRemove}>
          <Text style={styles.deleteX}>×</Text>
        </TouchableOpacity>

        {/* Change photo overlay at bottom */}
        <TouchableOpacity style={styles.changeOverlay} onPress={handlePick}>
          <Text style={styles.changeTxt}>Change photo</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={{ marginBottom: 16 }}>
      <TouchableOpacity
        style={[styles.picker, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={handlePick}
        activeOpacity={0.8}
      >
        <Text style={{ fontSize: 28 }}>📷</Text>
        <Text style={[styles.pickerTitle, { color: colors.textPrimary }]}>Add cover photo</Text>
        <Text style={[styles.pickerSub, { color: colors.textHint }]}>Tap to choose · Max 5MB</Text>
      </TouchableOpacity>

      {Platform.OS === 'web' && (
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleWebChange}
          style={{ display: 'none' }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  picker: {
    borderWidth: 1.5, borderRadius: 12, borderStyle: 'dashed',
    paddingVertical: 28, alignItems: 'center', gap: 6, marginBottom: 16,
  },
  pickerTitle: { fontSize: 15, fontWeight: '600' },
  pickerSub:   { fontSize: 12 },
  previewWrap: { borderRadius: 12, overflow: 'hidden', marginBottom: 16, position: 'relative' },
  preview:     { width: '100%', height: 180 },
  deleteBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', justifyContent: 'center',
  },
  deleteX:  { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 22 },
  changeOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8, alignItems: 'center',
  },
  changeTxt: { color: '#fff', fontSize: 13, fontWeight: '600' },
})
