import { useState, useEffect, useMemo } from 'react';
import { getMoodItems } from '../api/adminApi';

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' • ' +
         d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

export default function MoodPostsPopup({ isOpen, onClose, selectedMood }) {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'Post', 'Journal'
  const [query, setQuery]       = useState('');

  // Close on ESC key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch items when mood changes
  useEffect(() => {
    if (!isOpen || !selectedMood?.label) return;

    let mounted = true;
    setLoading(true);
    setError(null);
    setQuery('');
    setActiveTab('all');

    getMoodItems(selectedMood.label)
      .then(res => {
        if (!mounted) return;
        if (res?.success && Array.isArray(res.data)) {
          setItems(res.data);
        } else {
          setItems([]);
        }
      })
      .catch(err => {
        if (!mounted) return;
        setError('Không thể tải danh sách bài viết. Vui lòng thử lại.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [isOpen, selectedMood]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchTab = activeTab === 'all' || item.itemType === activeTab;
      const q = query.toLowerCase().trim();
      const matchQuery = !q ||
        item.content?.toLowerCase().includes(q) ||
        item.title?.toLowerCase().includes(q) ||
        item.authorPseudonym?.toLowerCase().includes(q) ||
        item.triggers?.toLowerCase().includes(q);
      return matchTab && matchQuery;
    });
  }, [items, activeTab, query]);

  if (!isOpen || !selectedMood) return null;

  const moodColor = selectedMood.color || '#4338ca';
  const postCount = items.filter(i => i.itemType === 'Post').length;
  const journalCount = items.filter(i => i.itemType === 'Journal').length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 0.2s ease-out',
        boxSizing: 'border-box'
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="admin-card"
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          background: '#ffffff',
          borderRadius: 18,
          border: '1px solid rgba(226, 232, 240, 0.9)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          boxSizing: 'border-box'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top colored accent line */}
        <div style={{ height: 4, width: '100%', background: moodColor }} />

        {/* ── Modal Header ─────────────────────────────────────── */}
        <div style={{
          padding: '18px 24px 14px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{
                display: 'inline-block',
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: moodColor,
                boxShadow: `0 0 8px ${moodColor}`
              }} />
              <h2 style={{
                fontSize: 18,
                fontWeight: 900,
                color: '#0f172a',
                margin: 0,
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}>
                Bài viết & Nhật ký: {selectedMood.label}
              </h2>
            </div>
            <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>
              Tổng hợp chia sẻ cộng đồng và nhật ký cảm xúc của sinh viên
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              fontSize: 16,
              fontWeight: 700,
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#fee2e2';
              e.currentTarget.style.color = '#dc2626';
              e.currentTarget.style.borderColor = '#fca5a5';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.color = '#64748b';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Filter Tabs & Search Bar ─────────────────────────── */}
        <div style={{
          padding: '12px 24px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'all', label: `Tất cả (${items.length})` },
              { id: 'Post', label: `Bài viết (${postCount})` },
              { id: 'Journal', label: `Nhật ký (${journalCount})` },
            ].map(tab => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: active ? 800 : 600,
                    background: active ? '#ffffff' : 'transparent',
                    border: active ? '1px solid #cbd5e1' : '1px solid transparent',
                    color: active ? '#0f172a' : '#64748b',
                    cursor: 'pointer',
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search inside popup */}
          <div style={{ flex: 1, minWidth: 180, maxWidth: 280 }}>
            <input
              type="text"
              placeholder="Lọc từ khóa..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 12px',
                borderRadius: 7,
                border: '1px solid #cbd5e1',
                fontSize: 12,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* ── Content List ─────────────────────────────────────── */}
        <div style={{
          padding: '16px 24px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
              Đang tải danh sách bài viết liên quan...
            </div>
          ) : error ? (
            <div style={{ padding: '30px 0', textAlign: 'center', color: '#dc2626', fontSize: 13 }}>
              {error}
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>
              <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14, color: '#334155' }}>
                Không tìm thấy bài viết hoặc nhật ký phù hợp
              </p>
              <p style={{ margin: 0, fontSize: 12.5 }}>
                Chưa có sinh viên nào ghi nhận cảm xúc này hoặc khớp với từ khóa tìm kiếm.
              </p>
            </div>
          ) : (
            filteredItems.map(item => {
              const isPost = item.itemType === 'Post';
              const typeColor = isPost ? '#4f46e5' : '#0d9488';
              const typeBg = isPost ? '#eef2ff' : '#f0fdfa';
              const typeBorder = isPost ? '#c7d2fe' : '#99f6e4';
              const typeLabel = isPost ? 'Bài viết cộng đồng' : 'Nhật ký tâm trạng';

              return (
                <div
                  key={item.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderLeft: `4px solid ${typeColor}`,
                    borderRadius: 10,
                    padding: '14px 16px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                    transition: 'box-shadow 0.15s, transform 0.15s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.03)';
                  }}
                >
                  {/* Item Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 800,
                        background: typeBg,
                        color: typeColor,
                        padding: '2px 8px',
                        borderRadius: 4,
                        border: `1px solid ${typeBorder}`
                      }}>
                        {typeLabel}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                        {item.authorPseudonym}
                      </span>
                      {item.studentRoleTag && (
                        <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>
                          • {item.studentRoleTag}
                        </span>
                      )}
                    </div>

                    <span style={{ fontSize: 11.5, color: '#94a3b8' }}>
                      {timeAgo(item.createdAt)} ({formatTime(item.createdAt)})
                    </span>
                  </div>

                  {/* Item Content */}
                  <p style={{
                    fontSize: 13.5,
                    color: '#334155',
                    margin: '0 0 10px',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-line'
                  }}>
                    {item.content}
                  </p>

                  {/* Metadata Chips Footer */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {item.triggers && (
                      <span style={{
                        fontSize: 11.5,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        padding: '2px 8px',
                        borderRadius: 4,
                        color: '#475569'
                      }}>
                        Tác nhân: <strong>{item.triggers}</strong>
                      </span>
                    )}
                    {item.energyLevel !== null && item.energyLevel !== undefined && (
                      <span style={{
                        fontSize: 11.5,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        padding: '2px 8px',
                        borderRadius: 4,
                        color: '#475569'
                      }}>
                        Mức năng lượng: <strong>{item.energyLevel}/10</strong>
                      </span>
                    )}
                    {item.riskScore >= 70 && (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#dc2626',
                        padding: '2px 8px',
                        borderRadius: 4
                      }}>
                        Ưu tiên theo dõi ({item.riskScore}%)
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer ───────────────────────────────────────────── */}
        <div style={{
          padding: '12px 24px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Hiển thị <strong>{filteredItems.length}</strong> bài viết & nhật ký liên quan
          </span>
          <button
            type="button"
            className="admin-btn admin-btn-outline"
            onClick={onClose}
            style={{ padding: '6px 16px', fontSize: 12.5, borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
