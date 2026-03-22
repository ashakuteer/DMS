import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@asha.org';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`User ${email} already exists — skipping.`);
    return;
  }

  const hashed = await bcrypt.hash('Admin@123', 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      name: 'Admin',
      role: Role.ADMIN,
      isActive: true,
    },
  });

  console.log(`Created admin user: ${user.email} (id: ${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
