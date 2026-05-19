import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ProductionActions from "./actions";
import ProductionForm from "./report-form";

export default async function ProductionDetailPage({
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
      processes: {
        orderBy: { stepOrder: "asc" },
        include: { operator: { select: { id: true, name: true } } },
      },
      prodRecords: {
        orderBy: { createdAt: "desc" },
        include: { operator: { select: { name: true } } },
        take: 50,
      },
    },
  });

  if (!order) return (
    <div className="glass-card empty-state py-20">
      <p className="text-gray-400 text-lg">工单不存在</p>
      <Link href="/production" className="btn-primary mt-4">返回生产列表</Link>
    </div>
  );

  const progress = order.quantity > 0 ? Math.round((order.quantityDone / order.quantity) * 100) : 0;
  const currentStep = order.processes.find((p) => p.status === "in_progress");

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Back link */}
      <Link href="/production" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回生产列表
      </Link>

      {/* Order header card */}
      <div className="premium-card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm text-gray-400">{order.orderNo}</span>
              <span className={`status-badge status-badge-${order.status}`}>
                {order.status === "in_progress" ? "生产中" : order.status === "pending" ? "待生产" : "已完成"}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{order.product.name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              计划 {order.quantity} {order.product.unit}
              {order.assignedLine && <span className="ml-2">· {order.assignedLine.name}</span>}
            </p>
          </div>
          <div className="text-right bg-gray-50 rounded-xl px-6 py-3">
            <div className={`text-4xl font-bold ${progress >= 100 ? "text-green-600" : "text-blue-600"}`}>
              {order.quantityDone}
            </div>
            <div className="text-sm text-gray-400">/ {order.quantity} 已完成</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-1">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-gray-500 font-medium">生产进度</span>
            <span className="font-bold text-gray-700">{progress}%</span>
          </div>
          <div className="progress-bar h-3">
            <div
              className={`progress-bar-fill h-full ${progress >= 100 ? "bg-gradient-to-r from-green-400 to-green-500" : ""}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step timeline */}
      <div className="glass-card p-6">
        <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          工序步骤
        </h3>
        <div className="space-y-3">
          {order.processes.map((step) => {
            const isCurrent = step.status === "in_progress";
            const isDone = step.status === "completed";

            return (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all ${
                  isCurrent
                    ? "border-blue-400 bg-blue-50/80 shadow-sm shadow-blue-100"
                    : isDone
                    ? "border-green-200 bg-green-50/50"
                    : "border-gray-100 bg-gray-50/30"
                }`}
              >
                {/* Step circle */}
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-sm ${
                  isDone
                    ? "bg-gradient-to-br from-green-400 to-green-600 text-white"
                    : isCurrent
                    ? "bg-gradient-to-br from-blue-400 to-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}>
                  {isDone ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : step.stepOrder}
                </div>

                {/* Step info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={`font-bold ${isCurrent ? "text-blue-900 text-lg" : "text-gray-900"}`}>
                      {step.stepName}
                    </h4>
                    <span className={`status-badge ${
                      isDone ? "status-badge-completed" :
                      isCurrent ? "status-badge-in_progress" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {isDone ? "已完成" : isCurrent ? "进行中" : "待开始"}
                    </span>
                  </div>
                  {step.operator && (
                    <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      操作人: {step.operator.name}
                    </p>
                  )}
                </div>

                {/* Actions */}
                {!isDone && (
                  <ProductionActions processId={step.id} workOrderId={order.id} status={step.status} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Report form for current step */}
      {currentStep && (
        <div className="premium-card p-6 ring-2 ring-blue-200">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">当前报工</h3>
              <p className="text-sm text-gray-500">
                工序: {currentStep.stepName}
                <span className="mx-2">·</span>
                剩余: {Math.max(0, order.quantity - order.quantityDone)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <ProductionForm
              workOrderId={order.id}
              processId={currentStep.id}
              remainingQty={Math.max(0, order.quantity - order.quantityDone)}
            />
          </div>
        </div>
      )}

      {/* Production history */}
      <div className="glass-card p-6">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          报工记录
        </h3>
        {order.prodRecords.length === 0 ? (
          <div className="empty-state py-6">
            <p>暂无报工记录</p>
          </div>
        ) : (
          <div className="space-y-2">
            {order.prodRecords.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl hover:bg-gray-100/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.operator.name}</p>
                    <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString("zh-CN")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    +{r.quantityGood}
                  </span>
                  {r.quantityDefect > 0 && (
                    <span className="text-sm font-medium text-red-500">
                      不良 {r.quantityDefect}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
