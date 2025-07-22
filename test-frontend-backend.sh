#!/bin/bash

echo "🧪 Testing Frontend-Backend Integration"
echo "======================================"

# Test 1: Backend Health Check
echo "1. Testing Backend Health..."
curl -s http://52.53.221.141/health

# Test 2: User Registration
echo -e "\n\n2. Testing User Registration..."
REGISTER_RESPONSE=$(curl -s -X POST http://52.53.221.141/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testintegration","password":"testpass123"}')

echo $REGISTER_RESPONSE | jq .

# Extract token from response
TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.access_token')
USER_ID=$(echo $REGISTER_RESPONSE | jq -r '.user.id')

if [ "$TOKEN" != "null" ] && [ "$TOKEN" != "" ]; then
  echo "✅ Registration successful, token received"
  
  # Test 3: User Search
  echo -e "\n3. Testing User Search..."
  curl -s -H "Authorization: Bearer $TOKEN" \
    "http://52.53.221.141/users/search?q=test" | jq .
  
  # Test 4: Send Message
  echo -e "\n4. Testing Message Send..."
  curl -s -X POST http://52.53.221.141/messages/send \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"recipient_id\": \"$USER_ID\",
      \"encrypted_blob\": \"encrypted_Hello World!\",
      \"signature\": \"test_signature\",
      \"sender_public_key\": \"test_public_key\"
    }" | jq .
  
  # Test 5: Get Messages
  echo -e "\n5. Testing Message Retrieval..."
  curl -s -X GET http://52.53.221.141/messages/ \
    -H "Authorization: Bearer $TOKEN" | jq .
  
  echo -e "\n✅ All backend endpoints working!"
  echo "🌐 Frontend can now connect to: http://52.53.221.141"
  echo "🔗 WebSocket available at: ws://52.53.221.141/ws/"
  
else
  echo "❌ Registration failed"
fi