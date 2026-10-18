import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/authMiddleware';

export class AcademyController {
  static async create(req: AuthRequest, res: Response): Promise<void> {
    const { name, cnpj, phone, address } = req.body;

    try {
      const academy = await prisma.academy.create({
        data: { name, cnpj, phone, address },
      });
      res.status(201).json(academy);
    } catch (error) {
      console.error('[AcademyController.create]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async list(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const academies = await prisma.academy.findMany({
        include: {
          _count: {
            select: { users: true, classes: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(academies);
    } catch (error) {
      console.error('[AcademyController.list]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async getById(req: AuthRequest, res: Response): Promise<void> {
    const id = req.params.id as string;

    try {
      const academy = await prisma.academy.findUnique({
        where: { id },
        include: {
          _count: {
            select: { users: true, classes: true, plans: true },
          },
        },
      });
      if (!academy) {
        res.status(404).json({ error: 'Academia não encontrada' });
        return;
      }
      res.json(academy);
    } catch (error) {
      console.error('[AcademyController.getById]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    const { name, cnpj, phone, address } = req.body;

    try {
      const academy = await prisma.academy.update({
        where: { id },
        data: { name, cnpj, phone, address },
      });
      res.json(academy);
    } catch (error) {
      console.error('[AcademyController.update]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    const id = req.params.id as string;

    try {
      await prisma.academy.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      console.error('[AcademyController.delete]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
