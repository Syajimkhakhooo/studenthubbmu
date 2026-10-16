import React from 'react';

export function LoadingSkeleton({ lines = 4, className = '' }) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        padding: '16px',
      }}
    >
      {Array.from({ length: lines }).map((_, idx) => (
        <div
          key={idx}
          style={{
            height: idx === 0 ? '24px' : '18px',
            width: idx === 0 ? '40%' : idx === lines - 1 ? '60%' : '100%',
            backgroundColor: 'var(--bg-surface-elevated)',
            borderRadius: 'var(--radius-sm)',
            animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div
          key={rIdx}
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            padding: '8px 0',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div
              key={cIdx}
              style={{
                height: '16px',
                flex: 1,
                backgroundColor: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-sm)',
                animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
