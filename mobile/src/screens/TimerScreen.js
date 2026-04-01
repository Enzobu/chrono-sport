import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { formatMinutesSeconds } from '../lib/timer'
import { colors } from '../styles/theme'

const formatWeight = (weight) => {
  const parsed = Number(weight) || 0
  return `${parsed % 1 === 0 ? parsed : parsed.toFixed(1)}kg`
}

function Accordion({ title, status, children, open }) {
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
  timerLabel,
  exerciseLabel,
  progressPct,
  totalRemainingLabel,
  elapsedLabel,
  exercisesStat,
  isWarmup,
  isRunning,
  isFinished,
  sessionOutline,
  onBack,
  onToggleRun,
  onSkip,
  onReset,
}) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable style={styles.secondaryBtn} onPress={onBack}>
        <Text style={styles.secondaryText}>Retour aux seances</Text>
      </Pressable>

      <View style={styles.timerCard}>
        <View style={styles.rowBetween}>
          <Text style={styles.phasePill}>{phaseLabel}</Text>
          <Text style={styles.sessionPill}>Seance {sessionName}</Text>
        </View>

        <Text style={[styles.timerText, phaseLabel === 'Travail' && !isFinished ? styles.timerWork : null]}>
          {timerLabel}
        </Text>
        <Text style={styles.exerciseText}>Exercice : {exerciseLabel}</Text>
        {isWarmup ? <Text style={styles.warmup}>Echauffement</Text> : null}

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progressPct)}%</Text>

        <View style={styles.timerActions}>
          <Pressable style={styles.primaryBtn} onPress={onToggleRun}>
            <Text style={styles.primaryText}>
              {isFinished ? 'Relancer' : isRunning ? 'Pause' : 'Lancer'}
            </Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={onSkip}>
            <Text style={styles.secondaryText}>Skip</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={onReset}>
            <Text style={styles.secondaryText}>Reinitialiser</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsLabel}>Temps restant global</Text>
        <Text style={styles.statsValue}>{totalRemainingLabel}</Text>
        <Text style={styles.statsLabel}>Depuis le debut</Text>
        <Text style={styles.statsValue}>{elapsedLabel}</Text>
        <Text style={styles.statsLabel}>Exercices</Text>
        <Text style={styles.statsValue}>{exercisesStat}</Text>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>Details de la seance</Text>
        {sessionOutline.map((exercise, exerciseIndex) => (
          <Accordion
            key={exercise.exerciseName}
            title={exercise.exerciseName}
            status={exercise.done ? 'fait' : exercise.hasCurrent ? 'en cours' : 'a faire'}
            open={exercise.hasCurrent || (!exercise.done && exerciseIndex === 0)}
          >
            {exercise.sets.map((set) => (
              <Accordion
                key={set.key}
                title={`Serie ${set.order}/${set.total} ・ ${formatWeight(set.weight)}`}
                status={set.done ? 'fait' : set.current ? 'en cours' : 'a faire'}
                open={set.current}
              >
                <View style={styles.setLine}>
                  <Text style={styles.setMeta}>Type: {set.type}</Text>
                  <Text style={styles.setMeta}>Travail: {formatMinutesSeconds(set.time)}</Text>
                  <Text style={styles.setMeta}>Repos: {formatMinutesSeconds(set.wait)}</Text>
                </View>
              </Accordion>
            ))}
          </Accordion>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    paddingBottom: 24,
  },
  timerCard: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  phasePill: {
    color: colors.text,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  sessionPill: {
    color: colors.muted,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  timerText: {
    marginTop: 4,
    color: colors.text,
    textAlign: 'center',
    fontSize: 54,
    fontWeight: '700',
  },
  timerWork: {
    color: '#ef4444',
  },
  exerciseText: {
    color: colors.text,
    textAlign: 'center',
  },
  warmup: {
    color: colors.warning,
    alignSelf: 'center',
    borderColor: '#854d0e',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    fontSize: 12,
  },
  progressTrack: {
    marginTop: 6,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.panelAlt,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    backgroundColor: colors.accent,
  },
  progressText: {
    color: colors.muted,
    textAlign: 'right',
    marginTop: 4,
  },
  timerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#090909',
    fontWeight: '700',
  },
  secondaryBtn: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: colors.text,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  statsLabel: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 6,
  },
  statsValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  detailCard: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  detailTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  accordion: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
  },
  accordionHeader: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  accordionTitle: {
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  doneBadge: {
    borderColor: '#14532d',
    backgroundColor: '#052e16',
  },
  currentBadge: {
    borderColor: '#1e3a8a',
    backgroundColor: '#172554',
  },
  todoBadge: {
    borderColor: colors.border,
    backgroundColor: colors.panelAlt,
  },
  statusTxt: {
    color: colors.text,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  accordionContent: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    padding: 10,
    gap: 8,
  },
  setLine: {
    paddingTop: 2,
    gap: 2,
  },
  setMeta: {
    color: colors.muted,
    fontSize: 12,
  },
})
