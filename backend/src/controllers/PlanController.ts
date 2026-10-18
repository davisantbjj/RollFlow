import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/authMiddleware';

export class PlanController {
  static async create(req: AuthRequest, res: Response): Promise<void> {
    const { name, description, price, interval, academyId } = req.body;

    try {
      if (req.user!.role !== 'MASTER' && req.user!.academyId !== academyId) {
        res.status(403).json({ error: 'Proibido: Não pode criar plano para outra academia' });
        return;
      }

      const plan = await prisma.plan.create({
        data: { name, description, price, interval, academyId },
      });
      res.status(201).json(plan);
    } catch (error) {
      console.error('[PlanController.create]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { role, academyId } = req.user!;
      let plans;

      if (role === 'MASTER') {
        plans = await prisma.plan.findMany({
          include: {
            academy: { select: { id: true, name: true } },
            _count: { select: { subscriptions: true } },
          },
          orderBy: { price: 'asc' },
        });
      } else {
        plans = await prisma.plan.findMany({
          where: { academyId: academyId as string, isActive: true },
          include: {
            _count: { select: { subscriptions: true } },
          },
          orderBy: { price: 'asc' },
        });
      }

      res.json(plans);
    } catch (error) {
      console.error('[PlanController.list]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
