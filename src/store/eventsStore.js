/**
 * eventsStore.js
 * - attending list persisted to AsyncStorage (survives app restarts)
 * - liked events persisted
 * - cache for fast startup
 * - loadMore for pagination
 */
import { create } from 'zustand'
import * as ExpoLocation from 'expo-location'
import { MOCK_EVENTS } from '../data/mockEvents'
import { buildHomeFeed, searchEvents } from '../utils/distance'
import { DEFAULT_CITY } from '../constants/config'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { generateEventId } from '../utils/formatters'
import { eventsApi } from '../services/api'

const CACHE_KEY     = 'rede:events:cache'
const ATTENDING_KEY = 'rede:attending'
const LIKED_KEY     = 'rede:liked'

const useEventsStore = create((set, get) => ({
  userLocation:     null,
  locationName:     'Kampala',
  locationPermission: null,
  events:           [],
  feed:             { byCategory: {}, happeningNow: [], all: [] },
  attending:        [],
  likedEvents:      [],
  searchResults:    [],
  recentSearches:   [],
  selectedCategory: 'all',
  isLoadingEvents:  false,

  // Load persisted attending + liked on startup
  loadPersistedData: async () => {
    try {
      const [att, liked] = await Promise.all([
        AsyncStorage.getItem(ATTENDING_KEY),
        AsyncStorage.getItem(LIKED_KEY),
      ])
      if (att)   set({ attending:   JSON.parse(att) })
      if (liked) set({ likedEvents: JSON.parse(liked) })
    } catch {}
  },

  requestLocation: async () => {
    // Load cache instantly so screen fills right away
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY)
      if (cached) {
        const events = JSON.parse(cached)
        if (events?.length > 0) {
          // Filter out past events before showing cache
          const now    = new Date()
          const future = events.filter(e => new Date(e.endTime) > now)
          set({ events: future, isLoadingEvents: false })
          get()._buildFeed(DEFAULT_CITY.lat, DEFAULT_CITY.lng)
        }
      }
    } catch {}

    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync()
      set({ locationPermission: status })
      const loc = status === 'granted'
        ? await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced })
        : null
      if (loc) {
        const { latitude, longitude } = loc.coords
        const [place] = await ExpoLocation.reverseGeocodeAsync({ latitude, longitude })
        const name = place?.district || place?.city || place?.region || 'Kampala'
        set({ userLocation: { lat: latitude, lng: longitude }, locationName: name })
        get()._buildFeed(latitude, longitude)
        await get()._fetchEvents(latitude, longitude)
      } else {
        get()._buildFeed(DEFAULT_CITY.lat, DEFAULT_CITY.lng)
        await get()._fetchEvents(DEFAULT_CITY.lat, DEFAULT_CITY.lng)
      }
    } catch {
      get()._buildFeed(DEFAULT_CITY.lat, DEFAULT_CITY.lng)
      get()._fetchEvents(DEFAULT_CITY.lat, DEFAULT_CITY.lng).catch(() => {})
    }
  },

  _fetchEvents: async (lat, lng) => {
    set({ isLoadingEvents: true })
    try {
      const data = await eventsApi.list({ lat, lng, radius: 100, limit: 12 })
      if (data.events?.length > 0) {
        const now    = new Date()
        // Only future events on home feed
        const future = data.events.filter(e => new Date(e.endTime) > now)
        const sorted = [...future].sort((a, b) => {
          const aStart = new Date(a.startTime)
          const bStart = new Date(b.startTime)
          const aLive  = aStart <= now && new Date(a.endTime) >= now
          const bLive  = bStart <= now && new Date(b.endTime) >= now
          if (aLive && !bLive) return -1
          if (!aLive && bLive) return 1
          return aStart - bStart
        })
        set({ events: sorted })
        get()._buildFeed(lat, lng)
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(sorted)).catch(() => {})
      }
      // Sync attending from server
      try {
        const attData = await eventsApi.attending()
        const ids = (attData.events || []).map(e => e.id)
        set({ attending: ids })
        AsyncStorage.setItem(ATTENDING_KEY, JSON.stringify(ids)).catch(() => {})
      } catch {}
    } catch (err) {
      console.log('Using cached events:', err.message)
    } finally {
      set({ isLoadingEvents: false })
    }
  },

  _buildFeed: (lat, lng) => {
    const feed = buildHomeFeed(get().events, lat, lng)
    set({ feed })
  },

  setCategory: (cat) => set({ selectedCategory: cat }),

  search: (query) => {
    const loc = get().userLocation || { lat: DEFAULT_CITY.lat, lng: DEFAULT_CITY.lng }
    set({ searchResults: searchEvents(get().events, query, loc.lat, loc.lng) })
  },

  addRecentSearch: async (q) => {
    if (!q.trim()) return
    const updated = [q, ...get().recentSearches.filter(x => x !== q)].slice(0, 8)
    set({ recentSearches: updated })
    await AsyncStorage.setItem('rede:searches', JSON.stringify(updated))
  },

  loadRecentSearches: async () => {
    const saved = await AsyncStorage.getItem('rede:searches')
    if (saved) set({ recentSearches: JSON.parse(saved) })
  },

  createEvent: async (draft) => {
    const { user } = require('./authStore').default.getState()
    const localEvent = {
      ...draft,
      id: `EVT-${generateEventId()}`,
      organizer: {
        id: user?.id || 'local', name: user?.name || 'You',
        phone: user?.phone || '', avatar: user?.avatar || null,
        verified: user?.verified || false,
      },
      attendeeCount: 0,
      createdAt: new Date().toISOString(),
    }
    const events = [localEvent, ...get().events]
    const loc    = get().userLocation || { lat: DEFAULT_CITY.lat, lng: DEFAULT_CITY.lng }
    set({ events })
    get()._buildFeed(loc.lat, loc.lng)

    try {
      const response = await eventsApi.create({
        title:            draft.title,
        description:      draft.description,
        category:         draft.category,
        cover_image:      draft.coverImage,
        start_time:       draft.startTime,
        end_time:         draft.endTime,
        location_name:    draft.location.venueName || draft.location.name,
        location_address: draft.location.address,
        location_lat:     draft.location.lat,
        location_lng:     draft.location.lng,
        max_attendees:    draft.maxAttendees,
        entry_fee:        draft.entryFee || 0,
        tags:             draft.tags || [],
      })
      const dbEvent = {
        ...response.event,
        location: { ...response.event.location, venueName: draft.location.venueName, area: draft.location.area },
      }
      const updated = get().events.map(e => e.id === localEvent.id ? dbEvent : e)
      set({ events: updated })
      get()._buildFeed(loc.lat, loc.lng)
      get()._fetchEvents(loc.lat, loc.lng).catch(() => {})
      return dbEvent
    } catch (err) {
      // Remove local placeholder on failure
      const without = get().events.filter(e => e.id !== localEvent.id)
      set({ events: without })
      get()._buildFeed(loc.lat, loc.lng)
      throw new Error('Could not save event. Check your connection and try again.')
    }
  },

  joinEvent: async (eventId) => {
    const newAttending = [...new Set([...get().attending, eventId])]
    set(state => ({
      events:    state.events.map(e => e.id === eventId ? { ...e, attendeeCount: e.attendeeCount + 1 } : e),
      attending: newAttending,
    }))
    AsyncStorage.setItem(ATTENDING_KEY, JSON.stringify(newAttending)).catch(() => {})
    try {
      const res = await eventsApi.join(eventId)
      if (res.attendeeCount !== undefined) {
        set(state => ({
          events: state.events.map(e => e.id === eventId ? { ...e, attendeeCount: res.attendeeCount } : e),
        }))
      }
    } catch (err) {
      // Revert on failure
      const reverted = get().attending.filter(id => id !== eventId)
      set(state => ({
        events:    state.events.map(e => e.id === eventId ? { ...e, attendeeCount: Math.max(0, e.attendeeCount - 1) } : e),
        attending: reverted,
      }))
      AsyncStorage.setItem(ATTENDING_KEY, JSON.stringify(reverted)).catch(() => {})
      throw err
    }
  },

  leaveEvent: async (eventId) => {
    const newAttending = get().attending.filter(id => id !== eventId)
    set(state => ({
      events:    state.events.map(e => e.id === eventId ? { ...e, attendeeCount: Math.max(0, e.attendeeCount - 1) } : e),
      attending: newAttending,
    }))
    AsyncStorage.setItem(ATTENDING_KEY, JSON.stringify(newAttending)).catch(() => {})
    try {
      const res = await eventsApi.leave(eventId)
      if (res.attendeeCount !== undefined) {
        set(state => ({
          events: state.events.map(e => e.id === eventId ? { ...e, attendeeCount: res.attendeeCount } : e),
        }))
      }
    } catch {}
  },

  checkAttending: async (eventId) => {
    try {
      const res = await eventsApi.checkAttending(eventId)
      const attending = get().attending
      if (res.attending && !attending.includes(eventId)) {
        const updated = [...attending, eventId]
        set({ attending: updated })
        AsyncStorage.setItem(ATTENDING_KEY, JSON.stringify(updated)).catch(() => {})
      } else if (!res.attending && attending.includes(eventId)) {
        const updated = attending.filter(id => id !== eventId)
        set({ attending: updated })
        AsyncStorage.setItem(ATTENDING_KEY, JSON.stringify(updated)).catch(() => {})
      }
      return res.attending
    } catch {
      return get().attending.includes(eventId)
    }
  },

  toggleLike: async (eventId) => {
    const liked   = get().likedEvents
    const updated = liked.includes(eventId) ? liked.filter(id => id !== eventId) : [...liked, eventId]
    set({ likedEvents: updated })
    await AsyncStorage.setItem(LIKED_KEY, JSON.stringify(updated))
  },

  loadLiked: async () => {
    const saved = await AsyncStorage.getItem(LIKED_KEY)
    if (saved) set({ likedEvents: JSON.parse(saved) })
  },

  loadMore: async () => {
    const { events, userLocation } = get()
    const loc    = userLocation || { lat: DEFAULT_CITY.lat, lng: DEFAULT_CITY.lng }
    try {
      const data = await eventsApi.list({ lat: loc.lat, lng: loc.lng, radius: 100, limit: 10, offset: events.length })
      if (data.events?.length > 0) {
        const now    = new Date()
        const future = data.events.filter(e => new Date(e.endTime) > now)
        const ids    = new Set(events.map(e => e.id))
        const newOnes = future.filter(e => !ids.has(e.id))
        if (newOnes.length > 0) {
          set({ events: [...events, ...newOnes] })
          get()._buildFeed(loc.lat, loc.lng)
        }
      }
    } catch {}
  },

  deleteEventLocal: (eventId) => {
    set(state => ({ events: state.events.filter(e => e.id !== eventId) }))
    const loc = get().userLocation || { lat: DEFAULT_CITY.lat, lng: DEFAULT_CITY.lng }
    get()._buildFeed(loc.lat, loc.lng)
  },

  isLiked:     (id) => get().likedEvents.includes(id),
  isAttending: (id) => get().attending.includes(id),
  getEventById:(id) => get().events.find(e => e.id === id),
  setEventsLocal: (events) => set({ events }),
}))

export default useEventsStore
