#!/bin/bash

echo "🔄 Restarting backend services with Supabase integration..."

EC2_HOST="ec2-52-53-221-141.us-west-1.compute.amazonaws.com"
KEY_PATH="/Users/vincentla/Desktop/webapp.pem"

# Copy updated files to EC2
echo "📁 Copying updated files..."
scp -i "$KEY_PATH" microservices/shared_utils.py ubuntu@$EC2_HOST:~/microservices/
scp -i "$KEY_PATH" microservices/message-service/main.py ubuntu@$EC2_HOST:~/microservices/message-service/

ssh -i "$KEY_PATH" ubuntu@$EC2_HOST << 'EOF'
cd microservices

# Kill existing services
pkill -f "python3 main.py" || true

# Create logs directory
mkdir -p logs

# Restart services
echo "🔐 Starting Auth Service..."
cd auth-service
nohup python3 main.py > ../logs/auth.log 2>&1 &
echo $! > ../logs/auth.pid
cd ..

echo "💬 Starting Message Service..."
cd message-service
nohup python3 main.py > ../logs/message.log 2>&1 &
echo $! > ../logs/message.pid
cd ..

echo "🔌 Starting WebSocket Service..."
cd websocket-service
nohup python3 main.py > ../logs/websocket.log 2>&1 &
echo $! > ../logs/websocket.pid
cd ..

sleep 3

echo "✅ Services restarted with Supabase integration!"
echo "🔍 Checking services:"
ps aux | grep "python3 main.py" | grep -v grep
EOF

echo "✅ Backend updated with proper Supabase persistence!"