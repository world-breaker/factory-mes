"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function WorkOrderActions({ orderId, status }: { orderId: number; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    setLoading(action);
    try {
      if (action === "start") {
        await fetch(`/api/work-orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "in_progress" }),
        });
      } else if (action === "complete") {
        await fetch(`/api/work-orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "completed" }),
        });
      } else if (action === "cancel") {
        if (!confirm("确定取消此工单？取消后无法恢复。")) return;
        await fetch(`/api/work-orders/${orderId}`, { method: "DELETE" });
      }
      router.refresh();
    } catch (e) {
      alert("操作失败，请重试");
    }
    setLoading(null);
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {status === "pending" && (
        <button
          onClick={() => handleAction("start")}
          disabled={loading === "start"}
          className="btn-primary h-11"
        >
          {loading === "start" ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            </svg>
          )}
          开始生产
        </button>
      )}
      {status === "in_progress" && (
        <button
          onClick={() => handleAction("complete")}
          disabled={loading === "complete"}
          className="btn-primary h-11 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500"
        >
          {loading === "complete" ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          完成工单
        </button>
      )}
      {(status === "pending" || status === "in_progress") && (
        <button
          onClick={() => handleAction("cancel")}
          disabled={loading === "cancel"}
          className="btn-secondary h-11 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
        >
          取消工单
        </button>
      )}
    </div>
  );
}
