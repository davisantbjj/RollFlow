import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/authMiddleware';

export class ClassController {
  static async create(req: AuthRequest, res: Response): Promise<void> {
    const { name, description, academyId } = req.body;

    try {
      if (req.user!.role !== 'MASTER' && req.user!.academyId !== academyId) {
        res.status(403).json({ error: 'Forbidden: Cannot create class for another academy' });
        return;
      }

      const newClass = await prisma.class.create({
        data: { name, description, academyId }
      });
      res.status(201).json(newClass);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { role, academyId } = req.user!;
      let classes;

      if (role === 'MASTER') {
        classes = await prisma.class.findMany({ include: { academy: true } });
      } else {
        classes = await prisma.class.findMany({ where: { academyId: academyId as string } });
      }

      res.json(classes);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async enrollStudent(req: AuthRequest, res: Response): Promise<void> {
    const { classId } = req.params;
    const { studentId } = req.body;

    try {
      const enrollment = await prisma.enrollment.create({
        data: { classId, studentId }
      });
      res.status(201).json(enrollment);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
