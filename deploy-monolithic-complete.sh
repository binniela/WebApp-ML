#!/bin/bash

# 🚀 LockBox Monolithic Complete Deployment Script
# This script deploys the monolithic backend and fixes all configuration

echo "🚀 Starting LockBox monolithic deployment..."

# 1. Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install required packages
echo "🔧 Installing required packages..."
sudo apt install -y python3-pip python3-venv nginx curl git

# 3. Navigate to project directory
cd /home/ubuntu/WebApp-ML

# 4. Fix backend configuration
echo "🔧 Fixing backend configuration..."
bash fix-monolithic-backend.sh

# 5. Fix frontend configuration
echo "🔧 Fixing frontend configuration..."
bash fix-frontend-monolithic.sh

# 6. Remove old microservices files
echo "🧹 Cleaning up old microservices files..."
rm -rf microservices/docker-compose.yml
rm -rf microservices/nginx.conf
rm -rf microservices/*/Dockerfile

# 7. Create simple NGINX configuration for monolithic backend
echo "🔧 Creating NGINX configuration for monolithic backend..."
sudo tee /etc/nginx/sites-available/lockbox-monolithic > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;
    
    # CORS headers
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
    
    # Proxy to monolithic backend
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_connect_timeout 86400;
    }
}
EOF

# 8. Enable NGINX site
echo "🔧 Enabling NGINX site..."
sudo ln -sf /etc/nginx/sites-available/lockbox-monolithic /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 9. Test and restart NGINX
echo "🔍 Testing NGINX configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ NGINX configuration is valid"
    sudo systemctl restart nginx
else
    echo "❌ NGINX configuration test failed!"
    exit 1
fi

# 10. Check backend service status
echo "📊 Backend service status:"
sudo systemctl status lockbox-backend --no-pager -l

# 11. Test all endpoints
echo "🧪 Testing endpoints..."

# Test health endpoint
echo "🔗 Testing health endpoint..."
curl -s http://localhost:8000/health
echo ""

# Test root endpoint
echo "🏠 Testing root endpoint..."
curl -s http://localhost:8000/
echo ""

# Test auth endpoint
echo "🔐 Testing auth endpoint..."
curl -s -X POST http://localhost:8000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}' | head -c 100
echo ""

# Test through NGINX
echo "🌐 Testing through NGINX..."
curl -s http://localhost/health
echo ""

# 12. Create monitoring script
echo "📊 Creating monitoring script..."
cat > monitor-monolithic.sh << 'EOF'
#!/bin/bash

echo "📊 LockBox Monolithic Service Monitor"
echo "====================================="

# Check NGINX
echo "🌐 NGINX Status:"
systemctl is-active nginx
echo ""

# Check Backend Service
echo "🔧 Backend Service:"
systemctl is-active lockbox-backend
echo ""

# Check service endpoints
echo "🔗 Service Endpoints:"
echo "Health (Direct): $(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)"
echo "Health (NGINX): $(curl -s -o /dev/null -w "%{http_code}" http://localhost/health)"
echo "Auth: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/auth/login -X POST -H "Content-Type: application/json" -d '{"test":"test"}')"
echo ""

# Check logs
echo "📋 Recent Backend Logs:"
sudo journalctl -u lockbox-backend --no-pager -n 5
echo ""

echo "📋 Recent NGINX Errors:"
sudo tail -n 5 /var/log/nginx/error.log
echo ""
EOF

chmod +x monitor-monolithic.sh

# 13. Create test script
echo "🧪 Creating test script..."
cat > test-monolithic.sh << 'EOF'
#!/bin/bash

echo "🧪 Testing LockBox Monolithic Application..."

# Test health
echo "1. Testing health endpoint..."
curl -s http://52.53.221.141:8000/health
echo ""

# Test root
echo "2. Testing root endpoint..."
curl -s http://52.53.221.141:8000/
echo ""

# Test auth service
echo "3. Testing auth service..."
curl -s -X POST http://52.53.221.141:8000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}'
echo ""

# Test through NGINX
echo "4. Testing through NGINX..."
curl -s http://52.53.221.141/health
echo ""

echo "✅ Testing completed!"
EOF

chmod +x test-monolithic.sh

# 14. Final status
echo "✅ LockBox monolithic deployment completed!"
echo ""
echo "🌐 Your application is now available at:"
echo "   Frontend: https://web-app-ml.vercel.app"
echo "   Backend (Direct): http://52.53.221.141:8000"
echo "   Backend (NGINX): http://52.53.221.141"
echo "   Health Check: http://52.53.221.141:8000/health"
echo ""
echo "🔧 Useful commands:"
echo "   ./test-monolithic.sh        # Test all endpoints"
echo "   ./monitor-monolithic.sh     # Monitor service status"
echo "   sudo journalctl -u lockbox-backend -f  # View backend logs"
echo "   sudo tail -f /var/log/nginx/error.log  # View NGINX logs"
echo ""
echo "📝 Next steps:"
echo "1. Test the frontend connection"
echo "2. Register a new user"
echo "3. Test messaging functionality"
echo "4. Monitor logs for any errors"
echo ""
echo "🚀 Your LockBox monolithic application should now be fully functional!" 