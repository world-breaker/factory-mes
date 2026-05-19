import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminPage() {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/");

  const [users, products, templates] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, username: true, name: true, role: true, active: true,
      },
    }),
    prisma.product.findMany({
      include: { _count: { select: { workOrders: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.processTemplate.findMany({
      include: {
        product: { select: { name: true, code: true } },
        steps: { orderBy: { stepOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const roleLabels: Record<string, string> = {
    admin: "管理员",
    supervisor: "班组长",
    operator: "操作工",
  };

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <h2>系统管理</h2>
          <p>用户、产品和工艺模板管理</p>
        </div>
      </div>

      {/* Users Section */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            用户管理
          </h3>
          <Link href="/admin/users/new" className="btn-primary text-sm h-9">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            添加用户
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>用户名</th>
                <th>姓名</th>
                <th>角色</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="font-mono text-xs font-medium text-gray-900">{u.username}</td>
                  <td className="font-medium">{u.name}</td>
                  <td>
                    <span className={`status-badge ${
                      u.role === "admin" ? "bg-blue-50 text-blue-600" :
                      u.role === "supervisor" ? "bg-violet-50 text-violet-600" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {roleLabels[u.role] || u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${u.active ? "status-badge-completed" : "bg-gray-100 text-gray-500"}`}>
                      {u.active ? "正常" : "已禁用"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Products Section */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            产品管理
          </h3>
          <Link href="/admin/products/new" className="btn-primary text-sm h-9">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            添加产品
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>编码</th>
                <th>名称</th>
                <th>单位</th>
                <th>工单数</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="font-mono text-xs text-gray-500">{p.code}</td>
                  <td className="font-medium text-gray-900">{p.name}</td>
                  <td className="text-gray-500">{p.unit}</td>
                  <td className="font-medium">{p._count.workOrders}</td>
                  <td>
                    <span className={`status-badge ${p.active ? "status-badge-completed" : "bg-gray-100 text-gray-500"}`}>
                      {p.active ? "启用" : "停用"}
                    </span>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">暂无产品</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Templates Section */}
      <div className="glass-card p-6">
        <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          工艺模板
        </h3>
        {templates.length === 0 ? (
          <div className="empty-state py-10">
            <p>暂无工艺模板</p>
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map((t) => (
              <div key={t.id} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs text-gray-400">{t.product?.code || "-"}</span>
                    <h4 className="font-bold text-gray-900">{t.product?.name || t.name}</h4>
                  </div>
                  <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
                    {t.steps.length} 道工序
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {t.steps.map((s, idx) => (
                    <div key={s.id} className="flex items-center gap-1">
                      <span className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 shadow-sm border border-gray-200">
                        {s.stepOrder}. {s.name}
                      </span>
                      {idx < t.steps.length - 1 && (
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
