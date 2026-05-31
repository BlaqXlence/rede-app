import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, Alert, ActivityIndicator,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import useThemeStore from '../../store/themeStore'
import { uploadApi } from '../../services/api'

export default function PhotoUpload({ uri, onSelect, onRemove }) {
  const { colors } = useThemeStore()
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
      quality: 0.7,
    })

    if (!result.canceled && result.assets[0]) {
      setUploading(true)
      try {
        const res = await uploadApi.upload(result.assets[0].uri)
        onSelect(res.url)
      } catch {
        // Use local uri as fallback
        onSelect(result.assets[0].uri)
      } finally {
        setUploading(false)
      }
    }
  }

  if (uri) {
    return (
      <View style={s.wrap}>
        <Image source={{ uri }} style={s.preview} resizeMode="cover" />
        <View style={s.btnRow}>
          <TouchableOpacity style={[s.btn, { backgroundColor: colors.primary }]} onPress={pick}>
            <Text style={s.btnTxt}>Change Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, { borderWidth: 1, borderColor: colors.error }]} onPress={onRemove}>
            <Text style={[s.btnTxt, { color: colors.error }]}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <TouchableOpacity
      style={[s.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={pick}
      disabled={uploading}
      activeOpacity={0.75}
    >
      {uploading
        ? <ActivityIndicator color={colors.primary} />
        : <>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>📷</Text>
            <Text style={[s.emptyTxt, { color: colors.textSecondary }]}>Tap to add cover photo</Text>
            <Text style={[s.emptyHint, { color: colors.textHint }]}>16:9 recommended</Text>
          </>
      }
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  wrap:    { marginBottom: 16 },
  preview: { width: '100%', height: 180, borderRadius: 12, marginBottom: 8 },
  btnRow:  { flexDirection: 'row', gap: 8 },
  btn:     { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  btnTxt:  { fontSize: 13, fontWeight: '700', color: '#fff' },
  empty:   { borderWidth: 2, borderStyle: 'dashed', borderRadius: 12, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTxt:{ fontSize: 15, fontWeight: '600', marginBottom: 4 },
  emptyHint:{ fontSize: 12 },
})
