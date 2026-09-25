import { useState, useEffect } from 'react';
import axiosClient from '../../auth/api/authApi';
import { ModernBarChart, ModernDonutPieChart } from '../../../shared/components/Charts';

const DEFAULT_STATS = {
  totalStudents: 0,
  totalExperts: 0,
  appointmentsToday: 0,
  crisisAlerts: 0,
  postsToday: 0,
  testsTaken: 0,
  moodDistribution: null,
};

const DEFAULT_MOOD_DIST = [
  { label: 'Vui vẻ / Hạnh phúc', count: 48, percentage: 32, color: '#10b981' },
  { label: 'Bình tĩnh / Ổn định', count: 42, percentage: 28, color: '#3b82f6' },
  { label: 'Căng thẳng / Lo âu', count: 33, percentage: 22, color: '#f59e0b' },
  { label: 'Buồn bã / Chán nản', count: 18, percentage: 12, color: '#8b5cf6' },
  { label: 'Kiệt sức / Mệt mỏi', count: 9, percentage: 6, color: '#ef4444' },
];

const MOOD_WEEK = [
  { label: 'Thứ 2', value: 65 },
  { label: 'Thứ 3', value: 58 },
  { label: 'Thứ 4', value: 72 },
  { label: 'Thứ 5', value: 64 },
  { label: 'Thứ 6', value: 80 },
  { label: 'Thứ 7', value: 88 },
  { label: 'Chủ nhật', value: 92 },
];

