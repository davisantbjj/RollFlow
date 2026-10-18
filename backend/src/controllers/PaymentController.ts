import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/authMiddleware';

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

      // Calculate due date based on plan interval
      const now = new Date();
      const dueDate = new Date(now);
      switch (plan.interval) {
        case 'MONTHLY':
          dueDate.setMonth(dueDate.getMonth() + 1);
          break;
        case 'QUARTERLY':
          dueDate.setMonth(dueDate.getMonth() + 3);
          break;
        case 'SEMIANNUAL':
          dueDate.setMonth(dueDate.getMonth() + 6);
          break;
        case 'YEARLY':
          dueDate.setFullYear(dueDate.getFullYear() + 1);
          break;
      }

      const subscription = await prisma.subscription.create({
        data: {
          planId,
          userId: targetUserId,
          status: 'ACTIVE',
          dueDate,
        },
        include: { plan: true },
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
}
