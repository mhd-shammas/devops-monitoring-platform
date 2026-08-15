import os
import time
from datetime import datetime,timezone
import httpx
import psutil
from database import SessionLocal
from models import Alert, Incident, Metric
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration settings
URL = os.getenv("HEALTH_CHECK_URL", "http://127.0.0.1:8000/health")
TIMEOUT_SECONDS = float(os.getenv("HEALTH_CHECK_TIMEOUT", "5.0"))
CHECK_INTERVAL_SECONDS = int(os.getenv("CHECK_INTERVAL_SECONDS", "10"))

# Configurable Alert Thresholds (from environment variables)
ALERT_CPU_THRESHOLD = float(os.getenv("ALERT_CPU_THRESHOLD", "90.0"))
ALERT_MEMORY_THRESHOLD = float(os.getenv("ALERT_MEMORY_THRESHOLD", "90.0"))
ALERT_DISK_THRESHOLD = float(os.getenv("ALERT_DISK_THRESHOLD", "90.0"))
ALERT_RESPONSE_TIME_THRESHOLD_MS = float(os.getenv("ALERT_RESPONSE_TIME_THRESHOLD_MS", "1000.0"))



def check_health():
    """
    Checks whether the FastAPI application health endpoint is UP and healthy.
    Measures elapsed response time in milliseconds from immediately before
    the HTTP request until response is received.
    Returns a tuple of (status, message, response_time_ms).
    """
    start_time = time.perf_counter()
    try:
        # Send an HTTP GET request to the health endpoint with a timeout
        response = httpx.get(URL, timeout=TIMEOUT_SECONDS)
        elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        # Check if the HTTP status code is 200 (OK)
        if response.status_code != 200:
            return "DOWN", "Application is unavailable", None

        # Parse response JSON and check that status is 'healthy'
        data = response.json()
        if data.get("status") == "healthy":
            return "UP", "Application is healthy", elapsed_ms
        else:
            return "DOWN", "Application is unavailable", None

    except httpx.ConnectError:
        # Connection refused / server is down
        return "DOWN", "Application is unavailable", None
    except httpx.TimeoutException:
        # Request timed out
        return "DOWN", "Application is unavailable", None
    except (ValueError, httpx.DecodingError):
        # Invalid JSON response
        return "DOWN", "Application is unavailable", None
    except httpx.RequestError:
        # Any other request error
        return "DOWN", "Application is unavailable", None


def get_cpu_usage():
    """
    Collects the current overall CPU usage percentage.
    Returns a tuple of (float_val, formatted_str).
    """
    try:
        val = float(psutil.cpu_percent(interval=None))
        return val, f"{val:.1f}%"
    except Exception:
        return 0.0, "N/A"


def get_ram_usage():
    """
    Collects the current overall RAM/memory usage percentage.
    Returns a tuple of (float_val, formatted_str).
    """
    try:
        val = float(psutil.virtual_memory().percent)
        return val, f"{val:.1f}%"
    except Exception:
        return 0.0, "N/A"


def get_disk_usage():
    """
    Collects the current overall disk usage percentage for the main system drive.
    Returns a tuple of (float_val, formatted_str).
    """
    try:
        root_path = os.path.abspath("/")
        val = float(psutil.disk_usage(root_path).percent)
        return val, f"{val:.1f}%"
    except Exception:
        return 0.0, "N/A"


def format_bytes(bytes_count):
    """
    Formats a byte count into a human-readable string (KB or MB).
    """
    if bytes_count >= 1024 * 1024:
        return f"{bytes_count / (1024 * 1024):.1f} MB"
    else:
        return f"{bytes_count / 1024:.1f} KB"


