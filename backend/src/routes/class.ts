import { Router } from 'express';
import { ClassController } from '../controllers/ClassController';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', authorizeRole(['MASTER', 'ADMIN']), ClassController.create);
router.get('/', authorizeRole(['MASTER', 'ADMIN', 'PROFESSOR', 'ALUNO']), ClassController.list);
router.post('/:classId/enroll', authorizeRole(['MASTER', 'ADMIN']), ClassController.enrollStudent);

export default router;
