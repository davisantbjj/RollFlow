import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../index';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: Role;
    academyId: string | null;
  };
}

// Únicas rotas liberadas para usuário bloqueado (inadimplente): ver e pagar o próprio financeiro
const BLOCKED_ALLOWED = ['GET /payments/me', 'GET /users/profile'];

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Token não fornecido' });
    return;
  }

  const [, token] = authHeader.split(' ');

  if (!token) {
    res.status(401).json({ error: 'Token mal formatado' });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('[Auth] JWT_SECRET not configured');
    res.status(500).json({ error: 'Erro de configuração do servidor' });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { id: string; role: Role; academyId: string | null };
    req.user = {
      id: decoded.id,
      role: decoded.role,
      academyId: decoded.academyId,
    };
  } catch (err) {
    res.status(401).json({ error: 'Token inválido ou expirado' });
    return;
  }

  try {
    // O bloqueio pode mudar a qualquer momento, então é conferido no banco a cada requisição
    const current = await prisma.user.findUnique({ where: { id: req.user.id }, select: { isBlocked: true } });
    if (!current) {
      res.status(401).json({ error: 'Usuário não encontrado' });
      return;
    }

    const route = `${req.method} ${req.originalUrl.split('?')[0]}`;
    if (current.isBlocked && !BLOCKED_ALLOWED.includes(route)) {
      res.status(403).json({ error: 'Acesso bloqueado: regularize sua mensalidade.', code: 'BLOCKED' });
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const authorizeRole = (roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Proibido: Permissão insuficiente' });
      return;
    }

    next();
  };
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** MASTER "entra" numa academia via header X-Academy-Id. Para os demais papéis o header é ignorado. */
export const academyContext = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const header = req.headers['x-academy-id'];
    const academyId = Array.isArray(header) ? header[0] : header;
    if (req.user?.role === 'MASTER' && academyId) {
      const academy = UUID_RE.test(academyId)
        ? await prisma.academy.findUnique({ where: { id: academyId }, select: { id: true } })
        : null;
      if (!academy) {
        res.status(404).json({ error: 'Academia não encontrada' });
        return;
      }
      req.user.academyId = academy.id;
    }
    next();
  } catch (err) {
    next(err);
  }
};

/** Rotas de academia: MASTER sem contexto não tem em qual academia operar. */
export const requireAcademy = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role === 'MASTER' && !req.user.academyId) {
    res.status(400).json({ error: 'Selecione uma academia' });
    return;
  }
  next();
};
