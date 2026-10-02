export const accentPalette = {
  blue: '#5B8CFF',
  violet: '#8B7CFF',
  emerald: '#22C98A',
  orange: '#FF9F43',
  rose: '#FF5C8A',
  cyan: '#24C7D9',
}

const darkBase = {
  bg: '#0B0D12',
  surface: '#12151D',
  panel: '#151922',
  panelAlt: '#1B202B',
  elevated: '#202633',
  text: '#F7F8FB',
  muted: '#98A2B3',
  subtle: '#667085',
  border: '#262D3A',
  danger: '#FF6B6B',
  work: '#FF6F7D',
  success: '#34D399',
  warning: '#F6B84B',
  info: '#60A5FA',
}

const lightBase = {
  bg: '#F3F5F8',
  surface: '#FFFFFF',
  panel: '#FFFFFF',
  panelAlt: '#EEF1F5',
  elevated: '#E8ECF2',
  text: '#111827',
  muted: '#667085',
  subtle: '#98A2B3',
  border: '#DDE2EA',
  danger: '#D64545',
  work: '#D94B5B',
  success: '#159A68',
  warning: '#B7791F',
  info: '#2563EB',
}

export function buildTheme(scheme = 'dark', accent = 'blue') {
  const isDark = scheme === 'dark'
  const base = isDark ? darkBase : lightBase
  const primary = accentPalette[accent] ?? accentPalette.blue

  return {
    ...base,
    accent: primary,
    primary,
    primarySoft: isDark ? `${primary}24` : `${primary}18`,
    primaryBorder: isDark ? `${primary}66` : `${primary}55`,
    ctaBg: isDark ? `${primary}20` : `${primary}14`,
    ctaBorder: isDark ? `${primary}70` : `${primary}55`,
    ctaText: primary,
    onPrimary: '#FFFFFF',
    isDark,
  }
}

export const colors = buildTheme('dark', 'blue')
