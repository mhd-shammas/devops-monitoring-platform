export type AlertSeverity = "CRITICAL" | "WARNING";

export type AlertType =
  | "APPLICATION_DOWN"
  | "HIGH_CPU"
  | "HIGH_MEMORY"
  | "HIGH_DISK"
  | "HIGH_RESPONSE_TIME";

export interface AlertRecord {
  id: string | number;
  alert_type: AlertType | string;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
  metric_value?: string;
}
