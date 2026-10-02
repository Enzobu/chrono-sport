import { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { accentPalette } from '../styles/theme'
import { useTheme } from '../theme/ThemeContext'

const modes = [
  ['system', 'Système', 'Suit automatiquement le thème du téléphone'],
  ['light', 'Clair', 'Interface claire en permanence'],
  ['dark', 'Sombre', 'Interface sombre en permanence'],
]

const labels = {
  blue: 'Bleu',
  violet: 'Violet',
  emerald: 'Émeraude',
  orange: 'Orange',
  rose: 'Rose',
  cyan: 'Cyan',
}

export function SettingsScreen({ onBack }) {
  const { colors, mode, accent, resolvedScheme, setMode, setAccent } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={onBack}><Text style={styles.backTxt}>‹</Text></Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>PERSONNALISATION</Text>
          <Text style={styles.title}>Réglages</Text>
          <Text style={styles.subtitle}>Adapte Chrono-Sport à ton style.</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Apparence</Text>
        <Text style={styles.hint}>Mode actif : {resolvedScheme === 'dark' ? 'sombre' : 'clair'}</Text>
        {modes.map(([key, label, description]) => {
          const active = mode === key
          return (
            <Pressable key={key} style={[styles.option, active && styles.optionActive]} onPress={() => setMode(key)}>
              <View style={styles.optionCopy}>
                <Text style={styles.optionTitle}>{label}</Text>
                <Text style={styles.optionDescription}>{description}</Text>
              </View>
              <View style={[styles.radio, active && styles.radioActive]}>
                {active ? <View style={styles.radioDot} /> : null}
              </View>
            </Pressable>
          )
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Couleur primaire</Text>
        <Text style={styles.hint}>Actions, progression et accents visuels.</Text>
        <View style={styles.palette}>
          {Object.entries(accentPalette).map(([key, value]) => {
            const active = accent === key
            return (
              <Pressable key={key} style={styles.colorChoice} onPress={() => setAccent(key)}>
                <View style={[styles.swatch, { backgroundColor: value }, active && styles.swatchActive]}>
                  {active ? <Text style={styles.check}>✓</Text> : null}
                </View>
                <Text style={[styles.colorLabel, active && styles.colorLabelActive]}>{labels[key]}</Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <View style={styles.preview}>
        <Text style={styles.previewEyebrow}>APERÇU</Text>
        <Text style={styles.previewTimer}>01:42</Text>
        <Text style={styles.previewSub}>Développé incliné • Série 3/4</Text>
        <View style={styles.track}><View style={styles.fill} /></View>
        <Pressable style={styles.primaryBtn}><Text style={styles.primaryTxt}>Action principale</Text></Pressable>
      </View>
    </ScrollView>
  )
}

const createStyles = (colors) => StyleSheet.create({
  container: { padding: 18, gap: 18, paddingBottom: 36, backgroundColor: colors.bg },
  header: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  backBtn: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: colors.text, fontSize: 34, lineHeight: 36, marginTop: -2 },
  headerCopy: { flex: 1, gap: 3, paddingTop: 2 },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 32, fontWeight: '800', letterSpacing: -0.6 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  section: { backgroundColor: colors.surface, borderRadius: 22, padding: 16, gap: 10, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  hint: { color: colors.muted, fontSize: 12, marginBottom: 2 },
  option: { minHeight: 68, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionActive: { borderColor: colors.primaryBorder, backgroundColor: colors.primarySoft },
  optionCopy: { flex: 1, gap: 2 },
  optionTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  optionDescription: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 4 },
  colorChoice: { width: 74, alignItems: 'center', gap: 7 },
  swatch: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'transparent' },
  swatchActive: { borderColor: colors.text },
  check: { color: '#fff', fontSize: 22, fontWeight: '900' },
  colorLabel: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  colorLabelActive: { color: colors.text },
  preview: { borderRadius: 24, padding: 18, gap: 10, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.primaryBorder },
  previewEyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  previewTimer: { color: colors.text, fontSize: 52, fontWeight: '800', letterSpacing: -1.5 },
  previewSub: { color: colors.muted, fontSize: 13 },
  track: { height: 8, borderRadius: 999, backgroundColor: colors.elevated, overflow: 'hidden' },
  fill: { width: '62%', height: '100%', backgroundColor: colors.primary, borderRadius: 999 },
  primaryBtn: { marginTop: 6, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  primaryTxt: { color: colors.onPrimary, fontWeight: '800', fontSize: 15 },
})
