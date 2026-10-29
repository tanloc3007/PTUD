import { useState, useEffect, useCallback, useRef } from 'react';
import axiosClient from '../../auth/api/authApi';
import { useAuthStore } from '../../auth/store/authStore';
import InPageNotification from '../../../shared/components/InPageNotification';
import { uploadImageToCloudinary } from '../../../shared/utils/cloudinaryUpload';

export const CATEGORY_MAP = {
  'Áp lực học tập': 'Góc học tập',
  'Mối quan hệ & Gia đình': 'Gia đình & Bạn bè',
  'Chia sẻ tích cực': 'Chuyện thường ngày',
  'Cô đơn & Lạc lõng': 'Góc tâm sự',
  'Việc làm & Tài chính': 'Định hướng & Tương lai',
};

export function formatCategory(cat) {
  if (!cat) return '';
  return CATEGORY_MAP[cat] || cat;
}

const CATEGORIES = [
  { label: 'Tất cả',                 value: '' },
  { label: 'Góc học tập',             value: 'Góc học tập' },
  { label: 'Gia đình & Bạn bè',      value: 'Gia đình & Bạn bè' },
  { label: 'Chuyện thường ngày',      value: 'Chuyện thường ngày' },
  { label: 'Góc tâm sự',             value: 'Góc tâm sự' },
  { label: 'Định hướng & Tương lai', value: 'Định hướng & Tương lai' },
];

