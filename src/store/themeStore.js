/**
 * themeStore.js
 * Global theme state — dark (default) or light.
 * Persisted to AsyncStorage so it survives app restarts.
 */
import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { darkTheme, lightTheme } from '../constants/colors'

const useThemeStore = create((set, get) => ({
  isDark:  true,
  colors:  darkTheme,

  initialize: async () => {
    try {
      const saved = await AsyncStorage.getItem('rede:theme')
      const isDark = saved === null ? true : saved === 'dark'
      set({ isDark, colors: isDark ? darkTheme : lightTheme })
    } catch {}
  },

  toggle: async () => {
    const isDark = !get().isDark
    set({ isDark, colors: isDark ? darkTheme : lightTheme })
    await AsyncStorage.setItem('rede:theme', isDark ? 'dark' : 'light')
  },

  setDark: async () => {
    set({ isDark: true, colors: darkTheme })
    await AsyncStorage.setItem('rede:theme', 'dark')
  },

  setLight: async () => {
    set({ isDark: false, colors: lightTheme })
    await AsyncStorage.setItem('rede:theme', 'light')
  },
}))

export default useThemeStore
