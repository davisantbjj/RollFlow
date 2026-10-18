import { Response } from 'express';
import { prisma } from '../index';
import bcrypt from 'bcrypt';
import { AuthRequest } from '../middlewares/authMiddleware';

const publicUser = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  beltColor: true,
  beltDegree: true,
  isBlocked: true,
  academyId: true,
  guardianId: true,
  createdAt: true,
} as const;

const isManagement = (role: string) => role === 'MASTER' || role === 'ADMIN';
const isStaff = (role: string) => isManagement(role) || role === 'PROFESSOR';

/** Busca usuário garantindo a mesma academia do contexto (token, ou X-Academy-Id para MASTER). */
async function findInTenant(id: string, req: AuthRequest) {
  return prisma.user.findFirst({ where: { id, academyId: req.user!.academyId as string }, select: publicUser });
}

/** guardianId precisa ser um RESPONSAVEL da mesma academia. */
async function isValidGuardian(guardianId: string, academyId: string | null): Promise<boolean> {
  const g = await prisma.user.findFirst({
    where: { id: guardianId, role: 'RESPONSAVEL', ...(academyId ? { academyId } : {}) },
    select: { id: true },
  });
  return !!g;
}

export class UserController {
  static async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { academyId } = req.user!;
      const { search, filterRole, includeAdmins } = req.query;

      const where: any = { academyId };

      // Search filter
      if (search && typeof search === 'string') {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Role filter
      if (filterRole && typeof filterRole === 'string') {
        where.role = includeAdmins === 'true' && filterRole === 'PROFESSOR' ? { in: ['PROFESSOR', 'ADMIN'] } : filterRole;
      }

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          beltColor: true,
          beltDegree: true,
          isBlocked: true,
          academyId: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
      });

      res.json(users);
    } catch (error) {
      console.error('[UserController.list]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          beltColor: true,
          beltDegree: true,
          isBlocked: true,
          academyId: true,
          academy: { select: { id: true, name: true } },
          createdAt: true,
        },
      });

      if (!user) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }
      res.json(user);
    } catch (error) {
      console.error('[UserController.getProfile]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    const { name, email, password, role, phone, guardianId } = req.body;
    try {
      const academyId = req.user!.academyId;
      if (!academyId) {
        res.status(400).json({ error: 'Usuário logado não pertence a uma academia' });
        return;
      }
      if (await prisma.user.findUnique({ where: { email } })) {
        res.status(409).json({ error: 'E-mail já cadastrado' });
        return;
      }
      if (guardianId && !(await isValidGuardian(guardianId, academyId))) {
        res.status(400).json({ error: 'Responsável inválido' });
        return;
      }
      const user = await prisma.user.create({
        data: { name, email, role, phone, guardianId, academyId, password: await bcrypt.hash(password, 10) },
        select: publicUser,
      });
      res.status(201).json(user);
    } catch (error) {
      console.error('[UserController.create]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async getById(req: AuthRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    try {
      const user = await findInTenant(id, req);
      if (!user) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }
      const allowed = isStaff(req.user!.role) || req.user!.id === id || user.guardianId === req.user!.id;
      if (!allowed) {
        res.status(403).json({ error: 'Acesso negado' });
        return;
      }

      const [academy, dependents, subscription] = await Promise.all([
        user.academyId
          ? prisma.academy.findUnique({ where: { id: user.academyId }, select: { id: true, name: true } })
          : null,
        prisma.user.findMany({
          where: { guardianId: id },
          select: { id: true, name: true, beltColor: true, beltDegree: true },
          orderBy: { name: 'asc' },
        }),
        prisma.subscription.findFirst({
          where: { userId: id, status: { not: 'CANCELED' } },
          include: { plan: { select: { id: true, name: true, price: true, interval: true } } },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      res.json({
        ...user,
        academy,
        dependents,
        subscription: subscription && {
          id: subscription.id,
          status: subscription.status,
          dueDate: subscription.dueDate,
          plan: subscription.plan,
        },
      });
    } catch (error) {
      console.error('[UserController.getById]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    const { name, phone, role, guardianId } = req.body;
    try {
      const management = isManagement(req.user!.role);
      if (!management && req.user!.id !== id) {
        res.status(403).json({ error: 'Proibido: Permissão insuficiente' });
        return;
      }
      if (!(await findInTenant(id, req))) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }
      if (!management && (role !== undefined || guardianId !== undefined)) {
        res.status(403).json({ error: 'Você só pode alterar nome e telefone' });
        return;
      }
      if (guardianId && !(await isValidGuardian(guardianId, req.user!.academyId))) {
        res.status(400).json({ error: 'Responsável inválido' });
        return;
      }
      const user = await prisma.user.update({
        where: { id },
        data: { name, phone, role, guardianId },
        select: publicUser,
      });
      res.json(user);
    } catch (error) {
      console.error('[UserController.update]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async setBlocked(req: AuthRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    try {
      if (!(await findInTenant(id, req))) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }
      const user = await prisma.user.update({
        where: { id },
        data: { isBlocked: req.body.isBlocked },
        select: publicUser,
      });
      res.json(user);
    } catch (error) {
      console.error('[UserController.setBlocked]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async myDependents(req: AuthRequest, res: Response): Promise<void> {
    try {
      const dependents = await prisma.user.findMany({
        where: { guardianId: req.user!.id },
        select: { id: true, name: true, beltColor: true, beltDegree: true },
        orderBy: { name: 'asc' },
      });
      res.json(dependents);
    } catch (error) {
      console.error('[UserController.myDependents]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
