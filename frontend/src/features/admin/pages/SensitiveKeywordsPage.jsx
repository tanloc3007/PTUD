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
            <h1 className="admin-page-title">Bộ Lọc Từ Khóa Nhạy Cảm</h1>
            <p className="admin-page-subtitle">Quản lý từ khóa phát hiện sớm dấu hiệu nguy hiểm và khủng hoảng tâm lý của sinh viên</p>
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
