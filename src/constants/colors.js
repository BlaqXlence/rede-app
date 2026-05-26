/**
 * REDE Color System
 * Two themes: dark (default) and light
 * Primary: #FF6600 — energy, excitement, events
 */

export const darkTheme = {
  primary:      '#FF6600',
  primaryDark:  '#CC5200',
  primaryLight: '#FF8533',
  primaryFaint: 'rgba(255,102,0,0.12)',

  background:   '#1A1A1A',
  surface:      '#242424',
  surfaceHigh:  '#2E2E2E',
  border:       '#383838',
  divider:      '#2A2A2A',
  shimmer:      '#2E2E2E',

  textPrimary:   '#FFFFFF',
  textSecondary: '#AAAAAA',
  textHint:      '#606060',
  textOnPrimary: '#FFFFFF',

  success: '#22C55E',
  error:   '#EF4444',
  warning: '#F59E0B',

  cat: {
    party:    '#EC4899',
    music:    '#8B5CF6',
    sports:   '#3B82F6',
    dancing:  '#F97316',
    games:    '#EAB308',
    food:     '#22C55E',
    outdoor:  '#14B8A6',
    art:      '#6366F1',
    wellness: '#06B6D4',
    comedy:   '#FBBF24',
    kids:     '#60A5FA',
    fashion:  '#F472B6',
    tech:     '#94A3B8',
  },

  overlay:   'rgba(0,0,0,0.6)',
  isDark:    true,
}

export const lightTheme = {
  primary:      '#FF6600',
  primaryDark:  '#CC5200',
  primaryLight: '#FF8533',
  primaryFaint: 'rgba(255,102,0,0.1)',

  background:   '#F5F5F5',
  surface:      '#FFFFFF',
  surfaceHigh:  '#F0F0F0',
  border:       '#E0E0E0',
  divider:      '#EEEEEE',
  shimmer:      '#E8E8E8',

  textPrimary:   '#111111',
  textSecondary: '#666666',
  textHint:      '#AAAAAA',
  textOnPrimary: '#FFFFFF',

  success: '#16A34A',
  error:   '#DC2626',
  warning: '#D97706',

  cat: {
    party:    '#EC4899',
    music:    '#7C3AED',
    sports:   '#2563EB',
    dancing:  '#EA580C',
    games:    '#CA8A04',
    food:     '#16A34A',
    outdoor:  '#0D9488',
    art:      '#4F46E5',
    wellness: '#0891B2',
    comedy:   '#D97706',
    kids:     '#2563EB',
    fashion:  '#DB2777',
    tech:     '#475569',
  },

  overlay:   'rgba(0,0,0,0.4)',
  isDark:    false,
}

// Default export is dark theme — changed by ThemeStore
const colors = darkTheme
export default colors
