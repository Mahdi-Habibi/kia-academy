'use client';

import { EXAM_DOMAINS } from '@pathwise/shared';
import { useLanguage } from '@/context/LanguageProvider';

interface RadarChartProps {
  percentages: Record<string, number>;
  domains?: readonly string[];
}

export function RadarChart({ percentages, domains = EXAM_DOMAINS }: RadarChartProps) {
  const { t, locale } = useLanguage();
  const modules = domains;
  const cx = 150;
  const cy = 150;
  const r = 110;
  const n = modules.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, scale: number) => {
    const a = angle(i);
    return [cx + Math.cos(a) * r * scale, cy + Math.sin(a) * r * scale];
  };

  const fontFamily =
    locale === 'fa' ? 'var(--font-noto-arabic), Vazirmatn, sans-serif' : 'var(--font-display), sans-serif';

  const gridPolygons = [0.25, 0.5, 0.75, 1].map((scale) => {
    const pts = modules.map((_, i) => point(i, scale).join(',')).join(' ');
    return <polygon key={scale} points={pts} fill="none" stroke="var(--border)" strokeWidth={1} />;
  });

  const axes = modules.map((_, i) => {
    const [x, y] = point(i, 1);
    return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth={1} />;
  });

  const dataPts = modules.map((m, i) => point(i, (percentages[m] ?? 0) / 100).join(',')).join(' ');

  const dots = modules.map((m, i) => {
    const [x, y] = point(i, (percentages[m] ?? 0) / 100);
    const [lx, ly] = point(i, 1.28);
    const label = t(`exam.domains.${m}` as 'exam.domains.digitalOps');
    const shortLabel = label.split(/[\s/&]+/)[0] ?? label;
    return (
      <g key={m}>
        <circle cx={x} cy={y} r={4} fill="var(--indigo-bright)" />
        <text
          x={lx}
          y={ly}
          fill="var(--text-dim)"
          fontSize={10}
          fontFamily={fontFamily}
          textAnchor="middle"
        >
          {shortLabel}
        </text>
      </g>
    );
  });

  return (
    <svg viewBox="0 0 300 300" width="100%" height={300}>
      {gridPolygons}
      {axes}
      <polygon
        points={dataPts}
        fill="var(--indigo-bright)"
        fillOpacity={0.35}
        stroke="var(--indigo-bright)"
        strokeWidth={2}
      />
      {dots}
    </svg>
  );
}
