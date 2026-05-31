import React, { useEffect, useRef } from 'react'
import { View, ActivityIndicator, StyleSheet, Text, Platform } from 'react-native'
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator }   from '@react-navigation/bottom-tabs'
import { Svg, Path, Circle }          from 'react-native-svg'

import useAuthStore   from '../store/authStore'
import useEventsStore from '../store/eventsStore'
import useThemeStore  from '../store/themeStore'

import WelcomeScreen      from '../screens/auth/WelcomeScreen'
import PhoneScreen        from '../screens/auth/PhoneScreen'
import OtpScreen          from '../screens/auth/OtpScreen'
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen'
import HomeScreen         from '../screens/main/HomeScreen'
import CreateEventScreen  from '../screens/main/CreateEventScreen'
import ProfileScreen      from '../screens/main/ProfileScreen'
import EventDetailScreen  from '../screens/main/EventDetailScreen'
import CategoryEventsScreen from '../screens/main/CategoryEventsScreen'
import EditEventScreen    from '../screens/main/EditEventScreen'
import SearchScreen       from '../screens/main/SearchScreen'
import OrganizerScreen    from '../screens/main/OrganizerScreen'
import SettingsScreen     from '../screens/main/SettingsScreen'

const Auth  = createNativeStackNavigator()
const Stack = createNativeStackNavigator()
const Tab   = createBottomTabNavigator()

function HomeIcon({ color, focused }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12L12 4l9 8" stroke={color} strokeWidth={focused ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" stroke={color} strokeWidth={focused ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  )
}
function PlusIcon({ color }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8"/>
      <Path d="M12 7v10M7 12h10" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  )
}
function UserIcon({ color, focused }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={focused ? 2.2 : 1.8}/>
      <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth={focused ? 2.2 : 1.8} strokeLinecap="round"/>
    </Svg>
  )
}

function Tabs() {
  const { colors } = useThemeStore()
  const tabBarStyle = {
    backgroundColor: colors.surface,
    borderTopColor:  colors.border,
    borderTopWidth:  1,
    height:          Platform.OS === 'ios' ? 84 : Platform.OS === 'web' ? 72 : 62,
    paddingBottom:   Platform.OS === 'ios' ? 26 : Platform.OS === 'web' ? 20 : 10,
    paddingTop:      8,
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown:             false,
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textHint,
        tabBarStyle,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, focused }) => {
          if (route.name === 'Home')    return <HomeIcon color={color} focused={focused} />
          if (route.name === 'Create')  return <PlusIcon color={color} />
          if (route.name === 'Profile') return <UserIcon color={color} focused={focused} />
        },
      })}
    >
      <Tab.Screen name="Home"    component={HomeScreen}        options={{ tabBarLabel: 'Home' }} />
      {/* Create and Search hide the tab bar */}
      <Tab.Screen name="Create"  component={CreateEventScreen} options={{ tabBarLabel: 'Create', tabBarStyle: { display: 'none' } }} />
      <Tab.Screen name="Profile" component={ProfileScreen}     options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  )
}

function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Tabs"           component={Tabs} />
      <Stack.Screen name="EventDetail"    component={EventDetailScreen} />
      <Stack.Screen name="CategoryEvents" component={CategoryEventsScreen} />
      <Stack.Screen name="EditEvent"      component={EditEventScreen} />
      {/* Search hides tab bar — it's a focused search experience */}
      <Stack.Screen name="Search"   component={SearchScreen}
        options={{ presentation: 'modal', animation: 'fade_from_bottom' }} />
      <Stack.Screen name="Organizer"      component={OrganizerScreen} />
      <Stack.Screen name="Settings"       component={SettingsScreen} />
    </Stack.Navigator>
  )
}

function AuthNavigator() {
  return (
    <Auth.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Auth.Screen name="Welcome"      component={WelcomeScreen} />
      <Auth.Screen name="Phone"        component={PhoneScreen} />
      <Auth.Screen name="Otp"          component={OtpScreen} />
      <Auth.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </Auth.Navigator>
  )
}

function getEventIdFromUrl() {
  return null // Deep links handled via Expo Linking on native
}

export default function RootNavigator() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore()
  const { requestLocation, loadRecentSearches, loadPersistedData } = useEventsStore()
  const { colors, initialize: initTheme } = useThemeStore()
  const navRef = useRef(null)

  useEffect(() => {
    initialize()
    initTheme()
    loadRecentSearches()
    loadPersistedData()
  }, [])

  useEffect(() => {
    if (isAuthenticated) requestLocation()
  }, [isAuthenticated])

  // Deep link
  useEffect(() => {
    if (isLoading) return
    const id = getEventIdFromUrl()
    if (!id || !navRef.current) return
    const t = setTimeout(() => {
      navRef.current.navigate('EventDetail', { eventId: id })
      if (Platform.OS === 'web') window.history.replaceState({}, '', window.location.pathname)
    }, 600)
    return () => clearTimeout(t)
  }, [isLoading])

  if (isLoading) {
    return (
      <View style={[ss.splash, { backgroundColor: colors.background }]}>
        <Text style={[ss.logo, { color: colors.primary }]}>REDE</Text>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
      </View>
    )
  }

  const navTheme = {
    ...(colors.isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(colors.isDark ? DarkTheme : DefaultTheme).colors,
      background: colors.background, card: colors.surface,
      text: colors.textPrimary, border: colors.border,
    },
  }

  return (
    <NavigationContainer theme={navTheme} ref={navRef}>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  )
}

const ss = StyleSheet.create({
  splash: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logo:   { fontSize: 42, fontWeight: '900', letterSpacing: -1 },
})
