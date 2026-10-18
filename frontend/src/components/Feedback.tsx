import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text } from './ui';
import { Colors } from '../../theme/colors';
import { useFeedbackStore } from '../utils/notify';

const KIND_COLOR = { error: Colors.red, success: Colors.green, info: Colors.blue } as const;

/** Toasts + modal de confirmação. Montado uma vez no layout raiz. */
export default function Feedback() {
  const toasts = useFeedbackStore((s) => s.toasts);
  const dismiss = useFeedbackStore((s) => s.dismiss);
  const confirmReq = useFeedbackStore((s) => s.confirmReq);
  const setConfirm = useFeedbackStore((s) => s.setConfirm);

  const answer = (ok: boolean) => {
    confirmReq?.resolve(ok);
    setConfirm(null);
  };

  return (
    <>
      <View pointerEvents="box-none" style={styles.toastLayer}>
        {toasts.map((t) => (
          <TouchableOpacity
            key={t.id}
            activeOpacity={0.9}
            onPress={() => dismiss(t.id)}
            accessibilityRole="alert"
            style={[styles.toast, { borderColor: KIND_COLOR[t.kind] }]}
          >
            <View style={[styles.dot, { backgroundColor: KIND_COLOR[t.kind] }]} />
            <Text style={styles.toastText}>{t.message}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {confirmReq && (
        <View style={styles.backdrop} accessibilityViewIsModal>
          <View style={styles.dialog} accessibilityRole="alert">
            <Text style={styles.dialogTitle}>{confirmReq.title}</Text>
            {confirmReq.message ? <Text style={styles.dialogMsg}>{confirmReq.message}</Text> : null}
            <View style={styles.dialogActions}>
              <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => answer(false)}>
                <Text style={styles.btnGhostText}>{confirmReq.cancelText || 'Cancelar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, confirmReq.destructive ? styles.btnDanger : styles.btnGold]}
                onPress={() => answer(true)}
              >
                <Text style={confirmReq.destructive ? styles.btnDangerText : styles.btnGoldText}>
                  {confirmReq.confirmText || 'Confirmar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  toastLayer: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 16 : 48,
    left: 16,
    right: 16,
    alignItems: 'center',
    gap: 8,
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: 480,
    width: '100%',
    backgroundColor: Colors.card2,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  toastText: { flex: 1, color: Colors.text, fontSize: 14 },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 2000,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
  },
  dialogTitle: { color: Colors.text, fontSize: 20, fontWeight: 'bold' },
  dialogMsg: { color: Colors.muted, fontSize: 14, marginTop: 8, lineHeight: 20 },
  dialogActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnGhost: { backgroundColor: Colors.card2, borderWidth: 1, borderColor: Colors.border },
  btnGhostText: { color: Colors.text, fontWeight: 'bold' },
  btnGold: { backgroundColor: Colors.gold },
  btnGoldText: { color: Colors.black, fontWeight: 'bold' },
  btnDanger: { backgroundColor: 'rgba(232,75,75,0.15)', borderWidth: 1, borderColor: 'rgba(232,75,75,0.4)' },
  btnDangerText: { color: Colors.red, fontWeight: 'bold' },
});
