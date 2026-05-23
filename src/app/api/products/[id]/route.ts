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
  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
    include: {
      _count: { select: { workOrders: true, bomItems: true } },
    },
  });
  if (!product) {
    return NextResponse.json({ error: "产品不存在" }, { status: 404 });
  }

  return NextResponse.json(product);
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
  const productId = parseInt(id);
  const body = await request.json();

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: "产品不存在" }, { status: 404 });
  }

  const data: Record<string, any> = {};
  if (body.active !== undefined) data.active = body.active;
  if (body.name !== undefined) data.name = body.name;
  if (body.specification !== undefined) data.specification = body.specification;
  if (body.unit !== undefined) data.unit = body.unit;

  const updated = await prisma.product.update({
    where: { id: productId },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const productId = parseInt(id);
  const url = new URL(request.url);
  const hard = url.searchParams.get("hard") === "true";

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { _count: { select: { workOrders: true, bomItems: true, templates: true } } },
  });
  if (!product) {
    return NextResponse.json({ error: "产品不存在" }, { status: 404 });
  }

  if (hard) {
    // Hard delete: delete BOM tree, templates with steps, then product
    await prisma.$transaction([
      prisma.bomItem.deleteMany({ where: { productId } }),
      prisma.processStep.deleteMany({ where: { template: { productId } } }),
      prisma.processTemplate.deleteMany({ where: { productId } }),
      prisma.product.delete({ where: { id: productId } }),
    ]);
    return NextResponse.json({ success: true, deleted: true });
  }

  // Soft delete - set active to false
  await prisma.product.update({
    where: { id: productId },
    data: { active: false },
  });

  return NextResponse.json({ success: true });
}
