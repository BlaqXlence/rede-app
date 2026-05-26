import React, { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet, Text, Platform } from 'react-native'
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Svg, Path, Circle } from 'react-native-svg'

import useAuthStore   from '../store/authStore'
import useEventsStore from '../store/eventsStore'
import useThemeStore  from '../store/themeStore'

import WelcomeScreen      from '../screens/auth/WelcomeScreen'
import PhoneScreen        from '../screens/auth/PhoneScreen'
import OtpScreen          from '../screens/auth/OtpScreen'
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen'

import HomeScreen           from '../screens/main/HomeScreen'
import CreateEventScreen    from '../screens/main/CreateEventScreen'
import ProfileScreen        from '../screens/main/ProfileScreen'
import EventDetailScreen    from '../screens/main/EventDetailScreen'
import CategoryEventsScreen from '../screens/main/CategoryEventsScreen'
import EditEventScreen      from '../screens/main/EditEventScreen'
import SearchScreen         from '../screens/main/SearchScreen'
import OrganizerScreen      from '../screens/main/OrganizerScreen'

const AuthStack = createNativeStackNavigator()
const MainStack = createNativeStackNavigator()
const Tab       = createBottomTabNavigator()

function HomeIcon({ color, size }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12L12 4l9 8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  )
}
function PlusIcon({ color, size }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8"/>
      <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  )
}
function ProfileIcon({ color, size }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8"/>
      <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  )
}

function MainTabs() {
  const { colors } = useThemeStore()
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textHint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor:  colors.border,
          borderTopWidth:  1,
          height:          Platform.OS === 'ios' ? 82 : 60,
          paddingBottom:   Platform.OS === 'ios' ? 24 : 8,
          paddingTop:      6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color }) => {
          if (route.name === 'Home')    return <HomeIcon    color={color} size={22} />
          if (route.name === 'Create')  return <PlusIcon    color={color} size={22} />
          if (route.name === 'Profile') return <ProfileIcon color={color} size={22} />
        },
      })}
    >
      <Tab.Screen name="Home"    component={HomeScreen}        options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Create"  component={CreateEventScreen} options={{ tabBarLabel: 'Create' }} />
      <Tab.Screen name="Profile" component={ProfileScreen}     options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  )
}

function MainNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <MainStack.Screen name="Tabs"           component={MainTabs} />
      <MainStack.Screen name="EventDetail"    component={EventDetailScreen} />
      <MainStack.Screen name="CategoryEvents" component={CategoryEventsScreen} />
      <MainStack.Screen name="EditEvent"      component={EditEventScreen} />
      <MainStack.Screen name="Search"         component={SearchScreen} />
      <MainStack.Screen name="Organizer"      component={OrganizerScreen} />
    </MainStack.Navigator>
  )
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <AuthStack.Screen name="Welcome"      component={WelcomeScreen} />
      <AuthStack.Screen name="Phone"        component={PhoneScreen} />
      <AuthStack.Screen name="Otp"          component={OtpScreen} />
      <AuthStack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </AuthStack.Navigator>
  )
}

export default function RootNavigator() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore()
  const { requestLocation, loadRecentSearches }    = useEventsStore()
  const { colors, initialize: initTheme }          = useThemeStore()

  useEffect(() => {
    initialize()
    initTheme()
    loadRecentSearches()
  }, [])

  useEffect(() => {
    if (isAuthenticated) requestLocation()
  }, [isAuthenticated])

  if (isLoading) {
    return (
      <View style={[styles.splash, { backgroundColor: colors.background }]}>
        <Text style={[styles.splashLogo, { color: colors.primary }]}>REDE</Text>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      </View>
    )
  }

  const navTheme = {
    ...(colors.isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(colors.isDark ? DarkTheme : DefaultTheme).colors,
      background: colors.background,
      card:       colors.surface,
      text:       colors.textPrimary,
      border:     colors.border,
    },
  }

  return (
    <NavigationContainer theme={navTheme}>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  splash: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  splashLogo: { fontSize: 40, fontWeight: '900', letterSpacing: -1 },
})
