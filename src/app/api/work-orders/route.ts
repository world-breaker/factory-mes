import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const productId = searchParams.get("productId");

  const where: any = {};
  if (status) where.status = status;
  if (productId) where.productId = parseInt(productId);

  const orders = await prisma.workOrder.findMany({
    where,
    include: {
      product: true,
      assignedLine: true,
      creator: { select: { id: true, name: true } },
      _count: { select: { processes: true, prodRecords: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { productId, quantity, priority, dueDate, notes, assignedLineId } = body;

    if (!productId || !quantity) {
      return NextResponse.json({ error: "产品和数量为必填项" }, { status: 400 });
    }

    // Auto-generate order number
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const count = await prisma.workOrder.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    });
    const orderNo = `WO-${today}-${String(count + 1).padStart(3, "0")}`;

    // Create work order
    const workOrder = await prisma.workOrder.create({
      data: {
        orderNo,
        productId: parseInt(productId),
        quantity: parseInt(quantity),
        priority: priority || "normal",
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        assignedLineId: assignedLineId ? parseInt(assignedLineId) : null,
        createdById: parseInt(session.user.id),
      },
    });

    // Auto-create process steps from product's template
    const template = await prisma.processTemplate.findFirst({
      where: { productId: parseInt(productId), active: true },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });

    if (template && template.steps.length > 0) {
      await prisma.workOrderProcess.createMany({
        data: template.steps.map((step) => ({
          workOrderId: workOrder.id,
          stepId: step.id,
          stepOrder: step.stepOrder,
          stepName: step.name,
          status: "pending",
        })),
      });
    }

    return NextResponse.json({ ...workOrder, processesAutoCreated: template ? template.steps.length : 0 }, { status: 201 });
  } catch (error) {
    console.error("Create work order error:", error);
    return NextResponse.json({ error: "创建工单失败" }, { status: 500 });
  }
}
