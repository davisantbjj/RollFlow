import { Router } from 'express';
import { ProgressionController } from '../controllers/ProgressionController';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware';
import { validateBody } from '../middlewares/validateBody';
import { promoteStudentSchema, upsertProgressionRuleSchema } from '../schemas/index';

const router = Router();

router.use(authenticate);

router.get('/student/:studentId', ProgressionController.getStudentProgress);
router.post('/promote', authorizeRole(['MASTER', 'ADMIN', 'PROFESSOR']), validateBody(promoteStudentSchema), ProgressionController.promoteStudent);
router.post('/rules', authorizeRole(['MASTER', 'ADMIN']), validateBody(upsertProgressionRuleSchema), ProgressionController.upsertRule);

export default router;
