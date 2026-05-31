import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, Alert, ActivityIndicator,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import useThemeStore from '../../store/themeStore'

// Upload via FormData - works on native without base64 conversion
async function uploadImage(uri) {
  const token = await require('@react-native-async-storage/async-storage').default.getItem('rede:token')
  const BASE   = 'https://web-production-e695b.up.railway.app/api/v1'

  const form = new FormData()
  form.append('file', {
    uri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  })

  const res  = await fetch(`${BASE}/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Upload failed')
  return data
}

export default function PhotoUpload({ uri, onSelect, onRemove }) {
  const { colors }  = useThemeStore()
  const [uploading, setUploading] = useState(false)

  async function pick() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to upload images.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.72,
    })
    if (!result.canceled && result.assets?.[0]) {
      const localUri = result.assets[0].uri
      // Show image immediately (optimistic)
      onSelect(localUri)
      setUploading(true)
      try {
        const res = await uploadImage(localUri)
        // Replace with real URL
        onSelect(res.url)
      } catch {
        // Keep local URI as fallback - image shows but may not persist
      } finally {
        setUploading(false)
      }
    }
  }

  if (uri) {
    return (
      <View style={s.wrap}>
        <Image source={{ uri }} style={s.preview} resizeMode="cover" />
        {uploading && (
          <View style={s.uploadingOverlay}>
            <ActivityIndicator color="#fff" size="large" />
            <Text style={s.uploadingTxt}>Uploading...</Text>
          </View>
        )}
        <View style={s.btnRow}>
          <TouchableOpacity
            style={[s.btn, { backgroundColor: colors.primary }]}
            onPress={pick} disabled={uploading}
          >
            <Text style={s.btnTxt}>Change Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.btn, { borderWidth: 1.5, borderColor: colors.error }]}
            onPress={onRemove} disabled={uploading}
          >
            <Text style={[s.btnTxt, { color: colors.error }]}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <TouchableOpacity
      style={[s.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={pick} disabled={uploading} activeOpacity={0.75}
    >
      {uploading
        ? <><ActivityIndicator color={colors.primary} /><Text style={[s.emptyHint,{color:colors.textHint,marginTop:8}]}>Uploading...</Text></>
        : <>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>📷</Text>
            <Text style={[s.emptyTxt, { color: colors.textSecondary }]}>Tap to add cover photo</Text>
            <Text style={[s.emptyHint, { color: colors.textHint }]}>16:9 · JPG or PNG</Text>
          </>
      }
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  wrap:    { marginBottom: 16, position: 'relative' },
  preview: { width: '100%', height: 180, borderRadius: 12, marginBottom: 8 },
  uploadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 180, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  uploadingTxt: { color: '#fff', fontSize: 13, marginTop: 8, fontWeight: '600' },
  btnRow:  { flexDirection: 'row', gap: 8 },
  btn:     { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  btnTxt:  { fontSize: 13, fontWeight: '700', color: '#fff' },
  empty:   { borderWidth: 2, borderStyle: 'dashed', borderRadius: 12, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTxt:  { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  emptyHint: { fontSize: 12 },
})
