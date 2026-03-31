import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { colors } from '../styles/theme'

function TypeToggle({ value, onChange }) {
  return (
    <View style={styles.typeWrap}>
      {['entrainement', 'echauffement'].map((type) => (
        <Pressable
          key={type}
          style={[styles.typeBtn, value === type && styles.typeBtnActive]}
          onPress={() => onChange(type)}
        >
          <Text style={[styles.typeTxt, value === type && styles.typeTxtActive]}>{type}</Text>
        </Pressable>
      ))}
    </View>
  )
}

export function SessionFormScreen({
  editing,
  sessionName,
  exercises,
  error,
  saving,
  onBack,
  onSave,
  onSessionNameChange,
  onExerciseNameChange,
  onRemoveExercise,
  onSetFieldChange,
  onRemoveSet,
  onAddSet,
  onAddExercise,
}) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topActions}>
        <Pressable style={styles.secondaryBtn} onPress={onBack}>
          <Text style={styles.secondaryText}>Retour</Text>
        </Pressable>
        <Pressable style={styles.primaryBtn} onPress={onSave} disabled={saving}>
          <Text style={styles.primaryText}>
            {saving ? 'Enregistrement...' : editing ? 'Mettre a jour' : 'Enregistrer'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{editing ? 'Modifier la seance' : 'Nouvelle seance'}</Text>
        <Text style={styles.label}>Nom de la seance</Text>
        <TextInput
          value={sessionName}
          onChangeText={onSessionNameChange}
          style={styles.input}
          placeholder="ex: Push volume"
          placeholderTextColor={colors.muted}
        />
      </View>

      {exercises.map((exercise, exerciseIndex) => (
        <View key={`exercise-${exerciseIndex}`} style={styles.card}>
          <View style={styles.exerciseHeader}>
            <Text style={styles.subtitle}>Exercice {exerciseIndex + 1}</Text>
            <Pressable style={styles.secondaryBtn} onPress={() => onRemoveExercise(exerciseIndex)}>
              <Text style={styles.secondaryText}>Supprimer</Text>
            </Pressable>
          </View>

          <TextInput
            value={exercise.name}
            onChangeText={(value) => onExerciseNameChange(exerciseIndex, value)}
            style={styles.input}
            placeholder="Nom de l'exercice"
            placeholderTextColor={colors.muted}
          />

          {exercise.sets.map((set, setIndex) => (
            <View key={`set-${setIndex}`} style={styles.setCard}>
              <Text style={styles.smallLabel}>Type</Text>
              <TypeToggle
                value={set.type}
                onChange={(value) => onSetFieldChange(exerciseIndex, setIndex, 'type', value)}
              />

              <Text style={styles.smallLabel}>Duree (s)</Text>
              <TextInput
                value={String(set.time)}
                keyboardType="numeric"
                onChangeText={(value) => onSetFieldChange(exerciseIndex, setIndex, 'time', value)}
                style={styles.input}
              />

              <Text style={styles.smallLabel}>Repos (s)</Text>
              <TextInput
                value={String(set.wait)}
                keyboardType="numeric"
                onChangeText={(value) => onSetFieldChange(exerciseIndex, setIndex, 'wait', value)}
                style={styles.input}
              />

              <Pressable style={styles.deleteBtn} onPress={() => onRemoveSet(exerciseIndex, setIndex)}>
                <Text style={styles.deleteTxt}>Supprimer la serie</Text>
              </Pressable>
            </View>
          ))}

          <Pressable style={styles.secondaryBtn} onPress={() => onAddSet(exerciseIndex)}>
            <Text style={styles.secondaryText}>Ajouter une serie</Text>
          </Pressable>
        </View>
      ))}

      <Pressable style={styles.secondaryBtn} onPress={onAddExercise}>
        <Text style={styles.secondaryText}>Ajouter un exercice</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    paddingBottom: 28,
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  card: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    backgroundColor: colors.panel,
    padding: 12,
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    marginTop: 6,
    color: colors.text,
  },
  smallLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  input: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 12,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  setCard: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 6,
    backgroundColor: colors.bg,
  },
  typeWrap: {
    flexDirection: 'row',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  typeBtn: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBtnActive: {
    backgroundColor: colors.accent,
  },
  typeTxt: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  typeTxtActive: {
    color: '#090909',
  },
  primaryBtn: {
    flex: 1,
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
    height: 40,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: colors.text,
    fontWeight: '600',
  },
  deleteBtn: {
    marginTop: 4,
    borderColor: '#7f1d1d',
    borderWidth: 1,
    borderRadius: 10,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteTxt: {
    color: '#fca5a5',
    fontWeight: '600',
    fontSize: 12,
  },
  error: {
    color: colors.danger,
  },
})
