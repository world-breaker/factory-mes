import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const processId = parseInt(id);

    const updateData: any = {};
    if (body.status) {
      updateData.status = body.status;
      if (body.status === "in_progress") updateData.startedAt = new Date();
      if (body.status === "completed") updateData.completedAt = new Date();
    }
    if (body.operatorId) updateData.operatorId = parseInt(body.operatorId);
    else if (body.status) updateData.operatorId = parseInt(session.user.id);
    if (body.notes !== undefined) updateData.notes = body.notes;

    const process = await prisma.workOrderProcess.update({
      where: { id: processId },
      data: updateData,
    });

    // Check if all steps completed -> update work order status
    if (body.status === "completed") {
      const workOrder = await prisma.workOrder.findUnique({
        where: { id: process.workOrderId },
        include: { processes: true },
      });

      if (workOrder && workOrder.processes.every((p) => p.status === "completed")) {
        await prisma.workOrder.update({
          where: { id: workOrder.id },
          data: { status: "completed", completedAt: new Date() },
        });
      } else if (workOrder && workOrder.status === "pending") {
        await prisma.workOrder.update({
          where: { id: workOrder.id },
          data: { status: "in_progress" },
        });
      }
    }

    return NextResponse.json(process);
  } catch (error) {
    console.error("Process update error:", error);
    return NextResponse.json({ error: "更新工序失败" }, { status: 500 });
  }
}
