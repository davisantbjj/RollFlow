import { prisma } from '../index';
import { AuthRequest } from '../middlewares/authMiddleware';

/** Staff/Gestão/próprio aluno/responsável do aluno podem ler os dados de um aluno. */
export async function canViewStudent(req: AuthRequest, studentId: string): Promise<boolean> {
  const { id, role } = req.user!;
  if (id === studentId || ['MASTER', 'ADMIN', 'PROFESSOR'].includes(role)) return true;
  if (role === 'RESPONSAVEL') {
    const dep = await prisma.user.findFirst({ where: { id: studentId, guardianId: id }, select: { id: true } });
    return !!dep;
  }
  return false;
}

/** Início do dia de hoje (hora do servidor). Cobrança que vence hoje NÃO é atrasada. */
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Cobrança pendente é "atrasada" se venceu antes de hoje. */
export function isPaymentOverdue(status: string, dueDate: Date): boolean {
  return status === 'PENDING' && dueDate < startOfToday();
}

/** Atraso que justifica bloqueio: vencimento + blockAfterDays já passou. */
export function isBlockable(dueDate: Date, blockAfterDays: number): boolean {
  const limit = new Date(dueDate);
  limit.setDate(limit.getDate() + blockAfterDays);
  return limit < startOfToday();
}

/** Soma o intervalo do plano limitando ao último dia do mês alvo (31/jan + 1 mês = 28/fev). */
export function addInterval(date: Date, interval: string): Date {
  const months = ({ MONTHLY: 1, QUARTERLY: 3, SEMIANNUAL: 6, YEARLY: 12 } as Record<string, number>)[interval] ?? 1;
  const d = new Date(date);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}
