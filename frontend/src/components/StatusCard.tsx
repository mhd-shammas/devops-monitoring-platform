import React from "react";
import { formatTimestamp, getRelativeTime } from "@/lib/formatters";

interface StatusCardProps {
  status: string;
  timestamp: string;
  responseTime?: number | null;
  isRefreshing?: boolean;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  status,
  timestamp,
  responseTime,
  isRefreshing,
}) => {
  const isUp = status.toUpperCase() === "UP";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-md transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left column: Title & Timestamp */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              System Health & Target Status
            </span>
            {isRefreshing && (
              <span className="inline-flex items-center text-xs text-cyan-400 animate-pulse">
                • Updating...
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-3">
            Application Service Endpoint
          </h2>
          <p className="mt-2 text-sm text-slate-400 flex flex-wrap items-center gap-2">
            <span>Last Checked:</span>
            <span className="font-mono text-slate-200 bg-slate-800/80 px-2 py-0.5 rounded text-xs">
              {formatTimestamp(timestamp)}
            </span>
            <span className="text-xs text-slate-500">({getRelativeTime(timestamp)})</span>
            {responseTime !== undefined && responseTime !== null ? (
              <span className="inline-flex items-center gap-1 font-mono text-xs text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Response: {responseTime.toFixed(1)} ms
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700/50">
                Response: N/A
              </span>
            )}
          </p>
        </div>

        {/* Right column: UP/DOWN Status Badge */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          <div
            className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-base font-bold tracking-wide border shadow-lg transition-all duration-300 ${
              isUp
                ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-emerald-900/20"
                : "bg-rose-950/80 text-rose-300 border-rose-500/40 shadow-rose-900/20"
            }`}
          >
            <span className="relative flex h-3.5 w-3.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isUp ? "bg-emerald-400" : "bg-rose-400"
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
                  isUp ? "bg-emerald-500" : "bg-rose-500"
                }`}
              ></span>
            </span>
            <span>{isUp ? "APPLICATION UP" : "APPLICATION DOWN"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
