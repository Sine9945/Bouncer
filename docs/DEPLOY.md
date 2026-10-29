# Deploying Bouncer

Two parts: the **API + sandbox** on a Nebius VM (Docker with `--network none`, as planned in ARCHITECTURE.md), and the **dashboard** on Vercel.

> **Windows users:** the Makefile and scripts need a Linux shell. Use WSL 2 (Ubuntu) with Docker Desktop's WSL integration turned on, and keep the repo inside the WSL filesystem (e.g. `~/bouncer`), not under `C:\`.

## 0. Live Nemotron check (do this first, ~2 min)

```bash
cp .env.example .env            # paste NEBIUS_API_KEY
make check-models               # lists Nemotron models your key sees + one test call per tier
```

All three tiers should print a latency and a short answer. If one says "NOT in the catalogue", set `NEMOTRON_<TIER>_MODEL` in `.env` to the ID it lists. Then run `make api` + `make web`, click **Run 10 test reports**, and check the **Models** tab on a card shows `nebius-token-factory` calls with tokens and cost.

## 1. API + sandbox on Nebius

1. Nebius console → Compute → Create VM: Ubuntu 24.04, 4 vCPU / 16 GB (no GPU needed; Nemotron runs on Token Factory), public IP, allow inbound 22/80/443.
2. On the VM:
   ```bash
   git clone <your repo> bouncer && cd bouncer
   sudo bash deploy/nebius-vm-setup.sh https://<your-app>.vercel.app
   sudo nano /opt/bouncer/.env       # NEBIUS_API_KEY=..., optionally TAVILY_API_KEY
   sudo systemctl restart bouncer
   ```
3. Check `https://<ip-with-dashes>.sslip.io/api/health` shows `"live": true` and `"sandbox": {"ok": true}`.

Logs: `journalctl -u bouncer -f`. Leave `GITHUB_TOKEN` unset on the public demo so nobody can publish an advisory.

## 2. Dashboard on Vercel

1. vercel.com → Add New Project → import the repo → **Root Directory: `frontend`**.
2. Environment variable: `NEXT_PUBLIC_API_URL=https://<ip-with-dashes>.sslip.io`.
3. Deploy. If you used a different Vercel URL than the one passed to the setup script, update `BOUNCER_CORS_ORIGINS` in `/opt/bouncer/.env` and restart.

## Cost guardrails

- `BOUNCER_DAILY_BUDGET_USD` (default 5) stops model calls once reached; the UI then shows labelled fallbacks.
- Submissions are rate-limited to 40/hour; each sandbox run is capped at `BOUNCER_SANDBOX_TIMEOUT` seconds, 1.5 CPU and 768 MB.
- Stop the VM after judging.
