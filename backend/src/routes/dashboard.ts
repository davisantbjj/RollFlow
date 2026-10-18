import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);
router.get('/', authorizeRole(['MASTER', 'ADMIN']), DashboardController.get);

export default router;
