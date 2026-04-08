#!/bin/sh
set -e

mkdir -p /data/uploads

if [ ! -f /data/social-network.db ]; then
  touch /data/social-network.db
fi

ln -sf /data/social-network.db /app/cmd/server/social-network.db

rm -rf /app/cmd/server/uploads
ln -s /data/uploads /app/cmd/server/uploads

exec /app/cmd/server/server
