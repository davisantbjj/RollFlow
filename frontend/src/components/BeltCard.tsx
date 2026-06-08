import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';

export default function BeltCard() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.visual}>
          <View style={styles.strip}>
            <View style={styles.stripEnd} />
          </View>
          <View style={styles.graus}>
            <View style={styles.grau} />
            <View style={styles.grau} />
            <View style={styles.grau} />
            <View style={[styles.grau, styles.emptyGrau]} />
          </View>
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>Faixa Azul</Text>
          <Text style={styles.sub}>3º Grau · 4 anos</Text>
        </View>
      </View>
      
      <View style={styles.progressLabel}>
        <Text style={styles.progressText}>PROGRESSÃO P/ FAIXA ROXA</Text>
        <Text style={styles.progressValue}>72%</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={styles.progressFill} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  visual: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  strip: {
    width: 48,
    height: 14,
    borderRadius: 4,
    backgroundColor: '#1a5eff',
    position: 'relative',
    elevation: 4,
    shadowColor: '#1a5eff',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
  },
  stripEnd: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 12,
    height: '100%',
    backgroundColor: '#000',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  graus: {
    flexDirection: 'row',
    gap: 4,
  },
  grau: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: Colors.gold,
    elevation: 4,
    shadowColor: Colors.gold,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  emptyGrau: {
    backgroundColor: Colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  info: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 22,
    color: Colors.text,
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  sub: {
    fontSize: 11,
    color: Colors.muted,
    fontWeight: '600',
  },
  progressLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 0.8,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.gold,
    letterSpacing: 0.8,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '72%',
    backgroundColor: Colors.gold,
    borderRadius: 99,
  },
});
