import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../auth/store/authStore';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../api/notificationApi';

function formatRelativeTime(dateString) {
  if (!dateString) return 'Vừa xong';
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function getCategoryConfig(category) {
  switch (category?.toLowerCase()) {
    case 'appointment':
      return { label: 'Lịch tư vấn', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' };
    case 'nlpalert':
      return { label: 'Cảnh báo', color: '#e11d48', bg: '#fff1f2', border: '#fecdd3' };
    case 'community':
      return { label: 'Cộng đồng', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' };
    case 'mood':
      return { label: 'Cảm xúc', color: '#d97706', bg: '#fef3c7', border: '#fde68a' };
    case 'security':
      return { label: 'Bảo mật', color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff' };
    default:
      return { label: 'Hệ thống', color: '#475569', bg: '#f8fafc', border: '#e2e8f0' };
  }
}

export default function NotificationBell({ role: propRole }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const currentRole = propRole || user?.role || 'Student';
  const userId = user?.id;

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef(null);

  const fetchCount = async () => {
    try {
      const res = await getUnreadCount({ userId, role: currentRole });
      if (res?.success && typeof res.data === 'number') {
        setUnreadCount(res.data);
      }
    } catch {}
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await getNotifications({ userId, role: currentRole, limit: 12 });
      if (res?.success && Array.isArray(res.data)) {
        setNotifications(res.data);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 6000);
    return () => clearInterval(interval);
  }, [userId, currentRole]);

  useEffect(() => {
    if (isOpen) {
      fetchList();
      fetchCount();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await markAsRead(id, userId);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead({ userId, role: currentRole });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleItemClick = async (notif) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif.id);
    }
    setIsOpen(false);
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  const getFullPageUrl = () => {
    const r = (currentRole || '').toLowerCase();
    if (r.includes('expert')) return '/expert/notifications';
    if (r.includes('admin')) return '/admin/notifications';
    return '/student/notifications';
  };

  const handleViewAllDetails = () => {
    setIsOpen(false);
    navigate(getFullPageUrl());
  };

  const filteredList = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={popoverRef}>
      {/* ── Bell Trigger Button ── */}
      <button
        onClick={() => setIsOpen(v => !v)}
        title="Thông báo"
        aria-label="Thông báo"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 38,
          height: 38,
          borderRadius: 10,
          background: isOpen ? '#f0fdfa' : 'transparent',
          border: isOpen ? '1px solid #99f6e4' : '1px solid #e5e7eb',
          cursor: 'pointer',
          color: isOpen ? '#0f766e' : '#4b5563',
          transition: 'all 0.15s ease',
          padding: 0,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = '#0d9488';
          e.currentTarget.style.color = '#0d9488';
          e.currentTarget.style.background = '#f0fdfa';
        }}
        onMouseLeave={e => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.color = '#4b5563';
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -3,
              right: -3,
              minWidth: 17,
              height: 17,
              padding: '0 4px',
              borderRadius: 9,
              background: '#ef4444',
              color: '#ffffff',
              fontSize: 10,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 2px #ffffff',
              lineHeight: 1,
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Slide-over / Popover Panel (Góc phải màn hình) ── */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 68,
            right: 18,
            width: 380,
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 86px)',
            background: '#ffffff',
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            boxShadow: '0 16px 38px -10px rgba(15, 23, 42, 0.18)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px 12px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                Thông báo
              </h3>
              {unreadCount > 0 && (
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#0f766e',
                  background: '#ccfbf1',
                  padding: '2px 7px',
                  borderRadius: 10,
                }}>
                  {unreadCount} mới
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  style={{
                    background: 'none',
                    border: '1px solid #e2e8f0',
                    borderRadius: 6,
                    padding: '3px 8px',
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: '#0d9488',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0fdfa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  Đã đọc tất cả
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                title="Đóng"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: 15,
                  cursor: 'pointer',
                  padding: '2px 4px',
                  lineHeight: 1
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#0f172a'}
                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div style={{
            display: 'flex',
            padding: '7px 18px',
            gap: 8,
            background: '#f8fafc',
            borderBottom: '1px solid #f1f5f9'
          }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                background: filter === 'all' ? '#0f766e' : '#ffffff',
                color: filter === 'all' ? '#ffffff' : '#64748b',
                border: filter === 'all' ? '1px solid #0f766e' : '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '3px 10px',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              style={{
                background: filter === 'unread' ? '#0f766e' : '#ffffff',
                color: filter === 'unread' ? '#ffffff' : '#64748b',
                border: filter === 'unread' ? '1px solid #0f766e' : '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '3px 10px',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Chưa đọc ({unreadCount})
            </button>
          </div>

          {/* List of Recent Notifications */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              maxHeight: 380,
              padding: '6px 10px',
            }}
          >
            {loading ? (
              <div style={{ padding: '30px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                Đang tải...
              </div>
            ) : filteredList.length === 0 ? (
              <div style={{ padding: '32px 18px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: '#334155' }}>
                  {filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
                </p>
                <p style={{ margin: 0, fontSize: 11.5, color: '#94a3b8' }}>
                  Thông báo mới sẽ tự động hiển thị tại đây.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filteredList.map((item) => {
                  const cfg = getCategoryConfig(item.category);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      style={{
                        position: 'relative',
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: item.isRead ? '#ffffff' : '#f0fdfa',
                        border: item.isRead ? '1px solid #f1f5f9' : '1px solid #ccfbf1',
                        borderLeft: item.isRead ? '3px solid #cbd5e1' : `3px solid ${cfg.color}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = item.isRead ? '#f8fafc' : '#e6fffa';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = item.isRead ? '#ffffff' : '#f0fdfa';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 3 }}>
                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: cfg.color,
                          background: cfg.bg,
                          padding: '1px 6px',
                          borderRadius: 4,
                          border: `1px solid ${cfg.border}`
                        }}>
                          {cfg.label}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>
                            {formatRelativeTime(item.createdAt)}
                          </span>
                          {!item.isRead && (
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: '#0d9488',
                                display: 'inline-block'
                              }}
                            />
                          )}
                        </div>
                      </div>

                      <h4 style={{
                        margin: '0 0 2px',
                        fontSize: 13,
                        fontWeight: item.isRead ? 700 : 800,
                        color: '#0f172a',
                        lineHeight: 1.35
                      }}>
                        {item.title}
                      </h4>

                      <p style={{
                        margin: 0,
                        fontSize: 12,
                        color: item.isRead ? '#64748b' : '#334155',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {item.message}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Footer: Xem chi tiết ── */}
          <div
            style={{
              padding: '10px 18px',
              borderTop: '1px solid #f1f5f9',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 11.5, color: '#64748b' }}>
              {notifications.length} thông báo
            </span>

            <button
              onClick={handleViewAllDetails}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                background: '#0f766e',
                color: '#ffffff',
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#0d9488'}
              onMouseLeave={e => e.currentTarget.style.background = '#0f766e'}
            >
              Xem chi tiết
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
