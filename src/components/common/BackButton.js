/**
 * BackButton — modern SVG chevron, works on any background
 * light/dark safe, never an emoji
 */
import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Svg, Path, Line } from 'react-native-svg'
import useThemeStore from '../../store/themeStore'

function ChevronLeft({ color = '#fff', size = 22, strokeWidth = 2.2 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19l-7-7 7-7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

/**
 * variant:
 *   "floating"  — dark pill on top of hero image (EventDetail style)
 *   "header"    — clean circle on page background (CategoryEvents style)
 *   "plain"     — just the chevron, no background
 */
export default function BackButton({
  onPress,
  variant = 'header',
  color,
  style,
}) {
  const { colors } = useThemeStore()

  if (variant === 'floating') {
    const c = color || '#fff'
    return (
      <Pressable
        onPress={onPress}
        style={[fl.btn, style]}
        android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: true }}
        hitSlop={10}
      >
        <ChevronLeft color={c} size={22} strokeWidth={2.4} />
      </Pressable>
    )
  }

  if (variant === 'plain') {
    const c = color || colors.primary
    return (
      <Pressable
        onPress={onPress}
        style={[pl.btn, style]}
        android_ripple={{ color: colors.primary + '22', borderless: true }}
        hitSlop={10}
      >
        <ChevronLeft color={c} size={20} strokeWidth={2.2} />
      </Pressable>
    )
  }

  // header — circle with surface background
  const c = color || colors.primary
  return (
    <Pressable
      onPress={onPress}
      style={[hd.btn, { backgroundColor: colors.surface }, style]}
      android_ripple={{ color: colors.primary + '22', borderless: true }}
      hitSlop={6}
    >
      <ChevronLeft color={c} size={22} strokeWidth={2.3} />
    </Pressable>
  )
}

const fl = StyleSheet.create({
  btn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.42)', alignItems: 'center', justifyContent: 'center' },
})

const hd = StyleSheet.create({
  btn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
})

const pl = StyleSheet.create({
  btn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
})
