import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { authenticate, authorizeRole, academyContext, requireAcademy } from '../middlewares/authMiddleware';
import { validateBody, validateParams } from '../middlewares/validateBody';
import { subscribeSchema, uuidParamSchema } from '../schemas/index';

const router = Router();

router.use(authenticate, academyContext, requireAcademy);

router.post('/subscribe', authorizeRole(['MASTER', 'ADMIN', 'ALUNO']), validateBody(subscribeSchema), PaymentController.subscribe);
router.get('/subscriptions', authorizeRole(['MASTER', 'ADMIN', 'ALUNO']), PaymentController.listUserSubscriptions);
router.get('/me', PaymentController.me);
router.get('/overview', authorizeRole(['MASTER', 'ADMIN']), PaymentController.overview);
router.post('/:id/pay', authorizeRole(['MASTER', 'ADMIN']), validateParams(uuidParamSchema), PaymentController.pay);

export default router;
