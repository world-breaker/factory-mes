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

    // Check inventory
    const inv = await prisma.inventory.findFirst({
      where: { materialId: matId, batchNo: batchNo || undefined },
    });

    if (!inv || inv.quantity < qty) {
      return NextResponse.json({ error: "库存不足" }, { status: 400 });
    }

    // Create record
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

    // Update inventory
    await prisma.inventory.update({
      where: { id: inv.id },
      data: { quantity: { decrement: qty } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Stock out error:", error);
    return NextResponse.json({ error: "出库失败" }, { status: 500 });
  }
}
