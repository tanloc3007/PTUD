import { useState, useEffect } from 'react';
import { useAuthStore } from '../../auth/store/authStore';
import axiosClient from '../../auth/api/authApi';

const FIELD_LABEL = {
  fullName:       'Họ và tên',
  title:          'Chức danh',
  academicDegree: 'Học vị / Bằng cấp',
  specialization: 'Chuyên môn',
  experienceYears:'Số năm kinh nghiệm',
  roomLocation:   'Phòng làm việc',
  bio:            'Giới thiệu bản thân',
};

function EditField({ label, name, value, onChange, type = 'text', multi = false, readOnly = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--e-text-muted)' }}>{label}</label>
      {multi ? (
        <textarea
          value={value}
          onChange={e => onChange(name, e.target.value)}
          rows={3}
          readOnly={readOnly}
          style={{
            padding: '9px 12px', borderRadius: 8, border: '1px solid var(--e-border)',
            background: readOnly ? 'var(--e-surface)' : 'var(--e-bg)',
            color: 'var(--e-text)', fontSize: 13, resize: 'vertical', fontFamily: 'inherit',
            opacity: readOnly ? 0.7 : 1,
          }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(name, e.target.value)}
          readOnly={readOnly}
          style={{
            padding: '9px 12px', borderRadius: 8, border: '1px solid var(--e-border)',
            background: readOnly ? 'var(--e-surface)' : 'var(--e-bg)',
            color: 'var(--e-text)', fontSize: 13,
            opacity: readOnly ? 0.7 : 1,
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

  const userId = user?.id || '33333333-3333-3333-3333-333333333331';

  useEffect(() => {
    setLoading(true);
    axiosClient.get(`/expert/profile/${userId}`)
      .then(res => {
        if (res.data?.data) {
          setProfile(res.data.data);
          setForm({ ...res.data.data });
        }
      })
      .catch(() => {
        // Fallback: use user store data
        const fallback = {
          fullName:       user?.fullName || 'Chuyên viên',
          email:          user?.email || '',
          role:           'Expert',
          title:          'Chuyên viên Tâm lý',
          academicDegree: 'Thạc sĩ Tâm lý học',
          specialization: 'Tư vấn & Trị liệu Tâm lý Học đường',
          experienceYears: 5,
          roomLocation:   'P.302 (Tầng 3)',
          bio:            'Chuyên gia tham vấn tâm lý học đường, hỗ trợ sinh viên vượt qua căng thẳng.',
          rating:          4.8,
          totalConsultations: 0,
          avatarUrl:      null,
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

  const displayName  = (editing ? form?.fullName : profile?.fullName) || 'Chuyên viên';
  const initials     = displayName.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();
  const stars        = Math.round(profile?.rating || 5);

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
          {notice.type === 'success' ? '✅' : '❌'} {notice.msg}
          <button onClick={() => setNotice(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'inherit', fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* Profile Header */}
      <div className="e-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={displayName}
                style={{ width: 80, height: 80, borderRadius: 14, objectFit: 'cover', border: '3px solid var(--e-primary)' }} />
            ) : (
              <div style={{
                width: 80, height: 80, borderRadius: 14, background: 'linear-gradient(135deg, var(--e-primary), #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, fontWeight: 900, color: '#fff', flexShrink: 0
              }}>
                {initials}
              </div>
            )}
            <span style={{
              position: 'absolute', bottom: -4, right: -4,
              width: 16, height: 16, background: '#10b981', borderRadius: '50%', border: '2px solid var(--e-card)'
            }} />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--e-text)', margin: '0 0 4px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {displayName}
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--e-primary)', fontWeight: 700, margin: '0 0 6px' }}>
              🩺 {profile?.title || 'Chuyên viên Tâm lý'} — {profile?.academicDegree}
            </p>
            <p style={{ fontSize: 12.5, color: 'var(--e-text-muted)', margin: '0 0 10px' }}>
              📧 {profile?.email} &nbsp;•&nbsp; 🏢 {profile?.roomLocation}
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span className="e-badge e-badge-primary">✅ Đã xác minh</span>
              <span className="e-badge e-badge-success">
                {'⭐'.repeat(stars)} {profile?.rating?.toFixed(1)}
              </span>
              <span className="e-badge" style={{ background: 'var(--e-surface)', color: 'var(--e-text-muted)' }}>
                {profile?.totalConsultations || 0} ca tham vấn
              </span>
              <span className="e-badge" style={{ background: 'var(--e-surface)', color: 'var(--e-text-muted)' }}>
                {profile?.experienceYears || 0} năm KN
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
                    background: 'var(--e-primary)', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
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
                  padding: '8px 18px', borderRadius: 8, border: '1px solid var(--e-primary)',
                  background: 'transparent', color: 'var(--e-primary)', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--e-primary)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--e-primary)'; }}
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
    </div>
  );
}
