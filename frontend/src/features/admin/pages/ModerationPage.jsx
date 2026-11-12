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
const formatCategory = (cat) => CATEGORY_MAP[cat] || cat || 'Chung';

export default function AdminModerationPage() {
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'comments'
  const [posts, setPosts] = useState([]);
  const [flaggedComments, setFlaggedComments] = useState([]);
  const [postFilter, setPostFilter] = useState('all'); // 'all' | 'flagged' | 'has_image' | 'approved' | 'hidden'
  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const loadPosts = () => {
    setLoading(true);
    // Ưu tiên lấy đầy đủ danh sách bài viết từ CSDL (chế độ Staff/Admin)
    axiosClient.get('/community/posts', { params: { isStaff: true } })
      .then(r => {
        if (r.data?.data && Array.isArray(r.data.data)) {
          mapAndSetPosts(r.data.data);
        } else {
          fallbackQueue();
        }
      })
      .catch(() => {
        fallbackQueue();
      })
      .finally(() => setLoading(false));
  };

  const fallbackQueue = () => {
    axiosClient.get('/admin/moderation-queue')
      .then(r2 => {
        if (r2.data?.data && Array.isArray(r2.data.data)) {
          mapAndSetPosts(r2.data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const mapAndSetPosts = (dataList) => {
    const mapped = dataList.map(p => ({
      id: p.id,
      code: p.anonymousPseudonym || 'Bạn Ẩn Yên',
      roleTag: p.studentRoleTag || 'Sinh viên LHU',
      content: p.content,
      cat: formatCategory(p.categoryTag),
      status: p.moderationStatus || 'Approved',
      score: p.riskScore ?? 0,
      imageUrl: p.imageUrl,
      imageModerationStatus: p.imageModerationStatus || 'None',
      imageModerationNote: p.imageModerationNote,
      detectedKeywords: p.detectedKeywords,
      hasKeywordsAlert: !!p.hasKeywordsAlert,
      isCrisis: !!p.isExtremeCrisis || !!p.hasKeywordsAlert || (p.riskScore >= 75),
      createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
      comments: p.comments || []
    }));
    setPosts(mapped);
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

  // Bộ lọc bài viết
  const filteredPosts = posts.filter(p => {
    if (postFilter === 'all') return true;
    if (postFilter === 'flagged') {
      return p.hasKeywordsAlert || p.isCrisis || p.score >= 60 || p.status === 'Flagged' || p.imageModerationStatus === 'Flagged';
    }
    if (postFilter === 'has_image') return !!p.imageUrl;
    if (postFilter === 'approved') return p.status === 'Approved';
    if (postFilter === 'hidden') return p.status === 'Hidden' || p.status === 'Rejected';
    return true;
  });

  const countFlagged = posts.filter(p => p.hasKeywordsAlert || p.isCrisis || p.score >= 60 || p.status === 'Flagged' || p.imageModerationStatus === 'Flagged').length;
  const countWithImage = posts.filter(p => !!p.imageUrl).length;
  const countApproved = posts.filter(p => p.status === 'Approved').length;
  const countHidden = posts.filter(p => p.status === 'Hidden' || p.status === 'Rejected').length;

  // Thao tác ẩn bài viết
  const handleHide = async (id, author) => {
    try {
      await axiosClient.post(`/admin/posts/${id}/moderate`, { action: 'hide', reason: 'Admin ẩn bài vi phạm tiêu chuẩn cộng đồng' });
    } catch { /* optimistic */ }
    setPosts(p => p.map(post => post.id === id ? { ...post, status: 'Hidden' } : post));
    setActionNotice({
      type: 'warning',
      title: 'Đã ẩn bài viết',
      message: `Bài viết của "${author}" đã được tạm ẩn khỏi bảng tin sinh viên.`
    });
  };

  // Thao tác phê duyệt bài viết
  const handleApprove = async (id, author) => {
    try {
      await axiosClient.post(`/admin/posts/${id}/moderate`, { action: 'approve', reason: 'Admin phê duyệt bài viết đạt tiêu chuẩn an toàn' });
    } catch { /* optimistic */ }
    setPosts(p => p.map(post => post.id === id ? { ...post, status: 'Approved' } : post));
    setActionNotice({
      type: 'success',
      title: 'Phê duyệt thành công',
      message: `Bài viết của "${author}" đã được hiển thị công khai trên cộng đồng.`
    });
  };

  // Thao tác can thiệp SOS
  const handleSos = async (id, author) => {
    try {
      await axiosClient.post(`/admin/posts/${id}/moderate`, { action: 'sos_intervene', reason: 'Admin kích hoạt can thiệp SOS hỗ trợ tâm lý khẩn' });
    } catch { /* optimistic */ }
    setPosts(p => p.map(post => post.id === id ? { ...post, status: 'Flagged', score: 99 } : post));
    setActionNotice({
      type: 'error',
      title: 'Đã kích hoạt can thiệp SOS',
      message: `Đội ngũ chuyên viên tâm lý UniMind đã được điều phối hỗ trợ khẩn cấp cho "${author}".`
    });
  };

  // Thao tác xóa bài viết vĩnh viễn
  const handleDeletePost = async (id, author) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn bài viết của "${author}" không? Hành động này không thể hoàn tác.`)) {
      return;
    }
    try {
      await axiosClient.delete(`/community/posts/${id}`);
    } catch { /* optimistic */ }
    setPosts(p => p.filter(post => post.id !== id));
    setActionNotice({
      type: 'neutral',
      title: 'Đã xóa bài viết',
      message: `Bài viết của "${author}" đã được xóa vĩnh viễn khỏi hệ thống CSDL.`
    });
  };

  // Kiểm duyệt hình ảnh bài viết
  const handleModerateImage = async (id, action, author) => {
    try {
      await axiosClient.patch(`/community/posts/${id}/moderate-image`, { action, note: `Admin kiểm duyệt: ${action}` });
    } catch { /* optimistic */ }
    setPosts(p => p.map(post => post.id === id ? { ...post, imageModerationStatus: action } : post));
    setActionNotice({
      type: action === 'Rejected' ? 'warning' : 'success',
      title: 'Kiểm duyệt hình ảnh thành công',
      message: `Hình ảnh trong bài của "${author}" đã chuyển sang trạng thái: ${action === 'Approved' ? 'Đã duyệt công khai' : action === 'Rejected' ? 'Từ chối / Ẩn ảnh' : 'Gắn cờ nhạy cảm'}.`
    });
  };

  // Kiểm duyệt bình luận
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

  // Hàm làm gọn và chuẩn hóa hiển thị cảnh báo AI
  const formatDetectedKeywords = (raw) => {
    if (!raw) return null;
    let clean = raw
      .replace(/\[AI: Bullying\]\s*Nội dung chứa từ ngữ xúc phạm trực tiếp\s*\('([^']+)'\)[^;]*/g, '[AI: Bắt nạt] Xúc phạm (\'$1\')')
      .replace(/\[AI: Toxicity\]\s*Nội dung chứa từ ngữ thô tục[^;]*/g, '[AI: Thô tục] Ngôn từ công kích')
      .replace(/\[AI: SelfHarm\]\s*Nội dung chứa tuyên bố trực tiếp[^;]*/g, '[AI: Khủng hoảng] Nguy cơ tự hại');

    const parts = clean.split(';').map(p => p.trim()).filter(Boolean);
    if (parts.length <= 1) return clean;

    const filtered = [];
    for (const part of parts) {
      if (!filtered.some(f => f.includes(part) || part.includes(f))) {
        filtered.push(part);
      }
    }
    return filtered.slice(0, 2).join(' • ');
  };

  // Hàm bóc tách danh sách URL ảnh (nếu có nhiều ảnh nối bằng dấu phẩy)
  const extractImageUrls = (raw) => {
    if (!raw) return [];
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  };

  return (
    <div className="admin-page-shell" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div className="admin-page-header" style={{ marginBottom: 20 }}>
        <h1 className="admin-page-title" style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 6px' }}>
          Kiểm Duyệt Nội Dung, Bình Luận &amp; Hình Ảnh
        </h1>
        <p className="admin-page-subtitle" style={{ fontSize: 13.5, color: '#64748b', margin: 0 }}>
          Giám sát thời gian thực toàn bộ bài viết, bình luận và hình ảnh từ cộng đồng UniMind bằng hệ thống AI Sentinel tự động phát hiện vi phạm
        </p>
      </div>

      {actionNotice && (
        <InPageNotification
          type={actionNotice.type}
          title={actionNotice.title}
          message={actionNotice.message}
          onClose={() => setActionNotice(null)}
        />
      )}

      {/* Thống kê nhanh */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#ffffff', borderRadius: 10, padding: '12px 16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Tổng bài viết CSDL</span>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{posts.length}</div>
        </div>
        <div style={{ background: countFlagged > 0 ? '#fef2f2' : '#ffffff', borderRadius: 10, padding: '12px 16px', border: `1px solid ${countFlagged > 0 ? '#fca5a5' : '#e2e8f0'}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: 12, color: countFlagged > 0 ? '#dc2626' : '#64748b', fontWeight: 600 }}>Cần lưu ý / Nhạy cảm</span>
          <div style={{ fontSize: 22, fontWeight: 800, color: countFlagged > 0 ? '#b91c1c' : '#0f172a', marginTop: 4 }}>{countFlagged}</div>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Có hình ảnh</span>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0284c7', marginTop: 4 }}>{countWithImage}</div>
        </div>
        <div style={{ background: flaggedComments.length > 0 ? '#fffbeb' : '#ffffff', borderRadius: 10, padding: '12px 16px', border: `1px solid ${flaggedComments.length > 0 ? '#fde68a' : '#e2e8f0'}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: 12, color: flaggedComments.length > 0 ? '#b45309' : '#64748b', fontWeight: 600 }}>Bình luận gắn cờ</span>
          <div style={{ fontSize: 22, fontWeight: 800, color: flaggedComments.length > 0 ? '#d97706' : '#0f172a', marginTop: 4 }}>{flaggedComments.length}</div>
        </div>
      </div>

      {/* Main Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
        <button
          onClick={() => setActiveTab('posts')}
          style={{
            padding: '9px 20px', borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
            border: 'none', transition: 'all 0.15s ease',
            background: activeTab === 'posts' ? '#0d9488' : '#f1f5f9',
            color: activeTab === 'posts' ? '#ffffff' : '#64748b'
          }}
        >
          📝 Bài viết sinh viên ({posts.length})
        </button>
        <button
          onClick={() => { setActiveTab('comments'); loadFlaggedComments(); }}
          style={{
            padding: '9px 20px', borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
            border: 'none', transition: 'all 0.15s ease',
            background: activeTab === 'comments' ? '#0d9488' : '#f1f5f9',
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

      {/* Sub Filter Tabs (for Posts) */}
      {activeTab === 'posts' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `Tất cả bài viết (${posts.length})` },
            { id: 'flagged', label: `Cần lưu ý (${countFlagged})` },
            { id: 'has_image', label: `Có hình ảnh (${countWithImage})` },
            { id: 'approved', label: `Đã phê duyệt (${countApproved})` },
            { id: 'hidden', label: `Đã ẩn (${countHidden})` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setPostFilter(f.id)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                border: postFilter === f.id ? '1px solid #0d9488' : '1px solid #e2e8f0',
                background: postFilter === f.id ? '#ccfbf1' : '#ffffff',
                color: postFilter === f.id ? '#0f766e' : '#64748b',
                transition: 'all 0.15s ease'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Content: Posts */}
      {activeTab === 'posts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {loading && posts.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Đang tải dữ liệu từ CSDL...</div>
          ) : filteredPosts.length === 0 ? (
            <div className="admin-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', color: '#1e293b' }}>Không có bài viết nào trong danh mục này</p>
              <p style={{ fontSize: 13, margin: 0 }}>Vui lòng chọn bộ lọc khác để kiểm tra bài viết.</p>
            </div>
          ) : (
            filteredPosts.map(post => {
              const images = extractImageUrls(post.imageUrl);
              const isFlaggedOrCrisis = post.isCrisis || post.status === 'Flagged' || post.score >= 75;
              const isHidden = post.status === 'Hidden' || post.status === 'Rejected';

              return (
                <div
                  key={post.id}
                  className="admin-card"
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderLeft: `4px solid ${isFlaggedOrCrisis ? '#ef4444' : isHidden ? '#94a3b8' : post.score >= 50 ? '#f59e0b' : '#10b981'}`,
                    borderRadius: 12,
                    padding: '16px 20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14.5, fontWeight: 700, color: '#0f172a' }}>{post.code}</span>
                        <span style={{ fontSize: 12, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4 }}>{post.roleTag}</span>
                        <span style={{ fontSize: 12, color: '#0d9488', fontWeight: 600 }}>• {post.cat}</span>
                        <span style={{ fontSize: 11.5, color: '#94a3b8' }}>
                          {post.createdAt ? new Date(post.createdAt).toLocaleString('vi-VN') : ''}
                        </span>
                      </div>

                      {/* AI Badges & Alerts */}
                      <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                        {post.isCrisis && (
                          <span style={{ fontSize: 11, fontWeight: 700, background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: 4, border: '1px solid #fca5a5' }}>
                            🚨 Khủng hoảng nguy cơ
                          </span>
                        )}
                        {formatDetectedKeywords(post.detectedKeywords) && (
                          <span style={{ fontSize: 11, fontWeight: 600, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 4, border: '1px solid #fde68a' }}>
                            ⚠️ {formatDetectedKeywords(post.detectedKeywords)}
                          </span>
                        )}
                        {post.score > 0 && (
                          <span style={{ fontSize: 11, fontWeight: 600, background: post.score >= 75 ? '#fee2e2' : post.score >= 50 ? '#fef3c7' : '#f0fdf4', color: post.score >= 75 ? '#dc2626' : post.score >= 50 ? '#b45309' : '#16a34a', padding: '2px 8px', borderRadius: 4 }}>
                            Điểm rủi ro AI: {post.score}/100
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                          background: post.status === 'Approved' ? '#f0fdf4' : post.status === 'Flagged' ? '#fee2e2' : '#f1f5f9',
                          color: post.status === 'Approved' ? '#166534' : post.status === 'Flagged' ? '#991b1b' : '#475569',
                          border: `1px solid ${post.status === 'Approved' ? '#bbf7d0' : post.status === 'Flagged' ? '#fecaca' : '#cbd5e1'}`
                        }}
                      >
                        Bài viết: {post.status === 'Approved' ? 'Công khai' : post.status === 'Flagged' ? 'Cần duyệt' : 'Đã ẩn'}
                      </span>

                      {images.length > 0 && (
                        <span
                          style={{
                            fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                            background: post.imageModerationStatus === 'Approved' ? '#f0fdf4' : post.imageModerationStatus === 'Rejected' ? '#fef2f2' : post.imageModerationStatus === 'Flagged' ? '#fef3c7' : '#f8fafc',
                            color: post.imageModerationStatus === 'Approved' ? '#166534' : post.imageModerationStatus === 'Rejected' ? '#991b1b' : post.imageModerationStatus === 'Flagged' ? '#92400e' : '#475569',
                            border: '1px solid #cbd5e1'
                          }}
                        >
                          Ảnh ({images.length}): {post.imageModerationStatus === 'Approved' ? 'Đã duyệt' : post.imageModerationStatus === 'Rejected' ? 'Từ chối' : post.imageModerationStatus === 'Flagged' ? 'Gắn cờ' : 'Chưa duyệt'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Post Content */}
                  <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, margin: '0 0 14px', background: '#f8fafc', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    {post.content}
                  </div>

                  {/* Attached Images & Image Moderation Section */}
                  {images.length > 0 && (
                    <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 8, padding: '12px 16px', marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1e293b' }}>
                          📷 Kiểm duyệt hình ảnh đính kèm ({images.length} ảnh):
                        </span>
                        {post.imageModerationNote && (
                          <span style={{ fontSize: 11.5, color: '#b45309', fontWeight: 600 }}>
                            {post.imageModerationNote}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        {images.map((imgUrl, idx) => (
                          <div
                            key={idx}
                            style={{ width: 120, height: 80, borderRadius: 6, overflow: 'hidden', border: '2px solid #cbd5e1', cursor: 'zoom-in', position: 'relative' }}
                            onClick={() => setPreviewImage(imgUrl)}
                            title="Bấm để phóng to ảnh"
                          >
                            <img src={imgUrl} alt={`Ảnh ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                            <span style={{ position: 'absolute', bottom: 2, right: 2, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, padding: '1px 4px', borderRadius: 3 }}>
                              #{idx + 1}
                            </span>
                          </div>
                        ))}

                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginLeft: 'auto' }}>
                          <button
                            type="button"
                            onClick={() => handleModerateImage(post.id, 'Approved', post.code)}
                            style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, background: '#10b981', color: '#ffffff', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            ✓ Duyệt ảnh
                          </button>
                          <button
                            type="button"
                            onClick={() => handleModerateImage(post.id, 'Flagged', post.code)}
                            style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, background: '#f59e0b', color: '#ffffff', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            ⚠️ Gắn cờ nhạy cảm
                          </button>
                          <button
                            type="button"
                            onClick={() => handleModerateImage(post.id, 'Rejected', post.code)}
                            style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            ✕ Từ chối / Ẩn ảnh
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Post Action Buttons */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 6, borderTop: '1px solid #f1f5f9' }}>
                    {post.status === 'Approved' ? (
                      <button
                        type="button"
                        onClick={() => handleHide(post.id, post.code)}
                        style={{ padding: '7px 16px', fontSize: 12.5, fontWeight: 700, background: '#f8fafc', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 6, cursor: 'pointer' }}
                      >
                        👁️ Ẩn bài viết
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApprove(post.id, post.code)}
                        style={{ padding: '7px 16px', fontSize: 12.5, fontWeight: 700, background: '#10b981', color: '#ffffff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                      >
                        ✓ Phê duyệt công khai
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSos(post.id, post.code)}
                      style={{ padding: '7px 16px', fontSize: 12.5, fontWeight: 700, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer' }}
                    >
                      🚨 Kích hoạt SOS can thiệp
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeletePost(post.id, post.code)}
                      style={{ padding: '7px 14px', fontSize: 12.5, fontWeight: 600, background: '#ffffff', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', marginLeft: 'auto' }}
                    >
                      🗑️ Xóa bài viết
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Content: Flagged Comments */}
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
                <div
                  key={c.id}
                  className="admin-card"
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderLeft: `4px solid ${isFlagged ? '#ef4444' : '#10b981'}`,
                    borderRadius: 12,
                    padding: '16px 20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{c.authorPseudonym}</span>
                      <span style={{ fontSize: 11.5, color: '#64748b', marginLeft: 8 }}>
                        {c.createdAt ? new Date(c.createdAt).toLocaleString('vi-VN') : ''}
                      </span>
                      {c.isExpertComment && (
                        <span style={{ marginLeft: 8, fontSize: 11, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                          Chuyên viên
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {formatDetectedKeywords(c.detectedKeywords) && (
                        <span style={{ fontSize: 11.5, fontWeight: 600, background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 4, border: '1px solid #fca5a5' }}>
                          Từ khóa: {formatDetectedKeywords(c.detectedKeywords)}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                          background: c.moderationStatus === 'Approved' ? '#f0fdf4' : c.moderationStatus === 'Hidden' ? '#f1f5f9' : '#fee2e2',
                          color: c.moderationStatus === 'Approved' ? '#166534' : c.moderationStatus === 'Hidden' ? '#475569' : '#991b1b',
                          border: '1px solid #cbd5e1'
                        }}
                      >
                        {c.moderationStatus === 'Approved' ? 'Đã duyệt' : c.moderationStatus === 'Hidden' ? 'Đã ẩn' : 'Gắn cờ'}
                      </span>
                    </div>
                  </div>

                  {c.content && (
                    <p style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.6, margin: '0 0 12px', background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
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
                      type="button"
                      style={{ padding: '6px 14px', fontSize: 12.5, fontWeight: 700, background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                      onClick={() => handleModerateComment(c.id, 'approve', c.authorPseudonym)}
                    >
                      ✓ Duyệt hiển thị
                    </button>
                    <button
                      type="button"
                      style={{ padding: '6px 14px', fontSize: 12.5, fontWeight: 600, background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}
                      onClick={() => handleModerateComment(c.id, 'hide', c.authorPseudonym)}
                    >
                      👁️ Tạm ẩn
                    </button>
                    <button
                      type="button"
                      style={{ padding: '6px 14px', fontSize: 12.5, fontWeight: 700, background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
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
