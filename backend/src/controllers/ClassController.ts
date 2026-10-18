import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/authMiddleware';

const flattenTeachers = (c: any) => ({ ...c, teachers: c.teachers.map((t: any) => t.teacher) });

async function findClassInAcademy(classId: string, academyId: string | null) {
  return prisma.class.findFirst({ where: { id: classId, academyId: academyId as string } });
}

export class ClassController {
  static async create(req: AuthRequest, res: Response): Promise<void> {
    const { name, description, dayOfWeek, startTime, endTime, maxStudents } = req.body;

    const academyId = req.user!.academyId as string;

    try {
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
      const { id, role, academyId } = req.user!;
      const mine = req.query.mine === 'true';

      const classes = await prisma.class.findMany({
        where: {
          academyId: academyId as string,
          ...(role === 'ALUNO' ? { students: { some: { studentId: id } } } : {}),
          ...(mine ? { teachers: { some: { teacherId: id } } } : {}),
        },
        include: {
          _count: { select: { students: true, teachers: true } },
          teachers: { select: { teacher: { select: { id: true, name: true } } } },
        },
        orderBy: { name: 'asc' },
      });
      res.json(classes.map(flattenTeachers));
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

  static async getById(req: AuthRequest, res: Response): Promise<void> {
    const classId = req.params.classId as string;
    try {
      const cls = await prisma.class.findFirst({
        where: { id: classId, academyId: req.user!.academyId as string },
        include: {
          teachers: { select: { teacher: { select: { id: true, name: true } } } },
          students: {
            select: { student: { select: { id: true, name: true, beltColor: true, beltDegree: true, isBlocked: true } } },
            orderBy: { student: { name: 'asc' } },
          },
        },
      });
      if (!cls) {
        res.status(404).json({ error: 'Turma não encontrada' });
        return;
      }
      res.json({
        ...cls,
        teachers: cls.teachers.map((t) => t.teacher),
        students: cls.students.map((e) => e.student),
      });
    } catch (error) {
      console.error('[ClassController.getById]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    const classId = req.params.classId as string;
    try {
      if (!(await findClassInAcademy(classId, req.user!.academyId))) {
        res.status(404).json({ error: 'Turma não encontrada' });
        return;
      }
      const { name, description, dayOfWeek, startTime, endTime, maxStudents } = req.body;
      const updated = await prisma.class.update({
        where: { id: classId },
        data: { name, description, dayOfWeek, startTime, endTime, maxStudents },
      });
      res.json(updated);
    } catch (error) {
      console.error('[ClassController.update]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async remove(req: AuthRequest, res: Response): Promise<void> {
    const classId = req.params.classId as string;
    try {
      if (!(await findClassInAcademy(classId, req.user!.academyId))) {
        res.status(404).json({ error: 'Turma não encontrada' });
        return;
      }
      await prisma.$transaction([
        prisma.attendance.deleteMany({ where: { classId } }),
        prisma.enrollment.deleteMany({ where: { classId } }),
        prisma.classTeacher.deleteMany({ where: { classId } }),
        prisma.class.delete({ where: { id: classId } }),
      ]);
      res.status(204).send();
    } catch (error) {
      console.error('[ClassController.remove]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async addTeacher(req: AuthRequest, res: Response): Promise<void> {
    const classId = req.params.classId as string;
    const { teacherId } = req.body;
    try {
      if (!(await findClassInAcademy(classId, req.user!.academyId))) {
        res.status(404).json({ error: 'Turma não encontrada' });
        return;
      }
      const teacher = await prisma.user.findFirst({
        where: { id: teacherId, academyId: req.user!.academyId as string },
      });
      if (!teacher || !['PROFESSOR', 'ADMIN', 'MASTER'].includes(teacher.role)) {
        res.status(404).json({ error: 'Professor não encontrado' });
        return;
      }
      const existing = await prisma.classTeacher.findUnique({ where: { classId_teacherId: { classId, teacherId } } });
      if (existing) {
        res.status(409).json({ error: 'Professor já vinculado a esta turma' });
        return;
      }
      const link = await prisma.classTeacher.create({ data: { classId, teacherId } });
      res.status(201).json(link);
    } catch (error) {
      console.error('[ClassController.addTeacher]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async removeTeacher(req: AuthRequest, res: Response): Promise<void> {
    const classId = req.params.classId as string;
    const teacherId = req.params.teacherId as string;
    try {
      if (!(await findClassInAcademy(classId, req.user!.academyId))) {
        res.status(404).json({ error: 'Turma não encontrada' });
        return;
      }
      await prisma.classTeacher.deleteMany({ where: { classId, teacherId } });
      res.status(204).send();
    } catch (error) {
      console.error('[ClassController.removeTeacher]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async unenrollStudent(req: AuthRequest, res: Response): Promise<void> {
    const classId = req.params.classId as string;
    const studentId = req.params.studentId as string;
    try {
      if (!(await findClassInAcademy(classId, req.user!.academyId))) {
        res.status(404).json({ error: 'Turma não encontrada' });
        return;
      }
      await prisma.enrollment.deleteMany({ where: { classId, studentId } });
      res.status(204).send();
    } catch (error) {
      console.error('[ClassController.unenrollStudent]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
