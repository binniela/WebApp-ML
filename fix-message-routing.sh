#!/bin/bash

echo "🔧 Fixing message routing..."

EC2_HOST="ec2-52-53-221-141.us-west-1.compute.amazonaws.com"
KEY_PATH="/Users/vincentla/Desktop/webapp.pem"

ssh -i "$KEY_PATH" ubuntu@$EC2_HOST << 'EOF'
# Test direct access to message service
echo "Testing direct message service access:"
curl -s http://localhost:8002/send -X POST -H "Content-Type: application/json" -d '{"test":"data"}' || echo "Message service not responding"

# Check if message service is running
echo "Checking message service status:"
ps aux | grep "python3 main.py" | grep -v grep

# Restart message service if needed
cd microservices/message-service
nohup python3 main.py > ../logs/message.log 2>&1 &
echo $! > ../logs/message.pid

sleep 2

# Test again
echo "Testing message service after restart:"
curl -s http://localhost:8002/send -X POST -H "Content-Type: application/json" -d '{"test":"data"}' || echo "Still not responding"

# Check NGINX routing
echo "Testing NGINX routing to messages:"
curl -s http://localhost/messages/send -X POST -H "Content-Type: application/json" -d '{"test":"data"}' || echo "NGINX routing issue"
EOF