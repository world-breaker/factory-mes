import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import WorkOrderActions from "./actions";

const statusLabels: Record<string, string> = {
  pending: "待生产",
  in_progress: "生产中",
  completed: "已完成",
  cancelled: "已取消",
};

export default async function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  const { id } = await params;

  const order = await prisma.workOrder.findUnique({
    where: { id: parseInt(id) },
    include: {
      product: true,
      assignedLine: true,
      creator: { select: { id: true, name: true } },
      processes: {
        orderBy: { stepOrder: "asc" },
        include: { operator: { select: { id: true, name: true } } },
      },
      prodRecords: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { operator: { select: { name: true } }, process: { select: { stepName: true } } },
      },
      qualityRecords: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { inspector: { select: { name: true } } },
      },
    },
  });

  if (!order) notFound();

  const progress = order.quantity > 0 ? Math.round((order.quantityDone / order.quantity) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/work-orders" className="text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          工单管理
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-medium">{order.orderNo}</span>
      </div>

      {/* Header Card */}
      <div className="premium-card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-gray-900">{order.orderNo}</h2>
              <span className={`status-badge status-badge-${order.status}`}>
                {statusLabels[order.status]}
              </span>
            </div>
            <p className="text-gray-500 mt-2 text-base">
              {order.product.name}
              <span className="text-gray-300 mx-2">|</span>
              {order.product.code}
              <span className="text-gray-300 mx-2">|</span>
              计划 <span className="font-semibold text-gray-700">{order.quantity}</span> {order.product.unit}
            </p>
          </div>
          <WorkOrderActions orderId={order.id} status={order.status} />
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-500 font-medium">生产进度</span>
            <span className="font-semibold text-gray-700">{order.quantityDone}/{order.quantity} ({progress}%)</span>
          </div>
          <div className="progress-bar h-3">
            <div
              className={`progress-bar-fill h-full ${progress === 100 ? "bg-gradient-to-r from-green-400 to-green-600" : ""}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-100">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 font-medium mb-1">优先级别</p>
            <p className="font-bold text-gray-900 text-lg">{order.priority === "urgent" ? "🚨 紧急" : order.priority === "high" ? "⚡ 高" : order.priority === "normal" ? "普通" : "低"}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 font-medium mb-1">分配产线</p>
            <p className="font-bold text-gray-900 text-lg">{order.assignedLine?.name || "未分配"}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 font-medium mb-1">创建人</p>
            <p className="font-bold text-gray-900 text-lg">{order.creator.name}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 font-medium mb-1">截止日期</p>
            <p className="font-bold text-gray-900 text-lg">{order.dueDate ? order.dueDate.toLocaleDateString("zh-CN") : "未设置"}</p>
          </div>
        </div>
      </div>

      {/* Process Steps Timeline */}
      <div className="glass-card p-6">
        <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          工序步骤
        </h3>
        <div className="space-y-3">
          {order.processes.length === 0 ? (
            <div className="empty-state py-8">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p>暂无工序步骤</p>
            </div>
          ) : (
            order.processes.map((step, idx) => (
              <div
                key={step.id}
                className={`rounded-xl border-2 p-5 transition-all duration-200 ${
                  step.status === "completed" ? "border-green-200 bg-green-50/50" :
                  step.status === "in_progress" ? "border-blue-300 bg-blue-50 shadow-sm shadow-blue-100" :
                  step.status === "skipped" ? "border-gray-200 bg-gray-50 opacity-70" :
                  "border-gray-100 bg-white hover:border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shadow-sm ${
                      step.status === "completed" ? "bg-gradient-to-br from-green-400 to-green-600 text-white" :
                      step.status === "in_progress" ? "bg-gradient-to-br from-blue-400 to-blue-600 text-white animate-pulse" :
                      "bg-gray-200 text-gray-500"
                    }`}>
                      {step.stepOrder}
                    </span>
                    <div>
                      <p className="font-bold text-gray-900 text-base">{step.stepName}</p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                        {step.operator && <span>操作人: {step.operator.name}</span>}
                        {step.startedAt && <span>开始: {new Date(step.startedAt).toLocaleString("zh-CN")}</span>}
                        {step.completedAt && <span>完成: {new Date(step.completedAt).toLocaleString("zh-CN")}</span>}
                      </div>
                    </div>
                  </div>
                  <span className={`status-badge ${
                    step.status === "completed" ? "status-badge-completed" :
                    step.status === "in_progress" ? "status-badge-in_progress" :
                    step.status === "skipped" ? "status-badge-paused" :
                    "bg-gray-100 text-gray-500"
                  }`}>
                    {step.status === "completed" ? "已完成" : step.status === "in_progress" ? "进行中" : step.status === "skipped" ? "已跳过" : "待开始"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Production Records */}
      <div className="glass-card p-6">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          </svg>
          报工记录
        </h3>
        {order.prodRecords.length === 0 ? (
          <div className="empty-state py-6">
            <p>暂无报工记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>工序</th>
                  <th>良品</th>
                  <th>不良品</th>
                  <th>操作人</th>
                  <th>时间</th>
                </tr>
              </thead>
              <tbody>
                {order.prodRecords.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium text-gray-900">{r.process?.stepName || "-"}</td>
                    <td><span className="font-semibold text-green-600">+{r.quantityGood}</span></td>
                    <td className="text-red-500">{r.quantityDefect > 0 ? r.quantityDefect : "-"}</td>
                    <td className="text-gray-600">{r.operator.name}</td>
                    <td className="text-gray-400 text-xs">{new Date(r.createdAt).toLocaleString("zh-CN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quality Records */}
      <div className="glass-card p-6">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          质检记录
        </h3>
        {order.qualityRecords.length === 0 ? (
          <div className="empty-state py-6">
            <p>暂无质检记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>结果</th>
                  <th>缺陷类型</th>
                  <th>数量</th>
                  <th>检验员</th>
                  <th>时间</th>
                </tr>
              </thead>
              <tbody>
                {order.qualityRecords.map((r) => (
                  <tr key={r.id} className={r.result === "fail" ? "bg-red-50/50" : ""}>
                    <td>
                      <span className={`inline-flex items-center gap-1.5 font-semibold ${
                        r.result === "pass" ? "text-green-600" : "text-red-600"
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${r.result === "pass" ? "bg-green-500" : "bg-red-500"}`} />
                        {r.result === "pass" ? "合格" : "不合格"}
                      </span>
                    </td>
                    <td>{r.defectType || "-"}</td>
                    <td>{r.defectQty || "-"}</td>
                    <td className="text-gray-600">{r.inspector.name}</td>
                    <td className="text-gray-400 text-xs">{new Date(r.createdAt).toLocaleString("zh-CN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
