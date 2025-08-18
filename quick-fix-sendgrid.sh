#!/bin/bash

echo "🚀 Quick SendGrid Fix - Using Your Personal Email"
echo "================================================="
echo ""
echo "This will update your .env.local to use your personal email"
echo "which should already be verified in SendGrid."
echo ""
echo "Current configuration:"
grep "SENDGRID_FROM_EMAIL" .env.local 2>/dev/null || echo "SENDGRID_FROM_EMAIL not found"
echo ""
echo "Updating to use 85baris@gmail.com..."

# Update the FROM_EMAIL in .env.local
if grep -q "SENDGRID_FROM_EMAIL" .env.local 2>/dev/null; then
    # Update existing line
    sed -i.bak 's/^SENDGRID_FROM_EMAIL=.*/SENDGRID_FROM_EMAIL=85baris@gmail.com/' .env.local
    echo "✅ Updated SENDGRID_FROM_EMAIL"
else
    # Add new line
    echo "SENDGRID_FROM_EMAIL=85baris@gmail.com" >> .env.local
    echo "✅ Added SENDGRID_FROM_EMAIL"
fi

echo ""
echo "Restarting server..."
pkill -f "next dev" 2>/dev/null || true
npm run dev &

sleep 8

echo ""
echo "🧪 Testing with your personal email..."
echo ""

curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "85baris@gmail.com", "type": "test"}' \
  2>/dev/null | jq '.' 2>/dev/null || cat

echo ""
echo "📧 Check your email (85baris@gmail.com) for the test message!"
echo ""
echo "If still getting 'Forbidden':"
echo "1. Go to: https://app.sendgrid.com/settings/sender_auth/senders"
echo "2. Add and verify: 85baris@gmail.com"
echo "3. Check your email for verification link"
