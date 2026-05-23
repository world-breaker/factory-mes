import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 清理随机测试数据...\n");

  // Delete in reverse dependency order
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

  console.log("\n✅ 清理完成！现在数据库只有基础数据（用户/工种/产线/产品/物料/工艺模板）。");
}

main()
  .catch((e) => {
    console.error("❌ 清理失败:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
