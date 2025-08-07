#!/bin/bash

# 🚀 LockBox Complete Deployment Fix Script
# This script fixes all routing issues and ensures full functionality

echo "🚀 Starting LockBox complete deployment fix..."

# 1. Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install required packages
echo "🔧 Installing required packages..."
sudo apt install -y nginx curl git python3-pip python3-venv

# 3. Navigate to project directory
cd /home/ubuntu/WebApp-ML

# 4. Fix NGINX configuration
echo "🔧 Fixing NGINX configuration..."
sudo bash fix-nginx-routing-complete.sh

# 5. Check if services are running
echo "🔍 Checking service status..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "🐳 Starting Docker..."
    sudo systemctl start docker
    sudo systemctl enable docker
fi

# 6. Navigate to microservices and start them
echo "🚀 Starting microservices..."
cd microservices

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_key_here
JWT_SECRET_KEY=your_very_long_random_secret_key_here
EOF
    echo "⚠️  Please edit .env file with your actual Supabase credentials"
fi

# Start services with Docker Compose
echo "🐳 Starting services with Docker Compose..."
docker-compose down
docker-compose up -d

# 7. Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# 8. Check service status
echo "📊 Service status:"
docker-compose ps

# 9. Test all endpoints
echo "🧪 Testing endpoints..."

# Test health endpoint
echo "🔗 Testing health endpoint..."
curl -s http://localhost/health
echo ""

# Test auth service
echo "🔐 Testing auth service..."
curl -s -X POST http://localhost/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}' | head -c 100
echo ""

# Test message service
echo "💬 Testing message service..."
curl -s http://localhost/messages/ | head -c 100
echo ""

# Test WebSocket service
echo "🔌 Testing WebSocket service..."
curl -s http://localhost:8003/connections | head -c 100
echo ""

# 10. Check NGINX logs
echo "📋 NGINX error logs (last 10 lines):"
sudo tail -n 10 /var/log/nginx/error.log

# 11. Check service logs
echo "📋 Service logs:"
docker-compose logs --tail=5

# 12. Create a test script
echo "🧪 Creating test script..."
cat > test-app.sh << 'EOF'
#!/bin/bash

echo "🧪 Testing LockBox application..."

# Test health
echo "1. Testing health endpoint..."
curl -s http://52.53.221.141/health
echo ""

# Test auth service
echo "2. Testing auth service..."
curl -s -X POST http://52.53.221.141/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}'
echo ""

# Test message service
echo "3. Testing message service..."
curl -s http://52.53.221.141/messages/
echo ""

# Test WebSocket endpoint
echo "4. Testing WebSocket endpoint..."
curl -s http://52.53.221.141:8003/connections
echo ""

echo "✅ Testing completed!"
EOF

chmod +x test-app.sh

# 13. Create monitoring script
echo "📊 Creating monitoring script..."
cat > monitor-services.sh << 'EOF'
#!/bin/bash

echo "📊 LockBox Service Monitor"
echo "=========================="

# Check NGINX
echo "🌐 NGINX Status:"
systemctl is-active nginx
echo ""

# Check Docker services
echo "🐳 Docker Services:"
docker-compose ps
echo ""

# Check service endpoints
echo "🔗 Service Endpoints:"
echo "Health: $(curl -s -o /dev/null -w "%{http_code}" http://localhost/health)"
echo "Auth: $(curl -s -o /dev/null -w "%{http_code}" http://localhost/auth/login -X POST -H "Content-Type: application/json" -d '{"test":"test"}')"
echo "Messages: $(curl -s -o /dev/null -w "%{http_code}" http://localhost/messages/)"
echo ""

# Check logs
echo "📋 Recent Errors:"
sudo tail -n 5 /var/log/nginx/error.log
echo ""
EOF

chmod +x monitor-services.sh

# 14. Final status
echo "✅ LockBox deployment fix completed!"
echo ""
echo "🌐 Your application is now available at:"
echo "   Frontend: https://web-app-ml.vercel.app"
echo "   Backend: http://52.53.221.141"
echo "   Health: http://52.53.221.141/health"
echo ""
echo "🔧 Useful commands:"
echo "   ./test-app.sh          # Test all endpoints"
echo "   ./monitor-services.sh   # Monitor service status"
echo "   docker-compose logs     # View service logs"
echo "   sudo nginx -t          # Test NGINX config"
echo ""
echo "📝 Next steps:"
echo "1. Edit microservices/.env with your Supabase credentials"
echo "2. Restart services: docker-compose restart"
echo "3. Test the frontend connection"
echo "4. Monitor logs for any errors"
echo ""
echo "🚀 Your LockBox application should now be fully functional!" 