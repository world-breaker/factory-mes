"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Step {
  name: string;
  description: string;
  durationMinutes: number | "";
  qualityCheckRequired: boolean;
}

const COMMON_STEPS = [
  "下料", "冲压成型", "焊接", "打磨", "表面处理",
  "组装", "终检包装", "机加工", "热处理", "电镀",
  "清洗", "包装",
];

export default function NewTemplatePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    productId: "",
  });
  const [steps, setSteps] = useState<Step[]>([
    { name: "", description: "", durationMinutes: "", qualityCheckRequired: false },
  ]);
  const [products, setProducts] = useState<{ id: number; name: string; code: string }[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => {});
  }, []);

  const addStep = () => {
    setSteps([...steps, { name: "", description: "", durationMinutes: "", qualityCheckRequired: false }]);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof Step, value: string | boolean | number) => {
    const updated = [...steps];
    (updated[index] as any)[field] = value;
    setSteps(updated);
  };

  const addCommonStep = (name: string) => {
    setSteps([...steps, { name, description: "", durationMinutes: "", qualityCheckRequired: false }]);
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= steps.length) return;
    const updated = [...steps];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setSteps(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate steps
    const validSteps = steps.filter((s) => s.name.trim());
    if (validSteps.length === 0) {
      setError("请至少添加一道工序");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/process-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          productId: form.productId || null,
          steps: validSteps.map((s) => ({
            name: s.name,
            description: s.description || null,
            durationMinutes: s.durationMinutes || null,
            qualityCheckRequired: s.qualityCheckRequired,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "创建失败");
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-3 font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回系统管理
        </Link>
        <div className="page-header pb-0 border-0">
          <h2>创建工艺模板</h2>
          <p>定义产品生产工艺流程</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            基本信息
          </h3>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">模板名称 *</label>
            <input type="text" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-large" required placeholder="如: 控制柜外壳工艺" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">描述</label>
            <textarea value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-large" rows={2} placeholder="工艺模板说明" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">关联产品</label>
            <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}
              className="input-large">
              <option value="">不关联产品</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Step Editor */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-4 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              工序列表
            </h3>
            <button type="button" onClick={addStep}
              className="btn-primary text-sm h-9">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              添加工序
            </button>
          </div>

          {/* Common Steps Suggestions */}
          <div>
            <p className="text-xs text-gray-500 mb-2">快捷添加常用工序：</p>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_STEPS.map((name) => (
                <button key={name} type="button" onClick={() => addCommonStep(name)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 border border-gray-200 transition">
                  + {name}
                </button>
              ))}
            </div>
          </div>

          {/* Step Rows */}
          <div className="space-y-3">
            {steps.map((step, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-medium text-gray-400">工序 #{idx + 1}</span>
                  <div className="flex-1" />
                  {/* Reorder buttons */}
                  <button type="button" onClick={() => moveStep(idx, "up")} disabled={idx === 0}
                    className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button type="button" onClick={() => moveStep(idx, "down")} disabled={idx === steps.length - 1}
                    className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button type="button" onClick={() => removeStep(idx)} disabled={steps.length <= 1}
                    className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">工序名称 *</label>
                    <input type="text" value={step.name}
                      onChange={(e) => updateStep(idx, "name", e.target.value)}
                      className="input-large text-sm" required placeholder="如: 焊接" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">标准工时(分钟)</label>
                    <input type="number" value={step.durationMinutes}
                      onChange={(e) => updateStep(idx, "durationMinutes", e.target.value === "" ? "" : parseInt(e.target.value))}
                      className="input-large text-sm" min={0} placeholder="如: 30" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">描述</label>
                    <input type="text" value={step.description}
                      onChange={(e) => updateStep(idx, "description", e.target.value)}
                      className="input-large text-sm" placeholder="工序详细说明" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={step.qualityCheckRequired}
                        onChange={(e) => updateStep(idx, "qualityCheckRequired", e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                      <span className="text-sm text-gray-600">需要质检</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center h-12">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                创建中...
              </span>
            ) : "创建模板"}
          </button>
          <Link href="/admin" className="btn-secondary">取消</Link>
        </div>
      </form>
    </div>
  );
}
