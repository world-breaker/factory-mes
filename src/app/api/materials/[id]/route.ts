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
  const materialId = parseInt(id);
  const url = new URL(request.url);
  const hard = url.searchParams.get("hard") === "true";

  const material = await prisma.material.findUnique({
    where: { id: materialId },
    include: { _count: { select: { inOutRecords: true } } },
  });
  if (!material) {
    return NextResponse.json({ error: "物料不存在" }, { status: 404 });
  }

  if (hard) {
    // Hard delete: delete inventory, material records, then material itself
    await prisma.$transaction([
      prisma.inventory.deleteMany({ where: { materialId } }),
      prisma.materialRecord.deleteMany({ where: { materialId } }),
      prisma.material.delete({ where: { id: materialId } }),
    ]);
    return NextResponse.json({ success: true, deleted: true });
  }

  // Soft delete
  await prisma.material.update({
    where: { id: materialId },
    data: { active: false },
  });

  return NextResponse.json({ success: true });
}
