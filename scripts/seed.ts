import { PrismaClient } from '@prisma/client';
import { subDays } from 'date-fns';

const prisma = new PrismaClient();

async function seed() {
  // Clear existing data
  await prisma.subscription.deleteMany();
  await prisma.customer.deleteMany();

  // Create test customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        email: 'customer1@test.com',
        stripeId: 'cus_test1',
      },
    }),
    prisma.customer.create({
      data: {
        email: 'customer2@test.com',
        stripeId: 'cus_test2',
      },
    }),
  ]);

  // Create test subscriptions
  await Promise.all(
    customers.map((customer) =>
      prisma.subscription.create({
        data: {
          stripeId: `sub_${customer.id}`,
          customerId: customer.id,
          status: 'active',
          amount: 99.99,
          startDate: subDays(new Date(), 30),
        },
      })
    )
  );

  console.log('Database seeded!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 