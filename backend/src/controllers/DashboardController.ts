import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/authMiddleware';
import { startOfToday } from '../utils/access';
import { computeProgression } from '../utils/progression';

const DAY = 24 * 60 * 60 * 1000;
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const studentSelect = { id: true, name: true, beltColor: true, beltDegree: true } as const;
const LIMIT = 10;

/** Compara números deixando os null no fim. */
const nullsLast = (a: number | null, b: number | null, desc = false) =>
  a === null ? (b === null ? 0 : 1) : b === null ? -1 : desc ? b - a : a - b;


export class DashboardController {
  static async get(req: AuthRequest, res: Response): Promise<void> {
    try {
      const academyId = req.user!.academyId as string;
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const payWhere = { subscription: { user: { academyId } } };

      const [activeStudents, classesCount, attendanceThisMonth, revenue, overdue, pendingCount] = await Promise.all([
        prisma.user.count({ where: { academyId, role: 'ALUNO', isBlocked: false } }),
        prisma.class.count({ where: { academyId } }),
        prisma.attendance.count({ where: { class: { academyId }, date: { gte: monthStart, lt: monthEnd } } }),
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: { ...payWhere, status: 'PAID', paymentDate: { gte: monthStart, lt: monthEnd } },
        }),
        prisma.payment.aggregate({
          _sum: { amount: true },
          _count: true,
          where: { ...payWhere, status: 'PENDING', dueDate: { lt: startOfToday() } },
        }),
        prisma.payment.count({ where: { ...payWhere, status: 'PENDING' } }),
      ]);

