import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from './ui';
import { Colors } from '../../theme/colors';
import { api } from '../services/api';
import { BELT_COLORS, BELT_NAMES } from '../../theme/belts';
import { Fonts, Type } from '../../theme/typography';
import { useAuthStore } from '../../store/authStore';

export default function BeltCard({ studentId }: { studentId?: string }) {
  const { user } = useAuthStore();
  const targetId = studentId || user?.id;
  const [progression, setProgression] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgression = async () => {
      try {
        if (!targetId) return;
        const res = await api.get(`/progression/student/${targetId}`);
        setProgression(res.data);
      } catch (error) {
        console.error('Error fetching progression:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgression();
  }, [targetId]);

  if (loading) {
    return (
      <View style={[styles.card, { alignItems: 'center', justifyContent: 'center', height: 160 }]}>
        <ActivityIndicator color={Colors.gold} />
      </View>
    );
  }

  if (!progression) {
    return null; // Don't show if not loaded or failed
  }

  const currentBelt = progression.currentBelt || 'BRANCA';
  const beltColorHex = BELT_COLORS[currentBelt] || '#FFFFFF';
  const beltName = BELT_NAMES[currentBelt] || 'Branca';
  const currentDegree = progression.currentDegree || 0;
  
  // Render degrees (typically up to 4 degrees on the black bar)
  const renderDegrees = () => {
    const degrees = [];
    for (let i = 1; i <= 4; i++) {
      degrees.push(
        <View key={i} style={[styles.grau, i > currentDegree && styles.emptyGrau]} />
      );
    }
    return degrees;
  };

  const progressTotal = progression.progress?.total || 0;
  const isReady = progression.isReady;

  return (
    <View style={[styles.card, isReady && styles.cardReady]}>
      <View style={styles.row}>
        <View style={styles.visual}>
          <View style={[styles.strip, { backgroundColor: beltColorHex, shadowColor: beltColorHex }]}>
            {/* The tip is usually black for all belts except black belt which has red tip */}
            <View style={[styles.stripEnd, currentBelt === 'PRETA' ? { backgroundColor: '#DC2626' } : {}]} />
          </View>
          <View style={styles.graus}>
            {renderDegrees()}
          </View>
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>Faixa {beltName}</Text>
          <Text style={styles.sub}>
            {currentDegree}º Grau · {progression.stats?.elapsedMonths || 0} meses
          </Text>
        </View>
      </View>
      
      <View style={styles.progressLabel}>
        <Text style={styles.progressText}>
          {isReady ? 'PRONTO PARA GRADUAÇÃO' : 'PROGRESSÃO P/ PRÓXIMO GRAU'}
        </Text>
        <Text style={[styles.progressValue, isReady && { color: Colors.green }]}>{progressTotal}%</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[
          styles.progressFill, 
          { width: `${progressTotal}%` },
          isReady && { backgroundColor: Colors.green }
        ]} />
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
  cardReady: {
    borderColor: Colors.green,
    backgroundColor: 'rgba(75, 232, 122, 0.05)',
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
    position: 'relative',
    elevation: 4,
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
  title: { ...Type.section, color: Colors.text },
  sub: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.muted },
  progressLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 0.8,
  },
  progressValue: {
    fontFamily: Fonts.monoBold,
    fontSize: 12,
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
    backgroundColor: Colors.gold,
    borderRadius: 99,
  },
});
