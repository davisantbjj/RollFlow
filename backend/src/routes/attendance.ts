import { Router } from 'express';
import { AttendanceController } from '../controllers/AttendanceController';
import { authenticate, authorizeRole, academyContext, requireAcademy } from '../middlewares/authMiddleware';
import { validateBody, validateParams } from '../middlewares/validateBody';
import { checkInSchema, classIdParamSchema } from '../schemas/index';

const router = Router();

router.use(authenticate, academyContext, requireAcademy);

// Professores/Admins podem fazer check-in de qualquer aluno informando o studentId
// Alunos podem fazer check-in deles mesmos omitindo o studentId
router.post('/', authorizeRole(['MASTER', 'ADMIN', 'PROFESSOR', 'ALUNO']), validateBody(checkInSchema), AttendanceController.checkIn);
router.get('/class/:classId', authorizeRole(['MASTER', 'ADMIN', 'PROFESSOR']), validateParams(classIdParamSchema), AttendanceController.listByClass);
router.get('/history', authorizeRole(['MASTER', 'ADMIN', 'PROFESSOR', 'ALUNO']), AttendanceController.getStudentHistory);
router.get('/history/:studentId', authorizeRole(['MASTER', 'ADMIN', 'PROFESSOR', 'RESPONSAVEL']), AttendanceController.getStudentHistory);

export default router;
