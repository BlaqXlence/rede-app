/**
 * authStore.js
 * Token stored as plain string — no JSON.parse wrapping.
 * Phone is already in +256XXXXXXXXX format from PhoneScreen.
 */
import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { authApi } from '../services/api'

const KEYS = {
  USER:  'rede:user',
  TOKEN: 'rede:token',
}

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
      const user = userRaw ? JSON.parse(userRaw) : null
      set({ user, isAuthenticated: !!(user && token), isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  sendOtp: async (phone) => {
    // phone is already in +256XXXXXXXXX format from PhoneScreen
    try {
      const data = await authApi.sendOtp(phone)
      if (data.dev_code) console.log(`\n📱 OTP: ${data.dev_code}\n`)
      return data
    } catch (err) {
      throw new Error(err.message || 'Could not send code')
    }
  },

  verifyOtp: async (phone, code) => {
    try {
      const data = await authApi.verifyOtp(phone, code)
      // Store token as plain string — no JSON.stringify
      await AsyncStorage.setItem(KEYS.TOKEN, data.token)
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(data.user))
      set({ user: data.user, isAuthenticated: true })
      return { isNewUser: data.isNewUser }
    } catch (err) {
      throw new Error(err.message || 'Verification failed')
    }
  },

  saveProfile: async (profileData) => {
    try {
      const data = await authApi.updateProfile({
        name:       profileData.name,
        email:      profileData.email || null,
        avatar_url: profileData.avatar || null,
      })
      const user = data.user
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user))
      set({ user, isAuthenticated: true })
    } catch (err) {
      // Save locally if API fails
      const user = { ...get().user, ...profileData }
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user))
      set({ user, isAuthenticated: true })
    }
  },

  updateProfile: async (changes) => {
    try {
      const data = await authApi.updateProfile(changes)
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(data.user))
      set({ user: data.user })
      return { success: true }
    } catch (err) {
      throw new Error(err.message)
    }
  },

  logout: async () => {
    await AsyncStorage.multiRemove(Object.values(KEYS))
    set({ user: null, isAuthenticated: false })
  },
}))

export default useAuthStore
