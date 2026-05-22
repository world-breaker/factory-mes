"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ComponentInfo = {
  id: number;
  name: string;
  code: string;
  specification?: string | null;
  unit?: string;
};

type BomItemNode = {
  id: number;
  productId: number;
  parentId: number | null;
  componentType: string;
  componentId: number;
  quantity: number;
  unit: string;
  level: number;
  notes: string | null;
  component: ComponentInfo | null;
  children: BomItemNode[];
};

type BomItemFlat = {
  id: number;
  productId: number;
  parentId: number | null;
  componentType: string;
  componentId: number;
  quantity: number;
  unit: string;
  level: number;
  notes: string | null;
};

type Props = {
  productId: number;
  tree: BomItemNode[];
  allProducts: { id: number; name: string; code: string }[];
  allMaterials: { id: number; name: string; code: string }[];
  bomItems: BomItemFlat[];
};

function TreeRow({
  node,
  depth,
  onDelete,
  onEdit,
}: {
  node: BomItemNode;
  depth: number;
  onDelete: (id: number) => void;
  onEdit: (item: BomItemNode) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <>
      <tr className="hover:bg-gray-50/50 transition-colors border-b border-gray-100">
        <td className="py-3">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 24}px` }}>
            {hasChildren ? (
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <span className="w-5 h-5 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              </span>
            )}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
              node.componentType === "product"
                ? "bg-violet-50 text-violet-600"
                : "bg-amber-50 text-amber-600"
            }`}>
              {node.componentType === "product" ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              )}
              {node.componentType === "product" ? "产品" : "物料"}
            </span>
          </div>
        </td>
        <td className="py-3">
          <span className="font-mono text-xs text-gray-500">{node.component?.code || "-"}</span>
        </td>
        <td className="py-3">
          <span className="font-medium text-gray-900">{node.component?.name || "-"}</span>
        </td>
        <td className="py-3">
          <span className="text-sm">{node.quantity}</span>
        </td>
        <td className="py-3">
          <span className="text-sm text-gray-500">{node.unit}</span>
        </td>
        <td className="py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(node)}
              className="text-xs text-blue-500 hover:bg-blue-50 px-2 py-1 rounded-lg font-medium transition"
            >
              编辑
            </button>
            <button
              onClick={() => onDelete(node.id)}
              className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg font-medium transition"
            >
              删除
            </button>
          </div>
        </td>
      </tr>
      {expanded && hasChildren && (
        <>
          {node.children.map((child) => (
            <TreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </>
      )}
    </>
  );
}

function AddBomForm({
  productId,
  allProducts,
  allMaterials,
  bomItems,
  editItem,
  onClose,
  onSuccess,
}: {
  productId: number;
  allProducts: { id: number; name: string; code: string }[];
  allMaterials: { id: number; name: string; code: string }[];
  bomItems: BomItemFlat[];
  editItem: BomItemNode | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [componentType, setComponentType] = useState(editItem?.componentType || "material");
  const [componentId, setComponentId] = useState(editItem?.componentId?.toString() || "");
  const [quantity, setQuantity] = useState(editItem?.quantity?.toString() || "1");
  const [unit, setUnit] = useState(editItem?.unit || "个");
  const [parentId, setParentId] = useState(editItem?.parentId?.toString() || "");
  const [notes, setNotes] = useState(editItem?.notes || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = editItem
        ? `/api/bom-items/${editItem.id}`
        : `/api/products/${productId}/bom`;

      const res = await fetch(url, {
        method: editItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componentType,
          componentId,
          quantity,
          unit,
          parentId: parentId || undefined,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "操作失败");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const options =
    componentType === "product"
      ? allProducts.map((p) => ({ value: p.id.toString(), label: `[${p.code}] ${p.name}` }))
      : allMaterials.map((m) => ({ value: m.id.toString(), label: `[${m.code}] ${m.name}` }));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">
            {editItem ? "编辑BOM项" : "添加BOM组件"}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">组件类型</label>
            <select
              value={componentType}
              onChange={(e) => { setComponentType(e.target.value); setComponentId(""); }}
              className="input-large"
              disabled={!!editItem}
            >
              <option value="material">物料</option>
              <option value="product">子产品(半成品)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">组件 *</label>
            <select
              value={componentId}
              onChange={(e) => setComponentId(e.target.value)}
              className="input-large"
              required
              disabled={!!editItem}
            >
              <option value="">请选择{componentType === "product" ? "产品" : "物料"}</option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">用量 *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input-large"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">单位</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className="input-large">
                <option value="个">个</option>
                <option value="套">套</option>
                <option value="件">件</option>
                <option value="台">台</option>
                <option value="kg">kg</option>
                <option value="m">m</option>
                <option value="L">L</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">父级BOM项（可选）</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="input-large"
              disabled={!!editItem}
            >
              <option value="">（顶层 - 无父级）</option>
              {bomItems
                .filter((item) => !editItem || item.id !== editItem.id)
                .map((item) => (
                  <option key={item.id} value={item.id.toString()}>
                    [{item.componentType === "product" ? "产品" : "物料"} ID:{item.componentId}] 层级{item.level}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">备注</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-large"
              placeholder="可选备注信息"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">
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
                  保存中...
                </span>
              ) : editItem ? "保存修改" : "添加组件"}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">取消</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function BomTreeClient({
  productId,
  tree,
  allProducts,
  allMaterials,
  bomItems,
}: Props) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editItem, setEditItem] = useState<BomItemNode | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/bom-items/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "删除失败");
      setDeleteConfirm(null);
      router.refresh();
    } catch (err) {
      alert("删除失败: " + (err as Error).message);
    }
  };

  const handleEdit = (item: BomItemNode) => {
    setEditItem(item);
    setShowAddForm(true);
  };

  const handleSuccess = () => {
    setShowAddForm(false);
    setEditItem(null);
    router.refresh();
  };

  const handleClose = () => {
    setShowAddForm(false);
    setEditItem(null);
  };

  const totalItems = bomItems.length;

  return (
    <>
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-gray-900">BOM结构树</h3>
            <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">
              共 {totalItems} 项
            </span>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary text-sm h-9"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            添加组件
          </button>
        </div>

        {totalItems === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">暂无BOM数据</p>
            <p className="text-xs mt-1">点击上方"添加组件"开始构建物料清单</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-[280px]">组件类型</th>
                  <th>编码</th>
                  <th>名称</th>
                  <th>用量</th>
                  <th>单位</th>
                  <th className="w-[120px]">操作</th>
                </tr>
              </thead>
              <tbody>
                {tree.map((node) => (
                  <TreeRow
                    key={node.id}
                    node={node}
                    depth={0}
                    onDelete={(id) => setDeleteConfirm(id)}
                    onEdit={handleEdit}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-2">确认删除</h3>
            <p className="text-sm text-gray-500 mb-5">
              删除后将同时移除所有子级BOM项，此操作不可撤销。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="btn-primary flex-1 justify-center h-11 bg-red-500 hover:bg-red-600"
              >
                确认删除
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary flex-1 justify-center h-11"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit form modal */}
      {showAddForm && (
        <AddBomForm
          productId={productId}
          allProducts={allProducts}
          allMaterials={allMaterials}
          bomItems={bomItems}
          editItem={editItem}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
