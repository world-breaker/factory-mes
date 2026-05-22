import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workTypes = await prisma.workType.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true, workOrders: true } },
    },
  });

  return NextResponse.json(workTypes);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, code, description } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: "名称和编码为必填项" },
        { status: 400 }
      );
    }

    // Check if name or code already exists
    const existing = await prisma.workType.findFirst({
      where: { OR: [{ name }, { code }] },
    });
    if (existing) {
      return NextResponse.json(
        { error: "工种名称或编码已存在" },
        { status: 400 }
      );
    }

    const workType = await prisma.workType.create({
      data: { name, code, description },
    });

    return NextResponse.json(workType, { status: 201 });
  } catch (error) {
    console.error("Create work type error:", error);
    return NextResponse.json({ error: "创建工种失败" }, { status: 500 });
  }
}
