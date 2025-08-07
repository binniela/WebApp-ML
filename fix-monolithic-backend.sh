#!/bin/bash

# 🔧 LockBox Monolithic Backend Fix Script
# This script fixes the backend for monolithic architecture

echo "🔧 Starting LockBox monolithic backend fix..."

# 1. Navigate to backend directory
cd securechat-app-backend

# 2. Fix CORS in main.py
echo "🔧 Fixing CORS configuration..."
cat > app/main.py << 'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth import router as auth_router
from app.routes.messages import router as messages_router
from app.routes.users import router as users_router
from app.routes.chat_requests import router as chat_requests_router
from app.routes.contacts import router as contacts_router
from app.routes.crypto_keys import router as crypto_router
from app.routes.websocket import router as websocket_router
from app.routes.key_exchange import router as key_exchange_router

app = FastAPI(title="LockBox API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://web-app-ml.vercel.app",
        "http://52.53.221.141",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(messages_router)
app.include_router(users_router)
app.include_router(chat_requests_router)
app.include_router(contacts_router)
app.include_router(crypto_router)
app.include_router(websocket_router)
app.include_router(key_exchange_router)

@app.get("/")
def read_root():
    return {"message": "LockBox API is running!"}

@app.get("/health")
def health_check():
    return {"status": "OK", "message": "LockBox API Gateway"}
EOF

# 3. Create startup script
echo "🚀 Creating startup script..."
cat > start-backend.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting LockBox Backend..."

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    echo "🔧 Activating virtual environment..."
    source .venv/bin/activate
fi

# Install requirements
echo "📦 Installing requirements..."
pip install -r requirements.txt

# Start the server
echo "🌐 Starting FastAPI server on port 8000..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
EOF

chmod +x start-backend.sh

# 4. Create systemd service
echo "🔧 Creating systemd service..."
sudo tee /etc/systemd/system/lockbox-backend.service > /dev/null << 'EOF'
[Unit]
Description=LockBox Backend API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/WebApp-ML/securechat-app-backend
Environment=PATH=/home/ubuntu/WebApp-ML/securechat-app-backend/.venv/bin
ExecStart=/home/ubuntu/WebApp-ML/securechat-app-backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 5. Enable and start service
echo "🔧 Enabling systemd service..."
sudo systemctl daemon-reload
sudo systemctl enable lockbox-backend
sudo systemctl start lockbox-backend

# 6. Check service status
echo "📊 Service status:"
sudo systemctl status lockbox-backend --no-pager -l

# 7. Test the backend
echo "🧪 Testing backend..."
sleep 5

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

echo "✅ Monolithic backend fix completed!"
echo "🌐 Your backend is now running on: http://52.53.221.141:8000"
echo "🔗 Health check: http://52.53.221.141:8000/health" 