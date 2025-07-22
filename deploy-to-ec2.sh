#!/bin/bash

echo "🚀 Deploying LockBox Backend to EC2..."

# EC2 connection details
EC2_HOST="ec2-52-53-221-141.us-west-1.compute.amazonaws.com"
KEY_PATH="/Users/vincentla/Desktop/webapp.pem"

# Ensure key permissions
chmod 400 "$KEY_PATH"

# Copy microservices to EC2
echo "📁 Copying microservices to EC2..."
scp -i "$KEY_PATH" -r microservices ubuntu@$EC2_HOST:~/

# Connect and setup
ssh -i "$KEY_PATH" ubuntu@$EC2_HOST << 'EOF'
echo "🔧 Setting up LockBox on EC2..."

# Update system
sudo apt update

# Install Python and dependencies
sudo apt install -y python3 python3-pip nginx

# Install Python packages
pip3 install fastapi uvicorn python-jose bcrypt supabase python-dotenv requests websockets

# Navigate to microservices
cd microservices

# Make scripts executable
chmod +x *.sh

# Setup systemd services
sudo ./ec2-setup.sh

# Start production services
./start-production.sh

echo "✅ LockBox backend deployed successfully!"
echo "🌐 API available at: http://52.53.221.141"
EOF

echo "✅ Deployment complete!"
echo "🌐 Your backend is now running at: http://52.53.221.141"