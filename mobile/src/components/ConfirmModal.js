import { useMemo } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../theme/ThemeContext'

export function ConfirmModal({ visible, title, message, confirmLabel, onCancel, onConfirm, hideCancel = false }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.panel} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            {!hideCancel ? (
              <Pressable style={[styles.button, styles.cancel]} onPress={onCancel}>
                <Text style={styles.cancelText}>Annuler</Text>
              </Pressable>
            ) : null}
            <Pressable style={[styles.button, styles.confirm]} onPress={onConfirm}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const createStyles = (colors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  panel: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  message: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 14,
  },
  actions: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  button: {
    minHeight: 44,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: {
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.panel,
  },
  confirm: {
    backgroundColor: colors.ctaBg,
    borderColor: colors.ctaBorder,
    borderWidth: 1,
  },
  cancelText: {
    color: colors.text,
    fontWeight: '600',
  },
  confirmText: {
    color: colors.ctaText,
    fontWeight: '800',
  },
})
