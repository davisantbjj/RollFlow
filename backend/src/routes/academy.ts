import { Router } from 'express';
import { AcademyController } from '../controllers/AcademyController';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware';
import { validateBody, validateParams } from '../middlewares/validateBody';
import { createAcademySchema, updateAcademySchema, uuidParamSchema } from '../schemas/index';

const router = Router();

router.use(authenticate);

// Apenas MASTER cria e deleta academias
router.post('/', authorizeRole(['MASTER']), validateBody(createAcademySchema), AcademyController.create);
router.get('/', authorizeRole(['MASTER']), AcademyController.list);
router.get('/:id', authorizeRole(['MASTER', 'ADMIN']), validateParams(uuidParamSchema), AcademyController.getById);
router.put('/:id', authorizeRole(['MASTER', 'ADMIN']), validateParams(uuidParamSchema), validateBody(updateAcademySchema), AcademyController.update);
router.delete('/:id', authorizeRole(['MASTER']), validateParams(uuidParamSchema), AcademyController.delete);

export default router;
