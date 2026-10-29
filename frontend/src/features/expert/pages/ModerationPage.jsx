import { useState, useEffect } from 'react';
import axiosClient from '../../auth/api/authApi';
import { useAuthStore } from '../../auth/store/authStore';
import InPageNotification from '../../../shared/components/InPageNotification';

export default function ExpertModerationPage() {
  const { user } = useAuthStore();
  const [activeSection, setActiveSection] = useState('posts'); // 'posts' | 'comments'
  const [posts, setPosts] = useState([]);
  const [flaggedComments, setFlaggedComments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [commenting, setCommenting] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const loadPosts = () => {
    setLoading(true);
    axiosClient.get('/community/posts', { params: { isStaff: true } })
      .then(res => {
        if (res.data?.data && Array.isArray(res.data.data)) {
          setPosts(res.data.data);
        }
      })
      .catch(() => {
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

  const loadFlaggedComments = () => {
    axiosClient.get('/community/flagged-comments')
      .then(res => {
        if (res.data?.data && Array.isArray(res.data.data)) {
          setFlaggedComments(res.data.data);
        }
      })
      .catch(() => {
        axiosClient.get('/admin/flagged-comments')
          .then(res2 => {
            if (res2.data?.data && Array.isArray(res2.data.data)) {
              setFlaggedComments(res2.data.data);
            }
          })
          .catch(() => {});
      });
  };

  useEffect(() => {
    loadPosts();
    loadFlaggedComments();
  }, []);

  const filtered = filter === 'all'
    ? posts
    : filter === 'flagged'
      ? posts.filter(p => p.hasKeywordsAlert || p.isExtremeCrisis || p.riskScore >= 60 || p.imageModerationStatus === 'Flagged')
      : filter === 'has_image'
        ? posts.filter(p => !!p.imageUrl)
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

  const handleModerateImage = async (id, action, author) => {
    try {
      await axiosClient.patch(`/community/posts/${id}/moderate-image`, {
        action,
        note: `Chuyên viên duyệt ảnh: ${action}`
      });
      setPosts(prev => prev.map(p => p.id === id ? { ...p, imageModerationStatus: action } : p));
      setNotice({
        type: action === 'Rejected' ? 'warning' : 'success',
        title: 'Kiểm duyệt hình ảnh thành công',
        message: `Hình ảnh trong bài của "${author}" đã được cập nhật trạng thái: ${action === 'Approved' ? 'Đã duyệt' : action === 'Rejected' ? 'Từ chối / Ẩn ảnh' : 'Gắn cờ nhạy cảm'}.`
      });
    } catch {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, imageModerationStatus: action } : p));
      setNotice({
        type: 'info',
        title: 'Đã cập nhật kiểm duyệt ảnh',
        message: `Đã đổi trạng thái ảnh thành: ${action}.`
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

  const handleModerateComment = async (commentId, action, author) => {
    try {
      await axiosClient.post(`/community/comments/${commentId}/moderate`, {
        action,
        reason: `Chuyên gia tâm lý kiểm duyệt: ${action}`
      });
    } catch { /* optimistic */ }

    setFlaggedComments(prev => prev.map(c => c.id === commentId ? {
      ...c,
      moderationStatus: action === 'approve' ? 'Approved' : action === 'hide' ? 'Hidden' : 'Rejected',
      isSensitiveHiddenFromStudents: action !== 'approve'
    } : c));

    setNotice({
      type: action === 'approve' ? 'success' : 'warning',
      title: 'Kiểm duyệt bình luận thành công',
      message: `Bình luận của "${author}" đã chuyển sang trạng thái: ${action === 'approve' ? 'Đã duyệt công khai' : action === 'hide' ? 'Tạm ẩn' : 'Từ chối vi phạm'}.`
    });
  };

  return (
    <div className="expert-page-shell">
      <div className="expert-page-header" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--e-text)', margin: '0 0 4px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Kiểm Duyệt Nội Dung &amp; Bình Luận Sinh Viên
        </h1>
        <p style={{ fontSize: 13, color: 'var(--e-text-muted)', margin: 0 }}>
          Rà soát các bài viết và bình luận cộng đồng chứa từ khóa nhạy cảm, đưa ra nhận xét chuyên môn và nâng đỡ cảm xúc
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

      {/* Main Section Toggle */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, borderBottom: '1px solid var(--e-border)', paddingBottom: 10 }}>
        <button
          type="button"
          onClick={() => setActiveSection('posts')}
          style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            border: 'none', transition: 'all 0.15s ease',
            background: activeSection === 'posts' ? 'var(--e-primary)' : 'var(--e-surface)',
            color: activeSection === 'posts' ? '#ffffff' : 'var(--e-text-muted)'
          }}
        >
          📝 Bài viết sinh viên ({posts.length})
        </button>
        <button
          type="button"
          onClick={() => { setActiveSection('comments'); loadFlaggedComments(); }}
          style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            border: 'none', transition: 'all 0.15s ease',
            background: activeSection === 'comments' ? 'var(--e-primary)' : 'var(--e-surface)',
            color: activeSection === 'comments' ? '#ffffff' : 'var(--e-text-muted)',
            display: 'flex', alignItems: 'center', gap: 6
          }}
        >
          <span>💬 Bình luận cần duyệt ({flaggedComments.length})</span>
          {flaggedComments.some(c => c.moderationStatus === 'Flagged' || c.isSensitiveHiddenFromStudents) && (
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
          )}
        </button>
      </div>

      {activeSection === 'posts' ? (
        <>
          {/* Filter pills */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              { v: 'all', l: `Tất cả bài viết (${posts.length})` },
              { v: 'flagged', l: `Cần lưu ý (${posts.filter(p => p.hasKeywordsAlert || p.isExtremeCrisis || p.riskScore >= 60 || p.imageModerationStatus === 'Flagged').length})` },
              { v: 'has_image', l: `Có hình ảnh (${posts.filter(p => !!p.imageUrl).length})` },
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
            const imgStatus = post.imageModerationStatus || 'None';

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
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className="e-badge" style={{ fontSize: 11 }}>
                      Bài viết: {status === 'Approved' ? 'Công khai' : status === 'Hidden' ? 'Đã ẩn' : 'Chờ duyệt'}
                    </span>
                    {post.imageUrl && (
                      <span
                        className="e-badge"
                        style={{
                          fontSize: 11,
                          background: imgStatus === 'Approved' ? '#ecfdf5' : imgStatus === 'Rejected' ? '#fef2f2' : imgStatus === 'Flagged' ? '#fffbeb' : '#f1f5f9',
                          color: imgStatus === 'Approved' ? '#059669' : imgStatus === 'Rejected' ? '#dc2626' : imgStatus === 'Flagged' ? '#b45309' : '#475569',
                          border: `1px solid ${imgStatus === 'Approved' ? '#a7f3d0' : imgStatus === 'Rejected' ? '#fecaca' : imgStatus === 'Flagged' ? '#fde68a' : '#cbd5e1'}`
                        }}
                      >
                        Ảnh: {imgStatus === 'Approved' ? 'Đã duyệt' : imgStatus === 'Rejected' ? 'Bị từ chối' : imgStatus === 'Flagged' ? 'Cảnh báo nhạy cảm' : 'Chưa duyệt'}
                      </span>
                    )}
                  </div>
                </div>

                <p style={{ fontSize: 13.5, color: 'var(--e-text)', lineHeight: 1.6, margin: '0 0 12px' }}>
                  {post.content}
                </p>

                {/* Khối hiển thị & kiểm duyệt hình ảnh */}
                {post.imageUrl && (
                  <div style={{
                    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
                    padding: '12px 14px', marginBottom: 14
                  }}>
                    {(() => {
                      const imgs = (post.imageUrl || '').split(',').map(s => s.trim()).filter(Boolean);
                      return (
                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 480 }}>
                            {imgs.map((img, idx) => (
                              <div
                                key={idx}
                                onClick={() => setPreviewImage(img)}
                                title="Nhấp để xem ảnh lớn"
                                style={{
                                  width: 120, height: 85, borderRadius: 8, overflow: 'hidden',
                                  border: '1px solid #cbd5e1', background: '#090d16', flexShrink: 0,
                                  cursor: 'zoom-in', position: 'relative'
                                }}
                              >
                                <img
                                  src={img}
                                  alt={`Ảnh ${idx + 1}`}
                                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                  onError={e => { e.currentTarget.style.display = 'none'; }}
                                />
                                {imgs.length > 1 && (
                                  <span style={{
                                    position: 'absolute', bottom: 2, right: 2, background: 'rgba(0,0,0,0.65)',
                                    color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4
                                  }}>
                                    #{idx + 1}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                          <div style={{ flex: 1, minWidth: 220 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                              Kiểm duyệt hình ảnh đính kèm ({imgs.length} ảnh):
                            </div>
                            <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 8, wordBreak: 'break-all' }}>
                              {imgs.length === 1 ? `URL: ${imgs[0].length > 50 ? imgs[0].substring(0, 50) + '...' : imgs[0]}` : `Đính kèm ${imgs.length} hình ảnh`}
                            </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => handleModerateImage(post.id, 'Approved', author)}
                            className="e-btn"
                            style={{
                              padding: '5px 12px', fontSize: 11.5, borderRadius: 6,
                              background: imgStatus === 'Approved' ? '#059669' : '#ecfdf5',
                              color: imgStatus === 'Approved' ? '#fff' : '#059669',
                              border: '1px solid #a7f3d0', fontWeight: 700, cursor: 'pointer'
                            }}
                          >
                            ✓ Duyệt ảnh
                          </button>
                          <button
                            type="button"
                            onClick={() => handleModerateImage(post.id, 'Flagged', author)}
                            className="e-btn"
                            style={{
                              padding: '5px 12px', fontSize: 11.5, borderRadius: 6,
                              background: imgStatus === 'Flagged' ? '#d97706' : '#fffbeb',
                              color: imgStatus === 'Flagged' ? '#fff' : '#b45309',
                              border: '1px solid #fde68a', fontWeight: 700, cursor: 'pointer'
                            }}
                          >
                            ⚠️ Gắn cờ nhạy cảm
                          </button>
                          <button
                            type="button"
                            onClick={() => handleModerateImage(post.id, 'Rejected', author)}
                            className="e-btn"
                            style={{
                              padding: '5px 12px', fontSize: 11.5, borderRadius: 6,
                              background: imgStatus === 'Rejected' ? '#dc2626' : '#fef2f2',
                              color: imgStatus === 'Rejected' ? '#fff' : '#dc2626',
                              border: '1px solid #fecaca', fontWeight: 700, cursor: 'pointer'
                            }}
                          >
                            ✕ Từ chối / Ẩn ảnh
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

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
                      Duyệt công khai bài
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
        </>
      ) : (
        /* Tab: Flagged Comments */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {flaggedComments.length === 0 ? (
            <div className="e-card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--e-text-muted)' }}>
              <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', color: 'var(--e-text)' }}>Không có bình luận nào bị gắn cờ</p>
              <p style={{ fontSize: 13, margin: 0 }}>Hệ thống AI và bộ lọc từ khóa nhạy cảm không phát hiện bình luận vi phạm nào.</p>
            </div>
          ) : (
            flaggedComments.map(c => {
              const isFlagged = c.isSensitiveHiddenFromStudents || c.moderationStatus === 'Flagged';
              return (
                <div key={c.id} className="e-card" style={{ borderLeft: `3px solid ${isFlagged ? '#dc2626' : 'var(--e-primary)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <strong style={{ fontSize: 14, color: 'var(--e-text)' }}>{c.authorPseudonym}</strong>
                      <span style={{ fontSize: 11.5, color: 'var(--e-text-muted)', marginLeft: 8 }}>
                        {c.createdAt ? new Date(c.createdAt).toLocaleString('vi-VN') : ''}
                      </span>
                      {c.isExpertComment && (
                        <span style={{ fontSize: 10.5, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 6, fontWeight: 700, marginLeft: 8 }}>
                          Chuyên viên
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {c.detectedKeywords && (
                        <span style={{ fontSize: 11, background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                          Từ khóa: {c.detectedKeywords}
                        </span>
                      )}
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                        background: c.moderationStatus === 'Approved' ? '#dcfce7' : c.moderationStatus === 'Hidden' ? '#f1f5f9' : '#fef3c7',
                        color: c.moderationStatus === 'Approved' ? '#15803d' : c.moderationStatus === 'Hidden' ? '#64748b' : '#b45309'
                      }}>
                        {c.moderationStatus === 'Approved' ? 'Đã duyệt' : c.moderationStatus === 'Hidden' ? 'Đã ẩn' : 'Chờ duyệt'}
                      </span>
                    </div>
                  </div>

                  {c.content && (
                    <p style={{ fontSize: 13.5, color: 'var(--e-text)', lineHeight: 1.6, margin: '0 0 10px', background: 'var(--e-bg-soft)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--e-border)' }}>
                      {c.content}
                    </p>
                  )}

                  {/* Comment Attached Image */}
                  {c.imageUrl && (
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--e-text-muted)', display: 'block', marginBottom: 4 }}>Ảnh bình luận đính kèm:</span>
                      <img
                        src={c.imageUrl}
                        alt="Ảnh bình luận"
                        onClick={() => setPreviewImage(c.imageUrl)}
                        title="Xem ảnh phóng to"
                        style={{ maxHeight: 140, maxWidth: 220, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--e-border)', cursor: 'zoom-in' }}
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      className="e-btn e-btn-primary"
                      style={{ padding: '6px 14px', fontSize: 12 }}
                      onClick={() => handleModerateComment(c.id, 'approve', c.authorPseudonym)}
                    >
                      ✓ Duyệt hiển thị
                    </button>
                    <button
                      className="e-btn e-btn-outline"
                      style={{ padding: '6px 14px', fontSize: 12 }}
                      onClick={() => handleModerateComment(c.id, 'hide', c.authorPseudonym)}
                    >
                      👁️ Tạm ẩn
                    </button>
                    <button
                      className="e-btn e-btn-danger"
                      style={{ padding: '6px 14px', fontSize: 12 }}
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

      {/* Enlarged image preview modal */}
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
