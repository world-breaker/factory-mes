import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

type BomItemWithComponent = {
  id: number;
  productId: number;
  parentId: number | null;
  componentType: string;
  componentId: number;
  quantity: number;
  unit: string;
  level: number;
  notes: string | null;
  component?: {
    id: number;
    name: string;
    code: string;
    specification?: string | null;
    unit?: string;
  } | null;
  children: BomItemWithComponent[];
};

function buildTree(items: BomItemWithComponent[]): BomItemWithComponent[] {
  const map = new Map<number, BomItemWithComponent>();
  const roots: BomItemWithComponent[] = [];

  for (const item of items) {
    map.set(item.id, { ...item, children: [] });
  }

  for (const item of items) {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const productId = parseInt(id);

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!product) {
    return NextResponse.json({ error: "产品不存在" }, { status: 404 });
  }

  const bomItems = await prisma.bomItem.findMany({
    where: { productId },
    orderBy: { level: "asc" },
  });

  // Enrich each item with component details
  const enriched: BomItemWithComponent[] = await Promise.all(
    bomItems.map(async (item) => {
      let component: BomItemWithComponent["component"] = null;
      if (item.componentType === "product") {
        const p = await prisma.product.findUnique({
          where: { id: item.componentId },
          select: { id: true, name: true, code: true, specification: true, unit: true },
        });
        component = p;
      } else if (item.componentType === "material") {
        const m = await prisma.material.findUnique({
          where: { id: item.componentId },
          select: { id: true, name: true, code: true, specification: true, unit: true },
        });
        component = m;
      }
      return { ...item, component, children: [] };
    })
  );

  const tree = buildTree(enriched);

  return NextResponse.json({ product, tree });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const productId = parseInt(id);

  try {
    const body = await request.json();
    const { componentType, componentId, quantity, unit, parentId, level, notes } = body;

    // Validate product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return NextResponse.json({ error: "产品不存在" }, { status: 404 });
    }

    // Validate parentId belongs to same product
    if (parentId) {
      const parent = await prisma.bomItem.findUnique({
        where: { id: parseInt(parentId) },
      });
      if (!parent || parent.productId !== productId) {
        return NextResponse.json({ error: "父级BOM项无效" }, { status: 400 });
      }
    }

    // Validate component exists
    if (componentType === "product") {
      const comp = await prisma.product.findUnique({
        where: { id: parseInt(componentId) },
      });
      if (!comp) {
        return NextResponse.json({ error: "子产品不存在" }, { status: 400 });
      }
    } else if (componentType === "material") {
      const comp = await prisma.material.findUnique({
        where: { id: parseInt(componentId) },
      });
      if (!comp) {
        return NextResponse.json({ error: "物料不存在" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "组件类型无效" }, { status: 400 });
    }

    const bomItem = await prisma.bomItem.create({
      data: {
        productId,
        parentId: parentId ? parseInt(parentId) : null,
        componentType,
        componentId: parseInt(componentId),
        quantity: parseFloat(quantity),
        unit: unit || "个",
        level: level !== undefined ? parseInt(level) : parentId ? 1 : 0,
        notes: notes || null,
      },
    });

    return NextResponse.json(bomItem, { status: 201 });
  } catch (error) {
    console.error("Create BOM item error:", error);
    return NextResponse.json({ error: "创建BOM项失败" }, { status: 500 });
  }
}
