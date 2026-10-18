import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware';
import { validateBody } from '../middlewares/validateBody';
import { subscribeSchema } from '../schemas/index';

const router = Router();

router.use(authenticate);

router.post('/subscribe', authorizeRole(['MASTER', 'ADMIN', 'ALUNO']), validateBody(subscribeSchema), PaymentController.subscribe);
router.get('/subscriptions', authorizeRole(['MASTER', 'ADMIN', 'ALUNO']), PaymentController.listUserSubscriptions);

export default router;
