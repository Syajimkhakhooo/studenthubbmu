import React from 'react';
import { useToast } from '../../hooks/useToast';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 9999,
        maxWidth: '420px',
        width: 'calc(100% - 48px)',
      }}
    >
      {toasts.map((toast) => {
        let Icon = Info;
        let borderColor = 'var(--border-default)';
        let iconColor = 'var(--text-primary)';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          borderColor = 'var(--status-success-border)';
          iconColor = 'var(--status-success-text)';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          borderColor = 'var(--status-danger-border)';
          iconColor = 'var(--status-danger-text)';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          borderColor = 'var(--status-warning-border)';
          iconColor = 'var(--status-warning-text)';
        }

        return (
          <div
            key={toast.id}
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              border: `1px solid ${borderColor}`,
              borderRadius: 'var(--radius-lg)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              boxShadow: 'var(--shadow-md)',
              animation: 'modalFadeIn 200ms ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Icon size={18} style={{ color: iconColor, flexShrink: 0 }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                {toast.message}
              </span>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              style={{
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
