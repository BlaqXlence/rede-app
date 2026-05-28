/**
 * authStore.js
 * Logout clears AsyncStorage AND resets state so NavigationContainer
 * switches to AuthNavigator immediately.
 */
import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { authApi } from '../services/api'

const KEYS = { USER: 'rede:user', TOKEN: 'rede:token' }

const useAuthStore = create((set, get) => ({
  user:            null,
  isAuthenticated: false,
  isLoading:       true,

  initialize: async () => {
    try {
      const [userRaw, token] = await Promise.all([
        AsyncStorage.getItem(KEYS.USER),
        AsyncStorage.getItem(KEYS.TOKEN),
      ])
      if (userRaw && token) {
        const user = JSON.parse(userRaw)
        set({ user, isAuthenticated: true, isLoading: false })
        // Silently refresh profile in background
        authApi.getProfile()
          .then(fresh => {
            if (fresh.user) {
              AsyncStorage.setItem(KEYS.USER, JSON.stringify(fresh.user))
              set({ user: fresh.user })
            }
          })
          .catch(err => {
            // 401 = token expired — log out smoothly
            if (err.message?.includes('401') || err.message?.toLowerCase().includes('token')) {
              get().logout()
            }
          })
      } else {
        set({ isLoading: false })
      }
    } catch {
      set({ isLoading: false })
    }
  },

  sendOtp: async (phone) => {
    const data = await authApi.sendOtp(phone)
    if (data.dev_code) console.log(`\n📱 OTP: ${data.dev_code}\n`)
    return data
  },

  verifyOtp: async (phone, code) => {
    const data = await authApi.verifyOtp(phone, code)
    await AsyncStorage.setItem(KEYS.TOKEN, data.token)
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(data.user))
    set({ user: data.user, isAuthenticated: true })
    return { isNewUser: data.isNewUser }
  },

  saveProfile: async (profileData) => {
    try {
      const data = await authApi.updateProfile({
        name:       profileData.name,
        email:      profileData.email || null,
        avatar_url: profileData.avatar || null,
      })
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(data.user))
      set({ user: data.user, isAuthenticated: true })
    } catch {
      const user = { ...get().user, ...profileData }
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user))
      set({ user, isAuthenticated: true })
    }
  },

  updateProfile: async (changes) => {
    const data = await authApi.updateProfile(changes)
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(data.user))
    set({ user: data.user })
    return { success: true }
  },

  // Logout — clears everything and flips isAuthenticated to false
  // This immediately triggers NavigationContainer to show AuthNavigator
  logout: async () => {
    try {
      await AsyncStorage.multiRemove(Object.values(KEYS))
    } catch {}
    // Set state AFTER clearing storage
    set({ user: null, isAuthenticated: false, isLoading: false })
  },
}))

export default useAuthStore
