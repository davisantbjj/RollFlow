import { Router } from 'express';
import { PlanController } from '../controllers/PlanController';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware';
import { validateBody, validateParams } from '../middlewares/validateBody';
import { createPlanSchema, updatePlanSchema, uuidParamSchema } from '../schemas/index';

const router = Router();

router.use(authenticate);

router.post('/', authorizeRole(['MASTER', 'ADMIN']), validateBody(createPlanSchema), PlanController.create);
router.get('/', authorizeRole(['MASTER', 'ADMIN', 'PROFESSOR', 'ALUNO']), PlanController.list);
router.put('/:id', authorizeRole(['MASTER', 'ADMIN']), validateParams(uuidParamSchema), validateBody(updatePlanSchema), PlanController.update);
router.delete('/:id', authorizeRole(['MASTER', 'ADMIN']), validateParams(uuidParamSchema), PlanController.remove);

export default router;
