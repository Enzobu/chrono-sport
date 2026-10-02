import AsyncStorage from '@react-native-async-storage/async-storage'
import { Appearance } from 'react-native'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { buildTheme } from '../styles/theme'

const STORAGE_KEY = 'chrono_theme_preferences'
const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('system')
  const [accent, setAccent] = useState('blue')
  const [systemScheme, setSystemScheme] = useState(Appearance.getColorScheme() || 'dark')

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme || 'dark')
    })
    return () => subscription.remove()
  }, [])

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return
        const parsed = JSON.parse(raw)
        if (['system', 'light', 'dark'].includes(parsed.mode)) setMode(parsed.mode)
        if (typeof parsed.accent === 'string') setAccent(parsed.accent)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, accent })).catch(() => {})
  }, [mode, accent])

  const resolvedScheme = mode === 'system' ? systemScheme : mode
  const colors = useMemo(() => buildTheme(resolvedScheme, accent), [resolvedScheme, accent])

  return (
    <ThemeContext.Provider value={{ mode, accent, resolvedScheme, colors, setMode, setAccent }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme must be used inside ThemeProvider')
  return value
}
