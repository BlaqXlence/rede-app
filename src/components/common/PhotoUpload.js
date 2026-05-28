/**
 * PhotoUpload.js
 * Compresses images to max 800px and quality 0.4 before upload.
 * This reduces a typical phone photo from 3-5MB to under 150KB.
 * Critical for 2G users in Uganda.
 */
import React from 'react'
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, Platform,
} from 'react-native'
import useThemeStore from '../../store/themeStore'

const MAX_SIZE  = 1200  // max width/height in pixels
const QUALITY   = 0.72  // 72% quality — visually excellent, 60% smaller than original

// Compress image on web using canvas
async function compressImageWeb(file) {
  return new Promise((resolve, reject) => {
    const img    = document.createElement('img')
    const url    = URL.createObjectURL(file)
    img.onload   = () => {
      // Calculate new dimensions
      let w = img.width, h = img.height
      if (w > MAX_SIZE || h > MAX_SIZE) {
        if (w > h) { h = Math.round(h * MAX_SIZE / w); w = MAX_SIZE }
        else       { w = Math.round(w * MAX_SIZE / h); h = MAX_SIZE }
      }
      const canvas = document.createElement('canvas')
      canvas.width  = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', QUALITY))
    }
    img.onerror = reject
    img.src     = url
  })
}

export default function PhotoUpload({ uri, onSelect, onRemove }) {
  const { colors } = useThemeStore()

  async function pick() {
    if (Platform.OS === 'web') {
      const input   = document.createElement('input')
      input.type    = 'file'
      input.accept  = 'image/*'
      input.onchange = async e => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 10 * 1024 * 1024) {
          alert('Image too large. Max 10MB.')
          return
        }
        try {
          // Compress before sending
          const compressed = await compressImageWeb(file)
          onSelect(compressed, file)
        } catch {
          // Fallback: read as-is
          const reader = new FileReader()
          reader.onload = () => onSelect(reader.result, file)
          reader.readAsDataURL(file)
        }
      }
      input.click()
    } else {
      try {
        const IP = require('expo-image-picker')
        const { status } = await IP.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') return
        const r = await IP.launchImageLibraryAsync({
          allowsEditing: true,
          aspect:   [16, 9],
          quality:  0.8,       // high quality on native (JPEG compression is different)
          base64:   true,
        })
        if (!r.canceled) {
          const base64 = `data:image/jpeg;base64,${r.assets[0].base64}`
          onSelect(base64, null)
        }
      } catch (err) {
        console.warn('Photo pick error:', err.message)
      }
    }
  }

  if (uri) {
    return (
      <View style={styles.wrap}>
        <Image source={{ uri }} style={styles.preview} resizeMode="cover" />
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surface }]} onPress={pick}>
            <Text style={[styles.actionTxt, { color: colors.textPrimary }]}>Change</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.error + '22' }]} onPress={onRemove}>
            <Text style={[styles.actionTxt, { color: colors.error }]}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <TouchableOpacity
      style={[styles.placeholder, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={pick}
      activeOpacity={0.8}
    >
      <Text style={{ fontSize: 28, marginBottom: 8 }}>📷</Text>
      <Text style={[styles.placeholderTxt, { color: colors.textPrimary }]}>Add cover photo</Text>
      <Text style={[styles.placeholderSub, { color: colors.textHint }]}>
        Optional — auto-compressed for fast loading
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  wrap:        { marginBottom: 16 },
  preview:     { width: '100%', height: 180, borderRadius: 12, marginBottom: 8 },
  actions:     { flexDirection: 'row', gap: 8 },
  actionBtn:   { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  actionTxt:   { fontSize: 13, fontWeight: '600' },
  placeholder: {
    borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 12,
    paddingVertical: 32, alignItems: 'center', marginBottom: 16,
  },
  placeholderTxt: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  placeholderSub: { fontSize: 12 },
})
