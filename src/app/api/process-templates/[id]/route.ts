import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const templateId = parseInt(id);

  const template = await prisma.processTemplate.findUnique({
    where: { id: templateId },
    include: {
      product: { select: { id: true, name: true, code: true } },
      steps: { orderBy: { stepOrder: "asc" } },
    },
  });

  if (!template) {
    return NextResponse.json({ error: "工艺模板不存在" }, { status: 404 });
  }

  return NextResponse.json(template);
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
  const templateId = parseInt(id);

  try {
    const body = await request.json();
    const { name, description, productId, steps } = body;

    if (!name) {
      return NextResponse.json(
        { error: "模板名称为必填项" },
        { status: 400 }
      );
    }

    // Delete old steps and create new ones in a transaction
    const template = await prisma.$transaction(async (tx) => {
      await tx.processStep.deleteMany({ where: { templateId } });

      return tx.processTemplate.update({
        where: { id: templateId },
        data: {
          name,
          description,
          productId: productId ? parseInt(productId) : null,
          steps: {
            create: (steps || []).map(
              (
                s: {
                  name: string;
                  description?: string;
                  durationMinutes?: number;
                  qualityCheckRequired?: boolean;
                },
                idx: number
              ) => ({
                stepOrder: idx + 1,
                name: s.name,
                description: s.description || null,
                durationMinutes: s.durationMinutes ? parseInt(s.durationMinutes as any) : null,
                qualityCheckRequired: s.qualityCheckRequired || false,
              })
            ),
          },
        },
        include: {
          product: { select: { id: true, name: true, code: true } },
          steps: { orderBy: { stepOrder: "asc" } },
        },
      });
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Update template error:", error);
    return NextResponse.json({ error: "更新工艺模板失败" }, { status: 500 });
  }
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
  const templateId = parseInt(id);
  const url = new URL(request.url);
  const hard = url.searchParams.get("hard") === "true";

  const template = await prisma.processTemplate.findUnique({
    where: { id: templateId },
    include: { _count: { select: { steps: true } } },
  });
  if (!template) {
    return NextResponse.json({ error: "工艺模板不存在" }, { status: 404 });
  }

  if (hard) {
    await prisma.$transaction([
      prisma.processStep.deleteMany({ where: { templateId } }),
      prisma.processTemplate.delete({ where: { id: templateId } }),
    ]);
    return NextResponse.json({ success: true, deleted: true });
  }

  // Soft delete
  await prisma.processTemplate.update({
    where: { id: templateId },
    data: { active: false },
  });

  return NextResponse.json({ success: true });
}
