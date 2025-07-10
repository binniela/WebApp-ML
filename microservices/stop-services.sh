#!/bin/bash

echo "🛑 Stopping LockBox Microservices..."

# Stop services using saved PIDs
if [ -f logs/auth.pid ]; then
    AUTH_PID=$(cat logs/auth.pid)
    kill $AUTH_PID 2>/dev/null && echo "✅ Auth Service stopped"
    rm logs/auth.pid
fi

if [ -f logs/message.pid ]; then
    MESSAGE_PID=$(cat logs/message.pid)
    kill $MESSAGE_PID 2>/dev/null && echo "✅ Message Service stopped"
    rm logs/message.pid
fi

if [ -f logs/websocket.pid ]; then
    WEBSOCKET_PID=$(cat logs/websocket.pid)
    kill $WEBSOCKET_PID 2>/dev/null && echo "✅ WebSocket Service stopped"
    rm logs/websocket.pid
fi

if [ -f logs/nginx.pid ]; then
    NGINX_PID=$(cat logs/nginx.pid)
    kill $NGINX_PID 2>/dev/null && echo "✅ NGINX stopped"
    rm logs/nginx.pid
fi

# Cleanup any remaining processes
pkill -f "python3 main.py" 2>/dev/null
pkill -f "nginx.*microservices" 2>/dev/null

echo "🏁 All services stopped!"