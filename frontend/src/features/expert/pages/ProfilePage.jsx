import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../auth/store/authStore';
import axiosClient from '../../auth/api/authApi';
import { uploadImageToCloudinary } from '../../../shared/utils/cloudinaryUpload';

const FIELD_LABEL = {
  fullName:       'Họ và tên',
  title:          'Chức danh',
  academicDegree: 'Học vị / Bằng cấp',
  specialization: 'Chuyên môn',
  experienceYears:'Số năm kinh nghiệm',
  roomLocation:   'Phòng làm việc',
  bio:            'Giới thiệu bản thân',
};

// Danh sách các hình khuôn mặt chuyên viên mẫu chất lượng cao
const PRESET_AVATARS = [
  {
    id: 'face-1',
    label: 'Chuyên gia Nữ (Thanh lịch)',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'face-2',
    label: 'Chuyên gia Nam (Trầm ấm)',
    url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'face-3',
    label: 'Bác sĩ Nữ (Hiền hòa)',
    url: 'https://images.unsplash.com/photo-1594824813595-585ff658a5c6?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'face-4',
    label: 'Bác sĩ Nam (Trưởng khoa)',
    url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'face-5',
    label: 'Chuyên gia Nữ (Trẻ trung)',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'face-6',
    label: 'Chuyên gia Nam (Điềm đạm)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'face-7',
    label: 'Giáo sư / Tham vấn viên',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'face-8',
    label: 'Chuyên gia Tâm lý Học đường',
    url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80'
  }
];

function EditField({ label, name, value, onChange, type = 'text', multi = false, readOnly = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--e-text-muted)' }}>{label}</label>}
      {multi ? (
        <textarea
          value={value || ''}
          onChange={e => onChange(name, e.target.value)}
          rows={3}
          readOnly={readOnly}
          style={{
            padding: '9px 12px', borderRadius: 8, border: '1px solid var(--e-border)',
            background: readOnly ? 'var(--e-surface)' : 'var(--e-bg)',
            color: 'var(--e-text)', fontSize: 13, resize: 'vertical', fontFamily: 'inherit',
            opacity: readOnly ? 0.7 : 1, outline: 'none'
          }}
        />
      ) : (
        <input
          type={type}
          value={value || ''}
          onChange={e => onChange(name, e.target.value)}
          readOnly={readOnly}
          style={{
            padding: '9px 12px', borderRadius: 8, border: '1px solid var(--e-border)',
            background: readOnly ? 'var(--e-surface)' : 'var(--e-bg)',
            color: 'var(--e-text)', fontSize: 13,
            opacity: readOnly ? 0.7 : 1, outline: 'none'
          }}
        />
      )}
    </div>
  );
}

