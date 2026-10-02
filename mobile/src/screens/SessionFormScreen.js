import { useEffect, useMemo, useState } from 'react'
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native'
import { useTheme } from '../theme/ThemeContext'

function TypeToggle({ value, onChange }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

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
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [weightInputs, setWeightInputs] = useState({})
  const [expandedExercises, setExpandedExercises] = useState(() => new Set(editing ? [] : [0]))
  const [expandedSets, setExpandedSets] = useState(() => new Set())

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true)
    }
  }, [])

  const animateLayout = () => {
    LayoutAnimation.configureNext({
      duration: 240,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    })
  }

  const fieldKey = (exerciseIndex, setIndex) => `${exerciseIndex}-${setIndex}`
  const setAccordionKey = (exerciseIndex, setIndex) => `${exerciseIndex}-${setIndex}`

  const toggleExercise = (exerciseIndex) => {
    animateLayout()
    setExpandedExercises((prev) => {
      const next = new Set(prev)
      if (next.has(exerciseIndex)) {
        next.delete(exerciseIndex)
      } else {
        next.add(exerciseIndex)
      }
      return next
    })
  }

  const toggleSet = (exerciseIndex, setIndex) => {
    animateLayout()
    const key = setAccordionKey(exerciseIndex, setIndex)
    setExpandedSets((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const handleAddSet = (exerciseIndex) => {
    animateLayout()
    const newSetIndex = exercises[exerciseIndex]?.sets.length ?? 0
    onAddSet(exerciseIndex)
    setExpandedExercises((prev) => new Set(prev).add(exerciseIndex))
    setExpandedSets((prev) => new Set(prev).add(setAccordionKey(exerciseIndex, newSetIndex)))
  }

  const handleAddExercise = () => {
    const newExerciseIndex = exercises.length
    onAddExercise()
    setExpandedExercises(new Set([newExerciseIndex]))
    setExpandedSets(new Set())
  }

  const handleInsertExercise = (exerciseIndex) => {
    animateLayout()
    onInsertExercise(exerciseIndex)
    setExpandedExercises(new Set([exerciseIndex]))
    setExpandedSets(new Set())
  }

  const handleMoveExercise = (exerciseIndex, direction) => {
    animateLayout()
    onMoveExercise(exerciseIndex, direction)
  }

  const handleRemoveExercise = (exerciseIndex) => {
    animateLayout()
    onRemoveExercise(exerciseIndex)
  }

  const handleRemoveSet = (exerciseIndex, setIndex) => {
    animateLayout()
    onRemoveSet(exerciseIndex, setIndex)
  }

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

      <Pressable
        style={styles.insertExerciseBtn}
        onPress={() => handleInsertExercise(0)}
      >
        <Text style={styles.insertExerciseText}>+ Ajouter ici</Text>
      </Pressable>

      {exercises.map((exercise, exerciseIndex) => {
        const exerciseExpanded = expandedExercises.has(exerciseIndex)

        return (
          <View key={`exercise-${exerciseIndex}`} style={styles.exerciseBlock}>
            <View style={styles.card}>
              <View style={styles.exerciseHeader}>
                <Pressable style={styles.exerciseSummary} onPress={() => toggleExercise(exerciseIndex)}>
                  <Text style={styles.chevron}>{exerciseExpanded ? '⌃' : '⌄'}</Text>
                  <View style={styles.exerciseSummaryText}>
                    <Text style={styles.subtitle} numberOfLines={1}>
                      {exercise.name.trim() || `Exercice ${exerciseIndex + 1}`}
                    </Text>
                    <Text style={styles.summaryMeta}>
                      Exercice {exerciseIndex + 1} • {exercise.sets.length} série{exercise.sets.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                </Pressable>

                <View style={styles.exerciseActions}>
                  <Pressable
                    style={[styles.orderBtn, exerciseIndex === 0 && styles.orderBtnDisabled]}
                    onPress={() => handleMoveExercise(exerciseIndex, -1)}
                    disabled={exerciseIndex === 0}
                  >
                    <Text style={styles.orderBtnText}>↑</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.orderBtn,
                      exerciseIndex === exercises.length - 1 && styles.orderBtnDisabled,
                    ]}
                    onPress={() => handleMoveExercise(exerciseIndex, 1)}
                    disabled={exerciseIndex === exercises.length - 1}
                  >
                    <Text style={styles.orderBtnText}>↓</Text>
                  </Pressable>
                </View>
              </View>

              {exerciseExpanded ? (
                <>
                  <TextInput
                    value={exercise.name}
                    onChangeText={(value) => onExerciseNameChange(exerciseIndex, value)}
                    style={styles.input}
                    placeholder="Nom de l'exercice"
                    placeholderTextColor={colors.muted}
                  />

                  {exercise.sets.map((set, setIndex) => {
                    const setKey = setAccordionKey(exerciseIndex, setIndex)
                    const setExpanded = expandedSets.has(setKey)

                    return (
                      <View key={`set-${setIndex}`} style={styles.setCard}>
                        <Pressable style={styles.setSummary} onPress={() => toggleSet(exerciseIndex, setIndex)}>
                          <View style={styles.setSummaryText}>
                            <Text style={styles.setTitle}>
                              Série {setIndex + 1}
                              {set.type === 'echauffement' ? ' • Échauffement' : ''}
                            </Text>
                            <Text style={styles.summaryMeta}>
                              {set.time}s • repos {set.wait}s • {Number(set.weight) || 0}kg
                            </Text>
                          </View>
                          <Text style={styles.chevron}>{setExpanded ? '⌃' : '⌄'}</Text>
                        </Pressable>

                        {setExpanded ? (
                          <View style={styles.setContent}>
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
                                onPress={() =>
                                  onSetFieldChange(exerciseIndex, setIndex, 'weight', String(set.weight - 0.5))
                                }
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
                                onPress={() =>
                                  onSetFieldChange(exerciseIndex, setIndex, 'weight', String(set.weight + 0.5))
                                }
                              >
                                <Text style={styles.weightStepTxt}>+0.5</Text>
                              </Pressable>
                            </View>

                            <Pressable
                              style={styles.deleteBtn}
                              onPress={() => handleRemoveSet(exerciseIndex, setIndex)}
                            >
                              <Text style={styles.deleteTxt}>Supprimer la serie</Text>
                            </Pressable>
                          </View>
                        ) : null}
                      </View>
                    )
                  })}

                  <View style={styles.exerciseFooter}>
                    <Pressable style={styles.secondaryBtn} onPress={() => handleAddSet(exerciseIndex)}>
                      <Text style={styles.secondaryText}>Ajouter une serie</Text>
                    </Pressable>
                    <Pressable style={styles.deleteBtnCompact} onPress={() => handleRemoveExercise(exerciseIndex)}>
                      <Text style={styles.deleteTxt}>Supprimer l'exercice</Text>
                    </Pressable>
                  </View>
                </>
              ) : null}
            </View>

            {exerciseIndex < exercises.length - 1 ? (
              <Pressable
                style={styles.insertExerciseBtn}
                onPress={() => handleInsertExercise(exerciseIndex + 1)}
              >
                <Text style={styles.insertExerciseText}>+ Ajouter ici</Text>
              </Pressable>
            ) : null}
          </View>
        )
      })}

      <Pressable
        style={styles.insertExerciseBtn}
        onPress={() => handleInsertExercise(exercises.length)}
      >
        <Text style={styles.insertExerciseText}>+ Ajouter ici</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  )
}

