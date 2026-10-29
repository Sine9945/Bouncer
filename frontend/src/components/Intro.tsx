"use client";

import { ArrowRight, ClipboardPaste, FileSearch, GitCompareArrows, Globe, Scale, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import type { VerdictKey } from "@/lib/api";
import { DotField } from "./DotField";
import { Stamp } from "./ui";

/** Illustrative preview: the ten bundled test reports and the verdict each is designed to get. */
const PREVIEW: { id: string; title: string; verdict: VerdictKey; note?: string }[] = [
  { id: "T01", title: "Heap buffer over-read in tp_url_decode() when input ends with '%'", verdict: "reproduced", note: "crashes under ASan" },
  { id: "T09", title: "Path traversal when tp_url_decode() is used behind a reverse proxy", verdict: "needs_human" },
  { id: "T02", title: "URL decoder reads past end of buffer when query string ends in a percent sign", verdict: "duplicate" },
  { id: "T03", title: "Stack buffer overflow in tp_ini_parse() with long keys", verdict: "already_fixed" },
  { id: "T04", title: "CRITICAL: Heap overflow in url_decode_safe() in parser.c line 412 (CVSS 9.8)", verdict: "fabricated", note: "file and function do not exist" },
  { id: "T05", title: "tinyparse vulnerable to CVE-2026-9381742 (INI parser RCE)", verdict: "fabricated", note: "CVE ID does not exist" },
];

const STEPS = [
  { icon: FileSearch, t: "Extract the claims", d: "Version, files, functions, line numbers, quoted code, CVE IDs and steps, as a checkable list." },
  { icon: GitCompareArrows, t: "Check them against the code", d: "git grep across every release, exact match of quoted code, git log -S for fixes." },
  { icon: Globe, t: "Check the outside world", d: "Is the CVE real? Was this already reported? Fakes usually stop here, before any sandbox starts." },
  { icon: ShieldCheck, t: "Reproduce in a sandbox", d: "Build the claimed version with AddressSanitizer, run the steps three times with no network." },
  { icon: Scale, t: "Decide and explain", d: "Rules pick the verdict from the evidence; Nemotron explains it and drafts a reply. Nothing is auto-closed." },
];

const MODELS = [
  { name: "Nemotron 3 Nano", job: "Claim extraction, duplicate comparison, failure summaries", why: "Runs on every report: fast and cheap" },
  { name: "Nemotron 3 Super", job: "Reproduction scripts, patches and regression tests", why: "Everyday coding, retried in a loop" },
  { name: "Nemotron 3 Ultra", job: "Root cause from crash + code, judgement-call explanations", why: "Serious reasoning across code and logs" },
];

export function Intro({ onLoad, onPaste, busy }: { onLoad: () => void; onPaste: () => void; busy: boolean }) {
  const reduce = useReducedMotion();
  const rise: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 18 },
    show: (i: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: reduce ? 0 : i * 0.08, ease: [0.2, 0.8, 0.2, 1] } }),
  };

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[820px]" />
      <DotField className="absolute inset-x-0 top-0 h-[820px] w-full [mask-image:linear-gradient(to_bottom,black_55%,transparent)]" />

      {/* Hero */}
      <section className="relative mx-auto max-w-[1100px] px-4 pt-16 text-center sm:px-8 sm:pt-24">
        <motion.p
          variants={rise}
          initial="hidden"
          animate="show"
          className="eyebrow mx-auto inline-flex items-center gap-2 rounded-full border border-rule-strong bg-sheet/60 px-3 py-1.5 backdrop-blur"
        >
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-proof text-proof" />
          Nemotron on Nebius Token Factory
        </motion.p>

        <motion.h2
          variants={rise}
          initial="hidden"
          animate="show"
          custom={1}
          className="display mx-auto mt-6 max-w-[14ch] text-[48px] text-balance sm:text-[76px] lg:text-[92px]"
        >
          <span className="grad-text">Real bugs</span> get in. Fake reports don&apos;t.
        </motion.h2>

        <motion.p
          variants={rise}
          initial="hidden"
          animate="show"
          custom={2}
          className="mx-auto mt-6 max-w-[60ch] text-[16px] leading-relaxed text-ink-2 sm:text-[18px]"
        >
          A fake security report takes seconds to write and an hour to disprove. Bouncer checks every claim against the real code, runs
          the proof in a locked-down sandbox, and drafts a verified fix for the bugs that are real. Every verdict ships with its evidence.
        </motion.p>

        <motion.div variants={rise} initial="hidden" animate="show" custom={3} className="mt-8 flex flex-wrap justify-center gap-3">
          <button onClick={onLoad} disabled={busy} className="btn btn-primary h-12 px-5 text-[15px]">
            {busy ? "Loading test reports…" : "Run 10 test reports"}
            {!busy && <ArrowRight size={16} aria-hidden />}
          </button>
          <button onClick={onPaste} className="btn btn-ghost h-12 px-5 text-[15px]">
            <ClipboardPaste size={16} aria-hidden /> Paste your own report
          </button>
        </motion.div>
        <motion.p variants={rise} initial="hidden" animate="show" custom={4} className="mt-4 text-[13px] text-ink-3">
          The test reports target tinyparse, a fictional C library made for this demo, with two planted bugs and three releases.
        </motion.p>

        {/* Product frame */}
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 40, scale: reduce ? 1 : 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: reduce ? 0 : 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          className="frame-glow relative mx-auto mt-14 max-w-[920px] overflow-hidden rounded-2xl bg-sheet text-left"
        >
          <div className="flex items-center gap-3 border-b border-rule px-4 py-3">
            <span className="flex gap-1.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-rule-strong" />
              <span className="h-2.5 w-2.5 rounded-full bg-rule-strong" />
              <span className="h-2.5 w-2.5 rounded-full bg-rule-strong" />
            </span>
            <span className="font-mono text-[12px] text-ink-3">report queue · tinyparse</span>
            <span className="eyebrow ml-auto hidden sm:inline">Preview · sorted, proven bugs first</span>
          </div>
          <ol aria-label="Preview of the test report queue">
            {PREVIEW.map((r, i) => (
              <motion.li
                key={r.id}
                initial={{ opacity: 0, x: reduce ? 0 : -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: reduce ? 0 : 0.8 + i * 0.09, ease: [0.2, 0.8, 0.2, 1] }}
                className="flex items-center gap-4 border-b border-rule px-4 py-3 last:border-b-0 sm:px-5"
              >
                <span className="hidden w-9 shrink-0 font-mono text-[12px] text-ink-3 sm:block">{r.id}</span>
                <span className="min-w-0 flex-1 truncate text-[14px] text-ink">{r.title}</span>
                {r.note && <span className="hidden shrink-0 text-[12px] text-ink-3 md:inline">{r.note}</span>}
                <span className="shrink-0">
                  <Stamp verdict={r.verdict} />
                </span>
              </motion.li>
            ))}
          </ol>
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-sheet to-transparent" />
        </motion.div>
      </section>

      {/* Pipeline */}
      <section className="relative mx-auto max-w-[1100px] px-4 pt-24 sm:px-8">
        <p className="eyebrow">How a report gets checked</p>
        <h3 className="display mt-3 max-w-[20ch] text-[34px] sm:text-[48px]">Evidence first. Sandbox only when it matters.</h3>
        <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map(({ icon: Icon, t, d }, i) => (
            <motion.li
              key={t}
              initial={{ opacity: 0, y: reduce ? 0 : 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: reduce ? 0 : i * 0.06, ease: [0.2, 0.8, 0.2, 1] }}
              className="panel p-5"
            >
              <div className="flex items-center justify-between">
                <Icon size={18} className="text-ink-2" aria-hidden />
                <span className="font-mono text-[12px] text-ink-3">0{i + 1}</span>
              </div>
              <p className="mt-6 text-[15px] font-semibold tracking-tight">{t}</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{d}</p>
            </motion.li>
          ))}
        </ol>
        <p className="mt-6 max-w-[80ch] text-[14px] leading-relaxed text-ink-2">
          Bugs that reproduce go on to the fix loop. A patch is kept only if the crash is gone, every existing test passes, the change is
          small, and a new regression test fails on the old code. It then lands in a private advisory, never a public pull request.
        </p>
      </section>

      {/* Models */}
      <section className="relative mx-auto max-w-[1100px] px-4 pt-24 pb-24 sm:px-8">
        <p className="eyebrow">Three models, three jobs</p>
        <h3 className="display mt-3 max-w-[22ch] text-[34px] sm:text-[48px]">Models explain. Rules decide.</h3>
        <p className="mt-4 max-w-[62ch] text-[15px] leading-relaxed text-ink-2">
          Every model call goes to Nebius Token Factory. The verdict itself is computed by rules from git, CVE and sandbox evidence, so a
          prompt injection in a report cannot change it.
        </p>
        <ul className="mt-10 grid gap-3 md:grid-cols-3">
          {MODELS.map((m) => (
            <li key={m.name} className="panel relative overflow-hidden p-6">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-40 blur-3xl"
                style={{ background: "var(--glow-a)" }}
              />
              <p className="relative font-mono text-[12px] text-ink-3">{m.why}</p>
              <p className="relative mt-5 text-[22px] font-semibold tracking-tight">{m.name}</p>
              <p className="relative mt-2 text-[14px] leading-relaxed text-ink-2">{m.job}.</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
