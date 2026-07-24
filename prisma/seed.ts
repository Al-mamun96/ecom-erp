import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Plans from docs/PLAN.md (order-metered). Prices in BDT/month.
const plans = [
  { name: "Trial", slug: "trial", orderLimit: 50, price: 0, features: { pdf_reports: false } },
  { name: "Starter", slug: "starter", orderLimit: 500, price: 800, features: { pdf_reports: true } },
  { name: "Growth", slug: "growth", orderLimit: 1500, price: 1500, features: { pdf_reports: true, extra_couriers: true } },
  { name: "Business", slug: "business", orderLimit: 2000, price: 2500, features: { pdf_reports: true, extra_couriers: true, staff_seats: true } },
];

async function main() {
  for (const p of plans) {
    await prisma.plan.upsert({
      where: { slug: p.slug },
      update: { name: p.name, orderLimit: p.orderLimit, price: p.price, features: p.features },
      create: p,
    });
  }
  console.log(`Seeded ${plans.length} plans.`);

  // Super-admin (from env, optional). businessId stays null.
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    await prisma.user.upsert({
      where: { email: email.toLowerCase() },
      update: { role: "SUPER_ADMIN" },
      create: {
        email: email.toLowerCase(),
        name: "Super Admin",
        passwordHash: await bcrypt.hash(password, 10),
        role: "SUPER_ADMIN",
      },
    });
    console.log(`Seeded super-admin: ${email}`);
  } else {
    console.log("Skipped super-admin (set ADMIN_EMAIL and ADMIN_PASSWORD to create one).");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
