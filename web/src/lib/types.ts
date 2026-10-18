export type Role = 'MASTER' | 'ADMIN' | 'PROFESSOR' | 'ALUNO' | 'RESPONSAVEL';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  academyId: string | null;
  isBlocked?: boolean;
}

export interface AcademyRef { id: string; name: string }

export interface MonthlyPoint { month: string; newStudents: number; attendance: number; revenue: number }

export interface MasterOverview {
  academiesCount: number;
  activeStudents: number;
  teachersCount: number;
  attendanceLast30d: number;
  revenueThisMonth: number;
  overdueCount: number;
  overdueTotal: number;
  monthly: MonthlyPoint[];
}

export interface MasterAcademy {
  id: string;
  name: string;
  cnpj?: string | null;
  createdAt: string;
  phone: string | null;
  address: string | null;
  blockAfterDays?: number;
  owner: { id: string; name: string; email: string } | null;
  activeStudents: number;
  teachersCount: number;
  classesCount: number;
  attendanceLast30d: number;
  revenueThisMonth: number;
  overdueCount: number;
  lastActivityAt: string | null;
  monthly?: MonthlyPoint[];
}

export interface Dashboard {
  activeStudents: number;
  classesCount: number;
  attendanceThisMonth: number;
  monthRevenue: number;
  overdueCount: number;
  overdueTotal: number;
  pendingCount: number;
  monthly?: MonthlyPoint[];
}

export type Interval = 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'YEARLY';

export interface Plan { id: string; name: string; description?: string | null; price: number; interval: Interval; isActive?: boolean }

export interface UserLite {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  beltColor?: string | null;
  beltDegree?: number | null;
  isBlocked?: boolean;
  createdAt?: string;
}

export interface UserDetail extends UserLite {
  academy?: AcademyRef | null;
  dependents?: { id: string; name: string; beltColor: string; beltDegree: number }[];
  subscription?: { id: string; status: string; dueDate: string; plan: Plan } | null;
}

export interface ClassItem {
  id: string;
  name: string;
  description?: string | null;
  dayOfWeek?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  maxStudents?: number | null;
  teachers?: { id: string; name: string }[];
}

export interface ClassDetail extends ClassItem {
  students: { id: string; name: string; beltColor: string; beltDegree: number; isBlocked: boolean }[];
}

export interface PaymentRow {
  id: string;
  amount: number;
  status: string;
  dueDate: string;
  isOverdue: boolean;
  user: { id: string; name: string };
  plan: { id: string; name: string } | null;
}

export interface PaymentsOverview {
  monthRevenue: number;
  overdueTotal: number;
  overdueCount: number;
  pendingCount: number;
  payments: PaymentRow[];
}

export interface Progression {
  currentBelt: string;
  currentDegree: number;
  rule: { minAttendanceCount: number; minMonths: number; minEvaluationScore: number; requiresEvaluation: boolean };
  stats: { attendances: number; elapsedMonths: number; avgScore: number };
  progress: { attendance: number; time: number; evaluation: number; total: number };
  isReady: boolean;
}

export interface Evaluation {
  id: string;
  technique: number;
  discipline: number;
  evolution: number;
  notes?: string | null;
  createdAt: string;
  evaluator?: { id: string; name: string };
}

export interface AttendanceRow {
  id: string;
  date: string;
  present?: boolean;
  student?: { id: string; name: string; beltColor?: string; beltDegree?: number };
}
