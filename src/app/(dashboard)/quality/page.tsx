import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import QualityModal from "./actions";
import { DeleteButton } from "../admin/delete-btn";

export default async function QualityPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  const params = await searchParams;

  const where: any = {};
  if (params.result && params.result !== "all") where.result = params.result;

  const records = await prisma.qualityRecord.findMany({
    where,
    include: {
      workOrder: { select: { orderNo: true, product: { select: { name: true } } } },
      inspector: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [todayChecks, passCount, failCount, totalChecks] = await Promise.all([
    prisma.qualityRecord.count({ where: { createdAt: { gte: today } } }),
    prisma.qualityRecord.count({ where: { result: "pass", createdAt: { gte: last7Days } } }),
    prisma.qualityRecord.count({ where: { result: "fail", createdAt: { gte: last7Days } } }),
    prisma.qualityRecord.count({ where: { createdAt: { gte: last7Days } } }),
  ]);

  const passRate = totalChecks > 0 ? Math.round((passCount / totalChecks) * 100) : 100;

  const tabs = [
    { label: "全部", value: "all", color: "bg-gray-500" },
    { label: "合格", value: "pass", color: "bg-green-500" },
    { label: "不合格", value: "fail", color: "bg-red-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h2>质量管理</h2>
          <p>生产过程质量检验与追溯</p>
        </div>
        <QualityModal>
          <button className="btn-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            开始检验
          </button>
        </QualityModal>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 font-medium">今日检验</span>
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{todayChecks}</p>
          <p className="text-xs text-gray-400 mt-1">次</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 font-medium">近7天合格率</span>
            <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600">{passRate}%</p>
          <p className="text-xs text-gray-400 mt-1">合格 {passCount} / 总数 {totalChecks}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 font-medium">近7天不良数</span>
            <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-red-600">{failCount}</p>
          <p className="text-xs text-gray-400 mt-1">条不良记录</p>
        </div>
        <div className="glass-card p-5 flex flex-col justify-center">
          <div className="flex gap-2">
            <Link href="/quality/check" className="flex-1 btn-primary text-sm justify-center h-10">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              检验
            </Link>
            <Link href="/quality/records" className="flex-1 btn-secondary text-sm justify-center h-10">
              报表
            </Link>
          </div>
        </div>
      </div>

      {/* Records */}
      <div className="glass-card">
        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-5 pb-3 border-b border-gray-100">
          {tabs.map((tab) => {
            const isActive = (params.result || "all") === tab.value;
            return (
              <Link
                key={tab.value}
                href={tab.value === "all" ? "/quality" : `/quality?result=${tab.value}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                  isActive ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${tab.color}`} />
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>工单</th>
                <th>产品</th>
                <th>结果</th>
                <th>缺陷类型</th>
                <th>不良数量</th>
                <th>检验员</th>
                <th>时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-400">暂无质检记录</td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className={r.result === "fail" ? "bg-red-50/50" : ""}>
                    <td className="font-mono text-xs text-blue-600 font-medium">{r.workOrder.orderNo}</td>
                    <td className="font-medium text-gray-900">{r.workOrder.product.name}</td>
                    <td>
                      <span className={`inline-flex items-center gap-1.5 font-semibold text-sm ${
                        r.result === "pass" ? "text-green-600" : "text-red-600"
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${r.result === "pass" ? "bg-green-500" : "bg-red-500"}`} />
                        {r.result === "pass" ? "合格" : "不合格"}
                      </span>
                    </td>
                    <td>{r.defectType || "-"}</td>
                    <td className={r.defectQty ? "font-medium text-red-500" : ""}>{r.defectQty || "-"}</td>
                    <td className="text-gray-600">{r.inspector.name}</td>
                    <td className="text-gray-400 text-xs">{new Date(r.createdAt).toLocaleString("zh-CN")}</td>
                    <td>
                      <DeleteButton id={r.id} apiPath={`/api/quality/${r.id}`} confirmMsg="确认删除此质检记录？" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
