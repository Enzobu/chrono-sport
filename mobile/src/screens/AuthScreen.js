import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { colors } from '../styles/theme'

export function AuthScreen({
  authMode,
  email,
  password,
  authError,
  loading,
  onEmailChange,
  onPasswordChange,
  onModeToggle,
  onSubmit,
}) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <Text style={styles.badge}>Chrono-Sport</Text>
        <Text style={styles.title}>{authMode === 'login' ? 'Connexion' : 'Inscription'}</Text>
        <Text style={styles.subtitle}>Connecte-toi pour retrouver tes seances.</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={onEmailChange}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="toi@email.com"
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          value={password}
          onChangeText={onPasswordChange}
          style={styles.input}
          secureTextEntry
          placeholder="8 caracteres minimum"
          placeholderTextColor={colors.muted}
        />

        {authError ? <Text style={styles.error}>{authError}</Text> : null}

        <Pressable style={styles.primaryBtn} onPress={onSubmit} disabled={loading}>
          <Text style={styles.primaryText}>
            {loading
              ? 'Chargement...'
              : authMode === 'login'
                ? 'Se connecter'
                : "S'inscrire"}
          </Text>
        </Pressable>

        <Pressable style={styles.secondaryBtn} onPress={onModeToggle}>
          <Text style={styles.secondaryText}>
            {authMode === 'login'
              ? 'Pas de compte ? Creer un compte'
              : 'Deja un compte ? Se connecter'}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  badge: {
    color: colors.text,
    alignSelf: 'flex-start',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 12,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 16,
    color: colors.muted,
  },
  label: {
    color: colors.text,
    marginBottom: 6,
    marginTop: 6,
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
  error: {
    color: colors.danger,
    marginTop: 10,
  },
  primaryBtn: {
    marginTop: 14,
    backgroundColor: colors.accent,
    borderRadius: 10,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#090909',
    fontWeight: '700',
  },
  secondaryBtn: {
    marginTop: 10,
    borderRadius: 10,
    borderColor: colors.border,
    borderWidth: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: colors.text,
  },
})
