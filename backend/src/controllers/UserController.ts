import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/authMiddleware';

export class UserController {
  static async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { role, academyId } = req.user!;
      const { search, filterRole } = req.query;

      const where: any = {};

      // Multi-tenant isolation
      if (role !== 'MASTER') {
        where.academyId = academyId;
      }

      // Search filter
      if (search && typeof search === 'string') {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Role filter
      if (filterRole && typeof filterRole === 'string') {
        where.role = filterRole;
      }

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          beltColor: true,
          beltDegree: true,
          isBlocked: true,
          academyId: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
      });

      res.json(users);
    } catch (error) {
      console.error('[UserController.list]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          beltColor: true,
          beltDegree: true,
          isBlocked: true,
          academyId: true,
          academy: { select: { id: true, name: true } },
          createdAt: true,
        },
      });

      if (!user) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }
      res.json(user);
    } catch (error) {
      console.error('[UserController.getProfile]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
