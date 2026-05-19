"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

/* ─── 7-Day Production Trend ─── */
export function TrendChart({ data }: { data: { day: string; completed: number }[] }) {
  if (!data || data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-gray-400 text-sm">暂无数据</div>;
  }
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            labelStyle={{ fontWeight: 600, fontSize: 13 }}
          />
          <Area type="monotone" dataKey="completed" stroke="#3b82f6" strokeWidth={2} fill="url(#trendGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Production Gauge (speedometer style) ─── */
const COLORS_GAUGE = ["#3b82f6", "#e5e7eb"];

export function ProductionGauge({ value, max, label }: { value: number; max: number; label: string }) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const gaugeData = [
    { name: "完成", value: percentage },
    { name: "剩余", value: 100 - percentage },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={gaugeData}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={50}
              outerRadius={70}
              dataKey="value"
              stroke="none"
            >
              {gaugeData.map((_, idx) => (
                <Cell key={idx} fill={COLORS_GAUGE[idx]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center -mt-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        <span className="text-gray-400 text-sm ml-1">/ {max}</span>
      </div>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

/* ─── Quality Donut ─── */
const QUALITY_COLORS = ["#16a34a", "#dc2626"];

export function QualityDonut({ pass, fail }: { pass: number; fail: number }) {
  const total = pass + fail || 1;
  const passRate = Math.round((pass / total) * 100);
  const data = [
    { name: "合格", value: pass },
    { name: "不合格", value: fail },
  ].filter(d => d.value > 0);

  if (data.length === 0) {
    return <div className="h-36 flex items-center justify-center text-gray-400 text-sm">暂无数据</div>;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="h-28 w-28 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={28}
              outerRadius={40}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, idx) => (
                <Cell key={idx} fill={QUALITY_COLORS[idx]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-600" />
          <span className="text-sm text-gray-600">合格 {pass}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
          <span className="text-sm text-gray-600">不良 {fail}</span>
        </div>
        <p className="text-sm font-bold text-gray-900 mt-1">
          合格率 <span className="text-green-600">{passRate}%</span>
        </p>
      </div>
    </div>
  );
}
