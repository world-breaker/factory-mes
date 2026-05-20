import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number) {
  const now = Date.now();
  const offset = Math.random() * daysAgo * 24 * 60 * 60 * 1000;
  return new Date(now - offset);
}

function randomDateBetween(hoursMin: number, hoursMax: number) {
  const now = Date.now();
  const offset =
    randomInt(hoursMin, hoursMax) * 60 * 60 * 1000;
  return new Date(now - offset);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const statusLabels = [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
];
const priorityLabels = ["low", "normal", "high", "urgent"];
const defectTypes = [
  "尺寸偏差",
  "表面划伤",
  "变形",
  "焊接缺陷",
  "涂层不良",
  "装配错误",
  "毛刺",
  "其他",
];

async function main() {
  console.log("🌱 Generating random test data...\n");

  // Read existing data
  const [users, products, lines, materials] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true, role: true } }),
    prisma.product.findMany({ where: { active: true } }),
    prisma.productionLine.findMany({ where: { active: true } }),
    prisma.material.findMany({ where: { active: true } }),
  ]);

  console.log(
    `  Found: ${users.length} users, ${products.length} products, ${lines.length} lines, ${materials.length} materials\n`
  );

  if (products.length === 0) {
    console.log("  ❌ No products found, run prisma seed first");
    return;
  }

  const operators = users.filter((u) => u.role === "operator");
  const admin = users.find((u) => u.role === "admin") || users[0];
  const supervisor =
    users.find((u) => u.role === "supervisor") || users[0];

  // ── Helper: create work order ──
  async function createWorkOrder(
    status: string,
    daysAgo: number
  ): Promise<number> {
    const product = pickRandom(products);
    const line = lines.length > 0 ? pickRandom(lines) : null;
    const createdDate = randomDate(daysAgo);
    const qty = randomInt(20, 500);
    const doneQty =
      status === "completed"
        ? qty
        : status === "in_progress"
        ? randomInt(Math.floor(qty * 0.3), Math.floor(qty * 0.9))
        : 0;
    const defectQty =
      doneQty > 0 ? randomInt(0, Math.floor(doneQty * 0.05)) : 0;
    const priority = pickRandom(priorityLabels);
    const dueDate = new Date(createdDate);
    dueDate.setDate(dueDate.getDate() + randomInt(3, 14));

    // Generate order number with timestamp to avoid duplicates
    const dateStr = createdDate.toISOString().slice(0, 10).replace(/-/g, "");
    const ts = Date.now().toString(36).slice(-4).toUpperCase();
    const rand = String(randomInt(10, 99));
    const orderNo = `WO-${dateStr}-${ts}${rand}`;

    const completedAt =
      status === "completed" ? randomDate(1) : null;

    const wo = await prisma.workOrder.create({
      data: {
        orderNo,
        productId: product.id,
        quantity: qty,
        quantityDone: doneQty,
        quantityDefect: defectQty,
        status,
        priority,
        dueDate,
        createdById: admin.id,
        assignedLineId: line?.id ?? null,
        completedAt,
        createdAt: createdDate,
      },
    });

    // ── Create process steps ──
    const template = await prisma.processTemplate.findFirst({
      where: { productId: product.id, active: true },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });

    if (template && template.steps.length > 0) {
      let lastStatus = status === "completed" ? "completed" : "pending";
      for (const step of template.steps) {
        const stepStatus =
          status === "completed"
            ? "completed"
            : status === "in_progress"
            ? Math.random() > 0.3
              ? "completed"
              : "in_progress"
            : "pending";
        await prisma.workOrderProcess.create({
          data: {
            workOrderId: wo.id,
            stepId: step.id,
            stepOrder: step.stepOrder,
            stepName: step.name,
            status: stepStatus,
            operatorId: pickRandom(operators).id,
            startedAt: stepStatus !== "pending" ? randomDate(2) : null,
            completedAt:
              stepStatus === "completed" ? randomDate(1) : null,
          },
        });
      }
    } else {
      // Default steps if no template
      const defaultSteps = ["下料", "成型", "焊接", "打磨", "表面处理", "组装", "检验包装"];
      for (let i = 0; i < defaultSteps.length; i++) {
        const stepStatus =
          status === "completed"
            ? "completed"
            : status === "in_progress"
            ? i < 3
              ? "completed"
              : i === 3
              ? "in_progress"
              : "pending"
            : "pending";
        await prisma.workOrderProcess.create({
          data: {
            workOrderId: wo.id,
            stepOrder: i + 1,
            stepName: defaultSteps[i],
            status: stepStatus,
            operatorId: stepStatus !== "pending" ? pickRandom(operators).id : null,
            startedAt: stepStatus !== "pending" ? randomDate(2) : null,
            completedAt: stepStatus === "completed" ? randomDate(1) : null,
          },
        });
      }
    }

    // ── Create production records for completed/in_progress ──
    if (status !== "pending") {
      const recordCount = status === "completed" ? randomInt(2, 4) : randomInt(1, 2);
      let remainingGood = doneQty;
      let remainingDefect = defectQty;
      for (let i = 0; i < recordCount; i++) {
        const isLast = i === recordCount - 1;
        const good = isLast
          ? remainingGood
          : randomInt(0, Math.floor(remainingGood / (recordCount - i)));
        const defect = isLast
          ? remainingDefect
          : randomInt(0, Math.floor(remainingDefect / (recordCount - i)));
        remainingGood -= good;
        remainingDefect -= defect;

        if (good > 0 || defect > 0) {
          await prisma.productionRecord.create({
            data: {
              workOrderId: wo.id,
              operatorId: pickRandom(operators).id,
              quantityGood: good,
              quantityDefect: defect,
              startTime: randomDateBetween(24 * daysAgo, 0),
              endTime: randomDate(1),
              createdAt: randomDate(1),
            },
          });
        }
      }
    }

    // ── Create quality records for completed/in_progress ──
    if (status !== "pending") {
      const qcCount = status === "completed" ? randomInt(2, 4) : randomInt(1, 2);
      for (let i = 0; i < qcCount; i++) {
        const isPass = Math.random() < 0.85;
        await prisma.qualityRecord.create({
          data: {
            workOrderId: wo.id,
            inspectorId: pickRandom([...operators, supervisor]).id,
            result: isPass ? "pass" : "fail",
            defectType: isPass ? null : pickRandom(defectTypes),
            defectQty: isPass ? 0 : randomInt(1, Math.max(1, Math.floor(defectQty / 2) || 1)),
            defectDesc: isPass ? null : pickRandom(["表面有轻微划痕", "尺寸偏差超出公差", "焊接不饱满", "变形超标"]),
            createdAt: randomDate(2),
          },
        });
      }
    }

    return wo.id;
  }

  // ── Seed Work Orders ──
  console.log("  📋 Creating work orders...");
  const completedCount = 4;
  const inProgressCount = 3;
  const pendingCount = 3;
  const cancelledCount = 1;

  const completedIds: number[] = [];
  for (let i = 0; i < completedCount; i++) {
    const id = await createWorkOrder("completed", 6);
    completedIds.push(id);
    console.log(`    ✅ Completed WO #${id}`);
  }

  const inProgressIds: number[] = [];
  for (let i = 0; i < inProgressCount; i++) {
    const id = await createWorkOrder("in_progress", 3);
    inProgressIds.push(id);
    console.log(`    🔄 In-progress WO #${id}`);
  }

  for (let i = 0; i < pendingCount; i++) {
    const id = await createWorkOrder("pending", 2);
    console.log(`    ⏳ Pending WO #${id}`);
  }

  for (let i = 0; i < cancelledCount; i++) {
    const id = await createWorkOrder("cancelled", 5);
    console.log(`    ❌ Cancelled WO #${id}`);
  }

  // ── Seed Material Records ──
  console.log("\n  📦 Creating material records...");
  for (let i = 0; i < 8; i++) {
    const material = pickRandom(materials);
    const isIn = Math.random() > 0.4;
    const qty = randomInt(10, 200);
    const woId =
      !isIn && inProgressIds.length > 0
        ? pickRandom(inProgressIds)
        : null;

    await prisma.materialRecord.create({
      data: {
        materialId: material.id,
        type: isIn ? "in" : "out",
        quantity: qty,
        batchNo: `BATCH-${randomInt(1000, 9999)}`,
        workOrderId: woId,
        operatorId: pickRandom(operators).id,
        notes: isIn ? "采购入库" : "生产领料",
        createdAt: randomDate(7),
      },
    });

    // Also update inventory
    if (isIn) {
      const inv = await prisma.inventory.findFirst({
        where: { materialId: material.id },
      });
      if (inv) {
        await prisma.inventory.update({
          where: { id: inv.id },
          data: { quantity: { increment: qty } },
        });
      }
    } else {
      const inv = await prisma.inventory.findFirst({
        where: { materialId: material.id },
      });
      if (inv) {
        await prisma.inventory.update({
          where: { id: inv.id },
          data: {
            quantity: { decrement: qty },
          },
        });
      }
    }
    console.log(`    ${isIn ? "📥" : "📤"} Material #${material.id} x${qty}`);
  }

  // ── Create a couple extra quality records ──
  console.log("\n  🔬 Creating extra quality records...");
  const allActiveOrders = await prisma.workOrder.findMany({
    where: { status: { in: ["in_progress", "completed"] } },
    take: 5,
  });
  for (const wo of allActiveOrders) {
    const isPass = Math.random() < 0.9;
    await prisma.qualityRecord.create({
      data: {
        workOrderId: wo.id,
        inspectorId: pickRandom(operators).id,
        result: isPass ? "pass" : "fail",
        defectType: isPass ? null : pickRandom(defectTypes),
        defectQty: isPass ? 0 : randomInt(1, 5),
        createdAt: randomDate(1),
      },
    });
  }
  console.log(`    Created ${allActiveOrders.length} extra records`);

  // ── Stats ──
  const [
    totalOrders,
    totalProdRecords,
    totalQualityRecords,
    totalMatRecords,
  ] = await Promise.all([
    prisma.workOrder.count(),
    prisma.productionRecord.count(),
    prisma.qualityRecord.count(),
    prisma.materialRecord.count(),
  ]);

  console.log(`\n✅ Seeding complete!
  ┌─────────────────────┬───────┐
  │ Work Orders         │ ${String(totalOrders).padStart(4)} │
  │ Production Records  │ ${String(totalProdRecords).padStart(4)} │
  │ Quality Records     │ ${String(totalQualityRecords).padStart(4)} │
  │ Material Records    │ ${String(totalMatRecords).padStart(4)} │
  └─────────────────────┴───────┘`);
}

// Run directly: npx tsx prisma/seed-data.ts
const isDirectRun = require.main === module;
if (isDirectRun) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

export { main as seedDataMain };
