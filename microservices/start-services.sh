#!/bin/bash

echo "🚀 Starting LockBox Microservices..."

# Set environment variables
export SUPABASE_URL="https://djlxdsozofvmonouzzkw.supabase.co"
export SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqbHhkc296b2Z2bW9ub3V6emt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODI4MDMsImV4cCI6MjA2Njk1ODgwM30.lksP_TWlVYsyAFLvd6nUjtk304xNIq_cjMfzx0la7E8"
export JWT_SECRET_KEY="lockbox-super-secure-jwt-secret-key-2024-quantum-safe-messaging-app-production-ready"

# Create log directory
mkdir -p logs

echo "📡 Starting Auth Service (Port 8001)..."
cd auth-service
python3 main.py > ../logs/auth.log 2>&1 &
AUTH_PID=$!
cd ..

echo "💬 Starting Message Service (Port 8002)..."
cd message-service
python3 main.py > ../logs/message.log 2>&1 &
MESSAGE_PID=$!
cd ..

echo "🔌 Starting WebSocket Service (Port 8003)..."
cd websocket-service
python3 main.py > ../logs/websocket.log 2>&1 &
WEBSOCKET_PID=$!
cd ..

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 3

echo "🌐 Starting NGINX API Gateway (Port 8000)..."
nginx -c $(pwd)/nginx.conf -p $(pwd) &
NGINX_PID=$!

# Save PIDs for cleanup
echo $AUTH_PID > logs/auth.pid
echo $MESSAGE_PID > logs/message.pid
echo $WEBSOCKET_PID > logs/websocket.pid
echo $NGINX_PID > logs/nginx.pid

echo ""
echo "✅ All services started!"
echo "🔗 API Gateway: http://localhost:8000"
echo "🔐 Auth Service: http://localhost:8001"
echo "💬 Message Service: http://localhost:8002"
echo "🔌 WebSocket Service: http://localhost:8003"
echo ""
echo "📊 Check logs in ./logs/ directory"
echo "🛑 Run ./stop-services.sh to stop all services"
echo ""
echo "Press Ctrl+C to stop all services..."

# Wait for interrupt
trap 'echo "Stopping services..."; ./stop-services.sh; exit' INT
wait