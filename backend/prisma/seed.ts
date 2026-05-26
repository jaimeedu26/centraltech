// prisma/seed.ts
// Roda com: npx prisma db seed
// Cria o primeiro usuário admin do sistema

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@centraltech.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@centraltech.com',
      password: senhaHash,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin criado:', admin.email);
  console.log('🔑 Senha inicial: admin123');
  console.log('⚠️  Altere a senha após o primeiro login!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
