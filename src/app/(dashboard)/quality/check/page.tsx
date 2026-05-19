"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function QualityCheckPage() {
  const router = useRouter();
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [form, setForm] = useState({
    workOrderId: "",
    result: "pass",
    defectType: "",
    defectQty: "0",
    defectDesc: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/work-orders")
      .then((r) => r.json())
      .then((data) => setWorkOrders(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.workOrderId) {
      setError("请选择工单");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/quality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "提交失败");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/quality");
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900">提交成功</h3>
        <p className="text-gray-500 mt-1">正在跳转到质量页面...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link href="/quality" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回质量页面
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">质量检验</h2>
        <p className="text-gray-500 text-sm mt-1">记录生产过程中的质量检查结果</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">选择工单</label>
          <select
            value={form.workOrderId}
            onChange={(e) => setForm({ ...form, workOrderId: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            required
          >
            <option value="">请选择工单</option>
            {workOrders.map((wo: any) => (
              <option key={wo.id} value={wo.id}>
                {wo.orderNo} - {wo.product?.name || ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">检验结果</label>
          <div className="grid grid-cols-2 gap-3">
            <label className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition ${
              form.result === "pass" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"
            }`}>
              <input
                type="radio"
                name="result"
                value="pass"
                checked={form.result === "pass"}
                onChange={() => setForm({ ...form, result: "pass" })}
                className="sr-only"
              />
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-green-700">合格</span>
            </label>
            <label className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition ${
              form.result === "fail" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
            }`}>
              <input
                type="radio"
                name="result"
                value="fail"
                checked={form.result === "fail"}
                onChange={() => setForm({ ...form, result: "fail" })}
                className="sr-only"
              />
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-red-700">不合格</span>
            </label>
          </div>
        </div>

        {form.result === "fail" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">缺陷类型</label>
              <select
                value={form.defectType}
                onChange={(e) => setForm({ ...form, defectType: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white"
              >
                <option value="">选择缺陷类型</option>
                <option value="尺寸偏差">尺寸偏差</option>
                <option value="表面划伤">表面划伤</option>
                <option value="变形">变形</option>
                <option value="焊接缺陷">焊接缺陷</option>
                <option value="涂层不良">涂层不良</option>
                <option value="装配错误">装配错误</option>
                <option value="其他">其他</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">不良数量</label>
              <input
                type="number"
                value={form.defectQty}
                onChange={(e) => setForm({ ...form, defectQty: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">缺陷描述</label>
              <textarea
                value={form.defectDesc}
                onChange={(e) => setForm({ ...form, defectDesc: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                rows={3}
                placeholder="详细描述缺陷情况..."
              />
            </div>
          </>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-200">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
          >
            {loading ? "提交中..." : "提交检验结果"}
          </button>
          <Link
            href="/quality"
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            取消
          </Link>
        </div>
      </form>
    </div>
  );
}
