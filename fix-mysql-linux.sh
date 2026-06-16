#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  fix-mysql-linux.sh
#
#  On Linux, Docker containers CANNOT use host.docker.internal by default.
#  This script detects your machine's LAN IP and patches the .env file so
#  the backend container can reach your local MySQL.
#
#  Run once before `docker compose up`:
#    chmod +x fix-mysql-linux.sh && ./fix-mysql-linux.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

HOST_IP=$(ip route get 1 | awk '{print $7; exit}')
echo "Detected host IP: $HOST_IP"

if [ -z "$HOST_IP" ]; then
  echo "❌  Could not detect host IP. Set DB_HOST manually in .env"
  exit 1
fi

# Patch .env
sed -i "s/^DB_HOST=.*/DB_HOST=$HOST_IP/" .env
echo "✅  .env updated: DB_HOST=$HOST_IP"

# Also allow MySQL to accept connections from Docker's subnet
echo ""
echo "⚠️   Make sure MySQL is configured to accept remote connections:"
echo "   1. In /etc/mysql/mysql.conf.d/mysqld.cnf change:"
echo "        bind-address = 127.0.0.1"
echo "      to:"
echo "        bind-address = 0.0.0.0"
echo ""
echo "   2. Grant access to Docker subnet in MySQL:"
echo "        GRANT ALL ON library_mgmt.* TO 'root'@'172.%.%.%' IDENTIFIED BY 'your_password';"
echo "        FLUSH PRIVILEGES;"
echo ""
echo "   3. Restart MySQL: sudo systemctl restart mysql"
