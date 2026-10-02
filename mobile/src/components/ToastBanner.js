import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../theme/ThemeContext'

export function ToastBanner({ toast }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  if (!toast) {
    return null
  }

  const palette =
    toast.type === 'success'
      ? { borderColor: '#14532d', backgroundColor: '#052e16', color: '#dcfce7' }
      : { borderColor: '#7f1d1d', backgroundColor: '#450a0a', color: '#fee2e2' }

  return (
    <View style={[styles.container, { borderColor: palette.borderColor, backgroundColor: palette.backgroundColor }]}>
      <Text style={[styles.text, { color: palette.color }]}>{toast.message}</Text>
    </View>
  )
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '88%',
    zIndex: 100,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
})
