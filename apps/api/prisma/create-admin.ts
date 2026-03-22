import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@ashakuteer.org';
  const plainPassword = 'Admin@123';
  const name = 'System Admin';

  console.log(`Ensuring admin user: ${email}`);

  const hashed = await bcrypt.hash(plainPassword, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashed,
      name,
      role: Role.ADMIN,
      isActive: true,
    },
    create: {
      email,
      password: hashed,
      name,
      role: Role.ADMIN,
      isActive: true,
    },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });

  console.log('Done:', JSON.stringify(user, null, 2));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
