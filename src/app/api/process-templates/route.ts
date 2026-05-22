import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const templates = await prisma.processTemplate.findMany({
    include: {
      product: { select: { id: true, name: true, code: true } },
      _count: { select: { steps: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(templates);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, productId, steps } = body;

    if (!name) {
      return NextResponse.json(
        { error: "模板名称为必填项" },
        { status: 400 }
      );
    }

    const template = await prisma.processTemplate.create({
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

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Create template error:", error);
    return NextResponse.json({ error: "创建工艺模板失败" }, { status: 500 });
  }
}
