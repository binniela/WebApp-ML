#!/bin/bash

echo "🧪 Testing Chat Request Fix"
echo "=========================="

echo "1. Testing backend health..."
curl -s http://52.53.221.141:8000/health || echo "❌ Backend not responding"

echo -e "\n2. Testing user search (should work)..."
curl -s "http://52.53.221.141:8000/users/search?q=test" || echo "❌ Search not working"

echo -e "\n3. Frontend should be deploying to Vercel..."
echo "   Check: https://vercel.com/dashboard"

echo -e "\n4. Manual Test Steps:"
echo "   • Open your app in two browsers (regular + incognito)"
echo "   • Login as different users"
echo "   • User A: Search for User B and send chat request"
echo "   • User B: Should see notification within 1-3 seconds"
echo "   • User B: Accept/decline should work immediately"

echo -e "\n✅ Deployment completed!"
echo "🔍 Monitor Vercel dashboard for frontend deployment status"