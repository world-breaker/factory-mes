import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const workOrderId = searchParams.get("workOrderId");
  const result = searchParams.get("result");

  const where: any = {};
  if (workOrderId) where.workOrderId = parseInt(workOrderId);
  if (result) where.result = result;

  const records = await prisma.qualityRecord.findMany({
    where,
    include: {
      workOrder: { select: { orderNo: true, product: { select: { name: true } } } },
      inspector: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(records);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { workOrderId, processId, checkpointId, result, defectType, defectQty, defectDesc } = body;

    if (!workOrderId) {
      return NextResponse.json({ error: "工单ID为必填项" }, { status: 400 });
    }

    const record = await prisma.qualityRecord.create({
      data: {
        workOrderId: parseInt(workOrderId),
        processId: processId ? parseInt(processId) : null,
        checkpointId: checkpointId ? parseInt(checkpointId) : null,
        inspectorId: parseInt(session.user.id),
        result: result || "pass",
        defectType: defectType || null,
        defectQty: defectQty ? parseInt(defectQty) : 0,
        defectDesc: defectDesc || null,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Create quality record error:", error);
    return NextResponse.json({ error: "创建质检记录失败" }, { status: 500 });
  }
}
