import React from 'react';
import { FolderX } from 'lucide-react';
import { Button } from '../ui/Button';

export function EmptyState({
  icon: Icon = FolderX,
  title = 'Tidak Ada Data',
  description = 'Belum ada data yang tercatat di dalam sistem.',
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-10) var(--space-4)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-surface-elevated)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-tertiary)',
          marginBottom: 'var(--space-3)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <Icon size={26} />
      </div>
      <h4 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>{title}</h4>
      <p
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.875rem',
          maxWidth: '420px',
          marginBottom: actionLabel ? 'var(--space-4)' : 0,
        }}
      >
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
