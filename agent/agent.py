import argparse
import os
import sys
import time
import json
import urllib.request
import urllib.parse
import platform

def get_system_metrics():
    # Uses standard psutil if installed, falls back gracefully or reads /proc
    try:
        import psutil
        cpu = psutil.cpu_percent(interval=1)
        mem = psutil.virtual_memory().percent
        disk = psutil.disk_usage('/').percent
        net = psutil.net_io_counters()
        bytes_recv = net.bytes_recv
        bytes_sent = net.bytes_sent
    except ImportError:
        # Fallback basic estimates if psutil is not installed
        cpu = 0.0
        mem = 0.0
        disk = 0.0
        bytes_recv = 0.0
        bytes_sent = 0.0

    return {
        "cpu_usage": cpu,
        "memory_usage": mem,
        "disk_usage": disk,
        "bytes_received": bytes_recv,
        "bytes_sent": bytes_sent,
        "response_time": 10.0,
        "application_status": "UP"
    }

def send_heartbeat(api_url, server_id, token):
    url = f"{api_url}/servers/{server_id}/heartbeat?token={token}"
    req = urllib.request.Request(url, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return response.status == 200
    except Exception as e:
        print(f"[Agent] Heartbeat failed: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="DevOps Monitoring Agent")
    parser.add_argument("--api-url", required=True, help="Base API URL (e.g. http://100.62.203.87/api)")
    parser.add_argument("--server-id", required=True, help="Registered Server ID")
    parser.add_argument("--token", required=True, help="Server Secret Authentication Token")
    args = parser.parse_args()

    print(f"Starting DevOps Monitoring Agent for {args.server_id}...")

    while True:
        # 1. Send Heartbeat
        hb_success = send_heartbeat(args.api_url, args.server_id, args.token)
        if hb_success:
            print("[Agent] Heartbeat acknowledged.")

        # 2. Collect and push metrics (Future: bind server_id to metrics payload)
        metrics = get_system_metrics()
        print(f"[Agent] Metrics: CPU {metrics['cpu_usage']}% | RAM {metrics['memory_usage']}% | Disk {metrics['disk_usage']}%")

        time.sleep(15)

if __name__ == "__main__":
    main()
