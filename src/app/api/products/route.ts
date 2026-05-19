import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, code, specification, unit, material } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: "名称和编码为必填项" },
        { status: 400 }
      );
    }

    const existing = await prisma.product.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json(
        { error: "产品编码已存在" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: { name, code, specification, unit: unit || "个", material },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json({ error: "创建产品失败" }, { status: 500 });
  }
}
