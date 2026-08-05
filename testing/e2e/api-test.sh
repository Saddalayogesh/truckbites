#!/usr/bin/env bash
# ============================================================================
# TruckBites E2E API Test — exercises the full flow through the API gateway
#   Path: /api/* -> api-gateway (8080) -> microservices
# JSON parsing uses Node (jq is not installed on this machine).
# ============================================================================
set -u
GW="http://localhost:8080/api"
TS=$(date +%s)
PASS=0
FAIL=0
FAILED_TESTS=()

CUST_EMAIL="e2e.customer.$TS@test.com"
VENDOR_EMAIL="e2e.vendor.$TS@test.com"
ADMIN_EMAIL="e2e.admin.$TS@test.com"
PASSWORD="password123"

# --- helpers ---------------------------------------------------------------
check() {
  local label="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    PASS=$((PASS + 1))
    echo "  PASS: $label (HTTP $actual)"
  else
    FAIL=$((FAIL + 1))
    FAILED_TESTS+=("$label")
    echo "  FAIL: $label (expected HTTP $expected, got $actual)"
  fi
}

# json_get <json> <filter>
#   filter is a JS expression evaluated against parsed JSON, e.g. .token, .a.b, length
# Node helper receives the expression as argv[2] to avoid bash interference.
_NODE_GET='
let d = "";
process.stdin.on("data", c => d += c);
process.stdin.on("end", () => {
  try {
    const j = JSON.parse(d);
    const expr = process.argv[1];
    let v;
    if (expr === "length") {
      v = Array.isArray(j) ? j.length : (j ? 1 : 0);
    } else {
      v = expr.split(".").filter(Boolean).reduce((acc, k) => acc == null ? acc : acc[k], j);
    }
    process.stdout.write(v == null ? "" : String(v));
  } catch (e) {
    process.stdout.write("");
  }
});
'
json_get() {
  echo "$1" | node -e "$_NODE_GET" "$2"
}

echo "=============================================="
echo "TruckBites E2E API Test - $(date)"
echo "Gateway: $GW"
echo "=============================================="

# --- 1. AUTH: register (public -> CUSTOMER) ----------------------------------
echo ""
echo "[1] AUTH - Register & Login"

R1=$(curl -s -w "\n%{http_code}" -X POST "$GW/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"E2E Customer\",\"email\":\"$CUST_EMAIL\",\"password\":\"$PASSWORD\"}")
CODE=$(echo "$R1" | tail -1)
check "register customer (201)" 201 "$CODE"

R2=$(curl -s -w "\n%{http_code}" -X POST "$GW/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"E2E Vendor\",\"email\":\"$VENDOR_EMAIL\",\"password\":\"$PASSWORD\"}")
CODE=$(echo "$R2" | tail -1)
check "register vendor (201)" 201 "$CODE"

R3=$(curl -s -w "\n%{http_code}" -X POST "$GW/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"E2E Admin\",\"email\":\"$ADMIN_EMAIL\",\"password\":\"$PASSWORD\"}")
CODE=$(echo "$R3" | tail -1)
check "register admin (201)" 201 "$CODE"

RD=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$GW/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"Dup\",\"email\":\"$CUST_EMAIL\",\"password\":\"$PASSWORD\"}")
check "duplicate register rejected (401)" 401 "$RD"

LC=$(curl -s -w "\n%{http_code}" -X POST "$GW/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$CUST_EMAIL\",\"password\":\"$PASSWORD\"}")
CODE=$(echo "$LC" | tail -1)
CUST_TOKEN=$(json_get "$(echo "$LC" | head -n -1)" "token")
CUST_ID=$(json_get "$(echo "$LC" | head -n -1)" "userId")
check "login customer" 200 "$CODE"
echo "  INFO: customer token present: $([ -n "$CUST_TOKEN" ] && echo yes || echo NO)"

LW=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$GW/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$CUST_EMAIL\",\"password\":\"wrongpass\"}")
check "wrong password rejected (401)" 401 "$LW"

LV=$(curl -s -w "\n%{http_code}" -X POST "$GW/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$VENDOR_EMAIL\",\"password\":\"$PASSWORD\"}")
VENDOR_TOKEN=$(json_get "$(echo "$LV" | head -n -1)" "token")
VENDOR_ID=$(json_get "$(echo "$LV" | head -n -1)" "userId")
CODE=$(echo "$LV" | tail -1)
check "login vendor" 200 "$CODE"

# --- 2. BOOTSTRAP ROLES (admin via DB, then vendor via ADMIN API) ---------------
echo ""
echo "[2] BOOTSTRAP - promote admin (DB) then vendor via ADMIN API"

