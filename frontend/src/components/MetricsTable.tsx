import React from "react";
import { MetricRecord } from "@/types/metric";
import { formatBytes, formatTimestamp } from "@/lib/formatters";

interface MetricsTableProps {
  records: MetricRecord[];
}

export const MetricsTable: React.FC<MetricsTableProps> = ({ records }) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl backdrop-blur-md overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Recent Monitoring History</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Showing latest {records.length} monitoring snapshots recorded in PostgreSQL
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
          {records.length} Records
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th scope="col" className="px-6 py-3.5 font-semibold">
                ID
              </th>
              <th scope="col" className="px-6 py-3.5 font-semibold">
                Timestamp
              </th>
              <th scope="col" className="px-6 py-3.5 font-semibold">
                Status
              </th>
              <th scope="col" className="px-6 py-3.5 font-semibold">
                Response Time
              </th>
              <th scope="col" className="px-6 py-3.5 font-semibold">
                CPU
              </th>
              <th scope="col" className="px-6 py-3.5 font-semibold">
                Memory
              </th>
              <th scope="col" className="px-6 py-3.5 font-semibold">
                Disk
              </th>
              <th scope="col" className="px-6 py-3.5 font-semibold">
                RX (Recv)
              </th>
              <th scope="col" className="px-6 py-3.5 font-semibold">
                TX (Sent)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
            {records.map((m) => {
              const isUp = m.application_status.toUpperCase() === "UP";
              return (
                <tr
                  key={m.id}
                  className="hover:bg-slate-800/40 transition-colors duration-150"
                >
                  <td className="px-6 py-4 text-slate-500 font-semibold">#{m.id}</td>
                  <td className="px-6 py-4 text-slate-200 whitespace-nowrap">
                    {formatTimestamp(m.timestamp)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-sans text-xs font-semibold border ${
                        isUp
                          ? "bg-emerald-950/80 text-emerald-300 border-emerald-800/60"
                          : "bg-rose-950/80 text-rose-300 border-rose-800/60"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isUp ? "bg-emerald-400" : "bg-rose-400"
                        }`}
                      ></span>
                      {m.application_status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {m.response_time !== null && m.response_time !== undefined ? (
                      <span className="text-emerald-400 font-semibold">
                        {m.response_time.toFixed(1)} ms
                      </span>
                    ) : (
                      <span className="text-slate-500 font-normal">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={
                        m.cpu_usage >= 80
                          ? "text-rose-400 font-bold"
                          : m.cpu_usage >= 60
                          ? "text-amber-400"
                          : "text-slate-200"
                      }
                    >
                      {m.cpu_usage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={
                        m.memory_usage >= 80
                          ? "text-rose-400 font-bold"
                          : m.memory_usage >= 60
                          ? "text-amber-400"
                          : "text-slate-200"
                      }
                    >
                      {m.memory_usage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={
                        m.disk_usage >= 80
                          ? "text-rose-400 font-bold"
                          : m.disk_usage >= 60
                          ? "text-amber-400"
                          : "text-slate-200"
                      }
                    >
                      {m.disk_usage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-emerald-400">
                    {formatBytes(m.bytes_received)}
                  </td>
                  <td className="px-6 py-4 text-blue-400">
                    {formatBytes(m.bytes_sent)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
