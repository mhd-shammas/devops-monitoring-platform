from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Float, Integer, String
from database import Base

class Server(Base):
    """
    Represents a monitored server.
    Each server has its own identity and heartbeat state.
    """

    __tablename__ = "servers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Stable identifier used by the monitoring agent
    server_id = Column(String(100), unique=True, index=True, nullable=False)

    # Friendly name shown in the dashboard
    name = Column(String(255), nullable=False)

    # Current public/private IP address
    ip_address = Column(String(45), nullable=True)

    # ONLINE / OFFLINE / CONNECTING
    status = Column(String(20), nullable=False, default="CONNECTING")

    # Last successful heartbeat from the monitoring agent
    last_seen = Column(DateTime(timezone=True), nullable=True)

    # Store only a hash of the authentication token
    token_hash = Column(String(255), nullable=False)

    # Server registration time
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self):
        return (
            f"<Server(server_id='{self.server_id}', "
            f"name='{self.name}', status='{self.status}')>"
        )

class Metric(Base):
    """
    SQLAlchemy ORM model representing the 'metrics' table in PostgreSQL.
    Stores historical system health and hardware resource utilization.
    """

    __tablename__ = "metrics"

    # Primary key ID (auto-incrementing integer)
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Date and time when the measurement was recorded (stored in UTC with timezone)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Health check HTTP response time in milliseconds (None / null when DOWN)
    response_time = Column(Float, nullable=True)

    # CPU utilization percentage (e.g. 24.5)
    cpu_usage = Column(Float, nullable=False)

    # RAM / Memory utilization percentage (e.g. 61.2)
    memory_usage = Column(Float, nullable=False)

    # Disk space utilization percentage (e.g. 68.4)
    disk_usage = Column(Float, nullable=False)

    # Network bytes received during interval
    bytes_received = Column(Float, nullable=False)

    # Network bytes sent during interval
    bytes_sent = Column(Float, nullable=False)

    # Application health status ('UP' or 'DOWN')
    application_status = Column(String(50), nullable=False)

    def __repr__(self):
        return f"<Metric(id={self.id}, status='{self.application_status}', cpu={self.cpu_usage}%, ram={self.memory_usage}%)>"


class Alert(Base):
    """
    SQLAlchemy ORM model representing the 'alerts' table in PostgreSQL.
    Stores historical and detected monitoring alerts.
    """

    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    alert_type = Column(String(50), nullable=False)  # e.g. APPLICATION_DOWN, HIGH_CPU
    severity = Column(String(20), nullable=False)    # 'CRITICAL' or 'WARNING'
    message = Column(String(255), nullable=False)
    metric_value = Column(String(50), nullable=True)

    def __repr__(self):
        return f"<Alert(id={self.id}, severity='{self.severity}', type='{self.alert_type}', message='{self.message}')>"


class Incident(Base):
    """
    SQLAlchemy ORM model representing the 'incidents' table in PostgreSQL.
    Tracks issues through their full lifecycle from ACTIVE detection to RESOLVED state.
    """

    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    incident_id = Column(String(50), unique=True, index=True, nullable=False)
    alert_type = Column(String(50), nullable=False)   # e.g. APPLICATION_DOWN, HIGH_CPU
    severity = Column(String(20), nullable=False)     # 'CRITICAL' or 'WARNING'
    message = Column(String(255), nullable=False)
    metric_name = Column(String(50), nullable=False)  # e.g. cpu_usage, memory_usage
    metric_value = Column(String(50), nullable=False) # e.g. 94.5%, DOWN
    threshold = Column(String(50), nullable=False)    # e.g. 90.0%, 1000.0 ms
    status = Column(String(20), index=True, default="ACTIVE", nullable=False) # 'ACTIVE' or 'RESOLVED'
    detected_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Float, nullable=True)

    def __repr__(self):
        return f"<Incident(id='{self.incident_id}', type='{self.alert_type}', status='{self.status}', severity='{self.severity}')>"


