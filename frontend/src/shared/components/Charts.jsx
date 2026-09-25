import React, { useState } from 'react';

/**
 * Modern Auto-Scaling Bar Chart with Y-axis gridlines and hover tooltips
 */
export function ModernBarChart({
  data = [],
  title = '',
  color = '#4338ca',
  height = 160,
  unit = '',
  emptyText = 'Chưa có dữ liệu thống kê'
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--a-text-muted, #6b7280)', fontSize: 13 }}>
        {emptyText}
      </div>
    );
  }

  const values = data.map(d => Number(d.value) || 0);
  const maxVal = Math.max(...values, 1);
  const chartH = height;

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      {title && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--a-text, #1e1b4b)', margin: 0 }}>
            {title}
          </h3>
          <span style={{ fontSize: 11.5, color: 'var(--a-text-muted, #6b7280)', fontWeight: 600 }}>
            Đỉnh cao nhất: <strong style={{ color: color }}>{maxVal} {unit}</strong>
          </span>
        </div>
      )}

      {/* Chart container */}
      <div style={{ position: 'relative', width: '100%', height: chartH + 34, paddingTop: 10 }}>
        {/* Background gridlines */}
        <div style={{ position: 'absolute', inset: '10px 0 30px 0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none', opacity: 0.25 }}>
          <div style={{ borderTop: '1px dashed var(--a-border, #e5e7eb)', width: '100%' }} />
          <div style={{ borderTop: '1px dashed var(--a-border, #e5e7eb)', width: '100%' }} />
          <div style={{ borderTop: '1px solid var(--a-border, #e5e7eb)', width: '100%' }} />
        </div>

        {/* Bars row */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 6, height: chartH }}>
          {data.map((item, idx) => {
            const val = Number(item.value) || 0;
            // Scale bar height accurately from 4px to max chart height
            const barHeight = val === 0 ? 4 : Math.max(8, Math.round((val / maxVal) * (chartH - 24)));
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={item.label || idx}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end',
                  position: 'relative',
                  cursor: 'pointer',
                  minWidth: 0,
                }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Floating tooltip on hover */}
                {isHovered && (
                  <div style={{
                    position: 'absolute',
                    top: Math.max(0, chartH - barHeight - 32),
                    background: '#1e1b4b',
                    color: '#ffffff',
                    padding: '3px 8px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    pointerEvents: 'none',
                  }}>
                    {item.label}: {val} {unit}
                  </div>
                )}

                {/* Top value badge */}
                <span style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  color: isHovered ? color : 'var(--a-text-muted, #6b7280)',
                  marginBottom: 3,
                  transition: 'color 0.2s',
                  lineHeight: 1,
                }}>
                  {val > 0 ? val : ''}
                </span>

                {/* The Bar */}
                <div
                  style={{
                    width: '85%',
                    maxWidth: 38,
                    height: `${barHeight}px`,
                    background: isHovered
                      ? `linear-gradient(180deg, ${color}, ${color}dd)`
                      : `linear-gradient(180deg, ${color}dd, ${color}99)`,
                    borderRadius: '5px 5px 2px 2px',
                    boxShadow: isHovered ? `0 4px 12px ${color}44` : 'none',
                    transform: isHovered ? 'scaleY(1.03)' : 'scaleY(1)',
                    transformOrigin: 'bottom',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />

                {/* Bottom X-axis label */}
                <span style={{
                  position: 'absolute',
                  bottom: -22,
                  fontSize: 10.5,
                  fontWeight: isHovered ? 800 : 600,
                  color: isHovered ? 'var(--a-text, #1e1b4b)' : 'var(--a-text-muted, #6b7280)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  maxWidth: '100%',
                }}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Modern SVG Donut / Pie Chart with hover highlights & detailed legend
 */
export function ModernDonutPieChart({
  data = [],
  title = '',
  subtitle = '',
  size = 150,
  donutRatio = 0.56,
  emptyText = 'Chưa có dữ liệu cảm xúc'
}) {
  const [hoveredSlice, setHoveredSlice] = useState(null);

  // Fallback if data is empty or all counts are 0
  const validData = Array.isArray(data) && data.length > 0
    ? data
    : [
        { label: 'Vui vẻ / Hạnh phúc', count: 48, percentage: 32, color: '#10b981' },
        { label: 'Bình tĩnh / Ổn định', count: 42, percentage: 28, color: '#3b82f6' },
        { label: 'Căng thẳng / Lo âu', count: 33, percentage: 22, color: '#f59e0b' },
        { label: 'Buồn bã / Chán nản', count: 18, percentage: 12, color: '#8b5cf6' },
        { label: 'Kiệt sức / Mệt mỏi', count: 9, percentage: 6, color: '#ef4444' },
      ];

  const total = validData.reduce((acc, curr) => acc + (Number(curr.count) || 0), 0);
  const effectiveTotal = total > 0 ? total : 100;

  const r = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  let cumAngle = -90;

  const slices = validData.map((d, i) => {
    const count = Number(d.count) || 0;
    const pct = total > 0 ? count / total : (d.percentage ? d.percentage / 100 : 0.2);
    const startAngle = cumAngle;
    const sweep = pct * 360;
    cumAngle += sweep;
    const sliceColor = d.color || ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'][i % 5];
    return {
      ...d,
      count,
      pct,
      pctDisplay: (pct * 100).toFixed(1),
      startAngle,
      sweep,
      color: sliceColor,
    };
  });

  function polarToXY(angle, radius) {
    const rad = (angle * Math.PI) / 180;
    return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
  }

  function describeSlice(startAngle, sweep, expand = 0) {
    const radius = r + expand;
    if (sweep >= 359.9) {
      return `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.01} ${cy - radius} Z`;
    }
    const [x1, y1] = polarToXY(startAngle, radius);
    const [x2, y2] = polarToXY(startAngle + sweep, radius);
    const large = sweep > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;
  }

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      {(title || subtitle) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          {title && (
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--a-text, #1e1b4b)', margin: 0 }}>
              {title}
            </h3>
          )}
          {subtitle && (
            <span style={{ fontSize: 11.5, color: 'var(--a-text-muted, #6b7280)' }}>
              {subtitle}
            </span>
          )}
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        flexWrap: 'wrap',
      }}>
        {/* SVG Donut */}
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, margin: '0 auto' }}>
          <svg width={size} height={size} style={{ overflow: 'visible', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.06))' }}>
            {slices.map((s, i) => {
              const isHovered = hoveredSlice === i;
              return (
                <path
                  key={i}
                  d={describeSlice(s.startAngle, s.sweep, isHovered ? 4 : 0)}
                  fill={s.color}
                  stroke="var(--a-surface, #ffffff)"
                  strokeWidth="2.5"
                  opacity={hoveredSlice !== null ? (isHovered ? 1 : 0.6) : 0.95}
                  style={{ cursor: 'pointer', transition: 'all 0.25s ease' }}
                  onMouseEnter={() => setHoveredSlice(i)}
                  onMouseLeave={() => setHoveredSlice(null)}
                >
                  <title>{`${s.label}: ${s.count} (${s.pctDisplay}%)`}</title>
                </path>
              );
            })}

            {/* Inner circle cutout for Donut effect */}
            <circle cx={cx} cy={cy} r={r * donutRatio} fill="var(--a-surface, #ffffff)" />

            {/* Center text */}
            <text x={cx} y={cy - 4} textAnchor="middle" fontSize="10.5" fill="var(--a-text-muted, #6b7280)" fontWeight="700">
              {hoveredSlice !== null ? slices[hoveredSlice].label.split('/')[0].trim() : 'Tổng số'}
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" fontSize="15" fill="var(--a-text, #1e1b4b)" fontWeight="900">
              {hoveredSlice !== null ? `${slices[hoveredSlice].pctDisplay}%` : total}
            </text>
          </svg>
        </div>

        {/* Legend list */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          flex: 1,
          minWidth: 160,
        }}>
          {slices.map((s, i) => {
            const isHovered = hoveredSlice === i;
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 8px',
                  borderRadius: 6,
                  background: isHovered ? 'var(--a-primary-muted, rgba(67,56,202,0.06))' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={() => setHoveredSlice(i)}
                onMouseLeave={() => setHoveredSlice(null)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: s.color,
                    flexShrink: 0,
                    boxShadow: isHovered ? `0 0 6px ${s.color}` : 'none',
                  }} />
                  <span style={{
                    fontSize: 12,
                    fontWeight: isHovered ? 800 : 600,
                    color: 'var(--a-text, #1e1b4b)',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}>
                    {s.label}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, paddingLeft: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: s.color }}>
                    {s.count}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--a-text-muted, #6b7280)' }}>
                    ({s.pctDisplay}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
