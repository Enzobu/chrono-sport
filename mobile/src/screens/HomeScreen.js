import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { createTimeline, formatHoursMinutesSeconds } from '../lib/timer'
import { useTheme } from '../theme/ThemeContext'

function SessionCard({ name, data, favorite, onToggleFavorite, onOpen, onEdit, onDelete, colors, styles }) {
  const duration = createTimeline(data).reduce((sum, step) => sum + step.duration, 0)
  const exercisesCount = Object.keys(data).length

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Pressable style={[styles.favoriteBtn, favorite && styles.favoriteBtnActive]} onPress={() => onToggleFavorite(name)}>
          <Text style={[styles.favoriteText, favorite && styles.favoriteTextActive]}>{favorite ? '★' : '☆'}</Text>
        </Pressable>
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
  sessionItems = [],
  onToggleFavorite,
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [query, setQuery] = useState('')
  const visibleSessions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return Object.keys(sessions)
      .filter((name) => !normalized || name.toLowerCase().includes(normalized))
      .sort((a, b) => {
        const aFavorite = Boolean(sessionItems.find((session) => session.name === a)?.favorite)
        const bFavorite = Boolean(sessionItems.find((session) => session.name === b)?.favorite)
        return Number(bFavorite) - Number(aFavorite)
      })
  }, [query, sessions, sessionItems])

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

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher une séance..."
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Programme</Text>
        <View style={styles.countPill}>
          <Text style={styles.countPillText}>{visibleSessions.length}</Text>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {isLoading ? <Text style={styles.loading}>Chargement des séances...</Text> : null}

      {visibleSessions.map((name) => {
        const item = sessionItems.find((session) => session.name === name)
        return (
        <SessionCard
          key={name}
          name={name}
          data={sessions[name]}
          onOpen={onOpenSession}
          onEdit={onEditSession}
          favorite={Boolean(item?.favorite)}
          onToggleFavorite={onToggleFavorite}
          onDelete={onDeleteSession}
          colors={colors}
          styles={styles}
        />
        )
      })}

      {!isLoading && !visibleSessions.length ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{query ? 'Aucun résultat' : 'Aucune séance'}</Text>
          <Text style={styles.emptyText}>{query ? 'Essaie avec un autre nom.' : 'Crée ta première séance pour commencer.'}</Text>
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
      paddingBottom: 96,
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
    searchWrap:{height:50,borderRadius:16,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,flexDirection:'row',alignItems:'center',paddingHorizontal:14,gap:10},
    searchIcon:{color:colors.muted,fontSize:22,fontWeight:'800'},
    searchInput:{flex:1,color:colors.text,fontSize:14},
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
      position: 'relative',
      gap: 12,
      alignItems: 'center',
    },
    favoriteBtn:{position:'absolute',right:0,top:0,width:36,height:36,borderRadius:12,alignItems:'center',justifyContent:'center',zIndex:2},
    favoriteBtnActive:{backgroundColor:colors.primarySoft,borderWidth:1,borderColor:colors.primaryBorder},
    favoriteText:{color:colors.muted,fontSize:22,fontWeight:'900'},
    favoriteTextActive:{color:colors.primary},
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
