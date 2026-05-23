"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Wrench, Users, FileText } from "lucide-react";

interface WorkType {
  id: number;
  name: string;
  code: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  _count: {
    users: number;
    workOrders: number;
  };
}

export default function WorkTypesPage() {
  const router = useRouter();
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkTypes();
  }, []);

  const fetchWorkTypes = async () => {
    try {
      const res = await fetch("/api/work-types");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setWorkTypes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, hard = false) => {
    if (!confirm(hard ? "确认永久删除？" : "确认删除该工种？有分配用户时将自动停用。")) return;
    try {
      const url = hard ? `/api/work-types/${id}?hard=true` : `/api/work-types/${id}`;
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "操作失败");
      if (data.message) alert(data.message);
      router.refresh();
      fetchWorkTypes();
    } catch (err) {
      alert("操作失败: " + (err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <h2>工种管理</h2>
          <p>管理生产工种类型</p>
        </div>
        <Link href="/admin/work-types/new" className="btn-primary text-sm h-9">
          <Plus className="w-4 h-4" />
          添加工种
        </Link>
      </div>

      <div className="glass-card p-6">
        {loading ? (
          <div className="text-center py-10 text-gray-400">加载中...</div>
        ) : workTypes.length === 0 ? (
          <div className="text-center py-10 text-gray-400">暂无工种</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>编码</th>
                  <th>名称</th>
                  <th>描述</th>
                  <th>用户数</th>
                  <th>工单数</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {workTypes.map((wt) => (
                  <tr key={wt.id}>
                    <td className="font-mono text-xs text-gray-500">{wt.code}</td>
                    <td className="font-medium text-gray-900">{wt.name}</td>
                    <td className="text-gray-500 max-w-[200px] truncate">
                      {wt.description || "-"}
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                        <Users className="w-3.5 h-3.5" />
                        {wt._count.users}
                      </span>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                        <FileText className="w-3.5 h-3.5" />
                        {wt._count.workOrders}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          wt.active
                            ? "status-badge-completed"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {wt.active ? "启用" : "停用"}
                      </span>
                    </td>
                    <td>
                      {wt.active ? (
                        <button
                          onClick={() => handleDelete(wt.id)}
                          className="text-xs text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg font-medium transition"
                        >
                          删除
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400">已停用</span>
                          <button
                            onClick={() => handleDelete(wt.id, true)}
                            className="text-xs text-red-600 hover:bg-red-100 px-2 py-1 rounded font-medium transition"
                          >
                            彻底删除
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