def get_network_io(prev_io):
    """
    Collects system-wide network I/O stats.
    Calculates bytes received (RX) and sent (TX) since the last measurement.
    Returns a tuple of (rx_val, tx_val, rx_str, tx_str, current_io).
    """
    try:
        current_io = psutil.net_io_counters()
        if prev_io is None:
            return 0.0, 0.0, "0.0 KB", "0.0 KB", current_io

        rx_bytes = float(max(0, current_io.bytes_recv - prev_io.bytes_recv))
        tx_bytes = float(max(0, current_io.bytes_sent - prev_io.bytes_sent))

        return rx_bytes, tx_bytes, format_bytes(rx_bytes), format_bytes(tx_bytes), current_io
    except Exception:
        return 0.0, 0.0, "N/A", "N/A", prev_io


def detect_alerts(status, cpu_val, ram_val, disk_val, response_time, timestamp_dt):
    """
    Evaluates current metrics against configured thresholds.
    Returns a list of plain alert data dictionaries (decoupled from ORM session).
    """
    alerts = []

    # 1. Application Status Check (CRITICAL)
    if status.upper() != "UP":
        alerts.append({
            "timestamp": timestamp_dt,
            "alert_type": "APPLICATION_DOWN",
            "severity": "CRITICAL",
            "message": "Application service is DOWN or unreachable",
            "metric_value": "DOWN",
        })

    # 2. CPU Usage Check (WARNING)
    if cpu_val >= ALERT_CPU_THRESHOLD:
        alerts.append({
            "timestamp": timestamp_dt,
            "alert_type": "HIGH_CPU",
            "severity": "WARNING",
            "message": f"CPU usage is high: {cpu_val:.1f}% (threshold: {ALERT_CPU_THRESHOLD}%)",
            "metric_value": f"{cpu_val:.1f}%",
        })

    # 3. Memory Usage Check (WARNING)
    if ram_val >= ALERT_MEMORY_THRESHOLD:
        alerts.append({
            "timestamp": timestamp_dt,
            "alert_type": "HIGH_MEMORY",
            "severity": "WARNING",
            "message": f"Memory usage is high: {ram_val:.1f}% (threshold: {ALERT_MEMORY_THRESHOLD}%)",
            "metric_value": f"{ram_val:.1f}%",
        })

    # 4. Disk Usage Check (WARNING)
    if disk_val >= ALERT_DISK_THRESHOLD:
        alerts.append({
            "timestamp": timestamp_dt,
            "alert_type": "HIGH_DISK",
            "severity": "WARNING",
            "message": f"Disk usage is high: {disk_val:.1f}% (threshold: {ALERT_DISK_THRESHOLD}%)",
            "metric_value": f"{disk_val:.1f}%",
        })

    # 5. Response Time Check (WARNING)
    if response_time is not None and response_time >= ALERT_RESPONSE_TIME_THRESHOLD_MS:
        alerts.append({
            "timestamp": timestamp_dt,
            "alert_type": "HIGH_RESPONSE_TIME",
            "severity": "WARNING",
            "message": f"Response time is high: {response_time:.1f} ms (threshold: {ALERT_RESPONSE_TIME_THRESHOLD_MS} ms)",
            "metric_value": f"{response_time:.1f} ms",
        })

    return alerts


