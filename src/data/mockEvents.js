function daysFromNow(days, hour = 18, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function hoursFromNow(h) {
  return new Date(Date.now() + h * 3_600_000).toISOString()
}

export const MOCK_EVENTS = [
  {
    id: 'EVT-001', title: 'Rooftop Party — Kololo Heights',
    description: 'The hottest rooftop party in Kampala. Live DJ, cocktails, and stunning city views. Smart casual. 18+ only.',
    category: 'party',
    coverImage: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600',
    startTime: daysFromNow(1, 20), endTime: daysFromNow(2, 2),
    location: { lat: 0.3300, lng: 32.5800, name: 'Kololo Heights Club', address: 'Acacia Ave, Kololo, Kampala' },
    organizer: { id: 'USR-010', name: 'Daniel Ssemakula', phone: '+256771234567', avatar: null, verified: true },
    attendeeCount: 47, maxAttendees: 100, entryFee: 30000, originalFee: 50000, tags: ['rooftop', 'dj'], createdAt: new Date().toISOString(),
  },
  {
    id: 'EVT-002', title: 'Sunday 5-a-Side Football',
    description: 'Weekly Sunday morning 5-a-side. Boots required, bibs provided. Water included. All skill levels welcome.',
    category: 'sports',
    coverImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600',
    startTime: daysFromNow(3, 8), endTime: daysFromNow(3, 11),
    location: { lat: 0.3100, lng: 32.6000, name: 'Bugolobi Sports Ground', address: 'Bugolobi, Kampala' },
    organizer: { id: 'USR-011', name: 'Isaac Katende', phone: '+256702345678', avatar: null, verified: true },
    attendeeCount: 18, maxAttendees: 22, entryFee: 10000, originalFee: null, tags: ['football', 'fitness'], createdAt: new Date().toISOString(),
  },
  {
    id: 'EVT-003', title: 'Salsa Night — La Bodeguita',
    description: 'Salsa, merengue and bachata with our resident instructor. Beginners welcome! Free 30-min lesson at 7pm.',
    category: 'dancing',
    coverImage: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=600',
    startTime: daysFromNow(2, 19), endTime: daysFromNow(2, 23),
    location: { lat: 0.3200, lng: 32.5780, name: 'La Bodeguita', address: 'Nakasero Hill Rd, Kampala' },
    organizer: { id: 'USR-012', name: 'Maria Nansubuga', phone: '+256753456789', avatar: null, verified: false },
    attendeeCount: 33, maxAttendees: 60, entryFee: 20000, originalFee: 35000, tags: ['salsa', 'lessons'], createdAt: new Date().toISOString(),
  },
  {
    id: 'EVT-004', title: 'Board Games Afternoon — Ntinda',
    description: 'Chess, Ludo, Scrabble and Uno. All boards provided. Tea and snacks available. Family-friendly.',
    category: 'games',
    coverImage: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=600',
    startTime: daysFromNow(0, 14), endTime: daysFromNow(0, 19),
    location: { lat: 0.3400, lng: 32.6100, name: 'Ntinda Community Hall', address: 'Ntinda Rd, Kampala' },
    organizer: { id: 'USR-013', name: 'Grace Akullo', phone: '+256776543210', avatar: null, verified: true },
    attendeeCount: 12, maxAttendees: 40, entryFee: 0, originalFee: null, tags: ['chess', 'free'], createdAt: new Date().toISOString(),
  },
  {
    id: 'EVT-005', title: 'Nyama Choma & Live Afrobeats',
    description: 'Full nyama choma spread with ugali and kachumbari. Live Afrobeats band from 8pm.',
    category: 'food',
    coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
    startTime: daysFromNow(5, 17), endTime: daysFromNow(5, 23),
    location: { lat: 0.2900, lng: 32.5900, name: 'Muyenga Hill Garden', address: 'Tank Hill Rd, Muyenga' },
    organizer: { id: 'USR-014', name: 'Robert Mukasa', phone: '+256787654321', avatar: null, verified: true },
    attendeeCount: 61, maxAttendees: 120, entryFee: 25000, originalFee: 40000, tags: ['nyama choma', 'afrobeats'], createdAt: new Date().toISOString(),
  },
  {
    id: 'EVT-006', title: 'Lake Run — 5km & 10km',
    description: 'Morning run along Lake Victoria. Both 5km and 10km routes. All levels welcome. Medals for finishers.',
    category: 'sports',
    coverImage: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600',
    startTime: daysFromNow(6, 6), endTime: daysFromNow(6, 10),
    location: { lat: 0.0512, lng: 32.4637, name: 'Entebbe Botanical Gardens', address: 'Botanical Beach Rd, Entebbe' },
    organizer: { id: 'USR-015', name: 'Sandra Achola', phone: '+256751234567', avatar: null, verified: true },
    attendeeCount: 88, maxAttendees: 200, entryFee: 15000, originalFee: 25000, tags: ['running'], createdAt: new Date().toISOString(),
  },
  {
    id: 'EVT-007', title: 'Open Mic Night — Café Javas',
    description: 'Poets, comedians, musicians — 5 minutes each. Sign up at the door. Doors at 6:30pm.',
    category: 'comedy',
    coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600',
    startTime: daysFromNow(4, 19), endTime: daysFromNow(4, 22),
    location: { lat: 0.3270, lng: 32.5760, name: 'Café Javas Acacia Mall', address: 'Acacia Mall, Kisementi' },
    organizer: { id: 'USR-016', name: 'Patrick Ouma', phone: '+256762345678', avatar: null, verified: false },
    attendeeCount: 25, maxAttendees: 80, entryFee: 5000, originalFee: null, tags: ['open mic', 'poetry'], createdAt: new Date().toISOString(),
  },
  {
    id: 'EVT-008', title: 'Sunrise Yoga — Kololo Hill',
    description: 'Outdoor sunrise yoga. Mats provided. Beginners welcome. Bring a light jacket.',
    category: 'wellness',
    coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600',
    startTime: hoursFromNow(14), endTime: hoursFromNow(16),
    location: { lat: 0.3300, lng: 32.5750, name: 'Kololo Hill Park', address: 'Kololo Hill, Kampala' },
    organizer: { id: 'USR-017', name: 'Amina Nakato', phone: '+256703456789', avatar: null, verified: true },
    attendeeCount: 14, maxAttendees: 25, entryFee: 10000, originalFee: 20000, tags: ['yoga', 'wellness'], createdAt: new Date().toISOString(),
  },
  {
    id: 'EVT-009', title: 'Kampala Jazz Night',
    description: 'Live jazz featuring local and visiting artists. Cocktails and wine available.',
    category: 'music',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600',
    startTime: daysFromNow(4, 20), endTime: daysFromNow(5, 0),
    location: { lat: 0.3150, lng: 32.5850, name: 'Serena Hotel', address: 'Kintu Rd, Nakasero' },
    organizer: { id: 'USR-018', name: 'Alice Namirembe', phone: '+256772345678', avatar: null, verified: true },
    attendeeCount: 55, maxAttendees: 150, entryFee: 40000, originalFee: 60000, tags: ['jazz', 'cocktails'], createdAt: new Date().toISOString(),
  },
  {
    id: 'EVT-010', title: 'Pool Party — Munyonyo Resort',
    description: 'Biggest pool party of the month! DJ, cocktails. Must be 18+.',
    category: 'party',
    coverImage: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600',
    startTime: daysFromNow(7, 12), endTime: daysFromNow(7, 20),
    location: { lat: 0.2300, lng: 32.6200, name: 'Munyonyo Commonwealth Resort', address: 'Munyonyo, Kampala' },
    organizer: { id: 'USR-019', name: 'Kevin Ssali', phone: '+256784567890', avatar: null, verified: true },
    attendeeCount: 120, maxAttendees: 300, entryFee: 50000, originalFee: 80000, tags: ['pool', 'dj'], createdAt: new Date().toISOString(),
  },
  {
    id: 'EVT-011', title: 'Street Food Festival — Oasis Mall',
    description: 'Over 30 food vendors! Rolex, katogo, samosas, fresh juice. Free entry, pay for food.',
    category: 'food',
    coverImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600',
    startTime: daysFromNow(2, 11), endTime: daysFromNow(2, 20),
    location: { lat: 0.3080, lng: 32.5920, name: 'Oasis Mall', address: 'Yusuf Lule Rd, Kampala' },
    organizer: { id: 'USR-021', name: 'Joyce Atim', phone: '+256753890123', avatar: null, verified: true },
    attendeeCount: 210, maxAttendees: 500, entryFee: 0, originalFee: null, tags: ['rolex', 'street food', 'free'], createdAt: new Date().toISOString(),
  },
  {
    id: 'EVT-012', title: 'Tech Startup Meetup — Innovation Village',
    description: 'Monthly meetup for founders, developers and investors. Pitches, networking, free drinks.',
    category: 'tech',
    coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600',
    startTime: daysFromNow(8, 17), endTime: daysFromNow(8, 21),
    location: { lat: 0.3200, lng: 32.5900, name: 'Innovation Village', address: 'Ntinda, Kampala' },
    organizer: { id: 'USR-022', name: 'Brian Ssebukulu', phone: '+256772111222', avatar: null, verified: true },
    attendeeCount: 67, maxAttendees: 100, entryFee: 0, originalFee: null, tags: ['startups', 'networking', 'free'], createdAt: new Date().toISOString(),
  },
]

export const MOCK_CURRENT_USER = {
  id: 'USR-001', name: '', phone: '', email: '',
  avatar: null, verified: false, createdAt: new Date().toISOString(),
}
