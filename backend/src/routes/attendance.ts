import { Router } from 'express';
import { AttendanceController } from '../controllers/AttendanceController';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

// Professores/Admins podem fazer check-in de qualquer aluno informando o studentId
// Alunos podem fazer check-in deles mesmos omitindo o studentId
router.post('/', authorizeRole(['MASTER', 'ADMIN', 'PROFESSOR', 'ALUNO']), AttendanceController.checkIn);
router.get('/class/:classId', authorizeRole(['MASTER', 'ADMIN', 'PROFESSOR']), AttendanceController.listByClass);

export default router;
