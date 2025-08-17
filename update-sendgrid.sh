#!/bin/bash

echo "📧 SendGrid Configuration Update Helper"
echo "======================================="
echo ""
echo "Follow these steps EXACTLY:"
echo ""
echo "1. Copy your new SendGrid API key from the dashboard"
echo "2. Open .env.local in your editor"
echo "3. Replace the SENDGRID_API_KEY line with:"
echo ""
echo "   SENDGRID_API_KEY=SG.your-new-key-here"
echo ""
echo "4. Save the file"
echo "5. Press Enter here when done..."
read -p ""

echo ""
echo "Restarting the development server..."
echo ""

# Kill existing Next.js process
pkill -f "next dev" 2>/dev/null || true

echo "Starting fresh server..."
npm run dev &

sleep 5

echo ""
echo "🧪 Testing new configuration..."
echo ""

curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "85baris@gmail.com", "type": "test"}' \
  -w "\n\nHTTP Status: %{http_code}\n"

echo ""
echo "✅ Check your email! If you see 'success: true', SendGrid is working!"

