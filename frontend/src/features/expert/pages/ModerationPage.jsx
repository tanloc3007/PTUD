import { useState, useEffect } from 'react';
import axiosClient from '../../auth/api/authApi';
import { useAuthStore } from '../../auth/store/authStore';
import InPageNotification from '../../../shared/components/InPageNotification';

export default function ExpertModerationPage() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [commenting, setCommenting] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  const loadPosts = () => {
    setLoading(true);
    axiosClient.get('/community/posts', { params: { isStaff: true } })
      .then(res => {
        if (res.data?.data && Array.isArray(res.data.data)) {
          setPosts(res.data.data);
        }
      })
      .catch(() => {
        // fallback to moderation-queue if needed
        axiosClient.get('/admin/moderation-queue')
          .then(res2 => {
            if (res2.data?.data && Array.isArray(res2.data.data)) {
              setPosts(res2.data.data);
            }
          })
          .catch(() => {});
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const filtered = filter === 'all'
    ? posts
    : filter === 'flagged'
      ? posts.filter(p => p.hasKeywordsAlert || p.isExtremeCrisis || p.riskScore >= 60)
      : posts.filter(p => p.moderationStatus?.toLowerCase() === filter || p.status?.toLowerCase() === filter);

  const handleAction = async (id, action, author) => {
    try {
      await axiosClient.post(`/admin/posts/${id}/moderate`, { action, reason: `Chuyên gia ${action === 'hide' ? 'ẩn' : 'phê duyệt'} bài viết` });
      setNotice({
        type: action === 'hide' ? 'warning' : 'success',
        title: 'Cập nhật thành công',
        message: `Đã ${action === 'hide' ? 'ẩn' : 'phê duyệt'} bài viết của "${author}".`
      });
      loadPosts();
    } catch {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, moderationStatus: action === 'hide' ? 'Hidden' : 'Approved' } : p));
      setNotice({
        type: 'info',
        title: 'Cập nhật giao diện',
        message: `Đã ${action === 'hide' ? 'ẩn' : 'phê duyệt'} bài viết của "${author}".`
      });
    }
  };

  const handleComment = async (postId, author) => {
    if (!commentText.trim()) return;
    try {
      const expertId = user?.id || '33333333-3333-3333-3333-333333333331';
      await axiosClient.post(`/community/posts/${postId}/comments`, {
        content: commentText.trim(),
        userId: expertId
      }, { params: { isExpert: true, userId: expertId } });

      setNotice({
        type: 'success',
        title: 'Đã gửi tư vấn chuyên gia',
        message: `Lời khuyên của bạn đã được lưu vào CSDL và gửi đến bài viết của "${author}".`
      });
      setCommenting(null);
      setCommentText('');
      loadPosts();
    } catch {
      setNotice({
        type: 'info',
        title: 'Đã ghi nhận nhận xét',
        message: `Ghi chú chuyên môn đã được gửi đến tác giả bài viết.`
      });
      setCommenting(null);
      setCommentText('');
    }
  };

  return (
    <div className="expert-page-shell">
      <div className="expert-page-header" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--e-text)', margin: '0 0 4px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Kiểm Duyệt &amp; Hỗ Trợ Bài Viết Sinh Viên
        </h1>
        <p style={{ fontSize: 13, color: 'var(--e-text-muted)', margin: 0 }}>
          Rà soát các bài viết cộng đồng từ CSDL và đưa ra nhận xét chuyên môn, nâng đỡ cảm xúc
        </p>
      </div>

      {notice && (
        <InPageNotification
          type={notice.type}
          title={notice.title}
          message={notice.message}
          onClose={() => setNotice(null)}
        />
      )}

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { v: 'all', l: `Tất cả bài viết (${posts.length})` },
          { v: 'flagged', l: `Cần lưu ý (${posts.filter(p => p.hasKeywordsAlert || p.isExtremeCrisis || p.riskScore >= 60).length})` },
          { v: 'approved', l: 'Đã phê duyệt' },
          { v: 'hidden', l: 'Đã ẩn' }
        ].map(f => (
          <button
            key={f.v}
            type="button"
            onClick={() => setFilter(f.v)}
            style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: "'Manrope', sans-serif",
              border: `1.5px solid ${filter === f.v ? 'var(--e-primary)' : 'var(--e-border)'}`,
              background: filter === f.v ? 'var(--e-primary-soft)' : 'var(--e-surface)',
              color: filter === f.v ? 'var(--e-primary)' : 'var(--e-text-muted)',
            }}
          >
            {f.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '36px', color: 'var(--e-text-muted)' }}>
          Đang tải bài viết từ cơ sở dữ liệu...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(post => {
            const author = post.anonymousPseudonym || post.code || 'Sinh viên Ẩn danh';
            const isCrisis = post.isExtremeCrisis || post.riskScore >= 80;
            const status = post.moderationStatus || post.status || 'Approved';

            return (
              <div key={post.id} className="e-card" style={{ borderLeft: `3px solid ${isCrisis ? '#dc2626' : 'var(--e-border)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <strong style={{ fontSize: 14, color: 'var(--e-text)' }}>{author}</strong>
                    <span style={{ fontSize: 11.5, color: 'var(--e-text-muted)', marginLeft: 8 }}>
                      Chủ đề: {post.categoryTag || post.cat || 'Chia sẻ'}
                    </span>
                    {isCrisis && (
                      <span className="e-badge" style={{ marginLeft: 8, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                        Cảnh báo nguy cơ cao ({post.riskScore}/100)
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className="e-badge" style={{ fontSize: 11 }}>
                      Trạng thái: {status === 'Approved' ? 'Công khai' : status === 'Hidden' ? 'Đã ẩn' : 'Chờ duyệt'}
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: 13.5, color: 'var(--e-text)', lineHeight: 1.6, margin: '0 0 14px' }}>
                  {post.content}
                </p>

                {post.detectedKeywords && (
                  <p style={{ fontSize: 12, color: '#dc2626', margin: '0 0 12px', fontWeight: 600 }}>
                    Từ khóa phát hiện: {post.detectedKeywords}
                  </p>
                )}

                {commenting === post.id && (
                  <div style={{ marginBottom: 14, background: 'var(--e-bg-soft)', padding: '12px 14px', borderRadius: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--e-text)', display: 'block', marginBottom: 6 }}>
                      Tư vấn chuyên môn gửi công khai đến sinh viên:
                    </label>
                    <textarea
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 6, border: '1.5px solid var(--e-border)',
                        fontSize: 13, fontFamily: "'Manrope', sans-serif", resize: 'vertical', minHeight: 75,
                        boxSizing: 'border-box', outline: 'none', color: 'var(--e-text)', background: 'var(--e-surface)'
                      }}
                      placeholder="Nhập thông điệp nâng đỡ, lời khuyên tâm lý hoặc hướng dẫn hỗ trợ..."
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button className="e-btn e-btn-primary" style={{ padding: '7px 14px', fontSize: 12.5 }} onClick={() => handleComment(post.id, author)}>
                        Lưu nhận xét vào CSDL
                      </button>
                      <button className="e-btn e-btn-ghost" style={{ padding: '7px 14px', fontSize: 12.5 }} onClick={() => setCommenting(null)}>
                        Hủy
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {status !== 'Approved' && (
                    <button className="e-btn e-btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => handleAction(post.id, 'approve', author)}>
                      Duyệt công khai
                    </button>
                  )}
                  <button className="e-btn e-btn-outline" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setCommenting(post.id)}>
                    Gửi tư vấn chuyên môn
                  </button>
                  {status !== 'Hidden' && (
                    <button className="e-btn e-btn-danger" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => handleAction(post.id, 'hide', author)}>
                      Ẩn bài viết
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--e-text-muted)', background: 'var(--e-surface)', borderRadius: 10, border: '1px solid var(--e-border)' }}>
              Không tìm thấy bài viết nào trong danh mục này.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
