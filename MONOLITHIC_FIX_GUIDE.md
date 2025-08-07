# 🔧 LockBox Monolithic Fix Guide

## 🎯 **Issues Identified & Solutions**

### **1. Architecture Mismatch**
**Problem**: Frontend configured for microservices, backend is monolithic
**Solution**: Updated frontend proxy to connect to monolithic backend

### **2. Port Configuration Issues**
**Problem**: Frontend trying to connect to wrong ports
**Solution**: Fixed to use port 8000 for monolithic backend

### **3. CORS Configuration**
**Problem**: Backend CORS only allows localhost:3000
**Solution**: Added Vercel domain and proper CORS headers

### **4. WebSocket Configuration**
**Problem**: WebSocket configured for microservices
**Solution**: Updated to connect to monolithic backend

## 🚀 **Step-by-Step Fix Instructions**

### **Step 1: SSH into your EC2 instance**
```bash
ssh -i "/Users/vincentla/Desktop/webapp.pem" ubuntu@ec2-52-53-221-141.us-west-1.compute.amazonaws.com
```

### **Step 2: Navigate to your project**
```bash
cd /home/ubuntu/WebApp-ML
```

### **Step 3: Run the monolithic deployment script**
```bash
chmod +x deploy-monolithic-complete.sh
./deploy-monolithic-complete.sh
```

### **Step 4: Check your Supabase credentials**
```bash
# Check if .env file exists in backend
ls -la securechat-app-backend/.env

# If it doesn't exist, create it
cd securechat-app-backend
nano .env
```

Add your Supabase credentials:
```env
SUPABASE_URL=your_actual_supabase_url
SUPABASE_KEY=your_actual_supabase_key
JWT_SECRET_KEY=your_actual_jwt_secret
```

### **Step 5: Restart the backend service**
```bash
sudo systemctl restart lockbox-backend
```

### **Step 6: Test the backend**
```bash
./test-monolithic.sh
```

## 🔧 **What Each Fix Does**

### **Backend Fixes:**
- ✅ Updated CORS to allow Vercel domain
- ✅ Added health check endpoint
- ✅ Created systemd service for auto-start
- ✅ Fixed all route configurations

### **Frontend Fixes:**
- ✅ Updated API proxy to use port 8000
- ✅ Fixed WebSocket connection to monolithic backend
- ✅ Removed microservices endpoint mapping
- ✅ Improved error handling

### **NGINX Fixes:**
- ✅ Simple proxy configuration for monolithic backend
- ✅ WebSocket support
- ✅ CORS headers
- ✅ Proper routing

## 🧪 **Testing Your Fix**

### **1. Test Backend Health**
```bash
curl http://52.53.221.141:8000/health
```
Expected: `{"status": "OK", "message": "LockBox API Gateway"}`

### **2. Test Root Endpoint**
```bash
curl http://52.53.221.141:8000/
```
Expected: `{"message": "LockBox API is running!"}`

### **3. Test Auth Service**
```bash
curl -X POST http://52.53.221.141:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

### **4. Test Through NGINX**
```bash
curl http://52.53.221.141/health
```

## 🔍 **Monitoring & Debugging**

### **Check Service Status**
```bash
./monitor-monolithic.sh
```

### **View Backend Logs**
```bash
sudo journalctl -u lockbox-backend -f
```

### **View NGINX Logs**
```bash
sudo tail -f /var/log/nginx/error.log
```

### **Check Service Status**
```bash
sudo systemctl status lockbox-backend
sudo systemctl status nginx
```

## 🎯 **Expected Results After Fix**

### **✅ Working Features**
- User registration and login
- User search functionality
- Message sending and receiving
- Real-time WebSocket messaging
- Contact management
- Chat requests

### **✅ Fixed Issues**
- Architecture mismatch resolved
- Port configuration corrected
- CORS errors fixed
- WebSocket connection working
- Frontend-backend communication restored

## 🚨 **Troubleshooting**

### **If backend won't start:**
```bash
# Check service status
sudo systemctl status lockbox-backend

# Check logs
sudo journalctl -u lockbox-backend -n 20

# Restart service
sudo systemctl restart lockbox-backend

# Check if port 8000 is in use
sudo netstat -tlnp | grep 8000
```

### **If NGINX fails:**
```bash
# Test NGINX config
sudo nginx -t

# Check NGINX status
sudo systemctl status nginx

# Restart NGINX
sudo systemctl restart nginx
```

### **If frontend can't connect:**
1. Check browser console for errors
2. Verify backend is accessible: `curl http://52.53.221.141:8000/health`
3. Check CORS headers in browser Network tab
4. Verify WebSocket connection in Console tab

## 📊 **Success Indicators**

### **Backend Tests**
- ✅ Health endpoint returns "OK"
- ✅ Root endpoint accessible
- ✅ Auth service responds
- ✅ WebSocket service running

### **Frontend Tests**
- ✅ Can register new users
- ✅ Can login with existing users
- ✅ Can search for users
- ✅ Can send messages
- ✅ Real-time messages appear
- ✅ WebSocket connection established

## 🎉 **Final Verification**

After running the fix script, your application should be fully functional:

1. **Frontend**: https://web-app-ml.vercel.app
2. **Backend (Direct)**: http://52.53.221.141:8000
3. **Backend (NGINX)**: http://52.53.221.141
4. **Health Check**: http://52.53.221.141:8000/health

### **Test Complete Flow**
1. Open frontend in browser
2. Register a new user
3. Login with the user
4. Search for another user
5. Send a chat request
6. Send messages
7. Verify real-time updates

## 🔐 **Security Notes**

- All communication is encrypted
- Post-quantum cryptography is implemented
- JWT tokens are used for authentication
- CORS is properly configured
- WebSocket connections are secure

## 🗑️ **Removed Microservices Dependencies**

The following microservices files are no longer needed:
- `microservices/docker-compose.yml`
- `microservices/nginx.conf`
- `microservices/*/Dockerfile`
- All microservices-specific scripts

## 📋 **New Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  FastAPI Server │    │   Supabase DB   │
│                 │    │                 │    │                 │
│ • Kyber-1024    │◄──►│ • JWT Auth      │◄──►│ • Encrypted     │
│ • ML-DSA-87     │    │ • WebSocket     │    │   Messages      │
│ • AES-256-CBC   │    │ • Monolithic    │    │ • Public Keys   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

**Your LockBox monolithic application should now be fully functional with end-to-end messaging!** 🚀 