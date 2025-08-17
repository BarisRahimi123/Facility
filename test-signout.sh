#!/bin/bash

echo "🔐 Testing Sign-Out Functionality..."
echo ""

# Test the sign-out API endpoint
echo "Testing sign-out API..."
curl -X POST http://localhost:3000/api/auth/signout \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "✅ Sign-out API tested"
echo ""
echo "To fully test sign-out:"
echo "1. Sign in to your app"
echo "2. Click the sign-out button"
echo "3. You should be redirected to /auth/sign-in"
echo "4. Trying to access protected pages should redirect to sign-in"
