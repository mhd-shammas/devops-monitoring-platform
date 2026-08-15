export type IncidentStatus = "ACTIVE" | "RESOLVED";
export type IncidentSeverity = "CRITICAL" | "WARNING";

export interface IncidentRecord {
  id: number;
  incident_id: string;
  alert_type: string;
  severity: IncidentSeverity;
  message: string;
  metric_name: string;
  metric_value: string;
  threshold: string;
  status: IncidentStatus;
  detected_at: string;
  resolved_at: string | null;
  duration_seconds: number | null;
}
