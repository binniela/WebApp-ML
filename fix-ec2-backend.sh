#!/bin/bash

echo "🔧 Fixing LockBox Backend on EC2..."

EC2_HOST="ec2-52-53-221-141.us-west-1.compute.amazonaws.com"
KEY_PATH="/Users/vincentla/Desktop/webapp.pem"

ssh -i "$KEY_PATH" ubuntu@$EC2_HOST << 'EOF'
# Install Python packages with --break-system-packages
pip3 install --break-system-packages fastapi uvicorn python-jose bcrypt supabase python-dotenv requests websockets

# Navigate to microservices
cd microservices

# Start services manually
echo "🔐 Starting Auth Service..."
cd auth-service
python3 main.py > ../logs/auth.log 2>&1 &
echo $! > ../logs/auth.pid
cd ..

echo "💬 Starting Message Service..."
cd message-service  
python3 main.py > ../logs/message.log 2>&1 &
echo $! > ../logs/message.pid
cd ..

echo "🔌 Starting WebSocket Service..."
cd websocket-service
python3 main.py > ../logs/websocket.log 2>&1 &
echo $! > ../logs/websocket.pid
cd ..

# Wait for services to start
sleep 3

echo "✅ Services started manually!"
echo "🔍 Checking ports..."
netstat -tuln | grep :800

echo "🌐 Backend is now running at: http://52.53.221.141"
EOF