      res.json({
        activeStudents,
        classesCount,
        attendanceThisMonth,
        monthRevenue: revenue._sum.amount ?? 0,
        overdueCount: overdue._count,
        overdueTotal: overdue._sum.amount ?? 0,
        pendingCount,
      });
    } catch (error) {
      console.error('[DashboardController.get]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async analytics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const academyId = req.user!.academyId as string;
      const now = new Date();
      const today = startOfToday();
      const d30 = new Date(now.getTime() - 30 * DAY);
      const d60 = new Date(now.getTime() - 60 * DAY);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const months = Array.from({ length: 6 }, (_, i) => monthKey(new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)));

      // Tudo da academia carregado de uma vez; o cálculo por aluno é feito em memória
      const [students, classes, attendances, evaluations, beltHistory, rules, payments, activeSubs] = await Promise.all([
        prisma.user.findMany({
          where: { academyId, role: 'ALUNO' },
          select: { ...studentSelect, isBlocked: true, createdAt: true },
        }),
        prisma.class.findMany({
          where: { academyId },
          select: {
            id: true, name: true, dayOfWeek: true, startTime: true, maxStudents: true,
            _count: { select: { students: true } },
            teachers: { select: { teacher: { select: { id: true, name: true } } } },
          },
          orderBy: { name: 'asc' },
        }),
        prisma.attendance.findMany({
          where: { present: true, class: { academyId } },
          select: { studentId: true, classId: true, date: true, createdAt: true },
        }),
        prisma.evaluation.findMany({
          where: { student: { academyId } },
          select: { studentId: true, technique: true, discipline: true, evolution: true, createdAt: true },
        }),
        prisma.beltHistory.findMany({
          where: { student: { academyId } },
          select: { studentId: true, promotedAt: true },
          orderBy: { promotedAt: 'desc' },
        }),
        prisma.progressionRule.findMany({ where: { academyId } }),
        prisma.payment.findMany({
          where: {
            subscription: { user: { academyId } },
            OR: [
              { status: 'PENDING', dueDate: { lt: monthEnd } },
              { status: 'PAID', paymentDate: { gte: sixMonthsAgo } },
              { dueDate: { gte: monthStart, lt: monthEnd } },
            ],
          },
          select: {
            id: true, amount: true, status: true, dueDate: true, paymentDate: true,
            subscription: { select: { user: { select: { ...studentSelect, isBlocked: true } } } },
          },
        }),
        prisma.subscription.findMany({
          where: { status: { in: ['ACTIVE', 'OVERDUE'] }, user: { academyId } },
          select: { userId: true },
        }),
      ]);

      const group = <T extends { studentId: string }>(rows: T[]) => {
        const m = new Map<string, T[]>();
        for (const r of rows) {
          const list = m.get(r.studentId);
          if (list) list.push(r);
          else m.set(r.studentId, [r]);
        }
        return m;
      };
      const attByStudent = group(attendances);
      const evalByStudent = group(evaluations);
      const lastPromotion = new Map<string, Date>();
      beltHistory.forEach((h) => {
        if (!lastPromotion.has(h.studentId)) lastPromotion.set(h.studentId, h.promotedAt);
      });
      const ruleByBelt = new Map(rules.map((r) => [r.beltColor, r]));
      const brief = (u: { id: string; name: string; beltColor: any; beltDegree: number }) => ({
        id: u.id, name: u.name, beltColor: u.beltColor, beltDegree: u.beltDegree,
      });

      const active = students.filter((s) => !s.isBlocked);
      const daysSince = (d: Date) => Math.floor((now.getTime() - d.getTime()) / DAY);

      const atRiskAll: any[] = [];
      const lowAttendanceAll: any[] = [];
      const noEvalAll: any[] = [];
      const progressAll: { student: ReturnType<typeof brief>; result: ReturnType<typeof computeProgression> }[] = [];

      for (const s of students) {
        const att = attByStudent.get(s.id) ?? [];
        const evs = evalByStudent.get(s.id) ?? [];
        const referenceDate = lastPromotion.get(s.id) ?? s.createdAt;
        progressAll.push({
          student: brief(s),
          result: computeProgression({
            referenceDate,
            rule: ruleByBelt.get(s.beltColor),
            attendances: att.filter((a) => a.createdAt >= referenceDate).length,
            evaluations: evs.filter((e) => e.createdAt >= referenceDate),
            now,
          }),
        });
        if (s.isBlocked) continue;

        const last = att.reduce<Date | null>((m, a) => (!m || a.date > m ? a.date : m), null);
        const days = last ? daysSince(last) : null;
        if (days === null || days >= 14) {
          atRiskAll.push({ student: brief(s), lastAttendanceAt: last, daysSinceLastAttendance: days });
        }

        const att30 = att.filter((a) => a.date >= d30).length;
        const prev30 = att.filter((a) => a.date >= d60 && a.date < d30).length;
        lowAttendanceAll.push({ student: brief(s), attendanceLast30d: att30, attendancePrev30d: prev30 });

        const lastEval = evs.reduce<Date | null>((m, e) => (!m || e.createdAt > m ? e.createdAt : m), null);
        const evalDays = lastEval ? daysSince(lastEval) : null;
        if (evalDays === null || evalDays >= 60) {
          noEvalAll.push({ student: brief(s), lastEvaluationAt: lastEval, daysSinceEvaluation: evalDays });
        }
      }

      atRiskAll.sort((a, b) => nullsLast(a.daysSinceLastAttendance, b.daysSinceLastAttendance, true));
      noEvalAll.sort((a, b) => nullsLast(a.daysSinceEvaluation, b.daysSinceEvaluation, true));
      lowAttendanceAll.sort(
        (a, b) =>
          a.attendanceLast30d - b.attendanceLast30d ||
          b.attendancePrev30d - b.attendanceLast30d - (a.attendancePrev30d - a.attendanceLast30d)
      );
      const ready = progressAll.filter((p) => p.result.isReady);
      const lowProgress = progressAll
        .filter((p) => !p.result.isReady)
        .sort((a, b) => a.result.progress.total - b.result.progress.total);

      const monthly = months.map((month) => ({ month, newStudents: 0, attendance: 0, revenue: 0 }));
      const slot = (d: Date) => monthly.find((m) => m.month === monthKey(d));
      students.forEach((s) => {
        if (s.createdAt < sixMonthsAgo) return;
        const b = slot(s.createdAt);
        if (b) b.newStudents++;
      });
      let attendanceLast30d = 0;
      attendances.forEach((a) => {
        if (a.date >= d30) attendanceLast30d++;
        if (a.date < sixMonthsAgo) return;
        const b = slot(a.date);
        if (b) b.attendance++;
      });

      let revenueThisMonth = 0;
      let expectedRevenueThisMonth = 0;
      let overdueTotal = 0;
      const overdue: any[] = [];
      const overdueUsers = new Set<string>();
      payments.forEach((p) => {
        if (p.status === 'PAID' && p.paymentDate) {
          const b = slot(p.paymentDate);
          if (b) b.revenue += p.amount;
          if (p.paymentDate >= monthStart && p.paymentDate < monthEnd) revenueThisMonth += p.amount;
        }
        if ((p.status === 'PAID' || p.status === 'PENDING') && p.dueDate >= monthStart && p.dueDate < monthEnd) {
          expectedRevenueThisMonth += p.amount;
        }
        if (p.status === 'PENDING' && p.dueDate < today) {
          const u = p.subscription.user;
          overdueTotal += p.amount;
          overdueUsers.add(u.id);
          overdue.push({
            student: brief(u), paymentId: p.id, amount: p.amount, dueDate: p.dueDate,
            daysLate: Math.max(1, daysSince(p.dueDate)), isBlocked: u.isBlocked,
          });
        }
      });
      overdue.sort((a, b) => b.daysLate - a.daysLate);
      const subscribers = new Set(activeSubs.map((s) => s.userId));
      overdueUsers.forEach((id) => subscribers.add(id));

      const attByClass = new Map<string, number>();
      attendances.forEach((a) => {
        if (a.date >= d30) attByClass.set(a.classId, (attByClass.get(a.classId) ?? 0) + 1);
      });

      res.json({
        summary: {
          activeStudents: active.length,
          newStudentsThisMonth: students.filter((s) => s.createdAt >= monthStart && s.createdAt < monthEnd).length,
          attendanceLast30d,
          avgAttendancePerStudent30d: active.length ? Number((attendanceLast30d / active.length).toFixed(1)) : 0,
          revenueThisMonth,
          expectedRevenueThisMonth,
          overdueCount: overdue.length,
          overdueTotal,
          delinquencyRate: subscribers.size ? Number((overdueUsers.size / subscribers.size).toFixed(2)) : 0,
          readyToPromoteCount: ready.length,
          atRiskCount: atRiskAll.length,
        },
        monthly,
        atRisk: atRiskAll.slice(0, LIMIT),
        lowAttendance: lowAttendanceAll.slice(0, LIMIT),
        lowProgress: lowProgress.slice(0, LIMIT).map((p) => ({
          student: p.student,
          progress: p.result.progress.total,
          attendance: p.result.progress.attendance,
          time: p.result.progress.time,
          evaluation: p.result.progress.evaluation,
        })),
        readyToPromote: ready.slice(0, LIMIT).map((p) => ({ student: p.student, progress: p.result.progress.total })),
        overdue: overdue.slice(0, LIMIT),
        classes: classes.map((c) => ({
          id: c.id, name: c.name, dayOfWeek: c.dayOfWeek, startTime: c.startTime,
          enrolled: c._count.students,
          maxStudents: c.maxStudents,
          occupancy: c.maxStudents ? Number((c._count.students / c.maxStudents).toFixed(2)) : null,
          attendanceLast30d: attByClass.get(c.id) ?? 0,
          teachers: c.teachers.map((t) => t.teacher),
        })),
        noRecentEvaluation: noEvalAll.slice(0, LIMIT),
      });
    } catch (error) {
      console.error('[DashboardController.analytics]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
