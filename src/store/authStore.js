/**
 * authStore.js
 * Password-less return — if token expires, smoothly redirects to login
 * instead of crashing
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

        // Silently verify token is still valid
        try {
          const fresh = await authApi.getProfile()
          if (fresh.user) {
            await AsyncStorage.setItem(KEYS.USER, JSON.stringify(fresh.user))
            set({ user: fresh.user })
          }
        } catch (err) {
          // Token expired — log out smoothly, no crash
          if (err.message?.includes('401') || err.message?.includes('token') || err.message?.includes('unauthorized')) {
            console.log('Token expired, logging out gracefully')
            await get().logout()
          }
          // Other errors (network) — keep user logged in with cached data
        }
      } else {
        set({ isLoading: false })
      }
    } catch {
      set({ isLoading: false })
    }
  },

  sendOtp: async (phone) => {
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
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(data.user))
      set({ user: data.user, isAuthenticated: true })
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
    set({ user: null, isAuthenticated: false, isLoading: false })
  },
}))

export default useAuthStore
