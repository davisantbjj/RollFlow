import { Router } from 'express';
import { AcademyController } from '../controllers/AcademyController';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

// Apenas MASTER cria e deleta academias
router.post('/', authorizeRole(['MASTER']), AcademyController.create);
router.get('/', authorizeRole(['MASTER']), AcademyController.list);
router.get('/:id', authorizeRole(['MASTER', 'ADMIN']), AcademyController.getById);
router.put('/:id', authorizeRole(['MASTER', 'ADMIN']), AcademyController.update);
router.delete('/:id', authorizeRole(['MASTER']), AcademyController.delete);

export default router;
