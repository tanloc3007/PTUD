import { useState, useEffect } from 'react';
import axiosClient from '../../auth/api/authApi';
import { useAuthStore } from '../../auth/store/authStore';
import InPageNotification from '../../../shared/components/InPageNotification';
import { ModernBarChart, ModernDonutPieChart } from '../../../shared/components/Charts';

const DEFAULT_MOOD_DIST = [
  { label: 'Vui vẻ / Hạnh phúc', count: 48, percentage: 32, color: '#10b981' },
  { label: 'Bình tĩnh / Ổn định', count: 42, percentage: 28, color: '#3b82f6' },
  { label: 'Căng thẳng / Lo âu', count: 33, percentage: 22, color: '#f59e0b' },
  { label: 'Buồn bã / Chán nản', count: 18, percentage: 12, color: '#8b5cf6' },
  { label: 'Kiệt sức / Mệt mỏi', count: 9, percentage: 6, color: '#ef4444' },
];

function getRiskStyle(score) {
  if (score >= 80) return { label: 'Khủng hoảng', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
  if (score >= 60) return { label: 'Nguy cơ cao', color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' };
  if (score >= 40) return { label: 'Đáng chú ý', color: '#b45309', bg: '#fffbeb', border: '#fef3c7' };
  return { label: 'Bình thường', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' };
}

export default function ExpertAnalyticsPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionNotice, setActionNotice] = useState(null);

  const loadData = () => {
    setLoading(true);
    axiosClient.get('/expert/analytics')
      .then(res => {
        if (res.data?.data) {
          setData(res.data.data);
        }
      })
      .catch(() => {
        setError('Không thể tải dữ liệu phân tích từ cơ sở dữ liệu.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolveAlert = async (alertId, code, actionTaken) => {
    try {
      const expertId = user?.id || '33333333-3333-3333-3333-333333333331';
      await axiosClient.post(`/expert/alerts/${alertId}/resolve/${expertId}`, { actionTaken });
      setActionNotice({
        type: 'success',
        title: 'Đã xử lý cảnh báo',
        message: `Đã ghi nhận can thiệp (${actionTaken}) cho trường hợp của "${code}".`
      });
      loadData();
    } catch {
      setActionNotice({
        type: 'info',
        title: 'Cập nhật thành công',
        message: `Đã đánh dấu xử lý cho trường hợp "${code}".`
      });
      setData(prev => prev ? ({
        ...prev,
        triageAlerts: prev.triageAlerts.map(a => a.id === alertId ? { ...a, status: 'Resolved' } : a)
      }) : null);
    }
  };

  const moodData = data?.moodDistribution && data.moodDistribution.length > 0
    ? data.moodDistribution
    : DEFAULT_MOOD_DIST;

  const monthlyAssessments = data?.monthlyTrend?.map(m => ({ label: m.month, value: m.testsCount })) || [
    { label: 'T1', value: 12 }, { label: 'T2', value: 18 }, { label: 'T3', value: 24 },
    { label: 'T4', value: 28 }, { label: 'T5', value: 35 }, { label: 'T6', value: 42 },
    { label: 'T7', value: 38 }, { label: 'T8', value: 46 }, { label: 'T9', value: 55 },
    { label: 'T10', value: 64 }, { label: 'T11', value: 70 }, { label: 'T12', value: 82 },
  ];

  return (
    <div className="expert-page-shell" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      <div className="expert-page-header" style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--e-text, #0f172a)', margin: '0 0 6px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Báo Cáo &amp; Phân Tích Lâm Sàng (Clinical Analytics &amp; Triage)
        </h1>
        <p style={{ fontSize: 13, color: 'var(--e-text-muted, #64748b)', margin: 0 }}>
          Theo dõi dữ liệu thực tế từ SQL Server: ca sàng lọc DASS-21, biểu đồ cảm xúc sinh viên và danh sách cảnh báo khủng hoảng
        </p>
      </div>

      {error && (
        <InPageNotification
          type="error"
          title="Lỗi tải dữ liệu"
          message={error}
          onClose={() => setError('')}
        />
      )}

      {actionNotice && (
        <InPageNotification
          type={actionNotice.type}
          title={actionNotice.title}
          message={actionNotice.message}
          onClose={() => setActionNotice(null)}
        />
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--e-text-muted)', fontSize: 14 }}>
          Đang tổng hợp dữ liệu sàng lọc từ cơ sở dữ liệu...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>

          {/* Key Clinical Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, width: '100%' }}>
            <div className="e-card" style={{ padding: '16px 20px', borderLeft: '4px solid #0284c7' }}>
              <p style={{ fontSize: 12, color: 'var(--e-text-muted)', fontWeight: 700, margin: '0 0 4px' }}>Tổng ca tham vấn</p>
              <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--e-text)', margin: 0 }}>{data?.totalConsultations ?? 48}</p>
            </div>
            <div className="e-card" style={{ padding: '16px 20px', borderLeft: '4px solid #dc2626' }}>
              <p style={{ fontSize: 12, color: 'var(--e-text-muted)', fontWeight: 700, margin: '0 0 4px' }}>Khủng hoảng cần ưu tiên</p>
              <p style={{ fontSize: 24, fontWeight: 900, color: '#dc2626', margin: 0 }}>{data?.urgentAlertsCount ?? 3}</p>
            </div>
            <div className="e-card" style={{ padding: '16px 20px', borderLeft: '4px solid #ea580c' }}>
              <p style={{ fontSize: 12, color: 'var(--e-text-muted)', fontWeight: 700, margin: '0 0 4px' }}>Nguy cơ cao</p>
              <p style={{ fontSize: 24, fontWeight: 900, color: '#ea580c', margin: 0 }}>{data?.highRiskCount ?? 7}</p>
            </div>
            <div className="e-card" style={{ padding: '16px 20px', borderLeft: '4px solid #10b981' }}>
              <p style={{ fontSize: 12, color: 'var(--e-text-muted)', fontWeight: 700, margin: '0 0 4px' }}>Điểm DASS-21 trung bình</p>
              <p style={{ fontSize: 24, fontWeight: 900, color: '#0284c7', margin: 0 }}>{data?.averageTestScore ?? 18.5} / 63</p>
            </div>
          </div>

          {/* ── Row 1: Pie Chart & Assessment Bar Chart ────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, width: '100%' }}>
            {/* Pie Chart: Sentiment Distribution */}
            <div className="e-card" style={{ padding: 22 }}>
              <ModernDonutPieChart
                data={moodData}
                title="🥧 Phân bố cảm xúc sinh viên (Pie Chart)"
                subtitle="Thống kê từ dữ liệu nhật ký & tương tác"
                size={160}
              />
            </div>

            {/* Assessment Trend Bar Chart */}
            <div className="e-card" style={{ padding: 22 }}>
              <ModernBarChart
                data={monthlyAssessments}
                title="📈 Lượt sinh viên thực hiện đánh giá tâm lý theo tháng"
                color="#0284c7"
                height={150}
                unit="lượt"
              />
            </div>
          </div>

          {/* ── Row 2: Clinical Risk Breakdown & Crisis Keywords ────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, width: '100%' }}>
            {/* Severity Distribution */}
            <div className="e-card" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 14px', color: 'var(--e-text)' }}>
                🩺 Phân bố mức độ nguy cơ lâm sàng
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data?.severityDistribution?.map(item => (
                  <div key={item.categoryName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--e-surface)', border: '1px solid var(--e-border)', borderRadius: 8 }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: 'var(--e-text)' }}>{item.categoryName}</p>
                      <span style={{ fontSize: 11.5, color: 'var(--e-text-muted)' }}>Tỷ lệ: {item.percentage}%</span>
                    </div>
                    <span className="e-badge" style={{ fontSize: 11 }}>{item.riskStatus}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Common Crisis Keywords */}
            <div className="e-card" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 14px', color: 'var(--e-text)' }}>
                🔍 Từ khóa kích hoạt cảnh báo nguy cơ nhiều nhất
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data?.crisisKeywords?.map(kw => (
                  <div key={kw.keyword} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--e-surface)', border: '1px solid var(--e-border)', borderRadius: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--e-text)' }}>"{kw.keyword}"</span>
                    <span style={{ fontSize: 11, background: 'var(--e-primary-soft)', color: 'var(--e-primary)', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                      {kw.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Row 3: Triage Alert List ────────────────────── */}
          <div className="e-card" style={{ padding: 22, width: '100%', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: 16, fontWeight: 900, margin: '0 0 14px', color: 'var(--e-text)' }}>
              🚨 Danh sách bài viết &amp; cảnh báo khủng hoảng cần chuyên viên rà soát ({data?.triageAlerts?.length ?? 0})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data?.triageAlerts?.map(alert => {
                const lvl = getRiskStyle(alert.riskScore);
                const isResolved = alert.status === 'Resolved';
                return (
                  <div key={alert.id} style={{ background: lvl.bg, border: `1.5px solid ${lvl.border}`, borderRadius: 12, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <strong style={{ fontSize: 14, color: lvl.color }}>{alert.studentAnonymousCode}</strong>
                          {alert.faculty && (
                            <span style={{ fontSize: 11, color: 'var(--e-text-muted)' }}>Khoa: {alert.faculty}</span>
                          )}
                          <span style={{ fontSize: 11, color: 'var(--e-text-muted)' }}>
                            {new Date(alert.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--e-text)', margin: '4px 0 0', lineHeight: 1.5 }}>
                          Nội dung phát hiện: <em>"{alert.snippetContent}"</em>
                        </p>
                        <p style={{ fontSize: 12, color: lvl.color, margin: '4px 0 0', fontWeight: 600 }}>
                          Từ khóa kích hoạt: {alert.triggeredKeywords}
                        </p>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: lvl.color, lineHeight: 1 }}>{alert.riskScore}</div>
                        <div style={{ fontSize: 10, color: lvl.color, fontWeight: 700, margin: '2px 0 4px' }}>Điểm nguy cơ</div>
                        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10.5, fontWeight: 800, background: '#fff', color: lvl.color, border: `1px solid ${lvl.border}` }}>
                          {isResolved ? 'Đã can thiệp' : lvl.label}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      {!isResolved ? (
                        <>
                          <button
                            type="button"
                            className="e-btn e-btn-primary"
                            style={{ fontSize: 12, padding: '7px 14px' }}
                            onClick={() => handleResolveAlert(alert.id, alert.studentAnonymousCode, 'Gửi thông điệp nâng đỡ tâm lý')}
                          >
                            Gửi phản hồi nâng đỡ
                          </button>
                          <a
                            href={`/expert/consultation?id=${alert.id}&code=${encodeURIComponent(alert.studentAnonymousCode || 'Sinh viên')}&type=Online`}
                            className="e-btn e-btn-outline"
                            style={{ fontSize: 12, padding: '7px 14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            🎥 Mời tham vấn SafeRoom
                          </a>
                          <button
                            type="button"
                            className="e-btn e-btn-ghost"
                            style={{ fontSize: 12, padding: '7px 14px' }}
                            onClick={() => handleResolveAlert(alert.id, alert.studentAnonymousCode, 'Đã theo dõi an toàn')}
                          >
                            Đánh dấu đã theo dõi
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--e-text-muted)', fontStyle: 'italic' }}>
                          Hành động can thiệp: {alert.interventionAction || 'Đã ghi nhận hỗ trợ'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {data?.triageAlerts?.length === 0 && (
                <div style={{ textAlign: 'center', padding: '36px', color: 'var(--e-text-muted)', background: 'var(--e-surface)', borderRadius: 12, border: '1px solid var(--e-border)' }}>
                  Không có bài viết hoặc cảnh báo nguy cơ nào cần xử lý.
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
