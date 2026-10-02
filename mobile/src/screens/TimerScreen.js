import { useEffect, useMemo, useRef } from 'react'
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { formatMinutesSeconds } from '../lib/timer'
import { useTheme } from '../theme/ThemeContext'
import { formatWeight } from '../lib/weight'

const formatRest = (seconds) => formatMinutesSeconds(seconds).replace(/^0(?=\d:)/, '')

function Accordion({ title, status, children, open, styles }) {
  const statusStyle =
    status === 'fait' ? styles.doneBadge : status === 'en cours' ? styles.currentBadge : styles.todoBadge

  return (
    <View style={styles.accordion}>
      <View style={styles.accordionHeader}>
        <Text style={styles.accordionTitle}>{title}</Text>
        <View style={[styles.statusBadge, statusStyle]}>
          <Text style={styles.statusTxt}>{status}</Text>
        </View>
      </View>
      {open ? <View style={styles.accordionContent}>{children}</View> : null}
    </View>
  )
}

export function TimerScreen({
  sessionName,
  phaseLabel,
  chronoLabel,
  weightOverlayLabel,
  showWeightOverlay,
  exerciseLabel,
  exerciseNote,
  progressPct,
  totalRemainingLabel,
  elapsedLabel,
  exercisesStat,
  isWarmup,
  isRunning,
  isFinished,
  sessionOutline,
  weightUnit = 'kg',
  onBack,
  onToggleRun,
  onSkip,
  onReset,
  onTimerPress,
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const overlayOpacity = useRef(new Animated.Value(showWeightOverlay ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(overlayOpacity, {
      toValue: showWeightOverlay ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start()
  }, [showWeightOverlay, overlayOpacity])

  const chronoOpacity = overlayOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  })

  const phaseIsWork = phaseLabel === 'Travail' && !isFinished

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={onBack}>
          <Text style={styles.iconBtnText}>‹</Text>
        </Pressable>
        <View style={styles.sessionHeader}>
          <Text style={styles.eyebrow}>{phaseLabel.toUpperCase()}</Text>
          <Text style={styles.sessionTitle} numberOfLines={1}>{sessionName}</Text>
        </View>
      </View>

      <View style={[styles.heroCard, phaseIsWork && styles.heroCardActive]}>
        <View style={styles.heroTop}>
          <View style={[styles.phaseChip, phaseIsWork && styles.phaseChipActive]}>
            <Text style={[styles.phaseChipText, phaseIsWork && styles.phaseChipTextActive]}>{phaseLabel}</Text>
          </View>
          {isWarmup ? (
            <View style={styles.warmupChip}><Text style={styles.warmupText}>Échauffement</Text></View>
          ) : null}
        </View>

        <Pressable
          onPress={onTimerPress}
          style={({ pressed }) => [styles.timerPressable, pressed && styles.timerPressablePressed]}
        >
          <View style={styles.timerWrap}>
            <Animated.Text style={[styles.timerText, phaseIsWork && styles.timerWork, { opacity: chronoOpacity }]}>
              {chronoLabel}
            </Animated.Text>
            <Animated.Text style={[styles.timerText, styles.timerOverlay, phaseIsWork && styles.timerWork, { opacity: overlayOpacity }]}>
              {weightOverlayLabel ?? ''}
            </Animated.Text>
          </View>
        </Pressable>

        <Text style={styles.exerciseText}>{exerciseLabel}</Text>
        {exerciseNote ? (
          <View style={styles.noteCard}>
            <Text style={styles.noteText}><Text style={styles.noteLabel}>Note · </Text>{exerciseNote}</Text>
          </View>
        ) : null}

        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progression</Text>
          <Text style={styles.progressValue}>{Math.round(progressPct)}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>

        <View style={styles.timerActions}>
          <Pressable style={[styles.primaryBtn, styles.flexAction]} onPress={onToggleRun}>
            <Text style={styles.primaryText}>
              {isFinished ? 'Relancer' : isRunning ? 'Pause' : 'Lancer'}
            </Text>
          </Pressable>
          <Pressable style={styles.compactBtn} onPress={onSkip}>
            <Text style={styles.compactBtnText}>Skip</Text>
          </Pressable>
          <Pressable style={styles.compactBtn} onPress={onReset}>
            <Text style={styles.compactBtnText}>Reset</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.statWide]}>
          <Text style={styles.statsLabel}>Temps restant</Text>
          <Text style={styles.statsValue}>{totalRemainingLabel}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statsLabel}>Écoulé</Text>
          <Text style={styles.statsValueSmall}>{elapsedLabel}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statsLabel}>Exercices</Text>
          <Text style={styles.statsValueSmall}>{exercisesStat}</Text>
        </View>
      </View>

      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <Text style={styles.detailEyebrow}>PROGRAMME</Text>
          <Text style={styles.detailTitle}>Détails de la séance</Text>
        </View>

        {sessionOutline.map((exercise, exerciseIndex) => (
          <Accordion
            key={exercise.exerciseName}
            title={exercise.exerciseName}
            status={exercise.done ? 'fait' : exercise.hasCurrent ? 'en cours' : 'a faire'}
            open={exercise.hasCurrent || (!exercise.done && exerciseIndex === 0)}
            styles={styles}
          >
            {exercise.sets.map((set) => (
              <Accordion
                key={set.key}
                title={`Série ${set.order}/${set.total}${exercise.trackWeight ? ` • ${formatWeight(set.weight, weightUnit)}` : ''} • ${formatRest(set.wait)}`}
                status={set.done ? 'fait' : set.current ? 'en cours' : 'a faire'}
                open={set.current}
                styles={styles}
              >
                <View style={styles.setLine}>
                  <Text style={styles.setMeta}>Type : {set.type}</Text>
                  <Text style={styles.setMeta}>Travail : {formatMinutesSeconds(set.time)}</Text>
                  <Text style={styles.setMeta}>Repos : {formatMinutesSeconds(set.wait)}</Text>
                </View>
              </Accordion>
            ))}
          </Accordion>
        ))}
      </View>
    </ScrollView>
  )
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      padding: 18,
      gap: 16,
      paddingBottom: 34,
      backgroundColor: colors.bg,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconBtn: {
      width: 46,
      height: 46,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBtnText: {
      color: colors.text,
      fontSize: 34,
      lineHeight: 36,
      marginTop: -2,
    },
    sessionHeader: {
      flex: 1,
      gap: 2,
    },
    eyebrow: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1.5,
    },
    sessionTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
    },
    heroCard: {
      backgroundColor: colors.surface,
      borderRadius: 28,
      padding: 18,
      gap: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    heroCardActive: {
      borderColor: colors.primaryBorder,
    },
    heroTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    phaseChip: {
      alignSelf: 'flex-start',
      borderRadius: 999,
      backgroundColor: colors.panelAlt,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    phaseChipActive: {
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
    },
    phaseChipText: {
      color: colors.muted,
      fontWeight: '800',
      fontSize: 12,
    },
    phaseChipTextActive: {
      color: colors.primary,
    },
    warmupChip: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      backgroundColor: colors.warning + '18',
      borderWidth: 1,
      borderColor: colors.warning + '55',
    },
    warmupText: {
      color: colors.warning,
      fontWeight: '800',
      fontSize: 11,
    },
    timerPressable: {
      alignSelf: 'stretch',
      paddingVertical: 4,
    },
    timerPressablePressed: {
      transform: [{ scale: 0.985 }],
      opacity: 0.96,
    },
    timerWrap: {
      position: 'relative',
    },
    timerText: {
      color: colors.text,
      textAlign: 'center',
      fontSize: 64,
      lineHeight: 72,
      fontWeight: '900',
      letterSpacing: -2,
      fontVariant: ['tabular-nums'],
    },
    timerWork: {
      color: colors.work,
    },
    timerOverlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
    },
    exerciseText: {
      color: colors.text,
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '700',
      lineHeight: 22,
    },
    noteCard:{backgroundColor:colors.panel,borderWidth:1,borderColor:colors.border,borderRadius:14,padding:11},
    noteText:{color:colors.muted,fontSize:12,lineHeight:18},
    noteLabel:{color:colors.primary,fontWeight:'900'},
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
    progressLabel: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: '700',
    },
    progressValue: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '900',
    },
    progressTrack: {
      height: 9,
      borderRadius: 999,
      backgroundColor: colors.elevated,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 999,
    },
    timerActions: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      marginTop: 2,
    },
    flexAction: {
      flex: 1,
    },
    primaryBtn: {
      backgroundColor: colors.ctaBg,
      borderWidth: 1,
      borderColor: colors.ctaBorder,
      borderRadius: 17,
      height: 50,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryText: {
      color: colors.ctaText,
      fontWeight: '900',
      fontSize: 15,
    },
    compactBtn: {
      height: 50,
      minWidth: 72,
      borderRadius: 17,
      backgroundColor: colors.panelAlt,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
    },
    compactBtnText: {
      color: colors.text,
      fontWeight: '800',
      fontSize: 13,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    statCard: {
      flexGrow: 1,
      minWidth: '46%',
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 15,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },
    statWide: {
      minWidth: '100%',
    },
    statsLabel: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.7,
    },
    statsValue: {
      color: colors.text,
      fontSize: 25,
      fontWeight: '900',
      letterSpacing: -0.6,
    },
    statsValueSmall: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '900',
    },
    detailCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 14,
      gap: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    detailHeader: {
      gap: 2,
      marginBottom: 2,
    },
    detailEyebrow: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1.3,
    },
    detailTitle: {
      color: colors.text,
      fontSize: 19,
      fontWeight: '900',
    },
    accordion: {
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: colors.panel,
    },
    accordionHeader: {
      padding: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    accordionTitle: {
      color: colors.text,
      fontWeight: '700',
      flex: 1,
      fontSize: 13,
    },
    statusBadge: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    doneBadge: {
      borderColor: colors.success + '66',
      backgroundColor: colors.success + '18',
    },
    currentBadge: {
      borderColor: colors.primaryBorder,
      backgroundColor: colors.primarySoft,
    },
    todoBadge: {
      borderColor: colors.border,
      backgroundColor: colors.panelAlt,
    },
    statusTxt: {
      color: colors.text,
      fontSize: 10,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    accordionContent: {
      borderTopColor: colors.border,
      borderTopWidth: 1,
      padding: 10,
      gap: 8,
    },
    setLine: {
      gap: 3,
    },
    setMeta: {
      color: colors.muted,
      fontSize: 12,
    },
  })
