import { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../theme/ThemeContext'

export function DashboardScreen({ sessions, onOpenSessions }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const count = Object.keys(sessions).length
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>CHRONO-SPORT</Text>
      <Text style={styles.title}>Accueil</Text>
      <Text style={styles.subtitle}>Ton tableau de bord pour lancer rapidement la prochaine séance.</Text>

      <View style={styles.card}>
        <Text style={styles.cardEyebrow}>À SUIVRE</Text>
        <Text style={styles.cardTitle}>Ta prochaine séance apparaîtra ici</Text>
        <Text style={styles.cardText}>La suggestion sera alimentée par ton historique de séances.</Text>
        <Pressable style={styles.primaryBtn} onPress={onOpenSessions}>
          <Text style={styles.primaryText}>Voir mes séances</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardText}>Programme</Text>
        <Text style={styles.count}>{count}</Text>
        <Text style={styles.cardText}>séance{count > 1 ? 's' : ''} disponible{count > 1 ? 's' : ''}</Text>
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
})
