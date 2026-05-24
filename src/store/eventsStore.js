// eventsStore.js - See rede-final version for full comments
// Key fix: createEvent now returns the actual event object (was returning a Promise)
import { create } from 'zustand'
import * as ExpoLocation from 'expo-location'
import { MOCK_EVENTS } from '../data/mockEvents'
import { buildHomeFeed, searchEvents } from '../utils/distance'
import { DEFAULT_LOCATION } from '../constants/config'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { generateEventId } from '../utils/formatters'
import { eventsApi } from '../services/api'

const useEventsStore = create((set, get) => ({
  userLocation: null,
  locationName: DEFAULT_LOCATION.city,
  locationPermission: null,
  events: MOCK_EVENTS,
  feed: { byCategory: {}, happeningNow: [], all: [] },
  attending: [],
  searchResults: [],
  recentSearches: [],
  selectedCategory: 'all',
  isLoadingEvents: false,

  requestLocation: async () => {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync()
      set({ locationPermission: status })
      if (status !== 'granted') {
        get()._buildFeed(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng)
        await get()._fetchEvents(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng)
        return
      }
      const pos = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced })
      const { latitude, longitude } = pos.coords
      const [place] = await ExpoLocation.reverseGeocodeAsync({ latitude, longitude })
      const name = place?.district || place?.city || place?.region || DEFAULT_LOCATION.city
      await AsyncStorage.setItem('rede:location', JSON.stringify({ lat: latitude, lng: longitude, name }))
      set({ userLocation: { lat: latitude, lng: longitude }, locationName: name })
      get()._buildFeed(latitude, longitude)
      await get()._fetchEvents(latitude, longitude)
    } catch {
      get()._buildFeed(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng)
    }
  },

  _fetchEvents: async (lat, lng) => {
    set({ isLoadingEvents: true })
    try {
      const data = await eventsApi.list({ lat, lng, radius: 100 })
      if (data.events?.length > 0) {
        set({ events: data.events })
        get()._buildFeed(lat, lng)
      }
    } catch {
      console.log('API unreachable, using mock events')
    } finally {
      set({ isLoadingEvents: false })
    }
  },

  _buildFeed: (lat, lng) => {
    const feed = buildHomeFeed(get().events, lat, lng)
    set({ feed })
  },

  setCategory: (category) => set({ selectedCategory: category }),

  search: (query) => {
    const loc = get().userLocation || { lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng }
    set({ searchResults: searchEvents(get().events, query, loc.lat, loc.lng) })
  },

  addRecentSearch: async (query) => {
    if (!query.trim()) return
    const updated = [query, ...get().recentSearches.filter(q => q !== query)].slice(0, 8)
    set({ recentSearches: updated })
    await AsyncStorage.setItem('rede:searches', JSON.stringify(updated))
  },

  loadRecentSearches: async () => {
    const saved = await AsyncStorage.getItem('rede:searches')
    if (saved) set({ recentSearches: JSON.parse(saved) })
  },

  // THE FIX: this function is async and returns the actual event object.
  // Callers must await it — previously CreateEventScreen didn't await it,
  // so event.id was undefined, causing "Event not found".
  createEvent: async (draft) => {
    const { user } = require('./authStore').default.getState()
    let savedEvent = null

    try {
      // Try real database first
      const response = await eventsApi.create({
        title:            draft.title,
        description:      draft.description,
        category:         draft.category,
        cover_image:      draft.coverImage,
        start_time:       draft.startTime,
        end_time:         draft.endTime,
        location_name:    draft.location.name,
        location_address: draft.location.address,
        location_lat:     draft.location.lat,
        location_lng:     draft.location.lng,
        max_attendees:    draft.maxAttendees,
        entry_fee:        draft.entryFee || 0,
        tags:             draft.tags || [],
      })
      savedEvent = response.event
    } catch (err) {
      // API down — create locally so the app still works
      console.warn('DB save failed, using local event:', err.message)
      savedEvent = {
        ...draft,
        id: `EVT-${generateEventId()}`,
        organizer: {
          id: user?.id || 'local',
          name: user?.name || 'You',
          phone: user?.phone || '',
          avatar: user?.avatar || null,
          verified: user?.verified || false,
        },
        attendeeCount: 0,
        createdAt: new Date().toISOString(),
      }
    }

    // Add to local store so it shows up immediately
    const events = [savedEvent, ...get().events]
    const loc = get().userLocation || { lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng }
    set({ events })
    get()._buildFeed(loc.lat, loc.lng)

    return savedEvent  // caller gets the real event, not a Promise
  },

  joinEvent: async (eventId) => {
    const events = get().events.map(e =>
      e.id === eventId ? { ...e, attendeeCount: e.attendeeCount + 1 } : e
    )
    set({ events, attending: [...new Set([...get().attending, eventId])] })
    try { await eventsApi.join(eventId) } catch {}
  },

  leaveEvent: async (eventId) => {
    const events = get().events.map(e =>
      e.id === eventId ? { ...e, attendeeCount: Math.max(0, e.attendeeCount - 1) } : e
    )
    set({ events, attending: get().attending.filter(id => id !== eventId) })
    try { await eventsApi.leave(eventId) } catch {}
  },

  isAttending: (eventId) => get().attending.includes(eventId),
  getEventById: (id) => get().events.find(e => e.id === id),
}))

export default useEventsStore
