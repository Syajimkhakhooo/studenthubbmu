import React from 'react';

export function Badge({
  children,
  variant = 'neutral', // 'neutral' | 'success' | 'warning' | 'danger' | 'info'
  withDot = true,
  className = '',
}) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {withDot && <span className="badge-dot" />}
      {children}
    </span>
  );
}
