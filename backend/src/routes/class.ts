import { Router } from 'express';
import { ClassController } from '../controllers/ClassController';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware';
import { validateBody, validateParams } from '../middlewares/validateBody';
import { classTeacherParamSchema, classStudentParamSchema, updateClassSchema, addTeacherSchema, createClassSchema, enrollStudentSchema, classIdParamSchema } from '../schemas/index';

const router = Router();

router.use(authenticate);

router.post('/', authorizeRole(['MASTER', 'ADMIN']), validateBody(createClassSchema), ClassController.create);
router.get('/', authorizeRole(['MASTER', 'ADMIN', 'PROFESSOR', 'ALUNO']), ClassController.list);
router.get('/:classId/students', authorizeRole(['MASTER', 'ADMIN', 'PROFESSOR']), validateParams(classIdParamSchema), ClassController.listEnrolledStudents);
router.post('/:classId/enroll', authorizeRole(['MASTER', 'ADMIN']), validateParams(classIdParamSchema), validateBody(enrollStudentSchema), ClassController.enrollStudent);
router.get('/:classId', authorizeRole(['MASTER', 'ADMIN', 'PROFESSOR']), validateParams(classIdParamSchema), ClassController.getById);
router.put('/:classId', authorizeRole(['MASTER', 'ADMIN']), validateParams(classIdParamSchema), validateBody(updateClassSchema), ClassController.update);
router.delete('/:classId', authorizeRole(['MASTER', 'ADMIN']), validateParams(classIdParamSchema), ClassController.remove);
router.post('/:classId/teachers', authorizeRole(['MASTER', 'ADMIN']), validateParams(classIdParamSchema), validateBody(addTeacherSchema), ClassController.addTeacher);
router.delete('/:classId/teachers/:teacherId', authorizeRole(['MASTER', 'ADMIN']), validateParams(classTeacherParamSchema), ClassController.removeTeacher);
router.delete('/:classId/enroll/:studentId', authorizeRole(['MASTER', 'ADMIN']), validateParams(classStudentParamSchema), ClassController.unenrollStudent);

export default router;
