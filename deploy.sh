#!/bin/sh
# Run on the server by the GitHub Actions deploy key. authorized_keys pins that key to this
# script (command="sh /root/portfolio/deploy.sh"), so a leaked key can only redeploy.
# Reads POSTGRES_PASSWORD from stdin so it never appears in a command line or on disk.
set -e
IFS= read -r POSTGRES_PASSWORD
[ -n "$POSTGRES_PASSWORD" ] || { echo "POSTGRES_PASSWORD secret is empty"; exit 1; }
export POSTGRES_PASSWORD

cd "$(dirname "$0")"
git pull --ff-only
# --pull picks up security patches in base images (node, nginx, python, caddy, postgres)
docker compose build --pull
docker compose up -d --pull always --remove-orphans
docker image prune -f
docker compose ps
