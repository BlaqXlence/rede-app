import React, { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import useAuthStore from '../store/authStore'
import useEventsStore from '../store/eventsStore'
import colors from '../constants/colors'

import WelcomeScreen from '../screens/auth/WelcomeScreen'
import PhoneScreen from '../screens/auth/PhoneScreen'
import OtpScreen from '../screens/auth/OtpScreen'
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen'
import HomeScreen from '../screens/main/HomeScreen'
import SearchScreen from '../screens/main/SearchScreen'
import CreateEventScreen from '../screens/main/CreateEventScreen'
import ProfileScreen from '../screens/main/ProfileScreen'
import EventDetailScreen from '../screens/main/EventDetailScreen'
import CategoryEventsScreen from '../screens/main/CategoryEventsScreen'

const AuthStack = createNativeStackNavigator()
const MainStack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function TabIcon({ name, focused }) {
  const icons = {
    Home:    { active: '🏠', inactive: '🏠' },
    Search:  { active: '🔍', inactive: '🔍' },
    Create:  { active: '➕', inactive: '➕' },
    Profile: { active: '👤', inactive: '👤' },
  }
  const color = focused ? colors.primary : colors.textHint
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icons[name]?.active}</Text>
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textHint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Home"    component={HomeScreen}        options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Search"  component={SearchScreen}      options={{ tabBarLabel: 'Search' }} />
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
  const { requestLocation, loadRecentSearches } = useEventsStore()

  useEffect(() => {
    initialize()
    loadRecentSearches()
  }, [])

  useEffect(() => {
    if (isAuthenticated) requestLocation()
  }, [isAuthenticated])

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashLogo}>MeetUG</Text>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      </View>
    )
  }

  return (
    <NavigationContainer theme={{ colors: { background: colors.background } }}>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  splashLogo: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: -1,
  },
})
