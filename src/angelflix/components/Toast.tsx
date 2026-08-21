import { useEffect, useState } from 'react';

export interface ToastData {
  id: number;
  message: string;
  icon?: 'heart' | 'heart-off' | 'info';
}

interface ToastProps {
  toast: ToastData | null;
}

export default function Toast({ toast }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [currentToast, setCurrentToast] = useState<ToastData | null>(null);

  useEffect(() => {
    if (!toast) return;
    setCurrentToast(toast);
    setExiting(false);
    setVisible(true);

    const exitTimer = setTimeout(() => setExiting(true), 2200);
    const hideTimer = setTimeout(() => { setVisible(false); setExiting(false); }, 2400);
    return () => { clearTimeout(exitTimer); clearTimeout(hideTimer); };
  }, [toast?.id]);

  if (!visible || !currentToast) return null;

  return (
    <div
      className={exiting ? 'toast-out' : 'toast-in'}
      style={{
        position: 'fixed',
        bottom: '32px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 18px',
        borderRadius: '100px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        color: 'var(--text-primary)',
        fontSize: '13px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        pointerEvents: 'none',
      }}
    >
      {currentToast.icon === 'heart' && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)" stroke="none" style={{ flexShrink: 0 }}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      )}
      {currentToast.icon === 'heart-off' && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ flexShrink: 0 }}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      )}
      {currentToast.message}
    </div>
  );
}