export default function ExpertProfilePage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [form, setForm]       = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [notice, setNotice]   = useState(null);
  const [imgError, setImgError] = useState(false);

  // Cloudinary / Face Picker Modal state
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [uploadingCloudinary, setUploadingCloudinary] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const fileInputRef = useRef(null);

  const userId = user?.id || '33333333-3333-3333-3333-333333333331';

  useEffect(() => {
    setLoading(true);
    axiosClient.get(`/expert/profile/${userId}`)
      .then(res => {
        if (res.data?.data) {
          const d = res.data.data;
          setProfile(d);
          setForm({ ...d });
          setImgError(false);
        }
      })
      .catch(() => {
        const fallback = {
          fullName:       user?.fullName || 'Chuyên viên Tư Vấn Mẫu',
          email:          user?.email || 'expert@unimind.edu.vn',
          role:           'Expert',
          title:          'ThS. Tâm lý',
          academicDegree: 'Thạc sĩ Tâm lý học Lâm sàng ĐHQG',
          specialization: 'Tâm lý Học đường & Định hướng nghề nghiệp',
          experienceYears: 5,
          roomLocation:   'P.302 (Tầng 3)',
          bio:            'Chuyên gia tham vấn tâm lý học đường, hỗ trợ sinh viên vượt qua căng thẳng, lo âu và định hướng phát triển bản thân.',
          rating:          5.0,
          totalConsultations: 100,
          avatarUrl:      PRESET_AVATARS[0].url,
        };
        setProfile(fallback);
        setForm({ ...fallback });
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const handleChange = (name, val) => {
    setForm(prev => ({ ...prev, [name]: val }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        fullName:       form.fullName,
        avatarUrl:      form.avatarUrl,
        title:          form.title,
        academicDegree: form.academicDegree,
        specialization: form.specialization,
        experienceYears: Number(form.experienceYears),
        roomLocation:   form.roomLocation,
        bio:            form.bio,
      };
      await axiosClient.put(`/expert/profile/${userId}`, payload);
      setProfile({ ...profile, ...form });
      setEditing(false);
      setNotice({ type: 'success', msg: 'Cập nhật hồ sơ thành công!' });
    } catch {
      setNotice({ type: 'error', msg: 'Không thể lưu thay đổi, vui lòng thử lại.' });
    } finally {
      setSaving(false);
      setTimeout(() => setNotice(null), 4000);
    }
  };

  // Upload file lên Cloudinary
  const handleFileUploadToCloudinary = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCloudinary(true);
    try {
      const res = await uploadImageToCloudinary(file, 'avatars');
      await applyNewAvatar(res.url);
      setNotice({ type: 'success', msg: 'Đã tải ảnh lên Cloudinary và cập nhật ảnh đại diện thành công!' });
    } catch (err) {
      setNotice({ type: 'error', msg: err.message || 'Có lỗi khi tải ảnh lên Cloudinary.' });
    } finally {
      setUploadingCloudinary(false);
      setShowAvatarModal(false);
      setTimeout(() => setNotice(null), 4000);
    }
  };

  // Áp dụng ảnh đại diện mới
  const applyNewAvatar = async (url) => {
    if (!url) return;
    setImgError(false);
    setProfile(p => ({ ...p, avatarUrl: url }));
    setForm(f => ({ ...f, avatarUrl: url }));

    try {
      await axiosClient.put(`/expert/profile/${userId}`, {
        fullName: profile?.fullName || form?.fullName,
        avatarUrl: url
      });
    } catch {}
    setShowAvatarModal(false);
  };

  if (loading) {
    return (
      <div className="expert-page-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div style={{ textAlign: 'center', color: 'var(--e-text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
          <p>Đang tải hồ sơ chuyên viên...</p>
        </div>
      </div>
    );
  }

  const currentAvatar = (editing ? form?.avatarUrl : profile?.avatarUrl) || PRESET_AVATARS[0].url;
  const displayName   = (editing ? form?.fullName : profile?.fullName) || 'Chuyên viên Tư Vấn';
  const initials      = displayName.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();
  const stars         = Math.round(profile?.rating || 5);

  return (
    <div className="expert-page-shell">
      {/* Notice Banner */}
      {notice && (
        <div style={{
          padding: '12px 18px', borderRadius: 10, marginBottom: 18, fontWeight: 700, fontSize: 13,
          background: notice.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: notice.type === 'success' ? '#065f46' : '#991b1b',
          border: `1px solid ${notice.type === 'success' ? '#6ee7b7' : '#fca5a5'}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>{notice.type === 'success' ? '✅' : '❌'} {notice.msg}</div>
          <button onClick={() => setNotice(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'inherit', fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="e-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Avatar with Cloudinary Face Picker Trigger */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              onClick={() => setShowAvatarModal(true)}
              style={{
                position: 'relative',
                cursor: 'pointer',
                borderRadius: 16,
                overflow: 'hidden',
                width: 88,
                height: 88,
                border: '3px solid #0284c7',
                boxShadow: '0 4px 14px rgba(2,132,199,0.25)',
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Nhấn để chọn hình khuôn mặt hoặc tải ảnh lên Cloudinary"
            >
              {!imgError && currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt={displayName}
                  onError={() => setImgError(true)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%', background: 'linear-gradient(135deg, #0284c7, #0d9488)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 900, color: '#fff'
                }}>
                  {initials}
                </div>
              )}

              {/* Hover overlay with Camera Icon */}
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 10.5, fontWeight: 800, opacity: 0, transition: 'opacity 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0'}
              >
                <span style={{ fontSize: 18 }}>📷</span>
                <span>Đổi ảnh</span>
              </div>
            </div>

            <span style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 18, height: 18, background: '#10b981', borderRadius: '50%', border: '2.5px solid #ffffff'
            }} />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--e-text)', margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {displayName}
              </h2>
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                style={{
                  padding: '3px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 700,
                  background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', cursor: 'pointer'
                }}
              >
                📷 Chọn hình khuôn mặt (Cloudinary)
              </button>
            </div>

            <p style={{ fontSize: 13.5, color: '#0284c7', fontWeight: 700, margin: '0 0 6px' }}>
              🩺 {profile?.title || 'ThS. Tâm lý'} — {profile?.academicDegree || 'Thạc sĩ Tâm lý học Lâm sàng'}
            </p>
            <p style={{ fontSize: 12.5, color: 'var(--e-text-muted)', margin: '0 0 10px' }}>
              📧 {profile?.email} &nbsp;•&nbsp; 🏢 {profile?.roomLocation || 'P.302 (Tầng 3)'}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="e-badge e-badge-primary">✅ Đã xác minh</span>
              <span className="e-badge e-badge-success">
                {'⭐'.repeat(stars)} {profile?.rating?.toFixed(1) || '5.0'}
              </span>
              <span className="e-badge" style={{ background: 'var(--e-surface)', color: 'var(--e-text-muted)' }}>
                {profile?.totalConsultations || 100} ca tham vấn
              </span>
              <span className="e-badge" style={{ background: 'var(--e-surface)', color: 'var(--e-text-muted)' }}>
                {profile?.experienceYears || 5} năm KN
              </span>
            </div>
          </div>

          {/* Edit button */}
          <div style={{ flexShrink: 0 }}>
            {editing ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setForm({ ...profile }); setEditing(false); }}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: '1px solid var(--e-border)',
                    background: 'var(--e-surface)', color: 'var(--e-text-muted)', cursor: 'pointer', fontWeight: 700, fontSize: 13
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '8px 18px', borderRadius: 8, border: 'none',
                    background: '#0284c7', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
                    fontWeight: 800, fontSize: 13, opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? 'Đang lưu...' : '💾 Lưu thay đổi'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditing(true)}
                style={{
                  padding: '8px 18px', borderRadius: 8, border: '1px solid #0284c7',
                  background: 'transparent', color: '#0284c7', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#0284c7'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0284c7'; }}
              >
                ✏️ Chỉnh sửa hồ sơ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Editable Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>

        {/* Personal Info */}
        <div className="e-card">
          <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--e-text)', margin: '0 0 16px', borderBottom: '1px solid var(--e-border)', paddingBottom: 10 }}>
            👤 Thông tin cá nhân
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <EditField label="Họ và tên" name="fullName" value={editing ? form?.fullName : profile?.fullName} onChange={handleChange} readOnly={!editing} />
            <EditField label="Email (không thể thay đổi)" name="email" value={profile?.email} onChange={() => {}} readOnly />
            <EditField label="Vai trò" name="role" value="Chuyên viên Tâm lý" onChange={() => {}} readOnly />
          </div>
        </div>

        {/* Professional Info */}
        <div className="e-card">
          <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--e-text)', margin: '0 0 16px', borderBottom: '1px solid var(--e-border)', paddingBottom: 10 }}>
            🩺 Thông tin chuyên môn
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <EditField label="Chức danh" name="title" value={editing ? form?.title : profile?.title} onChange={handleChange} readOnly={!editing} />
            <EditField label="Học vị / Bằng cấp" name="academicDegree" value={editing ? form?.academicDegree : profile?.academicDegree} onChange={handleChange} readOnly={!editing} />
            <EditField label="Chuyên môn" name="specialization" value={editing ? form?.specialization : profile?.specialization} onChange={handleChange} readOnly={!editing} />
            <EditField label="Số năm kinh nghiệm" name="experienceYears" type="number" value={editing ? form?.experienceYears : profile?.experienceYears} onChange={handleChange} readOnly={!editing} />
            <EditField label="Phòng làm việc" name="roomLocation" value={editing ? form?.roomLocation : profile?.roomLocation} onChange={handleChange} readOnly={!editing} />
          </div>
        </div>

        {/* Bio */}
        <div className="e-card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--e-text)', margin: '0 0 16px', borderBottom: '1px solid var(--e-border)', paddingBottom: 10 }}>
            📝 Giới thiệu bản thân
          </h3>
          <EditField label="" name="bio" value={editing ? form?.bio : profile?.bio} onChange={handleChange} multi readOnly={!editing} />
          {!editing && (
            <p style={{ fontSize: 12, color: 'var(--e-text-muted)', margin: '8px 0 0' }}>
              Nhấn <strong>Chỉnh sửa hồ sơ</strong> để cập nhật nội dung giới thiệu hiển thị cho sinh viên.
            </p>
          )}
        </div>
      </div>

      {/* ── MODAL CHỌN HÌNH KHUÔN MẶT & CLOUDINARY UPLOAD ── */}
      {showAvatarModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 580,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden', border: '1px solid #e2e8f0'
          }}>
            <div style={{
              padding: '16px 22px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                  📷 Chọn Hình Khuôn Mặt Chuyên Viên
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                  Lưu trữ trên Cloudinary CDN và đồng bộ với hồ sơ tham vấn
                </p>
              </div>
              <button onClick={() => setShowAvatarModal(false)} style={{ background: 'none', border: 'none', fontSize: 18, color: '#94a3b8', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: 22 }}>
              {/* Preset Face Grid */}
              <label style={{ fontSize: 13, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 10 }}>
                1. Chọn khuôn mặt chuyên gia mẫu:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                {PRESET_AVATARS.map(avatar => {
                  const isSelected = currentAvatar === avatar.url;
                  return (
                    <div
                      key={avatar.id}
                      onClick={() => applyNewAvatar(avatar.url)}
                      style={{
                        position: 'relative',
                        borderRadius: 12,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: `2.5px solid ${isSelected ? '#0284c7' : '#e2e8f0'}`,
                        boxShadow: isSelected ? '0 0 0 2px #bae6fd' : 'none',
                        aspectRatio: '1',
                        transition: 'transform 0.15s, border-color 0.15s',
                        background: '#f8fafc'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      title={avatar.label}
                    >
                      <img src={avatar.url} alt={avatar.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {isSelected && (
                        <div style={{
                          position: 'absolute', top: 4, right: 4, background: '#0284c7', color: '#fff',
                          width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900
                        }}>
                          ✓
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Upload to Cloudinary File Input */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 8 }}>
                  2. Hoặc tải ảnh từ máy tính (Lưu vào Cloudinary):
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUploadToCloudinary}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingCloudinary}
                  className="e-btn e-btn-primary"
                  style={{ width: '100%', padding: '10px 16px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <span>☁️</span>
                  <span>{uploadingCloudinary ? 'Đang tải lên Cloudinary...' : 'Chọn file ảnh từ thiết bị để tải lên Cloudinary'}</span>
                </button>
              </div>

              {/* Manual URL Input */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                  3. Hoặc nhập trực tiếp đường link ảnh (URL / Cloudinary URL):
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="url"
                    placeholder="https://res.cloudinary.com/..."
                    value={customAvatarUrl}
                    onChange={e => setCustomAvatarUrl(e.target.value)}
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1',
                      fontSize: 13, fontFamily: "'Manrope', sans-serif", outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customAvatarUrl.trim()) {
                        applyNewAvatar(customAvatarUrl.trim());
                        setCustomAvatarUrl('');
                      }
                    }}
                    style={{
                      padding: '8px 16px', borderRadius: 8, background: '#0284c7', color: '#fff',
                      border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer'
                    }}
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
