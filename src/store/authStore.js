import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { authApi } from '../services/api'

const ALL_KEYS = [
  'rede:user', 'rede:token',
  'rede:attending', 'rede:liked',
  'rede:events:cache', 'rede:searches',
]

const useAuthStore = create((set, get) => ({
  user:            null,
  isAuthenticated: false,
  isLoading:       true,

  initialize: async () => {
    try {
      const [userRaw, token] = await Promise.all([
        AsyncStorage.getItem('rede:user'),
        AsyncStorage.getItem('rede:token'),
      ])
      if (userRaw && token) {
        set({ user: JSON.parse(userRaw), isAuthenticated: true, isLoading: false })
        authApi.getProfile()
          .then(d => {
            if (d.user) {
              AsyncStorage.setItem('rede:user', JSON.stringify(d.user))
              set({ user: d.user })
            }
          })
          .catch(err => {
            if (err.message?.includes('401') || err.message?.includes('token')) {
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

  sendOtp: async (phone) => authApi.sendOtp(phone),

  verifyOtp: async (phone, code) => {
    const data = await authApi.verifyOtp(phone, code)
    await AsyncStorage.setItem('rede:token', data.token)
    await AsyncStorage.setItem('rede:user', JSON.stringify(data.user))
    set({ user: data.user, isAuthenticated: true })
    return { isNewUser: data.isNewUser }
  },

  saveProfile: async (profileData) => {
    try {
      const data = await authApi.updateProfile(profileData)
      await AsyncStorage.setItem('rede:user', JSON.stringify(data.user))
      set({ user: data.user, isAuthenticated: true })
    } catch (err) {
      // Still mark authenticated even if profile save fails
      const user = { ...get().user, ...profileData }
      await AsyncStorage.setItem('rede:user', JSON.stringify(user))
      set({ user, isAuthenticated: true })
      throw err
    }
  },

  updateProfile: async (changes) => {
    const data = await authApi.updateProfile(changes)
    await AsyncStorage.setItem('rede:user', JSON.stringify(data.user))
    set({ user: data.user })
    return { success: true }
  },

  // LOGOUT — guaranteed to work on web and native
  logout: async () => {
    try {
      await AsyncStorage.multiRemove(ALL_KEYS)
    } catch {}
    set({ user: null, isAuthenticated: false, isLoading: false })
    // On web: force a full page reload so React state fully resets
    if (typeof window !== 'undefined' && window.location) {
      setTimeout(() => { window.location.href = '/' }, 100)
    }
  },
}))

export default useAuthStore
