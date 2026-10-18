import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/authMiddleware';
import { canViewStudent } from '../utils/access';
import { BeltColor } from '@prisma/client';

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

      // Se não houver regra específica da academia, usa padrão BJJ adulto (apenas para exemplo, ideal é configurar)
      const defaultRule = {
        minAttendanceCount: 100,
        minMonths: 12,
        minEvaluationScore: 3.0,
        requiresEvaluation: true,
      };

      const activeRule = rule || defaultRule;

      // 3. Count attendances since reference date
      const attendances = await prisma.attendance.count({
        where: {
          studentId,
          createdAt: { gte: referenceDate },
          present: true,
        },
      });

      // 4. Calculate months elapsed
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - referenceDate.getTime());
      const elapsedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const elapsedMonths = elapsedDays / 30.44; // average days in month

      // 5. Get average evaluation score
      const evaluations = await prisma.evaluation.findMany({
        where: {
          studentId,
          createdAt: { gte: referenceDate },
        },
      });

      let avgScore = 0;
      if (evaluations.length > 0) {
        const totalScore = evaluations.reduce((acc, curr) => acc + curr.technique + curr.discipline + curr.evolution, 0);
        avgScore = totalScore / (evaluations.length * 3); // 3 criteria per evaluation
      }

      // 6. Calculate percentages
      const ratio = (value: number, min: number) => (min > 0 ? Math.min(100, (value / min) * 100) : 100);
      const attendProgress = ratio(attendances, activeRule.minAttendanceCount);
      const timeProgress = ratio(elapsedMonths, activeRule.minMonths);
      
      let evalProgress = 100;
      if (activeRule.requiresEvaluation) {
        evalProgress = ratio(avgScore, activeRule.minEvaluationScore);
      }

      const totalProgress = Math.round((attendProgress + timeProgress + evalProgress) / 3);

      res.json({
        currentBelt: student.beltColor,
        currentDegree: student.beltDegree,
        referenceDate,
        rule: activeRule,
        stats: {
          attendances,
          elapsedMonths: Number(elapsedMonths.toFixed(1)),
          avgScore: Number(avgScore.toFixed(1)),
        },
        progress: {
          attendance: Math.round(attendProgress),
          time: Math.round(timeProgress),
          evaluation: Math.round(evalProgress),
          total: totalProgress,
        },
        isReady: totalProgress >= 100,
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

      if (req.user!.role !== 'MASTER' && req.user!.academyId !== student.academyId) {
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
      if (req.user!.role !== 'MASTER' && req.user!.academyId !== academyId) {
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
