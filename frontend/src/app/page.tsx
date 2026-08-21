"use client";

import { useEffect, useState, useCallback } from "react";
import { MetricRecord } from "@/types/metric";
import { AlertRecord } from "@/types/alert";
import { IncidentRecord } from "@/types/incident";
import {
  fetchLatestMetric,
  fetchMetrics,
  fetchAlerts,
  fetchIncidents,
  fetchServers,
  ServerStatus,
} from "@/lib/api";
import { formatBytes } from "@/lib/formatters";
import { AlertsBanner } from "@/components/AlertsBanner";
import { StatusCard } from "@/components/StatusCard";
import { MetricCard } from "@/components/MetricCard";
import { HistoricalCharts } from "@/components/HistoricalCharts";
import { IncidentHistory } from "@/components/IncidentHistory";
import { MetricsTable } from "@/components/MetricsTable";
import { ErrorBanner } from "@/components/ErrorBanner";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonLoader } from "@/components/SkeletonLoader";

export default function DashboardPage() {
  const [latestMetric, setLatestMetric] = useState<MetricRecord | null>(null);
  const [metricsList, setMetricsList] = useState<MetricRecord[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [server, setServer] = useState<ServerStatus | null>(null);

  // Core data fetching function
  const loadData = useCallback(async (showSkeleton = false) => {
    if (showSkeleton) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      // Fetch latest record, historical list, active alerts, and incidents in parallel
      const [
        latestResult,
        listResult,
        alertsResult,
        incidentsResult,
        serversResult,
      ] = await Promise.allSettled([
        fetchLatestMetric(),
        fetchMetrics(50),
        fetchAlerts(),
        fetchIncidents(50),
        fetchServers(),
      ]);

      let newLatest: MetricRecord | null = null;
      let newList: MetricRecord[] = [];
      let newAlerts: AlertRecord[] = [];
      let newIncidents: IncidentRecord[] = [];
      let fetchErrorMessage: string | null = null;
      let newServer: ServerStatus | null = null;

      // Evaluate latest record response
      if (latestResult.status === "fulfilled") {
        newLatest = latestResult.value;
      } else if (
        latestResult.reason instanceof Error &&
        latestResult.reason.message.includes("No metrics")
      ) {
        // Handle 404 / No metrics state gracefully
        newLatest = null;
      } else {
        fetchErrorMessage =
          latestResult.reason?.message || "Failed to reach backend";
      }

      // Evaluate history records response
      if (listResult.status === "fulfilled") {
        newList = listResult.value;
      } else if (!fetchErrorMessage) {
        fetchErrorMessage =
          listResult.reason?.message || "Failed to fetch metrics list";
      }

      // Evaluate active alerts response
      if (alertsResult.status === "fulfilled") {
        newAlerts = alertsResult.value;
      }

      // Evaluate incidents response
      if (incidentsResult.status === "fulfilled") {
        newIncidents = incidentsResult.value;
      }

      // Evaluate monitored server status
      if (serversResult.status === "fulfilled") {
        newServer = serversResult.value[0] ?? null;
      }

      if (fetchErrorMessage && !newLatest && newList.length === 0) {
        setError(fetchErrorMessage);
      } else {
        setLatestMetric(newLatest);
        setMetricsList(newList);
        setAlerts(newAlerts);
        setIncidents(newIncidents);
        setServer(newServer);
        setLastFetched(new Date());
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(msg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch and auto-refresh timer (5 seconds)
  useEffect(() => {
    loadData(true);

    const interval = setInterval(() => {
      loadData(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                DevOps Control Plane
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
              DevOps Monitoring Platform
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {lastFetched && (
              <span className="text-xs text-slate-400 font-mono hidden md:inline">
                Auto-sync: 5s
              </span>
            )}

            <button
              onClick={() => loadData(false)}
              disabled={loading || isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold transition-all duration-200 hover:bg-slate-800 disabled:opacity-50 shadow-md"
            >
              <svg
                className={`w-4 h-4 text-cyan-400 ${isRefreshing ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>{isRefreshing ? "Refreshing..." : "Refresh Now"}</span>
            </button>
          </div>
        </header>

        {/* Dynamic State Container */}
        {loading ? (
          <SkeletonLoader />
        ) : error ? (
          <ErrorBanner message={error} onRetry={() => loadData(true)} />
        ) : server?.status === "OFFLINE" ? (
          <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-8 text-center">
            <div className="text-5xl mb-4">🔴</div>

            <h2 className="text-2xl font-bold text-red-400">Server Down</h2>

            <p className="mt-2 text-slate-300">
              {server.name} is currently unavailable.
            </p>

            {server.last_seen && (
              <p className="mt-2 text-sm text-slate-500 font-mono">
                Last heartbeat: {new Date(server.last_seen).toLocaleString()}
              </p>
            )}

            <button
              onClick={() => loadData(true)}
              className="mt-6 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-sm font-semibold"
            >
              Check Again
            </button>
          </div>
        ) : server?.status === "CONNECTING" ? (
          <div className="rounded-2xl border border-yellow-900/50 bg-yellow-950/20 p-8 text-center">
            <div className="text-5xl mb-4">🟡</div>

            <h2 className="text-2xl font-bold text-yellow-400">
              Waiting for Server
            </h2>

            <p className="mt-2 text-slate-300">
              The monitoring agent has not sent its first heartbeat yet.
            </p>
          </div>
        ) : !latestMetric && metricsList.length === 0 ? (
          <EmptyState onRefresh={() => loadData(true)} />
        ) : (
          <div className="space-y-6">
            {/* Active System Alerts Banner */}
            <AlertsBanner alerts={alerts} isLoading={loading} />

            {/* Top Level Status Card */}
            {latestMetric && (
              <StatusCard
                status={latestMetric.application_status}
                timestamp={latestMetric.timestamp}
                responseTime={latestMetric.response_time}
                isRefreshing={isRefreshing}
              />
            )}

            {/* Metric Cards Grid */}
            {latestMetric && (
              <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                <MetricCard
                  title="Response Time"
                  value={
                    latestMetric.response_time !== null &&
                    latestMetric.response_time !== undefined
                      ? `${latestMetric.response_time.toFixed(1)} ms`
                      : "N/A"
                  }
                  subValue={
                    latestMetric.application_status.toUpperCase() === "UP"
                      ? "Healthy"
                      : "Offline"
                  }
                  type="response_time"
                />
                <MetricCard
                  title="CPU Usage"
                  value={`${latestMetric.cpu_usage.toFixed(1)}%`}
                  percentage={latestMetric.cpu_usage}
                  type="cpu"
                />
                <MetricCard
                  title="Memory Usage"
                  value={`${latestMetric.memory_usage.toFixed(1)}%`}
                  percentage={latestMetric.memory_usage}
                  type="memory"
                />
                <MetricCard
                  title="Disk Usage"
                  value={`${latestMetric.disk_usage.toFixed(1)}%`}
                  percentage={latestMetric.disk_usage}
                  type="disk"
                />
                <MetricCard
                  title="Network RX"
                  value={formatBytes(latestMetric.bytes_received)}
                  subValue="Received"
                  type="network_rx"
                />
                <MetricCard
                  title="Network TX"
                  value={formatBytes(latestMetric.bytes_sent)}
                  subValue="Sent"
                  type="network_tx"
                />
              </section>
            )}

            {/* Historical Monitoring Charts */}
            {metricsList.length > 0 && (
              <HistoricalCharts records={metricsList} isLoading={loading} />
            )}

            {/* Incident History & Lifecycle Section */}
            <IncidentHistory incidents={incidents} isLoading={loading} />

            {/* Metrics History Table */}
            {metricsList.length > 0 && <MetricsTable records={metricsList} />}
          </div>
        )}
      </div>
    </main>
  );
}
