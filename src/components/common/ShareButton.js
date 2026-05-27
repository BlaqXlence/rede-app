/**
 * ShareButton.js
 * Clean share menu — shows WhatsApp, Copy Link, and native share options.
 * Used on EventDetailScreen.
 */
import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, Modal,
  StyleSheet, Linking, Share, Alert,
  TouchableWithoutFeedback, Clipboard, Platform,
} from 'react-native'
import useThemeStore from '../../store/themeStore'
import { APP_URL } from '../../constants/config'

export default function ShareButton({ event }) {
  const { colors }      = useThemeStore()
  const [open, setOpen] = useState(false)

  const link    = `${APP_URL}?event=${event.id}`
  const message = `🎉 *${event.title}*\n📅 ${new Date(event.startTime).toDateString()}\n📍 ${event.location?.venueName || event.location?.name || 'Kampala'}\n\nCheck it out on REDE 👉 ${link}`

  async function shareWhatsApp() {
    setOpen(false)
    const encoded = encodeURIComponent(message)
    const waUrl   = `whatsapp://send?text=${encoded}`
    const webUrl  = `https://wa.me/?text=${encoded}`
    try {
      const can = await Linking.canOpenURL(waUrl)
      await Linking.openURL(can ? waUrl : webUrl)
    } catch {
      Alert.alert('WhatsApp not found', 'Opening web WhatsApp instead')
      Linking.openURL(webUrl)
    }
  }

  async function copyLink() {
    setOpen(false)
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(link)
      } else {
        Clipboard.setString(link)
      }
      Alert.alert('Copied!', 'Event link copied to clipboard')
    } catch {
      Alert.alert('Link', link)
    }
  }

  async function nativeShare() {
    setOpen(false)
    try {
      await Share.share({ message, url: link, title: event.title })
    } catch {}
  }

  return (
    <>
      {/* Share button — shown on event detail header */}
      <TouchableOpacity
        style={[styles.shareBtn, { backgroundColor: 'rgba(0,0,0,0.55)' }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.shareBtnTxt}>↗</Text>
      </TouchableOpacity>

      {/* Share options modal */}
      <Modal visible={open} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Share Event
          </Text>
          <Text style={[styles.eventName, { color: colors.textSecondary }]} numberOfLines={1}>
            {event.title}
          </Text>

          {/* Options */}
          <TouchableOpacity style={[styles.option, { borderColor: colors.border }]} onPress={shareWhatsApp} activeOpacity={0.8}>
            <View style={[styles.optionIcon, { backgroundColor: '#25D366' }]}>
              <Text style={styles.optionIconTxt}>W</Text>
            </View>
            <View>
              <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>WhatsApp</Text>
              <Text style={[styles.optionSub, { color: colors.textHint }]}>Share directly to WhatsApp</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.option, { borderColor: colors.border }]} onPress={copyLink} activeOpacity={0.8}>
            <View style={[styles.optionIcon, { backgroundColor: colors.primary }]}>
              <Text style={styles.optionIconTxt}>🔗</Text>
            </View>
            <View>
              <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>Copy Link</Text>
              <Text style={[styles.optionSub, { color: colors.textHint }]}>Copy event link to clipboard</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.option, { borderColor: colors.border }]} onPress={nativeShare} activeOpacity={0.8}>
            <View style={[styles.optionIcon, { backgroundColor: colors.surfaceHigh }]}>
              <Text style={styles.optionIconTxt}>↗</Text>
            </View>
            <View>
              <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>More Options</Text>
              <Text style={[styles.optionSub, { color: colors.textHint }]}>Use your phone's share sheet</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cancelBtn, { backgroundColor: colors.surfaceHigh }]}
            onPress={() => setOpen(false)}
          >
            <Text style={[styles.cancelTxt, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  shareBtn:    { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  shareBtnTxt: { color: '#fff', fontSize: 17, fontWeight: '700' },
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  eventName: { fontSize: 13, marginBottom: 20 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, borderBottomWidth: 1,
  },
  optionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  optionIconTxt: { fontSize: 18, fontWeight: '700', color: '#fff' },
  optionLabel: { fontSize: 15, fontWeight: '600' },
  optionSub:   { fontSize: 12, marginTop: 1 },
  cancelBtn:   { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  cancelTxt:   { fontSize: 15, fontWeight: '600' },
})
