#!/usr/bin/env bash
# One-shot setup of the Bouncer API + sandbox on a fresh Nebius Compute VM (Ubuntu 22.04/24.04).
#
#   1. Create a VM in the Nebius console (CPU-only is enough: 4 vCPU / 16 GB, public IP, ports 80+443 open).
#   2. ssh in, clone the repo, then:   sudo bash deploy/nebius-vm-setup.sh https://<your-app>.vercel.app
#   3. Put your keys in /opt/bouncer/.env and run: sudo systemctl restart bouncer
#
# The API is served over HTTPS at https://<public-ip>.sslip.io (Caddy gets a Let's Encrypt cert
# automatically, so no domain is needed). Untrusted reproductions still run in --network none containers.
set -euo pipefail

DASHBOARD_ORIGIN="${1:?usage: sudo bash deploy/nebius-vm-setup.sh https://<your-app>.vercel.app}"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR=/opt/bouncer
APP_USER=bouncer
PUBLIC_IP="$(curl -fsS https://api.ipify.org)"
HOST="${BOUNCER_HOST:-${PUBLIC_IP//./-}.sslip.io}"

echo "==> packages"
apt-get update -q
apt-get install -y -q docker.io python3 python3-venv git make curl rsync debian-keyring debian-archive-keyring apt-transport-https
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -q && apt-get install -y -q caddy
fi
systemctl enable --now docker

echo "==> app user and code"
id "$APP_USER" >/dev/null 2>&1 || useradd --create-home --shell /bin/bash "$APP_USER"
usermod -aG docker "$APP_USER"
mkdir -p "$APP_DIR"
rsync -a --exclude frontend/node_modules --exclude backend/.venv --exclude data "$REPO_DIR/" "$APP_DIR/"
[ -f "$APP_DIR/.env" ] || cp "$APP_DIR/.env.example" "$APP_DIR/.env"
grep -q '^BOUNCER_CORS_ORIGINS=' "$APP_DIR/.env" \
  && sed -i "s#^BOUNCER_CORS_ORIGINS=.*#BOUNCER_CORS_ORIGINS=$DASHBOARD_ORIGIN#" "$APP_DIR/.env" \
  || echo "BOUNCER_CORS_ORIGINS=$DASHBOARD_ORIGIN" >> "$APP_DIR/.env"
# Job dirs are bind-mounted into the sandbox, so data must live in the app user's home.
grep -q '^BOUNCER_DATA_DIR=' "$APP_DIR/.env" || echo "BOUNCER_DATA_DIR=/home/$APP_USER/bouncer-data" >> "$APP_DIR/.env"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

echo "==> sandbox image, venv, demo repo"
docker build -t bouncer-sandbox:1 "$APP_DIR/sandbox"
sudo -u "$APP_USER" bash -c "cd $APP_DIR/backend && python3 -m venv .venv && .venv/bin/pip install -q -r requirements.txt"
sudo -u "$APP_USER" bash -c "cd $APP_DIR && python3 demo/build_tinyparse.py /home/$APP_USER/bouncer-data/repos/tinyparse"

echo "==> systemd service"
cat > /etc/systemd/system/bouncer.service <<EOF
[Unit]
Description=Bouncer API
After=network-online.target docker.service
Requires=docker.service

[Service]
User=$APP_USER
WorkingDirectory=$APP_DIR/backend
ExecStart=$APP_DIR/backend/.venv/bin/uvicorn bouncer.api:app --host 127.0.0.1 --port 8000
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now bouncer

echo "==> HTTPS reverse proxy"
cat > /etc/caddy/Caddyfile <<EOF
$HOST {
    reverse_proxy 127.0.0.1:8000 {
        flush_interval -1
    }
}
EOF
systemctl restart caddy

echo
echo "Done. API: https://$HOST/api/health"
echo "Next: add NEBIUS_API_KEY to $APP_DIR/.env, then: sudo systemctl restart bouncer"
echo "Vercel: set NEXT_PUBLIC_API_URL=https://$HOST and redeploy."
