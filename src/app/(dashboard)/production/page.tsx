import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function ProductionPage() {
  const session = await auth();
  if (!session) return <div className="text-center py-20 text-gray-400">请先登录</div>;
  const userId = parseInt(session.user.id);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return <div className="text-center py-20 text-gray-400">用户不存在</div>;

  const where: any = {
    status: { in: ["pending", "in_progress"] },
  };

  if (user?.role === "operator" && user.assignedLine) {
    where.assignedLineId = user.assignedLine;
  }

  const orders = await prisma.workOrder.findMany({
    where,
    include: {
      product: true,
      assignedLine: true,
      processes: {
        orderBy: { stepOrder: "asc" },
        where: { status: { not: "skipped" } },
      },
    },
    orderBy: [
      { priority: "asc" },
      { createdAt: "desc" },
    ],
  });

  // Stats
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCompleted = await prisma.workOrder.count({
    where: { status: "completed", completedAt: { gte: todayStart } },
  });
  const activeCount = orders.filter(o => o.status === "in_progress").length;
  const pendingCount = orders.filter(o => o.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header + Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header mb-0 pb-0 border-0">
          <h2>车间报工</h2>
          <p>{user?.role === "operator" ? "选择工单开始生产并报工" : "管理所有产线的生产进度"}</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-3 shadow-sm">
            <p className="text-xs text-amber-600 font-medium">待生产</p>
            <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-blue-200 px-5 py-3 shadow-sm">
            <p className="text-xs text-blue-600 font-medium">生产中</p>
            <p className="text-2xl font-bold text-blue-600">{activeCount}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 px-5 py-3 shadow-sm">
            <p className="text-xs text-green-600 font-medium">今日完工</p>
            <p className="text-2xl font-bold text-green-600">{todayCompleted}</p>
          </div>
        </div>
      </div>

      {/* Work Orders Grid */}
      {orders.length === 0 ? (
        <div className="glass-card empty-state py-16">
          <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-400 text-lg mt-2">没有待处理的工单</p>
          <p className="text-gray-400 text-sm mt-1">请先在工单管理中创建工单并分配产线</p>
          <Link href="/work-orders/new" className="btn-primary mt-5">
            新建工单
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((order) => {
            const inProgressStep = order.processes.find((p) => p.status === "in_progress");
            const nextStep = order.processes.find((p) => p.status === "pending");
            const completedSteps = order.processes.filter((p) => p.status === "completed").length;
            const totalSteps = order.processes.length;
            const progress = order.quantity > 0 ? Math.round((order.quantityDone / order.quantity) * 100) : 0;

            return (
              <Link
                key={order.id}
                href={`/production/${order.id}`}
                className={`premium-card p-5 hover:-translate-y-1 transition-all duration-200 block ${
                  order.status === "in_progress"
                    ? "ring-2 ring-blue-200"
                    : order.priority === "urgent"
                    ? "ring-2 ring-red-200"
                    : ""
                }`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-gray-400">{order.orderNo}</span>
                      {order.priority === "urgent" && (
                        <span className="status-badge bg-red-100 text-red-600">紧急</span>
                      )}
                      {order.priority === "high" && (
                        <span className="status-badge bg-orange-100 text-orange-600">高</span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{order.product.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {order.product.code}
                      {order.assignedLine && <span className="ml-2">· {order.assignedLine.name}</span>}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className={`text-2xl font-bold ${progress >= 100 ? "text-green-600" : order.status === "in_progress" ? "text-blue-600" : "text-amber-600"}`}>
                      {order.quantityDone}
                      <span className="text-sm text-gray-400 font-normal">/{order.quantity}</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="progress-bar mb-3">
                  <div
                    className={`progress-bar-fill ${progress >= 100 ? "bg-gradient-to-r from-green-400 to-green-500" : ""}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>

                {/* Footer info */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {inProgressStep ? (
                      <span className="flex items-center gap-1.5 text-blue-600 font-semibold bg-blue-50 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                        当前: {inProgressStep.stepName}
                      </span>
                    ) : nextStep ? (
                      <span className="text-gray-500">下一工序: {nextStep.stepName}</span>
                    ) : (
                      <span className="text-green-600 font-semibold flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        全部完成
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400 font-medium bg-gray-50 px-2.5 py-1 rounded-full">
                    {completedSteps}/{totalSteps} 工序
                  </span>
                </div>

                {/* Status indicator bar */}
                <div className={`mt-3 -mx-5 -mb-5 h-1 rounded-b-xl ${
                  order.status === "in_progress" ? "bg-gradient-to-r from-blue-400 to-blue-500" :
                  order.status === "pending" ? "bg-gradient-to-r from-amber-400 to-amber-500" :
                  "bg-gradient-to-r from-green-400 to-green-500"
                }`} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
