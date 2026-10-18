import { Router } from 'express';
import { EvaluationController } from '../controllers/EvaluationController';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware';
import { validateBody } from '../middlewares/validateBody';
import { createEvaluationSchema } from '../schemas/index';

const router = Router();

router.use(authenticate);

router.post('/', authorizeRole(['MASTER', 'ADMIN', 'PROFESSOR']), validateBody(createEvaluationSchema), EvaluationController.createEvaluation);
router.get('/student/:studentId', authorizeRole(['MASTER', 'ADMIN', 'PROFESSOR', 'ALUNO', 'RESPONSAVEL']), EvaluationController.listStudentEvaluations);

export default router;
