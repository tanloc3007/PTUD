import { useState, useEffect } from 'react';
import axiosClient from '../../auth/api/authApi';

const MOCK_TESTS = [
  { id: 't1', name: 'DASS-21', desc: 'Depression Anxiety Stress Scale - Đánh giá Trầm cảm, Lo âu và Căng thẳng', questions: 21, status: 'Active', completedCount: 892 },
  { id: 't2', name: 'PHQ-9',   desc: 'Thang đo mức độ trầm cảm tiêu chuẩn lâm sàng PHQ-9',         questions: 9,  status: 'Active', completedCount: 423 },
  { id: 't3', name: 'GAD-7',   desc: 'Thang đo sàng lọc rối loạn lo âu lan tỏa GAD-7',         questions: 7,  status: 'Draft',  completedCount: 0 },
];

export default function TestManagementPage() {
  const [tests, setTests] = useState(MOCK_TESTS);

  useEffect(() => {
    axiosClient.get('/psychological-tests')
      .then(r => {
        if (r.data?.data && Array.isArray(r.data.data) && r.data.data.length > 0) {
          const mapped = r.data.data.map(t => ({
            id: t.id,
            name: t.code || t.title,
            desc: t.description,
            questions: t.questionCount || 21,
            status: 'Active',
            completedCount: 120
          }));
          setTests(mapped);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="admin-page-shell" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      <div className="admin-page-header">
        <div className="admin-section-header">
          <div>
            <h1 className="admin-page-title">Quản Lý Thang Đo &amp; Bài Test</h1>
            <p className="admin-page-subtitle">Tạo và quản lý các thang đo trắc nghiệm tâm lý sinh viên</p>
          </div>
          <button className="admin-btn admin-btn-primary">
            + Tạo bài test mới
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {tests.map(test => (
          <div key={test.id} className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 11, background: 'var(--a-primary-muted)', color: 'var(--a-primary)', padding: '3px 8px', borderRadius: 4, fontWeight: 800 }}>
                Thang đo chuẩn hóa
              </span>
              <span className={`admin-badge ${test.status === 'Active' ? 'admin-badge-success' : 'admin-badge-neutral'}`}>
                {test.status === 'Active' ? 'Đang hoạt động' : 'Bản nháp'}
              </span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--a-text)', margin: '0 0 4px' }}>{test.name}</h3>
            <p style={{ fontSize: 12.5, color: 'var(--a-text-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>{test.desc}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--a-text-muted)', marginBottom: 16, borderTop: '1px solid var(--a-border)', paddingTop: 12 }}>
              <span>Quy mô: {test.questions} câu hỏi</span>
              <span>Đã hoàn thành: {test.completedCount.toLocaleString()} lượt</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="admin-btn admin-btn-outline" style={{ flex: 1, padding: '7px', fontSize: 12.5 }}>
                Chỉnh sửa câu hỏi
              </button>
              <button className="admin-btn admin-btn-ghost" style={{ padding: '7px 12px', fontSize: 12.5 }}>
                Xem thống kê
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
