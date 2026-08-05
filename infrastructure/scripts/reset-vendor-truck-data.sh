#!/usr/bin/env bash
# ============================================================================
# TruckBites - Reset Vendor & Food Truck Data (one-time cleanup)
# ============================================================================
# Deletes ALL existing VENDOR accounts and ALL food-truck related data:
#
#   auth-mysql  (truckbites_auth_db)  -> users with role = VENDOR
#   user-mysql  (truckbites_users_db) -> user_profiles of deleted vendors
#   truck-mysql (truckbites_truck_db) -> trucks, favorites, reviews
#   menu-mysql  (truckbites_menu_db)  -> menu_items
#   order-mysql (order_db)            -> orders, order_items
#   payment-mysql (payment_db)        -> payments
#
# ADMIN and CUSTOMER accounts are KEPT.  Auto-increment counters are reset so
# the new data can start from fresh IDs.
#
# Usage:
#   1. Start Docker Desktop
#   2. bash infrastructure/scripts/reset-vendor-truck-data.sh
#      or: bash infrastructure/scripts/reset-vendor-truck-data.sh --yes   (skip confirmation)
# ============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Load .env (MYSQL_ROOT_PASSWORD) if present
# ---------------------------------------------------------------------------
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:?MYSQL_ROOT_PASSWORD not set - create .env with MYSQL_ROOT_PASSWORD=<password>}"

CONFIRM="${1:-ask}"

AUTH_DB=truckbites-auth-mysql
USER_DB=truckbites-user-mysql
TRUCK_DB=truckbites-truck-mysql
MENU_DB=truckbites-menu-mysql
ORDER_DB=truckbites-order-mysql
PAYMENT_DB=truckbites-payment-mysql

