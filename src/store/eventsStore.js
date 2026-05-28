/**
 * eventsStore.js
 * - createEvent saves locally first, then DB in background
 * - joinEvent/leaveEvent update count optimistically from server response
 * - attending list synced from server on load
 */
import { create } from 'zustand'
import * as ExpoLocation from 'expo-location'
import { MOCK_EVENTS } from '../data/mockEvents'
import { buildHomeFeed, searchEvents } from '../utils/distance'
import { DEFAULT_CITY } from '../constants/config'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { generateEventId } from '../utils/formatters'
import { eventsApi } from '../services/api'

const useEventsStore = create((set, get) => ({
  userLocation:     null,
  locationName:     'Kampala',
  locationPermission: null,
  events:           MOCK_EVENTS,
  feed:             { byCategory: {}, happeningNow: [], all: [] },
  attending:        [],   // event IDs user is attending (local cache)
  searchResults:    [],
  recentSearches:   [],
  selectedCategory: 'all',
  isLoadingEvents:  false,
  likedEvents:      [],    // event IDs the user has liked (heart)

  requestLocation: async () => {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync()
      set({ locationPermission: status })
      if (status !== 'granted') {
        get()._buildFeed(DEFAULT_CITY.lat, DEFAULT_CITY.lng)
        await get()._fetchEvents(DEFAULT_CITY.lat, DEFAULT_CITY.lng)
        return
      }
      const pos = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced })
      const { latitude, longitude } = pos.coords
      const [place] = await ExpoLocation.reverseGeocodeAsync({ latitude, longitude })
      const name = place?.district || place?.city || place?.region || 'Kampala'
      set({ userLocation: { lat: latitude, lng: longitude }, locationName: name })
      get()._buildFeed(latitude, longitude)
      await get()._fetchEvents(latitude, longitude)
    } catch {
      get()._buildFeed(DEFAULT_CITY.lat, DEFAULT_CITY.lng)
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
      // Also sync attending list from server
      try {
        const attData = await eventsApi.attending()
        const attendingIds = (attData.events || []).map(e => e.id)
        set({ attending: attendingIds })
      } catch {}
    } catch (err) {
      console.log('Using local events:', err.message)
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

    // Save locally first so user sees it immediately
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
    const loc = get().userLocation || { lat: DEFAULT_CITY.lat, lng: DEFAULT_CITY.lng }
    set({ events })
    get()._buildFeed(loc.lat, loc.lng)

    // Save to DB in background
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
      const updatedEvents = get().events.map(e => e.id === localEvent.id ? dbEvent : e)
      set({ events: updatedEvents })
      get()._buildFeed(loc.lat, loc.lng)
      return dbEvent
    } catch (err) {
      console.warn('DB save failed, removing local event:', err.message)
      // Remove the local placeholder — don't show broken events
      const withoutLocal = get().events.filter(e => e.id !== localEvent.id)
      set({ events: withoutLocal })
      get()._buildFeed(loc.lat, loc.lng)
      throw new Error('Could not save event. Check your connection and try again.')
    }
  },

  // Optimistic join — updates count immediately from server response
  joinEvent: async (eventId) => {
    // Optimistic update
    set(state => ({
      events:    state.events.map(e => e.id === eventId ? { ...e, attendeeCount: e.attendeeCount + 1 } : e),
      attending: [...new Set([...state.attending, eventId])],
    }))
    try {
      const res = await eventsApi.join(eventId)
      // Sync real count from server
      if (res.attendeeCount !== undefined) {
        set(state => ({
          events: state.events.map(e => e.id === eventId ? { ...e, attendeeCount: res.attendeeCount } : e),
        }))
      }
    } catch (err) {
      // Revert on failure
      set(state => ({
        events:    state.events.map(e => e.id === eventId ? { ...e, attendeeCount: Math.max(0, e.attendeeCount - 1) } : e),
        attending: state.attending.filter(id => id !== eventId),
      }))
      throw err
    }
  },

  leaveEvent: async (eventId) => {
    set(state => ({
      events:    state.events.map(e => e.id === eventId ? { ...e, attendeeCount: Math.max(0, e.attendeeCount - 1) } : e),
      attending: state.attending.filter(id => id !== eventId),
    }))
    try {
      const res = await eventsApi.leave(eventId)
      if (res.attendeeCount !== undefined) {
        set(state => ({
          events: state.events.map(e => e.id === eventId ? { ...e, attendeeCount: res.attendeeCount } : e),
        }))
      }
    } catch {}
  },

  // Server-side truth check for attending status
  checkAttending: async (eventId) => {
    try {
      const res = await eventsApi.checkAttending(eventId)
      if (res.attending && !get().attending.includes(eventId)) {
        set(state => ({ attending: [...state.attending, eventId] }))
      } else if (!res.attending && get().attending.includes(eventId)) {
        set(state => ({ attending: state.attending.filter(id => id !== eventId) }))
      }
      return res.attending
    } catch {
      return get().attending.includes(eventId)
    }
  },

  toggleLike: async (eventId) => {
    const liked = get().likedEvents
    const updated = liked.includes(eventId)
      ? liked.filter(id => id !== eventId)
      : [...liked, eventId]
    set({ likedEvents: updated })
    await AsyncStorage.setItem('rede:liked', JSON.stringify(updated))
  },

  loadLiked: async () => {
    const saved = await AsyncStorage.getItem('rede:liked')
    if (saved) set({ likedEvents: JSON.parse(saved) })
  },

  isLiked: (eventId) => get().likedEvents.includes(eventId),
  setEventsLocal: (events) => set({ events }),
  isAttending:    (id) => get().attending.includes(id),
  getEventById:   (id) => get().events.find(e => e.id === id),
}))

export default useEventsStore

// ── Liked events (persisted to AsyncStorage) ──────────────────
