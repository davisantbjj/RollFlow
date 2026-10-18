import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Iniciando seed do banco de dados...');

  // 1. Criar Academia
  const academy = await prisma.academy.create({
    data: {
      name: 'RollFlow BJJ',
      address: 'Av. Paulista, 1000',
    },
  });
  console.log('✅ Academia criada:', academy.name);

  // 2. Criar Mestre/Admin
  const adminPassword = await bcrypt.hash('123456', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'Mestre Silva',
      email: 'mestre@rollflow.com',
      password: adminPassword,
      role: 'MASTER',
      beltColor: 'PRETA',
      beltDegree: 3,
      academyId: academy.id,
    },
  });
  console.log('✅ Admin criado:', admin.email);

  // 3. Criar Aluno
  const alunoPassword = await bcrypt.hash('123456', 10);
  const aluno = await prisma.user.create({
    data: {
      name: 'João Aluno',
      email: 'aluno@rollflow.com',
      password: alunoPassword,
      role: 'ALUNO',
      beltColor: 'BRANCA',
      beltDegree: 1,
      academyId: academy.id,
    },
  });
  console.log('✅ Aluno criado:', aluno.email);

  // 4. Criar uma Turma
  const class1 = await prisma.class.create({
    data: {
      name: 'Iniciantes (Adulto)',
      description: 'Fundamentos do Jiu-Jitsu',
      dayOfWeek: 'Segunda a Sexta',
      startTime: '19:00',
      endTime: '20:30',
      academyId: academy.id,
    },
  });
  console.log('✅ Turma criada:', class1.name);

  // 5. Matricular aluno na turma
  await prisma.enrollment.create({
    data: {
      studentId: aluno.id,
      classId: class1.id,
    },
  });
  console.log('✅ Aluno matriculado na turma');

  // 6. Criar regra de progressão para faixa branca (para testes de % mais fáceis)
  await prisma.progressionRule.create({
    data: {
      academyId: academy.id,
      beltColor: 'BRANCA',
      minAttendanceCount: 10,
      minMonths: 3,
      minEvaluationScore: 3,
      requiresEvaluation: true,
    }
  });
  console.log('✅ Regra de progressão (Faixa Branca) criada');

  console.log('\nSeed finalizado com sucesso!');
  console.log('Credenciais para teste:');
  console.log('--------------------------------');
  console.log('Mestre/Admin : mestre@rollflow.com / 123456');
  console.log('Aluno        : aluno@rollflow.com / 123456');
  console.log('--------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
