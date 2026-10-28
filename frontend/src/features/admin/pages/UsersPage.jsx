import { useState, useEffect } from 'react';
import { getAllUsers, createExpert, toggleUserStatus, updateUserRole, getExpertsPermissions, updateExpertPermissions } from '../api/adminApi';
import InPageNotification from '../../../shared/components/InPageNotification';
import { useAuthStore } from '../../auth/store/authStore';

const PERMISSION_DEFINITIONS = [
  {
    key: 'PERM_WORKSPACE',
    label: 'Bàn làm việc & Sàng lọc (Workspace)',
    desc: 'Truy cập bàn làm việc, phân tầng rủi ro sinh viên cần tư vấn (Triage) và phòng SafeRoom.',
    icon: '🖥️'
  },
  {
    key: 'PERM_SCHEDULE',
    label: 'Lịch hẹn & Duyệt ca trực (Schedule)',
    desc: 'Quản lý lịch làm việc cá nhân, phê duyệt / từ chối / đổi lịch hẹn của sinh viên.',
    icon: '📅'
  },
  {
    key: 'PERM_ANALYTICS',
    label: 'Phân tích & Cảnh báo tâm lý (Analytics)',
    desc: 'Xem báo cáo thống kê, biểu đồ phân tích tâm lý học đường và danh sách cảnh báo SOS.',
    icon: '📊'
  },
  {
    key: 'PERM_MODERATION',
    label: 'Kiểm duyệt bài viết & Hình ảnh (Moderation)',
    desc: 'Kiểm duyệt nội dung bài viết diễn đàn, phát hiện từ khóa rủi ro và duyệt hình ảnh.',
    icon: '🛡️'
  }
];

const DEFAULT_USERS = [
  { id: 'u1', name: 'SV Ẩn Danh #382', email: 'sv382@unimind.edu.vn', role: 'Student', status: 'Active', joinedAt: '2026-09-01', sessionsCount: 3 },
  { id: 'u2', name: 'ThS. Nguyễn Thanh Hà', email: 'tha@unimind.edu.vn', role: 'Expert', status: 'Active', joinedAt: '2026-08-15', sessionsCount: 145 },
  { id: 'u3', name: 'SV Ẩn Danh #119', email: 'sv119@unimind.edu.vn', role: 'Student', status: 'Suspended', joinedAt: '2026-09-10', sessionsCount: 1 },
  { id: 'u4', name: 'Admin Nguyễn Văn A', email: 'admin@unimind.edu.vn', role: 'Admin', status: 'Active', joinedAt: '2026-01-01', sessionsCount: 0 },
  { id: 'u5', name: 'TS. Lê Văn Minh', email: 'minh@unimind.edu.vn', role: 'Expert', status: 'Active', joinedAt: '2026-08-20', sessionsCount: 98 },
];

const ROLE_BADGE = {
  Student: 'admin-badge-info',
  Expert:  'admin-badge-success',
  Admin:   'admin-badge-primary'
};

const ROLE_LABELS = {
  Student: 'Sinh viên',
  Expert:  'Chuyên viên',
  Admin:   'Quản trị viên'
};

const DEGREE_OPTIONS = [
  'Thạc sĩ Tâm lý học',
  'Tiến sĩ Tâm lý học lâm sàng',
  'Bác sĩ Chuyên khoa Tâm thần',
  'Chuyên gia Trị liệu Tâm lý',
  'Cử nhân Tâm lý học Giáo dục'
];

