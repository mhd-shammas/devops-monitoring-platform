import React from "react";
import { AlertRecord } from "@/types/alert";
import { formatTimestamp } from "@/lib/formatters";

interface AlertsBannerProps {
  alerts: AlertRecord[];
  isLoading?: boolean;
}

export const AlertsBanner: React.FC<AlertsBannerProps> = ({ alerts, isLoading }) => {
  if (isLoading) {
    return (
      <div className="h-16 rounded-2xl border border-slate-800 bg-slate-900/60 animate-pulse flex items-center px-6">
        <div className="h-4 bg-slate-800 rounded w-1/4"></div>
      </div>
    );
  }

  // 1. "No active alerts" state
  if (alerts.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-900/40 bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-slate-900/80 p-4 sm:p-5 shadow-lg backdrop-blur-md transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-950 border border-emerald-800/60 text-emerald-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-sm">System Status Normal</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                  ALL HEALTHY
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                No active alerts detected. All resource telemetry and service endpoints are operating within configured thresholds.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700 self-start sm:self-center shrink-0">
            0 Active Alerts
          </span>
        </div>
      </div>
    );
  }

  // 2. Active alerts state
  const hasCritical = alerts.some((a) => a.severity.toUpperCase() === "CRITICAL");

  return (
    <div
      className={`rounded-2xl border p-5 shadow-2xl backdrop-blur-md transition-all duration-300 ${
        hasCritical
          ? "border-rose-800/80 bg-rose-950/30 shadow-rose-950/20"
          : "border-amber-800/80 bg-amber-950/30 shadow-amber-950/20"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                hasCritical ? "bg-rose-400" : "bg-amber-400"
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                hasCritical ? "bg-rose-500" : "bg-amber-500"
              }`}
            ></span>
          </span>
          <h3 className="text-base font-bold text-slate-100">
            Active System Alerts ({alerts.length})
          </h3>
        </div>
        <span
          className={`text-xs font-mono font-bold px-3 py-1 rounded-full border self-start sm:self-center ${
            hasCritical
              ? "bg-rose-950 text-rose-300 border-rose-800/80"
              : "bg-amber-950 text-amber-300 border-amber-800/80"
          }`}
        >
          {hasCritical ? "CRITICAL INCIDENTS DETECTED" : "SYSTEM WARNINGS DETECTED"}
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const isCritical = alert.severity.toUpperCase() === "CRITICAL";
          return (
            <div
              key={alert.id}
              className={`rounded-xl p-4 border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-150 ${
                isCritical
                  ? "bg-rose-950/60 border-rose-800/60 hover:border-rose-700"
                  : "bg-amber-950/50 border-amber-800/60 hover:border-amber-700"
              }`}
            >
              <div className="flex items-start sm:items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                    isCritical
                      ? "bg-rose-950 border-rose-700 text-rose-400"
                      : "bg-amber-950 border-amber-700 text-amber-400"
                  }`}
                >
                  {isCritical ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                        isCritical
                          ? "bg-rose-900/80 text-rose-200 border-rose-700"
                          : "bg-amber-900/80 text-amber-200 border-amber-700"
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {alert.alert_type}
                    </span>
                    <span className="font-semibold text-sm text-slate-100">
                      {alert.message}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">
                    Detected: {formatTimestamp(alert.timestamp)}
                  </p>
                </div>
              </div>

              {alert.metric_value && (
                <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                  <span className="text-xs text-slate-400">Current Value:</span>
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                      isCritical
                        ? "bg-rose-900/90 text-rose-200 border-rose-600"
                        : "bg-amber-900/90 text-amber-200 border-amber-600"
                    }`}
                  >
                    {alert.metric_value}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
