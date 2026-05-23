import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.workOrder.findUnique({
    where: { id: parseInt(id) },
    include: {
      product: true,
      assignedLine: true,
      creator: { select: { id: true, name: true } },
      processes: {
        orderBy: { stepOrder: "asc" },
        include: { operator: { select: { id: true, name: true } } },
      },
      prodRecords: {
        include: { operator: { select: { id: true, name: true } }, process: true },
        orderBy: { createdAt: "desc" },
      },
      qualityRecords: {
        include: { inspector: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) return NextResponse.json({ error: "工单不存在" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const updateData: any = {};
  if (body.status) updateData.status = body.status;
  if (body.assignedLineId) updateData.assignedLineId = parseInt(body.assignedLineId);
  if (body.priority) updateData.priority = body.priority;
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.status === "completed") updateData.completedAt = new Date();

  const order = await prisma.workOrder.update({
    where: { id: parseInt(id) },
    data: updateData,
  });

  return NextResponse.json(order);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const orderId = parseInt(id);
  const url = new URL(request.url);
  const hard = url.searchParams.get("hard") === "true";

  if (hard) {
    // Hard delete: cascade delete related records, then the work order itself
    await prisma.$transaction([
      prisma.qualityRecord.deleteMany({ where: { workOrderId: orderId } }),
      prisma.productionRecord.deleteMany({ where: { workOrderId: orderId } }),
      prisma.materialRecord.deleteMany({ where: { workOrderId: orderId } }),
      prisma.workOrderProcess.deleteMany({ where: { workOrderId: orderId } }),
      prisma.workOrder.delete({ where: { id: orderId } }),
    ]);
    return NextResponse.json({ success: true, deleted: true });
  }

  // Soft delete: mark as cancelled
  await prisma.workOrder.update({
    where: { id: orderId },
    data: { status: "cancelled" },
  });
  return NextResponse.json({ success: true });
}
