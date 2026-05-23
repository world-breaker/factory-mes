import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// ---------- env loader ----------
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}
// ---------------------------------

const url = process.env.DATABASE_URL || "";
const isPg = url.startsWith("postgresql://") || url.startsWith("postgres://");

const tmpDir = path.resolve(__dirname, ".tmp-client");
const prodSchemaPath = path.resolve(__dirname, "schema.cleanup.prisma");

let PrismaClient: any;

if (isPg) {
  console.log(`  🔍 Detected PostgreSQL, generating temporary client...`);

  // Generate temp schema with postgresql provider + custom output
  const origSchema = fs.readFileSync(path.resolve(__dirname, "schema.prisma"), "utf-8");
  const prodSchema = origSchema
    .replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"')
    .replace(
      /^(generator client\s*\{[^}]*?provider\s*=\s*"prisma-client-js")/m,
      `$1\n  output = "../prisma/.tmp-client"`
    );
  fs.writeFileSync(prodSchemaPath, prodSchema);

  // Clean previous tmp dir
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });

  // Generate Prisma client for PostgreSQL to custom output
  execSync(`npx prisma generate --schema="${prodSchemaPath}"`, {
    cwd: path.resolve(__dirname, ".."),
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: url },
  });

  PrismaClient = require(tmpDir).PrismaClient;
} else {
  PrismaClient = require("@prisma/client").PrismaClient;
}

const prisma = new PrismaClient({
  datasources: { db: { url } },
});

async function main() {
  console.log("🧹 清理随机测试数据...\n");

  const steps = [
    { name: "质检记录", fn: () => prisma.qualityRecord.deleteMany() },
    { name: "生产报工记录", fn: () => prisma.productionRecord.deleteMany() },
    { name: "物料出入库记录", fn: () => prisma.materialRecord.deleteMany() },
    { name: "工单工序", fn: () => prisma.workOrderProcess.deleteMany() },
    { name: "工单", fn: () => prisma.workOrder.deleteMany() },
    { name: "重置库存为默认值", fn: () => prisma.inventory.deleteMany() },
  ];

  for (const step of steps) {
    const result = await step.fn();
    console.log(`  ✅ 已删除 ${result.count} 条${step.name}`);
  }

  // Re-initialize inventory
  const materials = await prisma.material.findMany({ select: { id: true, code: true } });
  for (const m of materials) {
    await prisma.inventory.create({
      data: { materialId: m.id, quantity: 100, location: "A区-01" },
    });
  }
  console.log(`  ✅ 已重置 ${materials.length} 条库存记录`);

  console.log("\n✅ 清理完成！");
}

main()
  .catch((e: any) => {
    console.error("❌ 清理失败:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
    // Cleanup temp files
    try { if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true }); } catch {}
    try { if (fs.existsSync(prodSchemaPath)) fs.unlinkSync(prodSchemaPath); } catch {}
  });
