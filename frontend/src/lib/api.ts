import { MetricRecord } from "@/types/metric";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_FASTAPI_URL || "http://127.0.0.1:8000";

/**
 * Fetch the latest metric record from FastAPI backend (/metrics/latest)
 */
export async function fetchLatestMetric(): Promise<MetricRecord> {
  const response = await fetch(`${API_BASE_URL}/metrics/latest`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("No metrics recorded yet");
    }
    throw new Error(
      `Failed to fetch latest metric: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

/**
 * Fetch recent metrics history from FastAPI backend (/metrics?limit=50)
 */
export async function fetchMetrics(
  limit: number = 50,
): Promise<MetricRecord[]> {
  const response = await fetch(`${API_BASE_URL}/metrics?limit=${limit}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch metrics list: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

/**
 * Fetch active alerts from FastAPI backend (/alerts)
 */
export async function fetchAlerts(): Promise<
  import("@/types/alert").AlertRecord[]
> {
  try {
    const response = await fetch(`${API_BASE_URL}/alerts`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return [];
    }

    return response.json();
  } catch {
    return [];
  }
}

/**
 * Fetch incident history from FastAPI backend (/incidents?limit=50)
 */
export async function fetchIncidents(
  limit: number = 50,
): Promise<import("@/types/incident").IncidentRecord[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/incidents?limit=${limit}`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return [];
    }

    return response.json();
  } catch {
    return [];
  }
}

/**
 * Fetch currently ACTIVE incidents from FastAPI backend (/incidents/active)
 */
export async function fetchActiveIncidents(): Promise<
  import("@/types/incident").IncidentRecord[]
> {
  try {
    const response = await fetch(`${API_BASE_URL}/incidents/active`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return [];
    }

    return response.json();
  } catch {
    return [];
  }
}

export interface ServerStatus {
  server_id: string;
  name: string;
  ip_address: string | null;
  status: "ONLINE" | "OFFLINE" | "CONNECTING";
  last_seen: string | null;
  created_at: string;
}

export async function fetchServers(): Promise<ServerStatus[]> {
  const response = await fetch("/api/servers", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch servers: ${response.status}`);
  }

  return response.json();
}
