import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/authMiddleware';
import { canViewStudent } from '../utils/access';

export class EvaluationController {
  static async createEvaluation(req: AuthRequest, res: Response): Promise<void> {
    const { studentId, technique, discipline, evolution, notes } = req.body;
    const evaluatorId = req.user!.id;

    try {
      // Check if student exists
      const student = await prisma.user.findUnique({ where: { id: studentId } });
      if (!student || student.role !== 'ALUNO') {
        res.status(404).json({ error: 'Aluno não encontrado' });
        return;
      }

      // Check permissions: only MASTER, ADMIN or PROFESSOR from the same academy can evaluate
      if (req.user!.academyId !== student.academyId) {
        res.status(403).json({ error: 'Proibido: Aluno pertence a outra academia' });
        return;
      }

      const evaluation = await prisma.evaluation.create({
        data: {
          evaluatorId,
          studentId,
          technique,
          discipline,
          evolution,
          notes,
        },
      });

      res.status(201).json(evaluation);
    } catch (error) {
      console.error('[EvaluationController.createEvaluation]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async listStudentEvaluations(req: AuthRequest, res: Response): Promise<void> {
    const studentId = req.params.studentId as string;

    try {
      // Access control: only MASTER, ADMIN, PROFESSOR or the student himself can view
      if (!(await canViewStudent(req, studentId))) {
        res.status(403).json({ error: 'Acesso negado' });
        return;
      }

      const evaluations = await prisma.evaluation.findMany({
        where: { studentId },
        include: {
          evaluator: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(evaluations);
    } catch (error) {
      console.error('[EvaluationController.listStudentEvaluations]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
