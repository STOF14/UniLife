#!/bin/bash
echo "🚀 Starting UniLife..."

# Kill any existing servers
pkill -f "next" 2>/dev/null || true

# Start production server
echo "Starting server on http://localhost:3000"
npm run start &

# Wait for server to start
echo "Waiting for server..."
sleep 5

# Test connection
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
  echo "✅ Server is running at http://localhost:3000"
  echo ""
  echo "To access from another device, use your IP address:"
  ip addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v "127.0.0.1"
  echo ""
  echo "Press Ctrl+C to stop the server"
  wait
else
  echo "❌ Server failed to start"
  pkill -f "next"
  exit 1
fi
