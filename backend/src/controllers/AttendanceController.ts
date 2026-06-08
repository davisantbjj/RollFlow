import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/authMiddleware';

export class AttendanceController {
  static async checkIn(req: AuthRequest, res: Response): Promise<void> {
    const { classId, studentId } = req.body;

    try {
      const targetStudentId = studentId || req.user!.id;

      // Lógica de bloqueio por inadimplência
      const overdueSub = await prisma.subscription.findFirst({
        where: {
          userId: targetStudentId,
          status: 'OVERDUE'
        }
      });

      if (overdueSub) {
        res.status(403).json({ error: 'Acesso bloqueado: Aluno possui mensalidade em atraso.' });
        return;
      }

      const attendance = await prisma.attendance.create({
        data: {
          classId,
          studentId: targetStudentId,
          date: new Date()
        }
      });
      res.status(201).json(attendance);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async listByClass(req: AuthRequest, res: Response): Promise<void> {
    const { classId } = req.params;

    try {
      const attendances = await prisma.attendance.findMany({
        where: { classId },
        include: { student: true }
      });
      res.json(attendances);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
