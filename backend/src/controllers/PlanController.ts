import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/authMiddleware';

export class PlanController {
  static async create(req: AuthRequest, res: Response): Promise<void> {
    const { name, description, price, interval, academyId } = req.body;

    try {
      if (req.user!.role !== 'MASTER' && req.user!.academyId !== academyId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const plan = await prisma.plan.create({
        data: { name, description, price, interval, academyId }
      });
      res.status(201).json(plan);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { role, academyId } = req.user!;
      let plans;

      if (role === 'MASTER') {
        plans = await prisma.plan.findMany();
      } else {
        plans = await prisma.plan.findMany({ where: { academyId: academyId as string } });
      }

      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