docker exec truckbites-auth-mysql mysql -uroot -p"${MYSQL_ROOT_PASSWORD:-truckbites_root}" truckbites_auth_db \
  -e "UPDATE users SET role='ADMIN' WHERE email='$ADMIN_EMAIL';" >/dev/null 2>&1
echo "  INFO: admin promoted in DB"

LA=$(curl -s -w "\n%{http_code}" -X POST "$GW/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$PASSWORD\"}")
ADMIN_TOKEN=$(json_get "$(echo "$LA" | head -n -1)" "token")
CODE=$(echo "$LA" | tail -1)
check "login admin (after promote)" 200 "$CODE"
echo "  INFO: admin token present: $([ -n "$ADMIN_TOKEN" ] && echo yes || echo NO)"

AU=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$GW/auth/users" -H "Authorization: Bearer $ADMIN_TOKEN")
check "admin get all users" 200 "$AU"

UV=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$GW/auth/users/$VENDOR_ID/role" \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"role":"VENDOR"}')
check "admin promote vendor (role update)" 200 "$UV"

# --- 3. TRUCK: vendor creates trucks -----------------------------------------
echo ""
echo "[3] TRUCK - vendor CRUD"

LV=$(curl -s -X POST "$GW/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$VENDOR_EMAIL\",\"password\":\"$PASSWORD\"}")
VENDOR_TOKEN=$(json_get "$LV" "token")
echo "  INFO: vendor token present: $([ -n "$VENDOR_TOKEN" ] && echo yes || echo NO)"

CT_FORBIDDEN=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$GW/trucks" \
  -H "Authorization: Bearer $CUST_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Unauthorized Truck","cuisineType":"Test","latitude":40.71,"longitude":-74.00}')
check "customer cannot create truck (403)" 403 "$CT_FORBIDDEN"

CT=$(curl -s -w "\n%{http_code}" -X POST "$GW/trucks" \
  -H "Authorization: Bearer $VENDOR_TOKEN" -H "Content-Type: application/json" \
  -d "{\"name\":\"Taco Express $TS\",\"cuisineType\":\"Mexican\",\"description\":\"Authentic street tacos\",\"latitude\":40.7128,\"longitude\":-74.0060,\"estimatedPrepTimeMinutes\":15}")
CODE=$(echo "$CT" | tail -1)
TRUCK_ID=$(json_get "$(echo "$CT" | head -n -1)" "id")
check "vendor create truck (201)" 201 "$CODE"
echo "  INFO: truck id=$TRUCK_ID"

ST=$(curl -s -o /dev/null -w "%{http_code}" "$GW/trucks/search?cuisineType=Mexican")
check "search trucks (public)" 200 "$ST"

if [ -n "$TRUCK_ID" ]; then
  GT=$(curl -s -o /dev/null -w "%{http_code}" "$GW/trucks/$TRUCK_ID")
  check "get truck by id (public)" 200 "$GT"
fi

MT=$(curl -s -o /dev/null -w "%{http_code}" "$GW/trucks/my-trucks" -H "Authorization: Bearer $VENDOR_TOKEN")
check "vendor get my trucks" 200 "$MT"

if [ -n "$TRUCK_ID" ]; then
  UL=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$GW/trucks/$TRUCK_ID/location" \
    -H "Authorization: Bearer $VENDOR_TOKEN" -H "Content-Type: application/json" \
    -d '{"latitude":40.7580,"longitude":-73.9855}')
  check "vendor update location" 200 "$UL"
fi

# --- 4. MENU: vendor adds items, customer views -------------------------------
echo ""
echo "[4] MENU - vendor & customer"

