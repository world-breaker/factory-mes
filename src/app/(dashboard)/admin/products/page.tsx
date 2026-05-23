import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DeleteButton } from "../delete-btn";
import { RestoreButton } from "./restore-btn";
import { canAccessPath } from "@/lib/permissions";

export default async function ProductsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!canAccessPath(session.user.role, "/admin")) redirect("/production");

  const products = await prisma.product.findMany({
    include: {
      _count: { select: { workOrders: true, bomItems: true, templates: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="page-header flex items-center justify-between mb-6">
        <div>
          <h2>产品管理</h2>
          <p>管理产品及其BOM物料清单</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary text-sm h-9">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          添加产品
        </Link>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>编码</th>
                <th>名称</th>
                <th>规格</th>
                <th>单位</th>
                <th>BOM节点</th>
                <th>工单数</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className={!p.active ? "opacity-60" : ""}>
                  <td className="font-mono text-xs text-gray-500">{p.code}</td>
                  <td className="font-medium text-gray-900">{p.name}</td>
                  <td className="text-sm text-gray-500">{p.specification || <span className="text-gray-300">-</span>}</td>
                  <td className="text-gray-500">{p.unit}</td>
                  <td className="text-center">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="text-xs text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg font-medium transition inline-flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      {p._count.bomItems} 项
                    </Link>
                  </td>
                  <td className="text-center font-medium">{p._count.workOrders}</td>
                  <td>
                    <span className={`status-badge ${p.active ? "status-badge-completed" : "bg-gray-100 text-gray-500"}`}>
                      {p.active ? "启用" : "停用"}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {p.active ? (
                        <>
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="text-xs text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg font-medium transition"
                          >
                            BOM
                          </Link>
                          <DeleteButton id={p.id} apiPath={`/api/products/${p.id}`} label="删除" confirmMsg="确认停用该产品？如有工单关联将无法新建" />
                        </>
                      ) : (
                        <RestoreButton id={p.id} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">暂无产品</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
