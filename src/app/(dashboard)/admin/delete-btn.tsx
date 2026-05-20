"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteButton({
  id,
  apiPath,
  label = "删除",
  confirmMsg = "确认删除？",
}: {
  id: number;
  apiPath: string;
  label?: string;
  confirmMsg?: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  const handleDelete = async () => {
    try {
      const res = await fetch(apiPath, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "操作失败");
      router.refresh();
    } catch (err) {
      alert("操作失败: " + (err as Error).message);
    }
  };

  if (confirming) {
    return (
      <span className="inline-flex gap-1">
        <button
          onClick={handleDelete}
          className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg font-medium"
        >
          确认
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-gray-500 hover:bg-gray-100 px-2 py-1 rounded-lg"
        >
          取消
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg font-medium transition"
    >
      {label}
    </button>
  );
}
