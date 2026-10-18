import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateBody } from '../middlewares/validateBody';
import { loginSchema, registerSchema } from '../schemas/index';

const router = Router();

router.post('/login', validateBody(loginSchema), AuthController.login);
router.post('/register', validateBody(registerSchema), AuthController.register);

export default router;
