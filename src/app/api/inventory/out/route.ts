import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { materialId, quantity, batchNo, workOrderId, notes } = body;

    if (!materialId || !quantity) {
      return NextResponse.json({ error: "物料和数量为必填项" }, { status: 400 });
    }

    const qty = parseFloat(quantity);
    const matId = parseInt(materialId);

    // Check inventory — sum all entries for this material (ignore batchNo)
    const allInv = await prisma.inventory.findMany({
      where: { materialId: matId },
    });
    const totalQty = allInv.reduce((sum, inv) => sum + inv.quantity, 0);

    if (totalQty < qty) {
      return NextResponse.json({ error: "库存不足" }, { status: 400 });
    }

    // Create record (batchNo recorded here, not on inventory)
    await prisma.materialRecord.create({
      data: {
        materialId: matId,
        type: "out",
        quantity: qty,
        batchNo: batchNo || null,
        workOrderId: workOrderId ? parseInt(workOrderId) : null,
        operatorId: parseInt(session.user.id),
        notes: notes || null,
      },
    });

    // Deduct from first inventory entry
    await prisma.inventory.update({
      where: { id: allInv[0].id },
      data: { quantity: { decrement: qty } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Stock out error:", error);
    return NextResponse.json({ error: "出库失败" }, { status: 500 });
  }
}
