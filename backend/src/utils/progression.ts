export interface ProgressionRuleData {
  minAttendanceCount: number;
  minMonths: number;
  minEvaluationScore: number;
  requiresEvaluation: boolean;
}

/** Regra padrão (BJJ adulto) quando a academia não configurou a faixa. */
export const DEFAULT_PROGRESSION_RULE: ProgressionRuleData = {
  minAttendanceCount: 100,
  minMonths: 12,
  minEvaluationScore: 3.0,
  requiresEvaluation: true,
};

interface ProgressInput {
  referenceDate: Date; // última promoção ou data de cadastro
  rule: ProgressionRuleData | null | undefined;
  attendances: number; // presenças desde referenceDate
  evaluations: { technique: number; discipline: number; evolution: number }[]; // desde referenceDate
  now?: Date;
}

/** Cálculo único de progressão de faixa (usado por /progression/student/:id e /dashboard/analytics). */
export function computeProgression({ referenceDate, rule, attendances, evaluations, now = new Date() }: ProgressInput) {
  const activeRule = rule || DEFAULT_PROGRESSION_RULE;

  const diffTime = Math.abs(now.getTime() - referenceDate.getTime());
  const elapsedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const elapsedMonths = elapsedDays / 30.44;

  let avgScore = 0;
  if (evaluations.length > 0) {
    const total = evaluations.reduce((acc, e) => acc + e.technique + e.discipline + e.evolution, 0);
    avgScore = total / (evaluations.length * 3);
  }

  const ratio = (value: number, min: number) => (min > 0 ? Math.min(100, (value / min) * 100) : 100);
  const attendProgress = ratio(attendances, activeRule.minAttendanceCount);
  const timeProgress = ratio(elapsedMonths, activeRule.minMonths);
  const evalProgress = activeRule.requiresEvaluation ? ratio(avgScore, activeRule.minEvaluationScore) : 100;
  const totalProgress = Math.round((attendProgress + timeProgress + evalProgress) / 3);

  return {
    rule: activeRule,
    stats: {
      attendances,
      elapsedMonths: Number(elapsedMonths.toFixed(1)),
      avgScore: Number(avgScore.toFixed(1)),
    },
    progress: {
      attendance: Math.round(attendProgress),
      time: Math.round(timeProgress),
      evaluation: Math.round(evalProgress),
      total: totalProgress,
    },
    isReady: totalProgress >= 100,
  };
}
