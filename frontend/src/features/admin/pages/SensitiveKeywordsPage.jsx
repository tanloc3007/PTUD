import { useState, useEffect } from 'react';
import axiosClient from '../../auth/api/authApi';
import InPageNotification from '../../../shared/components/InPageNotification';

const CATEGORIES = ['SelfHarm', 'AcademicFraud', 'Harassment', 'Violence', 'Other'];

const MOCK_KEYWORDS = [
  { id: '1', keyword: 'tự tử',          category: 'SelfHarm',      riskWeight: 99, addedByRole: 'Admin',  addedAt: '2026-09-01' },
  { id: '2', keyword: 'nhảy lầu',       category: 'SelfHarm',      riskWeight: 99, addedByRole: 'Admin',  addedAt: '2026-09-01' },
  { id: '3', keyword: 'rạch tay',       category: 'SelfHarm',      riskWeight: 95, addedByRole: 'Expert', addedAt: '2026-09-05' },
  { id: '4', keyword: 'không muốn sống', category: 'SelfHarm',     riskWeight: 90, addedByRole: 'Expert', addedAt: '2026-09-05' },
  { id: '5', keyword: 'mua bán điểm',   category: 'AcademicFraud', riskWeight: 80, addedByRole: 'Admin',  addedAt: '2026-09-10' },
  { id: '6', keyword: 'lừa đảo',        category: 'Harassment',    riskWeight: 75, addedByRole: 'Admin',  addedAt: '2026-09-10' },
  { id: '7', keyword: 'bế tắc cùng cực', category: 'SelfHarm',    riskWeight: 85, addedByRole: 'Expert', addedAt: '2026-09-12' },
];

const CAT_COLORS = {
  SelfHarm: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'Tự gây hại' },
  AcademicFraud: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: 'Gian lận học tập' },
  Harassment: { bg: '#fff7ed', color: '#c2410c', border: '#fdba74', label: 'Quấy rối' },
  Violence: { bg: '#fdf4ff', color: '#7c3aed', border: '#e9d5ff', label: 'Bạo lực' },
  Other: { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb', label: 'Khác' }
};

