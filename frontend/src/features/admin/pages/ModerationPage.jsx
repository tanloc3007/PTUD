import { useState, useEffect } from 'react';
import axiosClient from '../../auth/api/authApi';
import InPageNotification from '../../../shared/components/InPageNotification';

const CATEGORY_MAP = {
  'Áp lực học tập': 'Góc học tập',
  'Mối quan hệ & Gia đình': 'Gia đình & Bạn bè',
  'Chia sẻ tích cực': 'Chuyện thường ngày',
  'Cô đơn & Lạc lõng': 'Góc tâm sự',
  'Việc làm & Tài chính': 'Định hướng & Tương lai',
};
const formatCategory = (cat) => CATEGORY_MAP[cat] || cat;

const MOCK_POSTS = [
  { id: 'p1', code: 'Cún Mưa Rào #512', content: 'Còn đúng 3 tuần nữa là đến hạn bảo vệ đồ án... code vẫn lỗi...', cat: 'Góc học tập', status: 'Approved', score: 42, createdAt: new Date(Date.now() - 3600000) },
  { id: 'p4', code: 'Ẩn Danh #902', content: 'Không muốn sống tiếp, buông bỏ tất cả...', cat: 'Khủng hoảng', status: 'Flagged', score: 94, createdAt: new Date(Date.now() - 7200000), isCrisis: true },
  { id: 'p2', code: 'Bồ Công Anh #119', content: 'Lần đầu tiên sống xa nhà...', cat: 'Góc tâm sự', status: 'Approved', score: 28, createdAt: new Date(Date.now() - 86400000) },
];

