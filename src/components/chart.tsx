"use client";
import type { Sample } from "@/context/dashboard";
import { useI18n } from "@/context/language";
import { number } from "./ui";
export function LineChart({
  samples,
  series,
  label,
  percent = false,
}: {
  samples: Sample[];
  series: { key: string; label: string; color: string }[];
  label: string;
  percent?: boolean;
}) {
  const { t, locale } = useI18n();
  const values = samples.flatMap((s) =>
    series.map((v) => s.metrics[v.key]).filter((v) => v !== undefined),
  );
  const maximum = Math.max(percent ? 100 : 1, ...values) * (percent ? 1 : 1.15);
  const start = samples[0]?.time ?? 0;
  const end = samples.at(-1)?.time ?? 1;
  const x = (time: number) =>
    58 + ((time - start) / Math.max(1, end - start)) * 842;
  const y = (value: number) => 190 - (value / maximum) * 160;
  return (
    <div className="chart">
      <div className="chart-legend">
        {series.map((s) => (
          <span key={s.key}>
            <i style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <svg viewBox="0 0 930 225" role="img" aria-label={label}>
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line
              x1="58"
              x2="900"
              y1={30 + i * 40}
              y2={30 + i * 40}
              stroke="var(--border)"
              strokeDasharray="3 5"
            />
            <text
              x="43"
              y={34 + i * 40}
              textAnchor="end"
              fill="var(--muted)"
              fontSize="10"
            >
              {number(maximum * (1 - i / 4))}
              {percent ? "%" : ""}
            </text>
          </g>
        ))}
        {samples.length > 1 &&
          series.map((s) => {
            const paths: string[] = [];
            let segment = "";
            for (const sample of samples) {
              const value = sample.metrics[s.key];
              if (value === undefined) {
                if (segment) paths.push(segment);
                segment = "";
              } else
                segment += `${segment ? " L" : "M"}${x(sample.time).toFixed(2)} ${y(value).toFixed(2)}`;
            }
            if (segment) paths.push(segment);
            return (
              <g key={s.key}>
                {paths.map((d) => (
                  <path
                    key={d}
                    d={d}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="2.4"
                    strokeLinejoin="round"
                  />
                ))}
              </g>
            );
          })}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <text
            key={f}
            x={58 + f * 842}
            y="217"
            textAnchor="middle"
            fill="var(--muted)"
            fontSize="10"
          >
            {start
              ? new Date(start + f * (end - start)).toLocaleTimeString(locale, {
                  hour12: false,
                })
              : "—"}
          </text>
        ))}
        {samples.length < 2 && (
          <text
            x="480"
            y="111"
            textAnchor="middle"
            fill="var(--muted)"
            fontSize="12"
          >
            {t("等待至少两个有效采样点…")}
          </text>
        )}
      </svg>
    </div>
  );
}
