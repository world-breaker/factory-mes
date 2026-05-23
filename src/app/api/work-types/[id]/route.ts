import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const workTypeId = parseInt(id);
  const url = new URL(request.url);
  const hard = url.searchParams.get("hard") === "true";

  const workType = await prisma.workType.findUnique({
    where: { id: workTypeId },
  });
  if (!workType) {
    return NextResponse.json({ error: "工种不存在" }, { status: 404 });
  }

  if (hard) {
    // Force hard delete — unassign users first, then delete
    await prisma.$transaction([
      prisma.user.updateMany({ where: { workTypeId }, data: { workTypeId: null } }),
      prisma.workOrder.updateMany({ where: { workTypeId }, data: { workTypeId: null } }),
      prisma.workType.delete({ where: { id: workTypeId } }),
    ]);
    return NextResponse.json({ success: true, deleted: true });
  }

  // Check if work type has users assigned
  const userCount = await prisma.user.count({ where: { workTypeId } });

  if (userCount > 0) {
    await prisma.workType.update({
      where: { id: workTypeId },
      data: { active: false },
    });
    return NextResponse.json({
      success: true,
      message: "该工种已有分配用户，已停用",
    });
  }

  await prisma.workType.delete({ where: { id: workTypeId } });
  return NextResponse.json({ success: true });
}
