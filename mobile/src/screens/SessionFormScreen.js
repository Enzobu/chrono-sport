import { useState } from 'react'
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
  onMoveExercise,
  onInsertExercise,
  onSetFieldChange,
  onRemoveSet,
  onAddSet,
  onAddExercise,
}) {
  const [weightInputs, setWeightInputs] = useState({})

  const fieldKey = (exerciseIndex, setIndex) => `${exerciseIndex}-${setIndex}`

  const onWeightChange = (exerciseIndex, setIndex, value) => {
    const key = fieldKey(exerciseIndex, setIndex)
    setWeightInputs((prev) => ({ ...prev, [key]: value }))

    const normalized = value.replace(',', '.')
    if (/^\d+(\.\d+)?$/.test(normalized)) {
      onSetFieldChange(exerciseIndex, setIndex, 'weight', normalized)
    }
  }

  const onWeightBlur = (exerciseIndex, setIndex, fallback) => {
    const key = fieldKey(exerciseIndex, setIndex)
    const raw = weightInputs[key]
    if (typeof raw !== 'string') {
      return
    }

    const normalized = raw.replace(',', '.')
    const parsed = Number(normalized)
    const sanitized = Number.isFinite(parsed) ? Math.max(0, Math.round(parsed * 2) / 2) : fallback
    onSetFieldChange(exerciseIndex, setIndex, 'weight', String(sanitized))

    setWeightInputs((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

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
        <View key={`exercise-${exerciseIndex}`} style={styles.exerciseBlock}>
          <View style={styles.card}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.subtitle}>Exercice {exerciseIndex + 1}</Text>
              <View style={styles.exerciseActions}>
                <Pressable
                  style={[styles.orderBtn, exerciseIndex === 0 && styles.orderBtnDisabled]}
                  onPress={() => onMoveExercise(exerciseIndex, -1)}
                  disabled={exerciseIndex === 0}
                >
                  <Text style={styles.orderBtnText}>↑</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.orderBtn,
                    exerciseIndex === exercises.length - 1 && styles.orderBtnDisabled,
                  ]}
                  onPress={() => onMoveExercise(exerciseIndex, 1)}
                  disabled={exerciseIndex === exercises.length - 1}
                >
                  <Text style={styles.orderBtnText}>↓</Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() => onRemoveExercise(exerciseIndex)}
                >
                  <Text style={styles.secondaryText}>Supprimer</Text>
                </Pressable>
              </View>
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

              <Text style={styles.smallLabel}>Poids (kg)</Text>
              <View style={styles.weightRow}>
                <Pressable
                  style={styles.weightStepBtn}
                  onPress={() => onSetFieldChange(exerciseIndex, setIndex, 'weight', String(set.weight - 0.5))}
                >
                  <Text style={styles.weightStepTxt}>-0.5</Text>
                </Pressable>

                <TextInput
                  value={weightInputs[fieldKey(exerciseIndex, setIndex)] ?? String(set.weight)}
                  keyboardType="decimal-pad"
                  onChangeText={(value) => onWeightChange(exerciseIndex, setIndex, value)}
                  onBlur={() => onWeightBlur(exerciseIndex, setIndex, set.weight)}
                  style={[styles.input, styles.weightInput]}
                />

                <Pressable
                  style={styles.weightStepBtn}
                  onPress={() => onSetFieldChange(exerciseIndex, setIndex, 'weight', String(set.weight + 0.5))}
                >
                  <Text style={styles.weightStepTxt}>+0.5</Text>
                </Pressable>
              </View>

              <Pressable style={styles.deleteBtn} onPress={() => onRemoveSet(exerciseIndex, setIndex)}>
                <Text style={styles.deleteTxt}>Supprimer la serie</Text>
              </Pressable>
            </View>
          ))}

            <Pressable style={styles.secondaryBtn} onPress={() => onAddSet(exerciseIndex)}>
              <Text style={styles.secondaryText}>Ajouter une serie</Text>
            </Pressable>
          </View>

          {exerciseIndex < exercises.length - 1 ? (
            <Pressable
              style={styles.insertExerciseBtn}
              onPress={() => onInsertExercise(exerciseIndex + 1)}
            >
              <Text style={styles.insertExerciseText}>+ Ajouter ici</Text>
            </Pressable>
          ) : null}
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
  exerciseBlock: {
    gap: 10,
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
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weightInput: {
    flex: 1,
  },
  weightStepBtn: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    height: 42,
    minWidth: 62,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  weightStepTxt: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderBtn: {
    width: 40,
    height: 40,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBtnDisabled: {
    opacity: 0.3,
  },
  orderBtnText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  insertExerciseBtn: {
    height: 36,
    borderColor: colors.border,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  insertExerciseText: {
    color: colors.muted,
    fontWeight: '600',
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
