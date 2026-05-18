import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash("admin1234", 10);

  await prisma.user.upsert({
    where: { email: "admin@library.kh" },
    update: {},
    create: {
      email: "admin@library.kh",
      password,
      nameEn: "Admin",
      nameKh: "អ្នកគ្រប់គ្រង",
      role: "ADMIN",
    },
  });

  console.log("✓ Admin seeded — email: admin@library.kh / password: admin1234");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
