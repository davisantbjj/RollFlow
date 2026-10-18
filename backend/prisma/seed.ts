import 'dotenv/config';
import { PrismaClient, BeltColor, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};
const daysAhead = (n: number) => daysAgo(-n);

// Gerador pseudo-aleatório determinístico (seed reproduzível)
let rnd = 42;
const rand = () => {
  rnd = (rnd * 1664525 + 1013904223) % 4294967296;
  return rnd / 4294967296;
};

async function clearAll() {
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.beltHistory.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.classTeacher.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.progressionRule.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();
  await prisma.academy.deleteMany();
}

async function main() {
  console.log('Iniciando seed do banco de dados...');
  await clearAll();

  const academy = await prisma.academy.create({
    data: { name: 'RollFlow BJJ', address: 'Av. Paulista, 1000 - São Paulo', phone: '(11) 99999-0000', blockAfterDays: 5 },
  });

  const password = await bcrypt.hash('123456', 10);
  const mkUser = (
    name: string,
    email: string,
    role: Role,
    extra: { beltColor?: BeltColor; beltDegree?: number; isBlocked?: boolean; guardianId?: string; monthsAgo?: number; phone?: string } = {}
  ) =>
    prisma.user.create({
      data: {
        name,
        email,
        password,
        role,
        academyId: academy.id,
        beltColor: extra.beltColor ?? 'BRANCA',
        beltDegree: extra.beltDegree ?? 0,
        isBlocked: extra.isBlocked ?? false,
        guardianId: extra.guardianId,
        phone: extra.phone,
        createdAt: daysAgo((extra.monthsAgo ?? 12) * 30),
      },
    });

  // ===== Usuários =====
  const mestre = await mkUser('Mestre Silva', 'mestre@rollflow.com', 'MASTER', { beltColor: 'PRETA', beltDegree: 3, monthsAgo: 36 });
  const professor = await mkUser('Professor Rafael', 'professor@rollflow.com', 'PROFESSOR', { beltColor: 'PRETA', beltDegree: 1, monthsAgo: 24 });
  const aluno = await mkUser('João Aluno', 'aluno@rollflow.com', 'ALUNO', { beltColor: 'AZUL', beltDegree: 1, monthsAgo: 20, phone: '(11) 98888-0001' });

  const bruno = await mkUser('Bruno Costa', 'bruno@rollflow.com', 'ALUNO', { monthsAgo: 4 });
  const camila = await mkUser('Camila Torres', 'camila@rollflow.com', 'ALUNO', { beltDegree: 2, monthsAgo: 8 });
  const diego = await mkUser('Diego Ramos', 'diego@rollflow.com', 'ALUNO', { beltColor: 'ROXA', beltDegree: 0, monthsAgo: 30 });
  const eduardo = await mkUser('Eduardo Lima', 'eduardo@rollflow.com', 'ALUNO', { beltColor: 'AZUL', beltDegree: 3, monthsAgo: 26 });
  const fernanda = await mkUser('Fernanda Souza', 'fernanda@rollflow.com', 'ALUNO', { beltDegree: 1, monthsAgo: 6 });
  const gabriel = await mkUser('Gabriel Alves', 'gabriel@rollflow.com', 'ALUNO', { beltColor: 'AZUL', beltDegree: 0, monthsAgo: 14 });
  const lucas = await mkUser('Lucas Atrasado', 'lucas@rollflow.com', 'ALUNO', { monthsAgo: 10, isBlocked: true });

  const responsavel = await mkUser('Marina Responsável', 'responsavel@rollflow.com', 'RESPONSAVEL', { monthsAgo: 6 });
  const miguel = await mkUser('Miguel Responsável Jr.', 'miguel@rollflow.com', 'ALUNO', {
    beltColor: 'CINZA',
    beltDegree: 1,
    guardianId: responsavel.id,
    monthsAgo: 6,
  });

  // ===== Turmas =====
  const mkClass = (name: string, description: string, dayOfWeek: string, startTime: string, endTime: string, maxStudents: number) =>
    prisma.class.create({ data: { name, description, dayOfWeek, startTime, endTime, maxStudents, academyId: academy.id } });

  const fundamentos = await mkClass('Fundamentos', 'Base técnica do jiu-jitsu para iniciantes', 'SEGUNDA', '19:00', '20:30', 25);
  const avancado = await mkClass('Avançado / No-Gi', 'Treino técnico e rolas para faixas azuis acima', 'QUARTA', '20:00', '21:30', 20);
  const kids = await mkClass('Kids', 'Jiu-jitsu infantil (6 a 12 anos)', 'SEXTA', '17:30', '18:30', 15);

  await prisma.classTeacher.createMany({
    data: [
      { classId: fundamentos.id, teacherId: professor.id },
      { classId: avancado.id, teacherId: professor.id },
      { classId: avancado.id, teacherId: mestre.id },
      { classId: kids.id, teacherId: professor.id },
    ],
  });

  const enroll: [string, string[]][] = [
    [fundamentos.id, [aluno.id, bruno.id, camila.id, fernanda.id, lucas.id]],
    [avancado.id, [aluno.id, diego.id, eduardo.id, gabriel.id, camila.id]],
    [kids.id, [miguel.id]],
  ];
  await prisma.enrollment.createMany({
    data: enroll.flatMap(([classId, ids]) => ids.map((studentId) => ({ classId, studentId }))),
  });

  // ===== Planos =====
  const mensal = await prisma.plan.create({
    data: { name: 'Mensal', description: 'Treinos ilimitados', price: 170, interval: 'MONTHLY', academyId: academy.id },
  });
  const trimestral = await prisma.plan.create({
    data: { name: 'Trimestral', description: 'Economize 10%', price: 459, interval: 'QUARTERLY', academyId: academy.id },
  });
  const infantil = await prisma.plan.create({
    data: { name: 'Kids', description: 'Plano infantil', price: 120, interval: 'MONTHLY', academyId: academy.id },
  });

  // ===== Assinaturas e pagamentos =====
  // pending: null = sem cobrança em aberto | dias relativos a hoje (negativo = atrasado)
  async function subscribe(
    userId: string,
    plan: { id: string; price: number },
    opts: { paidMonthsAgo: number[]; pendingDueIn?: number; status?: 'ACTIVE' | 'OVERDUE' }
  ) {
    const nextDue = daysAhead(opts.pendingDueIn ?? 15);
    const sub = await prisma.subscription.create({
      data: { userId, planId: plan.id, status: opts.status ?? 'ACTIVE', dueDate: nextDue, paymentMethod: 'PIX' },
    });
    for (const m of opts.paidMonthsAgo) {
      const due = daysAgo(m * 30);
      await prisma.payment.create({
        data: { subscriptionId: sub.id, amount: plan.price, status: 'PAID', dueDate: due, paymentDate: due },
      });
    }
    await prisma.payment.create({
      data: { subscriptionId: sub.id, amount: plan.price, status: 'PENDING', dueDate: nextDue },
    });
  }

  // Em dia, 1 pago no mês atual (receita do mês)
  await subscribe(aluno.id, mensal, { paidMonthsAgo: [3, 2], pendingDueIn: 20 });
  await subscribe(camila.id, trimestral, { paidMonthsAgo: [2], pendingDueIn: 25 });
  await subscribe(eduardo.id, mensal, { paidMonthsAgo: [3, 2], pendingDueIn: 8 });
  await subscribe(diego.id, mensal, { paidMonthsAgo: [2], pendingDueIn: 2 });
  await subscribe(miguel.id, infantil, { paidMonthsAgo: [2], pendingDueIn: 5 });
  // Pago neste mês (data de pagamento = hoje - 3 dias)
  const sg = await prisma.subscription.create({
    data: { userId: gabriel.id, planId: mensal.id, status: 'ACTIVE', dueDate: daysAhead(27) },
  });
  await prisma.payment.createMany({
    data: [
      { subscriptionId: sg.id, amount: 170, status: 'PAID', dueDate: daysAgo(3), paymentDate: daysAgo(3) },
      { subscriptionId: sg.id, amount: 170, status: 'PENDING', dueDate: daysAhead(27) },
    ],
  });
  const sf = await prisma.subscription.create({
    data: { userId: fernanda.id, planId: mensal.id, status: 'ACTIVE', dueDate: daysAhead(28) },
  });
  await prisma.payment.createMany({
    data: [
      { subscriptionId: sf.id, amount: 170, status: 'PAID', dueDate: daysAgo(2), paymentDate: daysAgo(2) },
      { subscriptionId: sf.id, amount: 170, status: 'PENDING', dueDate: daysAhead(28) },
    ],
  });
  // Atrasado há 3 dias (ainda dentro da tolerância, não bloqueado)
  await subscribe(bruno.id, mensal, { paidMonthsAgo: [1], pendingDueIn: -3 });
  // Atrasado há 12 dias: assinatura OVERDUE e usuário bloqueado
  await subscribe(lucas.id, mensal, { paidMonthsAgo: [2], pendingDueIn: -12, status: 'OVERDUE' });

  // ===== Presenças (~40 nos últimos 2 meses) =====
  const used = new Set<string>();
  let attendanceCount = 0;
  const classByStudent: [string, string][] = enroll.flatMap(([classId, ids]) =>
    ids.filter((id) => id !== lucas.id).map((id) => [classId, id] as [string, string])
  );
  while (attendanceCount < 40) {
    const [classId, studentId] = classByStudent[Math.floor(rand() * classByStudent.length)];
    const day = Math.floor(rand() * 60);
    const key = `${classId}|${studentId}|${day}`;
    if (used.has(key)) continue;
    used.add(key);
    const date = daysAgo(day);
    date.setHours(19, 15, 0, 0);
    await prisma.attendance.create({ data: { classId, studentId, date, createdAt: date } });
    attendanceCount++;
  }
  // João (aluno@) com frequência garantida: 1 presença por semana nas últimas 6 semanas
  for (let w = 0; w < 6; w++) {
    const date = daysAgo(w * 7 + 1);
    date.setHours(19, 15, 0, 0);
    const key = `${fundamentos.id}|${aluno.id}|${w * 7 + 1}`;
    if (used.has(key)) continue;
    used.add(key);
    await prisma.attendance.create({ data: { classId: fundamentos.id, studentId: aluno.id, date, createdAt: date } });
  }

  // ===== Avaliações =====
  const evals: [string, number, number, number, string][] = [
    [aluno.id, 4, 5, 4, 'Ótima evolução na guarda e disciplina exemplar.'],
    [aluno.id, 4, 4, 5, 'Passagens de guarda muito mais limpas.'],
    [bruno.id, 3, 4, 3, 'Boa dedicação, precisa melhorar as fugas.'],
    [camila.id, 4, 4, 4, 'Técnica sólida nas finalizações.'],
    [eduardo.id, 5, 4, 4, 'Pronto para disputar a próxima graduação.'],
    [miguel.id, 4, 5, 4, 'Muito atento e respeitoso com os colegas.'],
  ];
  for (const [studentId, technique, discipline, evolution, notes] of evals) {
    await prisma.evaluation.create({
      data: { studentId, evaluatorId: professor.id, technique, discipline, evolution, notes },
    });
  }

  // ===== Regras de progressão =====
  await prisma.progressionRule.createMany({
    data: [
      { academyId: academy.id, beltColor: 'BRANCA', minAttendanceCount: 60, minMonths: 6, minEvaluationScore: 3.0, requiresEvaluation: true },
      { academyId: academy.id, beltColor: 'AZUL', minAttendanceCount: 120, minMonths: 18, minEvaluationScore: 3.5, requiresEvaluation: true },
    ],
  });

  // Histórico: João recebeu a faixa azul há 8 meses
  await prisma.beltHistory.create({
    data: { studentId: aluno.id, promotedBy: professor.id, fromBelt: 'BRANCA', toBelt: 'AZUL', fromDegree: 4, toDegree: 0, promotedAt: daysAgo(240) },
  });

  // ===== Feed =====
  const mkPost = (authorId: string, content: string, daysBack: number, isPinned = false) =>
    prisma.post.create({
      data: { authorId, academyId: academy.id, content, isPinned, createdAt: daysAgo(daysBack) },
    });

  const p1 = await mkPost(mestre.id, 'Bem-vindos ao RollFlow! Mensalidades vencem todo dia 10; após 5 dias de atraso o acesso às aulas é bloqueado automaticamente.', 30, true);
  const p2 = await mkPost(professor.id, 'Seminário de passagem de guarda neste sábado, 10h. Vagas limitadas, confirmem presença com o professor!', 5);
  const p3 = await mkPost(mestre.id, 'Parabéns ao João pela excelente evolução! Continue assim, a faixa roxa está chegando.', 3);
  const p4 = await mkPost(professor.id, 'Lembrete: traga o kimono limpo e as unhas aparadas. Bom treino a todos!', 1);

  await prisma.like.createMany({
    data: [
      ...[aluno, bruno, camila, diego, eduardo, professor].map((u) => ({ userId: u.id, postId: p1.id })),
      ...[aluno, bruno, mestre].map((u) => ({ userId: u.id, postId: p2.id })),
      ...[aluno, camila, diego, fernanda, gabriel].map((u) => ({ userId: u.id, postId: p3.id })),
      ...[mestre, eduardo].map((u) => ({ userId: u.id, postId: p4.id })),
    ],
  });

  await prisma.comment.createMany({
    data: [
      { postId: p1.id, authorId: bruno.id, content: 'Ótimo, obrigado pelo aviso!', createdAt: daysAgo(29) },
      { postId: p2.id, authorId: aluno.id, content: 'Estarei lá! Já confirmei.', createdAt: daysAgo(4) },
      { postId: p2.id, authorId: camila.id, content: 'Posso levar um amigo para assistir?', createdAt: daysAgo(4) },
      { postId: p2.id, authorId: professor.id, content: 'Pode sim, Camila!', createdAt: daysAgo(3) },
      { postId: p3.id, authorId: aluno.id, content: 'Obrigado, mestre! Osss!', createdAt: daysAgo(2) },
    ],
  });

  console.log('Seed concluído: RollFlow BJJ');
  console.log('Logins (senha 123456): mestre@, professor@, aluno@, responsavel@ rollflow.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
