import { z } from 'zod';

// ===== Auth Schemas =====

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z
    .string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['ADMIN', 'PROFESSOR', 'ALUNO', 'RESPONSAVEL'], {
    error: 'Role inválido. Valores permitidos: ADMIN, PROFESSOR, ALUNO, RESPONSAVEL',
  }),
  academyId: z.string().uuid('academyId deve ser um UUID válido'),
  phone: z.string().optional(),
});

// ===== Academy Schemas =====

export const createAcademySchema = z.object({
  name: z.string().min(2, 'Nome da academia deve ter pelo menos 2 caracteres'),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const updateAcademySchema = z.object({
  name: z.string().min(2).optional(),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// ===== Class Schemas =====

export const createClassSchema = z.object({
  name: z.string().min(2, 'Nome da turma deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  academyId: z.string().uuid('academyId deve ser um UUID válido').optional(),
  dayOfWeek: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  maxStudents: z.number().int().positive().optional(),
});

export const enrollStudentSchema = z.object({
  studentId: z.string().uuid('studentId deve ser um UUID válido'),
});

// ===== Attendance Schemas =====

export const checkInSchema = z.object({
  classId: z.string().uuid('classId deve ser um UUID válido'),
  studentId: z.string().uuid('studentId deve ser um UUID válido').optional(),
});

// ===== Plan Schemas =====

export const createPlanSchema = z.object({
  name: z.string().min(2, 'Nome do plano deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  price: z.number().positive('Preço deve ser positivo'),
  interval: z.enum(['MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY'], {
    error: 'Intervalo inválido',
  }),
  academyId: z.string().uuid('academyId deve ser um UUID válido').optional(),
});

// ===== Subscription Schemas =====

export const subscribeSchema = z.object({
  planId: z.string().uuid('planId deve ser um UUID válido'),
  userId: z.string().uuid('userId deve ser um UUID válido').optional(),
});

// ===== Post Schemas =====

export const createPostSchema = z.object({
  content: z.string().min(1, 'Conteúdo não pode ser vazio'),
  academyId: z.string().uuid('academyId deve ser um UUID válido'),
  isPinned: z.boolean().optional(),
});

// ===== Common Param Schemas =====

export const uuidParamSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido'),
});

export const classIdParamSchema = z.object({
  classId: z.string().uuid('classId deve ser um UUID válido'),
});

// ===== Progression Schemas =====

export const createEvaluationSchema = z.object({
  studentId: z.string().uuid('studentId deve ser um UUID válido'),
  technique: z.number().int().min(1).max(5),
  discipline: z.number().int().min(1).max(5),
  evolution: z.number().int().min(1).max(5),
  notes: z.string().optional(),
});

export const upsertProgressionRuleSchema = z.object({
  academyId: z.string().uuid('academyId deve ser um UUID válido'),
  beltColor: z.enum(['BRANCA', 'CINZA', 'AMARELA', 'LARANJA', 'VERDE', 'AZUL', 'ROXA', 'MARROM', 'PRETA', 'CORAL', 'VERMELHA']),
  minAttendanceCount: z.number().int().min(0),
  minMonths: z.number().int().min(0),
  minEvaluationScore: z.number().min(0).max(5),
  requiresEvaluation: z.boolean().optional(),
});

export const promoteStudentSchema = z.object({
  studentId: z.string().uuid('studentId deve ser um UUID válido'),
  toBelt: z.enum(['BRANCA', 'CINZA', 'AMARELA', 'LARANJA', 'VERDE', 'AZUL', 'ROXA', 'MARROM', 'PRETA', 'CORAL', 'VERMELHA']),
  toDegree: z.number().int().min(0).max(10),
});


// ===== Contrato "App" =====

export const createPostBodySchema = z.object({
  content: z.string().trim().min(1, 'Conteúdo não pode ser vazio'),
  imageUrl: z.string().url('imageUrl inválida').optional().nullable(),
  isPinned: z.boolean().optional(),
});

export const pinPostSchema = z.object({ isPinned: z.boolean() });

export const commentSchema = z.object({
  content: z.string().trim().min(1, 'Comentário não pode ser vazio'),
});

export const updatePlanSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  price: z.number().positive('Preço deve ser positivo').optional(),
  interval: z.enum(['MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY']).optional(),
});

export const updateClassSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  dayOfWeek: z.string().nullable().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  maxStudents: z.number().int().positive().nullable().optional(),
});

export const addTeacherSchema = z.object({
  teacherId: z.string().uuid('teacherId deve ser um UUID válido'),
});

export const createUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['ADMIN', 'PROFESSOR', 'ALUNO', 'RESPONSAVEL'], { error: 'Role inválido' }),
  phone: z.string().optional(),
  guardianId: z.string().uuid().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().nullable().optional(),
  role: z.enum(['ADMIN', 'PROFESSOR', 'ALUNO', 'RESPONSAVEL']).optional(),
  guardianId: z.string().uuid().nullable().optional(),
});

export const blockUserSchema = z.object({ isBlocked: z.boolean() });

export const classTeacherParamSchema = z.object({
  classId: z.string().uuid('classId deve ser um UUID válido'),
  teacherId: z.string().uuid('teacherId deve ser um UUID válido'),
});

export const classStudentParamSchema = z.object({
  classId: z.string().uuid('classId deve ser um UUID válido'),
  studentId: z.string().uuid('studentId deve ser um UUID válido'),
});
