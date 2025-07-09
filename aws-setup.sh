#!/bin/bash
# AWS EC2 Setup Script for LockBox Microservices

echo "🚀 Setting up LockBox on AWS EC2..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "📦 Installing Docker..."
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt update
sudo apt install -y docker-ce

# Install Docker Compose
echo "🐳 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER

# Install Git
sudo apt install -y git

# Clone your repository
echo "📥 Cloning LockBox repository..."
git clone https://github.com/binniela/WebApp-ML.git
cd WebApp-ML

# Switch to microservices branch
git checkout microservices-docker

# Set up environment variables
echo "⚙️ Setting up environment..."
cd microservices
cp .env.example .env

echo "✅ Setup complete! Next steps:"
echo "1. Edit .env file with your credentials"
echo "2. Run: docker-compose up -d"
echo "3. Access your app at: http://$(curl -s ifconfig.me):8000"