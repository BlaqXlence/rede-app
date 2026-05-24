import AsyncStorage from '@react-native-async-storage/async-storage'

export const KEYS = {
  USER: 'meetug:user',
  AUTH_TOKEN: 'meetug:token',
  LOCATION_CACHE: 'meetug:location',
  CATEGORY_PREFS: 'meetug:category_prefs',
  RECENT_SEARCHES: 'meetug:recent_searches',
}

async function get(key) {
  try {
    const raw = await AsyncStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

async function set(key, value) {
  try { await AsyncStorage.setItem(key, JSON.stringify(value)) } catch {}
}

async function remove(key) {
  try { await AsyncStorage.removeItem(key) } catch {}
}

async function clear() {
  try { await AsyncStorage.multiRemove(Object.values(KEYS)) } catch {}
}

export const storage = { get, set, remove, clear }
