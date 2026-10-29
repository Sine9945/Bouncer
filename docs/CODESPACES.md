# Running Bouncer in GitHub Codespaces

Use this when the local machine cannot run Docker (for example, WSL2 does not start on Windows).
The devcontainer in `.devcontainer/` gives the API a working sandbox through Docker-in-Docker.

## One-time

1. Push the repo to GitHub. Check first that no real key is in a committed file: `.env` is gitignored, and
   `.env.example` must keep `NEBIUS_API_KEY=` empty.
2. Add Codespaces secrets at github.com → Settings → Codespaces → Secrets: `NEBIUS_API_KEY` (and
   optionally `TAVILY_API_KEY`), with access to this repository. They reach the API as environment variables.
3. Install VS Code and the **GitHub Codespaces** extension. Connecting from desktop VS Code forwards the
   codespace's ports to `localhost` on your machine, so the frontend needs no configuration.

## Each session

1. In VS Code: Command Palette → **Codespaces: Create New Codespace** (first time) or **Connect to Codespace**.
   The first build runs `make setup` automatically (sandbox image, backend venv, frontend deps, demo repo); it
   takes a few minutes.
2. In the codespace terminal:
   ```bash
   make api
   ```
   and in a second terminal:
   ```bash
   make web
   ```
3. Open http://localhost:3000 on your machine. The header should read "Sandbox ready, network off".

To keep running the frontend on your own machine instead, skip `make web` and run it locally as usual: it
calls `http://localhost:8000`, which VS Code forwards to the codespace.

Stop the codespace when you are done (Command Palette → **Codespaces: Stop Current Codespace**); it uses
your Codespaces hours while running.
