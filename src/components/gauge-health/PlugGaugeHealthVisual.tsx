import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface PlugGaugeHealthVisualProps {
  goWearPercent: number
  goRemainingLifePercent: number
  estimatedRemainingYears: number
  status: "healthy" | "warning" | "critical" | "rejected"
  measuredValueMm: number
  standardSizeMm: number
  wearLimitMm: number
  wearDirection: "increasing" | "decreasing"
}

const statusStyles = {
  healthy: {
    accent: "#16a34a",
    soft: "text-emerald-700",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  warning: {
    accent: "#d97706",
    soft: "text-amber-700",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  critical: {
    accent: "#dc2626",
    soft: "text-rose-700",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
  },
  rejected: {
    accent: "#991b1b",
    soft: "text-red-800",
    badge: "bg-red-50 text-red-700 border-red-200",
  },
} as const

function clampPercent(value: number) {
  return Math.min(Math.max(value, 0), 100)
}

function formatMetric(value: number, digits = 2) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function PlugGaugeHealthVisual({
  goWearPercent,
  goRemainingLifePercent,
  estimatedRemainingYears,
  status,
  measuredValueMm,
  standardSizeMm,
  wearLimitMm,
  wearDirection,
}: PlugGaugeHealthVisualProps) {
  const visualStatus = statusStyles[status]
  const wearPercent = clampPercent(goWearPercent)
  const remainingPercent = clampPercent(goRemainingLifePercent)

  const trackInnerX = 266
  const trackOuterX = 92
  const markerStartX = wearDirection === "decreasing" ? trackInnerX : trackOuterX
  const markerEndX = wearDirection === "decreasing" ? trackOuterX : trackInnerX
  const markerTravel = markerStartX + (markerEndX - markerStartX) * (wearPercent / 100)
  const wearLimitMarkerX = markerEndX
  const isStableLabel = estimatedRemainingYears <= 0 && wearPercent === 0
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1)
  const wearTrendLabel = wearDirection === "decreasing" ? "↘ Decreasing" : "↗ Increasing"

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      className="rounded-[30px] border border-border/70 bg-background/90 p-5 shadow-sm backdrop-blur"
    >
      <div className="overflow-hidden rounded-[24px] border border-border/60 bg-gradient-to-br from-slate-50 to-white p-4">
        <svg viewBox="0 0 920 310" className="w-full">
          <defs>
            <linearGradient id="plug-silver-main" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="20%" stopColor="#e2e8f0" />
              <stop offset="45%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
            <linearGradient id="plug-silver-cap" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
            <linearGradient id="handle-black" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="50%" stopColor="#111827" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <linearGradient id="go-band" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#16a34a" />
              <stop offset="100%" stopColor="#4ade80" />
            </linearGradient>
            <linearGradient id="nogo-band" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
            <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.14" />
            </filter>
          </defs>

          <text x="160" y="32" className="fill-slate-700 text-[18px] font-semibold tracking-[0.18em]">
            GO
          </text>
          <text x="410" y="32" className="fill-slate-700 text-[16px] font-semibold tracking-[0.18em]">
            BASIC SIZE
          </text>
          <text x="714" y="32" className="fill-slate-700 text-[18px] font-semibold tracking-[0.18em]">
            NOGO
          </text>

          <g filter="url(#soft-shadow)">
            <rect x="88" y="110" width="210" height="52" rx="24" fill="url(#plug-silver-main)" stroke="#94a3b8" />
            <rect x="112" y="120" width="18" height="32" rx="6" fill="url(#go-band)" />
            <rect x="280" y="112" width="26" height="48" rx="12" fill="url(#plug-silver-cap)" />

            <rect x="298" y="94" width="324" height="84" rx="22" fill="url(#handle-black)" />
            <rect x="340" y="106" width="240" height="60" rx="16" fill="rgba(255,255,255,0.06)" />
            <line x1="360" y1="116" x2="360" y2="156" stroke="rgba(255,255,255,0.07)" strokeWidth="8" strokeLinecap="round" />
            <line x1="560" y1="116" x2="560" y2="156" stroke="rgba(255,255,255,0.07)" strokeWidth="8" strokeLinecap="round" />

            <rect x="620" y="110" width="212" height="52" rx="24" fill="url(#plug-silver-main)" stroke="#94a3b8" />
            <rect x="806" y="120" width="18" height="32" rx="6" fill="url(#nogo-band)" />
            <rect x="612" y="112" width="26" height="48" rx="12" fill="url(#plug-silver-cap)" />
          </g>

          <text x="430" y="87" className="fill-slate-500 text-[14px] tracking-[0.18em]">
            {formatMetric(standardSizeMm, 4)} mm
          </text>

          <g>
            <line x1="86" y1="76" x2="284" y2="76" stroke="#cbd5e1" strokeWidth="8" strokeLinecap="round" />
            <line x1="86" y1="76" x2="152" y2="76" stroke="#22c55e" strokeWidth="8" strokeLinecap="round" />
            <line x1="152" y1="76" x2="220" y2="76" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round" />
            <line x1="220" y1="76" x2="284" y2="76" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" />

            <motion.g
              initial={false}
              animate={{ x: markerTravel }}
              transition={{ type: "spring", stiffness: 85, damping: 18 }}
            >
              <line x1="0" y1="58" x2="0" y2="94" stroke={visualStatus.accent} strokeWidth="3" strokeLinecap="round" />
              <circle cx="0" cy="76" r="8" fill={visualStatus.accent} stroke="white" strokeWidth="3" />
            </motion.g>

            <g transform={`translate(${wearLimitMarkerX}, 0)`}>
              <line x1="0" y1="54" x2="0" y2="98" stroke="#b91c1c" strokeWidth="3" strokeDasharray="5 4" />
              <polygon points="-7,52 7,52 0,40" fill="#b91c1c" />
            </g>

            <text x="86" y="54" className="fill-slate-500 text-[12px] tracking-[0.14em]">
              GO wear travel
            </text>
          </g>

          <g>
            <line x1="812" y1="76" x2="812" y2="104" stroke="#ef4444" strokeWidth="3" />
            <text x="662" y="62" className="fill-slate-500 text-[13px] tracking-[0.14em]">
              Tolerance / Wear Limit
            </text>
            <text x="662" y="82" className="fill-slate-700 text-[14px] font-semibold">
              {formatMetric(wearLimitMm, 4)} mm
            </text>
          </g>

          <text x="404" y="210" className="fill-slate-900 text-[24px] font-semibold tracking-[0.16em]">
            Plug Gauge
          </text>

          <g>
            <rect x="74" y="236" width="772" height="12" rx="6" fill="#e2e8f0" />
            <rect x="74" y="236" width="257" height="12" rx="6" fill="#22c55e" />
            <rect x="331" y="236" width="257" height="12" rx="6" fill="#f59e0b" />
            <rect x="588" y="236" width="258" height="12" rx="6" fill="#ef4444" />
            <motion.rect
              x="74"
              y="236"
              height="12"
              rx="6"
              fill={visualStatus.accent}
              initial={{ width: 0 }}
              animate={{ width: 772 * (remainingPercent / 100) }}
              transition={{ duration: 0.75, ease: "easeOut" }}
            />
          </g>
        </svg>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border/70 bg-white/80 p-4 shadow-sm">
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">GO Life %</div>
            <div className="mt-2 text-2xl font-semibold text-emerald-700">{formatMetric(remainingPercent, 1)}%</div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-white/80 p-4 shadow-sm">
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Wear Used %</div>
            <div className="mt-2 text-2xl font-semibold text-amber-700">{formatMetric(wearPercent, 1)}%</div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-white/80 p-4 shadow-sm">
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Remaining Years</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {isStableLabel ? "Stable" : `${formatMetric(estimatedRemainingYears, 2)} yrs`}
            </div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-white/80 p-4 shadow-sm">
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Status</div>
            <div
              className={cn(
                "mt-2 inline-flex rounded-full border px-3 py-1 text-sm font-semibold",
                visualStatus.badge
              )}
            >
              {statusLabel}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-white/70 px-4 py-3 text-sm text-muted-foreground">
          <div>Wear Trend: <span className="font-semibold text-foreground">{wearTrendLabel}</span></div>
          <div>Measured: <span className="font-semibold text-foreground">{formatMetric(measuredValueMm, 4)} mm</span></div>
          <div>Standard: <span className="font-semibold text-foreground">{formatMetric(standardSizeMm, 4)} mm</span></div>
          <div>Wear Limit: <span className="font-semibold text-foreground">{formatMetric(wearLimitMm, 4)} mm</span></div>
        </div>
      </div>
    </motion.div>
  )
}
