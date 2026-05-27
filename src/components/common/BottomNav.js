/**
 * BottomNav.js
 * Persistent bottom navigation shown on ALL main screens.
 * This replaces the React Navigation tab bar which disappears
 * when you navigate to stack screens like EventDetail.
 */
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { Svg, Path, Circle } from 'react-native-svg'
import useThemeStore from '../../store/themeStore'

function HomeIcon({ color }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12L12 4l9 8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  )
}
function PlusIcon({ color }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8"/>
      <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  )
}
function UserIcon({ color }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8"/>
      <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  )
}

const TABS = [
  { name: 'Home',    Icon: HomeIcon },
  { name: 'Create',  Icon: PlusIcon },
  { name: 'Profile', Icon: UserIcon },
]

export default function BottomNav({ navigation, activeTab }) {
  const { colors } = useThemeStore()

  function handlePress(name) {
    if (name === 'Home') {
      navigation.navigate('Tabs', { screen: 'Home' })
    } else if (name === 'Create') {
      navigation.navigate('Tabs', { screen: 'Create' })
    } else if (name === 'Profile') {
      navigation.navigate('Tabs', { screen: 'Profile' })
    }
  }

  return (
    <View style={[
      styles.bar,
      {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        paddingBottom: Platform.OS === 'ios' ? 24 : 8,
      }
    ]}>
      {TABS.map(({ name, Icon }) => {
        const active = activeTab === name
        const color  = active ? colors.primary : colors.textHint
        return (
          <TouchableOpacity
            key={name}
            style={styles.tab}
            onPress={() => handlePress(name)}
            activeOpacity={0.7}
          >
            <Icon color={color} />
            <Text style={[styles.label, { color }]}>{name}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
})
