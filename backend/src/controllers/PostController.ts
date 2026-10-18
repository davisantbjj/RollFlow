import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/authMiddleware';

const postInclude = (userId: string) => ({
  author: { select: { id: true, name: true, role: true, beltColor: true } },
  _count: { select: { likes: true, comments: true } },
  likes: { where: { userId }, select: { userId: true } },
});

function formatPost(p: any) {
  return {
    id: p.id,
    content: p.content,
    imageUrl: p.imageUrl,
    isPinned: p.isPinned,
    createdAt: p.createdAt,
    author: p.author,
    likesCount: p._count.likes,
    commentsCount: p._count.comments,
    likedByMe: p.likes.length > 0,
  };
}

async function findPostInAcademy(id: string, academyId: string | null) {
  return prisma.post.findFirst({ where: { id, academyId: academyId as string } });
}

const commentSelect = {
  id: true,
  content: true,
  createdAt: true,
  author: { select: { id: true, name: true } },
};

export class PostController {
  static async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const posts = await prisma.post.findMany({
        where: { academyId: req.user!.academyId as string },
        include: postInclude(req.user!.id),
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      });
      res.json(posts.map(formatPost));
    } catch (error) {
      console.error('[PostController.list]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    const { content, imageUrl, isPinned } = req.body;
    try {
      if (!req.user!.academyId) {
        res.status(400).json({ error: 'Usuário não pertence a uma academia' });
        return;
      }
      // Apenas a gestão pode fixar
      const canPin = ['MASTER', 'ADMIN'].includes(req.user!.role);
      const post = await prisma.post.create({
        data: {
          content,
          imageUrl: imageUrl ?? null,
          isPinned: canPin ? !!isPinned : false,
          authorId: req.user!.id,
          academyId: req.user!.academyId,
        },
        include: postInclude(req.user!.id),
      });
      res.status(201).json(formatPost(post));
    } catch (error) {
      console.error('[PostController.create]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async remove(req: AuthRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    try {
      const post = await findPostInAcademy(id, req.user!.academyId);
      if (!post) {
        res.status(404).json({ error: 'Post não encontrado' });
        return;
      }
      const isManagement = ['MASTER', 'ADMIN'].includes(req.user!.role);
      if (post.authorId !== req.user!.id && !isManagement) {
        res.status(403).json({ error: 'Proibido: apenas o autor ou a gestão pode excluir' });
        return;
      }
      await prisma.$transaction([
        prisma.comment.deleteMany({ where: { postId: id } }),
        prisma.like.deleteMany({ where: { postId: id } }),
        prisma.post.delete({ where: { id } }),
      ]);
      res.status(204).send();
    } catch (error) {
      console.error('[PostController.remove]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async pin(req: AuthRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    try {
      if (!(await findPostInAcademy(id, req.user!.academyId))) {
        res.status(404).json({ error: 'Post não encontrado' });
        return;
      }
      const post = await prisma.post.update({
        where: { id },
        data: { isPinned: req.body.isPinned },
        include: postInclude(req.user!.id),
      });
      res.json(formatPost(post));
    } catch (error) {
      console.error('[PostController.pin]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async toggleLike(req: AuthRequest, res: Response): Promise<void> {
    const postId = req.params.id as string;
    const userId = req.user!.id;
    try {
      if (!(await findPostInAcademy(postId, req.user!.academyId))) {
        res.status(404).json({ error: 'Post não encontrado' });
        return;
      }
      const key = { userId_postId: { userId, postId } };
      const existing = await prisma.like.findUnique({ where: key });
      if (existing) await prisma.like.delete({ where: key });
      else await prisma.like.create({ data: { userId, postId } });
      const likesCount = await prisma.like.count({ where: { postId } });
      res.json({ liked: !existing, likesCount });
    } catch (error) {
      console.error('[PostController.toggleLike]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async listComments(req: AuthRequest, res: Response): Promise<void> {
    const postId = req.params.id as string;
    try {
      if (!(await findPostInAcademy(postId, req.user!.academyId))) {
        res.status(404).json({ error: 'Post não encontrado' });
        return;
      }
      const comments = await prisma.comment.findMany({
        where: { postId },
        select: commentSelect,
        orderBy: { createdAt: 'asc' },
      });
      res.json(comments);
    } catch (error) {
      console.error('[PostController.listComments]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async addComment(req: AuthRequest, res: Response): Promise<void> {
    const postId = req.params.id as string;
    try {
      if (!(await findPostInAcademy(postId, req.user!.academyId))) {
        res.status(404).json({ error: 'Post não encontrado' });
        return;
      }
      const comment = await prisma.comment.create({
        data: { postId, authorId: req.user!.id, content: req.body.content },
        select: commentSelect,
      });
      res.status(201).json(comment);
    } catch (error) {
      console.error('[PostController.addComment]', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
