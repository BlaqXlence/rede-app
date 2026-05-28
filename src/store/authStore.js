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
        set({ user: JSON.parse(userRaw), isAuthenticated: true, isLoading: false })
        authApi.getProfile()
          .then(d => { if (d.user) { AsyncStorage.setItem(KEYS.USER, JSON.stringify(d.user)); set({ user: d.user }) } })
          .catch(err => { if (err.message?.includes('401') || err.message?.includes('token')) get().logout() })
      } else {
        set({ isLoading: false })
      }
    } catch { set({ isLoading: false }) }
  },

  sendOtp:  async (phone) => authApi.sendOtp(phone),

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
        name: profileData.name, email: profileData.email || null, avatar_url: profileData.avatar || null,
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

  // LOGOUT — clears ALL storage keys then resets state
  logout: async () => {
    try {
      await AsyncStorage.multiRemove([
        KEYS.USER, KEYS.TOKEN,
        'rede:attending', 'rede:liked', 'rede:events:cache', 'rede:searches',
      ])
    } catch {}
    set({ user: null, isAuthenticated: false, isLoading: false })
  },
}))

export default useAuthStore
