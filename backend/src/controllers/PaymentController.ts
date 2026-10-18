import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/authMiddleware';
import { addInterval, isPaymentOverdue as isOverdue, isBlockable, startOfToday } from '../utils/access';

export class PaymentController {
  static async subscribe(req: AuthRequest, res: Response): Promise<void> {
    const { planId, userId } = req.body;

    try {
      const targetUserId = userId || req.user!.id;

      // Verify plan exists
      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan) {
        res.status(404).json({ error: 'Plano não encontrado' });
        return;
      }

      if (!plan.isActive) {
        res.status(400).json({ error: 'Este plano não está mais disponível' });
        return;
      }

      // Check if user already has an active subscription
      const existingSub = await prisma.subscription.findFirst({
        where: { userId: targetUserId, status: 'ACTIVE' },
      });
      if (existingSub) {
        res.status(409).json({ error: 'Usuário já possui assinatura ativa' });
        return;
      }

      // A 1a cobrança vence hoje; a assinatura guarda o vencimento da cobrança em aberto
      const now = new Date();
      const dueDate = new Date(now);

      const subscription = await prisma.subscription.create({
        data: {
          planId,
          userId: targetUserId,
          status: 'ACTIVE',
          dueDate,
          // 1a cobranca vence hoje
          payments: { create: { amount: plan.price, status: 'PENDING', dueDate: now } },
        },
        include: { plan: true, payments: true },
      });

      res.status(201).json(subscription);
    } catch (error) {
      console.error('[PaymentController.subscribe]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async listUserSubscriptions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const targetUserId = req.query.userId as string || req.user!.id;

      // Only MASTER/ADMIN can view other users' subscriptions
      if (targetUserId !== req.user!.id && !['MASTER', 'ADMIN'].includes(req.user!.role)) {
        res.status(403).json({ error: 'Proibido: Sem permissão para ver assinaturas de outros' });
        return;
      }

      const subscriptions = await prisma.subscription.findMany({
        where: { userId: targetUserId },
        include: {
          plan: true,
          payments: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(subscriptions);
    } catch (error) {
      console.error('[PaymentController.listUserSubscriptions]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async me(req: AuthRequest, res: Response): Promise<void> {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: { userId: req.user!.id, status: { not: 'CANCELED' } },
        include: { plan: { select: { id: true, name: true, price: true, interval: true } } },
        orderBy: { createdAt: 'desc' },
      });
      const payments = subscription
        ? await prisma.payment.findMany({
            where: { subscriptionId: subscription.id },
            orderBy: { dueDate: 'desc' },
          })
        : [];

      res.json({
        subscription: subscription && {
          id: subscription.id,
          status: subscription.status,
          dueDate: subscription.dueDate,
          plan: subscription.plan,
        },
        payments: payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          dueDate: p.dueDate,
          paymentDate: p.paymentDate,
          isOverdue: isOverdue(p.status, p.dueDate),
        })),
      });
    } catch (error) {
      console.error('[PaymentController.me]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async overview(req: AuthRequest, res: Response): Promise<void> {
    try {
      const academyId = req.user!.academyId as string;
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const payWhere = { subscription: { user: { academyId } } };

      const [revenue, pending] = await Promise.all([
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: { ...payWhere, status: 'PAID', paymentDate: { gte: monthStart, lt: monthEnd } },
        }),
        prisma.payment.findMany({
          where: { ...payWhere, status: 'PENDING' },
          include: {
            subscription: {
              include: { user: { select: { id: true, name: true } }, plan: { select: { id: true, name: true } } },
            },
          },
          orderBy: { dueDate: 'asc' },
        }),
      ]);

      const payments = pending.map((p) => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        dueDate: p.dueDate,
        isOverdue: isOverdue(p.status, p.dueDate),
        user: p.subscription.user,
        plan: p.subscription.plan,
      }));
      const overdue = payments.filter((p) => p.isOverdue);

      res.json({
        monthRevenue: revenue._sum.amount ?? 0,
        overdueTotal: overdue.reduce((sum, p) => sum + p.amount, 0),
        overdueCount: overdue.length,
        pendingCount: payments.length,
        payments, // ordenado por vencimento: atrasados primeiro
      });
    } catch (error) {
      console.error('[PaymentController.overview]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async pay(req: AuthRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    try {
      const existing = await prisma.payment.findFirst({
        where: { id, subscription: { user: { academyId: req.user!.academyId as string } } },
        include: { subscription: { include: { plan: true, user: { include: { academy: true } } } } },
      });
      if (!existing) {
        res.status(404).json({ error: 'Pagamento não encontrado' });
        return;
      }
      if (existing.status === 'PAID') {
        res.status(409).json({ error: 'Pagamento já foi quitado' });
        return;
      }

      const sub = existing.subscription;
      const nextDue = addInterval(existing.dueDate, sub.plan.interval);

      const [payment, nextPayment] = await prisma.$transaction(async (tx) => {
        const paid = await tx.payment.update({ where: { id }, data: { status: 'PAID', paymentDate: new Date() } });
        const next = await tx.payment.create({
          data: { subscriptionId: sub.id, amount: sub.plan.price, status: 'PENDING', dueDate: nextDue },
        });
        // Cobranças ainda em aberto (a nova nunca está vencida): atraso = mesmo critério do job
        const blockAfterDays = existing.subscription.user.academy?.blockAfterDays ?? 5;
        const open = await tx.payment.findMany({
          where: { status: 'PENDING', dueDate: { lt: startOfToday() }, subscription: { userId: sub.userId } },
        });
        const blockable = open.some((o) => isBlockable(o.dueDate, blockAfterDays));
        await tx.subscription.update({
          where: { id: sub.id },
          data: { status: open.length > 0 && blockable ? 'OVERDUE' : 'ACTIVE', dueDate: nextDue },
        });
        if (!blockable) await tx.user.update({ where: { id: sub.userId }, data: { isBlocked: false } });
        return [paid, next] as const;
      });

      res.json({ payment, nextPayment });
    } catch (error) {
      console.error('[PaymentController.pay]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
