#!/bin/bash

echo "🚀 Starting LockBox Backend Services..."

EC2_HOST="ec2-52-53-221-141.us-west-1.compute.amazonaws.com"
KEY_PATH="/Users/vincentla/Desktop/webapp.pem"

ssh -i "$KEY_PATH" ubuntu@$EC2_HOST << 'EOF'
cd microservices

# Create logs directory
mkdir -p logs

# Kill any existing processes
pkill -f "python3 main.py" || true

# Start services with proper logging
echo "🔐 Starting Auth Service on port 8001..."
cd auth-service
nohup python3 main.py > ../logs/auth.log 2>&1 &
echo $! > ../logs/auth.pid
cd ..

sleep 2

echo "💬 Starting Message Service on port 8002..."
cd message-service
nohup python3 main.py > ../logs/message.log 2>&1 &
echo $! > ../logs/message.pid
cd ..

sleep 2

echo "🔌 Starting WebSocket Service on port 8003..."
cd websocket-service
nohup python3 main.py > ../logs/websocket.log 2>&1 &
echo $! > ../logs/websocket.pid
cd ..

sleep 3

echo "✅ All services started!"
echo "🔍 Checking running services:"
ps aux | grep "python3 main.py" | grep -v grep

echo ""
echo "🌐 Testing endpoints:"
curl -s http://localhost:8001/health || echo "Auth service not responding"
curl -s http://localhost:8002/health || echo "Message service not responding"  
curl -s http://localhost:8003/health || echo "WebSocket service not responding"

echo ""
echo "🎯 Backend is ready at: http://52.53.221.141"
echo "📊 Check logs: tail -f logs/*.log"
EOF