/**
 * api.js — All API calls
 * Token stored as plain string — no JSON.parse wrapper
 */
import AsyncStorage from '@react-native-async-storage/async-storage'

const BASE_URL = 'https://web-production-e695b.up.railway.app/api/v1'

async function getHeaders() {
  const token = await AsyncStorage.getItem('rede:token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function request(method, path, body) {
  const headers = await getHeaders()
  const res = await fetch(`${BASE_URL}${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

// Build query string without URLSearchParams (not reliable on all Android)
function buildQuery(params = {}) {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')
}

export const authApi = {
  sendOtp:       (phone)       => request('POST', '/auth/otp/send', { phone }),
  verifyOtp:     (phone, code) => request('POST', '/auth/otp/verify', { phone, code }),
  updateProfile: (data)        => request('PUT',  '/auth/profile', data),
  getProfile:    ()            => request('GET',  '/auth/profile'),
  getOrganizer:      (id) => request('GET',  `/auth/organizer/${id}`),
  searchOrganisers:  (q)  => request('GET',  `/auth/search-organisers?q=${encodeURIComponent(q)}`),
}

export const eventsApi = {
  list:      (params)   => request('GET',    `/events?${buildQuery(params)}`),
  listMore:  (params)   => request('GET',    `/events?${buildQuery(params)}`),
  getById:   (id)       => request('GET',    `/events/${id}`),
  create:    (data)     => request('POST',   '/events', data),
  update:    (id, data) => request('PUT',    `/events/${id}`, data),
  delete:    (id)       => request('DELETE', `/events/${id}`),
  join:      (id)       => request('POST',   `/events/${id}/join`),
  leave:     (id)       => request('POST',   `/events/${id}/leave`),
  mine:      ()         => request('GET',    '/events/mine'),
  attending: ()         => request('GET',    '/events/attending'),
  // Get attendees list for an event
  attendees: (id)       => request('GET',    `/events/${id}/attendees`),
  // Check if current user is attending (server-side truth)
  checkAttending: (id)  => request('GET',    `/events/${id}/attending-check`),
}

export const reviewsApi = {
  get:    (eventId)                  => request('GET',  `/events/${eventId}/reviews`),
  create: (eventId, rating, comment) => request('POST', `/events/${eventId}/reviews`, { rating, comment }),
}

export const commentsApi = {
  get:    (eventId)            => request('GET',    `/events/${eventId}/comments`),
  post:   (eventId, text)      => request('POST',   `/events/${eventId}/comments`, { text }),
  delete: (eventId, commentId) => request('DELETE', `/events/${eventId}/comments/${commentId}`),
  // Server-side check if user can comment
  canComment: (eventId)        => request('GET',    `/events/${eventId}/can-comment`),
}

export const searchApi = {
  search: (q, params = {}) =>
    request('GET', `/search?q=${encodeURIComponent(q)}&${buildQuery(params)}`),
}

export const uploadApi = {
  upload: (base64Image) => request('POST', '/upload', { image: base64Image }),
}
