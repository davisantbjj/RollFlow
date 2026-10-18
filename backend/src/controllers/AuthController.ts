import { Request, Response } from 'express';
import { prisma } from '../index';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        res.status(401).json({ error: 'E-mail ou senha incorretos' });
        return;
      }

      // Usuário bloqueado consegue entrar, mas o authenticate só libera o financeiro dele
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        res.status(401).json({ error: 'E-mail ou senha incorretos' });
        return;
      }

      const token = jwt.sign(
        { id: user.id, role: user.role, academyId: user.academyId },
        process.env.JWT_SECRET as string,
        { expiresIn: '7d' }
      );

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          academyId: user.academyId,
          beltColor: user.beltColor,
          beltDegree: user.beltDegree,
          phone: user.phone,
          isBlocked: user.isBlocked,
        },
        token,
      });
    } catch (error) {
      console.error('[AuthController.login]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async register(req: Request, res: Response): Promise<void> {
    const { name, email, password, role, academyId, phone } = req.body;

    try {
      // Verify that the academy exists
      const academy = await prisma.academy.findUnique({ where: { id: academyId } });
      if (!academy) {
        res.status(404).json({ error: 'Academia não encontrada' });
        return;
      }

      const userExists = await prisma.user.findUnique({ where: { email } });
      if (userExists) {
        res.status(409).json({ error: 'E-mail já cadastrado' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          academyId,
          phone,
        },
      });

      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        academyId: user.academyId,
      });
    } catch (error) {
      console.error('[AuthController.register]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
