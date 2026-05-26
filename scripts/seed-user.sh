#!/bin/bash
set -e

REG_JSON='{"name":"Sara","email":"sara.ab2004@gmail.com","password":"qwerty","role":"USER"}'
LOGIN_JSON='{"email":"sara.ab2004@gmail.com","password":"qwerty"}'

echo "=== Flushing Redis rate-limit keys ==="
docker exec vaultstream-redis redis-cli FLUSHDB

echo ""
echo "=== Register user sara.ab2004@gmail.com ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:8081/auth/register \
  -H "Content-Type: application/json" \
  -d "$REG_JSON"

echo ""
echo "=== Login as sara.ab2004@gmail.com ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -d "$LOGIN_JSON"
