#!/bin/bash

echo "🔍 Debugging services..."

EC2_HOST="ec2-52-53-221-141.us-west-1.compute.amazonaws.com"
KEY_PATH="/Users/vincentla/Desktop/webapp.pem"

ssh -i "$KEY_PATH" ubuntu@$EC2_HOST << 'EOF'
echo "=== Service Status ==="
ps aux | grep "python3 main.py" | grep -v grep

echo -e "\n=== Port Status ==="
netstat -tuln | grep :800

echo -e "\n=== Direct Service Tests ==="
echo "Auth service (8001):"
curl -s http://localhost:8001/health || echo "No health endpoint"

echo -e "\nMessage service (8002):"
curl -s http://localhost:8002/ -H "Authorization: Bearer test" || echo "Service not responding"

echo -e "\nWebSocket service (8003):"
curl -s http://localhost:8003/health || echo "No health endpoint"

echo -e "\n=== Service Logs ==="
echo "Auth service log (last 5 lines):"
tail -5 microservices/logs/auth.log 2>/dev/null || echo "No auth log"

echo -e "\nMessage service log (last 5 lines):"
tail -5 microservices/logs/message.log 2>/dev/null || echo "No message log"

echo -e "\nWebSocket service log (last 5 lines):"
tail -5 microservices/logs/websocket.log 2>/dev/null || echo "No websocket log"
EOF