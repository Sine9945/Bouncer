"use client";

import { Box, Cpu, Globe, Moon, RotateCcw, Sun } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CaseFile } from "@/components/CaseFile";
import { LimitationsDialog, SubmitDialog } from "@/components/Dialogs";
import { Intro } from "@/components/Intro";
import { Queue } from "@/components/Queue";
import { API_URL, api, type Card, type Health, type ReportDetail, type Stats } from "@/lib/api";

export default function Console() {
  const [cards, setCards] = useState<Card[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<ReportDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [limitsOpen, setLimitsOpen] = useState(false);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const selectedRef = useRef<string | null>(null);

  const refreshList = useCallback(
    () =>
      api
        .reports()
        .then((data) => {
          setCards(data.reports);
          setStats(data.stats);
          setError(null);
        })
        .catch((e: Error) => setError(e.message))
        .finally(() => setLoaded(true)),
    [],
  );

  const refreshDetail = useCallback((id: string | null) => {
    if (!id) return;
    api
      .report(id)
      .then((d) => {
        if (selectedRef.current === id) setDetail(d);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshList();
    api.health().then(setHealth).catch(() => {});
  }, [refreshList]);

  useEffect(() => {
    selectedRef.current = selected;
    refreshDetail(selected);
  }, [selected, refreshDetail]);

  // Live updates: every pipeline event triggers a (debounced) refresh.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastId = 0;
    let es: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    const connect = () => {
      es = new EventSource(`${API_URL}/api/events?after=${lastId || 1e12}`);
      // After a reconnect (e.g. API restart) events may have been missed: resync once.
      es.onopen = () => refreshList();
      es.onmessage = (msg) => {
        const ev = JSON.parse(msg.data);
        lastId = Math.max(lastId, ev.id);
        if (ev.type === "verdict") {
          setFresh((s) => new Set(s).add(ev.report_id));
        }
        if (ev.type === "demo_loaded" || ev.type === "reset") setFresh(new Set());
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          refreshList();
          if (!ev.report_id || ev.report_id === selectedRef.current) refreshDetail(selectedRef.current);
        }, 120);
      };
      es.onerror = () => {
        es?.close();
        retry = setTimeout(connect, 3000);
      };
    };
    connect();
    return () => {
      es?.close();
      if (timer) clearTimeout(timer);
      if (retry) clearTimeout(retry);
    };
  }, [refreshList, refreshDetail]);

  const loadDemo = async () => {
    setBusy(true);
    try {
      const { ids } = await api.loadDemo();
      setSelected(null);
      setDetail(null);
      await refreshList();
      api.health().then(setHealth).catch(() => {});
      return ids;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    await api.reset();
    setSelected(null);
    setDetail(null);
    refreshList();
  };

  const showCase = selected && detail && detail.id === selected;

  return (
    <div className="flex h-dvh flex-col">
      <header className="relative z-20 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-rule bg-[var(--header-bg)] px-4 py-2.5 backdrop-blur-xl sm:px-5">
        <div className="flex items-center gap-3">
          <Logo />
          <h1 className="text-[19px] leading-none font-bold tracking-[-0.04em]">Bouncer</h1>
          <span className="hidden font-mono text-[11.5px] text-ink-3 2xl:inline">tinyparse · fictional demo project</span>
        </div>
        <Status health={health} />
        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={() => setLimitsOpen(true)} className="btn btn-quiet hidden h-9 px-3 text-[13.5px] sm:inline-flex">
            Limitations
          </button>
          <ThemeToggle />
          {cards.length > 0 && (
            <button onClick={reset} className="btn btn-quiet h-9 px-3 text-[13.5px]" title="Clear the queue" aria-label="Clear the queue">
              <RotateCcw size={14} aria-hidden /> <span className="hidden sm:inline">Clear</span>
            </button>
          )}
          <button onClick={() => setSubmitOpen(true)} className="btn btn-ghost h-9 px-3 text-[13.5px]">
            Paste<span className="hidden sm:inline"> a report</span>
          </button>
          <button onClick={loadDemo} disabled={busy} className="btn btn-primary h-9 px-3.5 text-[13.5px]">
            {cards.length ? "Rerun" : "Run"} test reports
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="border-b border-false/30 bg-false-bg px-5 py-2 text-[13.5px] text-false">
          {error}
        </div>
      )}

      {cards.length > 0 && stats && <Tally stats={stats} />}

      <div className="flex min-h-0 flex-1">
        {cards.length > 0 && (
          <aside
            className={`${showCase ? "hidden lg:block" : "block"} w-full shrink-0 overflow-y-auto border-r border-rule scroll-thin lg:w-[420px]`}
          >
            <p className="sr-only" aria-live="polite">
              {stats ? `${stats.decided} of ${stats.total} reports decided` : ""}
            </p>
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <p className="eyebrow">Queue · proven bugs first</p>
              <p className="font-mono text-[11.5px] text-ink-3 tabular-nums">{cards.length} reports</p>
            </div>
            <Queue cards={cards} selected={selected} onSelect={setSelected} freshVerdicts={fresh} />
            <p className="px-4 py-4 text-[12px] leading-relaxed text-ink-3">
              The five bars are the pipeline stages; a hatched fourth bar means the report was settled by cheap checks and no sandbox was
              started.
            </p>
          </aside>
        )}
        <main className={`${cards.length > 0 && !showCase ? "hidden lg:block" : "block"} min-w-0 flex-1 overflow-y-auto scroll-thin`}>
          {showCase ? (
            <CaseFile
              key={detail.id}
              report={detail}
              health={health}
              onBack={() => setSelected(null)}
              onChanged={() => {
                refreshDetail(selected);
                refreshList();
              }}
            />
          ) : cards.length === 0 ? (
            loaded && <Intro onLoad={loadDemo} onPaste={() => setSubmitOpen(true)} busy={busy} />
          ) : (
            <Pick stats={stats} />
          )}
        </main>
      </div>

      <SubmitDialog open={submitOpen} onClose={() => setSubmitOpen(false)} onSubmitted={(id) => setSelected(id)} />
      <LimitationsDialog open={limitsOpen} onClose={() => setLimitsOpen(false)} />
    </div>
  );
}

