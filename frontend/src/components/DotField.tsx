"use client";

import { useEffect, useRef } from "react";

/**
 * Decorative dot grid behind the hero. The grid sits still; a soft spotlight follows the cursor
 * and reveals the dots under it a little more clearly. No dot moves, so it stays out of the way.
 */
export function DotField({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    const apply = () => {
      raf = 0;
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      x = e.clientX - r.left;
      y = e.clientY - r.top;
      el.dataset.active = e.clientY >= r.top && e.clientY <= r.bottom ? "1" : "0";
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => (el.dataset.active = "0");
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden data-active="0" className={`dot-field pointer-events-none ${className}`}>
      <div className="dot-grid absolute inset-0" />
      <div className="dot-field-spot absolute inset-0" />
    </div>
  );
}
