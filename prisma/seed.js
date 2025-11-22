// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  // 1. Create default Admin user
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: 'Admin',
    },
  });

  // 2. Create default Manager user
  await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: { password: hashedPassword },
    create: {
      email: 'manager@example.com',
      password: hashedPassword,
      firstName: 'Project',
      lastName: 'Manager',
      role: 'Manager',
    },
  });
  
  // 3. Create default Regular User
  await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: { password: hashedPassword },
    create: {
      email: 'user@example.com',
      password: hashedPassword,
      firstName: 'Team',
      lastName: 'User',
      role: 'User',
    },
  });

  console.log('Seeding complete. Admin, Manager, and User roles created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });