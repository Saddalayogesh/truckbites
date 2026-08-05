#!/usr/bin/env bash
# TruckBites E2E API test
BASE='http://localhost:8080/api'
PASS=0; FAIL=0

check() { # name expected actual
  if [ "$2" = "$3" ]; then PASS=$((PASS+1)); echo "  ✅ $1 (HTTP $3)";
  else FAIL=$((FAIL+1)); echo "  ❌ $1 — expected $2, got $3"; fi
}

echo '========== AUTH =========='
# login seeded vendor
VLOGIN=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' -d '{"email":"torii.treats@hydstreeteats.com","password":"toriitreats123"}')
VTOKEN=$(echo "$VLOGIN" | python -c 'import json,sys; print(json.load(sys.stdin)["token"])' 2>/dev/null)
[ -n "$VTOKEN" ] && { PASS=$((PASS+1)); echo '  ✅ Vendor login (token acquired)'; } || { FAIL=$((FAIL+1)); echo '  ❌ Vendor login failed'; }

CLOGIN=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' -d '{"email":"e2ecustomer1@test.com","password":"e2epass123"}')
CTOKEN=$(echo "$CLOGIN" | python -c 'import json,sys; print(json.load(sys.stdin)["token"])' 2>/dev/null)
[ -n "$CTOKEN" ] && { PASS=$((PASS+1)); echo '  ✅ Customer login (token acquired)'; } || { FAIL=$((FAIL+1)); echo '  ❌ Customer login failed'; }

# admin login (existing seeded admin)
ALOGIN=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@truckbites.com","password":"admin123"}')
ATOKEN=$(echo "$ALOGIN" | python -c 'import json,sys; print(json.load(sys.stdin)["token"])' 2>/dev/null)
if [ -z "$ATOKEN" ]; then
  ALOGIN=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@test.com","password":"admin123"}')
  ATOKEN=$(echo "$ALOGIN" | python -c 'import json,sys; print(json.load(sys.stdin)["token"])' 2>/dev/null)
fi
if [ -z "$ATOKEN" ]; then
  echo '  ⚠️  Admin login failed with assumed passwords — trying admin@system.com/admin123'
  ALOGIN=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@system.com","password":"admin123"}')
  ATOKEN=$(echo "$ALOGIN" | python -c 'import json,sys; print(json.load(sys.stdin)["token"])' 2>/dev/null)
fi
[ -n "$ATOKEN" ] && { PASS=$((PASS+1)); echo '  ✅ Admin login (token acquired)'; } || { FAIL=$((FAIL+1)); echo '  ❌ Admin login failed'; }

echo '========== TRUCK DISCOVERY (public) =========='
C=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/trucks/search")
check 'GET /trucks/search' '200' "$C"
N=$(curl -s "$BASE/trucks/search" | python -c 'import json,sys; print(len(json.load(sys.stdin)))')
echo "  (returned $N trucks)"
C=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/trucks/1")
check 'GET /trucks/1' '200' "$C"
C=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/trucks/search?cuisineType=Korean")
check 'Search cuisine=Korean' '200' "$C"

echo '========== MENU (public) =========='
C=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/menu/truck/1")
check 'GET /menu/truck/1' '200' "$C"
C=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/menu/1")
check 'GET /menu/1' '200' "$C"

echo '========== VENDOR TRUCK MGMT =========='
C=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $VTOKEN" "$BASE/trucks/my-trucks")
check 'GET /trucks/my-trucks (vendor)' '200' "$C"
C=$(curl -s -o /dev/null -w '%{http_code}' -X PATCH -H "Authorization: Bearer $VTOKEN" "$BASE/trucks/1/status")
check 'PATCH /trucks/1/status (vendor)' '200' "$C"
# toggle back
curl -s -o /dev/null -X PATCH -H "Authorization: Bearer $VTOKEN" "$BASE/trucks/1/status"
C=$(curl -s -o /dev/null -w '%{http_code}' -X PUT -H "Authorization: Bearer $VTOKEN" -H 'Content-Type: application/json' "$BASE/trucks/1/location" -d '{"latitude":17.4615,"longitude":78.3625}')
check 'PUT /trucks/1/location (vendor)' '200' "$C"

echo '========== ORDER FLOW (customer) =========='
CUSTEMAIL=$(echo "$CLOGIN" | python -c 'import json,sys; print(json.load(sys.stdin)["email"])' 2>/dev/null)
ORDER=$(curl -s -X POST $BASE/orders -H "Authorization: Bearer $CTOKEN" -H 'Content-Type: application/json' -d "{\"truckId\":1,\"customerEmail\":\"$CUSTEMAIL\",\"items\":[{\"menuItemId\":1,\"quantity\":2},{\"menuItemId\":3,\"quantity\":1}]}")
ORDERID=$(echo "$ORDER" | python -c 'import json,sys; print(json.load(sys.stdin)["id"])' 2>/dev/null)
if [ -n "$ORDERID" ]; then PASS=$((PASS+1)); echo "  ✅ POST /orders (order #$ORDERID created)"; else FAIL=$((FAIL+1)); echo "  ❌ POST /orders failed: $ORDER"; fi
C=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $CTOKEN" "$BASE/orders/my-orders")
check 'GET /orders/my-orders' '200' "$C"
C=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $CTOKEN" "$BASE/orders/$ORDERID")
check 'GET /orders/{id}' '200' "$C"

