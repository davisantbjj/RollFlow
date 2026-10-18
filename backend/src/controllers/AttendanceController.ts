import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/authMiddleware';
import { canViewStudent } from '../utils/access';

export class AttendanceController {
  static async checkIn(req: AuthRequest, res: Response): Promise<void> {
    const { classId, studentId } = req.body;

    try {
      const targetStudentId: string = studentId || req.user!.id;

      // Check if student is blocked
      const student = await prisma.user.findUnique({ where: { id: targetStudentId } });
      if (!student) {
        res.status(404).json({ error: 'Aluno não encontrado' });
        return;
      }

      if (student.isBlocked) {
        res.status(403).json({ error: 'Acesso bloqueado: Aluno possui pendência financeira.' });
        return;
      }

      // Check for overdue subscription (additional check)
      const overdueSub = await prisma.subscription.findFirst({
        where: {
          userId: targetStudentId,
          status: 'OVERDUE',
        },
      });

      if (overdueSub) {
        res.status(403).json({ error: 'Acesso bloqueado: Aluno possui mensalidade em atraso.' });
        return;
      }

      // Verify enrollment
      const enrollment = await prisma.enrollment.findUnique({
        where: { classId_studentId: { classId, studentId: targetStudentId } },
      });
      if (!enrollment) {
        res.status(400).json({ error: 'Aluno não está matriculado nesta turma' });
        return;
      }

      // Uma presença por aluno/turma/dia
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const already = await prisma.attendance.findFirst({
        where: { classId, studentId: targetStudentId, date: { gte: dayStart, lt: dayEnd } },
      });
      if (already) {
        res.status(409).json({ error: 'Presença já registrada hoje' });
        return;
      }

      const attendance = await prisma.attendance.create({
        data: {
          classId,
          studentId: targetStudentId,
        },
      });
      res.status(201).json(attendance);
    } catch (error) {
      console.error('[AttendanceController.checkIn]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async listByClass(req: AuthRequest, res: Response): Promise<void> {
    const classId = req.params.classId as string;

    try {
      const attendances = await prisma.attendance.findMany({
        where: { classId },
        include: {
          student: {
            select: { id: true, name: true, email: true, beltColor: true, beltDegree: true },
          },
        },
        orderBy: { date: 'desc' },
      });
      res.json(attendances);
    } catch (error) {
      console.error('[AttendanceController.listByClass]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Get attendance history for the current user or a specific student.
   */
  static async getStudentHistory(req: AuthRequest, res: Response): Promise<void> {
    const studentId: string = (req.params.studentId as string) || req.user!.id;

    try {
      if (!(await canViewStudent(req, studentId))) {
        res.status(403).json({ error: 'Acesso negado' });
        return;
      }
      const attendances = await prisma.attendance.findMany({
        where: { studentId },
        include: {
          class: { select: { id: true, name: true, dayOfWeek: true, startTime: true } },
        },
        orderBy: { date: 'desc' },
        take: 50,
      });

      // Calculate frequency
      const totalClasses = attendances.length;
      const thisMonth = attendances.filter((a) => {
        const now = new Date();
        return a.date.getMonth() === now.getMonth() && a.date.getFullYear() === now.getFullYear();
      }).length;

      res.json({
        attendances,
        stats: {
          totalClasses,
          thisMonth,
        },
      });
    } catch (error) {
      console.error('[AttendanceController.getStudentHistory]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
