import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const materialId = parseInt(id);

  const material = await prisma.material.findUnique({
    where: { id: materialId },
  });
  if (!material) {
    return NextResponse.json({ error: "物料不存在" }, { status: 404 });
  }

  // Soft delete
  await prisma.material.update({
    where: { id: materialId },
    data: { active: false },
  });

  // Zero out inventory
  await prisma.inventory.updateMany({
    where: { materialId },
    data: { quantity: 0 },
  });

  return NextResponse.json({ success: true });
}
