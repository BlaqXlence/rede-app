/**
 * WelcomeScreen.js
 * Premium onboarding — clean dark theme, no country references.
 */
import React from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, StatusBar,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import colors from '../../constants/colors'

const { height } = Dimensions.get('window')

const FEATURES = [
  { title: 'Discover events near you', sub: 'Parties, sports, music, food & more' },
  { title: 'Join in one tap',          sub: 'Simple, fast, no hassle' },
  { title: 'Create your own events',   sub: 'Anyone can organise and invite people' },
]

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0D0D0D', '#1A1A1A', '#1F0A00']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe}>
        {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.logoBox}>
            <Text style={styles.logoLetter}>R</Text>
          </View>
          <Text style={styles.appName}>REDE</Text>
          <Text style={styles.tagline}>Find your people. Find your event.</Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.dot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureSub}>{f.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Phone')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Phone')}
            activeOpacity={0.7}
          >
            <Text style={styles.signInLink}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.terms}>
          By continuing you agree to our Terms of Service and Privacy Policy
        </Text>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: height * 0.06,
    paddingBottom: 28,
  },

  // Brand
  brand: { alignItems: 'center' },
  logoBox: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  logoLetter: {
    fontSize: 44, fontWeight: '900', color: '#fff', letterSpacing: -2,
  },
  appName: {
    fontSize: 44, fontWeight: '900', color: '#fff',
    letterSpacing: -2, marginBottom: 10,
  },
  tagline: {
    fontSize: 16, color: 'rgba(255,255,255,0.6)',
    textAlign: 'center', lineHeight: 24,
  },

  // Features
  features: { gap: 16 },
  featureRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14, padding: 16,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.primary, marginTop: 5,
  },
  featureTitle: {
    fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2,
  },
  featureSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.5)',
  },

  // Actions
  actions: { gap: 14 },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12, paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff', fontSize: 16, fontWeight: '700',
  },
  signInLink: {
    textAlign: 'center', color: 'rgba(255,255,255,0.55)',
    fontSize: 14, fontWeight: '500',
    textDecorationLine: 'underline',
  },

  terms: {
    textAlign: 'center', fontSize: 11,
    color: 'rgba(255,255,255,0.25)', lineHeight: 16,
  },
})
