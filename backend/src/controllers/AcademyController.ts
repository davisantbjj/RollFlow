import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/authMiddleware';

export class AcademyController {
  static async create(req: AuthRequest, res: Response): Promise<void> {
    const { name, cnpj } = req.body;

    try {
      const academy = await prisma.academy.create({
        data: { name, cnpj }
      });
      res.status(201).json(academy);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const academies = await prisma.academy.findMany();
      res.json(academies);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getById(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      const academy = await prisma.academy.findUnique({ where: { id } });
      if (!academy) {
        res.status(404).json({ error: 'Academy not found' });
        return;
      }
      res.json(academy);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { name, cnpj } = req.body;

    try {
      const academy = await prisma.academy.update({
        where: { id },
        data: { name, cnpj }
      });
      res.json(academy);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      await prisma.academy.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
