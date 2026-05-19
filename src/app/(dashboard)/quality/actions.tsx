"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function QualityModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      fetch("/api/work-orders")
        .then((r) => r.json())
        .then((data) => setWorkOrders(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.workOrderId) { setError("请选择工单"); return; }
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
      setOpen(false);
      setForm({ workOrderId: "", result: "pass", defectType: "", defectQty: "0", defectDesc: "" });
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>

      {open && (
        <div className="dialog-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div ref={dialogRef} className="dialog-panel max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">质量检验</h3>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">选择工单</label>
                <select
                  value={form.workOrderId}
                  onChange={(e) => setForm({ ...form, workOrderId: e.target.value })}
                  className="input-large"
                  required
                >
                  <option value="">请选择工单</option>
                  {workOrders.map((wo: any) => (
                    <option key={wo.id} value={wo.id}>{wo.orderNo} - {wo.product?.name || ""}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">检验结果</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition ${
                    form.result === "pass" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"
                  }`}>
                    <input type="radio" name="result" value="pass" checked={form.result === "pass"}
                      onChange={() => setForm({ ...form, result: "pass" })} className="sr-only" />
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="font-bold text-green-700">合格</span>
                  </label>
                  <label className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition ${
                    form.result === "fail" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
                  }`}>
                    <input type="radio" name="result" value="fail" checked={form.result === "fail"}
                      onChange={() => setForm({ ...form, result: "fail" })} className="sr-only" />
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <span className="font-bold text-red-700">不合格</span>
                  </label>
                </div>
              </div>

              {form.result === "fail" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">缺陷类型</label>
                    <select value={form.defectType}
                      onChange={(e) => setForm({ ...form, defectType: e.target.value })}
                      className="input-large">
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
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">不良数量</label>
                    <input type="number" value={form.defectQty}
                      onChange={(e) => setForm({ ...form, defectQty: e.target.value })}
                      className="input-large" min="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">缺陷描述</label>
                    <textarea value={form.defectDesc}
                      onChange={(e) => setForm({ ...form, defectDesc: e.target.value })}
                      className="input-large" rows={2} placeholder="详细描述缺陷情况..." />
                  </div>
                </>
              )}

              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">{error}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="btn-primary flex-1 h-12 justify-center">
                  {loading ? "提交中..." : "提交检验结果"}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
