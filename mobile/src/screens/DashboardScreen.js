import { useMemo } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../theme/ThemeContext'

function getSuggestedSession(history, sessions) {
  if (history.length < 3) return null
  const chronological = [...history].reverse()
  const latest = history[0]?.sessionName
  if (!latest) return null
  const counts = new Map()
  for (let index = 0; index < chronological.length - 1; index += 1) {
    const current = chronological[index]?.sessionName
    const next = chronological[index + 1]?.sessionName
    if (current === latest && next && sessions[next]) counts.set(next, (counts.get(next) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}

export function DashboardScreen({ sessions, sessionItems = [], history = [], refreshing = false, onRefresh, onOpenSessions, onOpenSession }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const count = Object.keys(sessions).length
  const suggestion = getSuggestedSession(history, sessions)
  const favorites = sessionItems.filter((session) => session.favorite && sessions[session.name])
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
    >
      <Text style={styles.eyebrow}>CHRONO-SPORT</Text>
      <Text style={styles.title}>Accueil</Text>
      <Text style={styles.subtitle}>Ton tableau de bord pour lancer rapidement la prochaine séance.</Text>

      <View style={styles.card}>
        <Text style={styles.cardEyebrow}>À SUIVRE</Text>
        <Text style={styles.cardTitle}>{suggestion ?? "Pas encore assez d'historique"}</Text>
        <Text style={styles.cardText}>
          {suggestion
            ? "Basé sur l'ordre de tes séances réellement terminées."
            : "Après quelques cycles, Chrono-Sport pourra te proposer la suite la plus probable."}
        </Text>
        <Pressable style={styles.primaryBtn} onPress={() => suggestion ? onOpenSession(suggestion) : onOpenSessions()}>
          <Text style={styles.primaryText}>{suggestion ? 'Lancer la séance' : 'Voir mes séances'}</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Favoris</Text>
      {favorites.length ? favorites.map((session) => (
        <Pressable key={session.id} style={styles.favoriteCard} onPress={() => onOpenSession(session.name)}>
          <Text style={styles.cardEyebrow}>★ FAVORI</Text>
          <Text style={styles.favoriteTitle}>{session.name}</Text>
        </Pressable>
      )) : <View style={styles.card}><Text style={styles.cardText}>Épingle tes séances préférées depuis l'onglet Séances.</Text></View>}

      <View style={styles.statsRow}>
        <View style={[styles.card, styles.statCard]}>
          <Text style={styles.cardText}>Programme</Text>
          <Text style={styles.count}>{count}</Text>
          <Text style={styles.cardText}>disponible{count > 1 ? 's' : ''}</Text>
        </View>
        <View style={[styles.card, styles.statCard]}>
          <Text style={styles.cardText}>Progression</Text>
          <Text style={styles.count}>{history.length}</Text>
          <Text style={styles.cardText}>terminée{history.length > 1 ? 's' : ''}</Text>
        </View>
      </View>
    </ScrollView>
  )
}
const createStyles = (colors) => StyleSheet.create({
  container:{padding:18,gap:14,paddingBottom:96,backgroundColor:colors.bg},
  eyebrow:{color:colors.primary,fontSize:11,fontWeight:'900',letterSpacing:1.6},
  title:{color:colors.text,fontSize:36,fontWeight:'900',letterSpacing:-1},
  subtitle:{color:colors.muted,fontSize:14,lineHeight:21,marginBottom:8},
  card:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:24,padding:18,gap:8},
  cardEyebrow:{color:colors.primary,fontSize:11,fontWeight:'900',letterSpacing:1.2},
  cardTitle:{color:colors.text,fontSize:22,fontWeight:'900'},
  cardText:{color:colors.muted,fontSize:13,lineHeight:19},
  count:{color:colors.text,fontSize:36,fontWeight:'900'},
  primaryBtn:{marginTop:8,height:48,borderRadius:16,backgroundColor:colors.ctaBg,borderWidth:1,borderColor:colors.ctaBorder,alignItems:'center',justifyContent:'center'},
  primaryText:{color:colors.ctaText,fontWeight:'900'},
  sectionTitle:{color:colors.text,fontSize:19,fontWeight:'900',marginTop:2},
  favoriteCard:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:18,padding:14,gap:4},
  favoriteTitle:{color:colors.text,fontSize:17,fontWeight:'900',textTransform:'capitalize'},
  statsRow:{flexDirection:'row',gap:10},
  statCard:{flex:1},
})
