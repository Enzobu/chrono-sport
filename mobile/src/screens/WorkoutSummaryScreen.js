import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { formatHoursMinutesSeconds } from '../lib/timer'
import { useTheme } from '../theme/ThemeContext'

export function WorkoutSummaryScreen({ sessionName, durationSeconds, exercises, sets, finishedAt, onDone }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>
        <Text style={styles.eyebrow}>SÉANCE TERMINÉE</Text>
        <Text style={styles.title}>{sessionName}</Text>
        <Text style={styles.subtitle}>Terminée à {new Date(finishedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
        <View style={styles.stats}>
          <View style={styles.stat}><Text style={styles.value}>{formatHoursMinutesSeconds(durationSeconds)}</Text><Text style={styles.label}>Durée réelle</Text></View>
          <View style={styles.stat}><Text style={styles.value}>{exercises}</Text><Text style={styles.label}>Exercices</Text></View>
          <View style={styles.stat}><Text style={styles.value}>{sets}</Text><Text style={styles.label}>Séries</Text></View>
        </View>
        <Pressable style={styles.primary} onPress={onDone}><Text style={styles.primaryText}>Retour à l'accueil</Text></Pressable>
      </View>
    </View>
  )
}
const createStyles=(colors)=>StyleSheet.create({
  container:{flex:1,justifyContent:'center',padding:18,backgroundColor:colors.bg},
  card:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:28,padding:22,gap:10},
  check:{width:60,height:60,borderRadius:20,alignSelf:'center',alignItems:'center',justifyContent:'center',backgroundColor:colors.primarySoft,borderWidth:1,borderColor:colors.primaryBorder},
  checkText:{color:colors.primary,fontSize:32,fontWeight:'900'},
  eyebrow:{color:colors.primary,textAlign:'center',fontSize:11,fontWeight:'900',letterSpacing:1.4,marginTop:6},
  title:{color:colors.text,textAlign:'center',fontSize:30,fontWeight:'900',textTransform:'capitalize'},
  subtitle:{color:colors.muted,textAlign:'center',fontSize:13},
  stats:{flexDirection:'row',gap:8,marginTop:10},
  stat:{flex:1,backgroundColor:colors.panel,borderWidth:1,borderColor:colors.border,borderRadius:18,padding:12,alignItems:'center'},
  value:{color:colors.text,fontSize:18,fontWeight:'900'},label:{color:colors.muted,fontSize:10,marginTop:3,textAlign:'center'},
  primary:{height:50,borderRadius:17,backgroundColor:colors.ctaBg,borderWidth:1,borderColor:colors.ctaBorder,alignItems:'center',justifyContent:'center',marginTop:10},
  primaryText:{color:colors.ctaText,fontWeight:'900'},
})
