import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { createTimeline, formatHoursMinutesSeconds } from '../lib/timer'
import { colors } from '../styles/theme'

function SessionCard({ name, data, onOpen, onEdit, onDelete }) {
  const duration = createTimeline(data).reduce((sum, step) => sum + step.duration, 0)
  const exercisesCount = Object.keys(data).length

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{name}</Text>
        <Text style={styles.cardMeta}>
          {exercisesCount} exercices - {formatHoursMinutesSeconds(duration)}
        </Text>
      </View>

      <Pressable style={styles.primaryBtn} onPress={() => onOpen(name)}>
        <Text style={styles.primaryText}>Lancer la seance</Text>
      </Pressable>

      <View style={styles.rowButtons}>
        <Pressable style={styles.secondaryBtn} onPress={() => onEdit(name)}>
          <Text style={styles.secondaryText}>Modifier</Text>
        </Pressable>
        <Pressable style={styles.deleteBtn} onPress={() => onDelete(name)}>
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
  onLogout,
  onOpenSession,
  onEditSession,
  onDeleteSession,
}) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topActions}>
        <Pressable style={styles.secondaryBtn} onPress={onOpenCreate}>
          <Text style={styles.secondaryText}>Nouvelle seance</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={onLogout}>
          <Text style={styles.secondaryText}>Deconnexion</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>Choisis ta seance</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isLoading ? <Text style={styles.loading}>Chargement des seances...</Text> : null}

      {Object.keys(sessions).map((name) => (
        <SessionCard
          key={name}
          name={name}
          data={sessions[name]}
          onOpen={onOpenSession}
          onEdit={onEditSession}
          onDelete={onDeleteSession}
        />
      ))}

      {!isLoading && !Object.keys(sessions).length ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Aucune seance en base pour cet utilisateur.</Text>
        </View>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '700',
    marginTop: 6,
  },
  error: {
    color: colors.danger,
  },
  loading: {
    color: colors.muted,
  },
  card: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    backgroundColor: colors.panel,
    padding: 12,
    gap: 10,
  },
  cardHeader: {
    gap: 6,
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '700',
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
    backgroundColor: colors.accent,
    borderRadius: 10,
    height: 42,
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
    paddingHorizontal: 12,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: colors.text,
    fontWeight: '500',
  },
  deleteBtn: {
    borderColor: '#7f1d1d',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: '#fca5a5',
    fontWeight: '600',
  },
  empty: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.panel,
  },
  emptyText: {
    color: colors.muted,
  },
})