function Logo() {
  return (
    <span aria-hidden className="relative grid h-7 w-7 place-items-center rounded-lg bg-ink text-paper">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z" />
        <path d="m8.5 12 2.5 2.5 4.5-5" />
      </svg>
    </span>
  );
}

function subscribeTheme(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
}

function ThemeToggle() {
  const light = useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.dataset.theme === "light",
    () => false,
  );
  const toggle = () => {
    const next = !light;
    if (next) document.documentElement.dataset.theme = "light";
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem("bouncer-theme", next ? "light" : "dark");
    } catch {}
  };
  return (
    <button
      onClick={toggle}
      className="btn btn-quiet h-9 w-9"
      aria-label={light ? "Switch to dark theme" : "Switch to light theme"}
      title={light ? "Dark theme" : "Light theme"}
    >
      {light ? <Moon size={16} aria-hidden /> : <Sun size={16} aria-hidden />}
    </button>
  );
}

function Status({ health }: { health: Health | null }) {
  if (!health) return null;
  const items = [
    {
      icon: <Cpu size={13} aria-hidden />,
      ok: health.models.live,
      text: health.models.live ? "Nemotron via Nebius Token Factory" : "Nemotron offline: rule-based fallbacks",
      title: health.models.live ? health.models.base_url : "Set NEBIUS_API_KEY to route model steps to Nemotron on Token Factory",
    },
    {
      icon: <Box size={13} aria-hidden />,
      ok: health.sandbox.ok,
      text: health.sandbox.ok ? "Sandbox ready, network off" : "Sandbox unavailable",
      title: health.sandbox.detail,
    },
    {
      icon: <Globe size={13} aria-hidden />,
      ok: health.tavily,
      text: health.tavily ? "Tavily search on" : "Tavily off, CVE Program API on",
      title: health.tavily ? "Web search for CVEs and advisories" : "Set TAVILY_API_KEY for web search; CVE IDs are still checked against the CVE Program",
    },
  ];
  return (
    <ul className="hidden items-center gap-2 text-[12px] md:flex">
      {items.map((i) => (
        <li
          key={i.text}
          title={i.title}
          className={`inline-flex items-center gap-1.5 rounded-full border border-rule px-2.5 py-1 ${i.ok ? "text-ink-2" : "text-ink-3"}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${i.ok ? "live-dot bg-ink text-ink" : "border border-ink-3"}`} />
          {i.icon}
          <span className="hidden xl:inline">{i.text}</span>
        </li>
      ))}
    </ul>
  );
}

