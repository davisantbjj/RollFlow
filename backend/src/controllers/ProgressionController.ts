import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/authMiddleware';
import { canViewStudent } from '../utils/access';
import { BeltColor } from '@prisma/client';
import { computeProgression } from '../utils/progression';

export class ProgressionController {
  
  static async getStudentProgress(req: AuthRequest, res: Response): Promise<void> {
    const studentId = req.params.studentId as string;

    try {
      // Access control
      if (!(await canViewStudent(req, studentId))) {
        res.status(403).json({ error: 'Acesso negado' });
        return;
      }

      const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: { id: true, academyId: true, beltColor: true, beltDegree: true, createdAt: true },
      });

      if (!student) {
        res.status(404).json({ error: 'Aluno não encontrado' });
        return;
      }

      // 1. Get last promotion date
      const lastPromotion = await prisma.beltHistory.findFirst({
        where: { studentId },
        orderBy: { promotedAt: 'desc' },
      });

      const referenceDate = lastPromotion ? lastPromotion.promotedAt : student.createdAt;

      // 2. Get progression rule for current belt
      const rule = await prisma.progressionRule.findUnique({
        where: {
          academyId_beltColor: {
            academyId: student.academyId as string,
            beltColor: student.beltColor,
          },
        },
      });

      // 3. Presenças e avaliações desde a data de referência
      const [attendances, evaluations] = await Promise.all([
        prisma.attendance.count({ where: { studentId, createdAt: { gte: referenceDate }, present: true } }),
        prisma.evaluation.findMany({ where: { studentId, createdAt: { gte: referenceDate } } }),
      ]);

      const result = computeProgression({ referenceDate, rule, attendances, evaluations });

      res.json({
        currentBelt: student.beltColor,
        currentDegree: student.beltDegree,
        referenceDate,
        rule: result.rule,
        stats: result.stats,
        progress: result.progress,
        isReady: result.isReady,
      });

    } catch (error) {
      console.error('[ProgressionController.getStudentProgress]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async promoteStudent(req: AuthRequest, res: Response): Promise<void> {
    const { studentId, toBelt, toDegree } = req.body;
    const promoterId = req.user!.id;

    try {
      const student = await prisma.user.findUnique({ where: { id: studentId } });
      if (!student) {
        res.status(404).json({ error: 'Aluno não encontrado' });
        return;
      }

      // Permissions check
      if (req.user!.role !== 'MASTER' && req.user!.role !== 'ADMIN' && req.user!.role !== 'PROFESSOR') {
        res.status(403).json({ error: 'Sem permissão para promover' });
        return;
      }

      if (req.user!.academyId !== student.academyId) {
        res.status(403).json({ error: 'Aluno pertence a outra academia' });
        return;
      }

      // Transaction to update user and create history
      const result = await prisma.$transaction([
        prisma.user.update({
          where: { id: studentId },
          data: { beltColor: toBelt as BeltColor, beltDegree: toDegree },
        }),
        prisma.beltHistory.create({
          data: {
            studentId,
            promotedBy: promoterId,
            fromBelt: student.beltColor,
            fromDegree: student.beltDegree,
            toBelt: toBelt as BeltColor,
            toDegree,
          },
        }),
      ]);

      res.json({ message: 'Promoção realizada com sucesso', user: result[0], history: result[1] });
    } catch (error) {
      console.error('[ProgressionController.promoteStudent]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async upsertRule(req: AuthRequest, res: Response): Promise<void> {
    const { academyId, beltColor, minAttendanceCount, minMonths, minEvaluationScore, requiresEvaluation } = req.body;

    try {
      if (req.user!.academyId !== academyId) {
        res.status(403).json({ error: 'Proibido' });
        return;
      }

      const rule = await prisma.progressionRule.upsert({
        where: {
          academyId_beltColor: { academyId, beltColor },
        },
        update: { minAttendanceCount, minMonths, minEvaluationScore, requiresEvaluation },
        create: { academyId, beltColor, minAttendanceCount, minMonths, minEvaluationScore, requiresEvaluation },
      });

      res.json(rule);
    } catch (error) {
      console.error('[ProgressionController.upsertRule]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
