import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";

const statusLabels: Record<string, string> = {
  pending: "待生产",
  in_progress: "生产中",
  completed: "已完成",
  cancelled: "已取消",
};

const priorityLabels: Record<string, string> = {
  low: "低",
  normal: "普通",
  high: "高",
  urgent: "紧急",
};

export default async function WorkOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  const where: any = {};
  if (params.status && params.status !== "all") {
    where.status = params.status;
  }

  // Operator can only see orders matching their work type
  if (session?.user?.role === "operator") {
    if (session.user.workTypeId) where.workTypeId = session.user.workTypeId;
  }

  const orders = await prisma.workOrder.findMany({
    where,
    include: {
      product: { select: { name: true, code: true } },
      assignedLine: { select: { name: true } },
      workType: { select: { name: true } },
      creator: { select: { name: true } },
    },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  const stats = await Promise.all([
    prisma.workOrder.count({ where: session?.user?.role === "operator" && session.user.workTypeId ? { workTypeId: session.user.workTypeId } : {} }),
    prisma.workOrder.count({ where: { ...(session?.user?.role === "operator" && session.user.workTypeId ? { workTypeId: session.user.workTypeId } : {}), status: "pending" } }),
    prisma.workOrder.count({ where: { ...(session?.user?.role === "operator" && session.user.workTypeId ? { workTypeId: session.user.workTypeId } : {}), status: "in_progress" } }),
    prisma.workOrder.count({ where: { ...(session?.user?.role === "operator" && session.user.workTypeId ? { workTypeId: session.user.workTypeId } : {}), status: "completed" } }),
  ]);

  const tabs = [
    { label: "全部", value: "all", count: stats[0] },
    { label: "待生产", value: "pending", count: stats[1] },
    { label: "生产中", value: "in_progress", count: stats[2] },
    { label: "已完成", value: "completed", count: stats[3] },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h2>工单管理</h2>
          <p>创建、派发和跟踪生产工单</p>
        </div>
        <Link href="/work-orders/new" className="btn-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          新建工单
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white p-1 rounded-xl border border-gray-200 w-fit">
        {tabs.map((tab) => {
          const isActive = (params.status || "all") === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value === "all" ? "/work-orders" : `/work-orders?status=${tab.value}`}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
                isActive ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                isActive ? "bg-blue-500" : "bg-gray-200 text-gray-600"
              }`}>{tab.count}</span>
            </Link>
          );
        })}
      </div>

      {/* Orders Grid - Card layout for better visual */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {orders.length === 0 ? (
          <div className="lg:col-span-2">
            <div className="glass-card empty-state py-16">
              <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-400 mt-2">暂无工单</p>
              <Link href="/work-orders/new" className="btn-primary mt-4 text-sm">
                创建第一个工单
              </Link>
            </div>
          </div>
        ) : (
          orders.map((order) => {
            const progress = order.quantity > 0 ? Math.round((order.quantityDone / order.quantity) * 100) : 0;
            return (
              <Link
                key={order.id}
                href={`/work-orders/${order.id}`}
                className="premium-card p-5 hover:-translate-y-0.5 transition-all duration-200 block"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-gray-900">{order.orderNo}</span>
                      <span className={`status-badge status-badge-${order.status}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {order.product.name}
                      <span className="text-gray-300 mx-1.5">|</span>
                      {order.product.code}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${
                    order.priority === "urgent" ? "text-red-600" :
                    order.priority === "high" ? "text-orange-600" :
                    order.priority === "normal" ? "text-blue-600" : "text-gray-400"
                  }`}>
                    {priorityLabels[order.priority]}
                  </span>
                </div>

                {/* Progress */}
                {order.status !== "pending" && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                      <span>进度</span>
                      <span className="font-medium">{order.quantityDone}/{order.quantity}</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    {order.assignedLine && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {order.assignedLine.name}
                      </span>
                    )}
                    {order.workType && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {order.workType.name}
                      </span>
                    )}
                    <span>{order.creator.name}</span>
                  </div>
                  <span>{order.createdAt.toLocaleDateString("zh-CN")}</span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
