import { useState, useEffect, useCallback } from 'react';
import { getAuditLogs, getAuditLogHistory, getAuditLogFilterOptions } from '../api/adminApi';

const ACTION_META = {
  STUDENT_REGISTERED:     { icon: '👤', color: '#0d9488', label: 'Đăng ký sinh viên' },
  USER_PROVISIONED:       { icon: '🔑', color: '#0284c7', label: 'Cấp tài khoản' },
  APPOINTMENT_SCHEDULED:  { icon: '📅', color: '#7c3aed', label: 'Đặt lịch hẹn' },
  KEYWORD_ADDED:          { icon: '🔍', color: '#d97706', label: 'Thêm từ khóa' },
  CRISIS_TRIAGE_FLAGGED:  { icon: '🚨', color: '#dc2626', label: 'Cảnh báo AI' },
  ROLE_CHANGED:           { icon: '🔒', color: '#6366f1', label: 'Thay đổi quyền' },
  SYSTEM:                 { icon: '⚙️', color: '#64748b', label: 'Hệ thống' },
};

function getMeta(actionType) {
  return ACTION_META[actionType] || { icon: '📋', color: '#64748b', label: actionType };
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

  return (
    <div className="admin-page-shell" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">Nhật Ký Hoạt Động Hệ Thống</h1>
        <p className="admin-page-subtitle">
          Giám sát toàn bộ thao tác bảo mật, thay đổi dữ liệu và xử lý sự kiện — tổng hợp từ SQL Server
        </p>
      </div>

      {/* Stat Pills */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Tổng bản ghi', value: totalCount, color: '#0284c7' },
          { label: 'Đang hiển thị', value: filtered.length, color: '#7c3aed' },
          { label: 'Nhóm theo ngày', value: groups.length, color: '#0d9488' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--a-card)', border: '1px solid var(--a-border)',
            borderRadius: 10, padding: '10px 18px', display: 'flex', flexDirection: 'column', gap: 2
          }}>
            <span style={{ fontSize: 11, color: 'var(--a-text-muted)', fontWeight: 600 }}>{s.label}</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="admin-card" style={{ padding: '14px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="admin-input"
            placeholder="🔍  Tìm theo hành động, người thực hiện, đối tượng..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 260 }}
          />
          <select
            className="admin-input"
            style={{ width: 'auto', minWidth: 180 }}
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả loại thao tác</option>
            {actionTypes.map(a => (
              <option key={a} value={a}>{getMeta(a).icon} {getMeta(a).label}</option>
            ))}
          </select>
          <select
            className="admin-input"
            style={{ width: 'auto', minWidth: 130 }}
            value={monthFilter}
            onChange={e => { setMonthFilter(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả tháng</option>
            {MONTHS.map((m, i) => <option key={i + 1} value={String(i + 1)}>{m}</option>)}
          </select>
          <select
            className="admin-input"
            style={{ width: 'auto', minWidth: 100 }}
            value={yearFilter}
            onChange={e => { setYearFilter(e.target.value); setPage(1); }}
          >
            {YEARS.map(y => <option key={y} value={y}>Năm {y}</option>)}
          </select>
          <button
            className="admin-btn admin-btn-outline"
            onClick={() => { setSearch(''); setActionFilter(''); setMonthFilter(''); setYearFilter(new Date().getFullYear().toString()); setPage(1); }}
            style={{ padding: '9px 16px', fontSize: 13, cursor: 'pointer' }}
          >
            ↺ Đặt lại
          </button>
        </div>
      </div>

      {/* Timeline Log */}
      {loading ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--a-text-muted)', fontSize: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          Đang tải nhật ký hoạt động từ cơ sở dữ liệu...
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-card" style={{ padding: '48px 0', textAlign: 'center', color: 'var(--a-text-muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
          <p style={{ margin: 0, fontWeight: 600 }}>Không tìm thấy nhật ký phù hợp</p>
          <p style={{ margin: '4px 0 0', fontSize: 13 }}>Thử thay đổi bộ lọc hoặc đặt lại tìm kiếm</p>
        </div>
      ) : (
        <div>
          {groups.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 28 }}>
              {/* Date Header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14
              }}>
                <div style={{
                  background: 'var(--a-primary)', color: '#fff',
                  borderRadius: 8, padding: '4px 14px', fontSize: 12.5, fontWeight: 800, whiteSpace: 'nowrap'
                }}>
                  {group.dateLabel}
                </div>
                <div style={{ flex: 1, height: 1, background: 'var(--a-border)' }} />
                <span style={{ fontSize: 12, color: 'var(--a-text-muted)', fontWeight: 600 }}>
                  {group.items.length} thao tác
                </span>
              </div>

              {/* Log entries */}
              <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                {group.items.map((log, idx) => {
                  const meta = getMeta(log.actionType);
                  return (
                    <div
                      key={log.id || idx}
                      style={{
                        display: 'flex', gap: 14, padding: '14px 20px',
                        borderBottom: idx < group.items.length - 1 ? '1px solid var(--a-border)' : 'none',
                        alignItems: 'flex-start', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--a-surface)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Icon circle */}
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: meta.color + '18', border: `2px solid ${meta.color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 15, marginTop: 2
                      }}>
                        {meta.icon}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: 11, fontWeight: 800, background: meta.color + '15',
                              color: meta.color, padding: '2px 8px', borderRadius: 5, border: `1px solid ${meta.color}30`
                            }}>
                              {log.actionType}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--a-text)' }}>
                              {log.actorEmail || log.actorRole}
                            </span>
                            {log.actorRole && (
                              <span style={{
                                fontSize: 10.5, background: 'var(--a-surface)',
                                border: '1px solid var(--a-border)', padding: '1px 7px', borderRadius: 4,
                                color: 'var(--a-text-muted)', fontWeight: 600
                              }}>
                                {log.actorRole}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--a-text-muted)' }}>
                              {formatTime(log.createdAt)}
                            </span>
                            <span style={{ fontSize: 10.5, color: 'var(--a-text-muted)' }}>
                              {timeAgo(log.createdAt)}
                            </span>
                          </div>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--a-text)', margin: '0 0 4px', lineHeight: 1.55 }}>
                          {log.details}
                        </p>
                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                          {log.target && (
                            <span style={{ fontSize: 11.5, color: 'var(--a-text-muted)' }}>
                              🎯 Đối tượng: <strong style={{ color: 'var(--a-text)' }}>{log.target}</strong>
                            </span>
                          )}
                          {log.ipAddress && (
                            <span style={{ fontSize: 11.5, color: 'var(--a-text-muted)' }}>
                              🌐 IP: <code style={{ fontSize: 11, background: 'var(--a-surface)', padding: '0 5px', borderRadius: 3 }}>{log.ipAddress}</code>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 20 }}>
              <button
                className="admin-btn admin-btn-outline"
                style={{ padding: '7px 16px', fontSize: 13, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                ← Trang trước
              </button>
              <span style={{ fontSize: 13, color: 'var(--a-text-muted)', fontWeight: 600 }}>
                Trang {page} / {totalPages}
              </span>
              <button
                className="admin-btn admin-btn-primary"
                style={{ padding: '7px 16px', fontSize: 13, cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}
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
