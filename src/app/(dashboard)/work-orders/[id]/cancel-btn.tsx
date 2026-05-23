"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function WorkOrderActionButton({
  workOrderId,
  status,
}: {
  workOrderId: number;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isPending = status === "pending" || status === "in_progress";

  const handleAction = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPending) {
      if (!confirm("确认取消该工单？工单状态将变为「已取消」。")) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/work-orders/${workOrderId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("取消失败");
        router.refresh();
      } catch (err) {
        alert("操作失败: " + (err as Error).message);
        setLoading(false);
      }
    } else {
      if (!confirm("确认永久删除该工单？所有关联的生产记录、质检记录将被一并删除。此操作不可撤销！")) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/work-orders/${workOrderId}?hard=true`, { method: "DELETE" });
        if (!res.ok) throw new Error("删除失败");
        router.refresh();
      } catch (err) {
        alert("操作失败: " + (err as Error).message);
        setLoading(false);
      }
    }
  };

  return (
    <button
      onClick={handleAction}
      disabled={loading}
      className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition disabled:opacity-50 ${
        isPending
          ? "text-red-500 hover:bg-red-50"
          : "text-red-600 hover:bg-red-100"
      }`}
    >
      {loading ? "处理中..." : isPending ? "取消工单" : "删除"}
    </button>
  );
}
