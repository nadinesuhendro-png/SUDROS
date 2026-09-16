"use client";

import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Animated Counter                                                   */
/* ------------------------------------------------------------------ */
export function AnimatedCounter({
  value,
  duration = 1100,
}: {
  value: number;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{display.toLocaleString("id-ID")}</>;
}

/* ------------------------------------------------------------------ */
/*  Progress Ring                                                      */
/* ------------------------------------------------------------------ */
export function ProgressRing({
  value,
  max,
  size = 96,
  stroke = 9,
  color = "#38bdf8",
  label,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
}) {
  const [progress, setProgress] = useState(0);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;

  useEffect(() => {
    const t = setTimeout(() => setProgress(pct), 150);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * progress} ${c}`}
          className="transition-[stroke-dasharray] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-white tabular-nums leading-none">
          {Math.round(pct * 100)}%
        </span>
        {label && <span className="text-[10px] text-slate-400 mt-0.5">{label}</span>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Interactive Engagement Donut                                       */
/* ------------------------------------------------------------------ */
type Segment = { label: string; value: number; color: string };

export function EngagementDonut({ segments }: { segments: Segment[] }) {
  const [active, setActive] = useState<number | null>(null);
  const total = segments.reduce((s, x) => s + x.value, 0);

  const size = 200;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gap = segments.filter((s) => s.value > 0).length > 1 ? 6 : 0;

  let offset = 0;
  const arcs = segments.map((seg, i) => {
    const frac = total > 0 ? seg.value / total : 0;
    const dash = Math.max(0, frac * c - gap);
    const arc = { ...seg, dash, offset, i, frac };
    offset += frac * c;
    return arc;
  });

  const activeSeg = active !== null ? arcs[active] : null;

  return (
    <div className="flex flex-col md:flex-row items-center gap-8">
      {/* Donut */}
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={stroke}
          />
          {arcs.map((arc) => (
            <circle
              key={arc.i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth={active === arc.i ? stroke + 5 : stroke}
              strokeDasharray={`${arc.dash} ${c - arc.dash}`}
              strokeDashoffset={-arc.offset}
              strokeLinecap="round"
              onMouseEnter={() => setActive(arc.i)}
              onMouseLeave={() => setActive(null)}
              className="cursor-pointer transition-all duration-300 ease-out"
              style={{ opacity: active === null || active === arc.i ? 1 : 0.25 }}
            />
          ))}
        </svg>

        {/* Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-6 text-center">
          {activeSeg ? (
            <>
              <span className="text-3xl font-bold text-white tabular-nums">
                {Math.round(activeSeg.frac * 100)}%
              </span>
              <span className="text-xs text-slate-400 mt-1 leading-tight">
                {activeSeg.label}
              </span>
            </>
          ) : (
            <>
              <span className="text-3xl font-bold text-white tabular-nums">
                {total.toLocaleString("id-ID")}
              </span>
              <span className="text-xs text-slate-400 mt-1">Total Interaksi</span>
            </>
          )}
        </div>
      </div>

      {/* Legend / detail */}
      <div className="flex-1 w-full space-y-2">
        {arcs.map((arc) => {
          const isActive = active === arc.i;
          return (
            <button
              key={arc.i}
              type="button"
              onMouseEnter={() => setActive(arc.i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(arc.i)}
              onBlur={() => setActive(null)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200 text-left outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 ${
                isActive
                  ? "bg-white/[0.08] border-white/20 translate-x-1"
                  : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform duration-200"
                style={{
                  background: arc.color,
                  transform: isActive ? "scale(1.4)" : "scale(1)",
                }}
              />
              <span className="text-sm text-slate-300 flex-1 truncate">{arc.label}</span>
              <span className="text-sm font-semibold text-white tabular-nums">
                {arc.value.toLocaleString("id-ID")}
              </span>
              <span className="text-xs text-slate-500 tabular-nums w-10 text-right">
                {total > 0 ? Math.round(arc.frac * 100) : 0}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mini Sparkline                                                     */
/* ------------------------------------------------------------------ */
export function Sparkline({
  data,
  color = "#38bdf8",
  height = 40,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  if (data.length < 2) data = [0, 0];

  const width = 160;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return { x, y, v };
  });

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${path} L${width},${height} L0,${height} Z`;
  const id = `spark-${color.replace("#", "")}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ height }}
      onMouseLeave={() => setHover(null)}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {hover !== null && (
        <circle
          cx={points[hover].x}
          cy={points[hover].y}
          r="4"
          fill={color}
          stroke="#0a0e1a"
          strokeWidth="2"
        />
      )}
      {points.map((p, i) => (
        <rect
          key={i}
          x={p.x - 8}
          y={0}
          width={16}
          height={height}
          fill="transparent"
          onMouseEnter={() => setHover(i)}
        />
      ))}
    </svg>
  );
  }
