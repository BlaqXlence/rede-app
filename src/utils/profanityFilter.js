/**
 * Basic profanity filter — English + Luganda + Lusoga
 * Blocks obvious offensive venue names
 */

const BLOCKED = [
  // English
  'fuck', 'shit', 'ass', 'bitch', 'bastard', 'damn', 'crap',
  'dick', 'cock', 'pussy', 'cunt', 'whore', 'slut', 'nigger',
  // Luganda
  'mana', 'ekiseeya', 'omukazi', 'oluwala', 'ekyejo', 'kayinja',
  'nsolo', 'mpologoma', 'bwino',
  // Lusoga
  'nsunda', 'ekikodyo',
  // Common slang
  'sex', 'porn', 'nude', 'naked',
]

const PATTERN = new RegExp(
  BLOCKED.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'i'
)

/**
 * @param {string} text
 * @returns {{ ok: boolean, message?: string }}
 */
export function checkVenueName(text) {
  if (!text || text.trim().length === 0) {
    return { ok: false, message: 'Please enter a venue name.' }
  }
  if (text.trim().length < 3) {
    return { ok: false, message: 'Venue name is too short.' }
  }
  if (text.trim().length > 120) {
    return { ok: false, message: 'Venue name is too long.' }
  }
  if (PATTERN.test(text)) {
    return { ok: false, message: 'Please use an appropriate venue name.' }
  }
  return { ok: true }
}
