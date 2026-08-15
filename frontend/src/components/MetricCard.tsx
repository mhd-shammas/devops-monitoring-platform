import React from "react";

interface MetricCardProps {
  title: string;
  value: string;
  subValue?: string;
  percentage?: number;
  type: "cpu" | "memory" | "disk" | "network_rx" | "network_tx" | "response_time";
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subValue,
  percentage,
  type,
}) => {
  // Determine color scheme based on metric type and value threshold
  const getProgressColor = (pct?: number) => {
    if (pct === undefined) return "bg-cyan-500";
    if (pct >= 90) return "bg-rose-500 shadow-rose-500/50";
    if (pct >= 75) return "bg-amber-500 shadow-amber-500/50";
    return "bg-emerald-500 shadow-emerald-500/50";
  };

  const getBadgeColor = (pct?: number) => {
    if (pct === undefined) return "text-cyan-400 bg-cyan-950/60 border-cyan-800/50";
    if (pct >= 90) return "text-rose-400 bg-rose-950/60 border-rose-800/50";
    if (pct >= 75) return "text-amber-400 bg-amber-950/60 border-amber-800/50";
    return "text-emerald-400 bg-emerald-950/60 border-emerald-800/50";
  };

  const renderIcon = () => {
    switch (type) {
      case "response_time":
        return (
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "cpu":
        return (
          <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M3 9h2m-2 6h2m14-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        );
      case "memory":
        return (
          <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case "disk":
        return (
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
        );
      case "network_rx":
        return (
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        );
      case "network_tx":
        return (
          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
          </svg>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-slate-700 hover:shadow-cyan-950/10">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/50">
          {renderIcon()}
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
          {value}
        </span>
        {subValue && (
          <span className={`text-xs px-2 py-1 rounded-md font-mono border ${getBadgeColor(percentage)}`}>
            {subValue}
          </span>
        )}
      </div>

      {percentage !== undefined && (
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/90">
            <div
              className={`h-full transition-all duration-500 rounded-full ${getProgressColor(percentage)}`}
              style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
