export const APP_NAME = 'REDE'

export const DEFAULT_LOCATION = {
  lat: 0.3476,
  lng: 32.5825,
  city: 'Kampala',
  country: 'Uganda',
}

export const UGANDA_PHONE_CODE = '+256'
export const NEARBY_RADIUS_KM = 15
export const MAX_DISCOVERY_RADIUS_KM = 100

// Categories — each has a unique color pair for dark theme
export const EVENT_CATEGORIES = [
  { id: 'all',       label: 'All',           accent: '#FF6600', dark: '#CC4400' },
  { id: 'party',     label: 'Parties',       accent: '#E91E63', dark: '#880E4F' },
  { id: 'music',     label: 'Music',         accent: '#9C27B0', dark: '#4A148C' },
  { id: 'sports',    label: 'Sports',        accent: '#1976D2', dark: '#0D47A1' },
  { id: 'dancing',   label: 'Dancing',       accent: '#FF5722', dark: '#BF360C' },
  { id: 'games',     label: 'Table Games',   accent: '#FFA000', dark: '#E65100' },
  { id: 'food',      label: 'Food & Drinks', accent: '#2E7D32', dark: '#1B5E20' },
  { id: 'outdoor',   label: 'Outdoor',       accent: '#00897B', dark: '#004D40' },
  { id: 'art',       label: 'Art & Culture', accent: '#5C6BC0', dark: '#283593' },
  { id: 'wellness',  label: 'Wellness',      accent: '#00ACC1', dark: '#006064' },
  { id: 'comedy',    label: 'Comedy',        accent: '#F9A825', dark: '#F57F17' },
  { id: 'kids',      label: 'Kids',          accent: '#039BE5', dark: '#01579B' },
  { id: 'fashion',   label: 'Fashion',       accent: '#D81B60', dark: '#880E4F' },
  { id: 'tech',      label: 'Tech & Business', accent: '#546E7A', dark: '#263238' },
]

// Sections shown on home feed
export const HOME_SECTIONS = [
  { id: 'happeningNow', title: 'Happening Now',    categoryId: null },
  { id: 'party',        title: 'Parties',          categoryId: 'party' },
  { id: 'sports',       title: 'Sports',           categoryId: 'sports' },
  { id: 'music',        title: 'Music & Concerts', categoryId: 'music' },
  { id: 'food',         title: 'Food & Drinks',    categoryId: 'food' },
  { id: 'dancing',      title: 'Dancing',          categoryId: 'dancing' },
  { id: 'wellness',     title: 'Wellness',         categoryId: 'wellness' },
  { id: 'comedy',       title: 'Comedy',           categoryId: 'comedy' },
  { id: 'outdoor',      title: 'Outdoor',          categoryId: 'outdoor' },
  { id: 'games',        title: 'Table Games',      categoryId: 'games' },
  { id: 'art',          title: 'Art & Culture',    categoryId: 'art' },
  { id: 'kids',         title: 'Kids & Family',    categoryId: 'kids' },
  { id: 'tech',         title: 'Tech & Business',  categoryId: 'tech' },
]

export const EVENT_RULES = {
  titleMin: 5, titleMax: 80,
  descriptionMin: 50, descriptionMax: 1000,
  minLeadTimeHours: 2, maxLeadTimeDays: 180,
  minAttendees: 2, maxAttendees: 10000,
}

export const SCORE_WEIGHTS = {
  distance: 0.45, timing: 0.35, popularity: 0.20, categoryBoost: 1.25,
}

export const API_BASE_URL = 'https://web-production-e695b.up.railway.app/api/v1'

export const PAYMENT = {
  provider: 'pesapal',
  currency: 'UGX',
  platformFeePercent: 8,
  enabled: false,
}
