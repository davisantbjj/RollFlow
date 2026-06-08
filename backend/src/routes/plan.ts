import { Router } from 'express';
import { PlanController } from '../controllers/PlanController';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', authorizeRole(['MASTER', 'ADMIN']), PlanController.create);
router.get('/', authorizeRole(['MASTER', 'ADMIN', 'PROFESSOR', 'ALUNO']), PlanController.list);

export default router;
