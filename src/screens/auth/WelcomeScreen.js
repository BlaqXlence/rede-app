/**
 * WelcomeScreen — minimal, clean, no gradients
 * Logo + name + tagline + button
 */
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore from '../../store/themeStore'

const { width } = Dimensions.get('window')
const MAX_W = Math.min(width, 500)

export default function WelcomeScreen({ navigation }) {
  const { colors } = useThemeStore()
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top','bottom']}>
      <View style={[s.phone, { maxWidth: MAX_W }]}>

        {/* Logo + brand */}
        <View style={s.logoWrap}>
          <View style={[s.logoBox, { backgroundColor: colors.primary }]}>
            <Text style={s.logoLetter}>R</Text>
          </View>
          <Text style={[s.brand, { color: colors.textPrimary }]}>REDE</Text>
        </View>

        {/* Tagline */}
        <View style={s.middle}>
          <Text style={[s.headline, { color: colors.textPrimary }]}>
            Find your{'\n'}next event
          </Text>
          <Text style={[s.sub, { color: colors.textSecondary }]}>
            Discover parties, sports, music and more happening around you in Uganda.
          </Text>
        </View>

        {/* Actions */}
        <View style={s.actions}>
          <TouchableOpacity
            style={[s.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Phone')}
            activeOpacity={0.87}
          >
            <Text style={s.primaryBtnTxt}>Get started →</Text>
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
  safe:     { flex: 1, alignItems: 'center' },
  phone:    { flex: 1, width: '100%', paddingHorizontal: 28 },

  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 52 },
  logoBox:  { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  logoLetter:{ color: '#fff', fontSize: 28, fontWeight: '900' },
  brand:    { fontSize: 32, fontWeight: '900', letterSpacing: -1 },

  middle:   { flex: 1, justifyContent: 'center' },
  headline: { fontSize: 44, fontWeight: '900', lineHeight: 52, letterSpacing: -1.5, marginBottom: 20 },
  sub:      { fontSize: 16, lineHeight: 24 },

  actions:      { paddingBottom: 12 },
  primaryBtn:   { borderRadius: 14, paddingVertical: 17, alignItems: 'center', marginBottom: 16 },
  primaryBtnTxt:{ color: '#fff', fontSize: 17, fontWeight: '800' },
  terms:        { textAlign: 'center', fontSize: 12, lineHeight: 18 },
})
