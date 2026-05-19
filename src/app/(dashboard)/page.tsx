import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { TrendChart, ProductionGauge, QualityDonut } from "./dashboard-charts";

async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalOrders,
    pendingOrders,
    inProgressOrders,
    completedOrders,
    todayCompleted,
    totalProducts,
    lowStockMaterials,
    recentQualityIssues,
    qualityRecords,
    productionRecords,
  ] = await Promise.all([
    prisma.workOrder.count(),
    prisma.workOrder.count({ where: { status: "pending" } }),
    prisma.workOrder.count({ where: { status: "in_progress" } }),
    prisma.workOrder.count({ where: { status: "completed" } }),
    prisma.workOrder.count({
      where: { status: "completed", completedAt: { gte: today } },
    }),
    prisma.product.count({ where: { active: true } }),
    prisma.inventory.findMany({
      where: { quantity: { lte: 0 } },
      include: { material: true },
      take: 5,
    }),
    prisma.qualityRecord.count({
      where: { result: "fail", createdAt: { gte: last7Days } },
    }),
    prisma.qualityRecord.groupBy({
      by: ["result"],
      _count: true,
      where: { createdAt: { gte: last7Days } },
    }),
    prisma.productionRecord.findMany({
      where: { createdAt: { gte: last7Days } },
      select: { quantityGood: true, createdAt: true },
    }),
  ]);

  // Build 7-day trend data
  const dayMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    dayMap[key] = 0;
  }
  productionRecords.forEach((r) => {
    const d = new Date(r.createdAt);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    if (dayMap[key] !== undefined) dayMap[key] += r.quantityGood;
  });
  const trendData = Object.entries(dayMap).map(([day, completed]) => ({ day, completed }));

  // Quality stats
  let passCount = 0;
  let failCount = 0;
  qualityRecords.forEach((r) => {
    if (r.result === "pass") passCount += r._count;
    else failCount += r._count;
  });

  return {
    totalOrders,
    pendingOrders,
    inProgressOrders,
    completedOrders,
    todayCompleted,
    totalProducts,
    lowStockMaterials,
    recentQualityIssues,
    passCount,
    failCount,
    trendData,
    inProgressTotal: inProgressOrders + pendingOrders,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const stats = await getDashboardStats();

  const statCards = [
    {
      label: "总工单",
      value: stats.totalOrders,
      sub: `已完成 ${stats.completedOrders}`,
      href: "/work-orders",
      color: "from-blue-500 to-blue-600",
      lightBg: "bg-blue-50",
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: "待生产",
      value: stats.pendingOrders,
      sub: "等待排产",
      href: "/work-orders",
      color: "from-amber-500 to-amber-600",
      lightBg: "bg-amber-50",
      icon: (
        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "生产中",
      value: stats.inProgressOrders,
      sub: "进行中",
      href: "/production",
      color: "from-emerald-500 to-emerald-600",
      lightBg: "bg-emerald-50",
      icon: (
        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "今日完工",
      value: stats.todayCompleted,
      sub: "今日完成",
      href: "/work-orders",
      color: "from-violet-500 to-violet-600",
      lightBg: "bg-violet-50",
      icon: (
        <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            你好，{session?.user?.name || "用户"}
          </h2>
          <p className="text-gray-500 mt-1">
            {new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
            {" · "}
            {stats.inProgressOrders > 0 ? `有 ${stats.inProgressOrders} 个工单正在生产中` : "暂无正在生产的工单"}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="glass-card p-5 hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1 tracking-tight group-hover:text-blue-600 transition-colors">
                  {card.value}
                </p>
                <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
              </div>
              <div className={`w-12 h-12 ${card.lightBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                {card.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Production Gauge */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">今日生产进度</h3>
          <ProductionGauge
            value={stats.todayCompleted}
            max={Math.max(stats.todayCompleted, stats.inProgressOrders + stats.todayCompleted || 1)}
            label="已完成工单"
          />
        </div>

        {/* 7-Day Trend */}
        <div className="glass-card p-5 lg:col-span-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">近7天产量趋势</h3>
          <TrendChart data={stats.trendData} />
        </div>

        {/* Quality Donut */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">近7天质量统计</h3>
          <QualityDonut pass={stats.passCount} fail={stats.failCount} />
        </div>
      </div>

      {/* Quick Actions + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            快捷操作
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/work-orders/new"
              className="action-btn bg-blue-50 hover:bg-blue-100 text-blue-700"
            >
              <div className="action-icon bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm shadow-blue-500/20">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              新建工单
            </Link>
            <Link
              href="/production"
              className="action-btn bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
            >
              <div className="action-icon bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm shadow-emerald-500/20">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
              </div>
              开始生产
            </Link>
            <Link
              href="/inventory"
              className="action-btn bg-amber-50 hover:bg-amber-100 text-amber-700"
            >
              <div className="action-icon bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm shadow-amber-500/20">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              入库登记
            </Link>
            <Link
              href="/quality/check"
              className="action-btn bg-rose-50 hover:bg-rose-100 text-rose-700"
            >
              <div className="action-icon bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-sm shadow-rose-500/20">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              质量检验
            </Link>
          </div>
        </div>

        {/* Alerts */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            预警信息
          </h3>
          {stats.lowStockMaterials.length === 0 && stats.recentQualityIssues === 0 ? (
            <div className="empty-state py-8">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>暂无预警，一切正常</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {stats.lowStockMaterials.map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-red-50 to-red-50/50 rounded-xl border border-red-200/60">
                  <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{inv.material.name}</p>
                    <p className="text-xs text-red-600 font-medium">库存不足（当前: {inv.quantity}）</p>
                  </div>
                  <Link href="/inventory" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex-shrink-0">
                    处理
                  </Link>
                </div>
              ))}
              {stats.recentQualityIssues > 0 && (
                <div className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-orange-50 to-orange-50/50 rounded-xl border border-orange-200/60">
                  <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">质量问题</p>
                    <p className="text-xs text-orange-600 font-medium">近7天有 {stats.recentQualityIssues} 条不良记录</p>
                  </div>
                  <Link href="/quality" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex-shrink-0">
                    查看
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
