#!/bin/bash

# Test chat request functionality
echo "Testing chat request system..."

# Test 1: Send a chat request
echo "1. Testing chat request sending..."
curl -X POST http://52.53.221.141:8000/chat-requests/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "recipient_id": "test-user-id",
    "message": "Hello! Test message"
  }'

echo -e "\n\n2. Testing incoming chat requests..."
curl -X GET "http://52.53.221.141:8000/chat-requests/incoming" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

echo -e "\n\nTest completed."