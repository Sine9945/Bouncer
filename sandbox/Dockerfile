# Bouncer sandbox image: builds and runs untrusted reproductions.
# Runs with --network none, read-only root, non-root user, CPU/memory/pids limits (see backend/bouncer/sandbox.py).
# trixie ships clang 19; clang 14's ASan crashes at random on kernels with high mmap ASLR entropy (e.g. WSL2 6.x).
FROM debian:trixie-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends clang libclang-rt-19-dev llvm make python3 patch \
 && rm -rf /var/lib/apt/lists/*
RUN useradd --create-home --uid 10001 runner
USER runner
WORKDIR /work
