import AsyncStorage from '@react-native-async-storage/async-storage'

// Hardcoded to the real Railway URL — no more env variable issues
const BASE_URL = 'https://web-production-e695b.up.railway.app/api/v1'

async function getHeaders() {
  const token = await AsyncStorage.getItem('rede:token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${JSON.parse(token)}` } : {}),
  }
}

async function request(method, path, body) {
  const headers = await getHeaders()
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

export const authApi = {
  sendOtp:       (phone)       => request('POST', '/auth/otp/send', { phone }),
  verifyOtp:     (phone, code) => request('POST', '/auth/otp/verify', { phone, code }),
  updateProfile: (data)        => request('PUT',  '/auth/profile', data),
  getProfile:    ()            => request('GET',  '/auth/profile'),
}

export const eventsApi = {
  list:      (params)   => request('GET',    `/events?${new URLSearchParams(params)}`),
  getById:   (id)       => request('GET',    `/events/${id}`),
  create:    (data)     => request('POST',   '/events', data),
  update:    (id, data) => request('PUT',    `/events/${id}`, data),
  delete:    (id)       => request('DELETE', `/events/${id}`),
  join:      (id)       => request('POST',   `/events/${id}/join`),
  leave:     (id)       => request('POST',   `/events/${id}/leave`),
  mine:      ()         => request('GET',    '/events/mine'),
  attending: ()         => request('GET',    '/events/attending'),
}
EOFcat > ~/Desktop/REDE/rede-app/src/services/api.js << 'EOF'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Hardcoded to the real Railway URL — no more env variable issues
const BASE_URL = 'https://web-production-e695b.up.railway.app/api/v1'

async function getHeaders() {
  const token = await AsyncStorage.getItem('rede:token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${JSON.parse(token)}` } : {}),
  }
}

async function request(method, path, body) {
  const headers = await getHeaders()
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

export const authApi = {
  sendOtp:       (phone)       => request('POST', '/auth/otp/send', { phone }),
  verifyOtp:     (phone, code) => request('POST', '/auth/otp/verify', { phone, code }),
  updateProfile: (data)        => request('PUT',  '/auth/profile', data),
  getProfile:    ()            => request('GET',  '/auth/profile'),
}

export const eventsApi = {
  list:      (params)   => request('GET',    `/events?${new URLSearchParams(params)}`),
  getById:   (id)       => request('GET',    `/events/${id}`),
  create:    (data)     => request('POST',   '/events', data),
  update:    (id, data) => request('PUT',    `/events/${id}`, data),
  delete:    (id)       => request('DELETE', `/events/${id}`),
  join:      (id)       => request('POST',   `/events/${id}/join`),
  leave:     (id)       => request('POST',   `/events/${id}/leave`),
  mine:      ()         => request('GET',    '/events/mine'),
  attending: ()         => request('GET',    '/events/attending'),
}
