export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-UG', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-UG', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

export function formatDateRange(startStr, endStr) {
  const start = new Date(startStr)
  const end = new Date(endStr)
  if (start.toDateString() === end.toDateString()) {
    return `${formatDate(startStr)}, ${formatTime(startStr)} – ${formatTime(endStr)}`
  }
  return `${formatDate(startStr)} – ${formatDate(endStr)}`
}

export function timeFromNow(dateStr) {
  const diff = new Date(dateStr).getTime() - Date.now()
  const hours = diff / 3_600_000
  if (hours < 0) return 'ended'
  if (hours < 1) return 'in < 1 hour'
  if (hours < 24) return `in ${Math.round(hours)}h`
  if (hours < 48) return 'tomorrow'
  const days = Math.round(hours / 24)
  if (days < 7) return `in ${days} days`
  return `in ${Math.round(days / 7)} weeks`
}

export function formatUGX(amount) {
  if (amount === 0) return 'Free'
  return `UGX ${Number(amount).toLocaleString('en-UG')}`
}

export function formatAttendees(count, max) {
  if (!max) return `${count} going`
  const left = max - count
  if (left <= 0) return 'Full'
  if (left <= 5) return `${left} spots left!`
  return `${count}/${max} going`
}

export function generateEventId() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function discountPercent(originalPrice, salePrice) {
  if (!originalPrice || originalPrice <= salePrice) return null
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100)
}

// Short date for card image pill: "Sat 31 May"
export function formatDateShort(dateStr) {
  const d = new Date(dateStr)
  const days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}