ITEM1_ID=""
if [ -n "$TRUCK_ID" ]; then
  M1=$(curl -s -w "\n%{http_code}" -X POST "$GW/menu" \
    -H "Authorization: Bearer $VENDOR_TOKEN" -H "Content-Type: application/json" \
    -d "{\"truckId\":$TRUCK_ID,\"name\":\"Street Taco\",\"description\":\"Soft corn tortilla with grilled chicken\",\"price\":3.99,\"category\":\"Tacos\",\"quantityAvailable\":50,\"isAvailable\":true}")
  CODE=$(echo "$M1" | tail -1)
  ITEM1_ID=$(json_get "$(echo "$M1" | head -n -1)" "id")
  check "vendor add menu item 1 (201)" 201 "$CODE"

  M2=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$GW/menu" \
    -H "Authorization: Bearer $VENDOR_TOKEN" -H "Content-Type: application/json" \
    -d "{\"truckId\":$TRUCK_ID,\"name\":\"Quesadilla\",\"description\":\"Flour tortilla with cheese\",\"price\":5.50,\"category\":\"Specialties\",\"quantityAvailable\":30,\"isAvailable\":true}")
  check "vendor add menu item 2 (201)" 201 "$M2"

  GM=$(curl -s -w "\n%{http_code}" "$GW/menu/truck/$TRUCK_ID")
  CODE=$(echo "$GM" | tail -1)
  ITEM_COUNT=$(json_get "$(echo "$GM" | head -n -1)" "length")
  check "get menu by truck (public)" 200 "$CODE"
  echo "  INFO: menu items=$ITEM_COUNT"

  if [ -n "$ITEM1_ID" ]; then
    UI=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$GW/menu/$ITEM1_ID/inventory" \
      -H "Authorization: Bearer $VENDOR_TOKEN" -H "Content-Type: application/json" \
      -d '{"quantity":40}')
    check "vendor update inventory" 200 "$UI"
  fi
fi

# --- 5. FAVORITES & REVIEWS (customer) ----------------------------------------
echo ""
echo "[5] FAVORITES & REVIEWS - customer"

if [ -n "$TRUCK_ID" ]; then
  F1=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$GW/favorites/$TRUCK_ID" \
    -H "Authorization: Bearer $CUST_TOKEN")
  check "customer add favorite (201)" 201 "$F1"

  F2=$(curl -s -o /dev/null -w "%{http_code}" "$GW/favorites/$TRUCK_ID/check" \
    -H "Authorization: Bearer $CUST_TOKEN")
  check "customer check favorite" 200 "$F2"

  F3=$(curl -s -w "\n%{http_code}" "$GW/favorites" -H "Authorization: Bearer $CUST_TOKEN")
  CODE=$(echo "$F3" | tail -1)
  FAV_COUNT=$(json_get "$(echo "$F3" | head -n -1)" "length")
  check "customer get favorites" 200 "$CODE"
  echo "  INFO: favorites=$FAV_COUNT"

  GR=$(curl -s -o /dev/null -w "%{http_code}" "$GW/reviews/truck/$TRUCK_ID")
  check "get reviews (public)" 200 "$GR"
fi

# --- 6. ORDER: customer places order -------------------------------------------
echo ""
echo "[6] ORDER - customer places order"

ORDER_ID=""
if [ -n "$TRUCK_ID" ] && [ -n "$ITEM1_ID" ]; then
  CO=$(curl -s -w "\n%{http_code}" -X POST "$GW/orders" \
    -H "Authorization: Bearer $CUST_TOKEN" -H "Content-Type: application/json" \
    -d "{\"customerEmail\":\"$CUST_EMAIL\",\"truckId\":$TRUCK_ID,\"items\":[{\"menuItemId\":$ITEM1_ID,\"quantity\":2}]}")
  CODE=$(echo "$CO" | tail -1)
  ORDER_ID=$(json_get "$(echo "$CO" | head -n -1)" "id")
  ORDER_STATUS=$(json_get "$(echo "$CO" | head -n -1)" "status")
  check "customer create order (201)" 201 "$CODE"
  echo "  INFO: order id=$ORDER_ID status=$ORDER_STATUS"

  GO=$(curl -s -o /dev/null -w "%{http_code}" "$GW/orders/$ORDER_ID" -H "Authorization: Bearer $CUST_TOKEN")
  check "customer get order by id" 200 "$GO"

  MO=$(curl -s -w "\n%{http_code}" "$GW/orders/my-orders" -H "Authorization: Bearer $CUST_TOKEN")
  CODE=$(echo "$MO" | tail -1)
  MY_ORDERS=$(json_get "$(echo "$MO" | head -n -1)" "length")
  check "customer get my orders" 200 "$CODE"
  echo "  INFO: my orders=$MY_ORDERS"
fi

# --- 7. PAYMENT: customer pays ------------------------------------------------
echo ""
echo "[7] PAYMENT - process payment"

if [ -n "$ORDER_ID" ]; then
  AMT=$(json_get "$(curl -s "$GW/orders/$ORDER_ID" -H "Authorization: Bearer $CUST_TOKEN")" "totalAmount")
  if [ -z "$AMT" ] || [ "$AMT" = "null" ]; then AMT=7.98; fi
  PP=$(curl -s -w "\n%{http_code}" -X POST "$GW/payments/razorpay/order" \
    -H "Authorization: Bearer $CUST_TOKEN" -H "Content-Type: application/json" \
    -d "{\"orderId\":$ORDER_ID,\"amount\":$AMT,\"currency\":\"INR\"}")
  CODE=$(echo "$PP" | tail -1)
  RP_ORDER=$(json_get "$(echo "$PP" | head -n -1)" "razorpayOrderId")
  check "create razorpay order (200)" 200 "$CODE"
  echo "  INFO: razorpayOrderId=$RP_ORDER (amount=$AMT INR)"
fi

# --- 8. VENDOR: view & update order status --------------------------------------
echo ""
echo "[8] VENDOR - order management"

if [ -n "$TRUCK_ID" ]; then
  VO=$(curl -s -o /dev/null -w "%{http_code}" "$GW/orders/truck/$TRUCK_ID" \
    -H "Authorization: Bearer $VENDOR_TOKEN")
  check "vendor get truck orders" 200 "$VO"
fi

if [ -n "$ORDER_ID" ]; then
  VU=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$GW/orders/$ORDER_ID/status" \
    -H "Authorization: Bearer $VENDOR_TOKEN" -H "Content-Type: application/json" \
    -d '{"status":"PREPARING"}')
  check "vendor update order status" 200 "$VU"

  VU2=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$GW/orders/$ORDER_ID/status" \
    -H "Authorization: Bearer $VENDOR_TOKEN" -H "Content-Type: application/json" \
    -d '{"status":"COMPLETED"}')
  check "vendor complete order" 200 "$VU2"

  # Review is tied to a completed order (matches the frontend OrderHistory flow)
  if [ -n "$TRUCK_ID" ]; then
    RV=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$GW/reviews/truck/$TRUCK_ID" \
      -H "Authorization: Bearer $CUST_TOKEN" -H "Content-Type: application/json" \
      -d "{\"orderId\":$ORDER_ID,\"rating\":5,\"comment\":\"Amazing tacos!\"}")
    check "customer add review (201)" 201 "$RV"
  fi
fi

# --- 9. ANALYTICS: vendor dashboard ----------------------------------------------
echo ""
echo "[9] ANALYTICS - vendor"

if [ -n "$TRUCK_ID" ]; then
  A1=$(curl -s -o /dev/null -w "%{http_code}" "$GW/analytics/truck/$TRUCK_ID/sales" \
    -H "Authorization: Bearer $VENDOR_TOKEN")
  check "vendor daily sales" 200 "$A1"

  A2=$(curl -s -o /dev/null -w "%{http_code}" "$GW/analytics/truck/$TRUCK_ID/top-items" \
    -H "Authorization: Bearer $VENDOR_TOKEN")
  check "vendor top items" 200 "$A2"

  A3=$(curl -s -o /dev/null -w "%{http_code}" "$GW/analytics/truck/$TRUCK_ID/order-summary" \
    -H "Authorization: Bearer $VENDOR_TOKEN")
  check "vendor order summary" 200 "$A3"

  A4=$(curl -s -o /dev/null -w "%{http_code}" "$GW/analytics/truck/$TRUCK_ID/sales" \
    -H "Authorization: Bearer $CUST_TOKEN")
  check "customer analytics denied (403)" 403 "$A4"
fi

# --- 10. ADMIN: cross-service visibility ------------------------------------------
echo ""
echo "[10] ADMIN - cross-service"

AD1=$(curl -s -o /dev/null -w "%{http_code}" "$GW/trucks/all" -H "Authorization: Bearer $ADMIN_TOKEN")
check "admin get all trucks" 200 "$AD1"

AD2=$(curl -s -o /dev/null -w "%{http_code}" "$GW/orders/all" -H "Authorization: Bearer $ADMIN_TOKEN")
check "admin get all orders" 200 "$AD2"

# --- 11. NOTIFICATION: rabbitmq event consumed -------------------------------------
echo ""
echo "[11] NOTIFICATION - event consumed"

NOTIF_LOG=$(docker logs truckbites-notification-service 2>&1 | grep -c "order.placed\|Received message\|OrderPlacedEvent")
echo "  INFO: notification service order.placed log lines: $NOTIF_LOG"

# --- SUMMARY ------------------------------------------------------------------------
echo ""
echo "=============================================="
echo "E2E API TEST SUMMARY"
echo "  PASS: $PASS"
echo "  FAIL: $FAIL"
if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
  echo "  FAILED:"
  for t in "${FAILED_TESTS[@]}"; do echo "    - $t"; done
fi
echo "=============================================="
exit 0
