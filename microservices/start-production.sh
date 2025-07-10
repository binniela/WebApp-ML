#!/bin/bash

echo "🚀 Starting LockBox Microservices in Production Mode..."

# Reload systemd
sudo systemctl daemon-reload

# Start and enable services
echo "🔐 Starting Auth Service..."
sudo systemctl start lockbox-auth
sudo systemctl enable lockbox-auth

echo "💬 Starting Message Service..."
sudo systemctl start lockbox-message
sudo systemctl enable lockbox-message

echo "🔌 Starting WebSocket Service..."
sudo systemctl start lockbox-websocket
sudo systemctl enable lockbox-websocket

# Start NGINX
echo "🌐 Starting NGINX..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Wait for services to start
sleep 3

echo ""
echo "✅ All services started!"
echo ""
echo "🔍 Service Status:"
sudo systemctl status lockbox-auth --no-pager -l
sudo systemctl status lockbox-message --no-pager -l
sudo systemctl status lockbox-websocket --no-pager -l
sudo systemctl status nginx --no-pager -l

echo ""
echo "🌐 Your LockBox API is now available at:"
echo "http://$(curl -s ifconfig.me)"
echo ""
echo "📊 Check service logs:"
echo "sudo journalctl -u lockbox-auth -f"
echo "sudo journalctl -u lockbox-message -f"
echo "sudo journalctl -u lockbox-websocket -f"