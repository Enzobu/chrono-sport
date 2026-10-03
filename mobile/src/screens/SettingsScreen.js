import { useMemo, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
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

export function SettingsScreen({
  onLogout,
  weightUnit = 'kg',
  onWeightUnitChange,
  countdownVibrationEnabled = true,
  onCountdownVibrationChange,
  workoutSoundEnabled = true,
  onWorkoutSoundChange,
  history = [],
  loadingHistory = false,
  refreshing = false,
  onRefresh,
  onRequestClearHistory,
}) {
  const { colors, mode, accent, resolvedScheme, setMode, setAccent } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [confirmAppearanceReset, setConfirmAppearanceReset] = useState(false)
  const [historyExpanded, setHistoryExpanded] = useState(false)

  const resetAppearance = () => {
    setMode('system')
    setAccent('blue')
    setConfirmAppearanceReset(false)
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
    >
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>COMPTE</Text>
          <Text style={styles.title}>Compte & réglages</Text>
          <Text style={styles.subtitle}>Personnalise l'app et gère ton compte.</Text>
        </View>
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionEyebrow}>COMPTE</Text>
        <Text style={styles.sectionLead}>Ton activité et les actions liées à ton compte.</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historique</Text>
        <Text style={styles.hint}>Tes dernières séances terminées.</Text>
        {loadingHistory ? <Text style={styles.hint}>Chargement...</Text> : null}
        {!loadingHistory && !history.length ? <Text style={styles.hint}>Aucune séance terminée pour le moment.</Text> : null}
        {(historyExpanded ? history : history.slice(0, 5)).map((entry) => (
          <View key={entry.id} style={styles.historyRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>{entry.sessionName}</Text>
              <Text style={styles.optionDescription}>{new Date(entry.finishedAt).toLocaleString('fr-FR')}</Text>
            </View>
            <Text style={styles.historyDuration}>{Math.floor(entry.durationSeconds / 60)} min</Text>
          </View>
        ))}
        {history.length > 5 ? (
          <Pressable style={styles.settingToggle} onPress={() => setHistoryExpanded((value) => !value)}>
            <Text style={styles.settingToggleText}>{historyExpanded ? 'Réduire l’historique  ↑' : `Afficher tout l’historique (${history.length})  ↓`}</Text>
          </Pressable>
        ) : null}
        {history.length ? (
          <Pressable style={styles.clearHistoryBtn} onPress={onRequestClearHistory}>
            <Text style={styles.clearHistoryText}>Effacer l’historique</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionEyebrow}>PARAMÈTRES</Text>
        <Text style={styles.sectionLead}>Préférences et personnalisation de l’app.</Text>
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Réinitialiser l'apparence</Text>
        <Text style={styles.hint}>Restaure le thème Système et la couleur bleue par défaut.</Text>
        {confirmAppearanceReset ? (
          <View style={styles.resetConfirm}>
            <Text style={styles.optionTitle}>Réinitialiser les réglages visuels ?</Text>
            <Text style={styles.optionDescription}>Le thème et la couleur primaire reviendront aux valeurs par défaut.</Text>
            <View style={styles.resetActions}>
              <Pressable style={styles.resetCancelBtn} onPress={() => setConfirmAppearanceReset(false)}>
                <Text style={styles.resetCancelText}>Annuler</Text>
              </Pressable>
              <Pressable style={styles.resetConfirmBtn} onPress={resetAppearance}>
                <Text style={styles.resetConfirmText}>Réinitialiser</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={styles.settingToggle} onPress={() => setConfirmAppearanceReset(true)}>
            <Text style={styles.settingToggleText}>Réinitialiser l'apparence</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vibrations</Text>
        <Text style={styles.hint}>Vibration 3-2-1 avant la reprise après un repos.</Text>
        <Pressable
          style={[styles.settingToggle, countdownVibrationEnabled && styles.settingToggleActive]}
          onPress={() => onCountdownVibrationChange(!countdownVibrationEnabled)}
        >
          <Text style={[styles.settingToggleText, countdownVibrationEnabled && styles.settingToggleTextActive]}>
            {countdownVibrationEnabled ? 'Activées' : 'Désactivées'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Son de séance</Text>
        <Text style={styles.hint}>Ding joué à la transition repos → travail.</Text>
        <Pressable
          style={[styles.settingToggle, workoutSoundEnabled && styles.settingToggleActive]}
          onPress={() => onWorkoutSoundChange(!workoutSoundEnabled)}
        >
          <Text style={[styles.settingToggleText, workoutSoundEnabled && styles.settingToggleTextActive]}>
            {workoutSoundEnabled ? 'Activé' : 'Désactivé'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Unités</Text>
        <Text style={styles.hint}>Choisis l'unité utilisée pour les poids.</Text>
        <View style={styles.unitRow}>
          {['kg', 'lb'].map((unit) => (
            <Pressable key={unit} style={[styles.unitBtn, weightUnit === unit && styles.unitBtnActive]} onPress={() => onWeightUnitChange(unit)}>
              <Text style={[styles.unitText, weightUnit === unit && styles.unitTextActive]}>{unit.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.preview}>
        <Text style={styles.previewEyebrow}>APERÇU</Text>
        <Text style={styles.previewTimer}>01:42</Text>
        <Text style={styles.previewSub}>Développé incliné • Série 3/4</Text>
        <View style={styles.track}><View style={styles.fill} /></View>
        <Pressable style={styles.primaryBtn}><Text style={styles.primaryTxt}>Action principale</Text></Pressable>
      </View>

      <View style={[styles.section, styles.logoutSection]}>
        <Text style={styles.sectionTitle}>Compte</Text>
        <Text style={styles.hint}>Déconnexion de ton compte Chrono-Sport.</Text>
        <Pressable style={styles.logoutBtn} onPress={onLogout}><Text style={styles.logoutTxt}>Se déconnecter</Text></Pressable>
      </View>

    </ScrollView>
  )
}

const createStyles = (colors) => StyleSheet.create({
  container: { padding: 18, gap: 18, paddingBottom: 96, backgroundColor: colors.bg },
  header: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  headerCopy: { flex: 1, gap: 3, paddingTop: 2 },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 32, fontWeight: '800', letterSpacing: -0.6 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  sectionHeading:{marginTop:4,gap:2},
  sectionEyebrow:{color:colors.primary,fontSize:11,fontWeight:'900',letterSpacing:1.3},
  sectionLead:{color:colors.muted,fontSize:12},
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
  resetConfirm:{borderWidth:1,borderColor:colors.border,backgroundColor:colors.panel,borderRadius:14,padding:12,gap:6},
  resetActions:{flexDirection:'row',gap:8,marginTop:4},
  resetCancelBtn:{flex:1,height:42,borderRadius:13,borderWidth:1,borderColor:colors.border,alignItems:'center',justifyContent:'center'},
  resetCancelText:{color:colors.text,fontWeight:'800'},
  resetConfirmBtn:{flex:1,height:42,borderRadius:13,borderWidth:1,borderColor:colors.ctaBorder,backgroundColor:colors.ctaBg,alignItems:'center',justifyContent:'center'},
  resetConfirmText:{color:colors.ctaText,fontWeight:'900'},
  settingToggle:{height:44,borderRadius:14,borderWidth:1,borderColor:colors.border,alignItems:'center',justifyContent:'center'},
  settingToggleActive:{backgroundColor:colors.primarySoft,borderColor:colors.primaryBorder},
  settingToggleText:{color:colors.muted,fontWeight:'800'},
  settingToggleTextActive:{color:colors.primary},
  unitRow:{flexDirection:'row',gap:8},
  unitBtn:{flex:1,height:44,borderRadius:14,borderWidth:1,borderColor:colors.border,alignItems:'center',justifyContent:'center'},
  unitBtnActive:{backgroundColor:colors.primarySoft,borderColor:colors.primaryBorder},
  unitText:{color:colors.muted,fontWeight:'800'},
  unitTextActive:{color:colors.primary},
  logoutSection:{marginTop:10},
  logoutBtn:{height:46,borderRadius:14,borderWidth:1,borderColor:colors.danger,alignItems:'center',justifyContent:'center',marginTop:4},
  logoutTxt:{color:colors.danger,fontWeight:'800'},
  historyRow:{flexDirection:'row',alignItems:'center',gap:10,borderWidth:1,borderColor:colors.border,backgroundColor:colors.panel,borderRadius:14,padding:12},
  historyDuration:{color:colors.primary,fontWeight:'900',fontSize:13},
  clearHistoryBtn:{height:44,borderRadius:14,borderWidth:1,borderColor:colors.danger,alignItems:'center',justifyContent:'center',marginTop:2},
  clearHistoryText:{color:colors.danger,fontWeight:'800'},
})
