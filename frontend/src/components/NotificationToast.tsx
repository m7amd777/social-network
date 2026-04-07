import { useEffect, useState } from 'react';
import { getImageUrl } from '../utils/image';

export type ToastNotif = {
  id: number;
  icon: string;
  text: string;
  avatar?: string;
};

interface Props {
  toasts: ToastNotif[];
  onDismiss: (id: number) => void;
}

export default function NotificationToast({ toasts, onDismiss }: Props) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      pointerEvents: 'none',
    }}>
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastNotif; onDismiss: (id: number) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 10);
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, 4000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [toast.id, onDismiss]);

  return (
    <div
      onClick={() => { setVisible(false); setTimeout(() => onDismiss(toast.id), 300); }}
      style={{
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderLeft: '4px solid var(--accent-primary)',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: 'var(--shadow-lg)',
        minWidth: '280px',
        maxWidth: '360px',
        cursor: 'pointer',
        transform: visible ? 'translateX(0)' : 'translateX(120%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
      }}
    >
      {toast.avatar ? (
        <img
          src={getImageUrl(toast.avatar)}
          alt=""
          style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }}
        />
      ) : (
        <span style={{ fontSize: '22px', flexShrink: 0 }}>{toast.icon}</span>
      )}
      <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', lineHeight: 1.4 }}>
        {toast.text}
      </span>
    </div>
  );
}
