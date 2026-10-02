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
  wrap: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  item: { flex: 1, minHeight: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 2 },
  itemActive: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primaryBorder },
  icon: { color: colors.muted, fontSize: 20, fontWeight: '900' },
  label: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  textActive: { color: colors.primary },
})
