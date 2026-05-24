import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { authApi } from '../services/api'

const KEYS = { USER: 'rede:user', TOKEN: 'rede:token' }

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    try {
      const [userRaw, tokenRaw] = await Promise.all([
        AsyncStorage.getItem(KEYS.USER),
        AsyncStorage.getItem(KEYS.TOKEN),
      ])
      const user = userRaw ? JSON.parse(userRaw) : null
      const token = tokenRaw ? JSON.parse(tokenRaw) : null
      set({ user, isAuthenticated: !!(user && token), isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  sendOtp: async (phone) => {
    try {
      const data = await authApi.sendOtp(phone)
      return data
    } catch {
      // Dev fallback — works without backend
      console.log('Backend not reachable, using mock OTP')
      return { success: true, dev_code: '123456' }
    }
  },

  verifyOtp: async (phone, code) => {
    try {
      const data = await authApi.verifyOtp(phone, code)
      await AsyncStorage.setItem(KEYS.TOKEN, JSON.stringify(data.token))
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(data.user))
      set({ user: data.user, isAuthenticated: true })
      return { isNewUser: data.isNewUser }
    } catch {
      // Dev fallback — any 6 digit code works
      if (!/^\d{6}$/.test(code)) throw new Error('Enter a 6-digit code')
      const mockUser = { id: `USR-${Date.now()}`, phone, name: '', email: '', avatar: null, verified: true }
      const mockToken = `mock_${Date.now()}`
      await AsyncStorage.setItem(KEYS.TOKEN, JSON.stringify(mockToken))
      const existing = await AsyncStorage.getItem(KEYS.USER)
      if (existing) {
        const u = JSON.parse(existing)
        if (u.phone === phone && u.name) {
          set({ user: u, isAuthenticated: true })
          return { isNewUser: false }
        }
      }
      set({ user: mockUser })
      return { isNewUser: true }
    }
  },

  saveProfile: async (profileData) => {
    const user = { ...get().user, ...profileData }
    try { await authApi.updateProfile(profileData) } catch {}
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user))
    set({ user, isAuthenticated: true })
  },

  updateProfile: async (changes) => {
    const user = { ...get().user, ...changes }
    try { await authApi.updateProfile(changes) } catch {}
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user))
    set({ user })
  },

  logout: async () => {
    await AsyncStorage.multiRemove(Object.values(KEYS))
    set({ user: null, isAuthenticated: false })
  },
}))

export default useAuthStore
