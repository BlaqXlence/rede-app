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
  attending:        [],
  searchResults:    [],
  recentSearches:   [],
  selectedCategory: 'all',
  isLoadingEvents:  false,

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

    // Build local event immediately — shows up in feed right away
    const localEvent = {
      ...draft,
      id: `EVT-${generateEventId()}`,
      organizer: {
        id:       user?.id || 'local',
        name:     user?.name || 'You',
        phone:    user?.phone || '',
        avatar:   user?.avatar || null,
        verified: user?.verified || false,
      },
      attendeeCount: 0,
      createdAt: new Date().toISOString(),
    }

    // Add to local store immediately so user sees it
    const events = [localEvent, ...get().events]
    const loc = get().userLocation || { lat: DEFAULT_CITY.lat, lng: DEFAULT_CITY.lng }
    set({ events })
    get()._buildFeed(loc.lat, loc.lng)

    // Try to save to database in background
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

      // Replace local event with real DB event
      const dbEvent = {
        ...response.event,
        location: {
          ...response.event.location,
          venueName: draft.location.venueName,
          area:      draft.location.area,
          city:      draft.location.city,
          mapsLink:  draft.location.mapsLink,
        },
      }
      const updatedEvents = get().events.map(e => e.id === localEvent.id ? dbEvent : e)
      set({ events: updatedEvents })
      get()._buildFeed(loc.lat, loc.lng)
      console.log('✅ Event saved to DB:', dbEvent.id)
      return dbEvent

    } catch (err) {
      console.warn('DB save failed, kept locally:', err.message)
      // Return the local event — app still works
      return localEvent
    }
  },

  joinEvent: async (id) => {
    const events = get().events.map(e =>
      e.id === id ? { ...e, attendeeCount: e.attendeeCount + 1 } : e
    )
    set({ events, attending: [...new Set([...get().attending, id])] })
    try { await eventsApi.join(id) } catch {}
  },

  leaveEvent: async (id) => {
    const events = get().events.map(e =>
      e.id === id ? { ...e, attendeeCount: Math.max(0, e.attendeeCount - 1) } : e
    )
    set({ events, attending: get().attending.filter(x => x !== id) })
    try { await eventsApi.leave(id) } catch {}
  },

  setEventsLocal: (events) => set({ events }),
  isAttending:    (id) => get().attending.includes(id),
  getEventById:   (id) => get().events.find(e => e.id === id),
}))

export default useEventsStore
