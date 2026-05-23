// Vercel build-time cleanup — runs after prisma generate (PostgreSQL client)
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Cleaning up test data on Vercel...");

  // Delete in dependency order (children first)
  await prisma.qualityRecord.deleteMany();
  await prisma.productionRecord.deleteMany();
  await prisma.materialRecord.deleteMany();
  await prisma.workOrderProcess.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.inventory.deleteMany();

  console.log("  ✅ Cleanup done, seed will re-init base data");
}

main()
  .catch((e) => {
    console.error("❌ Cleanup failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
