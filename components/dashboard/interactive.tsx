"use client";

import { useEffect, useRef, useState } from "react";

/* ============================================================
 * AnimatedCounter
 * Angka yang berhitung naik (count-up) saat pertama render
 * ============================================================ */
type AnimatedCounterProps = {
  value: number;
  duration?: number; // ms
  decimals?: number;
  locale?: string;
  className?: string;
};

export function AnimatedCounter({
  value,
  duration = 1200,
  decimals = 0,
  locale = "id-ID",
  className,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    // Hormati preferensi pengguna yang mengurangi animasi
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      setDisplay(value);
      return;
    }

    const from = 0;
    const to = value;
    startRef.current = null;

    const step = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplay(from + (to - from) * eased);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplay(to);
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  const formatted = display.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return <span className={className}>{formatted}</span>;
}

/* ============================================================
 * ProgressRing
 * Cincin progress melingkar (mis. untuk kuota listing)
 * ============================================================ */
type ProgressRingProps = {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  className?: string;
};

export function ProgressRing({
  value,
  max,
  size = 104,
  stroke = 10,
  color = "#ffffff",
  trackColor = "rgba(255,255,255,0.2)",
  label,
  className,
}: ProgressRingProps) {
  const center = size / 2;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const safeMax = max > 0 ? max : 1;
  const ratio = Math.min(Math.max(value / safeMax, 0), 1);
  const dashOffset = circumference * (1 - ratio);
  const percent = Math.round(ratio * 100);

  return (
    <div
      className={["relative inline-flex items-center justify-center", className]
        .filter(Boolean)
        .join(" ")}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${value} dari ${max} ${label ?? ""} (${percent}%)`.trim()}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        {/* Progress */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-lg font-bold tabular-nums text-white">
          {value}
        </span>
        <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-white/70">
          {label ?? `${percent}%`}
        </span>
      </div>
    </div>
  );
}

/* ============================================================
 * EngagementDonut
 * Diagram donat interaktif (hover → highlight + tooltip tengah)
 * ============================================================ */
export type EngagementSegment = {
  label: string;
  value: number;
  color: string;
};

type EngagementDonutProps = {
  segments: EngagementSegment[];
  size?: number;
  stroke?: number;
  className?: string;
};

export function EngagementDonut({
  segments,
  size = 220,
  stroke = 26,
  className,
}: EngagementDonutProps) {
  const [active, setActive] = useState<number | null>(null);

  const total = segments.reduce((sum, seg) => sum + (seg.value || 0), 0);

  const center = size / 2;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  /* ---------- Empty state ---------- */
  if (total <= 0) {
    return (
      <div className={["flex justify-center", className].filter(Boolean).join(" ")}>
        <div
          className="relative flex items-center justify-center rounded-full border-2 border-dashed border-white/10"
          style={{ width: size, height: size }}
        >
          <div className="px-6 text-center">
            <p className="text-sm font-medium text-slate-400">Belum ada data</p>
            <p className="mt-1 text-xs text-slate-600">
              Interaksi akan muncul di sini
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Hitung arc per segmen ---------- */
  const visible = segments.filter((seg) => seg.value > 0);

  let cumulative = 0;
  const arcs = visible.map((seg, index) => {
    const fraction = seg.value / total;
    const dash = fraction * circumference;
    const offset = -cumulative * circumference;
    cumulative += fraction;

    return {
      ...seg,
      index,
      fraction,
      dash,
      offset,
    };
  });

  const activeArc = active !== null ? arcs[active] : null;

  return (
    <div
      className={[
        "flex flex-col items-center gap-6 sm:flex-row sm:gap-8",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* ---------- Donut ---------- */}
      <div
        className="relative flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          role="img"
          aria-label="Diagram interaksi listing"
        >
          {/* Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={stroke}
          />

          {/* Segmen */}
          {arcs.map((arc) => {
            const isActive = active === arc.index;
            const dimmed = active !== null && !isActive;

            return (
              <circle
                key={arc.label}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={arc.color}
                strokeWidth={isActive ? stroke + 6 : stroke}
                strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
                strokeDashoffset={arc.offset}
                strokeLinecap="butt"
                className="cursor-pointer transition-all duration-300 ease-out"
                style={{ opacity: dimmed ? 0.3 : 1 }}
                onMouseEnter={() => setActive(arc.index)}
                onMouseLeave={() => setActive(null)}
              />
            );
          })}
        </svg>

        {/* ---------- Label tengah ---------- */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold tabular-nums tracking-tight text-white">
            {(activeArc ? activeArc.value : total).toLocaleString("id-ID")}
          </span>
          <span className="mt-0.5 max-w-[70%] truncate text-[11px] font-medium uppercase tracking-wider text-slate-400">
            {activeArc ? activeArc.label : "Total Interaksi"}
          </span>
          {activeArc && (
            <span className="mt-1 text-[10px] font-semibold tabular-nums text-slate-500">
              {(activeArc.fraction * 100).toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      {/* ---------- Legend ---------- */}
      <ul className="w-full space-y-2 sm:flex-1">
        {arcs.map((arc) => {
          const isActive = active === arc.index;

          return (
            <li
              key={arc.label}
              onMouseEnter={() => setActive(arc.index)}
              onMouseLeave={() => setActive(null)}
              className={[
                "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-200",
                isActive
                  ? "border-white/[0.12] bg-white/[0.06]"
                  : "border-transparent bg-white/[0.015] hover:bg-white/[0.04]",
              ].join(" ")}
            >
              <span
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full ring-4 ring-white/[0.04]"
                style={{ backgroundColor: arc.color }}
              />
              <span className="flex-1 truncate text-sm text-slate-300">
                {arc.label}
              </span>
              <span className="text-sm font-semibold tabular-nums text-white">
                {arc.value.toLocaleString("id-ID")}
              </span>
              <span className="w-12 text-right text-xs font-medium tabular-nums text-slate-500">
                {(arc.fraction * 100).toFixed(1)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
  }
