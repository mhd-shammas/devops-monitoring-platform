import hashlib
import hmac
import os
import secrets
import time

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from database import get_db
from models import Alert, Incident, Metric, Server

# Load environment variables
load_dotenv()

# Configurable Alert Thresholds (from environment variables)
ALERT_CPU_THRESHOLD = float(os.getenv("ALERT_CPU_THRESHOLD", "90.0"))
ALERT_MEMORY_THRESHOLD = float(os.getenv("ALERT_MEMORY_THRESHOLD", "90.0"))
ALERT_DISK_THRESHOLD = float(os.getenv("ALERT_DISK_THRESHOLD", "90.0"))
ALERT_RESPONSE_TIME_THRESHOLD_MS = float(os.getenv("ALERT_RESPONSE_TIME_THRESHOLD_MS", "1000.0"))
SERVER_HEARTBEAT_TIMEOUT_SECONDS = 30

app = FastAPI(title="DevOps Monitoring Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app_health_status = "healthy"


@app.get("/")
def root():
    return {"message": "DevOps Monitoring Platform is running"}


@app.get("/health")
def health(status: Optional[str] = Query(default=None)):
    global app_health_status
    if status is not None:
        if status.lower() in ["unhealthy", "down"]:
            return {"status": "unhealthy"}
        elif status.lower() in ["healthy", "up"]:
            return {"status": "healthy"}
    return {"status": app_health_status}


@app.post("/health/toggle")
def toggle_health():
    global app_health_status
    app_health_status = "unhealthy" if app_health_status == "healthy" else "healthy"
    return {"status": app_health_status}

@app.post("/servers")
def register_server(
    name: str = Query(..., min_length=1, max_length=255),
    ip_address: Optional[str] = Query(default=None, max_length=45),
    db: Session = Depends(get_db),
):
    """
    Register a new monitored server.

    Returns the authentication token only during registration.
    The database stores only its SHA-256 hash.
    """
    server_id = f"srv_{secrets.token_urlsafe(12)}"
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()

    server = Server(
        server_id=server_id,
        name=name,
        ip_address=ip_address,
        status="CONNECTING",
        last_seen=None,
        token_hash=token_hash,
    )

    db.add(server)
    db.commit()
    db.refresh(server)

    return {
        "server_id": server.server_id,
        "name": server.name,
        "ip_address": server.ip_address,
        "status": server.status,
        "token": token,
        "created_at": server.created_at.isoformat(),
    }

@app.get("/servers")
def get_servers(db: Session = Depends(get_db)):
    """
    Returns all registered monitored servers.

    Server status is calculated from the most recent heartbeat.
    """
    servers = db.query(Server).order_by(Server.created_at.desc()).all()
    now_utc = datetime.now(timezone.utc)

    result = []

    for server in servers:
        if server.last_seen is None:
            server.status = "CONNECTING"
        else:
            last_seen = server.last_seen

            # Normalize naive timestamps to UTC if necessary.
            if last_seen.tzinfo is None:
                last_seen = last_seen.replace(tzinfo=timezone.utc)

            elapsed_seconds = (now_utc - last_seen).total_seconds()

            if elapsed_seconds >= SERVER_HEARTBEAT_TIMEOUT_SECONDS:
                server.status = "OFFLINE"
            else:
                server.status = "ONLINE"

        result.append({
            "server_id": server.server_id,
            "name": server.name,
            "ip_address": server.ip_address,
            "status": server.status,
            "last_seen": server.last_seen.isoformat() if server.last_seen else None,
            "created_at": server.created_at.isoformat(),
        })

    db.commit()

    return result

@app.post("/servers/{server_id}/heartbeat")
def server_heartbeat(
    server_id: str,
    token: str = Query(..., min_length=1),
    ip_address: Optional[str] = Query(default=None, max_length=45),
    db: Session = Depends(get_db),
):
    """
    Authenticated heartbeat from a monitoring agent.
    Updates the server's last_seen timestamp and online status.
    """
    server = db.query(Server).filter(Server.server_id == server_id).first()

    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()

    if not hmac.compare_digest(token_hash, server.token_hash):
        raise HTTPException(status_code=401, detail="Invalid authentication token")

    now_utc = datetime.now(timezone.utc)

    server.last_seen = now_utc
    server.status = "ONLINE"

    if ip_address:
        server.ip_address = ip_address

    db.commit()
    db.refresh(server)

    return {
        "server_id": server.server_id,
        "status": server.status,
        "last_seen": server.last_seen.isoformat(),
    }

@app.get("/metrics/latest")
def get_latest_metric(db: Session = Depends(get_db)):
    """
    Returns the most recently recorded Metric record from PostgreSQL.
    """
    metric = db.query(Metric).order_by(Metric.timestamp.desc()).first()

    if not metric:
        raise HTTPException(status_code=404, detail="No metrics available yet")

    return {
        "id": metric.id,
        "timestamp": metric.timestamp.isoformat(),
        "response_time": metric.response_time,
        "cpu_usage": metric.cpu_usage,
        "memory_usage": metric.memory_usage,
        "disk_usage": metric.disk_usage,
        "bytes_received": metric.bytes_received,
        "bytes_sent": metric.bytes_sent,
        "application_status": metric.application_status,
    }


@app.get("/metrics")
def get_metrics(
    limit: int = Query(default=50, ge=1, le=500, description="Number of records to return"),
    db: Session = Depends(get_db),
):
    """
    Returns a list of recent monitoring records from PostgreSQL ordered by timestamp descending.
    """
    metrics = db.query(Metric).order_by(Metric.timestamp.desc()).limit(limit).all()

    if not metrics:
        return []

    return [
        {
            "id": m.id,
            "timestamp": m.timestamp.isoformat(),
            "response_time": m.response_time,
            "cpu_usage": m.cpu_usage,
            "memory_usage": m.memory_usage,
            "disk_usage": m.disk_usage,
            "bytes_received": m.bytes_received,
            "bytes_sent": m.bytes_sent,
            "application_status": m.application_status,
        }
        for m in metrics
    ]


def evaluate_active_alerts(latest_metric: Optional[Metric]) -> List[dict]:
    """
    Dynamically checks the latest metric against alert thresholds.
    Returns active alerts formatted as dictionaries.
    """
    if not latest_metric:
        return []

    alerts = []
    ts = latest_metric.timestamp.isoformat()

    # 1. Application Status Check (CRITICAL)
    if latest_metric.application_status.upper() != "UP":
        alerts.append({
            "id": f"alert-app-down-{latest_metric.id}",
            "alert_type": "APPLICATION_DOWN",
            "severity": "CRITICAL",
            "message": "Application service is DOWN or unreachable",
            "timestamp": ts,
            "metric_value": "DOWN",
        })

    # 2. CPU Usage Check (WARNING)
    if latest_metric.cpu_usage >= ALERT_CPU_THRESHOLD:
        alerts.append({
            "id": f"alert-cpu-{latest_metric.id}",
            "alert_type": "HIGH_CPU",
            "severity": "WARNING",
            "message": f"CPU usage is high: {latest_metric.cpu_usage:.1f}% (threshold: {ALERT_CPU_THRESHOLD}%)",
            "timestamp": ts,
            "metric_value": f"{latest_metric.cpu_usage:.1f}%",
        })

    # 3. Memory Usage Check (WARNING)
    if latest_metric.memory_usage >= ALERT_MEMORY_THRESHOLD:
        alerts.append({
            "id": f"alert-mem-{latest_metric.id}",
            "alert_type": "HIGH_MEMORY",
            "severity": "WARNING",
            "message": f"Memory usage is high: {latest_metric.memory_usage:.1f}% (threshold: {ALERT_MEMORY_THRESHOLD}%)",
            "timestamp": ts,
            "metric_value": f"{latest_metric.memory_usage:.1f}%",
        })

    # 4. Disk Usage Check (WARNING)
    if latest_metric.disk_usage >= ALERT_DISK_THRESHOLD:
        alerts.append({
            "id": f"alert-disk-{latest_metric.id}",
            "alert_type": "HIGH_DISK",
            "severity": "WARNING",
            "message": f"Disk usage is high: {latest_metric.disk_usage:.1f}% (threshold: {ALERT_DISK_THRESHOLD}%)",
            "timestamp": ts,
            "metric_value": f"{latest_metric.disk_usage:.1f}%",
        })

    # 5. Response Time Check (WARNING)
    if latest_metric.response_time is not None and latest_metric.response_time >= ALERT_RESPONSE_TIME_THRESHOLD_MS:
        alerts.append({
            "id": f"alert-resp-{latest_metric.id}",
            "alert_type": "HIGH_RESPONSE_TIME",
            "severity": "WARNING",
            "message": f"Response time is high: {latest_metric.response_time:.1f} ms (threshold: {ALERT_RESPONSE_TIME_THRESHOLD_MS} ms)",
            "timestamp": ts,
            "metric_value": f"{latest_metric.response_time:.1f} ms",
        })

    return alerts


def sync_incidents(db: Session):
    """
    Reconciles active incidents in PostgreSQL with the latest recorded metric.
    Ensures that active alerts are reflected as ACTIVE incidents and resolved when cleared.
    """
    latest_metric = db.query(Metric).order_by(Metric.timestamp.desc()).first()
    if not latest_metric:
        return

    now_utc = datetime.now(timezone.utc)

    conditions = {
        "APPLICATION_DOWN": {
            "triggered": latest_metric.application_status.upper() != "UP",
            "severity": "CRITICAL",
            "message": "Application service is DOWN or unreachable",
            "metric_name": "application_status",
            "metric_value": "DOWN" if latest_metric.application_status.upper() != "UP" else "UP",
            "threshold": "UP",
        },
        "HIGH_CPU": {
            "triggered": latest_metric.cpu_usage >= ALERT_CPU_THRESHOLD,
            "severity": "WARNING",
            "message": f"CPU usage is high: {latest_metric.cpu_usage:.1f}% (threshold: {ALERT_CPU_THRESHOLD}%)",
            "metric_name": "cpu_usage",
            "metric_value": f"{latest_metric.cpu_usage:.1f}%",
            "threshold": f"{ALERT_CPU_THRESHOLD}%",
        },
        "HIGH_MEMORY": {
            "triggered": latest_metric.memory_usage >= ALERT_MEMORY_THRESHOLD,
            "severity": "WARNING",
            "message": f"Memory usage is high: {latest_metric.memory_usage:.1f}% (threshold: {ALERT_MEMORY_THRESHOLD}%)",
            "metric_name": "memory_usage",
            "metric_value": f"{latest_metric.memory_usage:.1f}%",
            "threshold": f"{ALERT_MEMORY_THRESHOLD}%",
        },
        "HIGH_DISK": {
            "triggered": latest_metric.disk_usage >= ALERT_DISK_THRESHOLD,
            "severity": "WARNING",
            "message": f"Disk usage is high: {latest_metric.disk_usage:.1f}% (threshold: {ALERT_DISK_THRESHOLD}%)",
            "metric_name": "disk_usage",
            "metric_value": f"{latest_metric.disk_usage:.1f}%",
            "threshold": f"{ALERT_DISK_THRESHOLD}%",
        },
        "HIGH_RESPONSE_TIME": {
            "triggered": latest_metric.response_time is not None and latest_metric.response_time >= ALERT_RESPONSE_TIME_THRESHOLD_MS,
            "severity": "WARNING",
            "message": f"Response time is high: {latest_metric.response_time:.1f} ms (threshold: {ALERT_RESPONSE_TIME_THRESHOLD_MS} ms)" if latest_metric.response_time else "",
            "metric_name": "response_time",
            "metric_value": f"{latest_metric.response_time:.1f} ms" if latest_metric.response_time else "N/A",
            "threshold": f"{ALERT_RESPONSE_TIME_THRESHOLD_MS} ms",
        },
    }

    active_incidents = {
        inc.alert_type: inc
        for inc in db.query(Incident).filter(Incident.status == "ACTIVE").all()
    }

    modified = False
    for alert_type, cfg in conditions.items():
        if cfg["triggered"]:
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
                    detected_at=latest_metric.timestamp or now_utc,
                    resolved_at=None,
                    duration_seconds=None,
                )
                db.add(new_incident)
                modified = True
            else:
                active_incidents[alert_type].metric_value = cfg["metric_value"]
                modified = True
        else:
            if alert_type in active_incidents:
                inc = active_incidents[alert_type]
                inc.status = "RESOLVED"
                inc.resolved_at = latest_metric.timestamp or now_utc
                start_dt = inc.detected_at
                end_dt = inc.resolved_at
                if start_dt and end_dt:
                    if start_dt.tzinfo is not None and end_dt.tzinfo is None:
                        start_dt = start_dt.replace(tzinfo=None)
                    elif start_dt.tzinfo is None and end_dt.tzinfo is not None:
                        end_dt = end_dt.replace(tzinfo=None)
                    duration = max(0.0, round((end_dt - start_dt).total_seconds(), 1))
                else:
                    duration = 0.0
                inc.duration_seconds = duration
                modified = True

    if modified:
        try:
            db.commit()
        except Exception:
            db.rollback()


