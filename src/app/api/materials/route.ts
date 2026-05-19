import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const materials = await prisma.material.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(materials);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, code, specification, unit, category, minStock } = body;

    if (!name || !code) {
      return NextResponse.json({ error: "名称和编码为必填项" }, { status: 400 });
    }

    const existing = await prisma.material.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: "物料编码已存在" }, { status: 400 });
    }

    const material = await prisma.material.create({
      data: {
        name,
        code,
        specification,
        unit: unit || "个",
        category: category || null,
        minStock: minStock ? parseFloat(minStock) : 0,
      },
    });

    // Auto-create inventory entry
    await prisma.inventory.create({
      data: { materialId: material.id, quantity: 0 },
    });

    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    console.error("Create material error:", error);
    return NextResponse.json({ error: "创建物料失败" }, { status: 500 });
  }
}
