import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/authMiddleware';

export class PaymentController {
  static async subscribe(req: AuthRequest, res: Response): Promise<void> {
    const { planId, userId } = req.body;

    try {
      const subscription = await prisma.subscription.create({
        data: {
          planId,
          userId: userId || req.user!.id,
          status: 'ACTIVE',
          dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // Vencimento próximo mês
        }
      });
      res.status(201).json(subscription);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async listUserSubscriptions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const subscriptions = await prisma.subscription.findMany({
        where: { userId: req.user!.id },
        include: { plan: true, payments: true }
      });
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
