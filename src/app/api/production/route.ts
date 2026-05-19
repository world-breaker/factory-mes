import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const lineId = searchParams.get("lineId");
  const status = searchParams.get("status") || "in_progress";

  const where: any = { status };
  if (lineId) where.assignedLineId = parseInt(lineId);

  const orders = await prisma.workOrder.findMany({
    where,
    include: {
      product: true,
      assignedLine: true,
      processes: { orderBy: { stepOrder: "asc" } },
    },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { workOrderId, processId, quantityGood, quantityDefect, notes } = body;

    if (!workOrderId) {
      return NextResponse.json({ error: "工单ID为必填项" }, { status: 400 });
    }

    // Create production record
    const record = await prisma.productionRecord.create({
      data: {
        workOrderId: parseInt(workOrderId),
        processId: processId ? parseInt(processId) : null,
        operatorId: parseInt(session.user.id),
        quantityGood: parseInt(quantityGood || "0"),
        quantityDefect: parseInt(quantityDefect || "0"),
        notes,
        startTime: body.startTime ? new Date(body.startTime) : undefined,
        endTime: body.endTime ? new Date(body.endTime) : new Date(),
      },
    });

    // Update work order quantities
    await prisma.workOrder.update({
      where: { id: parseInt(workOrderId) },
      data: {
        quantityDone: { increment: parseInt(quantityGood || "0") },
        quantityDefect: { increment: parseInt(quantityDefect || "0") },
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Production report error:", error);
    return NextResponse.json({ error: "报工失败" }, { status: 500 });
  }
}
