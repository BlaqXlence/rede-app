/**
 * SkeletonLoader — animated shimmer placeholders
 * Uses Animated API only — no third-party libs, works everywhere
 */
import React, { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet, Dimensions } from 'react-native'
import useThemeStore from '../../store/themeStore'

const { width } = Dimensions.get('window')
const MAX_W     = Math.min(width, 500)
const GUTTER    = 12
const GAP       = 8
const CARD_W    = (MAX_W - GUTTER * 2 - GAP) / 2 + 6

// ── Shimmer base ──────────────────────────────────────────────
function Shimmer({ style }) {
  const { colors } = useThemeStore()
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] })

  const base = colors.surface === '#1C1C1E' ? '#2C2C2E' : '#E0E0E0'

  return (
    <Animated.View style={[{ backgroundColor: base, opacity, borderRadius: 8 }, style]} />
  )
}

// ── Single grid card skeleton ─────────────────────────────────
function GridCardSkeleton() {
  return (
    <View style={{ width: CARD_W }}>
      <Shimmer style={{ width: CARD_W, height: CARD_W * 0.70, borderRadius: 12, marginBottom: 8 }} />
      <Shimmer style={{ height: 12, width: '90%', marginBottom: 6 }} />
      <Shimmer style={{ height: 12, width: '70%', marginBottom: 6 }} />
      <Shimmer style={{ height: 11, width: '50%' }} />
    </View>
  )
}

// ── Section skeleton (2×2 grid) ───────────────────────────────
function SectionSkeleton() {
  return (
    <View style={sk.section}>
      {/* Section title */}
      <View style={sk.sectionHead}>
        <Shimmer style={{ height: 20, width: 120, borderRadius: 6 }} />
        <Shimmer style={{ height: 14, width: 30, borderRadius: 4 }} />
      </View>
      {/* 2×2 grid */}
      <View style={{ paddingHorizontal: GUTTER }}>
        <View style={{ flexDirection: 'row', gap: GAP, marginBottom: GAP }}>
          <GridCardSkeleton />
          <GridCardSkeleton />
        </View>
        <View style={{ flexDirection: 'row', gap: GAP }}>
          <GridCardSkeleton />
          <GridCardSkeleton />
        </View>
      </View>
      {/* See all button skeleton */}
      <Shimmer style={{ height: 42, marginHorizontal: GUTTER, borderRadius: 12, marginTop: 12 }} />
    </View>
  )
}

// ── Happening now horizontal skeleton ────────────────────────
function HappeningNowSkeleton() {
  return (
    <View style={sk.section}>
      <View style={sk.sectionHead}>
        <Shimmer style={{ height: 20, width: 140, borderRadius: 6 }} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: GUTTER }}>
        {[1, 2].map(i => (
          <View key={i} style={{ width: 200 }}>
            <Shimmer style={{ width: 200, height: 120, borderRadius: 12, marginBottom: 8 }} />
            <Shimmer style={{ height: 12, width: '85%', marginBottom: 6 }} />
            <Shimmer style={{ height: 11, width: '55%' }} />
          </View>
        ))}
      </View>
    </View>
  )
}

// ── Full home screen skeleton ─────────────────────────────────
export function HomeScreenSkeleton() {
  return (
    <View style={{ flex: 1 }}>
      <HappeningNowSkeleton />
      <SectionSkeleton />
      <SectionSkeleton />
    </View>
  )
}

// ── List card skeleton (filtered results / category screen) ──
export function ListCardSkeleton() {
  return (
    <View style={sk.listRow}>
      <Shimmer style={{ width: 96, height: 96, borderRadius: 12 }} />
      <View style={{ flex: 1, gap: 8, paddingVertical: 4 }}>
        <Shimmer style={{ height: 11, width: '45%', borderRadius: 5 }} />
        <Shimmer style={{ height: 14, width: '90%', borderRadius: 5 }} />
        <Shimmer style={{ height: 14, width: '75%', borderRadius: 5 }} />
        <Shimmer style={{ height: 11, width: '40%', borderRadius: 5 }} />
      </View>
    </View>
  )
}

export function ListScreenSkeleton({ count = 8 }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <ListCardSkeleton key={i} />
      ))}
    </View>
  )
}

const sk = StyleSheet.create({
  section:    { marginBottom: 32 },
  sectionHead:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: GUTTER, paddingVertical: 12, marginBottom: 12 },
  listRow:    { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E022' },
})
