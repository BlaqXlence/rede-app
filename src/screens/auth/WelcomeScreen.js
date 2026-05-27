/**
 * WelcomeScreen.js
 * Swipeable onboarding slides — like Airbnb, Spotify, Uber.
 * 3 slides + Get Started on last slide.
 * Dot indicators. Skip button top right.
 */
import React, { useState, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, ScrollView, Animated,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import useThemeStore from '../../store/themeStore'

const { width, height } = Dimensions.get('window')

const SLIDES = [
  {
    gradient: ['#0D0000', '#2A0800', '#FF6600'],
    emoji:    '🎭',
    title:    'Discover Events\nNear You',
    sub:      'Parties, sports, food, music and more — all happening around you right now.',
  },
  {
    gradient: ['#0A0010', '#1A0025', '#FF6600'],
    emoji:    '⚡',
    title:    'Join in\nOne Tap',
    sub:      'See something you like? Join instantly. No tickets, no complicated sign-up.',
  },
  {
    gradient: ['#001000', '#002800', '#FF6600'],
    emoji:    '🚀',
    title:    'Host Your\nOwn Events',
    sub:      'Anyone can create an event. Share it, fill it up, make it happen.',
  },
]

export default function WelcomeScreen({ navigation }) {
  const { colors } = useThemeStore()
  const [current, setCurrent] = useState(0)
  const scrollRef = useRef(null)

  function goTo(index) {
    scrollRef.current?.scrollTo({ x: index * width, animated: true })
    setCurrent(index)
  }

  function handleNext() {
    if (current < SLIDES.length - 1) {
      goTo(current + 1)
    } else {
      navigation.navigate('Phone')
    }
  }

  function handleScroll(e) {
    const index = Math.round(e.nativeEvent.contentOffset.x / width)
    setCurrent(index)
  }

  const isLast = current === SLIDES.length - 1

  return (
    <View style={styles.root}>
      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={StyleSheet.absoluteFill}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={{ width, height }}>
            <LinearGradient
              colors={slide.gradient}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
          </View>
        ))}
      </ScrollView>

      {/* Content overlay */}
      <SafeAreaView style={styles.safe}>
        {/* Skip button */}
        {!isLast && (
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => navigation.navigate('Phone')}
          >
            <Text style={styles.skipTxt}>Skip</Text>
          </TouchableOpacity>
        )}

        {/* Main content — slides in sync with scroll */}
        <View style={styles.contentArea}>
          {/* Big emoji icon */}
          <View style={styles.emojiWrap}>
            <Text style={styles.emoji}>{SLIDES[current].emoji}</Text>
          </View>

          {/* REDE wordmark */}
          <Text style={styles.logo}>REDE</Text>

          {/* Slide title */}
          <Text style={styles.title}>{SLIDES[current].title}</Text>

          {/* Slide subtitle */}
          <Text style={styles.sub}>{SLIDES[current].sub}</Text>
        </View>

        {/* Bottom section */}
        <View style={styles.bottom}>
          {/* Dot indicators */}
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => goTo(i)}>
                <View style={[
                  styles.dot,
                  {
                    backgroundColor: i === current ? '#FF6600' : 'rgba(255,255,255,0.3)',
                    width: i === current ? 24 : 8,
                  }
                ]} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Primary CTA */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleNext}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryBtnTxt}>
              {isLast ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>

          {/* Sign in link */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Phone')}
            style={styles.signInRow}
            activeOpacity={0.7}
          >
            <Text style={styles.signInTxt}>
              Already have an account?{' '}
              <Text style={styles.signInLink}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D0000' },
  safe: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // Skip
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  skipTxt: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 15,
    fontWeight: '500',
  },

  // Content
  contentArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emojiWrap: {
    width: 100, height: 100,
    borderRadius: 28,
    backgroundColor: 'rgba(255,102,0,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  emoji: { fontSize: 52 },
  logo: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FF6600',
    letterSpacing: 4,
    marginBottom: 24,
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 46,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  sub: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },

  // Bottom
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 8 : 24,
    gap: 16,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    // width is dynamic above
  },
  primaryBtn: {
    backgroundColor: '#FF6600',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    // Shadow for depth
    shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnTxt: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  signInRow: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  signInTxt: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
  },
  signInLink: {
    color: '#FF6600',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
})
