import { Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/authMiddleware';
import { startOfToday } from '../utils/access';

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

/** Últimos 6 meses (mais antigo primeiro), com início do primeiro mês. */
function lastSixMonths() {
  const now = new Date();
  const keys: string[] = [];
  for (let i = 5; i >= 0; i--) keys.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  return { keys, from: new Date(now.getFullYear(), now.getMonth() - 5, 1) };
}

type Monthly = { month: string; newStudents: number; attendance: number; revenue: number };

interface AcademyMetrics {
  activeStudents: number;
  teachersCount: number;
  classesCount: number;
  attendanceLast30d: number;
  revenueThisMonth: number;
  overdueCount: number;
  overdueTotal: number;
  lastActivityAt: Date | null;
  monthly: Monthly[];
}

/**
 * Carrega com poucas queries (uma por entidade, sem N+1) os dados de todas as academias
 * (ou só das informadas) e agrega em memória as métricas por academia.
 */
async function computeMetrics(academyIds?: string[]): Promise<(id: string) => AcademyMetrics> {
  const { keys, from } = lastSixMonths();
  const today = startOfToday();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const currentMonth = monthKey(now);
  const academyFilter = academyIds ? { in: academyIds } : { not: null };

  const classes = await prisma.class.findMany({
    where: academyIds ? { academyId: { in: academyIds } } : {},
    select: { id: true, academyId: true },
  });
  const classToAcademy = new Map(classes.map((c) => [c.id, c.academyId]));
  const classIds = classes.map((c) => c.id);

  const [activeByAcademy, teachersByAcademy, classesByAcademy, students, attendances, lastByClass, paid, overdue] =
    await Promise.all([
      prisma.user.groupBy({ by: ['academyId'], where: { academyId: academyFilter, role: 'ALUNO', isBlocked: false }, _count: { _all: true } }),
      prisma.user.groupBy({ by: ['academyId'], where: { academyId: academyFilter, role: 'PROFESSOR' }, _count: { _all: true } }),
      prisma.class.groupBy({ by: ['academyId'], where: academyIds ? { academyId: { in: academyIds } } : {}, _count: { _all: true } }),
      prisma.user.findMany({
        where: { academyId: academyFilter, role: 'ALUNO', createdAt: { gte: from } },
        select: { academyId: true, createdAt: true },
      }),
      prisma.attendance.findMany({
        where: { classId: { in: classIds }, present: true, date: { gte: from } },
        select: { classId: true, date: true },
      }),
      prisma.attendance.groupBy({ by: ['classId'], where: { classId: { in: classIds } }, _max: { date: true } }),
      prisma.payment.findMany({
        where: { status: 'PAID', paymentDate: { gte: from }, subscription: { user: { academyId: academyFilter } } },
        select: { amount: true, paymentDate: true, subscription: { select: { user: { select: { academyId: true } } } } },
      }),
      prisma.payment.findMany({
        where: { status: 'PENDING', dueDate: { lt: today }, subscription: { user: { academyId: academyFilter } } },
        select: { amount: true, subscription: { select: { user: { select: { academyId: true } } } } },
      }),
    ]);

  const perAcademy = new Map<string, AcademyMetrics>();
  const get = (id: string): AcademyMetrics => {
    let m = perAcademy.get(id);
    if (!m) {
      m = {
        activeStudents: 0, teachersCount: 0, classesCount: 0, attendanceLast30d: 0, revenueThisMonth: 0,
        overdueCount: 0, overdueTotal: 0, lastActivityAt: null,
        monthly: keys.map((month) => ({ month, newStudents: 0, attendance: 0, revenue: 0 })),
      };
      perAcademy.set(id, m);
    }
    return m;
  };
  const bucket = (m: AcademyMetrics, d: Date) => m.monthly.find((x) => x.month === monthKey(d));

  activeByAcademy.forEach((r) => r.academyId && (get(r.academyId).activeStudents = r._count._all));
  teachersByAcademy.forEach((r) => r.academyId && (get(r.academyId).teachersCount = r._count._all));
  classesByAcademy.forEach((r) => (get(r.academyId).classesCount = r._count._all));
  students.forEach((s) => {
    const b = s.academyId && bucket(get(s.academyId), s.createdAt);
    if (b) b.newStudents++;
  });
  attendances.forEach((a) => {
    const academyId = classToAcademy.get(a.classId);
    if (!academyId) return;
    const m = get(academyId);
    const b = bucket(m, a.date);
    if (b) b.attendance++;
    if (a.date >= thirtyDaysAgo) m.attendanceLast30d++;
  });
  lastByClass.forEach((r) => {
    const academyId = classToAcademy.get(r.classId);
    const d = r._max.date;
    if (!academyId || !d) return;
    const m = get(academyId);
    if (!m.lastActivityAt || d > m.lastActivityAt) m.lastActivityAt = d;
  });
  paid.forEach((p) => {
    const academyId = p.subscription.user.academyId;
    if (!academyId || !p.paymentDate) return;
    const m = get(academyId);
    const b = bucket(m, p.paymentDate);
    if (b) b.revenue += p.amount;
    if (monthKey(p.paymentDate) === currentMonth) m.revenueThisMonth += p.amount;
  });
  overdue.forEach((p) => {
    const academyId = p.subscription.user.academyId;
    if (!academyId) return;
    const m = get(academyId);
    m.overdueCount++;
    m.overdueTotal += p.amount;
  });

  return get;
}

async function loadAcademies(ids?: string[]) {
  const academies = await prisma.academy.findMany({
    where: ids ? { id: { in: ids } } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      users: { where: { role: 'ADMIN' }, select: { id: true, name: true, email: true }, orderBy: { createdAt: 'asc' }, take: 1 },
    },
  });
  const get = await computeMetrics(academies.map((a) => a.id));
  return academies.map((a) => ({
    id: a.id,
    name: a.name,
    createdAt: a.createdAt,
    phone: a.phone,
    address: a.address,
    cnpj: a.cnpj,
    blockAfterDays: a.blockAfterDays,
    owner: a.users[0] ?? null,
    ...get(a.id),
  }));
}