def process_incidents(session, status, cpu_val, ram_val, disk_val, response_time, now_utc):
    """
    Manages the lifecycle (ACTIVE / RESOLVED) of incidents in PostgreSQL.
    Prevents duplicate ACTIVE incidents for ongoing violations.
    Resolves ACTIVE incidents when metrics return below configured thresholds.
    """
    conditions = {
        "APPLICATION_DOWN": {
            "triggered": status.upper() != "UP",
            "severity": "CRITICAL",
            "message": "Application service is DOWN or unreachable",
            "metric_name": "application_status",
            "metric_value": "DOWN" if status.upper() != "UP" else "UP",
            "threshold": "UP",
        },
        "HIGH_CPU": {
            "triggered": cpu_val >= ALERT_CPU_THRESHOLD,
            "severity": "WARNING",
            "message": f"CPU usage is high: {cpu_val:.1f}% (threshold: {ALERT_CPU_THRESHOLD}%)",
            "metric_name": "cpu_usage",
            "metric_value": f"{cpu_val:.1f}%",
            "threshold": f"{ALERT_CPU_THRESHOLD}%",
        },
        "HIGH_MEMORY": {
            "triggered": ram_val >= ALERT_MEMORY_THRESHOLD,
            "severity": "WARNING",
            "message": f"Memory usage is high: {ram_val:.1f}% (threshold: {ALERT_MEMORY_THRESHOLD}%)",
            "metric_name": "memory_usage",
            "metric_value": f"{ram_val:.1f}%",
            "threshold": f"{ALERT_MEMORY_THRESHOLD}%",
        },
        "HIGH_DISK": {
            "triggered": disk_val >= ALERT_DISK_THRESHOLD,
            "severity": "WARNING",
            "message": f"Disk usage is high: {disk_val:.1f}% (threshold: {ALERT_DISK_THRESHOLD}%)",
            "metric_name": "disk_usage",
            "metric_value": f"{disk_val:.1f}%",
            "threshold": f"{ALERT_DISK_THRESHOLD}%",
        },
        "HIGH_RESPONSE_TIME": {
            "triggered": response_time is not None and response_time >= ALERT_RESPONSE_TIME_THRESHOLD_MS,
            "severity": "WARNING",
            "message": f"Response time is high: {response_time:.1f} ms (threshold: {ALERT_RESPONSE_TIME_THRESHOLD_MS} ms)" if response_time else "",
            "metric_name": "response_time",
            "metric_value": f"{response_time:.1f} ms" if response_time else "N/A",
            "threshold": f"{ALERT_RESPONSE_TIME_THRESHOLD_MS} ms",
        },
    }

    # Query all currently ACTIVE incidents
    active_incidents = {
        inc.alert_type: inc
        for inc in session.query(Incident).filter(Incident.status == "ACTIVE").all()
    }

    for alert_type, cfg in conditions.items():
        if cfg["triggered"]:
            # If triggered and NO active incident exists -> create a new one
            if alert_type not in active_incidents:
                incident_id = f"INC-{int(time.time() * 1000) % 10000000:07d}"
                new_incident = Incident(
                    incident_id=incident_id,
                    alert_type=alert_type,
                    severity=cfg["severity"],
                    message=cfg["message"],
                    metric_name=cfg["metric_name"],
                    metric_value=cfg["metric_value"],
                    threshold=cfg["threshold"],
                    status="ACTIVE",
                    detected_at=now_utc,
                    resolved_at=None,
                    duration_seconds=None,
                )
                session.add(new_incident)
                print(f"  [INCIDENT CREATED] ({new_incident.severity}) {new_incident.incident_id}: {new_incident.message}")
            else:
                # Active incident already exists -> update current metric value without duplicating
                active_incidents[alert_type].metric_value = cfg["metric_value"]
        else:
            # If condition is cleared and an active incident exists -> mark RESOLVED
            if alert_type in active_incidents:
                inc = active_incidents[alert_type]
                inc.status = "RESOLVED"
                inc.resolved_at = now_utc
                start_dt = inc.detected_at
                end_dt = now_utc
                if start_dt and end_dt:
                    if start_dt.tzinfo is not None and end_dt.tzinfo is None:
                        start_dt = start_dt.replace(tzinfo=None)
                    elif start_dt.tzinfo is None and end_dt.tzinfo is not None:
                        end_dt = end_dt.replace(tzinfo=None)
                    duration = max(0.0, round((end_dt - start_dt).total_seconds(), 1))
                else:
                    duration = 0.0
                inc.duration_seconds = duration
                print(f"  [INCIDENT RESOLVED] {inc.incident_id} ({inc.alert_type}) resolved in {duration}s")