export default function AdminModerationPage() {
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'comments'
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [flaggedComments, setFlaggedComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const loadPosts = () => {
    setLoading(true);
    axiosClient.get('/admin/moderation-queue')
      .then(r => {
        if (r.data?.data && Array.isArray(r.data.data) && r.data.data.length > 0) {
          const mapped = r.data.data.map(p => ({
            id: p.id,
            code: p.anonymousPseudonym || 'Bạn Ẩn Yên',
            content: p.content,
            cat: formatCategory(p.categoryTag) || 'Chia sẻ',
            status: p.moderationStatus || 'Approved',
            score: p.riskScore ?? 0,
            imageUrl: p.imageUrl,
            imageModerationStatus: p.imageModerationStatus || 'None',
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
                  cat: formatCategory(p.categoryTag) || 'Chia sẻ',
                  status: p.moderationStatus || 'Approved',
                  score: p.riskScore ?? 0,
                  imageUrl: p.imageUrl,
                  imageModerationStatus: p.imageModerationStatus || 'None',
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

  const loadFlaggedComments = () => {
    axiosClient.get('/admin/flagged-comments')
      .then(r => {
        if (r.data?.data && Array.isArray(r.data.data)) {
          setFlaggedComments(r.data.data);
        }
      })
      .catch(() => {
        axiosClient.get('/community/flagged-comments')
          .then(r2 => {
            if (r2.data?.data && Array.isArray(r2.data.data)) {
              setFlaggedComments(r2.data.data);
            }
          })
          .catch(() => {});
      });
  };

  useEffect(() => {
    loadPosts();
    loadFlaggedComments();
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

  const handleModerateImage = async (id, action, author) => {
    try {
      await axiosClient.patch(`/community/posts/${id}/moderate-image`, { action, note: `Admin kiểm duyệt: ${action}` });
    } catch { /* optimistic */ }
    setPosts(p => p.map(post => post.id === id ? { ...post, imageModerationStatus: action } : post));
    setActionNotice({
      type: action === 'Rejected' ? 'warning' : 'success',
      title: 'Kiểm duyệt ảnh thành công',
      message: `Ảnh trong bài của "${author}" đã chuyển sang trạng thái: ${action === 'Approved' ? 'Đã duyệt' : action === 'Rejected' ? 'Từ chối / Ẩn' : 'Gắn cờ nhạy cảm'}.`
    });
  };

  const handleModerateComment = async (commentId, action, author) => {
    try {
      await axiosClient.post(`/admin/comments/${commentId}/moderate`, {
        action,
        reason: `Admin kiểm duyệt bình luận: ${action}`
      });
    } catch { /* optimistic */ }

    setFlaggedComments(prev => prev.map(c => c.id === commentId ? {
      ...c,
      moderationStatus: action === 'approve' ? 'Approved' : action === 'hide' ? 'Hidden' : 'Rejected',
      isSensitiveHiddenFromStudents: action !== 'approve'
    } : c));

    setActionNotice({
      type: action === 'approve' ? 'success' : 'warning',
      title: 'Kiểm duyệt bình luận thành công',
      message: `Bình luận của "${author}" đã chuyển sang trạng thái: ${action === 'approve' ? 'Đã duyệt công khai' : action === 'hide' ? 'Tạm ẩn' : 'Từ chối vi phạm'}.`
    });
  };

  return (
    <div className="admin-page-shell" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Kiểm Duyệt Nội Dung, Bình Luận &amp; Hình Ảnh</h1>
        <p className="admin-page-subtitle">Giám sát và kiểm duyệt bài viết, bình luận chứa từ khóa nhạy cảm cùng hình ảnh đính kèm bảo đảm an toàn tinh thần sinh viên</p>
      </div>

      {actionNotice && (
        <InPageNotification
          type={actionNotice.type}
          title={actionNotice.title}
          message={actionNotice.message}
          onClose={() => setActionNotice(null)}
        />
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
        <button
          onClick={() => setActiveTab('posts')}
          style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            border: 'none', transition: 'all 0.15s ease',
            background: activeTab === 'posts' ? 'var(--a-primary)' : '#f1f5f9',
            color: activeTab === 'posts' ? '#ffffff' : '#64748b'
          }}
        >
          📝 Bài viết ({posts.length})
        </button>
        <button
          onClick={() => { setActiveTab('comments'); loadFlaggedComments(); }}
          style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            border: 'none', transition: 'all 0.15s ease',
            background: activeTab === 'comments' ? 'var(--a-primary)' : '#f1f5f9',
            color: activeTab === 'comments' ? '#ffffff' : '#64748b',
            display: 'flex', alignItems: 'center', gap: 6
          }}
        >
          <span>💬 Bình luận cần duyệt ({flaggedComments.length})</span>
          {flaggedComments.some(c => c.moderationStatus === 'Flagged' || c.isSensitiveHiddenFromStudents) && (
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
          )}
        </button>
      </div>

      {/* Tab: Posts */}
      {activeTab === 'posts' && (
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
                  {post.imageUrl && (
                    <span className="admin-badge" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                      Ảnh: {post.imageModerationStatus === 'Approved' ? 'Đã duyệt' : post.imageModerationStatus === 'Rejected' ? 'Từ chối' : post.imageModerationStatus === 'Flagged' ? 'Nhạy cảm' : 'Chưa duyệt'}
                    </span>
                  )}
                </div>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--a-text-muted)', lineHeight: 1.6, margin: '0 0 12px' }}>{post.content}</p>

              {/* Khung ảnh & kiểm duyệt hình ảnh */}
              {post.imageUrl && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ width: 100, height: 70, borderRadius: 6, overflow: 'hidden', border: '1px solid #cbd5e1', cursor: 'pointer' }} onClick={() => setPreviewImage(post.imageUrl)}>
                    <img src={post.imageUrl} alt="Đính kèm" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Kiểm duyệt ảnh:</span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button className="admin-btn" style={{ padding: '4px 10px', fontSize: 11.5, background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }} onClick={() => handleModerateImage(post.id, 'Approved', post.code)}>
                        ✓ Duyệt ảnh
                      </button>
                      <button className="admin-btn" style={{ padding: '4px 10px', fontSize: 11.5, background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }} onClick={() => handleModerateImage(post.id, 'Flagged', post.code)}>
                        ⚠️ Gắn cờ nhạy cảm
                      </button>
                      <button className="admin-btn admin-btn-danger" style={{ padding: '4px 10px', fontSize: 11.5, borderRadius: 6, cursor: 'pointer' }} onClick={() => handleModerateImage(post.id, 'Rejected', post.code)}>
                        ✕ Từ chối ảnh
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
      )}

      {/* Tab: Flagged Comments */}
      {activeTab === 'comments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {flaggedComments.length === 0 ? (
            <div className="admin-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', color: '#1e293b' }}>Không có bình luận nào bị gắn cờ</p>
              <p style={{ fontSize: 13, margin: 0 }}>Hệ thống AI và bộ lọc từ khóa nhạy cảm không phát hiện bình luận vi phạm nào.</p>
            </div>
          ) : (
            flaggedComments.map(c => {
              const isFlagged = c.isSensitiveHiddenFromStudents || c.moderationStatus === 'Flagged';
              return (
                <div key={c.id} className="admin-card" style={{ borderLeft: `3px solid ${isFlagged ? 'var(--a-error)' : 'var(--a-primary)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--a-text)' }}>{c.authorPseudonym}</span>
                      <span style={{ fontSize: 11.5, color: 'var(--a-text-muted)', marginLeft: 8 }}>
                        {c.createdAt ? new Date(c.createdAt).toLocaleString('vi-VN') : ''}
                      </span>
                      {c.isExpertComment && (
                        <span className="admin-badge admin-badge-success" style={{ marginLeft: 8 }}>Chuyên viên</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {c.detectedKeywords && (
                        <span className="admin-badge admin-badge-error">
                          Từ khóa: {c.detectedKeywords}
                        </span>
                      )}
                      <span className={`admin-badge ${c.moderationStatus === 'Approved' ? 'admin-badge-success' : c.moderationStatus === 'Hidden' ? 'admin-badge-neutral' : 'admin-badge-error'}`}>
                        {c.moderationStatus === 'Approved' ? 'Đã duyệt' : c.moderationStatus === 'Hidden' ? 'Đã ẩn' : 'Gắn cờ'}
                      </span>
                    </div>
                  </div>

                  {c.content && (
                    <p style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.6, margin: '0 0 10px', background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      {c.content}
                    </p>
                  )}

                  {/* Comment Attached Image */}
                  {c.imageUrl && (
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>Ảnh bình luận đính kèm:</span>
                      <img
                        src={c.imageUrl}
                        alt="Ảnh bình luận"
                        onClick={() => setPreviewImage(c.imageUrl)}
                        title="Xem ảnh phóng to"
                        style={{ maxHeight: 140, maxWidth: 220, borderRadius: 8, objectFit: 'cover', border: '1px solid #cbd5e1', cursor: 'zoom-in' }}
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      className="admin-btn"
                      style={{ padding: '6px 14px', fontSize: 12.5, background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                      onClick={() => handleModerateComment(c.id, 'approve', c.authorPseudonym)}
                    >
                      ✓ Duyệt hiển thị
                    </button>
                    <button
                      className="admin-btn admin-btn-outline"
                      style={{ padding: '6px 14px', fontSize: 12.5 }}
                      onClick={() => handleModerateComment(c.id, 'hide', c.authorPseudonym)}
                    >
                      👁️ Tạm ẩn
                    </button>
                    <button
                      className="admin-btn admin-btn-danger"
                      style={{ padding: '6px 14px', fontSize: 12.5 }}
                      onClick={() => handleModerateComment(c.id, 'reject', c.authorPseudonym)}
                    >
                      ✕ Từ chối vi phạm
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal phóng to ảnh */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <img src={previewImage} alt="Phóng to" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 12, objectFit: 'contain' }} />
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute', top: -12, right: -12, width: 32, height: 32, borderRadius: '50%',
                background: '#ffffff', color: '#0f172a', border: 'none', cursor: 'pointer',
                fontWeight: 800, fontSize: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
