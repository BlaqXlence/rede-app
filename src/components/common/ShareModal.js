import React from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Share, Alert, TouchableWithoutFeedback,
  Dimensions, Linking,
} from 'react-native'
import useThemeStore from '../../store/themeStore'
import { APP_URL } from '../../constants/config'

const { width } = Dimensions.get('window')

export default function ShareModal({ visible, onClose, event }) {
  const { colors } = useThemeStore()
  if (!event) return null

  const url  = `${APP_URL || 'https://rede-app.netlify.app'}?event=${event.id}`
  const text = `Check out ${event.title} on REDE!\n${url}`

  async function shareNative() {
    try { await Share.share({ message: text, url }) }
    catch {}
    onClose()
  }

  async function shareWhatsApp() {
    const wUrl = `whatsapp://send?text=${encodeURIComponent(text)}`
    const can  = await Linking.canOpenURL(wUrl)
    if (can) { await Linking.openURL(wUrl) }
    else { Alert.alert('WhatsApp not installed', 'Share using another option.') }
    onClose()
  }

  async function copyLink() {
    try {
      // Use Clipboard API via Linking workaround
      await Share.share({ message: url })
    } catch {}
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={s.overlay} />
      </TouchableWithoutFeedback>
      <View style={[s.sheet, { backgroundColor: colors.surface }]}>
        <View style={[s.handle, { backgroundColor: colors.border }]} />
        <Text style={[s.title, { color: colors.textPrimary }]}>Share Event</Text>
        <Text style={[s.sub, { color: colors.textSecondary }]} numberOfLines={2}>{event.title}</Text>

        <ShareOption emoji="📱" label="Share via..."     onPress={shareNative}   colors={colors} />
        <ShareOption emoji="💬" label="Send on WhatsApp" onPress={shareWhatsApp} colors={colors} />
        <ShareOption emoji="🔗" label="Copy Link"        onPress={copyLink}      colors={colors} />

        <TouchableOpacity style={[s.cancel, { borderColor: colors.border }]} onPress={onClose}>
          <Text style={[s.cancelTxt, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

function ShareOption({ emoji, label, onPress, colors }) {
  return (
    <TouchableOpacity
      style={[s.option, { backgroundColor: colors.background, borderColor: colors.border }]}
      onPress={onPress} activeOpacity={0.75}
    >
      <Text style={s.optionEmoji}>{emoji}</Text>
      <Text style={[s.optionLabel, { color: colors.textPrimary }]}>{label}</Text>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:   { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22, paddingBottom: 40 },
  handle:  { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  title:   { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  sub:     { fontSize: 13, marginBottom: 20 },
  option:  { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10 },
  optionEmoji: { fontSize: 22 },
  optionLabel: { fontSize: 15, fontWeight: '600' },
  cancel:  { borderRadius: 12, borderWidth: 1, padding: 14, alignItems: 'center', marginTop: 4 },
  cancelTxt: { fontSize: 15, fontWeight: '600' },
})
