#!/bin/bash
echo "🧪 Testing UniLife Website..."

# 1. Check TypeScript
echo "1. TypeScript check..."
npx tsc --noEmit --noErrorTruncation 2>&1 | grep -E "error|warning" | head -20

# 2. Build test
echo -e "\n2. Build test..."
if npm run build 2>&1 | grep -q "✓ Compiled successfully"; then
  echo "✅ Build successful!"
else
  echo "❌ Build failed!"
  exit 1
fi

# 3. Start server in background and test
echo -e "\n3. Server test..."
npm run start &
SERVER_PID=$!
sleep 3

# Test homepage
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
  echo "✅ Server responding"
else
  echo "❌ Server not responding"
fi

kill $SERVER_PID 2>/dev/null

# 4. Dependencies check
echo -e "\n4. Dependencies..."
npm outdated

echo -e "\n🧪 Tests complete!"
