import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import useThemeStore from '../../store/themeStore'

const { height } = Dimensions.get('window')

export default function WelcomeScreen({ navigation }) {
  const { isDark } = useThemeStore()
  const gradients = isDark
    ? ['#0A0A0A', '#1A0A00', '#2A1000']
    : ['#FFF5EE', '#FFF0E0', '#FFE8CC']

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={gradients} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.brand}>
          <View style={styles.logoBox}>
            <Text style={styles.logoR}>R</Text>
          </View>
          <Text style={[styles.name, { color: isDark ? '#fff' : '#111' }]}>REDE</Text>
          <Text style={[styles.tagline, { color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)' }]}>
            Find your people.{'\n'}Find your event.
          </Text>
        </View>

        <View style={styles.features}>
          {[
            { title: 'Discover events near you',  sub: 'Parties, sports, food, music & more' },
            { title: 'Join with one tap',          sub: 'Simple, fast, no hassle' },
            { title: 'Create your own events',     sub: 'Anyone can host and invite people' },
          ].map((f, i) => (
            <View key={i} style={[styles.featureRow, { backgroundColor: 'rgba(255,102,0,0.1)', borderColor: 'rgba(255,102,0,0.2)' }]}>
              <View style={styles.featureDot} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.featureTitle, { color: isDark ? '#fff' : '#111' }]}>{f.title}</Text>
                <Text style={[styles.featureSub, { color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)' }]}>{f.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Phone')} activeOpacity={0.88}>
            <Text style={styles.primaryBtnTxt}>Get Started</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Phone')} activeOpacity={0.7}>
            <Text style={[styles.signIn, { color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)' }]}>
              Already have an account? Sign in
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.terms, { color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)' }]}>
          By continuing you agree to our Terms of Service and Privacy Policy
        </Text>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between', paddingTop: height * 0.06, paddingBottom: 28 },
  brand: { alignItems: 'center' },
  logoBox: { width: 80, height: 80, borderRadius: 22, backgroundColor: '#FF6600', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  logoR: { fontSize: 46, fontWeight: '900', color: '#fff', letterSpacing: -2 },
  name: { fontSize: 46, fontWeight: '900', letterSpacing: -2, marginBottom: 12 },
  tagline: { fontSize: 17, textAlign: 'center', lineHeight: 26 },
  features: { gap: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderRadius: 14, padding: 16, borderWidth: 1 },
  featureDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF6600', marginTop: 5 },
  featureTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  featureSub: { fontSize: 13 },
  actions: { gap: 14 },
  primaryBtn: { backgroundColor: '#FF6600', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  primaryBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  signIn: { textAlign: 'center', fontSize: 14, textDecorationLine: 'underline' },
  terms: { textAlign: 'center', fontSize: 11, lineHeight: 16 },
})
