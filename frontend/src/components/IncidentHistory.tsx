"use client";

import React, { useState } from "react";
import { IncidentRecord } from "@/types/incident";
import { formatTimestamp, formatDuration } from "@/lib/formatters";

interface IncidentHistoryProps {
  incidents: IncidentRecord[];
  isLoading?: boolean;
}

export const IncidentHistory: React.FC<IncidentHistoryProps> = ({
  incidents,
  isLoading,
}) => {
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "RESOLVED">("ALL");

  if (isLoading) {
    return (
      <div className="h-64 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/4 mb-4"></div>
        <div className="h-44 bg-slate-800/40 rounded-xl"></div>
      </div>
    );
  }

  const activeIncidents = incidents.filter((inc) => inc.status === "ACTIVE");
  const resolvedIncidents = incidents.filter((inc) => inc.status === "RESOLVED");

  const displayedIncidents =
    filter === "ACTIVE"
      ? activeIncidents
      : filter === "RESOLVED"
      ? resolvedIncidents
      : incidents;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl backdrop-blur-md overflow-hidden">
      {/* Header & Filter Controls */}
      <div className="px-6 py-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-100">Incident Lifecycle & History</h3>
            {activeIncidents.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-rose-950 text-rose-400 border border-rose-800/80 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                {activeIncidents.length} ACTIVE
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit log of threshold breaches and automatic resolutions with lifecycle tracking
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-150 ${
              filter === "ALL"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All ({incidents.length})
          </button>
          <button
            onClick={() => setFilter("ACTIVE")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-150 ${
              filter === "ACTIVE"
                ? "bg-rose-950 text-rose-300 border border-rose-800/50 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Active ({activeIncidents.length})
          </button>
          <button
            onClick={() => setFilter("RESOLVED")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-150 ${
              filter === "RESOLVED"
                ? "bg-emerald-950 text-emerald-300 border border-emerald-800/50 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Resolved ({resolvedIncidents.length})
          </button>
        </div>
      </div>

      {/* Prominent Active Incidents Callout if any */}
      {activeIncidents.length > 0 && filter !== "RESOLVED" && (
        <div className="p-6 bg-rose-950/20 border-b border-rose-900/30 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
            <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping"></span>
            Ongoing Active Incidents Requiring Attention
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeIncidents.map((inc) => (
              <div
                key={inc.incident_id}
                className="p-4 rounded-xl border border-rose-800/60 bg-rose-950/50 flex flex-col justify-between gap-2 shadow-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-rose-300">
                        {inc.incident_id}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-900/80 text-rose-200 border border-rose-700">
                        {inc.severity}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                        {inc.alert_type}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-100 mt-1">{inc.message}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-rose-500 text-slate-950 shrink-0">
                    ACTIVE
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-rose-900/40">
                  <span>Detected: {formatTimestamp(inc.detected_at)}</span>
                  <span className="font-mono text-rose-300 font-semibold">
                    Value: {inc.metric_value} (Target: {inc.threshold})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incidents Table */}
      {displayedIncidents.length === 0 ? (
        <div className="p-8 text-center text-slate-400">
          <p className="text-sm font-medium">No {filter.toLowerCase()} incidents recorded.</p>
          <p className="text-xs text-slate-500 mt-1">
            Incidents will automatically be registered when telemetry metrics exceed configured thresholds.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-3.5 font-semibold">
                  Incident ID
                </th>
                <th scope="col" className="px-6 py-3.5 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-6 py-3.5 font-semibold">
                  Severity
                </th>
                <th scope="col" className="px-6 py-3.5 font-semibold">
                  Alert Type
                </th>
                <th scope="col" className="px-6 py-3.5 font-semibold">
                  Message
                </th>
                <th scope="col" className="px-6 py-3.5 font-semibold">
                  Trigger Value
                </th>
                <th scope="col" className="px-6 py-3.5 font-semibold">
                  Detected At
                </th>
                <th scope="col" className="px-6 py-3.5 font-semibold">
                  Resolved At
                </th>
                <th scope="col" className="px-6 py-3.5 font-semibold">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {displayedIncidents.map((inc) => {
                const isActive = inc.status === "ACTIVE";
                const isCritical = inc.severity === "CRITICAL";
                return (
                  <tr
                    key={inc.id || inc.incident_id}
                    className="hover:bg-slate-800/40 transition-colors duration-150"
                  >
                    {/* Incident ID */}
                    <td className="px-6 py-4 font-bold text-slate-200 whitespace-nowrap">
                      {inc.incident_id}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-sans text-xs font-semibold border ${
                          isActive
                            ? "bg-rose-950/80 text-rose-300 border-rose-800/60"
                            : "bg-emerald-950/80 text-emerald-300 border-emerald-800/60"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive ? "bg-rose-400 animate-ping" : "bg-emerald-400"
                          }`}
                        ></span>
                        {inc.status}
                      </span>
                    </td>

                    {/* Severity Badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${
                          isCritical
                            ? "bg-rose-900/40 text-rose-300 border-rose-800"
                            : "bg-amber-900/40 text-amber-300 border-amber-800"
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </td>

                    {/* Alert Type */}
                    <td className="px-6 py-4 text-slate-300 font-sans whitespace-nowrap">
                      {inc.alert_type}
                    </td>

                    {/* Message */}
                    <td className="px-6 py-4 font-sans text-slate-200 min-w-[220px]">
                      {inc.message}
                    </td>

                    {/* Trigger Value */}
                    <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                      <span className="font-semibold text-cyan-400">{inc.metric_value}</span>
                      <span className="text-slate-500 text-[10px] ml-1">
                        (&ge; {inc.threshold})
                      </span>
                    </td>

                    {/* Detected At */}
                    <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                      {formatTimestamp(inc.detected_at)}
                    </td>

                    {/* Resolved At */}
                    <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                      {inc.resolved_at ? (
                        <span className="text-emerald-400">{formatTimestamp(inc.resolved_at)}</span>
                      ) : (
                        <span className="text-slate-500 italic">Unresolved</span>
                      )}
                    </td>

                    {/* Duration */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isActive ? (
                        <span className="text-rose-400 font-semibold animate-pulse">Ongoing</span>
                      ) : (
                        <span className="text-slate-200 font-semibold">
                          {formatDuration(inc.duration_seconds)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
