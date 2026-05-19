import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const inventory = await prisma.inventory.findMany({
    include: { material: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(inventory);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { materialId, quantity, batchNo, location, notes } = body;

    if (!materialId || !quantity) {
      return NextResponse.json({ error: "物料和数量为必填项" }, { status: 400 });
    }

    const qty = parseFloat(quantity);
    const matId = parseInt(materialId);

    // Create record
    await prisma.materialRecord.create({
      data: {
        materialId: matId,
        type: "in",
        quantity: qty,
        batchNo: batchNo || null,
        operatorId: parseInt(session.user.id),
        notes: notes || null,
      },
    });

    // Update or create inventory
    const existing = await prisma.inventory.findFirst({
      where: { materialId: matId, batchNo: batchNo || undefined },
    });

    if (existing) {
      await prisma.inventory.update({
        where: { id: existing.id },
        data: { quantity: { increment: qty } },
      });
    } else {
      await prisma.inventory.create({
        data: {
          materialId: matId,
          quantity: qty,
          batchNo: batchNo || null,
          location: location || null,
        },
      });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Stock in error:", error);
    return NextResponse.json({ error: "入库失败" }, { status: 500 });
  }
}
