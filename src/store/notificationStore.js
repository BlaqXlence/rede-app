import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { authApi } from '../services/api'

const BASE = process.env.EXPO_PUBLIC_API_URL

async function getToken() {
  return AsyncStorage.getItem('rede:token')
}

async function apiFetch(path, opts = {}) {
  const token = await getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  })
  return res.json()
}

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unread:        0,
  loading:       false,

  fetchNotifications: async () => {
    set({ loading: true })
    try {
      const data = await apiFetch('/notifications')
      set({
        notifications: data.notifications || [],
        unread:        data.unread        || 0,
        loading:       false,
      })
    } catch {
      set({ loading: false })
    }
  },

  markAllRead: async () => {
    set({ unread: 0, notifications: get().notifications.map(n => ({ ...n, read: true })) })
    await apiFetch('/notifications/read', { method: 'POST' }).catch(() => {})
  },

  markRead: async (id) => {
    set({
      notifications: get().notifications.map(n => n.id === id ? { ...n, read: true } : n),
      unread: Math.max(0, get().unread - 1),
    })
    await apiFetch(`/notifications/${id}/read`, { method: 'POST' }).catch(() => {})
  },

  addLocal: (notif) => {
    set(s => ({
      notifications: [{ ...notif, id: Date.now().toString(), read: false, created_at: new Date().toISOString() }, ...s.notifications],
      unread: s.unread + 1,
    }))
  },
}))

export default useNotificationStore
