import { UGANDA_PHONE_CODE, EVENT_RULES } from '../constants/config'

const UG_PHONE_REGEX = /^(70|75|76|77|78)\d{7}$/

export function validatePhone(phone) {
  const digits = phone.replace(/\D/g, '')
  const local = digits.startsWith('256') ? digits.slice(3) : digits.startsWith('0') ? digits.slice(1) : digits
  if (!UG_PHONE_REGEX.test(local)) return 'Enter a valid Ugandan number (e.g. 0771234567)'
  return null
}

export function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, '')
  const local = digits.startsWith('256') ? digits.slice(3) : digits.startsWith('0') ? digits.slice(1) : digits
  return `${UGANDA_PHONE_CODE}${local}`
}

export function validateEmail(email) {
  if (!email) return null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address'
  return null
}

export function validateOtp(code) {
  if (!/^\d{6}$/.test(code)) return 'Enter the 6-digit code'
  return null
}

export function validateEventTitle(title) {
  if (!title || title.trim().length < EVENT_RULES.titleMin) return `At least ${EVENT_RULES.titleMin} characters`
  if (title.trim().length > EVENT_RULES.titleMax) return `Max ${EVENT_RULES.titleMax} characters`
  return null
}

export function validateEventDescription(desc) {
  if (!desc || desc.trim().length < EVENT_RULES.descriptionMin) return `At least ${EVENT_RULES.descriptionMin} characters`
  if (desc.trim().length > EVENT_RULES.descriptionMax) return `Max ${EVENT_RULES.descriptionMax} characters`
  return null
}

export function validateEventDate(startTime) {
  if (!startTime) return 'Select a start time'
  const min = new Date(Date.now() + EVENT_RULES.minLeadTimeHours * 3_600_000)
  if (new Date(startTime) < min) return `Must start at least ${EVENT_RULES.minLeadTimeHours}h from now`
  return null
}

export function validateEventLocation(location) {
  if (!location || !location.name || location.name.trim().length < 3) return 'Add a venue name'
  return null
}

export function validateMaxAttendees(value) {
  if (!value) return null
  const n = parseInt(value, 10)
  if (isNaN(n) || n < EVENT_RULES.minAttendees) return `Minimum ${EVENT_RULES.minAttendees}`
  if (n > EVENT_RULES.maxAttendees) return `Maximum ${EVENT_RULES.maxAttendees}`
  return null
}