ALL_DBS=("$AUTH_DB" "$USER_DB" "$TRUCK_DB" "$MENU_DB" "$ORDER_DB" "$PAYMENT_DB")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
log()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()   { printf '    \033[1;32m✓\033[0m %s\n' "$*"; }
warn() { printf '    \033[1;33m!\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

mysql_exec() { # container db sql...
  local container="$1" db="$2"; shift 2
  docker exec "$container" mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$db" -e "$*" 2>&1
}

table_exists() { # container db table
  mysql_exec "$1" "$2" "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$2' AND table_name='$3';" | grep -q '^1$'
}

truncate_table() { # container db table
  if table_exists "$1" "$2" "$3"; then
    # Disable FK checks so TRUNCATE works even on tables referenced by FKs
    mysql_exec "$1" "$2" "SET FOREIGN_KEY_CHECKS=0; TRUNCATE TABLE \`$3\`; SET FOREIGN_KEY_CHECKS=1;" >/dev/null && ok "Truncated $2.$3"
  else
    warn "Table $2.$3 does not exist - skipping"
  fi
}

# ---------------------------------------------------------------------------
# 0. Preflight
# ---------------------------------------------------------------------------
docker info >/dev/null 2>&1 || fail "Docker daemon is not running. Start Docker Desktop first."

log "Verifying database containers exist"
docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "truckbites-auth-mysql" || fail "MySQL containers not found - are you in the project root and is the stack defined?"
docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "truckbites-auth-mysql" || fail "truckbites-auth-mysql is not running - run 'docker compose up -d' first"

if [ "$CONFIRM" != "--yes" ]; then
  echo ""
  echo "This will PERMANENTLY DELETE:"
  echo "  • All vendor (role=VENDOR) user accounts"
  echo "  • All food trucks, favorites, reviews"
  echo "  • All menu items, orders, order items, payments"
  echo "  KEEPING: ADMIN and CUSTOMER accounts"
  echo ""
  read -r -p "Type 'yes' to continue: " answer
  [ "$answer" = "yes" ] || { echo "Aborted."; exit 1; }
fi

# ---------------------------------------------------------------------------
# 1. Start only the database containers
# ---------------------------------------------------------------------------
log "Ensuring database containers are running"
docker compose up -d auth-mysql user-mysql truck-mysql menu-mysql order-mysql payment-mysql

docker compose up -d auth-mysql user-mysql truck-mysql menu-mysql order-mysql payment-mysql >/dev/null 2>&1 || true

docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "truckbites-auth-mysql" || docker start truckbites-auth-mysql truckbites-user-mysql truckbites-truck-mysql truckbites-menu-mysql truckbites-order-mysql truckbites-payment-mysql 2>/dev/null || true

log "Waiting for databases to become healthy"
for c in "${ALL_DBS[@]}"; do
  for _ in $(seq 1 60); do
    status=$(docker inspect -f '{{.State.Health.Status}}' "$c" 2>/dev/null || echo starting)
    [ "$status" = "healthy" ] && break
    sleep 2
  done
  [ "$status" = "healthy" ] || fail "Database $c not healthy (status=$status)"
  ok "$c is healthy"
done

# ---------------------------------------------------------------------------
# 2. Capture vendor user IDs (before deleting them) for related-table cleanup
# ---------------------------------------------------------------------------
log "Capturing vendor user IDs from auth database"
VENDOR_IDS=$(mysql_exec "$AUTH_DB" truckbites_auth_db "SELECT id FROM users WHERE role='VENDOR';" | grep -E '^[0-9]+$' | tr '\n' ',' | sed 's/,$//' || true)
if [ -n "$VENDOR_IDS" ]; then
  ok "Vendor IDs: $VENDOR_IDS"
else
  ok "No vendor accounts found"
fi

# ---------------------------------------------------------------------------
# 3. Delete vendor tokens, then vendors from auth DB (keep ADMIN + CUSTOMER)
# ---------------------------------------------------------------------------
log "Deleting VENDOR users (auth database)"
if [ -n "$VENDOR_IDS" ]; then
  for t in refresh_tokens password_reset_tokens; do
    if table_exists "$AUTH_DB" truckbites_auth_db "$t"; then
      mysql_exec "$AUTH_DB" truckbites_auth_db "DELETE FROM $t WHERE user_id IN ($VENDOR_IDS);" >/dev/null 2>&1 || true
    fi
  done
fi
mysql_exec "$AUTH_DB" truckbites_auth_db "DELETE FROM users WHERE role='VENDOR';" >/dev/null
REMAINING_ADMINS=$(mysql_exec "$AUTH_DB" truckbites_auth_db "SELECT COUNT(*) FROM users WHERE role='ADMIN';" | grep -E '^[0-9]+$')
REMAINING_CUSTOMERS=$(mysql_exec "$AUTH_DB" truckbites_auth_db "SELECT COUNT(*) FROM users WHERE role='CUSTOMER';" | grep -E '^[0-9]+$')
ok "Deleted vendors - remaining ADMIN=$REMAINING_ADMINS, CUSTOMER=$REMAINING_CUSTOMERS"

# ---------------------------------------------------------------------------
# 4. Delete vendor profiles from user DB
# ---------------------------------------------------------------------------
log "Deleting vendor user profiles (user database)"
if [ -n "$VENDOR_IDS" ]; then
  if table_exists "$USER_DB" truckbites_users_db user_profiles; then
    mysql_exec "$USER_DB" truckbites_users_db "DELETE FROM user_profiles WHERE user_id IN ($VENDOR_IDS);" >/dev/null
    ok "Deleted profiles for vendors"
  else
    warn "user_profiles table does not exist - skipping"
  fi
else
  ok "Nothing to delete"
fi

# ---------------------------------------------------------------------------
# 5. Wipe truck-related data (trucks, favorites, reviews, operating hours)
# ---------------------------------------------------------------------------
log "Wiping truck data (truck database)"
truncate_table "$TRUCK_DB" truckbites_truck_db favorites
truncate_table "$TRUCK_DB" truckbites_truck_db reviews
truncate_table "$TRUCK_DB" truckbites_truck_db operating_hours
truncate_table "$TRUCK_DB" truckbites_truck_db trucks

# ---------------------------------------------------------------------------
# 6. Wipe menu items
# ---------------------------------------------------------------------------
log "Wiping menu data (menu database)"
truncate_table "$MENU_DB" truckbites_menu_db menu_items

# ---------------------------------------------------------------------------
# 7. Wipe orders & order items (child first)
# ---------------------------------------------------------------------------
log "Wiping order data (order database)"
truncate_table "$ORDER_DB" order_db order_items
truncate_table "$ORDER_DB" order_db orders

# ---------------------------------------------------------------------------
# 8. Wipe payments
# ---------------------------------------------------------------------------
log "Wiping payment data (payment database)"
truncate_table "$PAYMENT_DB" payment_db payments

# ---------------------------------------------------------------------------
# 9. Summary
# ---------------------------------------------------------------------------
echo ""
echo "==============================================================="
echo "  Reset complete ✔"
echo "==============================================================="
echo "  • Vendor accounts      : deleted"
echo "  • Food trucks          : 0 remaining"
echo "  • Menu items           : 0 remaining"
echo "  • Orders / payments    : 0 remaining"
echo ""
echo "  Next steps:"
echo "   1. Start the full stack:  docker compose up -d --build"
echo "   2. Add your new vendors/trucks via the Admin Panel or API"
echo "==============================================================="
