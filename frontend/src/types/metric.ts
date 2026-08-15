export interface MetricRecord {
  id: number;
  timestamp: string;
  response_time?: number | null;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  bytes_received: number;
  bytes_sent: number;
  application_status: string;
}
