#!/bin/bash

echo "🚀 Deploying LockBox to EC2..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Python and dependencies
sudo apt install -y python3 python3-pip nginx

# Install Python packages
pip3 install fastapi uvicorn python-jose bcrypt supabase python-dotenv requests websockets

# Create production environment
cp .env.production .env

# Set up systemd services
sudo ./ec2-setup.sh

# Start services
./start-production.sh

echo "✅ Deployment complete!"
echo "🌐 API available at: http://$(curl -s ifconfig.me)"