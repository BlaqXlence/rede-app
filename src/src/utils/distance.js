import { SCORE_WEIGHTS, NEARBY_RADIUS_KM } from '../constants/config'

export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg) {
  return deg * (Math.PI / 180)
}

export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)}m`
  if (km < 10) return `${km.toFixed(1)}km`
  return `${Math.round(km)}km`
}

export function isHappeningNow(event) {
  const now = Date.now()
  return (
    new Date(event.startTime).getTime() <= now &&
    new Date(event.endTime).getTime() >= now
  )
}

export function scoreEvent(event, userLat, userLon, categoryPreferences = []) {
  const now = Date.now()
  const startMs = new Date(event.startTime).getTime()
  if (startMs < now && !isHappeningNow(event)) return 0

  const km = haversine(userLat, userLon, event.location.lat, event.location.lng)
  const hoursUntil = Math.max(0, (startMs - now) / 3_600_000)

  const distanceScore = Math.max(0, 100 - km * 2)

  let timingScore
  if (isHappeningNow(event)) timingScore = 100
  else if (hoursUntil <= 24) timingScore = 85
  else if (hoursUntil <= 72) timingScore = 65
  else if (hoursUntil <= 168) timingScore = 40
  else timingScore = 20

  const capacity = event.maxAttendees || 50
  const popularityScore = Math.min((event.attendeeCount / capacity) * 100, 100)

  const raw =
    distanceScore * SCORE_WEIGHTS.distance +
    timingScore * SCORE_WEIGHTS.timing +
    popularityScore * SCORE_WEIGHTS.popularity

  const boost = categoryPreferences.includes(event.category) ? SCORE_WEIGHTS.categoryBoost : 1.0
  return Math.round(raw * boost)
}

// Returns events grouped by category, each sorted by score
export function buildHomeFeed(events, userLat, userLon) {
  const now = Date.now()

  const enriched = events
    .map(e => ({
      ...e,
      distance: haversine(userLat, userLon, e.location.lat, e.location.lng),
      score: scoreEvent(e, userLat, userLon),
      isNow: isHappeningNow(e),
    }))
    .filter(e => new Date(e.endTime).getTime() > now)

  const byCategory = {}
  enriched.forEach(e => {
    if (!byCategory[e.category]) byCategory[e.category] = []
    byCategory[e.category].push(e)
  })

  Object.keys(byCategory).forEach(cat => {
    byCategory[cat].sort((a, b) => b.score - a.score)
  })

  const happeningNow = enriched.filter(e => e.isNow).sort((a, b) => b.score - a.score)

  return { byCategory, happeningNow, all: enriched.sort((a, b) => b.score - a.score) }
}

export function searchEvents(events, query, userLat, userLon) {
  const q = query.toLowerCase().trim()
  if (!q) return []
  return events
    .filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.location.name.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q)
    )
    .map(e => ({
      ...e,
      distance: haversine(userLat, userLon, e.location.lat, e.location.lng),
    }))
    .sort((a, b) => a.distance - b.distance)
}