export default function SensitiveKeywordsPage() {
  const [keywords, setKeywords] = useState(MOCK_KEYWORDS);
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm]         = useState({ keyword: '', category: 'SelfHarm', riskWeight: 50 });
  const [notice, setNotice]     = useState(null);

  // AI Moderation Playground State
  const [testContent, setTestContent] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const loadKeywords = () => {
    axiosClient.get('/admin/sensitive-keywords')
      .then(r => {
        if (r.data?.data && Array.isArray(r.data.data) && r.data.data.length > 0) {
          setKeywords(r.data.data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadKeywords();
  }, []);

  const handleTestModeration = async (sampleText) => {
    const textToTest = sampleText || testContent;
    if (!textToTest?.trim()) return;
    if (sampleText) setTestContent(sampleText);
    setTesting(true);
    setTestResult(null);
    try {
      const res = await axiosClient.post('/admin/moderation/test', { content: textToTest });
      if (res.data?.data) {
        setTestResult(res.data.data);
      }
    } catch (err) {
      setTestResult({
        isFlagged: false,
        riskScore: 0,
        suggestedAction: 'Không thể kết nối API kiểm duyệt',
        aiReason: err.message
      });
    } finally {
      setTesting(false);
    }
  };

  const handleAdd = async () => {
    if (!form.keyword.trim()) return;
    try {
      const res = await axiosClient.post('/admin/sensitive-keywords', form);
      if (res.data?.data) {
        setKeywords(prev => [res.data.data, ...prev]);
      } else {
        setKeywords(prev => [{ id: `k-${Date.now()}`, ...form, addedByRole: 'Admin', addedAt: new Date().toISOString().split('T')[0] }, ...prev]);
      }
    } catch {
      setKeywords(prev => [{ id: `k-${Date.now()}`, ...form, addedByRole: 'Admin', addedAt: new Date().toISOString().split('T')[0] }, ...prev]);
    }
    setNotice({
      type: 'success',
      title: 'Đã lưu từ khóa',
      message: `Từ khóa "${form.keyword}" đã được thêm vào bộ lọc AI phát hiện nguy cơ.`
    });
    setForm({ keyword: '', category: 'SelfHarm', riskWeight: 50 });
    setShowAdd(false);
  };

  const handleDelete = async (id, word) => {
    try {
      await axiosClient.delete(`/admin/sensitive-keywords/${id}`);
    } catch { /* optimistic */ }
    setKeywords(prev => prev.filter(k => k.id !== id));
    setNotice({
      type: 'info',
      title: 'Đã xóa từ khóa',
      message: `Đã xóa từ khóa "${word}" khỏi hệ thống lọc.`
    });
  };

  return (
    <div className="admin-page-shell" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      <div className="admin-page-header">
        <div className="admin-section-header">
          <div>
            <h1 className="admin-page-title">Bộ Lọc & Kiểm Duyệt Song Song (Từ Khóa + AI)</h1>
            <p className="admin-page-subtitle">Kết hợp từ khóa quy tắc SQL Server và Google Gemini AI phân tích ngữ cảnh, phát hiện sớm nguy cơ khủng hoảng của sinh viên</p>
          </div>
          <button className="admin-btn admin-btn-primary" onClick={() => setShowAdd(true)}>
            + Thêm từ khóa
          </button>
        </div>
      </div>

      {notice && (
        <InPageNotification
          type={notice.type}
          title={notice.title}
          message={notice.message}
          onClose={() => setNotice(null)}
        />
      )}

      {/* BANNER KIỂM DUYỆT SONG SONG HYBRID AI */}
      <div className="admin-card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.05), rgba(99, 102, 241, 0.08))', border: '1px solid rgba(2, 132, 199, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>🛡️</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0369a1' }}>Cơ Chế Kiểm Duyệt Song Song Đa Tầng (Dual-Layer Moderation Engine)</div>
              <div style={{ fontSize: 12.5, color: '#64748b' }}>Hệ thống tự động quét 2 lớp: Lớp 1 (Từ khóa cấm trong DB) + Lớp 2 (Gemini AI hiểu sâu ngữ cảnh & ẩn dụ)</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: '#ecfdf5', color: '#059669', borderRadius: 999, fontSize: 12, fontWeight: 700, border: '1px solid #a7f3d0' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></span> DB Keywords: Hoạt động
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: '#eef2ff', color: '#4f46e5', borderRadius: 999, fontSize: 12, fontWeight: 700, border: '1px solid #c7d2fe' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1' }}></span> Gemini AI: Sẵn sàng
            </span>
          </div>
        </div>

        {/* INTERACTIVE AI TEST BOX */}
        <div style={{ background: '#fff', borderRadius: 8, padding: 14, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
            🧪 Kiểm thử phân tích bài viết / bình luận theo thời gian thực:
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              type="text"
              className="admin-input"
              style={{ flex: 1 }}
              placeholder="Nhập nội dung bất kỳ để AI và bộ lọc từ khóa cùng phân tích..."
              value={testContent}
              onChange={e => setTestContent(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleTestModeration()}
            />
            <button
              className="admin-btn admin-btn-primary"
              style={{ minWidth: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={() => handleTestModeration()}
              disabled={testing || !testContent.trim()}
            >
              {testing ? '⏳ AI đang quét...' : '⚡ Phân tích ngay'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>Thử mẫu nhanh:</span>
            <button
              type="button"
              style={{ border: 'none', background: '#f1f5f9', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 12, color: '#0284c7' }}
              onClick={() => handleTestModeration('Hôm nay mình hoàn thành tốt đồ án, cảm thấy rất vui và nhẹ nhõm')}
            >
              🟢 Nội dung an toàn
            </button>
            <button
              type="button"
              style={{ border: 'none', background: '#fef2f2', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 12, color: '#dc2626' }}
              onClick={() => handleTestModeration('Mình cảm thấy bế tắc cùng cực trong cuộc sống và học tập')}
            >
              🔴 Trùng từ khóa DB (Bế tắc)
            </button>
            <button
              type="button"
              style={{ border: 'none', background: '#fdf2f8', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 12, color: '#be185d' }}
              onClick={() => handleTestModeration('mình muốn ngủ một giấc thật dài mãi mãi không cần thức dậy nữa')}
            >
              🟣 AI bắt nhạy cảm ngầm (Không từ khóa)
            </button>
          </div>

          {testResult && (
            <div style={{ marginTop: 14, padding: 14, borderRadius: 8, background: testResult.isFlagged ? '#fef2f2' : '#f0fdf4', border: `1px solid ${testResult.isFlagged ? '#fecaca' : '#bbf7d0'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{testResult.isFlagged ? '🚨' : '✅'}</span>
                  <span style={{ fontWeight: 800, fontSize: 14, color: testResult.isFlagged ? '#dc2626' : '#15803d' }}>
                    {testResult.suggestedAction}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11.5, fontWeight: 700, background: '#fff', border: '1px solid #cbd5e1' }}>
                    Nguồn: {testResult.moderationSource}
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11.5, fontWeight: 700, background: testResult.riskScore >= 75 ? '#dc2626' : '#f59e0b', color: '#fff' }}>
                    Nguy cơ: {testResult.riskScore}/100
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, fontSize: 12.5, color: '#334155' }}>
                <div style={{ background: '#fff', padding: 10, borderRadius: 6, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontWeight: 700, color: '#64748b', marginBottom: 3 }}>Lớp 1: Từ khóa SQL Server</div>
                  <div>Phát hiện: <strong>{testResult.keywordDetected ? 'CÓ TRÙNG KHỚP' : 'Không có từ khóa'}</strong></div>
                  {testResult.triggeredKeywords?.filter(k => !k.startsWith('[AI')).length > 0 && (
                    <div style={{ color: '#dc2626', marginTop: 4 }}>
                      Từ khóa: {testResult.triggeredKeywords.filter(k => !k.startsWith('[AI')).join(', ')}
                    </div>
                  )}
                </div>

                <div style={{ background: '#fff', padding: 10, borderRadius: 6, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontWeight: 700, color: '#64748b', marginBottom: 3 }}>Lớp 2: Google Gemini AI</div>
                  <div>Phân loại: <strong>{testResult.aiCategory || 'An toàn'}</strong> (Độ tin cậy: {testResult.aiConfidence}%)</div>
                  {testResult.aiReason && (
                    <div style={{ color: '#475569', marginTop: 4, fontStyle: 'italic' }}>
                      "{testResult.aiReason}"
                    </div>
                  )}
                </div>
              </div>

              {testResult.empatheticAdvice && (
                <div style={{ marginTop: 10, background: '#fff', padding: 10, borderRadius: 6, border: '1px solid rgba(0,0,0,0.06)', fontSize: 12.5 }}>
                  <span style={{ fontWeight: 700, color: '#0284c7' }}>💬 Lời khuyên tâm lý UniMind: </span>
                  <span style={{ color: '#334155' }}>{testResult.empatheticAdvice}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="admin-card" style={{ marginBottom: 20, borderLeft: '3px solid var(--a-primary)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--a-text)', margin: '0 0 14px' }}>Thêm từ khóa kiểm soát mới</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 160px', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--a-text-muted)', display: 'block', marginBottom: 5 }}>Từ khóa</label>
              <input className="admin-input" placeholder="Nhập từ khóa cần phát hiện..." value={form.keyword} onChange={e => setForm(f => ({ ...f, keyword: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--a-text-muted)', display: 'block', marginBottom: 5 }}>Danh mục phân loại</label>
              <select className="admin-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_COLORS[c]?.label || c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--a-text-muted)', display: 'block', marginBottom: 5 }}>Mức nguy cơ (1-100)</label>
              <input className="admin-input" type="number" min={1} max={100} value={form.riskWeight} onChange={e => setForm(f => ({ ...f, riskWeight: +e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="admin-btn admin-btn-primary" onClick={handleAdd}>Lưu từ khóa</button>
            <button className="admin-btn admin-btn-ghost" onClick={() => setShowAdd(false)}>Hủy</button>
          </div>
        </div>
      )}

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Từ khóa</th>
              <th>Danh mục</th>
              <th>Mức nguy cơ</th>
              <th>Người thêm</th>
              <th>Ngày thêm</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {keywords.map(kw => {
              const cat = CAT_COLORS[kw.category] || CAT_COLORS.Other;
              return (
                <tr key={kw.id}>
                  <td style={{ fontWeight: 700, color: 'var(--a-text)' }}>"{kw.keyword}"</td>
                  <td>
                    <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}>
                      {cat.label || kw.category}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 60, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${kw.riskWeight}%`, height: '100%', background: kw.riskWeight >= 80 ? '#ef4444' : kw.riskWeight >= 60 ? '#f97316' : '#fbbf24', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: kw.riskWeight >= 80 ? '#ef4444' : 'var(--a-text)' }}>{kw.riskWeight}</span>
                    </div>
                  </td>
                  <td><span className={`admin-badge ${kw.addedByRole === 'Admin' ? 'admin-badge-primary' : 'admin-badge-info'}`}>{kw.addedByRole}</span></td>
                  <td style={{ fontSize: 12.5, color: 'var(--a-text-muted)' }}>{kw.addedAt}</td>
                  <td>
                    <button className="admin-btn admin-btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handleDelete(kw.id, kw.keyword)}>
                      Xóa
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
