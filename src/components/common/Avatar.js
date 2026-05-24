import React from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function nameToColor(str) {
  const palette = ['#FF6600', '#E91E63', '#9C27B0', '#2196F3', '#009688', '#FF5722', '#795548']
  let hash = 0
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}

export default function Avatar({ uri, name, size = 40, style }) {
  const fontSize = size * 0.38
  if (uri) {
    return <Image source={{ uri }} style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#333' }, style]} />
  }
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: nameToColor(name), alignItems: 'center', justifyContent: 'center' }, style]}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize }}>{getInitials(name)}</Text>
    </View>
  )
}
