"use client";

import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MetricRecord } from "@/types/metric";
import { formatChartTime, formatTimestamp } from "@/lib/formatters";

interface HistoricalChartsProps {
  records: MetricRecord[];
  isLoading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value?: number | null;
    dataKey?: string;
    color?: string;
  }>;
  label?: string;
  unit?: string;
  title?: string;
}

const CustomChartTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  unit = "%",
  title,
}) => {
  if (active && payload && payload.length) {
    const rawVal = payload[0].value;
    const isValValid = rawVal !== null && rawVal !== undefined && !isNaN(Number(rawVal));
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md text-xs">
        <p className="font-semibold text-slate-300 mb-1">{title}</p>
        <p className="text-slate-400 font-mono text-[11px] mb-1.5">
          {label ? formatTimestamp(label) : ""}
        </p>
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: payload[0].color || "#06b6d4" }}
          />
          <span className="font-bold font-mono text-white text-sm">
            {isValValid
              ? `${typeof rawVal === "number" ? rawVal.toFixed(1) : rawVal}${unit}`
              : "N/A (DOWN)"}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export const HistoricalCharts: React.FC<HistoricalChartsProps> = ({
  records,
  isLoading = false,
}) => {
  // Chronological order (oldest -> newest, left -> right)
  const chartData = useMemo(() => {
    return [...records].reverse();
  }, [records]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-72 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 animate-pulse flex flex-col justify-between"
          >
            <div className="h-4 bg-slate-800 rounded w-1/3"></div>
            <div className="h-44 bg-slate-800/40 rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">
        <p className="text-sm">No historical metrics data available to plot charts.</p>
      </div>
    );
  }

  const latestRecord = chartData[chartData.length - 1];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Historical Resource Trends</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time telemetry timeseries across Response Time, CPU, Memory, and Disk utilization
          </p>
        </div>
        <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-3 py-1 rounded-full">
          {chartData.length} data points
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Response Time Chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl backdrop-blur-md flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <h4 className="text-sm font-bold text-slate-200">Response Time (ms)</h4>
            </div>
            {latestRecord && (
              <span className="text-xs font-mono font-bold text-emerald-400">
                {latestRecord.response_time !== null && latestRecord.response_time !== undefined
                  ? `${latestRecord.response_time.toFixed(1)} ms`
                  : "N/A"}
              </span>
            )}
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="respGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatChartTime}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#334155" }}
                  minTickGap={25}
                />
                <YAxis
                  domain={[0, "auto"]}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#334155" }}
                  tickFormatter={(v) => `${v}ms`}
                />
                <Tooltip
                  content={
                    <CustomChartTooltip
                      title="Response Time (ms)"
                      unit=" ms"
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="response_time"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#respGradient)"
                  isAnimationActive={false}
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CPU Usage Chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl backdrop-blur-md flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              <h4 className="text-sm font-bold text-slate-200">CPU Usage (%)</h4>
            </div>
            {latestRecord && (
              <span className="text-xs font-mono font-bold text-cyan-400">
                {latestRecord.cpu_usage.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatChartTime}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#334155" }}
                  minTickGap={25}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#334155" }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  content={
                    <CustomChartTooltip
                      title="CPU Usage"
                      unit="%"
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="cpu_usage"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#cpuGradient)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Memory Usage Chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl backdrop-blur-md flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-400"></span>
              <h4 className="text-sm font-bold text-slate-200">Memory Usage (%)</h4>
            </div>
            {latestRecord && (
              <span className="text-xs font-mono font-bold text-violet-400">
                {latestRecord.memory_usage.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatChartTime}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#334155" }}
                  minTickGap={25}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#334155" }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  content={
                    <CustomChartTooltip
                      title="Memory Usage"
                      unit="%"
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="memory_usage"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#memoryGradient)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Disk Usage Chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl backdrop-blur-md flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <h4 className="text-sm font-bold text-slate-200">Disk Usage (%)</h4>
            </div>
            {latestRecord && (
              <span className="text-xs font-mono font-bold text-amber-400">
                {latestRecord.disk_usage.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="diskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatChartTime}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#334155" }}
                  minTickGap={25}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#334155" }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  content={
                    <CustomChartTooltip
                      title="Disk Usage"
                      unit="%"
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="disk_usage"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#diskGradient)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
