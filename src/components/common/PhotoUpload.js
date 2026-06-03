import React, { useState } from 'react'
import {
  View, Text, StyleSheet, Image,
  Alert, ActivityIndicator, Pressable,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import AsyncStorage    from '@react-native-async-storage/async-storage'
import useThemeStore   from '../../store/themeStore'

const BASE = 'https://web-production-e695b.up.railway.app/api/v1'

async function uploadImage(uri) {
  const token = await AsyncStorage.getItem('rede:token')

  // Read file as blob then convert to base64 — works on all platforms
  // including Android where multer can't read file:// URIs directly
  const response = await fetch(uri)
  const blob     = await response.blob()

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = async () => {
      try {
        const base64 = reader.result // data:image/jpeg;base64,...
        const res = await fetch(`${BASE}/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ image: base64 }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Upload failed')
        resolve(data)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(blob)
  })
}

export default function PhotoUpload({ uri, onSelect, onRemove, aspect = [16, 9] }) {
  const { colors }  = useThemeStore()
  const [uploading, setUploading] = useState(false)

  async function pick() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to upload images.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType?.Images || ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect,
      quality: 0.75,
    })
    if (!result.canceled && result.assets?.[0]) {
      const localUri = result.assets[0].uri
      onSelect(localUri) // show immediately
      setUploading(true)
      try {
        const data = await uploadImage(localUri)
        if (data.url) onSelect(data.url) // replace with Cloudinary URL
      } catch (err) {
        console.log('Upload failed, keeping local preview:', err.message)
        // keep local URI — image shows but won't persist after session
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
          <View style={s.overlay}>
            <ActivityIndicator color="#fff" size="large" />
            <Text style={s.overlayTxt}>Uploading...</Text>
          </View>
        )}
        <View style={s.btnRow}>
          <Pressable
            style={[s.btn, { backgroundColor: colors.primary }]}
            onPress={pick} disabled={uploading}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          >
            <Text style={s.btnTxt}>Change photo</Text>
          </Pressable>
          <Pressable
            style={[s.btn, { borderWidth: 1.5, borderColor: colors.error, backgroundColor: 'transparent' }]}
            onPress={onRemove} disabled={uploading}
            android_ripple={{ color: colors.error + '22' }}
          >
            <Text style={[s.btnTxt, { color: colors.error }]}>Remove</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <Pressable
      style={[s.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={pick}
      disabled={uploading}
      android_ripple={{ color: colors.primary + '22' }}
    >
      {uploading ? (
        <>
          <ActivityIndicator color={colors.primary} />
          <Text style={[s.hint, { color: colors.textHint, marginTop: 8 }]}>Uploading...</Text>
        </>
      ) : (
        <>
          <Text style={[s.emptyTxt, { color: colors.textSecondary }]}>Tap to add cover photo</Text>
          <Text style={[s.hint, { color: colors.textHint }]}>16:9 · JPG or PNG</Text>
        </>
      )}
    </Pressable>
  )
}

const s = StyleSheet.create({
  wrap:    { marginBottom: 16 },
  preview: { width: '100%', height: 180, borderRadius: 12, marginBottom: 8 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 180, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  overlayTxt: { color: '#fff', fontSize: 13, marginTop: 8, fontWeight: '600' },
  btnRow:  { flexDirection: 'row', gap: 8 },
  btn:     { flex: 1, borderRadius: 8, paddingVertical: 11, alignItems: 'center', overflow: 'hidden' },
  btnTxt:  { fontSize: 13, fontWeight: '700', color: '#fff' },
  empty:   { borderWidth: 2, borderStyle: 'dashed', borderRadius: 12, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 16, overflow: 'hidden' },
  emptyTxt:{ fontSize: 15, fontWeight: '600', marginBottom: 4 },
  hint:    { fontSize: 12 },
})
