import { useState, useEffect } from 'react';
import axiosClient from '../../auth/api/authApi';
import InPageNotification from '../../../shared/components/InPageNotification';

const MOCK_POSTS = [
  { id: 'p1', code: 'Cún Mưa Rào #512', content: 'Còn đúng 3 tuần nữa là đến hạn bảo vệ đồ án... code vẫn lỗi...', cat: 'Áp lực học tập', status: 'Approved', score: 42, createdAt: new Date(Date.now() - 3600000) },
  { id: 'p4', code: 'Ẩn Danh #902', content: 'Không muốn sống tiếp, buông bỏ tất cả...', cat: 'Khủng hoảng', status: 'Flagged', score: 94, createdAt: new Date(Date.now() - 7200000), isCrisis: true },
  { id: 'p2', code: 'Bồ Công Anh #119', content: 'Lần đầu tiên sống xa nhà...', cat: 'Cô đơn & Lạc lõng', status: 'Approved', score: 28, createdAt: new Date(Date.now() - 86400000) },
];

export default function AdminModerationPage() {
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);

  const loadPosts = () => {
    setLoading(true);
    axiosClient.get('/admin/moderation-queue')
      .then(r => {
        if (r.data?.data && Array.isArray(r.data.data) && r.data.data.length > 0) {
          const mapped = r.data.data.map(p => ({
            id: p.id,
            code: p.anonymousPseudonym || 'Bạn Ẩn Yên',
            content: p.content,
            cat: p.categoryTag || 'Chia sẻ',
            status: p.moderationStatus || 'Approved',
            score: p.riskScore ?? 0,
            createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
            isCrisis: p.isExtremeCrisis || p.hasKeywordsAlert || (p.riskScore >= 75)
          }));
          setPosts(mapped);
        } else {
          axiosClient.get('/community/posts')
            .then(r2 => {
              if (r2.data?.data && Array.isArray(r2.data.data) && r2.data.data.length > 0) {
                const mapped = r2.data.data.map(p => ({
                  id: p.id,
                  code: p.anonymousPseudonym || 'Bạn Ẩn Yên',
                  content: p.content,
                  cat: p.categoryTag || 'Chia sẻ',
                  status: p.moderationStatus || 'Approved',
                  score: p.riskScore ?? 0,
                  createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
                  isCrisis: p.isExtremeCrisis || p.hasKeywordsAlert || (p.riskScore >= 75)
                }));
                setPosts(mapped);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleHide = async (id, author) => {
    try {
      await axiosClient.post(`/admin/posts/${id}/moderate`, { action: 'hide', reason: 'Admin ẩn bài vi phạm tiêu chuẩn cộng đồng' });
    } catch { /* optimistic */ }
    setPosts(p => p.map(post => post.id === id ? { ...post, status: 'Hidden' } : post));
    setActionNotice({
      type: 'warning',
      title: 'Đã ẩn bài viết',
      message: `Bài viết của "${author}" đã được tạm ẩn khỏi bảng tin cộng đồng.`
    });
  };

  const handleRestore = async (id, author) => {
    try {
      await axiosClient.post(`/admin/posts/${id}/moderate`, { action: 'approve', reason: 'Admin phê duyệt/khôi phục bài viết' });
    } catch { /* optimistic */ }
    setPosts(p => p.map(post => post.id === id ? { ...post, status: 'Approved' } : post));
    setActionNotice({
      type: 'success',
      title: 'Khôi phục thành công',
      message: `Bài viết của "${author}" đã được hiển thị công khai trở lại.`
    });
  };

  return (
    <div className="admin-page-shell" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Kiểm Duyệt Nội Dung</h1>
        <p className="admin-page-subtitle">Giám sát và kiểm duyệt các bài viết cộng đồng bảo đảm an toàn tinh thần cho sinh viên</p>
      </div>

      {actionNotice && (
        <InPageNotification
          type={actionNotice.type}
          title={actionNotice.title}
          message={actionNotice.message}
          onClose={() => setActionNotice(null)}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {posts.map(post => (
          <div key={post.id} className="admin-card" style={{ borderLeft: `3px solid ${post.isCrisis ? 'var(--a-error)' : post.status === 'Hidden' ? 'var(--a-text-soft)' : 'var(--a-primary)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--a-text)' }}>{post.code}</span>
                <span style={{ fontSize: 11.5, color: 'var(--a-text-muted)', marginLeft: 8 }}>{post.cat}</span>
                {post.isCrisis && <span className="admin-badge admin-badge-error" style={{ marginLeft: 8 }}>Khủng hoảng nguy cơ</span>}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 11.5, color: 'var(--a-text-muted)' }}>Điểm rủi ro: {post.score}</span>
                <span className={`admin-badge ${post.status === 'Approved' ? 'admin-badge-success' : post.status === 'Flagged' ? 'admin-badge-error' : post.status === 'Hidden' ? 'admin-badge-neutral' : 'admin-badge-warning'}`}>
                  {post.status === 'Approved' ? 'Hoạt động' : post.status === 'Flagged' ? 'Cảnh báo' : post.status === 'Hidden' ? 'Đã ẩn' : 'Chờ duyệt'}
                </span>
              </div>
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--a-text-muted)', lineHeight: 1.6, margin: '0 0 14px' }}>{post.content}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {post.status !== 'Hidden' ? (
                <button className="admin-btn admin-btn-danger" style={{ padding: '6px 14px', fontSize: 12.5 }} onClick={() => handleHide(post.id, post.code)}>
                  Ẩn bài viết
                </button>
              ) : (
                <button className="admin-btn admin-btn-outline" style={{ padding: '6px 14px', fontSize: 12.5 }} onClick={() => handleRestore(post.id, post.code)}>
                  Khôi phục bài viết
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
