import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', authorizeRole(['MASTER', 'ADMIN']), UserController.list);
router.get('/profile', UserController.getProfile);

export default router;
