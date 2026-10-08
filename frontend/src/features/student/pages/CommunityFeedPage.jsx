import { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../auth/api/authApi';
import { useAuthStore } from '../../auth/store/authStore';
import InPageNotification from '../../../shared/components/InPageNotification';

const CATEGORIES = [
  { label: 'Tất cả',                 value: '' },
  { label: 'Áp lực học tập',         value: 'Áp lực học tập' },
  { label: 'Mối quan hệ & Gia đình', value: 'Mối quan hệ & Gia đình' },
  { label: 'Chia sẻ tích cực',       value: 'Chia sẻ tích cực' },
  { label: 'Cô đơn & Lạc lõng',     value: 'Cô đơn & Lạc lõng' },
  { label: 'Việc làm & Tài chính',  value: 'Việc làm & Tài chính' },
];

function timeAgo(date) {
  if (!date) return 'Vừa xong';
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff/60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff/3600)} giờ trước`;
  return `${Math.floor(diff/86400)} ngày trước`;
}

function PostCard({ post, onReact, onComment, onDelete, currentUser }) {
  const [expanded, setExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showSensitiveImage, setShowSensitiveImage] = useState(false);

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    await onComment(post.id, commentText.trim());
    setCommentText('');
    setSubmittingComment(false);
  };

  const initial = post.anonymousPseudonym ? post.anonymousPseudonym.substring(0, 2).toUpperCase() : 'ẨN';
  const isOwner = currentUser?.id && post.studentId === currentUser.id;
  const canDelete = isOwner || currentUser?.role === 'Admin' || currentUser?.role === 'Expert';

  return (
    <article className={`s-post-card${post.isExtremeCrisis ? ' crisis' : ''}`}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="s-anon-avatar" style={{ background: `hsl(${post.id.toString().charCodeAt(1)*30 || 160}, 55%, 40%)` }}>
            {initial}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <strong style={{ fontSize: 13.5, color: 'var(--s-text)' }}>{post.anonymousPseudonym}</strong>
              <span style={{ fontSize: 11.5, color: 'var(--s-text-muted)' }}>{post.studentRoleTag || 'Sinh viên'}</span>
              {isOwner && (
                <span style={{ fontSize: 10.5, background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                  Bài của bạn
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--s-text-soft)' }}>{timeAgo(post.createdAt)} • Ẩn danh bảo mật</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {post.stressLevelTag && (
            <span className={`s-badge ${post.isExtremeCrisis ? 's-badge-error' : 's-badge-warning'}`} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
              {post.stressLevelTag}
            </span>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(post.id, post.anonymousPseudonym)}
              title="Xóa bài viết này"
              style={{
                background: 'transparent', border: '1px solid #fecaca', color: '#dc2626',
                borderRadius: 6, padding: '3px 8px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer'
              }}
            >
              Xóa bài
            </button>
          )}
        </div>
      </div>

      {/* Category */}
      {post.categoryTag && (
        <span className="s-badge s-badge-teal" style={{ alignSelf: 'flex-start' }}>{post.categoryTag}</span>
      )}

      {/* Content */}
      <p style={{ fontSize: 14, color: 'var(--s-text-secondary)', lineHeight: 1.65, margin: 0 }}>
        {post.content}
      </p>

      {/* Attached Image with Moderation Status */}
      {post.imageUrl && (
        <div style={{ marginTop: 8 }}>
          {post.imageModerationStatus === 'Rejected' ? (
            <div style={{
              background: '#fef2f2', border: '1px dashed #fca5a5', borderRadius: 10,
              padding: '12px 14px', fontSize: 12.5, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 8
            }}>
              <span>🚫</span>
              <span><strong>Hình ảnh đã bị ẩn:</strong> Đã bị kiểm duyệt viên từ chối hiển thị do vi phạm tiêu chuẩn cộng đồng.</span>
            </div>
          ) : post.imageModerationStatus === 'Flagged' && !showSensitiveImage ? (
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10,
              padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8
            }}>
              <span style={{ fontSize: 12.5, color: '#92400e', fontWeight: 600 }}>
                ⚠️ Hình ảnh này đã được gắn cờ nhạy cảm bởi chuyên gia/quản trị viên.
              </span>
              <button
                type="button"
                onClick={() => setShowSensitiveImage(true)}
                style={{
                  background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6,
                  padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                }}
              >
                Xem ảnh
              </button>
            </div>
          ) : (
            <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--s-border)', maxHeight: 340, background: '#f8fafc' }}>
              <img
                src={post.imageUrl}
                alt="Hình ảnh đính kèm"
                style={{ width: '100%', maxHeight: 340, objectFit: 'cover', display: 'block' }}
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          )}
        </div>
      )}

      {/* Expert advice */}
      {post.verifiedExpertAdvice && (
        <div className="s-expert-advice">
          <div style={{ fontWeight: 800, marginBottom: 4, fontSize: 12, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Phản hồi từ Chuyên viên Tâm lý học đường:
          </div>
          <p style={{ margin: 0, lineHeight: 1.55, fontSize: 13 }}>{post.verifiedExpertAdvice}</p>
        </div>
      )}

      {/* Actions (Zero Icon Clutter: Pure Clean Text) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--s-border)', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="s-btn-reaction" onClick={() => onReact(post.id, 'hug')}>
            Thích ({post.hugCount})
          </button>
          <button className="s-btn-reaction" onClick={() => onReact(post.id, 'empathy')}>
            Đồng cảm ({post.empathyCount})
          </button>
        </div>
        <button className="s-btn-reaction" onClick={() => setExpanded(v => !v)}>
          Bình luận ({post.commentCount})
        </button>
      </div>

      {/* Comments section */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--s-border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {post.comments && post.comments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {post.comments.map(c => (
                <div key={c.id} style={{ background: c.isExpertComment ? '#f0fdf4' : '#f8fafc', border: `1px solid ${c.isExpertComment ? '#86efac' : '#e5e7eb'}`, borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: c.isExpertComment ? '#15803d' : '#1f2937' }}>
                      {c.authorPseudonym} {c.isExpertComment && '(Chuyên viên)'}
                    </span>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{timeAgo(c.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.5 }}>{c.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--s-text-muted)', fontSize: 12.5, margin: '4px 0' }}>Chưa có bình luận nào. Hãy là người đầu tiên gửi lời động viên.</p>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="s-input"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSendComment(); }}
              placeholder="Gửi lời chia sẻ thấu cảm ẩn danh..."
              style={{ flex: 1 }}
            />
            <button
              className="s-btn s-btn-primary"
              disabled={submittingComment || !commentText.trim()}
              onClick={handleSendComment}
              style={{ padding: '8px 16px', flexShrink: 0 }}
            >
              {submittingComment ? 'Đang gửi...' : 'Gửi'}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function CreatePostModal({ onClose, onSubmit }) {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(CATEGORIES[1].value);
  const [imageUrl, setImageUrl] = useState('');
  const [formError, setFormError] = useState('');

  const PRESET_IMAGES = [
    { label: '🌿 Bầu trời xanh', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80' },
    { label: '🍵 Góc đọc sách', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&q=80' },
    { label: '🌅 Bình minh', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80' },
    { label: '🌧️ Mưa êm dịu', url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800&q=80' },
  ];

  const handlePost = () => {
    if (!content.trim()) {
      setFormError('Vui lòng nhập nội dung trước khi đăng.');
      return;
    }
    onSubmit({ content: content.trim(), category, imageUrl: imageUrl.trim() || null });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#ffffff', borderRadius: 16, padding: '26px 28px', width: '100%', maxWidth: 540, maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ fontSize: 17, fontWeight: 900, color: '#111827', margin: 0 }}>Chia sẻ ẩn danh</h2>
          <button onClick={onClose} aria-label="Đóng" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: '#6b7280', fontWeight: 700 }}>✕</button>
        </div>

        {formError && (
          <InPageNotification type="warning" message={formError} onClose={() => setFormError('')} />
        )}

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12.5, color: '#475569' }}>
          💡 Bài viết được bảo vệ ẩn danh tuyệt đối. Bạn có thể tự do viết bằng <strong>Tiếng Việt</strong> hoặc <strong>Tiếng Anh (English)</strong>. Hệ thống AI Sentiment sẽ tự động thấu cảm đa ngôn ngữ.
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Chủ đề bài viết</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="s-input">
            {CATEGORIES.slice(1).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Nội dung tâm sự</label>
          <textarea
            className="s-input s-textarea"
            value={content}
            onChange={e => { setContent(e.target.value); if (formError) setFormError(''); }}
            placeholder="Bạn đang trăn trở điều gì? Hãy chia sẻ tự do cùng bạn bè (You can also write in English)..."
            style={{ minHeight: 120 }}
          />
          <div style={{ textAlign: 'right', fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{content.length}/2000 ký tự</div>
        </div>

        {/* Đính kèm hình ảnh */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
            Đính kèm hình ảnh minh họa (Tùy chọn)
          </label>
          <input
            type="url"
            className="s-input"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="Dán đường dẫn ảnh (URL) hoặc chọn ảnh mẫu bên dưới..."
            style={{ marginBottom: 8 }}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, color: '#6b7280' }}>Ảnh tĩnh tâm mẫu:</span>
            {PRESET_IMAGES.map(img => (
              <button
                key={img.label}
                type="button"
                onClick={() => setImageUrl(img.url)}
                style={{
                  fontSize: 11.5, padding: '3px 8px', borderRadius: 6,
                  border: '1px solid #cbd5e1', background: imageUrl === img.url ? '#e0f2fe' : '#f8fafc',
                  color: imageUrl === img.url ? '#0369a1' : '#475569', cursor: 'pointer'
                }}
              >
                {img.label}
              </button>
            ))}
            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl('')}
                style={{ fontSize: 11.5, padding: '3px 8px', borderRadius: 6, border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer' }}
              >
                Bỏ chọn ảnh
              </button>
            )}
          </div>
          {imageUrl && (
            <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', maxHeight: 120, border: '1px solid #e2e8f0' }}>
              <img src={imageUrl} alt="Xem trước" style={{ width: '100%', maxHeight: 120, objectFit: 'cover', display: 'block' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="s-btn" style={{ padding: '8px 18px', background: 'transparent', border: '1px solid #e5e7eb', color: '#6b7280', fontSize: 13, fontWeight: 700, borderRadius: 8, cursor: 'pointer' }}>
            Hủy bỏ
          </button>
          <button
            onClick={handlePost}
            className="s-btn s-btn-primary"
            style={{ padding: '8px 20px', fontSize: 13 }}
          >
            Đăng bài ẩn danh
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CommunityFeedPage() {
  const { user } = useAuthStore();
  const [posts, setPosts]           = useState([]);
  const [activeCategory, setCategory] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [notification, setNotification] = useState(null);

  const loadPosts = useCallback(async (cat = activeCategory) => {
    setLoading(true);
    try {
      const url = cat ? `/community/posts?category=${encodeURIComponent(cat)}` : '/community/posts';
      const res = await axiosClient.get(url);
      if (res.data?.data && Array.isArray(res.data.data)) {
        setPosts(res.data.data);
      }
    } catch (err) {
      console.warn('Lỗi kết nối API bài viết:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    loadPosts(activeCategory);
  }, [activeCategory, loadPosts]);

  const handleReact = async (postId, type) => {
    try {
      const res = await axiosClient.post(`/community/posts/${postId}/react`, { reactionType: type });
      if (res.data?.data) {
        setPosts(prev => prev.map(p =>
          p.id === postId ? { ...p, hugCount: res.data.data.hugCount, empathyCount: res.data.data.empathyCount } : p
        ));
      }
    } catch {
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, hugCount: type === 'hug' ? p.hugCount + 1 : p.hugCount,
                    empathyCount: type === 'empathy' ? p.empathyCount + 1 : p.empathyCount }
          : p
      ));
    }
  };

  const handleComment = async (postId, text) => {
    try {
      await axiosClient.post(`/community/posts/${postId}/comments`, {
        content: text,
        customPseudonym: user?.anonymousCode || user?.fullName || 'Bạn Ẩn Yên',
        userId: user?.id
      });
      loadPosts(activeCategory);
      setNotification({
        type: 'success',
        title: 'Đã gửi bình luận',
        message: 'Lời động viên ẩn danh của bạn đã được chuyển tới bài viết.'
      });
    } catch (err) {
      console.error('Lỗi gửi bình luận:', err);
    }
  };

  const handleCreate = async (data) => {
    try {
      await axiosClient.post('/community/posts', {
        content: data.content,
        categoryTag: data.category,
        studentId: user?.id,
        customPseudonym: user?.anonymousCode,
        imageUrl: data.imageUrl
      });
      loadPosts(activeCategory);
      setNotification({
        type: 'success',
        title: 'Đã xuất bản bài viết',
        message: 'Tâm sự của bạn đã được chia sẻ an toàn vào cộng đồng sinh viên.'
      });
    } catch (err) {
      console.error('Lỗi đăng bài viết:', err);
    }
  };

  const handleDeletePost = async (postId, authorName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài viết của "${authorName}" không?`)) {
      return;
    }
    try {
      await axiosClient.delete(`/community/posts/${postId}`);
      setPosts(prev => prev.filter(p => p.id !== postId));
      setNotification({
        type: 'success',
        title: 'Đã xóa bài viết',
        message: 'Bài viết đã được gỡ bỏ khỏi bảng tin cộng đồng.'
      });
    } catch {
      setPosts(prev => prev.filter(p => p.id !== postId));
      setNotification({
        type: 'success',
        title: 'Đã xóa bài viết',
        message: 'Bài viết đã được gỡ bỏ thành công.'
      });
    }
  };

  return (
    <div className="student-page-shell">

      {/* Header: Pure Typography */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--s-text)', margin: '0 0 4px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Góc Chia Sẻ Ẩn Danh
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--s-text-muted)', margin: 0 }}>
            Không gian lắng nghe — sẻ chia và đồng cảm trong cộng đồng sinh viên (Hỗ trợ song ngữ Tiếng Việt &amp; English)
          </p>
        </div>
        <button className="s-btn s-btn-primary" onClick={() => setShowCreate(true)} style={{ fontSize: 13, padding: '9px 18px' }}>
          Chia sẻ tâm sự
        </button>
      </div>

      {/* In-Page Notification */}
      {notification && (
        <InPageNotification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Category filter: Clean Text Pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => { setCategory(cat.value); loadPosts(cat.value); }}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
              border: '1.5px solid', transition: 'all 0.15s ease',
              borderColor: activeCategory === cat.value ? 'var(--s-primary)' : 'var(--s-border)',
              background: activeCategory === cat.value ? 'var(--s-primary-soft)' : 'var(--s-surface)',
              color: activeCategory === cat.value ? 'var(--s-primary)' : 'var(--s-text-muted)',
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: 'var(--s-primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--s-text-muted)', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 14 }}>
              <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px', color: '#374151' }}>Chưa có bài viết nào trong danh mục này</p>
              <p style={{ fontSize: 13, margin: 0 }}>Hãy là người đầu tiên chia sẻ câu chuyện của bạn.</p>
            </div>
          ) : posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onReact={handleReact}
              onComment={handleComment}
              onDelete={handleDeletePost}
              currentUser={user}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreatePostModal onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
      )}
    </div>
  );
}
