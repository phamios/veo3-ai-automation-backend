import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Seed packages
  const packages = [
    {
      name: '1 Month',
      slug: '1-month',
      description: 'Basic package for 1 month',
      durationMonths: 1,
      originalPrice: 499000,
      salePrice: 499000,
      discountPercent: 0,
      features: ['30 videos/month', 'Basic support', '1 device'],
      videosPerMonth: 30,
      keywordsTracking: 10,
      apiCallsPerMonth: 100,
      maxDevices: 1,
      isPopular: false,
      sortOrder: 1,
    },
    {
      name: '2 Months',
      slug: '2-months',
      description: 'Standard package for 2 months',
      durationMonths: 2,
      originalPrice: 998000,
      salePrice: 899000,
      discountPercent: 10,
      features: ['100 videos/month', 'Email support', '1 device'],
      videosPerMonth: 100,
      keywordsTracking: 25,
      apiCallsPerMonth: 500,
      maxDevices: 1,
      isPopular: false,
      sortOrder: 2,
    },
    {
      name: '3 Months',
      slug: '3-months',
      description: 'Popular package for 3 months',
      durationMonths: 3,
      originalPrice: 1497000,
      salePrice: 1199000,
      discountPercent: 20,
      features: ['150 videos/month', '24/7 support', '2 devices', 'Priority queue'],
      videosPerMonth: 150,
      keywordsTracking: 50,
      apiCallsPerMonth: 1000,
      maxDevices: 2,
      isPopular: true,
      sortOrder: 3,
    },
    {
      name: '6 Months',
      slug: '6-months',
      description: 'Pro package for 6 months',
      durationMonths: 6,
      originalPrice: 2994000,
      salePrice: 2099000,
      discountPercent: 30,
      features: ['300 videos/month', '24/7 support', '2 devices', 'Priority queue', 'API access'],
      videosPerMonth: 300,
      keywordsTracking: 100,
      apiCallsPerMonth: 5000,
      maxDevices: 2,
      isPopular: false,
      sortOrder: 4,
    },
    {
      name: '12 Months',
      slug: '12-months',
      description: 'Enterprise package for 1 year',
      durationMonths: 12,
      originalPrice: 5988000,
      salePrice: 3599000,
      discountPercent: 40,
      features: ['Unlimited videos', '24/7 priority support', '3 devices', 'API access', 'Custom features'],
      videosPerMonth: 0, // 0 = unlimited
      keywordsTracking: 500,
      apiCallsPerMonth: 0, // 0 = unlimited
      maxDevices: 3,
      isPopular: false,
      sortOrder: 5,
    },
  ];

  for (const pkg of packages) {
    await prisma.package.upsert({
      where: { slug: pkg.slug },
      update: pkg,
      create: pkg,
    });
  }
  console.log(`Seeded ${packages.length} packages`);

  // Seed admin user
  const adminPassword = await bcrypt.hash('Admin@123456', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@veo3ai.com' },
    update: {
      password: adminPassword,
      name: 'Administrator',
      role: 'ADMIN',
      isEmailVerified: true,
    },
    create: {
      email: 'admin@veo3ai.com',
      password: adminPassword,
      name: 'Administrator',
      role: 'ADMIN',
      isEmailVerified: true,
    },
  });
  console.log(`Seeded admin user: ${admin.email}`);

  // Seed test user (optional)
  const testPassword = await bcrypt.hash('Test@123456', 10);
  const testUser = await prisma.user.upsert({
    where: { email: 'test@veo3ai.com' },
    update: {
      password: testPassword,
      name: 'Test User',
      role: 'USER',
      isEmailVerified: true,
    },
    create: {
      email: 'test@veo3ai.com',
      password: testPassword,
      name: 'Test User',
      role: 'USER',
      isEmailVerified: true,
    },
  });
  console.log(`Seeded test user: ${testUser.email}`);

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