def save_metric_to_db(cpu_val, ram_val, disk_val, rx_bytes, tx_bytes, status, response_time=None):
    """
    Saves a single Metric record, detected Alert records, and tracks Incidents in PostgreSQL.
    Catches and handles database errors gracefully to keep monitoring active.
    Returns plain alert dictionaries to prevent DetachedInstanceError.
    """
    session = SessionLocal()
    now_utc = datetime.now(timezone.utc)
    try:
        metric = Metric(
            timestamp=now_utc,
            cpu_usage=cpu_val,
            memory_usage=ram_val,
            disk_usage=disk_val,
            bytes_received=rx_bytes,
            bytes_sent=tx_bytes,
            application_status=status,
            response_time=response_time,
        )
        session.add(metric)

        # Detect alerts based on configurable thresholds (returns plain dicts)
        detected_alerts = detect_alerts(status, cpu_val, ram_val, disk_val, response_time, now_utc)
        for alert_data in detected_alerts:
            alert_record = Alert(
                timestamp=alert_data["timestamp"],
                alert_type=alert_data["alert_type"],
                severity=alert_data["severity"],
                message=alert_data["message"],
                metric_value=alert_data["metric_value"],
            )
            session.add(alert_record)

        # Track and update Incident lifecycle (ACTIVE / RESOLVED)
        process_incidents(session, status, cpu_val, ram_val, disk_val, response_time, now_utc)

        session.commit()
        return detected_alerts
    except Exception as err:
        session.rollback()
        print(f" [DB Warning] Could not save metric/incident to PostgreSQL: {err}")
        return []
    finally:
        session.close()



def start_monitoring():
    """
    Runs health checks, system metrics, and database persistence continuously
    every 10 seconds until interrupted by the user (Ctrl+C).
    """
    print("Starting DevOps Health, System & Network Monitor (Database & Alerts Enabled)...")
    print(f"Monitoring target: {URL} (Interval: {CHECK_INTERVAL_SECONDS}s)")
    print(f"Alert Thresholds -> CPU: {ALERT_CPU_THRESHOLD}% | RAM: {ALERT_MEMORY_THRESHOLD}% | DISK: {ALERT_DISK_THRESHOLD}% | Latency: {ALERT_RESPONSE_TIME_THRESHOLD_MS}ms")
    print("Press Ctrl+C to stop.\n")

    # Prime baseline measurements
    get_cpu_usage()
    _, _, _, _, prev_net_io = get_network_io(None)

    try:
        while True:
            # Record current timestamp in YYYY-MM-DD HH:MM:SS format
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            # Check application HTTP health & measure response time
            status, message, response_time = check_health()

            # Collect current system metrics (both numeric floats and formatted strings)
            cpu_val, cpu_str = get_cpu_usage()
            ram_val, ram_str = get_ram_usage()
            disk_val, disk_str = get_disk_usage()
            rx_val, tx_val, rx_str, tx_str, prev_net_io = get_network_io(prev_net_io)

            # Save the metrics record and any detected alerts into PostgreSQL database
            alerts = save_metric_to_db(cpu_val, ram_val, disk_val, rx_val, tx_val, status, response_time)

            resp_str = f"{response_time:.1f} ms" if response_time is not None else "N/A"

            # Print formatted result containing timestamp, health status, response time, CPU, RAM, DISK, and Network I/O
            print(
                f"[{timestamp}] [{status}] {message} | Response Time: {resp_str} | CPU: {cpu_str} | RAM: {ram_str} | DISK: {disk_str} | RX: {rx_str} | TX: {tx_str}"
            )

            # Print any active alert warnings (using plain dictionary access)
            for a in alerts:
                sev = a.get("severity") if isinstance(a, dict) else getattr(a, "severity", "WARNING")
                atype = a.get("alert_type") if isinstance(a, dict) else getattr(a, "alert_type", "")
                msg = a.get("message") if isinstance(a, dict) else getattr(a, "message", "")
                print(f"  >>> [ALERT - {sev}] ({atype}): {msg}")

            # Wait 10 seconds before performing the next check
            time.sleep(CHECK_INTERVAL_SECONDS)

    except KeyboardInterrupt:
        # Handle Ctrl+C cleanly
        print("\nMonitoring stopped.")


if __name__ == "__main__":
    start_monitoring()







