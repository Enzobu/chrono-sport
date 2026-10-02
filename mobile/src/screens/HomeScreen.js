import { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { createTimeline, formatHoursMinutesSeconds } from '../lib/timer'
import { useTheme } from '../theme/ThemeContext'

function SessionCard({ name, data, onOpen, onEdit, onDelete, colors, styles }) {
  const duration = createTimeline(data).reduce((sum, step) => sum + step.duration, 0)
  const exercisesCount = Object.keys(data).length

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardIcon}>
          <Text style={styles.cardIconText}>↗</Text>
        </View>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{name}</Text>
          <Text style={styles.cardMeta}>
            {exercisesCount} exercices • {formatHoursMinutesSeconds(duration)}
          </Text>
        </View>
      </View>

      <Pressable style={styles.primaryBtn} onPress={() => onOpen(name)}>
        <Text style={styles.primaryText}>Lancer la séance</Text>
      </Pressable>

      <View style={styles.rowButtons}>
        <Pressable style={[styles.secondaryBtn, styles.cardActionBtn]} onPress={() => onEdit(name)}>
          <Text style={styles.secondaryText}>Modifier</Text>
        </Pressable>
        <Pressable style={[styles.deleteBtn, styles.cardActionBtn]} onPress={() => onDelete(name)}>
          <Text style={styles.deleteText}>Supprimer</Text>
        </Pressable>
      </View>
    </View>
  )
}

export function HomeScreen({
  sessions,
  isLoading,
  error,
  onOpenCreate,
  onOpenSession,
  onEditSession,
  onDeleteSession,
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>CHRONO-SPORT</Text>
        <Text style={styles.title}>Séances</Text>
        <Text style={styles.subtitle}>
          Retrouve, crée et organise toutes tes séances.
        </Text>

        <Pressable style={styles.newSessionBtn} onPress={onOpenCreate}>
          <Text style={styles.newSessionPlus}>＋</Text>
          <Text style={styles.newSessionText}>Nouvelle séance</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Programme</Text>
        <View style={styles.countPill}>
          <Text style={styles.countPillText}>{Object.keys(sessions).length}</Text>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {isLoading ? <Text style={styles.loading}>Chargement des séances...</Text> : null}

      {Object.keys(sessions).map((name) => (
        <SessionCard
          key={name}
          name={name}
          data={sessions[name]}
          onOpen={onOpenSession}
          onEdit={onEditSession}
          onDelete={onDeleteSession}
          colors={colors}
          styles={styles}
        />
      ))}

      {!isLoading && !Object.keys(sessions).length ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Aucune séance</Text>
          <Text style={styles.emptyText}>Crée ta première séance pour commencer.</Text>
        </View>
      ) : null}
    </ScrollView>
  )
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      padding: 18,
      gap: 14,
      paddingBottom: 34,
      backgroundColor: colors.bg,
    },
    header: {
      gap: 8,
      marginBottom: 4,
    },
    eyebrow: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 1.6,
    },
    title: {
      color: colors.text,
      fontSize: 36,
      fontWeight: '900',
      letterSpacing: -1,
    },
    subtitle: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 21,
      maxWidth: 520,
    },
    newSessionBtn: {
      marginTop: 12,
      minHeight: 54,
      borderRadius: 18,
      backgroundColor: colors.ctaBg,
      borderWidth: 1,
      borderColor: colors.ctaBorder,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    newSessionPlus: {
      color: colors.ctaText,
      fontSize: 22,
      fontWeight: '900',
    },
    newSessionText: {
      color: colors.ctaText,
      fontSize: 15,
      fontWeight: '900',
    },
    sectionHeader: {
      marginTop: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
    },
    countPill: {
      minWidth: 32,
      height: 28,
      borderRadius: 14,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
    },
    countPillText: {
      color: colors.primary,
      fontWeight: '800',
      fontSize: 12,
    },
    error: {
      color: colors.danger,
    },
    loading: {
      color: colors.muted,
    },
    card: {
      borderRadius: 22,
      backgroundColor: colors.surface,
      padding: 16,
      gap: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTop: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
    },
    cardIcon: {
      width: 44,
      height: 44,
      borderRadius: 15,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardIconText: {
      color: colors.primary,
      fontSize: 21,
      fontWeight: '900',
    },
    cardHeader: {
      flex: 1,
      gap: 4,
    },
    cardTitle: {
      color: colors.text,
      fontWeight: '800',
      fontSize: 18,
      textTransform: 'capitalize',
    },
    cardMeta: {
      color: colors.muted,
      fontSize: 12,
    },
    rowButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    primaryBtn: {
      backgroundColor: colors.ctaBg,
      borderWidth: 1,
      borderColor: colors.ctaBorder,
      borderRadius: 16,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryText: {
      color: colors.ctaText,
      fontWeight: '900',
      fontSize: 14,
    },
    secondaryBtn: {
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 12,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.panel,
    },
    secondaryText: {
      color: colors.text,
      fontWeight: '700',
    },
    deleteBtn: {
      borderColor: colors.danger,
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 12,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.panel,
    },
    cardActionBtn: {
      flex: 1,
    },
    deleteText: {
      color: colors.danger,
      fontWeight: '700',
    },
    empty: {
      borderRadius: 22,
      padding: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 5,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
    },
    emptyText: {
      color: colors.muted,
    },
  })
