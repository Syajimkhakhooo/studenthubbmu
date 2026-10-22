import React, { useState, useMemo } from 'react';

/**
 * DonutChart - Interactive, dependency-free SVG Donut Chart
 * Designed with modern aesthetic, hover highlights, center readout & realtime updates.
 *
 * @param {Array<{ label: string, value: number, color: string, id?: string }>} data
 * @param {number} size - Chart diameter in px (default: 200)
 * @param {number} thickness - Stroke thickness in px (default: 26)
 * @param {string} centerLabel - Label under center value (default: 'Total')
 * @param {string} centerSubtext - Small subtext (e.g. 'Siswa')
 * @param {string} emptyText - Text when total is 0
 * @param {boolean} showLegend - Whether to display legend list
 * @param {function} onSliceClick - Optional click handler (item) => void
 */
export function DonutChart({
  data = [],
  size = 200,
  thickness = 26,
  centerLabel = 'Total Siswa',
  centerSubtext = '',
  emptyText = 'Belum ada data',
  showLegend = true,
  onSliceClick,
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Compute total
  const total = useMemo(() => {
    return data.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  }, [data]);

  // Geometry calculations
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate slice angles & offsets
  const slices = useMemo(() => {
    if (total <= 0) return [];

    let accumulatedOffset = 0;
    const itemsWithValues = data.filter((d) => (Number(d.value) || 0) > 0);
    const hasMultiple = itemsWithValues.length > 1;
    const gap = hasMultiple ? 2.5 : 0; // px gap between slices

    return data.map((item, idx) => {
      const val = Number(item.value) || 0;
      if (val <= 0) {
        return {
          ...item,
          idx,
          percentage: 0,
          dashArray: '0 9999',
          dashOffset: 0,
          isEmpty: true,
        };
      }

      const fraction = val / total;
      const arcLength = fraction * circumference;
      const effectiveLength = Math.max(0, arcLength - gap);
      const dashArray = `${effectiveLength} ${circumference - effectiveLength}`;
      const dashOffset = -accumulatedOffset;

      accumulatedOffset += arcLength;

      return {
        ...item,
        idx,
        percentage: (fraction * 100).toFixed(1),
        dashArray,
        dashOffset,
        isEmpty: false,
      };
    });
  }, [data, total, circumference]);

  const activeItem = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      {/* Chart SVG Container */}
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{
            transform: 'rotate(-90deg)',
            overflow: 'visible',
          }}
        >
          {/* Subtle Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth={thickness}
            opacity={0.35}
          />

          {total === 0 ? (
            /* Empty State Ring */
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--border-default)"
              strokeWidth={thickness}
              strokeDasharray="6 6"
              opacity={0.6}
            />
          ) : (
            /* Data Slices */
            slices.map((slice) => {
              if (slice.isEmpty) return null;
              const isHovered = hoveredIdx === slice.idx;
              const isDimmed = hoveredIdx !== null && !isHovered;

              return (
                <circle
                  key={slice.idx}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={isHovered ? thickness + 4 : thickness}
                  strokeDasharray={slice.dashArray}
                  strokeDashoffset={slice.dashOffset}
                  strokeLinecap="round"
                  opacity={isDimmed ? 0.35 : 1}
                  style={{
                    cursor: onSliceClick ? 'pointer' : 'default',
                    transition: 'stroke-width 200ms ease, opacity 200ms ease, filter 200ms ease',
                    filter: isHovered ? `drop-shadow(0 0 6px ${slice.color}99)` : 'none',
                  }}
                  onMouseEnter={() => setHoveredIdx(slice.idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => onSliceClick?.(slice)}
                />
              );
            })
          )}
        </svg>

        {/* Center Readout (Not Rotated) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            textAlign: 'center',
            padding: '12px',
          }}
        >
          {total === 0 ? (
            <>
              <span className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-tertiary)' }}>
                0
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                {emptyText}
              </span>
            </>
          ) : activeItem && !activeItem.isEmpty ? (
            <>
              <span
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  maxWidth: size - thickness * 2 - 20,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {activeItem.label}
              </span>
              <div
                className="font-mono"
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: activeItem.color,
                  lineHeight: 1.1,
                  marginTop: '2px',
                }}
              >
                {activeItem.value}
              </div>
              <span
                className="font-mono"
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--text-tertiary)',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  marginTop: '4px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {activeItem.percentage}%
              </span>
            </>
          ) : (
            <>
              <span
                className="font-mono"
                style={{
                  fontSize: '1.625rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}
              >
                {total}
              </span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--text-secondary)',
                  marginTop: '4px',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                }}
              >
                {centerLabel}
              </span>
              {centerSubtext && (
                <span style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>
                  {centerSubtext}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Interactive Legend List */}
      {showLegend && data.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            width: '100%',
            marginTop: '16px',
            paddingTop: '14px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          {slices.map((slice) => {
            const isHovered = hoveredIdx === slice.idx;
            const isDimmed = hoveredIdx !== null && !isHovered;

            return (
              <div
                key={slice.idx}
                onMouseEnter={() => setHoveredIdx(slice.idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onSliceClick?.(slice)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isHovered ? 'var(--bg-surface-elevated)' : 'transparent',
                  border: `1px solid ${isHovered ? 'var(--border-subtle)' : 'transparent'}`,
                  cursor: onSliceClick ? 'pointer' : 'default',
                  opacity: isDimmed ? 0.45 : 1,
                  transition: 'all var(--transition-fast)',
                }}
              >
                {/* Left: Indicator & Label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: slice.color,
                      flexShrink: 0,
                      boxShadow: isHovered ? `0 0 8px ${slice.color}` : 'none',
                      transition: 'box-shadow var(--transition-fast)',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.8125rem',
                      color: isHovered ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: isHovered ? 600 : 400,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={slice.label}
                  >
                    {slice.label}
                  </span>
                </div>

                {/* Right: Value & Percentage */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {slice.value || 0}
                  </span>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--text-tertiary)',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      padding: '2px 5px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-subtle)',
                      minWidth: '42px',
                      textAlign: 'right',
                    }}
                  >
                    {slice.percentage || '0.0'}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
