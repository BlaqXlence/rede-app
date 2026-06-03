/**
 * Uganda locations — Kampala, Jinja, Mukono
 * city.center = coordinates to center map on that city
 */
export const UGANDA_CITIES = [
  {
    id: 'kampala',
    name: 'Kampala',
    center: { lat: 0.3476, lng: 32.5825 },
    areas: [
      'Kololo', 'Nakasero', 'Ntinda', 'Bugolobi', 'Muyenga',
      'Kabalagala', 'Kisaasi', 'Bukoto', 'Naguru', 'Wandegeya',
      'Mulago', 'Bwaise', 'Kireka', 'Najjera', 'Kyanja',
      'Munyonyo', 'Ggaba', 'Buziga', 'Lungujja', 'Rubaga',
      'Mengo', 'Makindye', 'Luzira', 'Portbell', 'Nansana',
      'Kawempe', 'Lugogo', 'Industrial Area', 'Nakawa', 'Banda',
    ],
  },
  {
    id: 'jinja',
    name: 'Jinja',
    center: { lat: 0.4244, lng: 33.2041 },
    areas: [
      'Main Street', 'Walukuba', 'Mpumudde', 'Bugembe',
      'Kimaka', 'Ganjoni', 'Masese', 'Nalufenya', 'Kakira',
    ],
  },
  {
    id: 'mukono',
    name: 'Mukono',
    center: { lat: 0.3535, lng: 32.7553 },
    areas: [
      'Town Centre', 'Seeta', 'Namataba', 'Kasawo',
      'Goma', 'Kyampisi', 'Ntenjeru', 'Nagojje',
    ],
  },
]

export function getCityById(id) {
  return UGANDA_CITIES.find(c => c.id === id) || null
}

export function getCityByName(name) {
  return UGANDA_CITIES.find(c =>
    c.name.toLowerCase() === name?.toLowerCase()
  ) || null
}
