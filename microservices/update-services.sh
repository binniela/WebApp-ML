#!/bin/bash

echo "🔄 Updating LockBox services with latest code..."

# Pull latest code
git pull origin main

# Update virtual environment path in systemd services
sudo tee /etc/systemd/system/lockbox-auth.service > /dev/null << 'EOF'
[Unit]
Description=LockBox Auth Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/WebApp-ML/microservices/auth-service
Environment=PATH=/home/ubuntu/WebApp-ML/microservices/venv/bin:/usr/bin:/bin
EnvironmentFile=/home/ubuntu/WebApp-ML/microservices/.env
ExecStart=/home/ubuntu/WebApp-ML/microservices/venv/bin/python main.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

sudo tee /etc/systemd/system/lockbox-message.service > /dev/null << 'EOF'
[Unit]
Description=LockBox Message Service
After=network.target lockbox-auth.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/WebApp-ML/microservices/message-service
Environment=PATH=/home/ubuntu/WebApp-ML/microservices/venv/bin:/usr/bin:/bin
EnvironmentFile=/home/ubuntu/WebApp-ML/microservices/.env
ExecStart=/home/ubuntu/WebApp-ML/microservices/venv/bin/python main.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

sudo tee /etc/systemd/system/lockbox-websocket.service > /dev/null << 'EOF'
[Unit]
Description=LockBox WebSocket Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/WebApp-ML/microservices/websocket-service
Environment=PATH=/home/ubuntu/WebApp-ML/microservices/venv/bin:/usr/bin:/bin
EnvironmentFile=/home/ubuntu/WebApp-ML/microservices/.env
ExecStart=/home/ubuntu/WebApp-ML/microservices/venv/bin/python main.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Update NGINX configuration with proper CORS
sudo tee /etc/nginx/sites-available/lockbox > /dev/null << 'EOF'
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

    # Message service routes
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
        return 200 "OK - LockBox Microservices";
        add_header Content-Type text/plain;
    }
}
EOF

# Reload systemd and restart services
sudo systemctl daemon-reload
sudo systemctl restart lockbox-auth lockbox-message lockbox-websocket
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Services updated and restarted!"
echo "🔍 Service status:"
sudo systemctl status lockbox-auth lockbox-message lockbox-websocket --no-pager