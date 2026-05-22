import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

async function deleteWithChildren(id: number): Promise<void> {
  const children = await prisma.bomItem.findMany({
    where: { parentId: id },
  });
  for (const child of children) {
    await deleteWithChildren(child.id);
  }
  await prisma.bomItem.delete({ where: { id } });
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
  const itemId = parseInt(id);

  const item = await prisma.bomItem.findUnique({
    where: { id: itemId },
  });
  if (!item) {
    return NextResponse.json({ error: "BOM项不存在" }, { status: 404 });
  }

  await deleteWithChildren(itemId);

  return NextResponse.json({ success: true });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const itemId = parseInt(id);

  const item = await prisma.bomItem.findUnique({
    where: { id: itemId },
  });
  if (!item) {
    return NextResponse.json({ error: "BOM项不存在" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { quantity, unit, notes } = body;

    const updated = await prisma.bomItem.update({
      where: { id: itemId },
      data: {
        ...(quantity !== undefined && { quantity: parseFloat(quantity) }),
        ...(unit !== undefined && { unit }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update BOM item error:", error);
    return NextResponse.json({ error: "更新BOM项失败" }, { status: 500 });
  }
}
