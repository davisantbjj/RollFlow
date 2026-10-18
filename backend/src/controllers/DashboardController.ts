import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/authMiddleware';
import { startOfToday } from '../utils/access';

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
}
