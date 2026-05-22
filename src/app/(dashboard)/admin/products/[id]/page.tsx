import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BomTreeClient } from "./bom-tree-client";

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
  component: {
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

export default async function ProductBomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/");

  const { id } = await params;
  const productId = parseInt(id);

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!product) {
    redirect("/admin");
  }

  const bomItems = await prisma.bomItem.findMany({
    where: { productId },
    orderBy: { level: "asc" },
  });

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

  // Load all products and materials for the add form
  const allProducts = await prisma.product.findMany({
    where: { active: true },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });
  const allMaterials = await prisma.material.findMany({
    where: { active: true },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-3 font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回系统管理
        </Link>
        <div className="page-header pb-0 border-0">
          <h2>BOM物料清单</h2>
          <p>
            {product.code} - {product.name}
          </p>
        </div>
      </div>

      {/* Product Info */}
      <div className="glass-card p-5 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-xs text-gray-400 block mb-1">产品编码</span>
            <span className="font-mono text-sm font-medium">{product.code}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block mb-1">产品名称</span>
            <span className="font-medium">{product.name}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block mb-1">规格</span>
            <span className="text-sm">{product.specification || "-"}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block mb-1">单位</span>
            <span className="text-sm">{product.unit}</span>
          </div>
        </div>
      </div>

      {/* BOM Tree */}
      <BomTreeClient
        productId={productId}
        tree={tree}
        allProducts={allProducts}
        allMaterials={allMaterials}
        bomItems={bomItems}
      />
    </div>
  );
}
