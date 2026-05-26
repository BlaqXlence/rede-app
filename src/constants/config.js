export const APP_NAME = 'REDE'

export const UGANDA_CITIES = [
  { id: 'kampala',     name: 'Kampala',     lat: 0.3476,  lng: 32.5825 },
  { id: 'entebbe',     name: 'Entebbe',     lat: 0.0512,  lng: 32.4637 },
  { id: 'jinja',       name: 'Jinja',       lat: -0.4289, lng: 33.2041 },
  { id: 'mbarara',     name: 'Mbarara',     lat: -0.6072, lng: 30.6545 },
  { id: 'gulu',        name: 'Gulu',        lat: 2.7747,  lng: 32.2990 },
  { id: 'mbale',       name: 'Mbale',       lat: 1.0796,  lng: 34.1750 },
  { id: 'masaka',      name: 'Masaka',      lat: -0.3136, lng: 31.7358 },
  { id: 'fort_portal', name: 'Fort Portal', lat: 0.6710,  lng: 30.2750 },
  { id: 'kabale',      name: 'Kabale',      lat: -1.2490, lng: 29.9890 },
  { id: 'lira',        name: 'Lira',        lat: 2.2499,  lng: 32.8998 },
  { id: 'arua',        name: 'Arua',        lat: 3.0200,  lng: 30.9100 },
  { id: 'soroti',      name: 'Soroti',      lat: 1.7150,  lng: 33.6110 },
]

export const DEFAULT_CITY = { ...UGANDA_CITIES[0], city: UGANDA_CITIES[0].name }

export const KAMPALA_AREAS = [
  'Kololo', 'Nakasero', 'Ntinda', 'Muyenga', 'Bugolobi',
  'Kisementi', 'Bukoto', 'Munyonyo', 'Naguru', 'Lugogo',
  'Wandegeya', 'Makerere', 'Kabalagala', 'Kansanga', 'Luzira',
  'Kireka', 'Naalya', 'Kyanja', 'Gayaza', 'Entebbe Road',
]

export const EVENT_CATEGORIES = [
  { id: 'all',      label: 'All' },
  { id: 'party',    label: 'Parties' },
  { id: 'music',    label: 'Music' },
  { id: 'sports',   label: 'Sports' },
  { id: 'dancing',  label: 'Dancing' },
  { id: 'games',    label: 'Table Games' },
  { id: 'food',     label: 'Food & Drinks' },
  { id: 'outdoor',  label: 'Outdoor' },
  { id: 'art',      label: 'Art & Culture' },
  { id: 'wellness', label: 'Wellness' },
  { id: 'comedy',   label: 'Comedy' },
  { id: 'kids',     label: 'Kids' },
  { id: 'fashion',  label: 'Fashion' },
  { id: 'tech',     label: 'Tech & Business' },
]

export const HOME_SECTIONS = [
  { id: 'happeningNow', title: 'Happening Now',     categoryId: null },
  { id: 'party',        title: 'Parties',           categoryId: 'party' },
  { id: 'sports',       title: 'Sports',            categoryId: 'sports' },
  { id: 'music',        title: 'Music & Concerts',  categoryId: 'music' },
  { id: 'food',         title: 'Food & Drinks',     categoryId: 'food' },
  { id: 'dancing',      title: 'Dancing',           categoryId: 'dancing' },
  { id: 'wellness',     title: 'Wellness',          categoryId: 'wellness' },
  { id: 'comedy',       title: 'Comedy',            categoryId: 'comedy' },
  { id: 'outdoor',      title: 'Outdoor',           categoryId: 'outdoor' },
  { id: 'games',        title: 'Table Games',       categoryId: 'games' },
  { id: 'art',          title: 'Art & Culture',     categoryId: 'art' },
  { id: 'kids',         title: 'Kids & Family',     categoryId: 'kids' },
  { id: 'tech',         title: 'Tech & Business',   categoryId: 'tech' },
]

export const EVENT_RULES = {
  titleMin: 5, titleMax: 80,
  descriptionMin: 50, descriptionMax: 1000,
  minLeadTimeHours: 2,
  // Max 1 week ahead — people make up their minds quickly
  maxLeadTimeDays: 7,
}

export const SCORE_WEIGHTS = {
  distance: 0.45, timing: 0.35, popularity: 0.20, categoryBoost: 1.25,
}

export const API_BASE_URL = 'https://web-production-e695b.up.railway.app/api/v1'
export const APP_URL = 'https://rede-app.netlify.app'

export const PAYMENT = {
  provider: 'pesapal',
  currency: 'UGX',
  platformFeePercent: 8,
  enabled: false,
}
