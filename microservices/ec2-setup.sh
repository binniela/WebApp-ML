#!/bin/bash

echo "🚀 Setting up LockBox Microservices on EC2..."

# Create production environment file
cat > .env << 'EOF'
SUPABASE_URL=https://djlxdsozofvmonouzzkw.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqbHhkc296b2Z2bW9ub3V6emt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODI4MDMsImV4cCI6MjA2Njk1ODgwM30.lksP_TWlVYsyAFLvd6nUjtk304xNIq_cjMfzx0la7E8
JWT_SECRET_KEY=lockbox-super-secure-jwt-secret-key-2024-quantum-safe-messaging-app-production-ready
EOF

# Create systemd service files for auto-restart
sudo tee /etc/systemd/system/lockbox-auth.service > /dev/null << 'EOF'
[Unit]
Description=LockBox Auth Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/WebApp-ML/microservices/auth-service
Environment=PATH=/home/ubuntu/.local/bin:/usr/bin:/bin
EnvironmentFile=/home/ubuntu/WebApp-ML/microservices/.env
ExecStart=/usr/bin/python3 main.py
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
Environment=PATH=/home/ubuntu/.local/bin:/usr/bin:/bin
EnvironmentFile=/home/ubuntu/WebApp-ML/microservices/.env
ExecStart=/usr/bin/python3 main.py
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
Environment=PATH=/home/ubuntu/.local/bin:/usr/bin:/bin
EnvironmentFile=/home/ubuntu/WebApp-ML/microservices/.env
ExecStart=/usr/bin/python3 main.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Create NGINX configuration for production
sudo tee /etc/nginx/sites-available/lockbox > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    # CORS headers
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
    add_header Access-Control-Allow-Credentials "true" always;

    # Handle preflight requests
    location / {
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type";
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

# Enable the site
sudo ln -sf /etc/nginx/sites-available/lockbox /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test NGINX configuration
sudo nginx -t

echo "✅ EC2 setup complete!"
echo "🚀 Next: Run start-production.sh to start all services"