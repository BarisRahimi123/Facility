#!/bin/bash

echo "🧪 Testing SendGrid Configuration..."
echo ""

# Test if SendGrid is configured
echo "1. Checking API endpoint..."
curl -s http://localhost:3000/api/test-email | jq '.sendGridConfigured, .fromEmail' 2>/dev/null || echo "API not responding"

echo ""
echo "2. Sending test email..."
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "85baris@gmail.com", "type": "test"}' \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "📬 Check your email for the test message!"
echo ""
echo "If you see 'Unauthorized' error:"
echo "1. Create a new SendGrid API key"
echo "2. Verify your sender email"
echo "3. Update .env.local"
echo "4. Restart your dev server"


