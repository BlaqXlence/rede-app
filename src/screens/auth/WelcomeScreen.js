import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import colors from '../../constants/colors'
import Button from '../../components/common/Button'

const { height } = Dimensions.get('window')

export default function WelcomeScreen({ navigation }) {
  return (
    <LinearGradient colors={['#0D0D0D', '#1A1A1A', '#2A1500']} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe}>
        {/* Logo */}
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoEmoji}>🎉</Text>
          </View>
          <Text style={styles.appName}>REDE</Text>
          <Text style={styles.tagline}>
            Discover events happening{'\n'}right near you in Uganda
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {[
            { icon: '📍', text: 'Find events near your location' },
            { icon: '🎭', text: 'Parties, sports, music, dancing & more' },
            { icon: '📱', text: 'Sign in with your phone number' },
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.actions}>
          <Button label="Get Started" onPress={() => navigation.navigate('Phone')} size="lg" style={styles.primaryBtn} />
          <TouchableOpacity onPress={() => navigation.navigate('Phone')}>
            <Text style={styles.signInText}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Made in Uganda 🇺🇬</Text>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 28, justifyContent: 'space-between', paddingTop: 20, paddingBottom: 30 },
  hero: { alignItems: 'center', marginTop: height * 0.05 },
  logoWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  logoEmoji: { fontSize: 42 },
  appName: { fontSize: 48, fontWeight: '900', color: colors.primary, letterSpacing: -2, marginBottom: 14 },
  tagline: { fontSize: 17, color: colors.textSecondary, textAlign: 'center', lineHeight: 26 },
  features: { gap: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, padding: 16, gap: 14 },
  featureIcon: { fontSize: 24 },
  featureText: { fontSize: 15, color: colors.textPrimary, fontWeight: '500', flex: 1 },
  actions: { alignItems: 'center', gap: 16 },
  primaryBtn: { width: '100%' },
  signInText: { fontSize: 15, color: colors.textSecondary, fontWeight: '600', textDecorationLine: 'underline' },
  footer: { textAlign: 'center', color: colors.textHint, fontSize: 13 },
})
