import React from 'react';

/**
 * In-Page Notification component
 * Cung cấp thông báo nội trang (In-Page Notification) tinh gọn, thanh lịch,
 * không lạm dụng icon hay popup che khuất màn hình.
 */
export default function InPageNotification({
  type = 'info', // 'success' | 'error' | 'warning' | 'info'
  title,
  message,
  onClose,
  action,
  style = {}
}) {
  if (!message && !title) return null;

  const THEMES = {
    success: {
      bg: '#f0fdf4',
      border: '#86efac',
      text: '#14532d',
      tagBg: '#dcfce7',
      tagText: '#15803d',
      tagLabel: 'Thành công'
    },
    error: {
      bg: '#fef2f2',
      border: '#fca5a5',
      text: '#7f1d1d',
      tagBg: '#fee2e2',
      tagText: '#b91c1c',
      tagLabel: 'Lỗi'
    },
    warning: {
      bg: '#fffbeb',
      border: '#fcd34d',
      text: '#78350f',
      tagBg: '#fef3c7',
      tagText: '#b45309',
      tagLabel: 'Lưu ý'
    },
    info: {
      bg: '#f0fdfa',
      border: '#5eead4',
      text: '#134e4a',
      tagBg: '#ccfbf1',
      tagText: '#0f766e',
      tagLabel: 'Thông báo'
    }
  };

  const theme = THEMES[type] || THEMES.info;

  return (
    <div
      role="alert"
      className="in-page-notification"
      style={{
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        borderRadius: 10,
        padding: '12px 16px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        transition: 'all 0.2s ease',
        animation: 'fadeIn 0.2s ease-out',
        ...style
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: message ? 4 : 0 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '2px 8px',
              borderRadius: 4,
              background: theme.tagBg,
              color: theme.tagText,
              fontFamily: "'Manrope', sans-serif"
            }}
          >
            {theme.tagLabel}
          </span>
          {title && (
            <strong style={{ fontSize: 13.5, color: theme.text, fontWeight: 800 }}>
              {title}
            </strong>
          )}
        </div>
        {message && (
          <div style={{ fontSize: 13, color: theme.text, lineHeight: 1.5, margin: 0 }}>
            {message}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            style={{
              background: theme.tagBg,
              border: `1px solid ${theme.border}`,
              color: theme.tagText,
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {action.label}
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng thông báo"
            style={{
              background: 'none',
              border: 'none',
              padding: '2px 6px',
              fontSize: 16,
              lineHeight: 1,
              color: theme.text,
              opacity: 0.6,
              cursor: 'pointer',
              fontWeight: 700
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
