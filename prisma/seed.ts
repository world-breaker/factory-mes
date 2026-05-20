import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedDataMain } from "./seed-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: adminPassword,
      name: "系统管理员",
      role: "admin",
    },
  });
  console.log(`Created admin user: ${admin.name}`);

  // Create sample users
  const operatorPassword = await bcrypt.hash("123456", 10);
  const users = [
    { username: "zhang3", password: operatorPassword, name: "张三", role: "operator" as const },
    { username: "li4", password: operatorPassword, name: "李四", role: "operator" as const },
    { username: "wang5", password: operatorPassword, name: "王五", role: "operator" as const },
    { username: "supervisor1", password: operatorPassword, name: "赵班长", role: "supervisor" as const },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: u,
    });
  }
  console.log(`Created ${users.length} sample users`);

  // Create production lines
  const lines = [
    { name: "冲压线", code: "LINE01" },
    { name: "焊接线", code: "LINE02" },
    { name: "表面处理线", code: "LINE03" },
    { name: "组装线", code: "LINE04" },
  ];

  for (const line of lines) {
    await prisma.productionLine.upsert({
      where: { code: line.code },
      update: {},
      create: line,
    });
  }
  console.log(`Created ${lines.length} production lines`);

  // Create sample materials
  const materials = [
    { name: "冷轧钢板 (1.5mm)", code: "MAT001", specification: "1.5mm×1250×2500", unit: "张", category: "原材料" },
    { name: "冷轧钢板 (2.0mm)", code: "MAT002", specification: "2.0mm×1250×2500", unit: "张", category: "原材料" },
    { name: "不锈钢板 (0.8mm)", code: "MAT003", specification: "0.8mm×1219×2438", unit: "张", category: "原材料" },
    { name: "镀锌板 (1.0mm)", code: "MAT004", specification: "1.0mm×1250×2500", unit: "张", category: "原材料" },
    { name: "焊丝 (1.2mm)", code: "MAT005", specification: "1.2mm×15kg", unit: "卷", category: "辅料" },
    { name: "防锈漆", code: "MAT006", specification: "18L/桶", unit: "桶", category: "辅料" },
    { name: "螺丝 M6", code: "MAT007", specification: "M6×20", unit: "个", category: "标准件" },
    { name: "螺丝 M8", code: "MAT008", specification: "M8×30", unit: "个", category: "标准件" },
  ];

  for (const m of materials) {
    await prisma.material.upsert({
      where: { code: m.code },
      update: {},
      create: m,
    });
  }
  console.log(`Created ${materials.length} materials`);

  // Initialize inventory with stock
  for (const m of materials) {
    await prisma.inventory.create({
      data: {
        materialId: (await prisma.material.findUnique({ where: { code: m.code } }))!.id,
        quantity: 100,
        location: "A区-01",
      },
    });
  }
  console.log("Initialized inventory");

  // Create sample products
  const products = [
    { name: "设备外壳 (大)", code: "PROD001", specification: "800×600×300mm", material: "冷轧钢板" },
    { name: "设备外壳 (中)", code: "PROD002", specification: "600×400×250mm", material: "冷轧钢板" },
    { name: "设备外壳 (小)", code: "PROD003", specification: "400×300×200mm", material: "不锈钢" },
    { name: "控制箱体", code: "PROD004", specification: "500×400×200mm", material: "镀锌板" },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }
  console.log(`Created ${products.length} products`);

  // Create process templates for first product
  const template = await prisma.processTemplate.create({
    data: {
      name: "外壳加工标准工艺",
      description: "标准外壳钣金加工工艺流程",
      productId: (await prisma.product.findUnique({ where: { code: "PROD001" } }))!.id,
      steps: {
        create: [
          { stepOrder: 1, name: "下料", description: "按照图纸尺寸裁剪板材", durationMinutes: 30, qualityCheckRequired: true },
          { stepOrder: 2, name: "冲压成型", description: "使用冲压模具成型", durationMinutes: 45, qualityCheckRequired: true },
          { stepOrder: 3, name: "焊接", description: "焊接各部件接缝", durationMinutes: 60, qualityCheckRequired: true },
          { stepOrder: 4, name: "打磨", description: "打磨焊缝和毛刺", durationMinutes: 30, qualityCheckRequired: false },
          { stepOrder: 5, name: "表面处理", description: "喷涂防锈漆", durationMinutes: 40, qualityCheckRequired: true },
          { stepOrder: 6, name: "组装", description: "安装配件和紧固件", durationMinutes: 30, qualityCheckRequired: true },
          { stepOrder: 7, name: "终检包装", description: "最终质量检验并包装", durationMinutes: 20, qualityCheckRequired: true },
        ],
      },
    },
  });
  console.log(`Created process template: ${template.name}`);

  console.log("\n🎲 Generating random test data...");
  try {
    await seedDataMain();
    console.log("🎲 Random test data generated successfully!");
  } catch (err) {
    console.warn("⚠️  Seed data generation skipped or failed (non-critical):", (err as Error).message);
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
