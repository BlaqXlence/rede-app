/**
 * ShareModal.js
 *
 * Bottom sheet share popup with real social icons:
 * - WhatsApp (green)
 * - TikTok (black)
 * - Copy Link
 *
 * Used from EventDetailScreen share button.
 */
import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, Modal,
  StyleSheet, Linking, Alert, Platform,
  TouchableWithoutFeedback,
} from 'react-native'
import { Svg, Path, Rect, Circle } from 'react-native-svg'
import useThemeStore from '../../store/themeStore'
import { APP_URL }   from '../../constants/config'
import { formatDateRange } from '../../utils/formatters'

/* ── Real social media SVG icons ────────────────────────────── */
function WhatsAppIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="#fff"/>
      <Path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.948-1.42A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="#25D366"/>
      <Path d="M12 3.5C7.313 3.5 3.5 7.313 3.5 12c0 1.71.484 3.31 1.33 4.67L3.5 20.5l3.9-1.318A8.463 8.463 0 0012 20.5c4.687 0 8.5-3.813 8.5-8.5S16.687 3.5 12 3.5z" fill="#25D366"/>
      <Path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="#fff"/>
    </Svg>
  )
}

function TikTokIcon() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.77 1.52V6.75a4.85 4.85 0 01-1-.06z" fill="#fff"/>
    </Svg>
  )
}

function CopyIcon({ color }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="9" width="13" height="13" rx="2" stroke={color} strokeWidth="2"/>
      <Path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke={color} strokeWidth="2"/>
    </Svg>
  )
}

export default function ShareModal({ visible, onClose, event }) {
  const { colors } = useThemeStore()
  const [copied, setCopied] = useState(false)

  if (!event) return null

  const link    = `${APP_URL}?event=${event.id}`
  const message = `🎉 *${event.title}*\n📅 ${formatDateRange(event.startTime, event.endTime)}\n📍 ${event.location?.venueName || event.location?.name || 'Kampala'}\n\nCheck it out on REDE 👉 ${link}`

  async function shareWhatsApp() {
    const encoded = encodeURIComponent(message)
    const url     = Platform.OS === 'web'
      ? `https://wa.me/?text=${encoded}`
      : `whatsapp://send?text=${encoded}`

    if (Platform.OS === 'web') {
      window.open(url, '_blank')
    } else {
      const can = await Linking.canOpenURL(url).catch(() => false)
      Linking.openURL(can ? url : `https://wa.me/?text=${encoded}`)
    }
    onClose()
  }

  async function shareTikTok() {
    // TikTok doesn't have a direct share URL like WhatsApp
    // Best we can do: copy the link and prompt user to paste in TikTok bio/DM
    await copyLink(true)
    Alert.alert(
      'Link copied!',
      'Paste the link in your TikTok DM or bio.',
      [{ text: 'OK' }]
    )
  }

  async function copyLink(silent = false) {
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(link)
      } catch {
        // Fallback for browsers that block clipboard
        const el = document.createElement('textarea')
        el.value = link
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      }
    }
    // Native clipboard
    // expo-clipboard would go here for native builds
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    if (!silent) onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        {/* Event preview */}
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {event.title}
        </Text>
        <Text style={[styles.link, { color: colors.textHint }]} numberOfLines={1}>
          {link}
        </Text>

        {/* Share options */}
        <View style={styles.options}>

          {/* WhatsApp */}
          <TouchableOpacity style={styles.option} onPress={shareWhatsApp} activeOpacity={0.8}>
            <View style={[styles.optionIcon, { backgroundColor: '#25D366' }]}>
              <WhatsAppIcon />
            </View>
            <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>WhatsApp</Text>
          </TouchableOpacity>

          {/* TikTok */}
          <TouchableOpacity style={styles.option} onPress={shareTikTok} activeOpacity={0.8}>
            <View style={[styles.optionIcon, { backgroundColor: '#010101' }]}>
              <TikTokIcon />
            </View>
            <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>TikTok</Text>
          </TouchableOpacity>

          {/* Copy link */}
          <TouchableOpacity style={styles.option} onPress={() => copyLink(false)} activeOpacity={0.8}>
            <View style={[styles.optionIcon, { backgroundColor: colors.surfaceHigh }]}>
              <CopyIcon color={colors.textPrimary} />
            </View>
            <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>
              {copied ? 'Copied!' : 'Copy Link'}
            </Text>
          </TouchableOpacity>

        </View>

        <TouchableOpacity
          style={[styles.cancelBtn, { backgroundColor: colors.surfaceHigh }]}
          onPress={onClose}
        >
          <Text style={[styles.cancelTxt, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: 20, paddingBottom: 44,
  },
  handle:    { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  title:     { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  link:      { fontSize: 12, marginBottom: 24 },
  options:   { flexDirection: 'row', gap: 20, marginBottom: 24 },
  option:    { alignItems: 'center', gap: 8 },
  optionIcon:{ width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  optionLabel:{ fontSize: 12, fontWeight: '600', textAlign: 'center' },
  cancelBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelTxt: { fontSize: 15, fontWeight: '600' },
})
