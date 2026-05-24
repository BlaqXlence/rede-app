export const APP_NAME = 'MeetUG'

export const DEFAULT_LOCATION = {
  lat: 0.3476,
  lng: 32.5825,
  city: 'Kampala',
  country: 'Uganda',
}

export const UGANDA_PHONE_CODE = '+256'

export const NEARBY_RADIUS_KM = 15
export const MAX_DISCOVERY_RADIUS_KM = 100

export const EVENT_CATEGORIES = [
  { id: 'all',     label: 'All',        emoji: '✨' },
  { id: 'party',   label: 'Parties',    emoji: '🎉' },
  { id: 'music',   label: 'Music',      emoji: '🎵' },
  { id: 'sports',  label: 'Sports',     emoji: '⚽' },
  { id: 'dancing', label: 'Dancing',    emoji: '💃' },
  { id: 'games',   label: 'Table Games',emoji: '🎮' },
  { id: 'food',    label: 'Food & Drinks',emoji: '🍽️' },
  { id: 'outdoor', label: 'Outdoor',    emoji: '🌿' },
  { id: 'art',     label: 'Art & Culture',emoji: '🎨' },
]

// Home feed section order
export const HOME_SECTIONS = [
  { id: 'happeningNow', title: 'Happening Now 🔴', categoryId: null },
  { id: 'party',   title: 'Parties 🎉',       categoryId: 'party' },
  { id: 'sports',  title: 'Sports ⚽',         categoryId: 'sports' },
  { id: 'music',   title: 'Music & Concerts 🎵', categoryId: 'music' },
  { id: 'dancing', title: 'Dancing 💃',        categoryId: 'dancing' },
  { id: 'food',    title: 'Food & Drinks 🍽️', categoryId: 'food' },
  { id: 'games',   title: 'Table Games 🎮',   categoryId: 'games' },
  { id: 'outdoor', title: 'Outdoor 🌿',       categoryId: 'outdoor' },
]

export const EVENT_RULES = {
  titleMin: 5,
  titleMax: 80,
  descriptionMin: 20,
  descriptionMax: 1000,
  minLeadTimeHours: 2,
  maxLeadTimeDays: 180,
  minAttendees: 2,
  maxAttendees: 10000,
}

export const SCORE_WEIGHTS = {
  distance: 0.45,
  timing: 0.35,
  popularity: 0.20,
  categoryBoost: 1.25,
}

export const API_BASE_URL = __DEV__
  ? 'http://localhost:4000/api/v1'
  : 'https://api.meetug.app/v1'

export const PAYMENT = {
  provider: 'pesapal',
  currency: 'UGX',
  platformFeePercent: 8,
  enabled: false,
}
