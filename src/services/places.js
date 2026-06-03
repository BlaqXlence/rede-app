/**
 * Google Places API service — scoped to Uganda
 * Uses: Places Autocomplete + Place Details
 */

const KEY      = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY
const BASE_AC  = 'https://maps.googleapis.com/maps/api/place/autocomplete/json'
const BASE_DET = 'https://maps.googleapis.com/maps/api/place/details/json'
const BASE_MAP = 'https://maps.googleapis.com/maps/api/staticmap'

// Debounce helper
let debounceTimer = null
export function debounce(fn, ms) {
  return (...args) => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => fn(...args), ms)
  }
}

/**
 * Search for places in Uganda
 * @param {string} input - user typed text
 * @param {string} sessionToken - group requests into one billing session
 * @returns {Array} predictions
 */
export async function searchPlaces(input, sessionToken) {
  if (!input || input.length < 2) return []
  try {
    const params = new URLSearchParams({
      input,
      key:          KEY,
      sessiontoken: sessionToken,
      components:   'country:ug',          // Uganda only
      language:     'en',
      types:        'establishment|geocode',
    })
    const res  = await fetch(`${BASE_AC}?${params}`)
    const data = await res.json()
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Places autocomplete error:', data.status, data.error_message)
    }
    return data.predictions || []
  } catch (err) {
    console.error('Places search error:', err.message)
    return []
  }
}

/**
 * Get full details for a place (coordinates, city, area)
 * @param {string} placeId
 * @param {string} sessionToken - same token used for autocomplete
 */
export async function getPlaceDetails(placeId, sessionToken) {
  try {
    const params = new URLSearchParams({
      place_id:     placeId,
      key:          KEY,
      sessiontoken: sessionToken,
      fields:       'name,geometry,address_components,formatted_address',
      language:     'en',
    })
    const res  = await fetch(`${BASE_DET}?${params}`)
    const data = await res.json()
    if (data.status !== 'OK') {
      console.error('Place details error:', data.status)
      return null
    }
    const place = data.result
    const comps = place.address_components || []

    // Extract city and area from address components
    const getComp = types => comps.find(c => types.some(t => c.types.includes(t)))?.long_name || ''

    const city   = getComp(['locality', 'administrative_area_level_2'])
    const area   = getComp(['sublocality', 'sublocality_level_1', 'neighborhood', 'route'])
    const lat    = place.geometry?.location?.lat
    const lng    = place.geometry?.location?.lng

    return {
      name:             place.name || '',
      formattedAddress: place.formatted_address || '',
      city:             city || '',
      area:             area || '',
      lat,
      lng,
    }
  } catch (err) {
    console.error('Place details error:', err.message)
    return null
  }
}

/**
 * Build a static map image URL
 * @param {number} lat
 * @param {number} lng
 * @param {number} width  px
 * @param {number} height px
 * @param {number} zoom   1-21
 */
export function staticMapUrl(lat, lng, width = 600, height = 300, zoom = 15) {
  const params = new URLSearchParams({
    center:  `${lat},${lng}`,
    zoom:    String(zoom),
    size:    `${width}x${height}`,
    scale:   '2',
    markers: `color:0xFF6600|${lat},${lng}`,
    key:     KEY,
    style:   'feature:poi|visibility:simplified',
  })
  return `${BASE_MAP}?${params}`
}

/**
 * Generate a random session token (groups autocomplete + details into one billing session)
 */
export function newSessionToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}
