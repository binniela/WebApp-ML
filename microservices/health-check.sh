#!/bin/bash

echo "🔍 LockBox Health Check"
echo "======================="

# Check if services are running
check_service() {
    local service=$1
    local port=$2
    
    if curl -s http://localhost:$port/health > /dev/null 2>&1; then
        echo "✅ $service (Port $port): Running"
    else
        echo "❌ $service (Port $port): Down"
    fi
}

# Check API Gateway
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ API Gateway (Port 8000): Running"
else
    echo "❌ API Gateway (Port 8000): Down"
fi

# Check individual services
check_service "Auth Service" 8001
check_service "Message Service" 8002
check_service "WebSocket Service" 8003

echo ""
echo "📊 System Resources:"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)% used"
echo "Memory: $(free | grep Mem | awk '{printf("%.1f%%", $3/$2 * 100.0)}')"
echo "Disk: $(df -h / | awk 'NR==2{printf "%s", $5}')"

echo ""
echo "🔗 Active Connections:"
netstat -an | grep :800 | wc -l | xargs echo "Port 8000:"
netstat -an | grep :8001 | wc -l | xargs echo "Port 8001:"
netstat -an | grep :8002 | wc -l | xargs echo "Port 8002:"
netstat -an | grep :8003 | wc -l | xargs echo "Port 8003:"