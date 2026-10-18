import { Router } from 'express';
import { PlanController } from '../controllers/PlanController';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware';
import { validateBody } from '../middlewares/validateBody';
import { createPlanSchema } from '../schemas/index';

const router = Router();

router.use(authenticate);

router.post('/', authorizeRole(['MASTER', 'ADMIN']), validateBody(createPlanSchema), PlanController.create);
router.get('/', authorizeRole(['MASTER', 'ADMIN', 'PROFESSOR', 'ALUNO']), PlanController.list);

export default router;
