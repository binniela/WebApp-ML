#!/bin/bash

echo "🔧 Fixing NGINX double slash issue..."

EC2_HOST="ec2-52-53-221-141.us-west-1.compute.amazonaws.com"
KEY_PATH="/Users/vincentla/Desktop/webapp.pem"

ssh -i "$KEY_PATH" ubuntu@$EC2_HOST << 'EOF'
# Update NGINX configuration to fix double slash issue
sudo tee /etc/nginx/sites-available/lockbox > /dev/null << 'NGINX_EOF'
server {
    listen 80;
    server_name _;

    # CORS headers
    add_header Access-Control-Allow-Origin "https://web-app-ml.vercel.app" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With" always;
    add_header Access-Control-Allow-Credentials "true" always;

    # Handle preflight requests
    location / {
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://web-app-ml.vercel.app";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With";
            add_header Access-Control-Allow-Credentials "true";
            add_header Access-Control-Max-Age 86400;
            return 204;
        }
    }

    # Auth service routes
    location /auth/ {
        proxy_pass http://localhost:8001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Message service routes - FIXED double slash
    location /messages/send {
        proxy_pass http://localhost:8002/send;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /messages/conversation/ {
        proxy_pass http://localhost:8002/conversation/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /messages/ {
        proxy_pass http://localhost:8002/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket routes
    location /ws/ {
        proxy_pass http://localhost:8003/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Additional routes
    location /contacts/ {
        proxy_pass http://localhost:8001/contacts/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /chat-requests/ {
        proxy_pass http://localhost:8002/chat-requests/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /users/ {
        proxy_pass http://localhost:8001/users/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        return 200 "OK - LockBox Services";
        add_header Content-Type text/plain;
    }
}
NGINX_EOF

# Test and reload NGINX
sudo nginx -t && sudo systemctl reload nginx

echo "✅ NGINX configuration fixed"

# Test the endpoints with a valid token
echo "Testing with valid token:"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0aW50ZWdyYXRpb24iLCJleHAiOjE3NTMyMzgwMzF9.klmRgMbcb50jzXTJ-srgLm4qPQj1iWQAYG-vtNW_EA8"

echo "Testing /messages/:"
curl -s http://localhost/messages/ -H "Authorization: Bearer $TOKEN"

echo -e "\nTesting /messages/send:"
curl -s -X POST http://localhost/messages/send -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"recipient_id":"b1be33e8-06df-4194-a7d3-f9b11c282040","encrypted_blob":"encrypted_Hello","signature":"sig","sender_public_key":"key"}'
EOF