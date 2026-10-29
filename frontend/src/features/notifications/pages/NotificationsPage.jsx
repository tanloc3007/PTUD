import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../auth/store/authStore';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../api/notificationApi';

function formatFullTime(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleString('vi-VN', {
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
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

export default function NotificationsPage({ role: propRole }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const currentRole = propRole || user?.role || 'Student';
  const userId = user?.id;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState(null);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await getNotifications({ userId, role: currentRole, limit: 100 });
      if (res?.success && Array.isArray(res.data)) {
        setNotifications(res.data);
      }
    } catch {
      setFeedback({ type: 'error', text: 'Không thể tải danh sách thông báo. Vui lòng thử lại.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [userId, currentRole]);

  const showToast = (text, type = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleToggleRead = async (item) => {
    try {
      if (!item.isRead) {
        await markAsRead(item.id, userId);
        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
        showToast('Đã đánh dấu đã đọc');
      }
    } catch {}
  };

  const handleMarkAll = async () => {
    try {
      await markAllAsRead({ userId, role: currentRole });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      showToast('Đã đánh dấu tất cả thông báo là đã đọc');
    } catch {}
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    try {
      await deleteNotification(id, userId);
      setNotifications(prev => prev.filter(n => n.id !== id));
      showToast('Đã xóa thông báo');
    } catch {}
  };

  const isExpert = currentRole.toLowerCase().includes('expert');
  const isAdmin = currentRole.toLowerCase().includes('admin');

  const pageTitle = isAdmin
    ? 'Trung tâm Thông báo Quản trị'
    : isExpert
      ? 'Trạm Thông báo Chuyên viên'
      : 'Trung tâm Thông báo UniMind';

  const pageSubtitle = isAdmin
    ? 'Giám sát sự kiện hệ thống, báo động đỏ Triage khẩn cấp, hàng đợi kiểm duyệt và an ninh kiểm toán.'
    : isExpert
      ? 'Theo dõi ca hẹn cần duyệt từ sinh viên, cảnh báo đỏ NLP và nhắc nhở hồ sơ lâm sàng.'
      : 'Xem toàn bộ thông báo về lịch tư vấn tâm lý, tương tác cộng đồng và hồ sơ cảm xúc.';

  const tabs = [
    { key: 'all', label: 'Tất cả' },
    { key: 'unread', label: 'Chưa đọc' },
    ...(isAdmin ? [
      { key: 'nlpalert', label: 'Cảnh báo đỏ' },
      { key: 'community', label: 'Kiểm duyệt' },
      { key: 'security', label: 'Kiểm toán' },
      { key: 'system', label: 'Hệ thống' }
    ] : isExpert ? [
      { key: 'appointment', label: 'Lịch tư vấn' },
      { key: 'nlpalert', label: 'Cảnh báo lâm sàng' },
      { key: 'community', label: 'Kiểm duyệt' },
      { key: 'system', label: 'Hệ thống' }
    ] : [
      { key: 'appointment', label: 'Lịch tư vấn' },
      { key: 'community', label: 'Cộng đồng' },
      { key: 'mood', label: 'Cảm xúc' },
      { key: 'system', label: 'Hệ thống' }
    ])
  ];

  const filteredNotifications = notifications.filter(item => {
    if (activeTab === 'unread' && item.isRead) return false;
    if (activeTab !== 'all' && activeTab !== 'unread') {
      if (item.category?.toLowerCase() !== activeTab.toLowerCase()) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchMsg = item.message?.toLowerCase().includes(q);
      const matchCat = item.category?.toLowerCase().includes(q);
      if (!matchTitle && !matchMsg && !matchCat) return false;
    }

    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
      {/* ── Toast Notification ── */}
      {feedback && (
        <div style={{
          position: 'fixed',
          top: 76,
          right: 24,
          padding: '10px 18px',
          borderRadius: 8,
          background: feedback.type === 'error' ? '#ef4444' : '#0f766e',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: 13,
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          zIndex: 10000,
        }}>
          {feedback.text}
        </div>
      )}

      {/* ── Header ── */}
      <div style={{
        background: '#ffffff',
        borderRadius: 14,
        border: '1px solid #e2e8f0',
        padding: '24px 28px',
        marginBottom: 18,
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
                {pageTitle}
              </h1>
              {unreadCount > 0 && (
                <span style={{
                  background: '#ccfbf1',
                  color: '#0f766e',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 12,
                  border: '1px solid #99f6e4'
                }}>
                  {unreadCount} chưa đọc
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b', maxWidth: 650, lineHeight: 1.5 }}>
              {pageSubtitle}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  background: '#f0fdfa',
                  border: '1px solid #99f6e4',
                  color: '#0f766e',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#ccfbf1'}
                onMouseLeave={e => e.currentTarget.style.background = '#f0fdfa'}
              >
                Đã đọc tất cả
              </button>
            )}
            <button
              onClick={fetchList}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#475569',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Làm mới
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 10,
          marginTop: 18,
          paddingTop: 16,
          borderTop: '1px solid #f1f5f9'
        }}>
          <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>TỔNG SỐ</span>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
              {notifications.length}
            </div>
          </div>
          <div style={{ padding: '10px 14px', background: '#f0fdfa', borderRadius: 10, border: '1px solid #ccfbf1' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0d9488' }}>CHƯA ĐỌC</span>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f766e', marginTop: 2 }}>
              {unreadCount}
            </div>
          </div>
          <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>ĐÃ ĐỌC</span>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#334155', marginTop: 2 }}>
              {notifications.length - unreadCount}
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter Tabs & Search Bar ── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 14
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {tabs.map(t => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 16,
                  fontSize: 12.5,
                  fontWeight: active ? 700 : 600,
                  background: active ? '#0f766e' : '#ffffff',
                  color: active ? '#ffffff' : '#64748b',
                  border: active ? '1px solid #0f766e' : '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div style={{ position: 'relative', width: 240, maxWidth: '100%' }}>
          <input
            type="text"
            placeholder="Tìm thông báo..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 12px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              fontSize: 12.5,
              boxSizing: 'border-box',
              outline: 'none',
              background: '#ffffff'
            }}
          />
        </div>
      </div>

      {/* ── Notification Cards List ── */}
      {loading ? (
        <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 48, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Đang tải danh sách thông báo...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          padding: '48px 20px',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
            Không có thông báo phù hợp
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
            Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredNotifications.map(item => {
            const cfg = getCategoryConfig(item.category);
            return (
              <div
                key={item.id}
                onClick={() => handleToggleRead(item)}
                style={{
                  background: item.isRead ? '#ffffff' : '#f0fdfa',
                  border: item.isRead ? '1px solid #e2e8f0' : '1px solid #99f6e4',
                  borderLeft: item.isRead ? '3.5px solid #cbd5e1' : `3.5px solid ${cfg.color}`,
                  borderRadius: 10,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 16,
                  transition: 'all 0.15s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#0d9488';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = item.isRead ? '#e2e8f0' : '#99f6e4';
                  e.currentTarget.style.borderLeftColor = item.isRead ? '#cbd5e1' : cfg.color;
                }}
              >
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
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

                    <span style={{ fontSize: 11.5, color: '#94a3b8' }}>
                      {formatFullTime(item.createdAt)}
                    </span>

                    {!item.isRead && (
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: '#0f766e',
                        background: '#ccfbf1',
                        padding: '1px 6px',
                        borderRadius: 4
                      }}>
                        Mới
                      </span>
                    )}
                  </div>

                  <h3 style={{
                    margin: '0 0 3px',
                    fontSize: 14.5,
                    fontWeight: item.isRead ? 700 : 800,
                    color: '#0f172a'
                  }}>
                    {item.title}
                  </h3>

                  <p style={{
                    margin: '0 0 10px',
                    fontSize: 13,
                    color: item.isRead ? '#64748b' : '#334155',
                    lineHeight: 1.5
                  }}>
                    {item.message}
                  </p>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.actionUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleRead(item);
                          navigate(item.actionUrl);
                        }}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 6,
                          background: '#0f766e',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Đi tới trang
                      </button>
                    )}

                    {!item.isRead ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleRead(item);
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          color: '#0d9488',
                          fontSize: 11.5,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Đánh dấu đã đọc
                      </button>
                    ) : (
                      <span style={{ fontSize: 11.5, color: '#94a3b8' }}>
                        Đã đọc
                      </span>
                    )}

                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      style={{
                        marginLeft: 'auto',
                        padding: '4px 8px',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        borderRadius: 4
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none'; }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>

                {!item.isRead && (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#0d9488',
                      flexShrink: 0,
                      marginTop: 4
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
