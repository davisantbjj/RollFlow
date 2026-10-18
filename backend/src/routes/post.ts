import { Router } from 'express';
import { PostController } from '../controllers/PostController';
import { authenticate, authorizeRole, academyContext, requireAcademy } from '../middlewares/authMiddleware';
import { validateBody, validateParams } from '../middlewares/validateBody';
import { createPostBodySchema, pinPostSchema, commentSchema, uuidParamSchema } from '../schemas/index';

const router = Router();

router.use(authenticate, academyContext, requireAcademy);

router.get('/', PostController.list);
router.post('/', authorizeRole(['MASTER', 'ADMIN', 'PROFESSOR']), validateBody(createPostBodySchema), PostController.create);
router.delete('/:id', validateParams(uuidParamSchema), PostController.remove);
router.patch('/:id/pin', authorizeRole(['MASTER', 'ADMIN']), validateParams(uuidParamSchema), validateBody(pinPostSchema), PostController.pin);
router.post('/:id/like', validateParams(uuidParamSchema), PostController.toggleLike);
router.get('/:id/comments', validateParams(uuidParamSchema), PostController.listComments);
router.post('/:id/comments', validateParams(uuidParamSchema), validateBody(commentSchema), PostController.addComment);

export default router;
