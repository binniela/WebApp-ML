#!/bin/bash

# Deploy chat request fixes to EC2
echo "🚀 Deploying chat request fixes to EC2..."

# Copy updated files to EC2
echo "📁 Copying updated backend files..."
scp -i "/Users/vincentla/Desktop/webapp.pem" \
    /Users/vincentla/Desktop/WebApp-ML/securechat-app-backend/app/routes/chat_requests.py \
    ubuntu@ec2-52-53-221-141.us-west-1.compute.amazonaws.com:~/WebApp-ML/securechat-app-backend/app/routes/

# Restart the backend service
echo "🔄 Restarting backend service..."
ssh -i "/Users/vincentla/Desktop/webapp.pem" ubuntu@ec2-52-53-221-141.us-west-1.compute.amazonaws.com << 'EOF'
cd ~/WebApp-ML/securechat-app-backend
sudo pkill -f "uvicorn app.main:app"
sleep 2
nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
sleep 3
echo "✅ Backend restarted"
EOF

echo "🎉 Deployment completed!"
echo "💡 Now redeploy your frontend to Vercel to get the proxy fixes"