export class MasterController {
  static async overview(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const academies = await loadAcademies();
      const sum = (f: (a: (typeof academies)[number]) => number) => academies.reduce((s, a) => s + f(a), 0);
      const monthly = lastSixMonths().keys.map((month, i) => ({
        month,
        newStudents: sum((a) => a.monthly[i]!.newStudents),
        attendance: sum((a) => a.monthly[i]!.attendance),
        revenue: sum((a) => a.monthly[i]!.revenue),
      }));

      res.json({
        academiesCount: academies.length,
        activeStudents: sum((a) => a.activeStudents),
        teachersCount: sum((a) => a.teachersCount),
        attendanceLast30d: sum((a) => a.attendanceLast30d),
        revenueThisMonth: sum((a) => a.revenueThisMonth),
        overdueCount: sum((a) => a.overdueCount),
        overdueTotal: sum((a) => a.overdueTotal),
        monthly,
      });
    } catch (error) {
      console.error('[MasterController.overview]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async listAcademies(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const academies = await loadAcademies();
      res.json(academies.map(({ monthly, overdueTotal, ...rest }) => rest));
    } catch (error) {
      console.error('[MasterController.listAcademies]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async getAcademy(req: AuthRequest, res: Response): Promise<void> {
    try {
      const [academy] = await loadAcademies([req.params.id as string]);
      if (!academy) {
        res.status(404).json({ error: 'Academia não encontrada' });
        return;
      }
      res.json(academy);
    } catch (error) {
      console.error('[MasterController.getAcademy]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async createAcademy(req: AuthRequest, res: Response): Promise<void> {
    const { name, cnpj, phone, address, owner } = req.body;
    try {
      if (await prisma.user.findUnique({ where: { email: owner.email } })) {
        res.status(409).json({ error: 'E-mail já cadastrado' });
        return;
      }
      const password = await bcrypt.hash(owner.password, 10);
      const result = await prisma.$transaction(async (tx) => {
        const academy = await tx.academy.create({ data: { name, cnpj, phone, address } });
        const user = await tx.user.create({
          data: { name: owner.name, email: owner.email, phone: owner.phone, password, role: 'ADMIN', academyId: academy.id },
          select: { id: true, name: true, email: true, role: true, phone: true, academyId: true, createdAt: true },
        });
        return { academy, owner: user };
      });
      res.status(201).json(result);
    } catch (error) {
      console.error('[MasterController.createAcademy]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async updateAcademy(req: AuthRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    const { name, cnpj, phone, address, blockAfterDays } = req.body;
    try {
      if (!(await prisma.academy.findUnique({ where: { id }, select: { id: true } }))) {
        res.status(404).json({ error: 'Academia não encontrada' });
        return;
      }
      const academy = await prisma.academy.update({ where: { id }, data: { name, cnpj, phone, address, blockAfterDays } });
      res.json(academy);
    } catch (error) {
      console.error('[MasterController.updateAcademy]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
