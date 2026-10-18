import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { authenticate, authorizeRole, academyContext, requireAcademy } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate, academyContext, requireAcademy);
router.get('/analytics', authorizeRole(['MASTER', 'ADMIN']), DashboardController.analytics);
router.get('/', authorizeRole(['MASTER', 'ADMIN']), DashboardController.get);

export default router;