const createStyles = (colors) => StyleSheet.create({
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
    borderRadius: 22,
    backgroundColor: colors.surface,
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
    fontSize: 17,
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
    borderRadius: 14,
    height: 42,
    paddingHorizontal: 12,
    color: colors.text,
    backgroundColor: colors.panel,
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
    borderRadius: 14,
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
    alignItems: 'center',
    gap: 8,
  },
  exerciseSummary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 42,
  },
  exerciseSummaryText: {
    flex: 1,
    gap: 2,
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
    borderRadius: 14,
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
  chevron: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  summaryMeta: {
    color: colors.muted,
    fontSize: 12,
  },
  insertExerciseBtn: {
    height: 36,
    borderColor: colors.border,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
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
    borderRadius: 16,
    backgroundColor: colors.panel,
    overflow: 'hidden',
  },
  setSummary: {
    minHeight: 54,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  setSummaryText: {
    flex: 1,
    gap: 2,
  },
  setTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  setContent: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    padding: 10,
    gap: 6,
  },
  exerciseFooter: {
    gap: 8,
  },
  typeWrap: {
    flexDirection: 'row',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
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
    backgroundColor: colors.ctaBg,
  },
  typeTxt: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  typeTxtActive: {
    color: colors.ctaText,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.ctaBg,
    borderWidth: 1,
    borderColor: colors.ctaBorder,
    borderRadius: 14,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: colors.ctaText,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
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
    borderRadius: 14,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnCompact: {
    borderColor: '#7f1d1d',
    borderWidth: 1,
    borderRadius: 14,
    height: 40,
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