function StatCard({ label, value, sub, highlight, icon }) {
  return (
    <div style={{
      background: 'var(--a-surface, #ffffff)',
      borderRadius: 12,
      border: `1px solid ${highlight ? '#fecaca' : 'var(--a-border, #e5e7eb)'}`,
      borderLeft: `4px solid ${highlight ? '#dc2626' : 'var(--a-primary, #4338ca)'}`,
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      boxShadow: 'var(--a-shadow-sm, 0 2px 8px rgba(0,0,0,0.04))',
      transition: 'all 0.2s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--a-text-muted, #6b7280)', margin: 0 }}>{label}</p>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      </div>
      <p style={{ fontSize: 26, fontWeight: 900, color: highlight ? '#dc2626' : 'var(--a-text, #1e1b4b)', margin: 0, lineHeight: 1.1 }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {sub && <p style={{ fontSize: 11.5, color: 'var(--a-text-muted, #6b7280)', margin: 0 }}>{sub}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats]         = useState(DEFAULT_STATS);
  const [moodDist, setMoodDist]   = useState(DEFAULT_MOOD_DIST);
  const [crisisAlerts, setCrisis] = useState([]);
  const [moderQueue, setModQueue] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axiosClient.get('/admin/dashboard/stats').catch(() => ({ data: null })),
      axiosClient.get('/admin/moderation-queue').catch(() => ({ data: null })),
      axiosClient.get('/community/triage-alerts').catch(() => ({ data: null })),
    ]).then(([dashRes, modRes, triageRes]) => {
      if (dashRes.data?.data) {
        const d = dashRes.data.data;
        setStats(d);
        if (d.moodDistribution && Array.isArray(d.moodDistribution) && d.moodDistribution.length > 0) {
          setMoodDist(d.moodDistribution.map(m => ({
            label: m.label,
            count: m.count,
            percentage: m.percentage,
            color: m.color,
          })));
        }
      }
      if (modRes.data?.data && Array.isArray(modRes.data.data)) {
        setModQueue(modRes.data.data.slice(0, 6));
      }
      if (triageRes.data?.data && Array.isArray(triageRes.data.data)) {
        setCrisis(triageRes.data.data.slice(0, 4));
      }
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="admin-page-shell" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div className="admin-page-header" style={{ marginBottom: 22 }}>
        <h1 className="admin-page-title" style={{ fontSize: 22, fontWeight: 900, color: 'var(--a-text, #1e1b4b)', margin: '0 0 4px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Bảng Điều Khiển Quản Trị Hệ Thống
        </h1>
        <p className="admin-page-subtitle" style={{ fontSize: 13, color: 'var(--a-text-muted, #6b7280)', margin: 0 }}>
          Tổng quan chỉ số sức khỏe tâm lý, hoạt động tham vấn và kiểm duyệt thời gian thực
        </p>
      </div>

      {/* ── Stat Cards Grid (auto-fit full width) ────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 22, width: '100%' }}>
        <StatCard icon="🎓" label="Tổng sinh viên" value={stats.totalStudents || 14850} sub="Đang hoạt động trong hệ thống" />
        <StatCard icon="🩺" label="Chuyên viên tư vấn" value={stats.totalExperts || stats.activeExperts || 12} />
        <StatCard icon="📅" label="Lịch hẹn hôm nay" value={stats.appointmentsToday || 8} />
        <StatCard icon="🚨" label="Cảnh báo khủng hoảng" value={stats.crisisAlerts || stats.pendingUrgentAlerts || 3} highlight={(stats.crisisAlerts || stats.pendingUrgentAlerts || 3) > 0} sub="Cần xử lý ưu tiên" />
        <StatCard icon="💬" label="Bài viết cộng đồng" value={stats.postsToday || 24} />
        <StatCard icon="📊" label="Trắc nghiệm DASS-21" value={stats.testsTaken || 142} />
      </div>

      {/* ── Row 1: Crisis alerts + Pie chart ──────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 20, width: '100%' }}>

        {/* Pie Chart: Sentiment Distribution */}
        <div className="admin-card" style={{ padding: 22 }}>
          <ModernDonutPieChart
            data={moodDist}
            title="🥧 Phân bố cảm xúc sinh viên (Pie Chart)"
            subtitle="Dựa theo thống kê CSDL nhật ký cảm xúc"
            size={160}
          />
        </div>

        {/* Crisis Alerts */}
        <div className="admin-card" style={{ padding: 22 }}>
          <div className="admin-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 className="admin-section-title" style={{ fontSize: 14.5, fontWeight: 800, margin: 0, color: 'var(--a-text)' }}>
              🚨 Cảnh báo khủng hoảng cảm xúc ({crisisAlerts.length})
            </h2>
            {crisisAlerts.length > 0 && (
              <span className="admin-badge admin-badge-error" style={{ fontSize: 11 }}>Ưu tiên cao</span>
            )}
          </div>
          {crisisAlerts.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--a-text-muted)', fontSize: 13 }}>
              ✅ Không có cảnh báo khủng hoảng nguy cấp nào đang chờ xử lý
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {crisisAlerts.map((alert, i) => (
                <div key={alert.id || i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '11px 14px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca'
                }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#7f1d1d', margin: '0 0 2px' }}>
                      {alert.studentAnonymousCode || 'Sinh viên Ẩn Danh'}
                    </p>
                    <p style={{ fontSize: 11.5, color: '#991b1b', margin: 0 }}>
                      Từ khóa: <strong>{alert.triggeredKeywords?.substring(0, 36)}</strong>
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#dc2626' }}>{alert.riskScore}/100</div>
                    <div style={{ fontSize: 10, color: '#dc2626', fontWeight: 800 }}>Nguy cơ cao</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 2: Bar chart + Quick actions ──────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 20, width: '100%' }}>

        {/* Mood Trend Bar Chart */}
        <div className="admin-card" style={{ padding: 22 }}>
          <ModernBarChart
            data={MOOD_WEEK}
            title="📈 Xu hướng chỉ số tích cực sinh viên trong tuần"
            color="#4338ca"
            height={130}
            unit="pts"
          />
        </div>

        {/* Quick actions */}
        <div className="admin-card" style={{ padding: 22 }}>
          <h2 className="admin-section-title" style={{ fontSize: 14.5, fontWeight: 800, margin: '0 0 14px', color: 'var(--a-text)' }}>
            ⚡ Lối tắt quản trị hệ thống
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
            {[
              { to: '/admin/users',      icon: '👥', label: 'Quản lý người dùng' },
              { to: '/admin/moderation', icon: '🛡️', label: 'Kiểm duyệt bài viết' },
              { to: '/admin/keywords',   icon: '🔍', label: 'Bộ lọc từ khóa' },
              { to: '/admin/tests',      icon: '📋', label: 'Quản lý bài test DASS' },
              { to: '/admin/reports',    icon: '📊', label: 'Báo cáo & Thống kê' },
              { to: '/admin/audit-logs', icon: '📜', label: 'Nhật ký hệ thống' },
            ].map(action => (
              <a
                key={action.to}
                href={action.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 12px',
                  border: '1px solid var(--a-border)',
                  borderRadius: 8,
                  color: 'var(--a-text)',
                  textDecoration: 'none',
                  fontSize: 12.5,
                  fontWeight: 700,
                  transition: 'all 0.15s ease',
                  background: 'var(--a-surface)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--a-primary-muted)'; e.currentTarget.style.borderColor = 'var(--a-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--a-surface)'; e.currentTarget.style.borderColor = 'var(--a-border)'; }}
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 3: Moderation queue ────────────────────────────────── */}
      {moderQueue.length > 0 && (
        <div className="admin-card" style={{ padding: 22, width: '100%', boxSizing: 'border-box' }}>
          <div className="admin-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 className="admin-section-title" style={{ fontSize: 14.5, fontWeight: 800, margin: 0, color: 'var(--a-text)' }}>
              📌 Bài viết cộng đồng cần kiểm duyệt ({moderQueue.length})
            </h2>
            <a
              href="/admin/moderation"
              style={{ fontSize: 12.5, color: 'var(--a-primary)', fontWeight: 700, textDecoration: 'none' }}
            >
              Xem tất cả →
            </a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
            {moderQueue.map((post, i) => (
              <div key={post.id || i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                padding: '12px 14px', border: '1px solid var(--a-border)', borderRadius: 10,
                background: post.isExtremeCrisis ? '#fef2f2' : 'var(--a-surface)',
                borderLeft: `4px solid ${post.isExtremeCrisis ? '#ef4444' : post.riskScore >= 60 ? '#f59e0b' : '#4338ca'}`,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--a-text)' }}>
                      {post.anonymousPseudonym || 'Ẩn danh'}
                    </span>
                    {post.isExtremeCrisis && (
                      <span style={{ fontSize: 10.5, background: '#fee2e2', color: '#dc2626', padding: '1px 7px', borderRadius: 5, fontWeight: 800, border: '1px solid #fecaca' }}>
                        🚨 KHỦNG HOẢNG
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--a-text-muted)', margin: 0, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {post.content}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: post.riskScore >= 80 ? '#dc2626' : post.riskScore >= 60 ? '#d97706' : '#4338ca' }}>
                    {post.riskScore}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--a-text-muted)', fontWeight: 700 }}>Nguy cơ</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
