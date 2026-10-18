import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: Role;
    academyId: string | null;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
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
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido ou expirado' });
    return;
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