function timeAgo(date) {
  if (!date) return 'Vừa xong';
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff/60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff/3600)} giờ trước`;
  return `${Math.floor(diff/86400)} ngày trước`;
}

export function parseImageUrls(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw !== 'string') return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch (e) {}
  }
  return trimmed.split(',').map(s => s.trim()).filter(Boolean);
}

export function PostMediaGallery({ images, onImageClick }) {
  if (!images || images.length === 0) return null;

  // 1 ảnh: Scale tự nhiên, giữ nguyên tỉ lệ aspect ratio, nền tối dịu mắt, không bị cắt xén
  if (images.length === 1) {
    return (
      <div
        onClick={() => onImageClick?.(images[0], 0)}
        style={{
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid var(--s-border, #e2e8f0)',
          background: '#090d16',
          maxHeight: 520,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'zoom-in',
          transition: 'transform 0.15s ease'
        }}
      >
        <img
          src={images[0]}
          alt="Hình ảnh đính kèm"
          style={{
            maxWidth: '100%',
            maxHeight: 520,
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            display: 'block'
          }}
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />
      </div>
    );
  }

  // 2 ảnh: Cân xứng 2 cột song song
  if (images.length === 2) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 6,
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid var(--s-border, #e2e8f0)',
        maxHeight: 380,
        height: 320,
        background: '#090d16'
      }}>
        {images.map((img, idx) => (
          <div
            key={idx}
            onClick={() => onImageClick?.(img, idx)}
            style={{ position: 'relative', overflow: 'hidden', cursor: 'zoom-in', height: '100%' }}
          >
            <img
              src={img}
              alt={`Ảnh ${idx + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        ))}
      </div>
    );
  }

  // 3 ảnh: 1 ảnh lớn bên trái, 2 ảnh xếp tầng bên phải
  if (images.length === 3) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: 6,
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid var(--s-border, #e2e8f0)',
        maxHeight: 400,
        height: 360,
        background: '#090d16'
      }}>
        <div
          onClick={() => onImageClick?.(images[0], 0)}
          style={{ gridRow: 'span 2', overflow: 'hidden', cursor: 'zoom-in', height: '100%' }}
        >
          <img
            src={images[0]}
            alt="Ảnh 1"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
        <div
          onClick={() => onImageClick?.(images[1], 1)}
          style={{ overflow: 'hidden', cursor: 'zoom-in', height: '100%' }}
        >
          <img
            src={images[1]}
            alt="Ảnh 2"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
        <div
          onClick={() => onImageClick?.(images[2], 2)}
          style={{ overflow: 'hidden', cursor: 'zoom-in', height: '100%' }}
        >
          <img
            src={images[2]}
            alt="Ảnh 3"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      </div>
    );
  }

  // 4 ảnh trở lên: Layout dạng lưới Facebook 2x2, ảnh thứ 4 hiển thị overlay "+N" nếu còn ảnh
  const remaining = images.length - 4;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr',
      gap: 6,
      borderRadius: 12,
      overflow: 'hidden',
      border: '1px solid var(--s-border, #e2e8f0)',
      maxHeight: 420,
      height: 380,
      background: '#090d16'
    }}>
      {images.slice(0, 4).map((img, idx) => {
        const isLastAndOverflow = idx === 3 && remaining > 0;
        return (
          <div
            key={idx}
            onClick={() => onImageClick?.(img, idx)}
            style={{ position: 'relative', overflow: 'hidden', cursor: 'zoom-in', height: '100%' }}
          >
            <img
              src={img}
              alt={`Ảnh ${idx + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
            {isLastAndOverflow && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: 26,
                fontWeight: 800,
                backdropFilter: 'blur(3px)'
              }}>
                +{remaining}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PostCard({ post, onReact, onComment, onDelete, currentUser }) {
  const [expanded, setExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showSensitiveImage, setShowSensitiveImage] = useState(false);
  const [previewEnlargedImage, setPreviewEnlargedImage] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const fileInputRef = useRef(null);

  const postImages = parseImageUrls(post.imageUrl);

  const handleSelectImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh (PNG, JPG, WEBP,...)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Dung lượng hình ảnh không được vượt quá 10MB.');
      return;
    }

    setUploadingImage(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setCommentImage(url);
    } catch (err) {
      console.error('Lỗi tải ảnh bình luận:', err);
      alert('Không thể tải ảnh lên Cloudinary. Vui lòng thử lại!');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendComment = async () => {
    if ((!commentText.trim() && !commentImage) || submittingComment || uploadingImage) return;
    setSubmittingComment(true);
    await onComment(post.id, commentText.trim(), commentImage);
    setCommentText('');
    setCommentImage(null);
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
        <span className="s-badge s-badge-teal" style={{ alignSelf: 'flex-start' }}>{formatCategory(post.categoryTag)}</span>
      )}

      {/* Content */}
      <p style={{ fontSize: 14, color: 'var(--s-text-secondary)', lineHeight: 1.65, margin: 0 }}>
        {post.content}
      </p>

      {/* Attached Images with Moderation Status */}
      {postImages.length > 0 && (
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
                ⚠️ Bài viết chứa {postImages.length} hình ảnh đã được gắn cờ nhạy cảm bởi chuyên gia/quản trị viên.
              </span>
              <button
                type="button"
                onClick={() => setShowSensitiveImage(true)}
                style={{
                  background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6,
                  padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                }}
              >
                Xem ảnh ({postImages.length})
              </button>
            </div>
          ) : (
            <PostMediaGallery
              images={postImages}
              onImageClick={(img, idx) => {
                setActiveImageIndex(idx);
                setPreviewEnlargedImage(img);
              }}
            />
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: '1px solid var(--s-border)', flexWrap: 'wrap' }}>
        <button className="s-btn-reaction" onClick={() => onReact(post.id, 'hug')}>
          Thích ({post.hugCount})
        </button>
        <button className="s-btn-reaction" onClick={() => onReact(post.id, 'empathy')}>
          Đồng cảm ({post.empathyCount})
        </button>
        <button className="s-btn-reaction" onClick={() => setExpanded(v => !v)}>
          Bình luận ({post.commentCount})
        </button>
      </div>

      {/* Comments section */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--s-border)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Comments list */}
          {post.comments && post.comments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {post.comments.map(c => {
                const cInitial = c.authorPseudonym ? c.authorPseudonym.substring(0, 2).toUpperCase() : 'ẨN';
                const isFlagged = c.isSensitiveHiddenFromStudents || c.moderationStatus === 'Flagged';
                return (
                  <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    {/* Commenter Avatar */}
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      background: c.isExpertComment
                        ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                        : `hsl(${c.authorPseudonym ? c.authorPseudonym.charCodeAt(0) * 45 : 180}, 60%, 42%)`,
                      color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      {c.isExpertComment ? 'GV' : cInitial}
                    </div>

                    {/* Speech bubble + media */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        background: c.isExpertComment ? '#f0fdf4' : '#f0f2f5',
                        border: c.isExpertComment ? '1px solid #bbf7d0' : 'none',
                        borderRadius: 18,
                        padding: '9px 14px',
                        display: 'inline-block',
                        maxWidth: '100%',
                        boxSizing: 'border-box'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: c.isExpertComment ? '#166534' : '#1e293b' }}>
                            {c.authorPseudonym}
                          </span>
                          {c.isExpertComment && (
                            <span style={{ fontSize: 10.5, background: '#dcfce7', color: '#15803d', padding: '1px 7px', borderRadius: 10, fontWeight: 700 }}>
                              Chuyên viên Tâm lý 🎓
                            </span>
                          )}
                        </div>

                        {c.content && (
                          <p style={{ fontSize: 13, color: '#334155', margin: 0, lineHeight: 1.45, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                            {c.content}
                          </p>
                        )}
                      </div>

                      {/* Attached image in comment */}
                      {c.imageUrl && (
                        <div style={{ marginTop: 6 }}>
                          <img
                            src={c.imageUrl}
                            alt="Ảnh bình luận"
                            onClick={() => setPreviewEnlargedImage(c.imageUrl)}
                            title="Nhấp để xem ảnh phóng to"
                            style={{
                              maxWidth: 240, maxHeight: 180, borderRadius: 12, objectFit: 'cover',
                              border: '1px solid #e2e8f0', display: 'block', cursor: 'zoom-in',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                            }}
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                      )}

                      {/* Moderation warning badge if comment contains sensitive keywords */}
                      {isFlagged && (
                        <div style={{
                          marginTop: 4, background: '#fffbeb', border: '1px solid #fef3c7',
                          borderRadius: 8, padding: '4px 8px', fontSize: 11, color: '#92400e',
                          display: 'inline-flex', alignItems: 'center', gap: 4
                        }}>
                          <span>⏳</span>
                          <span>Bình luận chứa từ ngữ cần kiểm duyệt — đang được chuyển đến chuyên gia tâm lý.</span>
                        </div>
                      )}

                      {/* Bottom actions line */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, paddingLeft: 6, fontSize: 11.5, color: '#64748b' }}>
                        <span style={{ cursor: 'pointer', fontWeight: 600 }}>Thích</span>
                        <span>•</span>
                        <span style={{ cursor: 'pointer', fontWeight: 600 }}>Phản hồi</span>
                        <span>•</span>
                        <span>{timeAgo(c.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--s-text-muted)', fontSize: 12.5, margin: '2px 0' }}>Chưa có bình luận nào. Hãy là người đầu tiên gửi lời động viên.</p>
          )}

          {/* Facebook-style Comment Input Box */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 4 }}>
            {/* Current user avatar */}
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
              color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 13, marginTop: 2
            }}>
              {(currentUser?.fullName || currentUser?.anonymousCode || 'U').charAt(0).toUpperCase()}
            </div>

            {/* Input container */}
            <div style={{
              flex: 1, background: '#f0f2f5', borderRadius: 20,
              border: '1px solid #e2e8f0', padding: '8px 12px',
              display: 'flex', flexDirection: 'column', gap: 6,
              transition: 'border-color 0.15s ease'
            }}>
              {/* Image preview before posting */}
              {commentImage && (
                <div style={{ position: 'relative', display: 'inline-block', width: 'fit-content', marginTop: 4 }}>
                  <img
                    src={commentImage}
                    alt="Preview"
                    style={{ maxHeight: 90, maxWidth: 140, borderRadius: 10, objectFit: 'cover', border: '1px solid #cbd5e1' }}
                  />
                  <button
                    type="button"
                    onClick={() => setCommentImage(null)}
                    title="Gỡ ảnh"
                    style={{
                      position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%',
                      background: '#1e293b', color: '#fff', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Uploading indicator */}
              {uploadingImage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#0d9488', fontWeight: 600 }}>
                  <div style={{ width: 14, height: 14, border: '2px solid #99f6e4', borderTopColor: '#0d9488', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                  <span>Đang tải ảnh lên Cloudinary...</span>
                </div>
              )}

              {/* Text input row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendComment();
                    }
                  }}
                  placeholder="Viết bình luận thấu cảm ẩn danh... (Nhấn Enter để gửi)"
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    fontSize: 13.5, color: '#1e293b', padding: '2px 4px'
                  }}
                />

                {/* Attach image button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleSelectImage}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage || submittingComment}
                  title="Đính kèm hình ảnh (chuẩn Facebook)"
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontSize: 18, color: '#64748b', padding: '4px', display: 'flex', alignItems: 'center',
                    borderRadius: '50%', transition: 'color 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#0d9488'}
                  onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                >
                  📷
                </button>

                {/* Send button */}
                <button
                  type="button"
                  disabled={(!commentText.trim() && !commentImage) || submittingComment || uploadingImage}
                  onClick={handleSendComment}
                  style={{
                    background: (commentText.trim() || commentImage) ? '#0d9488' : '#cbd5e1',
                    color: '#ffffff', border: 'none', borderRadius: 16,
                    padding: '6px 14px', fontSize: 12.5, fontWeight: 700,
                    cursor: (commentText.trim() || commentImage) ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {submittingComment ? '...' : 'Gửi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Image Modal / Lightbox */}
      {previewEnlargedImage && (
        <div
          onClick={() => setPreviewEnlargedImage(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
            onClick={e => e.stopPropagation()}
          >
            <img
              src={previewEnlargedImage}
              alt="Phóng to"
              style={{
                maxWidth: '100%',
                maxHeight: '82vh',
                borderRadius: 12,
                objectFit: 'contain',
                boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
              }}
            />

            {/* Navigation buttons if multiple images */}
            {postImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const prevIdx = (activeImageIndex - 1 + postImages.length) % postImages.length;
                    setActiveImageIndex(prevIdx);
                    setPreviewEnlargedImage(postImages[prevIdx]);
                  }}
                  title="Ảnh trước"
                  style={{
                    position: 'absolute', left: -52, top: '50%', transform: 'translateY(-50%)',
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)', color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer',
                    fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)', transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.4)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                >
                  ‹
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextIdx = (activeImageIndex + 1) % postImages.length;
                    setActiveImageIndex(nextIdx);
                    setPreviewEnlargedImage(postImages[nextIdx]);
                  }}
                  title="Ảnh kế tiếp"
                  style={{
                    position: 'absolute', right: -52, top: '50%', transform: 'translateY(-50%)',
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)', color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer',
                    fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)', transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.4)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                >
                  ›
                </button>

                <div style={{
                  marginTop: 12, background: 'rgba(0,0,0,0.6)', color: '#fff',
                  padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700
                }}>
                  Ảnh {activeImageIndex + 1} / {postImages.length}
                </div>
              </>
            )}

            {/* Close button */}
            <button
              type="button"
              onClick={() => setPreviewEnlargedImage(null)}
              title="Đóng (ESC)"
              style={{
                position: 'absolute', top: -14, right: -14, width: 34, height: 34, borderRadius: '50%',
                background: '#ffffff', color: '#0f172a', border: 'none', cursor: 'pointer',
                fontWeight: 900, fontSize: 16, boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

const BG_THEMES = [
  { id: 'none', label: 'Mặc định', bg: '#ffffff', color: '#1e293b' },
  { id: 'sunset', label: 'Hoàng hôn', bg: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)', color: '#ffffff' },
  { id: 'midnight', label: 'Đêm tím', bg: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: '#ffffff' },
  { id: 'emerald', label: 'Ngọc bích', bg: 'linear-gradient(135deg, #0d9488 0%, #10b981 100%)', color: '#ffffff' },
  { id: 'ocean', label: 'Đại dương', bg: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)', color: '#ffffff' },
  { id: 'rose', label: 'Cánh hồng', bg: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)', color: '#ffffff' },
  { id: 'dark', label: 'Trầm tĩnh', bg: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#ffffff' },
];

const FEELINGS_LIST = [
  '😊 Hạnh phúc',
  '☕ Thư thái',
  '🌿 Bình yên',
  '📚 Áp lực thi cử',
  '😰 Lo lắng đồ án',
  '😔 Mệt mỏi',
  '🌧️ Cần được sẻ chia',
  '💡 Có hy vọng',
  '💪 Đang cố gắng',
];

function CreatePostModal({ onClose, onSubmit, currentUser }) {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(CATEGORIES[1].value);
  const [imageUrls, setImageUrls] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('none');
  const [selectedFeeling, setSelectedFeeling] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [showThemes, setShowThemes] = useState(false);
  const [showFeelings, setShowFeelings] = useState(false);
  const [formError, setFormError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (imageUrls.length + files.length > 10) {
      setUploadError(`Bạn chỉ có thể đính kèm tối đa 10 ảnh (hiện đã có ${imageUrls.length} ảnh).`);
      return;
    }

    setUploadingImage(true);
    setUploadError('');
    setUploadProgressText(`Đang chuẩn bị tải ${files.length} ảnh...`);
    try {
      const uploadedUrls = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 10 * 1024 * 1024) continue;
        setUploadProgressText(`Đang tải ảnh ${i + 1}/${files.length} lên Cloudinary...`);
        const res = await uploadImageToCloudinary(file, 'post_images');
        if (res?.url) uploadedUrls.push(res.url);
      }
      if (uploadedUrls.length > 0) {
        setImageUrls(prev => [...prev, ...uploadedUrls]);
        setSelectedTheme('none');
      }
    } catch (err) {
      setUploadError(err.message || 'Lỗi tải ảnh lên Cloudinary.');
    } finally {
      setUploadingImage(false);
      setUploadProgressText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (imageUrls.length >= 10) {
      setUploadError('Tối đa 10 hình ảnh cho một bài viết.');
      return;
    }
    setImageUrls(prev => [...prev, trimmed]);
    setUrlInput('');
    setSelectedTheme('none');
    setUploadError('');
  };

  const handleRemoveImage = (indexToRemove) => {
    setImageUrls(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const authorDisplayName = isAnonymous
    ? (currentUser?.anonymousCode || 'Bạn Ẩn Danh')
    : (currentUser?.fullName || 'Ngô Tấn Lộc');

  const currentTheme = BG_THEMES.find(t => t.id === selectedTheme) || BG_THEMES[0];
  const isGradientTheme = selectedTheme !== 'none' && imageUrls.length === 0;

  const handlePost = () => {
    if (!content.trim()) {
      setFormError('Vui lòng nhập nội dung trước khi đăng.');
      return;
    }
    const finalContent = selectedFeeling ? `[${selectedFeeling}] ${content.trim()}` : content.trim();
    onSubmit({
      content: finalContent,
      category,
      imageUrl: imageUrls.length > 0 ? imageUrls.join(',') : null
    });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(6px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 16,
        width: 1020,
        maxWidth: '96vw',
        height: '88vh',
        maxHeight: 740,
        boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fadeInModal 0.2s ease-out'
      }}>
        
        {/* ══════════════ MODAL HEADER (FACEBOOK STYLE) ══════════════ */}
        <div style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid #e5e7eb',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={onClose}
              aria-label="Đóng"
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: '#f1f5f9', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, color: '#475569', fontWeight: 800, transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
              onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
            >
              ✕
            </button>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#0d9488', color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 16
            }}>
              U
            </div>
          </div>

          <h2 style={{
            fontSize: 18,
            fontWeight: 800,
            color: '#0f172a',
            margin: 0,
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}>
            Tạo bài viết
          </h2>

          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 12, background: '#f0fdfa', color: '#0d9488', padding: '4px 10px', borderRadius: 20, fontWeight: 700 }}>
              🛡️ Privacy-by-Design
            </span>
          </div>
        </div>

        {/* ══════════════ MODAL BODY: DUAL-PANEL (EDITOR + LIVE PREVIEW) ══════════════ */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1.18fr 0.82fr',
          overflow: 'hidden',
          height: 'calc(100% - 56px)'
        }}>
          
          {/* ───────────── CỘT TRÁI: FORM SOẠN THẢO BÀI VIẾT ───────────── */}
          <div style={{
            padding: '18px 22px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            borderRight: '1px solid #e5e7eb'
          }}>
            
            {/* User row & Audience Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 18, flexShrink: 0
              }}>
                {authorDisplayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <strong style={{ fontSize: 14.5, color: '#0f172a' }}>
                    {authorDisplayName}
                  </strong>
                  {selectedFeeling && (
                    <span style={{ fontSize: 12.5, color: '#64748b', fontWeight: 600 }}>
                      đang cảm thấy {selectedFeeling}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  {/* Chế độ danh tính */}
                  <button
                    type="button"
                    onClick={() => setIsAnonymous(v => !v)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: '#f1f5f9', border: '1px solid #cbd5e1',
                      borderRadius: 14, padding: '3px 10px', fontSize: 11.5,
                      fontWeight: 700, color: '#334155', cursor: 'pointer'
                    }}
                  >
                    <span>{isAnonymous ? '🔒 Ẩn danh toàn trường' : '👥 Công khai họ tên'}</span>
                    <span>▾</span>
                  </button>

                  {/* Chọn chủ đề */}
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    style={{
                      background: '#f0fdfa', border: '1px solid #99f6e4',
                      borderRadius: 14, padding: '3px 10px', fontSize: 11.5,
                      fontWeight: 700, color: '#0d9488', cursor: 'pointer', outline: 'none'
                    }}
                  >
                    {CATEGORIES.slice(1).map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>

                  {/* Chọn cảm xúc / tâm trạng */}
                  <button
                    type="button"
                    onClick={() => setShowFeelings(v => !v)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: selectedFeeling ? '#fef3c7' : '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: 14, padding: '3px 10px', fontSize: 11.5,
                      fontWeight: 700, color: selectedFeeling ? '#b45309' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    <span>{selectedFeeling ? selectedFeeling : '😊 Cảm xúc'}</span>
                    <span>▾</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Feelings Picker Popup */}
            {showFeelings && (
              <div style={{
                background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 12,
                padding: '10px 12px', display: 'flex', gap: 6, flexWrap: 'wrap',
                boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
              }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', width: '100%' }}>Chọn tâm trạng:</span>
                {FEELINGS_LIST.map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => { setSelectedFeeling(f === selectedFeeling ? '' : f); setShowFeelings(false); }}
                    style={{
                      padding: '4px 8px', borderRadius: 14, fontSize: 11.5, border: '1px solid #e2e8f0',
                      background: selectedFeeling === f ? '#0d9488' : '#f8fafc',
                      color: selectedFeeling === f ? '#fff' : '#334155', cursor: 'pointer', fontWeight: 600
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}

            {/* Content Textarea with Aa / Emoji */}
            <div style={{
              position: 'relative',
              borderRadius: 12,
              border: '1px solid #cbd5e1',
              background: isGradientTheme ? currentTheme.bg : '#ffffff',
              padding: isGradientTheme ? '28px 18px 46px' : '14px 14px 46px',
              minHeight: 140,
              display: 'flex',
              flexDirection: 'column',
              transition: 'background 0.3s ease'
            }}>
              <textarea
                value={content}
                onChange={e => { setContent(e.target.value); if (formError) setFormError(''); }}
                placeholder={`${authorDisplayName} ơi, bạn đang nghĩ gì thế?`}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontSize: isGradientTheme ? 18 : 14.5,
                  fontWeight: isGradientTheme ? 800 : 500,
                  color: isGradientTheme ? '#ffffff' : '#0f172a',
                  textAlign: isGradientTheme ? 'center' : 'left',
                  minHeight: isGradientTheme ? 90 : 80,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxSizing: 'border-box'
                }}
              />

              {/* Bottom toolbar inside textarea: Aa and Emoji button */}
              <div style={{
                position: 'absolute',
                bottom: 10,
                left: 12,
                right: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                {/* Aa Button to pick Facebook status gradient theme */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setShowThemes(v => !v)}
                    title="Đổi màu nền tâm trạng (Aa)"
                    style={{
                      width: 28, height: 28, borderRadius: 6,
                      background: 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #6366f1 100%)',
                      color: '#ffffff', fontWeight: 900, fontSize: 12, border: 'none',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    Aa
                  </button>

                  {/* Themes palette picker */}
                  {showThemes && (
                    <div style={{ display: 'flex', gap: 5, background: '#ffffff', padding: '4px 6px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid #cbd5e1' }}>
                      {BG_THEMES.map(t => (
                        <div
                          key={t.id}
                          onClick={() => { setSelectedTheme(t.id); setShowThemes(false); }}
                          title={t.label}
                          style={{
                            width: 20, height: 20, borderRadius: 4,
                            background: t.bg, cursor: 'pointer',
                            border: selectedTheme === t.id ? '2px solid #0f766e' : '1px solid #cbd5e1'
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: isGradientTheme ? 'rgba(255,255,255,0.8)' : '#94a3b8' }}>
                    {content.length}/2000
                  </span>
                  <button
                    type="button"
                    onClick={() => setContent(c => c + ' 😊')}
                    style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}
                  >
                    🙂
                  </button>
                </div>
              </div>
            </div>

            {/* ──────── THÊM ẢNH HOẶC KÉO THẢ (HỖ TRỢ NHIỀU ẢNH) ──────── */}
            <div style={{
              border: imageUrls.length > 0 ? '1px solid #cbd5e1' : '2px dashed #cbd5e1',
              borderRadius: 12,
              padding: '14px 16px',
              textAlign: imageUrls.length > 0 ? 'left' : 'center',
              background: '#f8fafc',
              position: 'relative'
            }}>
              {/* Nút tải ảnh lên Cloudinary (hỗ trợ chọn nhiều file) */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />

              {imageUrls.length === 0 ? (
                <div>
                  <div style={{ fontSize: 26, marginBottom: 4 }}>🖼️</div>
                  <strong style={{ fontSize: 13.5, color: '#1e293b', display: 'block', marginBottom: 2 }}>
                    Đính kèm hình ảnh
                  </strong>
                  <p style={{ fontSize: 11.5, color: '#64748b', margin: '0 0 12px' }}>
                    Tải ảnh từ máy tính lên Cloudinary hoặc dán đường dẫn ảnh
                  </p>

                  <div style={{ marginBottom: 12 }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 18px',
                        background: '#0d9488',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 12.5,
                        fontWeight: 800,
                        cursor: uploadingImage ? 'wait' : 'pointer',
                        boxShadow: '0 2px 8px rgba(13, 148, 136, 0.3)',
                        transition: 'all 0.15s'
                      }}
                    >
                      <span>📷</span>
                      <span>{uploadingImage ? uploadProgressText : 'Chọn ảnh từ máy (Có thể chọn nhiều ảnh)'}</span>
                    </button>
                    {uploadError && (
                      <p style={{ color: '#ef4444', fontSize: 11.5, margin: '6px 0 0' }}>
                        ⚠️ {uploadError}
                      </p>
                    )}
                  </div>
                  

                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', maxWidth: 420, margin: '0 auto' }}>
                    <input
                      type="url"
                      placeholder="Hoặc dán URL ảnh tại đây (https://...)"
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddUrl(); } }}
                      style={{
                        flex: 1, padding: '6px 10px', fontSize: 11.5, borderRadius: 6,
                        border: '1px solid #cbd5e1', outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddUrl}
                      disabled={!urlInput.trim()}
                      style={{
                        padding: '6px 12px', background: '#0f766e', color: '#fff', border: 'none',
                        borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: urlInput.trim() ? 'pointer' : 'default'
                      }}
                    >
                      Thêm
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: 13, color: '#1e293b' }}>
                        Danh sách ảnh đính kèm ({imageUrls.length}/10):
                      </strong>
                      {uploadingImage && (
                        <span style={{ fontSize: 11.5, color: '#0d9488', fontWeight: 600 }}>
                          ⏳ {uploadProgressText}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage || imageUrls.length >= 10}
                        style={{
                          padding: '4px 10px', background: '#0d9488', color: '#fff', border: 'none',
                          borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        + Thêm ảnh
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageUrls([])}
                        style={{
                          padding: '4px 8px', background: '#fee2e2', color: '#dc2626', border: 'none',
                          borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        Xóa tất cả
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail strip */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))',
                    gap: 8,
                    maxHeight: 190,
                    overflowY: 'auto',
                    padding: 2
                  }}>
                    {imageUrls.map((url, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: 'relative',
                          width: '100%',
                          paddingTop: '100%',
                          borderRadius: 8,
                          overflow: 'hidden',
                          border: '1px solid #cbd5e1',
                          background: '#090d16'
                        }}
                      >
                        <img
                          src={url}
                          alt={`Thumbnail ${idx + 1}`}
                          style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        <span style={{
                          position: 'absolute', top: 3, left: 3, background: 'rgba(0,0,0,0.65)',
                          color: '#fff', fontSize: 10, fontWeight: 800, padding: '1px 5px', borderRadius: 4
                        }}>
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          title="Xóa ảnh này"
                          style={{
                            position: 'absolute', top: 3, right: 3, width: 20, height: 20,
                            borderRadius: '50%', background: '#dc2626', color: '#fff', border: 'none',
                            fontSize: 11, fontWeight: 900, cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {uploadError && (
                    <p style={{ color: '#ef4444', fontSize: 11.5, margin: '8px 0 0', textAlign: 'center' }}>
                      ⚠️ {uploadError}
                    </p>
                  )}
                </div>
              )}
            </div>


            {formError && (
              <InPageNotification type="warning" message={formError} onClose={() => setFormError('')} />
            )}

            {/* Nút Đăng bài */}
            <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 8 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 18px', borderRadius: 8, border: '1px solid #cbd5e1',
                  background: '#ffffff', color: '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handlePost}
                disabled={!content.trim()}
                style={{
                  flex: 1, padding: '10px 20px', borderRadius: 8, border: 'none',
                  background: content.trim() ? '#0d9488' : '#e2e8f0',
                  color: content.trim() ? '#ffffff' : '#94a3b8',
                  fontSize: 14, fontWeight: 800, cursor: content.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s ease',
                  boxShadow: content.trim() ? '0 4px 14px rgba(13,148,136,0.3)' : 'none'
                }}
              >
                Đăng bài viết
              </button>
            </div>

          </div>

          {/* ───────────── CỘT PHẢI: BẢN XEM TRƯỚC (LIVE PREVIEW NHƯ HÌNH) ───────────── */}
          <div style={{
            background: '#f8fafc',
            padding: '24px 28px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <h3 style={{
              fontSize: 16,
              fontWeight: 800,
              color: '#334155',
              margin: '0 0 16px',
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}>
              Bản xem trước
            </h3>

            {/* PREVIEW POST CARD (FACEBOOK STYLE) */}
            <div style={{
              width: '100%',
              maxWidth: 420,
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              boxShadow: '0 6px 24px rgba(0,0,0,0.06)',
              overflow: 'hidden'
            }}>
              {/* Header card preview */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 16px' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: 16
                  }}>
                    {authorDisplayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
                      {authorDisplayName}
                      {selectedFeeling && (
                        <span style={{ fontWeight: 500, fontSize: 12.5, color: '#64748b', marginLeft: 4 }}>
                          đang cảm thấy {selectedFeeling}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <span>Vừa xong</span>
                      <span>•</span>
                      <span>{isAnonymous ? '🔒 Ẩn danh' : '🌐 Công khai'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ color: '#94a3b8', fontSize: 18, cursor: 'pointer' }}>•••</div>
              </div>

              {/* Category pill */}
              <div style={{ padding: '0 16px 8px' }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: '#0d9488',
                  background: '#f0fdfa', border: '1px solid #ccfbf1',
                  padding: '2px 8px', borderRadius: 12
                }}>
                  #{formatCategory(category)}
                </span>
              </div>

              {/* Content body preview */}
              {isGradientTheme ? (
                <div style={{
                  background: currentTheme.bg,
                  padding: '36px 20px',
                  textAlign: 'center',
                  color: '#ffffff',
                  fontSize: 18,
                  fontWeight: 800,
                  minHeight: 120,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1.5,
                  wordBreak: 'break-word'
                }}>
                  {content || 'Nội dung chia sẻ sẽ hiển thị tại đây...'}
                </div>
              ) : (
                <div style={{ padding: '6px 16px 14px', fontSize: 13.5, color: '#1e293b', lineHeight: 1.6, wordBreak: 'break-word' }}>
                  {content ? (
                    content
                  ) : (
                    <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                      Nội dung bài viết tâm sự sẽ hiển thị trực quan ở đây...
                    </span>
                  )}
                </div>
              )}

              {/* Multi-image gallery preview */}
              {imageUrls.length > 0 && !isGradientTheme && (
                <div style={{ width: '100%', padding: '0 12px 10px' }}>
                  <PostMediaGallery images={imageUrls} />
                </div>
              )}

              {/* Preview Reaction counts */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '10px 16px', fontSize: 11.5, color: '#64748b',
                borderBottom: '1px solid #f1f5f9', marginTop: 4
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>💙 1</span>
                  <span>(Đồng cảm)</span>
                </div>
                <div>0 bình luận</div>
              </div>

              {/* Preview Action buttons (Thích, Bình luận, Chia sẻ) */}
              <div style={{ display: 'flex', padding: '4px 8px' }}>
                <button
                  type="button"
                  style={{
                    flex: 1, padding: '8px', background: 'none', border: 'none',
                    fontSize: 12.5, fontWeight: 700, color: '#64748b', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'default'
                  }}
                >
                  <span>👍</span> Thích
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1, padding: '8px', background: 'none', border: 'none',
                    fontSize: 12.5, fontWeight: 700, color: '#64748b', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'default'
                  }}
                >
                  <span>💬</span> Bình luận
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1, padding: '8px', background: 'none', border: 'none',
                    fontSize: 12.5, fontWeight: 700, color: '#64748b', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'default'
                  }}
                >
                  <span>↗️</span> Chia sẻ
                </button>
              </div>
            </div>

            <p style={{
              fontSize: 11.5,
              color: '#94a3b8',
              textAlign: 'center',
              marginTop: 18,
              maxWidth: 360,
              lineHeight: 1.5
            }}>
              🔒 Bản xem trước thời gian thực. Thông tin của bạn được che giấu bí danh theo chuẩn bảo mật sinh viên UniMind.
            </p>
          </div>

        </div>

      </div>

      <style>{`
        @keyframes fadeInModal {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
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

  const handleComment = async (postId, text, imageUrl = null) => {
    try {
      const res = await axiosClient.post(`/community/posts/${postId}/comments`, {
        content: text || '',
        customPseudonym: user?.anonymousCode || user?.fullName || 'Bạn Ẩn Yên',
        userId: user?.id,
        imageUrl: imageUrl || null
      });
      loadPosts(activeCategory);
      if (res.data?.data?.isSensitiveHiddenFromStudents || res.data?.data?.moderationStatus === 'Flagged') {
        setNotification({
          type: 'warning',
          title: 'Bình luận đang được kiểm duyệt',
          message: 'Bình luận chứa từ ngữ nhạy cảm và đang được chuyển đến chuyên gia tâm lý để kiểm duyệt trước khi hiển thị công khai.'
        });
      } else {
        setNotification({
          type: 'success',
          title: 'Đã gửi bình luận',
          message: 'Lời động viên ẩn danh của bạn đã được xuất bản thành công.'
        });
      }
    } catch (err) {
      console.error('Lỗi gửi bình luận:', err);
      setNotification({
        type: 'error',
        title: 'Không thể gửi bình luận',
        message: err.response?.data?.message || 'Có lỗi xảy ra khi gửi bình luận.'
      });
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

      {/* ══════════════ FACEBOOK-STYLE QUICK POST TRIGGER BOX ══════════════ */}
      <div style={{
        background: '#ffffff',
        borderRadius: 14,
        border: '1px solid #e5e7eb',
        padding: '14px 16px',
        marginBottom: 20,
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 16, flexShrink: 0
          }}>
            {(user?.fullName || user?.anonymousCode || 'U').charAt(0).toUpperCase()}
          </div>
          <div
            onClick={() => setShowCreate(true)}
            style={{
              flex: 1,
              background: '#f1f5f9',
              borderRadius: 24,
              padding: '10px 18px',
              color: '#64748b',
              fontSize: 13.5,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
          >
            {user?.fullName || user?.anonymousCode || 'Bạn'} ơi, bạn đang nghĩ gì thế? Chia sẻ ẩn danh cùng UniMind...
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: 10 }}>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: '#0d9488' }}
          >
            <span>🖼️</span> Thêm ảnh/video
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: '#f59e0b' }}
          >
            <span>😊</span> Cảm xúc/hoạt động
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: '#6366f1' }}
          >
            <span>🔒</span> Ẩn danh bảo mật
          </button>
        </div>
      </div>

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
        <CreatePostModal onClose={() => setShowCreate(false)} onSubmit={handleCreate} currentUser={user} />
      )}
    </div>
  );
}
