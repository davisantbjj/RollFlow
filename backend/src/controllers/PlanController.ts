import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/authMiddleware';

export class PlanController {
  static async create(req: AuthRequest, res: Response): Promise<void> {
    const { name, description, price, interval } = req.body;

    const academyId = req.user!.academyId as string;

    try {
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
      const plans = await prisma.plan.findMany({
        where: { academyId: req.user!.academyId as string, isActive: true },
        include: { _count: { select: { subscriptions: true } } },
        orderBy: { price: 'asc' },
      });

      res.json(plans);
    } catch (error) {
      console.error('[PlanController.list]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    try {
      const plan = await prisma.plan.findFirst({ where: { id, academyId: req.user!.academyId as string } });
      if (!plan) {
        res.status(404).json({ error: 'Plano não encontrado' });
        return;
      }
      const { name, description, price, interval } = req.body;
      const updated = await prisma.plan.update({ where: { id }, data: { name, description, price, interval } });
      res.json(updated);
    } catch (error) {
      console.error('[PlanController.update]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async remove(req: AuthRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    try {
      const plan = await prisma.plan.findFirst({ where: { id, academyId: req.user!.academyId as string } });
      if (!plan) {
        res.status(404).json({ error: 'Plano não encontrado' });
        return;
      }
      await prisma.plan.update({ where: { id }, data: { isActive: false } });
      res.status(204).send();
    } catch (error) {
      console.error('[PlanController.remove]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
