# EC2 Setup Commands

## Run these commands on your EC2 instance:

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# 3. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Install Git
sudo apt install -y git

# 5. Clone your repository
git clone https://github.com/binniela/WebApp-ML.git
cd WebApp-ML
git checkout microservices-docker

# 6. Set up environment
cd microservices
nano .env
# Add your Supabase credentials

# 7. Start services
docker-compose up -d

# 8. Check status
docker-compose ps

# 9. View logs
docker-compose logs -f
```

## Your app will be available at:
- **API Gateway:** http://YOUR_EC2_IP:8000
- **Auth Service:** http://YOUR_EC2_IP:8001
- **Message Service:** http://YOUR_EC2_IP:8002
- **WebSocket Service:** http://YOUR_EC2_IP:8003