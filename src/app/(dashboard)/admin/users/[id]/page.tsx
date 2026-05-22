"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [form, setForm] = useState({
    name: "",
    role: "operator",
    workTypeId: "",
    assignedLine: "",
    active: true,
  });
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [workTypes, setWorkTypes] = useState<{ id: number; name: string }[]>([]);
  const [lines, setLines] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [userRes, wtRes, lineRes] = await Promise.all([
          fetch(`/api/users/${userId}`),
          fetch("/api/work-types"),
          fetch("/api/lines"),
        ]);

        const [userData, wtData, lineData] = await Promise.all([
          userRes.json(),
          wtRes.json(),
          lineRes.json(),
        ]);

        setWorkTypes(wtData);
        setLines(lineData);

        setUsername(userData.username);
        setForm({
          name: userData.name || "",
          role: userData.role || "operator",
          workTypeId: userData.workTypeId ? String(userData.workTypeId) : "",
          assignedLine: userData.assignedLine ? String(userData.assignedLine) : "",
          active: userData.active ?? true,
        });
      } catch {
        setError("加载用户信息失败");
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          role: form.role,
          workTypeId: form.workTypeId ? parseInt(form.workTypeId) : null,
          assignedLine: form.assignedLine ? parseInt(form.assignedLine) : null,
          active: form.active,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "更新失败");
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

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
          <h2>编辑用户</h2>
          <p>修改用户权限 — <span className="font-mono text-blue-600">{username}</span></p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">用户名</label>
          <input type="text" value={username}
            className="input-large bg-gray-50 text-gray-500 cursor-not-allowed" disabled />
          <p className="text-xs text-gray-400 mt-1">用户名不可修改</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">姓名</label>
          <input type="text" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input-large" required placeholder="真实姓名" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">角色</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="input-large">
            <option value="admin">管理员</option>
            <option value="supervisor">班组长</option>
            <option value="operator">操作工</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">工种</label>
          <select value={form.workTypeId} onChange={(e) => setForm({ ...form, workTypeId: e.target.value })}
            className="input-large">
            <option value="">不限</option>
            {workTypes.map((wt) => (
              <option key={wt.id} value={wt.id}>{wt.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">分配产线</label>
          <select value={form.assignedLine} onChange={(e) => setForm({ ...form, assignedLine: e.target.value })}
            className="input-large">
            <option value="">不限</option>
            {lines.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="flex items-center gap-3 py-2">
            <input type="checkbox" checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm font-semibold text-gray-700">启用账号</span>
          </label>
          <p className="text-xs text-gray-400 ml-8">取消勾选后该用户将无法登录</p>
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
                保存中...
              </span>
            ) : "保存修改"}
          </button>
          <Link href="/admin" className="btn-secondary">取消</Link>
        </div>
      </form>
    </div>
  );
}
