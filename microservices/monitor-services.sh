#!/bin/bash

echo "📊 LockBox Service Monitor"
echo "========================="

while true; do
    clear
    echo "📊 LockBox Service Monitor - $(date)"
    echo "========================="
    
    # Check service status
    echo "🔍 Service Status:"
    for service in lockbox-auth lockbox-message lockbox-websocket nginx; do
        if systemctl is-active --quiet $service; then
            echo "✅ $service: Active"
        else
            echo "❌ $service: Inactive"
            # Auto-restart if down
            echo "🔄 Restarting $service..."
            sudo systemctl restart $service
        fi
    done
    
    echo ""
    echo "🌐 Port Status:"
    for port in 8000 8001 8002 8003; do
        if netstat -tuln | grep :$port > /dev/null; then
            echo "✅ Port $port: Open"
        else
            echo "❌ Port $port: Closed"
        fi
    done
    
    echo ""
    echo "📈 System Resources:"
    echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
    echo "Memory: $(free | grep Mem | awk '{printf("%.1f%%", $3/$2 * 100.0)}')"
    echo "Disk: $(df -h / | awk 'NR==2{printf "%s", $5}')"
    
    echo ""
    echo "🔗 Active Connections: $(netstat -an | grep :800 | wc -l)"
    
    echo ""
    echo "Press Ctrl+C to exit..."
    sleep 10
done