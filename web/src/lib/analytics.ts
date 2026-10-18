import type { MonthlyPoint } from './types';

export interface StudentRef { id: string; name: string; beltColor: string; beltDegree: number }

export interface Analytics {
  summary: {
    activeStudents: number; newStudentsThisMonth: number; attendanceLast30d: number; avgAttendancePerStudent30d: number;
    revenueThisMonth: number; expectedRevenueThisMonth: number; overdueCount: number; overdueTotal: number;
    delinquencyRate: number; readyToPromoteCount: number; atRiskCount: number;
  };
  monthly: MonthlyPoint[];
  atRisk: { student: StudentRef; lastAttendanceAt: string | null; daysSinceLastAttendance: number | null }[];
  lowAttendance: { student: StudentRef; attendanceLast30d: number; attendancePrev30d: number }[];
  lowProgress: { student: StudentRef; progress: number; attendance: number; time: number; evaluation: number }[];
  readyToPromote: { student: StudentRef; progress: number }[];
  overdue: { student: StudentRef; paymentId: string; amount: number; dueDate: string; daysLate: number; isBlocked: boolean }[];
  classes: { id: string; name: string; dayOfWeek: string | null; startTime: string | null; enrolled: number; maxStudents: number | null; occupancy: number | null; attendanceLast30d: number; teachers: { id: string; name: string }[] }[];
  noRecentEvaluation: { student: StudentRef; lastEvaluationAt: string | null; daysSinceEvaluation: number | null }[];
}
