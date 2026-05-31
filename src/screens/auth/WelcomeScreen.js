/**
 * WelcomeScreen — logo centred, clean, no gradients
 */
import React from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore from '../../store/themeStore'

const { width, height } = Dimensions.get('window')
const MAX_W = Math.min(width, 500)

export default function WelcomeScreen({ navigation }) {
  const { colors } = useThemeStore()

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top','bottom']}>
      <View style={[s.phone, { maxWidth: MAX_W }]}>

        {/* ── Logo centred — fills top half ── */}
        <View style={s.logoSection}>
          <View style={[s.logoBox, { backgroundColor: colors.primary }]}>
            <Text style={s.logoLetter}>R</Text>
          </View>
          <Text style={[s.brand, { color: colors.textPrimary }]}>REDE</Text>
          <Text style={[s.tagline, { color: colors.textSecondary }]}>
            Your city. Your events.
          </Text>
        </View>

        {/* ── Bottom section ── */}
        <View style={s.bottom}>
          <Text style={[s.headline, { color: colors.textPrimary }]}>
            Find what's happening{'\n'}near you in Uganda
          </Text>
          <Text style={[s.sub, { color: colors.textSecondary }]}>
            Parties, sports, music, food and more — all in one place.
          </Text>

          <TouchableOpacity
            style={[s.btn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Phone')}
            activeOpacity={0.87}
          >
            <Text style={s.btnTxt}>Get started →</Text>
          </TouchableOpacity>

          <Text style={[s.terms, { color: colors.textHint }]}>
            By continuing you agree to our Terms of Service
          </Text>
        </View>

      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:  { flex: 1, alignItems: 'center' },
  phone: { flex: 1, width: '100%', paddingHorizontal: 28 },

  // Logo takes upper 50% of screen
  logoSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    width: 100, height: 100,
    borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  logoLetter: { color: '#fff', fontSize: 52, fontWeight: '900' },
  brand:   { fontSize: 36, fontWeight: '900', letterSpacing: -1, marginBottom: 6 },
  tagline: { fontSize: 15 },

  // Text + button at bottom
  bottom: { paddingBottom: 8 },
  headline: {
    fontSize: 26, fontWeight: '900',
    lineHeight: 34, letterSpacing: -0.5,
    marginBottom: 12,
  },
  sub:  { fontSize: 15, lineHeight: 22, marginBottom: 28 },
  btn:  { borderRadius: 14, paddingVertical: 17, alignItems: 'center', marginBottom: 16 },
  btnTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
  terms:  { textAlign: 'center', fontSize: 12, lineHeight: 18, paddingBottom: 8 },
})
