/**
 * WelcomeScreen.js — Clean premium dark onboarding
 */
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import colors from '../../constants/colors'

const { height } = Dimensions.get('window')

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#0A0A0A', '#110820', '#1A0F2E']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe}>
        {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.logoBox}>
            <Text style={styles.logoR}>R</Text>
          </View>
          <Text style={styles.name}>REDE</Text>
          <Text style={styles.tagline}>Find your people.{'\n'}Find your event.</Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {[
            { title: 'Discover events near you',   sub: 'Parties, sports, food, music & more' },
            { title: 'Join with one tap',           sub: 'Simple, fast, no hassle' },
            { title: 'Create your own events',      sub: 'Anyone can host and invite people' },
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureDot} />
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
            activeOpacity={0.88}
          >
            <Text style={styles.primaryBtnTxt}>Get Started</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Phone')} activeOpacity={0.7}>
            <Text style={styles.signIn}>Already have an account? Sign in</Text>
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
  safe: {
    flex: 1, paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: height * 0.06, paddingBottom: 28,
  },
  brand: { alignItems: 'center' },
  logoBox: {
    width: 80, height: 80, borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  logoR: { fontSize: 46, fontWeight: '900', color: '#fff', letterSpacing: -2 },
  name: { fontSize: 46, fontWeight: '900', color: '#fff', letterSpacing: -2, marginBottom: 12 },
  tagline: { fontSize: 17, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 26 },
  features: { gap: 12 },
  featureRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: 'rgba(124,58,237,0.1)',
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)',
  },
  featureDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.primary, marginTop: 5,
  },
  featureTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
  featureSub: { fontSize: 13, color: 'rgba(255,255,255,0.45)' },
  actions: { gap: 14 },
  primaryBtn: {
    backgroundColor: colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  primaryBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  signIn: {
    textAlign: 'center', color: 'rgba(255,255,255,0.45)',
    fontSize: 14, textDecorationLine: 'underline',
  },
  terms: {
    textAlign: 'center', fontSize: 11,
    color: 'rgba(255,255,255,0.2)', lineHeight: 16,
  },
})
