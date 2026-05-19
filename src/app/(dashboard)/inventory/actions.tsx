"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InventoryActions() {
  const router = useRouter();
  const [showIn, setShowIn] = useState(false);
  const [showOut, setShowOut] = useState(false);
  const [showMaterial, setShowMaterial] = useState(false);

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setShowIn(true)}
          className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
        >
          + 入库
        </button>
        <button
          onClick={() => setShowOut(true)}
          className="px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm font-medium"
        >
          - 出库
        </button>
        <button
          onClick={() => setShowMaterial(true)}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          + 新建物料
        </button>
      </div>

      {showIn && <StockModal type="in" onClose={() => { setShowIn(false); router.refresh(); }} />}
      {showOut && <StockModal type="out" onClose={() => { setShowOut(false); router.refresh(); }} />}
      {showMaterial && <MaterialModal onClose={() => { setShowMaterial(false); router.refresh(); }} />}
    </>
  );
}

function StockModal({ type, onClose }: { type: "in" | "out"; onClose: () => void }) {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({ materialId: "", quantity: "", batchNo: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!loaded) {
    fetch("/api/materials").then((r) => r.json()).then(setMaterials).catch(() => {});
    setLoaded(true);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.materialId || !form.quantity) {
      setError("请选择物料并填写数量");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const api = type === "in" ? "/api/inventory" : "/api/inventory/out";
      const res = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "操作失败");
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">{type === "in" ? "入库登记" : "出库登记"}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <select
            value={form.materialId}
            onChange={(e) => setForm({ ...form, materialId: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">选择物料</option>
            {materials.map((m: any) => (
              <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="数量"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            required
            min="1"
          />
          <input
            type="text"
            placeholder="批次号（可选）"
            value={form.batchNo}
            onChange={(e) => setForm({ ...form, batchNo: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="备注（可选）"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <div className="text-red-600 text-sm bg-red-50 p-2.5 rounded-lg">{error}</div>}
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? "处理中..." : "确认"}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50">
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MaterialModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: "", code: "", specification: "", unit: "个", category: "", minStock: "0" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code) {
      setError("名称和编码为必填项");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "创建失败");
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">新建物料</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" placeholder="物料名称 *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
          <input type="text" placeholder="物料编码 *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
          <input type="text" placeholder="规格（可选）" value={form.specification} onChange={(e) => setForm({ ...form, specification: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="grid grid-cols-3 gap-2">
            <input type="text" placeholder="单位" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="text" placeholder="分类" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="number" placeholder="最低库存" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {error && <div className="text-red-600 text-sm bg-red-50 p-2.5 rounded-lg">{error}</div>}
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? "创建中..." : "创建"}</button>
            <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50">取消</button>
          </div>
        </form>
      </div>
    </div>
  );
}
