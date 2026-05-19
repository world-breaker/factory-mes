import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function QualityRecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;
  const where: any = {};
  if (params.result) where.result = params.result;

  const records = await prisma.qualityRecord.findMany({
    where,
    include: {
      workOrder: { select: { orderNo: true, product: { select: { name: true } } } },
      inspector: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/quality" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回质量页面
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">质量报表</h2>
          <p className="text-gray-500 text-sm mt-1">查看所有质检记录和统计</p>
        </div>
        <div className="flex gap-2">
          <Link href="/quality/records" className={`px-3 py-1.5 rounded-lg text-sm ${!params.result ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>全部</Link>
          <Link href="/quality/records?result=pass" className={`px-3 py-1.5 rounded-lg text-sm ${params.result === "pass" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"}`}>合格</Link>
          <Link href="/quality/records?result=fail" className={`px-3 py-1.5 rounded-lg text-sm ${params.result === "fail" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"}`}>不良</Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-3.5 text-gray-500 font-medium">工单</th>
                <th className="text-left px-4 py-3.5 text-gray-500 font-medium">产品</th>
                <th className="text-left px-4 py-3.5 text-gray-500 font-medium">结果</th>
                <th className="text-left px-4 py-3.5 text-gray-500 font-medium">缺陷类型</th>
                <th className="text-left px-4 py-3.5 text-gray-500 font-medium">不良数量</th>
                <th className="text-left px-4 py-3.5 text-gray-500 font-medium">检验员</th>
                <th className="text-left px-4 py-3.5 text-gray-500 font-medium">检验时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400">暂无记录</td></tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className={`${r.result === "fail" ? "bg-red-50/50" : "hover:bg-gray-50"}`}>
                    <td className="px-4 py-4 font-mono text-xs">{r.workOrder.orderNo}</td>
                    <td className="px-4 py-4">{r.workOrder.product.name}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 font-medium ${r.result === "pass" ? "text-green-600" : "text-red-600"}`}>
                        {r.result === "pass" ? "✓ 合格" : "✕ 不合格"}
                      </span>
                    </td>
                    <td className="px-4 py-4">{r.defectType || "-"}</td>
                    <td className="px-4 py-4">{r.defectQty || "-"}</td>
                    <td className="px-4 py-4 text-gray-600">{r.inspector.name}</td>
                    <td className="px-4 py-4 text-gray-400 text-xs">{new Date(r.createdAt).toLocaleString("zh-CN")}</td>
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
