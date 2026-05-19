"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProductionForm({
  workOrderId,
  processId,
  remainingQty,
}: {
  workOrderId: number;
  processId: number;
  remainingQty: number;
}) {
  const router = useRouter();
  const [good, setGood] = useState(remainingQty > 0 ? Math.min(remainingQty, 1) : 1);
  const [defect, setDefect] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (good <= 0 && defect <= 0) {
      setError("请填写良品或不良品数量");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workOrderId,
          processId,
          quantityGood: good,
          quantityDefect: defect,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "报工失败");
      }

      setGood(0);
      setDefect(0);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            良品数量
          </label>
          <div className="relative">
            <input
              type="number"
              value={good}
              onChange={(e) => setGood(parseInt(e.target.value) || 0)}
              className="w-full h-14 px-4 text-2xl font-bold border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-green-50/30"
              min="0"
              placeholder="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded">
              个
            </span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            不良品数量
          </label>
          <div className="relative">
            <input
              type="number"
              value={defect}
              onChange={(e) => setDefect(parseInt(e.target.value) || 0)}
              className="w-full h-14 px-4 text-2xl font-bold border-2 border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-red-50/30"
              min="0"
              placeholder="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-red-600 font-medium bg-red-100 px-2 py-0.5 rounded">
              个
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-14 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white font-bold text-lg rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg shadow-blue-500/20 active:scale-[0.99] flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            提交中...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            提交报工
          </>
        )}
      </button>

      <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        提交后将自动更新生产进度。不良品超过正常范围时，建议同时记录质检信息。
      </p>
    </form>
  );
}
