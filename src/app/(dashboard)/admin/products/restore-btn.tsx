"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RestoreButton({ id }: { id: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRestore = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: true }),
      });
      if (!res.ok) throw new Error("恢复失败");
      router.refresh();
    } catch (err) {
      alert("恢复失败: " + (err as Error).message);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRestore}
      disabled={loading}
      className="text-xs text-green-600 hover:bg-green-50 px-2.5 py-1.5 rounded-lg font-medium transition disabled:opacity-50"
    >
      {loading ? "恢复中..." : "恢复"}
    </button>
  );
}