echo '========== PAYMENT (Razorpay) =========='
AMOUNT=$(echo "$ORDER" | python -c 'import json,sys; print(json.load(sys.stdin)["totalAmount"])' 2>/dev/null)
RP=$(curl -s -X POST $BASE/payments/razorpay/order -H "Authorization: Bearer $CTOKEN" -H 'Content-Type: application/json' -d "{\"orderId\":$ORDERID,\"amount\":$AMOUNT,\"currency\":\"INR\"}")
RPORDER=$(echo "$RP" | python -c 'import json,sys; print(json.load(sys.stdin)["razorpayOrderId"])' 2>/dev/null)
if [ -n "$RPORDER" ]; then PASS=$((PASS+1)); echo "  ✅ POST /payments/razorpay/order (razorpay order $RPORDER created, amount=$AMOUNT)"; else FAIL=$((FAIL+1)); echo "  ❌ POST /payments/razorpay/order failed: $RP"; fi
C=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $CTOKEN" "$BASE/payments/order/$ORDERID")
check 'GET /payments/order/{orderId}' '200' "$C"

echo '========== VENDOR ORDERS + STATUS =========='
C=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $VTOKEN" "$BASE/orders/truck/1")
check 'GET /orders/truck/1 (vendor)' '200' "$C"
C=$(curl -s -o /dev/null -w '%{http_code}' -X PATCH -H "Authorization: Bearer $VTOKEN" -H 'Content-Type: application/json' "$BASE/orders/$ORDERID/status" -d '{"status":"PREPARING"}')
check 'PATCH /orders/{id}/status (vendor)' '200' "$C"

echo '========== FAVORITES =========='
C=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "Authorization: Bearer $CTOKEN" "$BASE/favorites/2")
check 'POST /favorites/2 (customer)' '201' "$C"
C=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $CTOKEN" "$BASE/favorites")
check 'GET /favorites (customer)' '200' "$C"
C=$(curl -s -o /dev/null -w '%{http_code}' -X DELETE -H "Authorization: Bearer $CTOKEN" "$BASE/favorites/2")
check 'DELETE /favorites/2 (customer)' '204' "$C"

echo '========== REVIEWS =========='
# advance order to COMPLETED first (review requires COMPLETED order)
curl -s -o /dev/null -X PATCH -H "Authorization: Bearer $VTOKEN" -H 'Content-Type: application/json' "$BASE/orders/$ORDERID/status" -d '{"status":"COMPLETED"}'
C=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "Authorization: Bearer $CTOKEN" -H 'Content-Type: application/json' "$BASE/reviews/truck/1" -d "{\"orderId\":$ORDERID,\"rating\":5,\"comment\":\"Great ramen!\"}")
check 'POST /reviews/truck/1 (customer)' '201' "$C"
C=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/reviews/truck/1")
check 'GET /reviews/truck/1 (public)' '200' "$C"

echo '========== ADMIN =========='
C=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $ATOKEN" "$BASE/auth/users")
check 'GET /auth/users (admin)' '200' "$C"
C=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $ATOKEN" "$BASE/trucks/all")
check 'GET /trucks/all (admin)' '200' "$C"
C=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $ATOKEN" "$BASE/orders/all")
check 'GET /orders/all (admin)' '200' "$C"

echo '========== VENDOR ANALYTICS =========='
C=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $VTOKEN" "$BASE/analytics/truck/1/sales")
check 'GET /analytics/truck/1/sales (vendor)' '200' "$C"
C=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $VTOKEN" "$BASE/analytics/truck/1/top-items")
check 'GET /analytics/truck/1/top-items (vendor)' '200' "$C"

echo '========== SECURITY NEGATIVE TESTS =========='
# App returns 403 for unauthenticated access (AccessDeniedException -> 403); frontend treats 401/403 the same
C=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/orders/all")
check 'GET /orders/all without auth (denied)' '403' "$C"
C=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $CTOKEN" "$BASE/trucks/all")
check 'GET /trucks/all as CUSTOMER' '403' "$C"
C=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "Authorization: Bearer $CTOKEN" -H 'Content-Type: application/json' "$BASE/trucks" -d '{"name":"x","cuisineType":"x","latitude":1,"longitude":1}')
check 'POST /trucks as CUSTOMER (should be 403)' '403' "$C"

echo ""
echo '=================================================='
echo "  E2E RESULT: $PASS passed, $FAIL failed"
echo '=================================================='
exit $FAIL