@app.get("/alerts")
def get_alerts(db: Session = Depends(get_db)):
    """
    Returns active alerts evaluated from the latest monitoring record against configured thresholds.
    """
    latest_metric = db.query(Metric).order_by(Metric.timestamp.desc()).first()
    return evaluate_active_alerts(latest_metric)


@app.get("/incidents")
def get_incidents(
    limit: int = Query(default=50, ge=1, le=500, description="Number of incident records to return"),
    db: Session = Depends(get_db),
):
    """
    Returns historical and active incidents ordered by detected_at descending.
    """
    sync_incidents(db)
    incidents = db.query(Incident).order_by(Incident.detected_at.desc()).limit(limit).all()
    return [
        {
            "id": inc.id,
            "incident_id": inc.incident_id,
            "alert_type": inc.alert_type,
            "severity": inc.severity,
            "message": inc.message,
            "metric_name": inc.metric_name,
            "metric_value": inc.metric_value,
            "threshold": inc.threshold,
            "status": inc.status,
            "detected_at": inc.detected_at.isoformat() if inc.detected_at else "",
            "resolved_at": inc.resolved_at.isoformat() if inc.resolved_at else None,
            "duration_seconds": inc.duration_seconds,
        }
        for inc in incidents
    ]


@app.get("/incidents/active")
def get_active_incidents(db: Session = Depends(get_db)):
    """
    Returns all currently ACTIVE incidents.
    """
    sync_incidents(db)
    incidents = db.query(Incident).filter(Incident.status == "ACTIVE").order_by(Incident.detected_at.desc()).all()
    return [
        {
            "id": inc.id,
            "incident_id": inc.incident_id,
            "alert_type": inc.alert_type,
            "severity": inc.severity,
            "message": inc.message,
            "metric_name": inc.metric_name,
            "metric_value": inc.metric_value,
            "threshold": inc.threshold,
            "status": inc.status,
            "detected_at": inc.detected_at.isoformat() if inc.detected_at else "",
            "resolved_at": inc.resolved_at.isoformat() if inc.resolved_at else None,
            "duration_seconds": inc.duration_seconds,
        }
        for inc in incidents
    ]
