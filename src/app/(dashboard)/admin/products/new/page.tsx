"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    code: "",
    specification: "",
    unit: "个",
    material: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-3 font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回系统管理
        </Link>
        <div className="page-header pb-0 border-0">
          <h2>添加产品</h2>
          <p>新增产品并配置工艺模板</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">产品名称 *</label>
          <input type="text" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input-large" required placeholder="如: 控制柜外壳" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">产品编码 *</label>
          <input type="text" value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            className="input-large" required placeholder="如: PROD-005" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">规格</label>
          <input type="text" value={form.specification}
            onChange={(e) => setForm({ ...form, specification: e.target.value })}
            className="input-large" placeholder="如: 800×600×300mm" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">材质</label>
          <input type="text" value={form.material}
            onChange={(e) => setForm({ ...form, material: e.target.value })}
            className="input-large" placeholder="如: 冷轧钢板" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">单位</label>
          <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
            className="input-large">
            <option value="个">个</option>
            <option value="套">套</option>
            <option value="件">件</option>
            <option value="台">台</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center h-12">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                创建中...
              </span>
            ) : "添加产品"}
          </button>
          <Link href="/admin" className="btn-secondary">取消</Link>
        </div>
      </form>
    </div>
  );
}