function Tally({ stats }: { stats: Stats }) {
  const figs: [string, string, string?][] = [
    [`${stats.decided}/${stats.total}`, "reports decided"],
    [`${stats.by_verdict.reproduced}`, "proven real"],
    [`${stats.by_verdict.fabricated}`, "fabricated"],
    [`${stats.patches_ready}`, "fixes verified"],
    [`${stats.sandboxes_started}`, `sandboxes for ${stats.total} reports`],
  ];
  return (
    <div className="flex flex-wrap items-stretch gap-x-2 gap-y-2 border-b border-rule px-4 py-3 sm:px-5">
      <div className="grid flex-1 grid-cols-3 gap-x-4 gap-y-3 sm:flex sm:flex-wrap sm:items-end sm:gap-x-9">
        {figs.map(([n, label, title]) => (
          <div key={label} title={title} className="min-w-0">
            <p className="text-[22px] leading-none font-bold tracking-[-0.04em] tabular-nums sm:text-[28px]">{n}</p>
            <p className="mt-1.5 truncate text-[11.5px] text-ink-3 sm:text-[12px]">{label}</p>
          </div>
        ))}
      </div>
      <div
        title={stats.hours_assumption}
        className="relative flex w-full items-center gap-4 overflow-hidden rounded-xl border border-rule bg-sheet px-4 py-2.5 sm:w-auto"
      >
        <div aria-hidden className="pointer-events-none absolute -top-10 -left-10 h-28 w-28 rounded-full opacity-50 blur-2xl" style={{ background: "var(--glow-b)" }} />
        <div className="relative">
          <p className="grad-text text-[26px] leading-none font-bold tracking-[-0.04em] tabular-nums sm:text-[30px]">
            {stats.hours_saved.toFixed(0)} h
          </p>
          <p className="mt-1.5 text-[12px] text-ink-2">maintainer time saved</p>
        </div>
        <p className="relative hidden max-w-[30ch] text-[11.5px] leading-snug text-ink-3 lg:block">
          Assumes {stats.hours_assumption.replace(";", ", and")}
          {stats.in_progress > 0 && <span className="block text-ink-2">{stats.in_progress} still in progress</span>}
        </p>
      </div>
    </div>
  );
}

function Pick({ stats }: { stats: Stats | null }) {
  return (
    <div className="relative h-full overflow-hidden">
      <div aria-hidden className="hero-glow pointer-events-none absolute inset-0 opacity-60" />
      <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="relative mx-auto max-w-[620px] px-8 pt-24">
        <p className="eyebrow">Case file</p>
        <p className="display mt-3 text-[40px] sm:text-[52px]">Open a report to see its evidence.</p>
        <p className="mt-5 text-[15.5px] leading-relaxed text-ink-2">
          Each card shows what the report claims, every check Bouncer ran with the command to re-run it, the sandbox output, which model
          did which step, and for real bugs, the verified fix.
        </p>
        {stats && stats.in_progress > 0 && (
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-rule px-3 py-1.5 text-[13px] text-ink-2">
            <span className="seg-active h-1.5 w-1.5 rounded-full bg-ink-2" />
            {stats.in_progress} reports are still moving through the pipeline.
          </p>
        )}
      </div>
    </div>
  );
}
