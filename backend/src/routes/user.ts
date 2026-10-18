import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticate, authorizeRole, academyContext, requireAcademy } from '../middlewares/authMiddleware';
import { validateBody, validateParams } from '../middlewares/validateBody';
import { createUserSchema, updateUserSchema, blockUserSchema, uuidParamSchema } from '../schemas/index';

const router = Router();

router.use(authenticate, academyContext);

router.get('/', authorizeRole(['MASTER', 'ADMIN', 'PROFESSOR']), UserController.list);
router.post('/', authorizeRole(['MASTER', 'ADMIN']), validateBody(createUserSchema), UserController.create);
router.get('/profile', UserController.getProfile);
router.use(requireAcademy);
// Rotas fixas ANTES de /:id
router.get('/me/dependents', authorizeRole(['RESPONSAVEL']), UserController.myDependents);
router.get('/:id', validateParams(uuidParamSchema), UserController.getById);
router.put('/:id', validateParams(uuidParamSchema), validateBody(updateUserSchema), UserController.update);
router.patch('/:id/block', authorizeRole(['MASTER', 'ADMIN']), validateParams(uuidParamSchema), validateBody(blockUserSchema), UserController.setBlocked);

export default router;
