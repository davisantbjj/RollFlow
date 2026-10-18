import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/authMiddleware';

export class ClassController {
  static async create(req: AuthRequest, res: Response): Promise<void> {
    const { name, description, academyId, dayOfWeek, startTime, endTime, maxStudents } = req.body;

    try {
      if (req.user!.role !== 'MASTER' && req.user!.academyId !== academyId) {
        res.status(403).json({ error: 'Proibido: Não é possível criar turma para outra academia' });
        return;
      }

      const newClass = await prisma.class.create({
        data: { name, description, academyId, dayOfWeek, startTime, endTime, maxStudents },
      });
      res.status(201).json(newClass);
    } catch (error) {
      console.error('[ClassController.create]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { role, academyId } = req.user!;

      if (role === 'MASTER') {
        const classes = await prisma.class.findMany({
          include: {
            academy: true,
            _count: { select: { students: true, teachers: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        res.json(classes);
      } else {
        const classes = await prisma.class.findMany({
          where: { academyId: academyId as string },
          include: {
            _count: { select: { students: true, teachers: true } },
          },
          orderBy: { name: 'asc' },
        });
        res.json(classes);
      }
    } catch (error) {
      console.error('[ClassController.list]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async enrollStudent(req: AuthRequest, res: Response): Promise<void> {
    const classId = req.params.classId as string;
    const { studentId } = req.body;

    try {
      // Verify student exists and has role ALUNO
      const student = await prisma.user.findUnique({ where: { id: studentId } });
      if (!student) {
        res.status(404).json({ error: 'Aluno não encontrado' });
        return;
      }
      if (student.role !== 'ALUNO') {
        res.status(400).json({ error: 'Apenas alunos podem ser matriculados em turmas' });
        return;
      }

      // Check if already enrolled
      const existing = await prisma.enrollment.findUnique({
        where: { classId_studentId: { classId, studentId } },
      });
      if (existing) {
        res.status(409).json({ error: 'Aluno já está matriculado nesta turma' });
        return;
      }

      const enrollment = await prisma.enrollment.create({
        data: { classId, studentId },
      });
      res.status(201).json(enrollment);
    } catch (error) {
      console.error('[ClassController.enrollStudent]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async listEnrolledStudents(req: AuthRequest, res: Response): Promise<void> {
    const classId = req.params.classId as string;

    try {
      const enrollments = await prisma.enrollment.findMany({
        where: { classId },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              beltColor: true,
              beltDegree: true,
              isBlocked: true,
            },
          },
        },
        orderBy: {
          student: { name: 'asc' },
        },
      });

      // Map to return just the students
      const students = enrollments.map(e => e.student);
      res.json(students);
    } catch (error) {
      console.error('[ClassController.listEnrolledStudents]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
