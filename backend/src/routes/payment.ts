import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/subscribe', authorizeRole(['MASTER', 'ADMIN', 'ALUNO']), PaymentController.subscribe);
router.get('/subscriptions', authorizeRole(['MASTER', 'ADMIN', 'ALUNO']), PaymentController.listUserSubscriptions);

export default router;
