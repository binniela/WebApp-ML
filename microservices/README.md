# 🐳 LockBox Microservices Architecture

## 🏗️ Architecture Overview

```
Frontend (React) → API Gateway (NGINX) → Microservices → Database (Supabase)
                                      ├── Auth Service (8001)
                                      ├── Message Service (8002)
                                      └── WebSocket Service (8003)
```

## 🚀 Services

### **Auth Service (Port 8001)**
- User registration and login
- JWT token generation and verification
- Public key storage
- User management

### **Message Service (Port 8002)**
- Encrypted message storage
- Message retrieval
- Conversation management
- Calls WebSocket service for real-time delivery

### **WebSocket Service (Port 8003)**
- Real-time WebSocket connections
- Message broadcasting
- Connection management
- Ping/pong health checks

### **API Gateway (Port 8000)**
- NGINX reverse proxy
- Route requests to appropriate services
- CORS handling
- Load balancing

## 🐳 Docker Setup

### **Prerequisites:**
```bash
# Install Docker Desktop
# https://www.docker.com/products/docker-desktop/

# Verify installation
docker --version
docker-compose --version
```

### **Quick Start:**
```bash
cd microservices/

# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### **Individual Service Testing:**
```bash
# Test auth service
curl http://localhost:8001/health

# Test message service  
curl http://localhost:8002/health

# Test websocket service
curl http://localhost:8003/connections

# Test API gateway
curl http://localhost:8000/health
```

## 🔧 Development

### **Service URLs:**
- **API Gateway:** http://localhost:8000
- **Auth Service:** http://localhost:8001
- **Message Service:** http://localhost:8002
- **WebSocket Service:** http://localhost:8003

### **Frontend Configuration:**
Update your frontend to use the API Gateway:
```typescript
// Change from:
const API_URL = "http://localhost:8000"

// To:
const API_URL = "http://localhost:8000"  // API Gateway handles routing
```

### **Service Communication:**
Services communicate internally using Docker network:
- `auth-service:8001`
- `message-service:8002`
- `websocket-service:8003`

## 📊 Benefits Achieved

### **Scalability:**
- Scale each service independently
- Add more instances of busy services
- Horizontal scaling ready

### **Reliability:**
- Service isolation - one crash doesn't affect others
- Graceful degradation
- Health checks and monitoring

### **Development:**
- Team can work on different services
- Independent deployments
- Technology flexibility per service

### **Production Ready:**
- Container orchestration
- Load balancing
- Service discovery
- Environment configuration

## 🎯 Next Steps

1. **Install Docker Desktop**
2. **Run `docker-compose up --build`**
3. **Test with frontend**
4. **Deploy to cloud (AWS ECS, Kubernetes)**

## 🏆 Skills Demonstrated

- ✅ **Microservices Architecture**
- ✅ **Docker Containerization**
- ✅ **Service-to-Service Communication**
- ✅ **API Gateway Pattern**
- ✅ **Container Orchestration**
- ✅ **Distributed Systems**

**Perfect for Verkada interview - shows enterprise-level system design!** 🚀