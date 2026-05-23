"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InventoryPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [showIn, setShowIn] = useState(false);
  const [showOut, setShowOut] = useState(false);
  const [showNewMaterial, setShowNewMaterial] = useState(false);
  const [form, setForm] = useState({ materialId: "", quantity: "", batchNo: "", notes: "" });
  const [newMatForm, setNewMatForm] = useState({ name: "", code: "", unit: "个" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"stock" | "records">("stock");

  const fetchData = () => {
    Promise.all([
      fetch("/api/materials").then((r) => r.json()),
      fetch("/api/inventory").then((r) => r.json()),
    ]).then(([m, i]) => {
      setMaterials(Array.isArray(m) ? m : []);
      setInventory(Array.isArray(i) ? i : []);
    }).catch(() => {});
  };

  useEffect(() => { fetchData(); }, []);

  const handleIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "入库失败"); }
      setShowIn(false);
      setForm({ materialId: "", quantity: "", batchNo: "", notes: "" });
      fetchData();
      router.refresh();
    } catch (err: any) { setError(err.message); }
    setLoading(false);
  };

  const handleOut = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/inventory/out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "出库失败"); }
      setShowOut(false);
      setForm({ materialId: "", quantity: "", batchNo: "", notes: "" });
      fetchData();
      router.refresh();
    } catch (err: any) { setError(err.message); }
    setLoading(false);
  };

  const handleNewMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMatForm),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "创建失败"); }
      setShowNewMaterial(false);
      setNewMatForm({ name: "", code: "", unit: "个" });
      fetchData();
      router.refresh();
    } catch (err: any) { setError(err.message); }
    setLoading(false);
  };

  const lowStockItems = inventory.filter((i) => i.quantity <= 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h2>库存管理</h2>
          <p>物料库存管理与出入库记录</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowIn(true); setError(""); }} className="btn-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            入库
          </button>
          <button onClick={() => { setShowOut(true); setError(""); }} className="btn-secondary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
            出库
          </button>
          <button onClick={() => { setShowNewMaterial(true); setError(""); }} className="btn-secondary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            新建物料
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white p-1 rounded-xl border border-gray-200 w-fit">
        <button onClick={() => setTab("stock")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === "stock" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}>
          库存总览
          {lowStockItems.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px]">{lowStockItems.length}</span>
          )}
        </button>
        <button onClick={() => setTab("records")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === "records" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}>
          出入记录
        </button>
      </div>

      {tab === "stock" && (
        <>
          {/* Low stock alert */}
          {lowStockItems.length > 0 && (
            <div className="bg-gradient-to-r from-red-50 to-red-50/50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="font-bold text-red-700 text-sm">库存预警</span>
                <span className="text-sm text-red-600">以下 {lowStockItems.length} 种物料库存不足</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {lowStockItems.map((item) => (
                  <span key={item.id} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
                    {item.material?.name || "未知"} ({item.quantity})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stock table */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>物料编码</th>
                    <th>名称</th>
                    <th>规格/单位</th>
                    <th>库存数量</th>
                    <th>批号</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-16 text-gray-400">暂无库存数据</td></tr>
                  ) : (
                    inventory.map((item) => (
                      <tr key={item.id} className={item.quantity <= 0 ? "bg-red-50/70" : ""}>
                        <td className="font-mono text-xs text-gray-500">{item.material?.code || "-"}</td>
                        <td className="font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            {item.material?.name || "未知"}
                            {item.quantity <= 0 && (
                              <span className="status-badge bg-red-100 text-red-600">缺货</span>
                            )}
                          </div>
                        </td>
                        <td className="text-gray-500">{item.material?.unit || "个"}</td>
                        <td>
                          <span className={`text-lg font-bold ${item.quantity <= 0 ? "text-red-600" : item.quantity <= 10 ? "text-amber-600" : "text-gray-900"}`}>
                            {item.quantity}
                          </span>
                        </td>
                        <td className="text-gray-400 text-xs">{item.batchNo || "-"}</td>
                        <td>
                          <div className="flex gap-1">
                            <button
                              onClick={() => { setForm({ ...form, materialId: String(item.materialId) }); setShowIn(true); }}
                              className="text-xs text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg font-medium transition"
                            >
                              入库
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm(`确认删除物料「${item.material?.name}」？所有库存和出入库记录将被永久删除。`)) return;
                                try {
                                  const res = await fetch(`/api/materials/${item.materialId}?hard=true`, { method: "DELETE" });
                                  if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
                                  fetchData();
                                } catch (err: any) { alert("操作失败: " + err.message); }
                              }}
                              className="text-xs text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg font-medium transition"
                            >
                              删除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "records" && <RecordsView />}

      {/* In Modal */}
      {showIn && (
        <div className="dialog-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowIn(false); }}>
          <div className="dialog-panel">
            <h3 className="text-lg font-bold text-gray-900 mb-4">入库登记</h3>
            <form onSubmit={handleIn} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">物料</label>
                <select value={form.materialId} onChange={(e) => setForm({ ...form, materialId: e.target.value })}
                  className="input-large" required>
                  <option value="">选择物料</option>
                  {materials.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">数量 *</label>
                  <input type="number" value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="input-large" min="1" required />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">批号</label>
                  <input type="text" value={form.batchNo}
                    onChange={(e) => setForm({ ...form, batchNo: e.target.value })}
                    className="input-large" placeholder="可选" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">备注</label>
                <input type="text" value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="input-large" placeholder="备注信息" />
              </div>
              {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                  {loading ? "处理中..." : "确认入库"}
                </button>
                <button type="button" onClick={() => setShowIn(false)} className="btn-secondary">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Out Modal */}
      {showOut && (
        <div className="dialog-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowOut(false); }}>
          <div className="dialog-panel">
            <h3 className="text-lg font-bold text-gray-900 mb-4">出库登记</h3>
            <form onSubmit={handleOut} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">物料</label>
                <select value={form.materialId} onChange={(e) => setForm({ ...form, materialId: e.target.value })}
                  className="input-large" required>
                  <option value="">选择物料</option>
                  {materials.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">出库数量 *</label>
                <input type="number" value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="input-large" min="1" required />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">备注</label>
                <input type="text" value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="input-large" placeholder="出库原因" />
              </div>
              {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center bg-gradient-to-r from-amber-500 to-orange-600">
                  {loading ? "处理中..." : "确认出库"}
                </button>
                <button type="button" onClick={() => setShowOut(false)} className="btn-secondary">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Material Modal */}
      {showNewMaterial && (
        <div className="dialog-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowNewMaterial(false); }}>
          <div className="dialog-panel">
            <h3 className="text-lg font-bold text-gray-900 mb-4">新建物料</h3>
            <form onSubmit={handleNewMaterial} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">物料名称 *</label>
                <input type="text" value={newMatForm.name}
                  onChange={(e) => setNewMatForm({ ...newMatForm, name: e.target.value })}
                  className="input-large" required placeholder="如: 不锈钢板" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">物料编码 *</label>
                <input type="text" value={newMatForm.code}
                  onChange={(e) => setNewMatForm({ ...newMatForm, code: e.target.value })}
                  className="input-large" required placeholder="如: MAT-001" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">单位</label>
                <select value={newMatForm.unit}
                  onChange={(e) => setNewMatForm({ ...newMatForm, unit: e.target.value })}
                  className="input-large">
                  <option value="个">个</option>
                  <option value="kg">千克</option>
                  <option value="m">米</option>
                  <option value="张">张</option>
                  <option value="件">件</option>
                </select>
              </div>
              {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                  {loading ? "创建中..." : "创建物料"}
                </button>
                <button type="button" onClick={() => setShowNewMaterial(false)} className="btn-secondary">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function RecordsView() {
  const [records, setRecords] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/inventory")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0 && data[0].records) {
          setRecords(data[0].records);
        }
      })
      .catch(() => {});
  }, []);

  // Fallback: load from inventory endpoint and combine
  useEffect(() => {
    fetch(`/api/inventory?type=${filter !== "all" ? filter : ""}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const allRecords = data.flatMap((i: any) => i.records || []);
          setRecords(allRecords);
        }
      })
      .catch(() => {});
  }, [filter]);

  const filtered = filter === "all" ? records : records.filter((r: any) => r.type === filter);

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex gap-2 p-4 border-b border-gray-100">
        {["all", "in", "out"].map((t) => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filter === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {t === "all" ? "全部" : t === "in" ? "入库" : "出库"}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>类型</th>
              <th>物料</th>
              <th>数量</th>
              <th>批号</th>
              <th>操作人</th>
              <th>时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400">暂无记录</td></tr>
              ) : (
                filtered.map((r: any) => (
                  <tr key={r.id}>
                    <td>
                      <span className={`status-badge ${r.type === "in" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
                        {r.type === "in" ? "入库" : "出库"}
                      </span>
                    </td>
                    <td className="font-medium">{r.material?.name || "-"}</td>
                    <td className={`font-bold ${r.type === "in" ? "text-green-600" : "text-amber-600"}`}>
                      {r.type === "in" ? "+" : "-"}{r.quantity}
                    </td>
                    <td className="text-gray-400 text-xs">{r.batchNo || "-"}</td>
                    <td className="text-gray-600">{r.operator?.name || "-"}</td>
                    <td className="text-gray-400 text-xs">{new Date(r.createdAt).toLocaleString("zh-CN")}</td>
                    <td>
                      <button
                        onClick={async () => {
                          if (!confirm("确认删除该出入库记录？库存数量将被还原。")) return;
                          try {
                            const res = await fetch(`/api/inventory/${r.id}`, { method: "DELETE" });
                            if (!res.ok) { const d = await res.json(); throw new Error(d.error || "删除失败"); }
                            setRecords(records.filter((rec: any) => rec.id !== r.id));
                          } catch (err: any) { alert("操作失败: " + err.message); }
                        }}
                        className="text-xs text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg font-medium transition"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))
              )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
