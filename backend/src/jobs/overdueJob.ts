import { prisma } from '../index';
import { isBlockable } from '../utils/access';

/**
 * Bloqueia na TRANSIÇÃO: assinatura ainda não OVERDUE com cobrança PENDING vencida além de
 * academy.blockAfterDays vira OVERDUE e o usuário é bloqueado. Quem a gestão desbloqueou
 * manualmente (assinatura já OVERDUE) não é bloqueado de novo. Assinaturas CANCELED são ignoradas.
 */
export async function runOverdueCheck(): Promise<number> {
  const pending = await prisma.payment.findMany({
    where: {
      status: 'PENDING',
      subscription: { status: { notIn: ['OVERDUE', 'CANCELED'] } },
    },
    include: { subscription: { include: { user: { include: { academy: true } } } } },
  });

  const done = new Set<string>();
  for (const p of pending) {
    if (done.has(p.subscriptionId)) continue;
    const days = p.subscription.user.academy?.blockAfterDays ?? 5;
    if (!isBlockable(p.dueDate, days)) continue;

    await prisma.$transaction([
      prisma.subscription.update({ where: { id: p.subscriptionId }, data: { status: 'OVERDUE' } }),
      prisma.user.update({ where: { id: p.subscription.userId }, data: { isBlocked: true } }),
    ]);
    done.add(p.subscriptionId);
  }
  return done.size;
}

export function startOverdueJob(): void {
  const run = () =>
    runOverdueCheck()
      .then((n) => {
        if (n > 0) console.log(`[overdueJob] ${n} assinatura(s) bloqueada(s) por atraso`);
      })
      .catch((e) => console.error('[overdueJob]', e));
  run();
  setInterval(run, 60 * 60 * 1000).unref();
}
