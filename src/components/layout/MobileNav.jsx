import React from 'react';
import { Sidebar } from './Sidebar';

export function MobileNav({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="hide-on-desktop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'var(--bg-modal-backdrop)',
        display: 'flex',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '280px',
          height: '100%',
          backgroundColor: 'var(--bg-surface)',
          animation: 'slideInLeft 200ms ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Sidebar
          isCollapsed={false}
          onToggleCollapse={() => {}}
          isMobile={true}
          onCloseMobile={onClose}
        />
      </div>
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
