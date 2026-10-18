import { Router } from 'express';
import { ClassController } from '../controllers/ClassController';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware';
import { validateBody, validateParams } from '../middlewares/validateBody';
import { createClassSchema, enrollStudentSchema, classIdParamSchema } from '../schemas/index';

const router = Router();

router.use(authenticate);

router.post('/', authorizeRole(['MASTER', 'ADMIN']), validateBody(createClassSchema), ClassController.create);
router.get('/', authorizeRole(['MASTER', 'ADMIN', 'PROFESSOR', 'ALUNO']), ClassController.list);
router.get('/:classId/students', authorizeRole(['MASTER', 'ADMIN', 'PROFESSOR']), validateParams(classIdParamSchema), ClassController.listEnrolledStudents);
router.post('/:classId/enroll', authorizeRole(['MASTER', 'ADMIN']), validateParams(classIdParamSchema), validateBody(enrollStudentSchema), ClassController.enrollStudent);

export default router;
