#!/bin/bash

# 🔧 LockBox NGINX Routing Fix Script
# This script fixes all routing issues between frontend and backend

echo "🔧 Starting LockBox NGINX routing fix..."

# 1. Create fixed NGINX configuration
cat > /etc/nginx/sites-available/lockbox << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream auth_service {
        server localhost:8001;
    }
    
    upstream message_service {
        server localhost:8002;
    }
    
    upstream websocket_service {
        server localhost:8003;
    }

    server {
        listen 80;
        server_name _;
        
        # CORS headers for all responses
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type";
            add_header Access-Control-Max-Age 86400;
            return 204;
        }
        
        # Health check
        location /health {
            return 200 "OK - LockBox API Gateway";
            add_header Content-Type text/plain;
        }
        
        # Auth service routes - FIXED: Remove trailing slash
        location /auth/ {
            proxy_pass http://auth_service/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Message service routes - FIXED: Remove trailing slash
        location /messages/ {
            proxy_pass http://message_service/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Chat requests routes - FIXED: Remove trailing slash
        location /chat-requests/ {
            proxy_pass http://message_service/chat-requests/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Users routes - FIXED: Remove trailing slash
        location /users/ {
            proxy_pass http://auth_service/users/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Contacts routes - FIXED: Remove trailing slash
        location /contacts/ {
            proxy_pass http://auth_service/contacts/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # WebSocket routes - FIXED: Proper WebSocket handling
        location /ws/ {
            proxy_pass http://websocket_service/ws/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket specific settings
            proxy_read_timeout 86400;
            proxy_send_timeout 86400;
            proxy_connect_timeout 86400;
        }
        
        # Keys routes
        location /keys/ {
            proxy_pass http://message_service/keys/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

# 2. Enable the site
ln -sf /etc/nginx/sites-available/lockbox /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 3. Test NGINX configuration
echo "🔍 Testing NGINX configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ NGINX configuration is valid"
    
    # 4. Restart NGINX
    echo "🔄 Restarting NGINX..."
    systemctl restart nginx
    
    # 5. Check NGINX status
    echo "📊 NGINX status:"
    systemctl status nginx --no-pager -l
    
    # 6. Test all endpoints
    echo "🧪 Testing endpoints..."
    
    # Test health endpoint
    curl -s http://localhost/health
    echo ""
    
    # Test auth service
    curl -s -X POST http://localhost/auth/login \
        -H "Content-Type: application/json" \
        -d '{"username":"test","password":"test"}' | head -c 100
    echo ""
    
    # Test message service
    curl -s http://localhost/messages/ | head -c 100
    echo ""
    
    echo "✅ NGINX routing fix completed!"
    echo "🌐 Your API is now available at: http://52.53.221.141"
    echo "🔗 Health check: http://52.53.221.141/health"
    
else
    echo "❌ NGINX configuration test failed!"
    exit 1
fi 