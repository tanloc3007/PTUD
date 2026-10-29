import { useState, useEffect, useCallback } from 'react';
import { getAuditLogs, getAuditLogHistory } from '../api/adminApi';

const ACTION_META = {
  STUDENT_REGISTERED:       { color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', label: 'Đăng ký sinh viên' },
  USER_PROVISIONED:         { color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', label: 'Cấp tài khoản' },
  APPOINTMENT_SCHEDULED:    { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', label: 'Đặt lịch hẹn' },
  KEYWORD_ADDED:            { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Thêm từ khóa' },
  CRISIS_TRIAGE_FLAGGED:    { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Cảnh báo AI Triage' },
  ROLE_CHANGED:             { color: '#4338ca', bg: '#eef2ff', border: '#c7d2fe', label: 'Thay đổi quyền' },
  ADMIN_MODERATE_POST:      { color: '#e11d48', bg: '#fff1f2', border: '#fecdd3', label: 'Admin duyệt bài' },
  ADMIN_TOGGLE_USER_STATUS: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Khóa / Mở tài khoản' },
  ADMIN_ADD_KEYWORD:        { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Thêm từ khóa nguy cơ' },
  ADMIN_DELETE_KEYWORD:     { color: '#64748b', bg: '#f8fafc', border: '#cbd5e1', label: 'Xóa từ khóa' },
  ADMIN_UPDATE_ROLE:        { color: '#4338ca', bg: '#eef2ff', border: '#c7d2fe', label: 'Cấp vai trò người dùng' },
  MODERATE_IMAGE:           { color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', label: 'Kiểm duyệt ảnh' },
  EXPERT_START_MEETING:     { color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', label: 'Mở phòng tư vấn' },
  MODERATE_COMMENT:         { color: '#e11d48', bg: '#fff1f2', border: '#fecdd3', label: 'Duyệt bình luận' },
  SYSTEM:                   { color: '#475569', bg: '#f8fafc', border: '#cbd5e1', label: 'Hệ thống' },
};

function getMeta(actionType) {
  if (ACTION_META[actionType]) return ACTION_META[actionType];
  return {
    color: '#475569',
    bg: '#f8fafc',
    border: '#cbd5e1',
    label: actionType ? actionType.replace(/_/g, ' ') : 'Hệ thống'
  };
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} ngày trước`;
  return formatDate(iso);
}

// Group logs by date
function groupByDate(logs) {
  const map = {};
  for (const log of logs) {
    const key = new Date(log.createdAt).toDateString();
    if (!map[key]) map[key] = { dateLabel: formatDate(log.createdAt), items: [] };
    map[key].items.push(log);
  }
  return Object.values(map);
}

export default function AuditLogsPage() {
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [monthFilter, setMonthFilter]   = useState('');
  const [yearFilter, setYearFilter]     = useState(new Date().getFullYear().toString());
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 30;

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, pageSize: PAGE_SIZE };
      if (monthFilter) params.month = monthFilter;
      if (yearFilter)  params.year  = yearFilter;

      // Try paginated history endpoint first
      const histRes = await getAuditLogHistory(params);
      if (histRes?.success && histRes.data) {
        setLogs(histRes.data.data || []);
        setTotalPages(histRes.data.totalPages || 1);
        setTotalCount(histRes.data.totalCount || 0);
        setLoading(false);
        return;
      }

      // Fallback to simple endpoint
      const simpleRes = await getAuditLogs();
      if (simpleRes?.success && Array.isArray(simpleRes.data)) {
        setLogs(simpleRes.data);
        setTotalPages(1);
        setTotalCount(simpleRes.data.length);
      }
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, monthFilter, yearFilter]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const actionTypes = Array.from(new Set(logs.map(l => l.actionType)));

  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      l.actionType?.toLowerCase().includes(q) ||
      getMeta(l.actionType).label.toLowerCase().includes(q) ||
      l.details?.toLowerCase().includes(q) ||
      l.target?.toLowerCase().includes(q) ||
      l.actorEmail?.toLowerCase().includes(q) ||
      l.actorRole?.toLowerCase().includes(q);
    const matchAction = !actionFilter || l.actionType === actionFilter;
    return matchSearch && matchAction;
  });

  const groups = groupByDate(filtered);

  const MONTHS = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                  'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
  const YEARS  = [2025, 2026, 2027].map(y => y.toString());

  const securityAlertsCount = logs.filter(l => l.actionType === 'CRISIS_TRIAGE_FLAGGED' || l.actionType === 'ROLE_CHANGED').length;

  return (
    <div className="admin-page-shell" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      
      {/* ── Page Header ────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <h1 className="admin-page-title" style={{ fontSize: 22, fontWeight: 900, color: 'var(--a-text, #1e1b4b)', margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Nhật Ký Hoạt Động Hệ Thống
        </h1>
      </div>

      {/* ── 4 Stat Cards Grid (Clean, Full Width) ────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20, width: '100%' }}>
        {[
          { label: 'Tổng bản ghi hệ thống', value: totalCount || logs.length, border: '#4338ca', color: '#4338ca' },
          { label: 'Bản ghi đang hiển thị', value: filtered.length, border: '#0284c7', color: '#0284c7' },
          { label: 'Nhóm theo ngày', value: groups.length, border: '#0d9488', color: '#0d9488' },
          { label: 'Sự kiện AI & Bảo mật', value: securityAlertsCount, border: '#dc2626', color: '#dc2626' },
        ].map(s => (
          <div
            key={s.label}
            style={{
              background: 'var(--a-surface, #ffffff)',
              border: '1px solid var(--a-border, #e5e7eb)',
              borderLeft: `4px solid ${s.border}`,
              borderRadius: 14,
              padding: '16px 20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 8,
              transition: 'transform 0.15s, box-shadow 0.15s'
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--a-text-muted, #6b7280)' }}>{s.label}</span>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {s.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* ── Modern Toolbar & Filter Section ──────────────────────────────── */}
      <div className="admin-card" style={{ padding: '16px 20px', marginBottom: 24, borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        
        {/* Search & Main Dropdowns */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <input
              className="admin-input"
              placeholder="Tìm theo hành động, người thực hiện, đối tượng, IP..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: 14,
                paddingRight: 14,
                paddingTop: 9,
                paddingBottom: 9,
                borderRadius: 9,
                fontSize: 13,
                fontFamily: "'Manrope', sans-serif",
                boxSizing: 'border-box'
              }}
            />
          </div>

          <select
            className="admin-input"
            style={{ width: 'auto', minWidth: 190, padding: '9px 12px', borderRadius: 9, fontSize: 13, cursor: 'pointer' }}
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả loại thao tác</option>
            {actionTypes.map(a => (
              <option key={a} value={a}>{getMeta(a).label}</option>
            ))}
          </select>

          <select
            className="admin-input"
            style={{ width: 'auto', minWidth: 130, padding: '9px 12px', borderRadius: 9, fontSize: 13, cursor: 'pointer' }}
            value={monthFilter}
            onChange={e => { setMonthFilter(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả tháng</option>
            {MONTHS.map((m, i) => <option key={i + 1} value={String(i + 1)}>{m}</option>)}
          </select>

          <select
            className="admin-input"
            style={{ width: 'auto', minWidth: 110, padding: '9px 12px', borderRadius: 9, fontSize: 13, cursor: 'pointer' }}
            value={yearFilter}
            onChange={e => { setYearFilter(e.target.value); setPage(1); }}
          >
            {YEARS.map(y => <option key={y} value={y}>Năm {y}</option>)}
          </select>

          <button
            type="button"
            className="admin-btn admin-btn-outline"
            onClick={() => { setSearch(''); setActionFilter(''); setMonthFilter(''); setYearFilter(new Date().getFullYear().toString()); setPage(1); }}
            style={{ padding: '9px 16px', fontSize: 13, cursor: 'pointer', borderRadius: 9, fontWeight: 700 }}
          >
            Đặt lại
          </button>
        </div>

        {/* Quick Filter Tag Pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--a-text-muted)', marginRight: 4 }}>Lọc nhanh:</span>
          {[
            { key: '', label: 'Tất cả' },
            { key: 'CRISIS_TRIAGE_FLAGGED', label: 'Cảnh báo AI' },
            { key: 'STUDENT_REGISTERED', label: 'Đăng ký mới' },
            { key: 'APPOINTMENT_SCHEDULED', label: 'Đặt lịch' },
            { key: 'ROLE_CHANGED', label: 'Quyền hạn' },
            { key: 'KEYWORD_ADDED', label: 'Từ khóa' },
          ].map(tag => {
            const isSelected = actionFilter === tag.key;
            return (
              <button
                key={tag.key}
                type="button"
                onClick={() => { setActionFilter(tag.key); setPage(1); }}
                style={{
                  padding: '5px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: isSelected ? 800 : 600,
                  border: isSelected ? '1.5px solid #4338ca' : '1px solid #e2e8f0',
                  background: isSelected ? '#eef2ff' : '#f8fafc',
                  color: isSelected ? '#4338ca' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Timeline Log Display ─────────────────────────────────────────── */}
      {loading ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--a-text-muted)', fontSize: 14 }}>
          Đang truy xuất nhật ký hoạt động từ cơ sở dữ liệu...
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-card" style={{ padding: '48px 0', textAlign: 'center', color: 'var(--a-text-muted)' }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: 'var(--a-text)' }}>Không tìm thấy nhật ký phù hợp</p>
          <p style={{ margin: '4px 0 0', fontSize: 13 }}>Thử thay đổi bộ lọc hoặc nhấn nút Đặt lại</p>
        </div>
      ) : (
        <div>
          {groups.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 28 }}>
              
              {/* Date Header Ribbon */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #4338ca, #3730a3)',
                  color: '#ffffff',
                  borderRadius: 20,
                  padding: '5px 16px',
                  fontSize: 12.5,
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(67,56,202,0.2)',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}>
                  <span>{group.dateLabel}</span>
                </div>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                <span style={{ fontSize: 12, color: 'var(--a-text-muted)', fontWeight: 700, background: '#f1f5f9', padding: '3px 10px', borderRadius: 12 }}>
                  {group.items.length} thao tác
                </span>
              </div>

              {/* Log entries card list */}
              <div className="admin-card" style={{ padding: 0, overflow: 'hidden', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                {group.items.map((log, idx) => {
                  const meta = getMeta(log.actionType);
                  const cleanDetails = (log.details || '').replace(/Chuyên viên Chuyên viên/g, 'Chuyên viên');
                  
                  // Filter out redundant target if target is identical to details or already inside details
                  const rawTarget = (log.target || '').replace(/Chuyên viên Chuyên viên/g, 'Chuyên viên').trim();
                  const isTargetRedundant = !rawTarget || 
                    rawTarget === cleanDetails.trim() || 
                    cleanDetails.includes(rawTarget);

                  return (
                    <div
                      key={log.id || idx}
                      style={{
                        padding: '16px 20px',
                        borderBottom: idx < group.items.length - 1 ? '1px solid #f1f5f9' : 'none',
                        borderLeft: `4px solid ${meta.border}`,
                        transition: 'background 0.15s',
                        background: '#ffffff'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: 11.5, fontWeight: 800, background: meta.bg,
                            color: meta.color, padding: '3px 9px', borderRadius: 6, border: `1px solid ${meta.border}`
                          }}>
                            {meta.label}
                          </span>
                          <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>
                            {log.actorEmail || log.actorRole || 'Hệ thống'}
                          </span>
                          {log.actorRole && (
                            <span style={{
                              fontSize: 11, background: '#f1f5f9',
                              border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: 4,
                              color: '#475569', fontWeight: 700
                            }}>
                              {log.actorRole}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 800, color: '#1e293b' }}>
                            {formatTime(log.createdAt)}
                          </span>
                          <span style={{ fontSize: 11, color: '#64748b' }}>
                            {timeAgo(log.createdAt)}
                          </span>
                        </div>
                      </div>

                      <p style={{ fontSize: 13.5, color: '#334155', margin: '0 0 6px', lineHeight: 1.6 }}>
                        {cleanDetails}
                      </p>

                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                        {!isTargetRedundant && (
                          <span style={{ fontSize: 12, color: '#64748b' }}>
                            Đối tượng: <strong style={{ color: '#0f172a' }}>{rawTarget}</strong>
                          </span>
                        )}
                        {log.ipAddress && (
                          <span style={{ fontSize: 12, color: '#64748b' }}>
                            IP: <code style={{ fontSize: 11.5, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, color: '#0284c7' }}>{log.ipAddress}</code>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 22 }}>
              <button
                className="admin-btn admin-btn-outline"
                style={{ padding: '8px 18px', fontSize: 13, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1, borderRadius: 8 }}
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                ← Trang trước
              </button>
              <span style={{ fontSize: 13, color: 'var(--a-text-muted)', fontWeight: 700 }}>
                Trang {page} / {totalPages}
              </span>
              <button
                className="admin-btn admin-btn-primary"
                style={{ padding: '8px 18px', fontSize: 13, cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1, borderRadius: 8 }}
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Trang sau →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
