"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelWorkOrderButton({
  workOrderId,
  status,
}: {
  workOrderId: number;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (status === "cancelled" || status === "completed") {
    return null;
  }

  const handleCancel = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("确认取消该工单？此操作不可撤销。")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/work-orders/${workOrderId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("取消失败");
      router.refresh();
    } catch (err) {
      alert("操作失败: " + (err as Error).message);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="text-xs text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg font-medium transition disabled:opacity-50"
    >
      {loading ? "取消中..." : "取消工单"}
    </button>
  );
}
