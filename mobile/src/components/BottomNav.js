import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../theme/ThemeContext'

const items = [
  ['dashboard', '⌂', 'Accueil'],
  ['sessions', '▣', 'Séances'],
  ['account', '○', 'Compte'],
]

export function BottomNav({ active, onChange }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  return (
    <View style={styles.wrap}>
      {items.map(([key, icon, label]) => {
        const selected = active === key
        return (
          <Pressable key={key} style={[styles.item, selected && styles.itemActive]} onPress={() => onChange(key)}>
            <Text style={[styles.icon, selected && styles.textActive]}>{icon}</Text>
            <Text style={[styles.label, selected && styles.textActive]}>{label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const createStyles = (colors) => StyleSheet.create({
  wrap: { flexDirection: 'row', paddingHorizontal: 6, paddingTop: 3, paddingBottom: 5, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  item: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', gap: 0 },
  itemActive: {},
  icon: { color: colors.muted, fontSize: 21, lineHeight: 23, fontWeight: '700' },
  label: { color: colors.muted, fontSize: 10, lineHeight: 13, fontWeight: '600' },
  textActive: { color: colors.primary },
})
