import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = parseInt(id);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      active: true,
      workTypeId: true,
      assignedLine: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = parseInt(id);

  try {
    const body = await request.json();
    const { name, role, workTypeId, assignedLine, active } = body;

    const data: Record<string, any> = {};
    if (name !== undefined) data.name = name;
    if (role !== undefined) data.role = role;
    if (workTypeId !== undefined) data.workTypeId = workTypeId || null;
    if (assignedLine !== undefined) data.assignedLine = assignedLine || null;
    if (active !== undefined) data.active = active;

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        active: true,
        workTypeId: true,
        assignedLine: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "更新用户失败" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = parseInt(id);

  // Cannot delete yourself
  if (userId === parseInt(session.user.id as string)) {
    return NextResponse.json({ error: "不能删除当前登录用户" }, { status: 400 });
  }

  // Check if user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  // Check if user has related records
  const [workOrderCount, prodRecordCount, qualityRecordCount] =
    await Promise.all([
      prisma.workOrder.count({ where: { createdById: userId } }),
      prisma.productionRecord.count({ where: { operatorId: userId } }),
      prisma.qualityRecord.count({ where: { inspectorId: userId } }),
    ]);

  if (
    workOrderCount > 0 ||
    prodRecordCount > 0 ||
    qualityRecordCount > 0
  ) {
    // Soft disable instead of hard delete
    await prisma.user.update({
      where: { id: userId },
      data: { active: false },
    });
    return NextResponse.json({
      success: true,
      message: "该用户已有业务数据，已禁用账号",
    });
  }

  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ success: true });
}