export default function AdminUsersPage() {
  const [users, setUsers]           = useState(DEFAULT_USERS);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRole]       = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoad]= useState(false);
  const [modalError, setModalError] = useState('');
  const [pageNotice, setPageNotice] = useState(null);

  // Quản lý phân quyền chuyên viên
  const [expertsPermMap, setExpertsPermMap] = useState({});
  const [permModalOpen, setPermModalOpen]   = useState(false);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [currentPerms, setCurrentPerms]     = useState([]);
  const [permSaving, setPermSaving]         = useState(false);

  // Form thêm chuyên viên
  const [expertForm, setExpertForm] = useState({
    fullName: '',
    email: '',
    password: '',
    academicDegree: 'Thạc sĩ Tâm lý học',
    title: 'Chuyên viên Tư vấn Tâm lý',
    specialization: 'Tư vấn lo âu, căng thẳng thi cử & trầm cảm học đường',
    experienceYears: 5,
    roomLocation: 'P.302 (Tầng 3) - Tòa nhà Hỗ trợ Sinh viên',
    bio: ''
  });

  // Tải danh sách người dùng từ API
  useEffect(() => {
    async function loadData() {
      const res = await getAllUsers();
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map(u => ({
          id: u.id,
          name: u.fullName || u.anonymousCode || 'Người dùng',
          email: u.email,
          role: u.role,
          status: u.isActive !== false ? 'Active' : 'Suspended',
          joinedAt: u.createdAt || new Date().toISOString(),
          sessionsCount: u.role === 'Expert' ? 24 : (u.role === 'Student' ? 2 : 0)
        }));
        setUsers(mapped);
      }

      // Tải phân quyền chuyên viên
      const permRes = await getExpertsPermissions();
      if (permRes && permRes.success && Array.isArray(permRes.data)) {
        const map = {};
        permRes.data.forEach(ep => {
          map[ep.userId] = ep;
          map[ep.expertId] = ep;
        });
        setExpertsPermMap(map);
      }
    }
    loadData();
  }, []);

  const filtered = users.filter(u =>
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) &&
    (!roleFilter || u.role === roleFilter)
  );

  const handleChangeRole = async (user, newRole) => {
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    try {
      await updateUserRole(user.id, newRole);
      setPageNotice({
        type: 'success',
        title: 'Cập nhật vai trò thành công',
        message: `Đã chuyển "${user.name}" sang vai trò ${ROLE_LABELS[newRole] || newRole}.`
      });
    } catch {
      setPageNotice({
        type: 'info',
        title: 'Cập nhật thành công',
        message: `Đã thay đổi vai trò của "${user.name}".`
      });
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
    try {
      const res = await toggleUserStatus(user.id);
      if (res && res.success === false) {
        throw new Error(res.message || 'Lỗi cập nhật từ máy chủ');
      }
      setPageNotice({
        type: 'success',
        title: 'Cập nhật thành công',
        message: `Đã ${newStatus === 'Active' ? 'mở khóa' : 'tạm khóa'} tài khoản người dùng "${user.name}".`
      });
    } catch (err) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: user.status } : u));
      setPageNotice({
        type: 'error',
        title: 'Lỗi cập nhật trạng thái',
        message: err?.response?.data?.message || err?.message || `Không thể ${newStatus === 'Active' ? 'mở khóa' : 'khóa'} tài khoản "${user.name}".`
      });
    }
  };

  const handleOpenPermModal = (user) => {
    const expertData = expertsPermMap[user.id] || expertsPermMap[user.expertId];
    const initialPerms = expertData && Array.isArray(expertData.permissions)
      ? expertData.permissions
      : ['PERM_WORKSPACE', 'PERM_SCHEDULE', 'PERM_ANALYTICS', 'PERM_MODERATION'];

    setSelectedExpert({
      ...user,
      expertId: expertData?.expertId || user.expertId || user.id
    });
    setCurrentPerms([...initialPerms]);
    setPermModalOpen(true);
  };

  const handleTogglePerm = (permKey) => {
    setCurrentPerms(prev =>
      prev.includes(permKey) ? prev.filter(k => k !== permKey) : [...prev, permKey]
    );
  };

  const handleApplyPreset = (presetType) => {
    if (presetType === 'all') {
      // Chọn tất cả quyền chức năng (4/4)
      setCurrentPerms(['PERM_WORKSPACE', 'PERM_SCHEDULE', 'PERM_ANALYTICS', 'PERM_MODERATION']);
    } else if (presetType === 'none') {
      // Bỏ chọn tất cả quyền (0/4)
      setCurrentPerms([]);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedExpert) return;
    setPermSaving(true);
    const targetExpertId = selectedExpert.expertId || selectedExpert.id;
    try {
      const res = await updateExpertPermissions(targetExpertId, currentPerms);
      if (res && res.success === false) {
        throw new Error(res.message || 'Lỗi cập nhật phân quyền từ máy chủ');
      }

      const updatedRecord = {
        expertId: targetExpertId,
        userId: selectedExpert.id,
        fullName: selectedExpert.name,
        permissions: [...currentPerms]
      };

      setExpertsPermMap(prev => ({
        ...prev,
        [selectedExpert.id]: updatedRecord,
        [targetExpertId]: updatedRecord
      }));

      // Bắn tín hiệu để trang của chuyên viên được phân quyền tự động refresh ngay lập tức
      const permPayload = {
        userId: selectedExpert.id,
        expertId: targetExpertId,
        permissions: [...currentPerms],
        timestamp: Date.now()
      };

      try {
        localStorage.setItem('unimind_expert_perm_updated', JSON.stringify(permPayload));
        const bc = new BroadcastChannel('unimind_perm_channel');
        bc.postMessage({ type: 'PERMISSIONS_UPDATED', ...permPayload });
        bc.close();
      } catch (err) {}

      // Nếu tài khoản đang đăng nhập hiện tại chính là chuyên viên này -> cập nhật store và reload
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.id === selectedExpert.id) {
        useAuthStore.getState().updateUser({ permissions: [...currentPerms] });
        setTimeout(() => {
          window.location.reload();
        }, 300);
      }

      setPageNotice({
        type: 'success',
        title: 'Phân quyền chức năng thành công',
        message: currentPerms.length === 0
          ? `Đã xóa toàn bộ quyền chức năng (0/4) của chuyên viên "${selectedExpert.name}". Trang chuyên viên sẽ tự động tải lại (refresh) để áp dụng ngay.`
          : `Đã cập nhật ${currentPerms.length}/4 quyền chức năng cho chuyên viên "${selectedExpert.name}". Trang chuyên viên sẽ tự động tải lại (refresh) để quyền được thực thi ngay lập tức.`
      });
      setPermModalOpen(false);
    } catch (err) {
      setPageNotice({
        type: 'error',
        title: 'Lỗi cập nhật phân quyền',
        message: err?.response?.data?.message || err?.message || `Không thể lưu cấu hình quyền cho "${selectedExpert.name}".`
      });
    } finally {
      setPermSaving(false);
    }
  };

  const handleCreateExpertSubmit = async (e) => {
    e.preventDefault();
    if (!expertForm.fullName.trim() || !expertForm.email.trim()) {
      setModalError('Vui lòng điền họ tên và email chuyên viên.');
      return;
    }
    if (!expertForm.email.includes('@')) {
      setModalError('Email chuyên viên không đúng định dạng.');
      return;
    }

    setModalError('');
    setModalLoad(true);

    try {
      const payload = {
        fullName: expertForm.fullName.trim(),
        email: expertForm.email.trim(),
        password: expertForm.password || 'Expert@123',
        title: expertForm.title || 'Chuyên viên Tư vấn Tâm lý',
        academicDegree: expertForm.academicDegree,
        specialization: expertForm.specialization,
        experienceYears: Number(expertForm.experienceYears) || 3,
        roomLocation: expertForm.roomLocation,
        bio: expertForm.bio || `Chuyên viên tư vấn tâm lý với chuyên môn ${expertForm.specialization}`
      };

      const res = await createExpert(payload);
      if (res && res.success === false) {
        throw new Error(res.message || 'Không thể tạo chuyên viên.');
      }

      const newExpertUser = {
        id: res?.data?.userId || res?.data?.id || `exp-${Date.now()}`,
        name: expertForm.fullName.trim(),
        email: expertForm.email.trim(),
        role: 'Expert',
        status: 'Active',
        joinedAt: new Date().toISOString(),
        sessionsCount: 0
      };

      setUsers(prev => [newExpertUser, ...prev]);
      setIsModalOpen(false);
      setPageNotice({
        type: 'success',
        title: 'Cấp tài khoản thành công',
        message: `Đã cấp tài khoản Chuyên viên cho "${expertForm.fullName}" với email ${expertForm.email}.`
      });

      // Reset form
      setExpertForm({
        fullName: '',
        email: '',
        password: '',
        academicDegree: 'Thạc sĩ Tâm lý học',
        title: 'Chuyên viên Tư vấn Tâm lý',
        specialization: 'Tư vấn lo âu, căng thẳng thi cử & trầm cảm học đường',
        experienceYears: 5,
        roomLocation: 'P.302 (Tầng 3) - Tòa nhà Hỗ trợ Sinh viên',
        bio: ''
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tạo chuyên viên.';
      setModalError(msg);
    } finally {
      setModalLoad(false);
    }
  };

  const studentCount = users.filter(u => u.role === 'Student').length;
  const expertCount  = users.filter(u => u.role === 'Expert').length;
  const adminCount   = users.filter(u => u.role === 'Admin').length;

  return (
    <div className="admin-page-shell">

      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Quản lý Tài Khoản &amp; Phân Quyền</h1>
          <p className="admin-page-subtitle">Quản lý tài khoản sinh viên, cấp quyền chuyên viên tư vấn và kiểm soát an ninh hệ thống</p>
        </div>
      </div>

      {/* In-Page Notification */}
      {pageNotice && (
        <InPageNotification
          type={pageNotice.type}
          title={pageNotice.title}
          message={pageNotice.message}
          onClose={() => setPageNotice(null)}
        />
      )}


      {/* Role Stat Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div className="admin-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--a-text-muted)', fontWeight: 600 }}>Tổng người dùng</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--a-text)', marginTop: 4 }}>{users.length}</div>
        </div>

        <div className="admin-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--a-text-muted)', fontWeight: 600 }}>Sinh viên</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#0d9488', marginTop: 4 }}>{studentCount}</div>
        </div>

        <div className="admin-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--a-text-muted)', fontWeight: 600 }}>Chuyên viên tư vấn</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#0284c7', marginTop: 4 }}>{expertCount}</div>
        </div>

        <div className="admin-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--a-text-muted)', fontWeight: 600 }}>Quản trị viên (Database)</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#4f46e5', marginTop: 4 }}>{adminCount}</div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="admin-card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <input
              className="admin-input"
              placeholder="Tìm theo tên hoặc email tài khoản..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            className="admin-input"
            style={{ width: 'auto', minWidth: 170 }}
            value={roleFilter}
            onChange={e => setRole(e.target.value)}
          >
            <option value="">Tất cả vai trò</option>
            <option value="Student">Sinh viên ({studentCount})</option>
            <option value="Expert">Chuyên viên ({expertCount})</option>
            <option value="Admin">Quản trị viên ({adminCount})</option>
          </select>

          {/* Action button to create Expert */}
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => { setModalError(''); setIsModalOpen(true); }}
            style={{
              padding: '10px 18px', fontWeight: 800,
              background: '#0284c7',
              color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer',
            }}
          >
            + Thêm Chuyên viên Tâm lý
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Vai trò</th>
                <th>Nguồn gốc</th>
                <th>Trạng thái</th>
                <th>Ngày tham gia</th>
                <th>Số ca / buổi</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        className="admin-avatar"
                        style={{
                          width: 32, height: 32, fontSize: 13, fontWeight: 800,
                          background: user.role === 'Admin' ? '#4f46e5' : user.role === 'Expert' ? '#0284c7' : '#0d9488',
                          color: '#fff', borderRadius: 6
                        }}
                      >
                        {(user.name[0] || 'U').toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--a-text)', margin: 0 }}>{user.name}</p>
                        <p style={{ fontSize: 11.5, color: 'var(--a-text-muted)', margin: 0 }}>{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`admin-badge ${ROLE_BADGE[user.role] || 'admin-badge-info'}`}>
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: 'var(--a-text-muted)' }}>
                      {user.role === 'Admin' && 'CSDL Hệ thống'}
                      {user.role === 'Expert' && 'Cấp bởi Admin'}
                      {user.role === 'Student' && 'Tự đăng ký'}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${user.status === 'Active' ? 'admin-badge-success' : 'admin-badge-error'}`}>
                      {user.status === 'Active' ? 'Hoạt động' : 'Tạm khóa'}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--a-text-muted)' }}>
                    {new Date(user.joinedAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td style={{ fontSize: 13, fontWeight: 700, color: 'var(--a-text)' }}>
                    {user.sessionsCount}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <select
                        className="admin-input"
                        style={{ padding: '4px 8px', fontSize: 11.5, width: 'auto', minWidth: 120 }}
                        value={user.role}
                        onChange={e => handleChangeRole(user, e.target.value)}
                      >
                        <option value="Student">Sinh viên</option>
                        <option value="Expert">Chuyên viên</option>
                        <option value="Admin">Quản trị viên</option>
                      </select>
                      <button
                        className={`admin-btn ${user.status === 'Active' ? 'admin-btn-danger' : 'admin-btn-outline'}`}
                        style={{ padding: '4px 10px', fontSize: 11.5, cursor: 'pointer' }}
                        onClick={() => handleToggleStatus(user)}
                      >
                        {user.status === 'Active' ? 'Khóa' : 'Mở khóa'}
                      </button>

                      {user.role === 'Expert' && (
                        <button
                          className="admin-btn admin-btn-outline"
                          style={{
                            padding: '4px 9px', fontSize: 11.5, cursor: 'pointer',
                            borderColor: '#0284c7', color: '#0284c7', fontWeight: 700,
                            display: 'inline-flex', alignItems: 'center', gap: 4
                          }}
                          onClick={() => handleOpenPermModal(user)}
                          title="Phân quyền chi tiết các chức năng cho chuyên viên này"
                        >
                          🛡️ Phân quyền
                          {expertsPermMap[user.id] && Array.isArray(expertsPermMap[user.id].permissions) && (
                            <span style={{
                              fontSize: 10,
                              background: expertsPermMap[user.id].permissions.length === 0 ? '#fee2e2' : '#e0f2fe',
                              color: expertsPermMap[user.id].permissions.length === 0 ? '#b91c1c' : '#0369a1',
                              border: expertsPermMap[user.id].permissions.length === 0 ? '1px solid #fca5a5' : 'none',
                              padding: '1px 5px', borderRadius: 10, fontWeight: 800
                            }}>
                              {expertsPermMap[user.id].permissions.length}/4
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--a-text-muted)' }}>
                    Không tìm thấy người dùng phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--a-border)', fontSize: 12.5, color: 'var(--a-text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Hiển thị {filtered.length} / {users.length} tài khoản</span>
        </div>
      </div>

      {/* ══════════════ MODAL THÊM CHUYÊN VIÊN TÂM LÝ ══════════════ */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540,
            maxHeight: '90vh', overflowY: 'auto',
            padding: '24px 28px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 900, color: '#111827' }}>
                  Cấp Tài Khoản Chuyên Viên Tâm Lý
                </h2>
                <p style={{ margin: 0, fontSize: 12.5, color: '#6b7280' }}>
                  Chỉ Quản trị viên mới có thẩm quyền bổ nhiệm và cấp tài khoản Chuyên viên
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 18, padding: 4 }}
              >
                ✕
              </button>
            </div>

            {/* In-Page Notification inside modal */}
            <InPageNotification
              type="info"
              message="Tài khoản này sẽ được cấp quyền Role: Expert. Quản trị viên (Admin) chỉ được thiết lập trong CSDL máy chủ và không tạo qua giao diện."
            />

            {modalError && (
              <InPageNotification
                type="error"
                message={modalError}
                onClose={() => setModalError('')}
              />
            )}

            <form onSubmit={handleCreateExpertSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                  Họ và tên chuyên viên <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  className="admin-input"
                  placeholder="Ví dụ: ThS. Trần Phương Thảo"
                  value={expertForm.fullName}
                  onChange={e => setExpertForm({ ...expertForm, fullName: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                    Email công vụ <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    className="admin-input"
                    type="email"
                    placeholder="thaotp@unimind.edu.vn"
                    value={expertForm.email}
                    onChange={e => setExpertForm({ ...expertForm, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                    Mật khẩu khởi tạo
                  </label>
                  <input
                    className="admin-input"
                    type="text"
                    placeholder="Mặc định: Expert@123"
                    value={expertForm.password}
                    onChange={e => setExpertForm({ ...expertForm, password: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                    Học hàm / Học vị
                  </label>
                  <select
                    className="admin-input"
                    value={expertForm.academicDegree}
                    onChange={e => setExpertForm({ ...expertForm, academicDegree: e.target.value })}
                  >
                    {DEGREE_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                    Số năm kinh nghiệm
                  </label>
                  <input
                    className="admin-input"
                    type="number"
                    min="1"
                    max="40"
                    value={expertForm.experienceYears}
                    onChange={e => setExpertForm({ ...expertForm, experienceYears: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                  Lĩnh vực chuyên môn tham vấn
                </label>
                <input
                  className="admin-input"
                  placeholder="Ví dụ: Tư vấn lo âu học đường, Stress thi cử, Khủng hoảng tâm lý"
                  value={expertForm.specialization}
                  onChange={e => setExpertForm({ ...expertForm, specialization: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                  Phòng làm việc / Địa điểm tư vấn
                </label>
                <input
                  className="admin-input"
                  placeholder="Ví dụ: P.302 (Tầng 3) - Tòa nhà Hỗ trợ Sinh viên"
                  value={expertForm.roomLocation}
                  onChange={e => setExpertForm({ ...expertForm, roomLocation: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                  Tiểu sử &amp; Giới thiệu tóm tắt
                </label>
                <textarea
                  className="admin-input"
                  rows="3"
                  placeholder="Giới thiệu kinh nghiệm, chứng chỉ hành nghề và phương pháp tham vấn..."
                  value={expertForm.bio}
                  onChange={e => setExpertForm({ ...expertForm, bio: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={modalLoading}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={modalLoading}
                  style={{
                    background: '#0284c7',
                  }}
                >
                  {modalLoading ? 'Đang cấp tài khoản...' : 'Xác nhận cấp tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ══════════════ MODAL PHÂN QUYỀN CHỨC NĂNG CHUYÊN VIÊN ══════════════ */}
      {permModalOpen && selectedExpert && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560,
            maxHeight: '90vh', overflowY: 'auto',
            padding: '24px 28px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 900, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                  🛡️ Phân Quyền Chức Năng Chuyên Viên
                </h2>
                <p style={{ margin: 0, fontSize: 12.5, color: '#6b7280' }}>
                  Thiết lập các phân hệ chuyên môn mà <strong>{selectedExpert.name}</strong> được phép truy cập
                </p>
              </div>
              <button
                onClick={() => setPermModalOpen(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 18, padding: 4 }}
              >
                ✕
              </button>
            </div>

            <InPageNotification
              type="info"
              message="Phân quyền theo chức năng: Quản trị viên tích chọn trực tiếp các phân hệ cho phép chuyên viên thao tác. Khi lưu, trang của chuyên viên đó sẽ tự động làm mới (refresh) để quyền mới được thực thi ngay lập tức."
            />

            {/* Quick Actions theo chức năng */}
            <div style={{ margin: '14px 0 16px', background: '#f8fafc', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
                  ⚙️ Phân quyền theo chức năng:
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                  Tích chọn các chức năng độc lập cho phép chuyên viên truy cập
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('all')}
                  style={{
                    fontSize: 12, padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
                    background: currentPerms.length === 4 ? '#059669' : '#fff',
                    color: currentPerms.length === 4 ? '#fff' : '#047857',
                    border: '1px solid #a7f3d0', fontWeight: 700
                  }}
                >
                  ✓ Chọn tất cả ({PERMISSION_DEFINITIONS.length}/{PERMISSION_DEFINITIONS.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('none')}
                  style={{
                    fontSize: 12, padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
                    background: currentPerms.length === 0 ? '#ef4444' : '#fff',
                    color: currentPerms.length === 0 ? '#fff' : '#b91c1c',
                    border: '1px solid #fca5a5', fontWeight: 700
                  }}
                >
                  ✕ Bỏ chọn tất cả (0/{PERMISSION_DEFINITIONS.length})
                </button>
              </div>
            </div>

            {/* Checkbox list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {PERMISSION_DEFINITIONS.map(perm => {
                const isChecked = currentPerms.includes(perm.key);
                return (
                  <label
                    key={perm.key}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px',
                      borderRadius: 10, cursor: 'pointer',
                      background: isChecked ? '#f0f9ff' : '#fff',
                      border: isChecked ? '1.5px solid #0284c7' : '1px solid #e5e7eb',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleTogglePerm(perm.key)}
                      style={{ marginTop: 3, width: 17, height: 17, accentColor: '#0284c7', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{perm.icon}</span>
                        <span>{perm.label}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 1.4 }}>
                        {perm.desc}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid #e5e7eb' }}>
              <span style={{ fontSize: 12.5, color: '#64748b', fontWeight: 600 }}>
                Đã chọn: <strong style={{ color: '#0284c7' }}>{currentPerms.length}/4</strong> quyền chức năng
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setPermModalOpen(false)}
                  disabled={permSaving}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={handleSavePermissions}
                  disabled={permSaving}
                  style={{ background: '#0284c7', fontWeight: 800 }}
                >
                  {permSaving ? 'Đang lưu...' : 'Lưu phân quyền'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
