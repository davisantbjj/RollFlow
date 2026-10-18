import { Router } from 'express';
import { EvaluationController } from '../controllers/EvaluationController';
import { authenticate, authorizeRole, academyContext, requireAcademy } from '../middlewares/authMiddleware';
import { validateBody } from '../middlewares/validateBody';
import { createEvaluationSchema } from '../schemas/index';

const router = Router();

router.use(authenticate, academyContext, requireAcademy);

router.post('/', authorizeRole(['MASTER', 'ADMIN', 'PROFESSOR']), validateBody(createEvaluationSchema), EvaluationController.createEvaluation);
router.get('/student/:studentId', authorizeRole(['MASTER', 'ADMIN', 'PROFESSOR', 'ALUNO', 'RESPONSAVEL']), EvaluationController.listStudentEvaluations);

export default router;
