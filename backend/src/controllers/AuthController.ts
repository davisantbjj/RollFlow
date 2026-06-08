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
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid credentials' });
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
          academyId: user.academyId
        },
        token
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async register(req: Request, res: Response): Promise<void> {
    const { name, email, password, role, academyId } = req.body;

    try {
      const userExists = await prisma.user.findUnique({ where: { email } });

      if (userExists) {
        res.status(400).json({ error: 'User already exists' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          academyId
        }
      });

      res.status(201).json({ id: user.id, email: user.email, role: user.role });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
