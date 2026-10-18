import { Router } from 'express';
import { MasterController } from '../controllers/MasterController';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware';
import { validateBody, validateParams } from '../middlewares/validateBody';
import { createMasterAcademySchema, updateMasterAcademySchema, uuidParamSchema } from '../schemas/index';

const router = Router();

// Visão global do SaaS: só MASTER, sem contexto de academia (X-Academy-Id não é usado aqui)
router.use(authenticate, authorizeRole(['MASTER']));

router.get('/overview', MasterController.overview);
router.get('/academies', MasterController.listAcademies);
router.post('/academies', validateBody(createMasterAcademySchema), MasterController.createAcademy);
router.get('/academies/:id', validateParams(uuidParamSchema), MasterController.getAcademy);
router.put('/academies/:id', validateParams(uuidParamSchema), validateBody(updateMasterAcademySchema), MasterController.updateAcademy);

export default router;
