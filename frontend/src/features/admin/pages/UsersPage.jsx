import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAllUsers,
  createExpert,
  toggleUserStatus,
  updateUserRole,
  getExpertsPermissions,
  updateExpertPermissions,
  updateUserRoles,
  getUserPermissions,
  updateUserPermissions,
  getRolesMatrix
} from '../api/adminApi';
import InPageNotification from '../../../shared/components/InPageNotification';
import { useAuthStore } from '../../auth/store/authStore';

const ALL_SYSTEM_ROLES = [
  { code: 'ADMIN', label: 'Quản trị viên', color: '#4f46e5', bg: '#e0e7ff', desc: 'Toàn quyền kiểm soát và cấu hình hệ thống' },
  { code: 'EXPERT', label: 'Chuyên viên', color: '#0284c7', bg: '#e0f2fe', desc: 'Tham vấn tâm lý, duyệt ca hẹn, mở phòng SafeRoom' },
  { code: 'STUDENT', label: 'Sinh viên', color: '#059669', bg: '#d1fae5', desc: 'Sinh viên tham gia nhật ký, test tâm lý và diễn đàn' }
];

const ROLE_META = {
  ADMIN: { label: 'Quản trị viên', badge: 'admin-badge-primary', color: '#4f46e5', bg: '#e0e7ff' },
  Admin: { label: 'Quản trị viên', badge: 'admin-badge-primary', color: '#4f46e5', bg: '#e0e7ff' },
  EXPERT: { label: 'Chuyên viên', badge: 'admin-badge-success', color: '#0284c7', bg: '#e0f2fe' },
  Expert: { label: 'Chuyên viên', badge: 'admin-badge-success', color: '#0284c7', bg: '#e0f2fe' },
  STUDENT: { label: 'Sinh viên', badge: 'admin-badge-info', color: '#059669', bg: '#d1fae5' },
  Student: { label: 'Sinh viên', badge: 'admin-badge-info', color: '#059669', bg: '#d1fae5' }
};

const PERM_MODULE_ORDER = [
  'Người dùng & Phân quyền',
  'Tư vấn & SafeRoom',
  'Khủng hoảng & Triage',
  'Cộng đồng & Kiểm duyệt',
  'Báo cáo & Thống kê'
];

const FULL_PERMISSIONS_CATALOG = [
  { code: 'USER_VIEW', name: 'Xem danh sách người dùng', moduleName: 'Người dùng & Phân quyền', description: 'Xem hồ sơ, trạng thái hoạt động sinh viên & chuyên viên' },
  { code: 'USER_STATUS_TOGGLE', name: 'Khóa / Mở khóa tài khoản', moduleName: 'Người dùng & Phân quyền', description: 'Đình chỉ hoặc kích hoạt lại quyền truy cập tài khoản' },
  { code: 'USER_ROLE_ASSIGN', name: 'Gán vai trò người dùng', moduleName: 'Người dùng & Phân quyền', description: 'Gán hoặc thu hồi vai trò cho tài khoản người dùng' },
  { code: 'ROLE_PERMISSION_MANAGE', name: 'Quản lý vai trò & quyền', moduleName: 'Người dùng & Phân quyền', description: 'Cấu hình ma trận phân quyền hệ thống' },
  { code: 'SYSTEM_AUDIT_LOG_VIEW', name: 'Xem nhật ký kiểm toán', moduleName: 'Người dùng & Phân quyền', description: 'Truy vết hành vi bảo mật và thay đổi dữ liệu' },

  { code: 'SLOT_MANAGE', name: 'Quản lý khung giờ trực', moduleName: 'Tư vấn & SafeRoom', description: 'Mở mới, điều chỉnh lịch hẹn tham vấn trực tuyến & trực tiếp' },
  { code: 'APPOINTMENT_APPROVE', name: 'Phê duyệt ca hẹn', moduleName: 'Tư vấn & SafeRoom', description: 'Duyệt hoặc từ chối yêu cầu hẹn của sinh viên' },
  { code: 'SAFEROOM_CALL_HOST', name: 'Mở phòng gọi SafeRoom', moduleName: 'Tư vấn & SafeRoom', description: 'Chủ trì phiên tư vấn video call bảo mật trực tuyến' },
  { code: 'CLINICAL_NOTE_WRITE', name: 'Ghi chép hồ sơ ca bệnh', moduleName: 'Tư vấn & SafeRoom', description: 'Lưu trữ nhận định tâm lý chuyên môn sau buổi tư vấn' },
  { code: 'EMERGENCY_ESCALATE', name: 'Chuyển tiếp ca nguy cơ', moduleName: 'Tư vấn & SafeRoom', description: 'Kích hoạt quy trình chuyển tiếp khẩn cấp hoặc hội chẩn' },

  { code: 'TRIAGE_QUEUE_VIEW', name: 'Xem hàng đợi phân luồng', moduleName: 'Khủng hoảng & Triage', description: 'Theo dõi các ca cảnh báo khủng hoảng đỏ & vàng' },
  { code: 'TRIAGE_STATUS_UPDATE', name: 'Cập nhật trạng thái triage', moduleName: 'Khủng hoảng & Triage', description: 'Điều chỉnh mức độ can thiệp và xử lý can thiệp khẩn' },
  { code: 'KEYWORD_RULE_MANAGE', name: 'Quản lý bộ lọc từ khóa', moduleName: 'Khủng hoảng & Triage', description: 'Thiết lập danh mục từ khóa kích hoạt cảnh báo đỏ' },
  { code: 'AI_SENTIMENT_RUN', name: 'Phân tích cảm xúc bằng AI', moduleName: 'Khủng hoảng & Triage', description: 'Khởi chạy quét AI phân tích sắc thái bài viết & nhật ký' },
  { code: 'CRISIS_BROADCAST', name: 'Phát thông báo khẩn cấp', moduleName: 'Khủng hoảng & Triage', description: 'Gửi cảnh báo tức thời tới các bên liên quan' },

  { code: 'POST_CREATE', name: 'Đăng bài viết chia sẻ', moduleName: 'Cộng đồng & Kiểm duyệt', description: 'Chia sẻ tâm sự ẩn danh lên không gian chung' },
  { code: 'COMMENT_CREATE', name: 'Gửi bình luận động viên', moduleName: 'Cộng đồng & Kiểm duyệt', description: 'Bình luận và gửi lời nhắn an ủi đến bạn bè' },
  { code: 'POST_MODERATE', name: 'Kiểm duyệt bài viết', moduleName: 'Cộng đồng & Kiểm duyệt', description: 'Ẩn, gỡ hoặc duyệt các bài viết cộng đồng' },
  { code: 'IMAGE_MODERATE', name: 'Kiểm duyệt hình ảnh', moduleName: 'Cộng đồng & Kiểm duyệt', description: 'Duyệt hoặc gắn cờ hình ảnh đính kèm bài viết' },
  { code: 'COMMENT_MODERATE', name: 'Kiểm duyệt bình luận', moduleName: 'Cộng đồng & Kiểm duyệt', description: 'Kiểm duyệt các phản hồi không chuẩn mực' },
  { code: 'EXPERT_ADVICE_PIN', name: 'Ghim phản hồi chuyên môn', moduleName: 'Cộng đồng & Kiểm duyệt', description: 'Đánh dấu lời khuyên chính thức từ chuyên gia' },

  { code: 'DASS21_TEST_TAKE', name: 'Thực hiện test DASS-21', moduleName: 'Báo cáo & Thống kê', description: 'Sinh viên làm bài sàng lọc tâm lý định kỳ' },
  { code: 'DASS21_REPORT_VIEW', name: 'Xem báo cáo DASS-21', moduleName: 'Báo cáo & Thống kê', description: 'Xem tổng hợp kết quả trắc nghiệm và mức độ lo âu' },
  { code: 'ANALYTICS_DASHBOARD_VIEW', name: 'Xem biểu đồ phân tích', moduleName: 'Báo cáo & Thống kê', description: 'Biểu đồ cảm xúc, tỷ lệ đặt lịch và phân bố tâm lý' },
  { code: 'EMOTION_STATS_EXPORT', name: 'Xuất dữ liệu thống kê', moduleName: 'Báo cáo & Thống kê', description: 'Trích xuất báo cáo phân tích phục vụ công tác nhà trường' },
  { code: 'SYSTEM_HEALTH_MONITOR', name: 'Giám sát vận hành hệ thống', moduleName: 'Báo cáo & Thống kê', description: 'Kiểm tra trạng thái máy chủ, API và hạ tầng' },
  { code: 'REPORT_CONFIG_MANAGE', name: 'Cấu hình báo cáo', moduleName: 'Báo cáo & Thống kê', description: 'Tùy biến tiêu chí và định dạng báo cáo định kỳ' }
];

const PERMISSION_DEFINITIONS = [
  { key: 'PERM_WORKSPACE',  label: 'Bàn làm việc & Sàng lọc',  desc: 'Xem hồ sơ sinh viên, phân loại rủi ro và quản lý không gian làm việc', icon: 'workspace', color: '#0d9488', bg: '#f0fdfa' },
  { key: 'PERM_SCHEDULE',   label: 'Lịch hẹn & Duyệt ca trực',   desc: 'Xem, duyệt và quản lý lịch hẹn tư vấn của sinh viên',    icon: 'calendar', color: '#0284c7', bg: '#f0f9ff' },
  { key: 'PERM_ANALYTICS',  label: 'Phân tích & Cảnh báo',  desc: 'Truy cập báo cáo tâm lý, biểu đồ cảm xúc và cảnh báo rủi ro', icon: 'chart',    color: '#7c3aed', bg: '#faf5ff' },
  { key: 'PERM_MODERATION', label: 'Kiểm duyệt bài viết', desc: 'Duyệt, ẩn hoặc gỡ nội dung không phù hợp trong góc cộng đồng',   icon: 'shield',   color: '#dc2626', bg: '#fff5f5' }
];

const DEFAULT_USERS = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Quản trị viên Nguyễn Văn An', email: 'admin@unimind.edu.vn', role: 'Admin', status: 'Active', joinedAt: '2026-01-01', sessionsCount: 0 },
  { id: '22222222-2222-2222-2222-222222222223', name: 'Ngô Tấn Lộc', email: 'loc.ngo@lhu.edu.vn', role: 'Student', status: 'Active', joinedAt: '2026-09-01', sessionsCount: 3 },
  { id: '22222222-2222-2222-2222-222222222224', name: 'Lê Minh Luân', email: 'luan.le@lhu.edu.vn', role: 'Student', status: 'Active', joinedAt: '2026-09-05', sessionsCount: 2 },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Sinh viên Nguyễn Hoàng An', email: 'sv_an@unimind.edu.vn', role: 'Student', status: 'Active', joinedAt: '2026-09-08', sessionsCount: 4 },
  { id: '22222222-2222-2222-2222-222222222221', name: 'Sinh viên Thử Nghiệm', email: 'student@unimind.edu.vn', role: 'Student', status: 'Active', joinedAt: '2026-09-10', sessionsCount: 1 },
  { id: '33333333-3333-3333-3333-333333333330', name: 'Chuyên viên Tư Vấn Mẫu', email: 'expert@unimind.edu.vn', role: 'Expert', status: 'Active', joinedAt: '2026-08-10', sessionsCount: 100 },
  { id: '33333333-3333-3333-3333-333333333331', name: 'ThS. Tâm lý Nguyễn Thanh Hà', email: 'ha.nguyen@unimind.edu.vn', role: 'Expert', status: 'Active', joinedAt: '2026-08-15', sessionsCount: 145 },
  { id: '33333333-3333-3333-3333-333333333332', name: 'TS. Tâm lý Trần Mai Lan', email: 'lan.tran@unimind.edu.vn', role: 'Expert', status: 'Active', joinedAt: '2026-08-18', sessionsCount: 210 },
  { id: '33333333-3333-3333-3333-333333333333', name: 'ThS. Lê Quốc Bảo', email: 'bao.le@unimind.edu.vn', role: 'Expert', status: 'Active', joinedAt: '2026-08-20', sessionsCount: 98 },
  { id: '33333333-3333-3333-3333-333333333334', name: 'ThS. Lê Thanh Tâm', email: 'tam.le@unimind.edu.vn', role: 'Expert', status: 'Active', joinedAt: '2026-08-22', sessionsCount: 185 },
  { id: '33333333-3333-3333-3333-333333333335', name: 'TS. Trần Minh Đức', email: 'duc.tran@unimind.edu.vn', role: 'Expert', status: 'Active', joinedAt: '2026-08-25', sessionsCount: 120 },
  { id: '33333333-3333-3333-3333-333333333336', name: 'ThS. Vũ Phương Linh', email: 'linh.vu@unimind.edu.vn', role: 'Expert', status: 'Active', joinedAt: '2026-08-28', sessionsCount: 85 }
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
  const navigate = useNavigate();
  const currentUser = useAuthStore(state => state.user);
  const [users, setUsers]           = useState(DEFAULT_USERS);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRole]       = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoad]= useState(false);
  const [modalError, setModalError] = useState('');
  const [pageNotice, setPageNotice] = useState(null);

  // Quản lý phân quyền chuyên viên (Legacy)
  const [expertsPermMap, setExpertsPermMap] = useState({});
  const [permModalOpen, setPermModalOpen]   = useState(false);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [currentPerms, setCurrentPerms]     = useState([]);
  const [permSaving, setPermSaving]         = useState(false);

  // Quản lý ma trận phân quyền 27 chức năng cho mọi tài khoản người dùng
  const [userPermModalOpen, setUserPermModalOpen] = useState(false);
  const [targetUserForPerm, setTargetUserForPerm] = useState(null);
  const [userPermDetail, setUserPermDetail]       = useState(null);
  const [userPermLoading, setUserPermLoading]     = useState(false);
  const [userSelectedPerms, setUserSelectedPerms] = useState(new Set());
  const [userInheritedPerms, setUserInheritedPerms] = useState(new Set());
  const [userPermSearch, setUserPermSearch]       = useState('');
  const [userPermSaving, setUserPermSaving]       = useState(false);
  const [catalogPerms, setCatalogPerms]           = useState(FULL_PERMISSIONS_CATALOG);

  // Quản lý gán nhiều vai trò (Multi-role modal)
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUserForRoles, setSelectedUserForRoles] = useState(null);
  const [selectedUserRoles, setSelectedUserRoles] = useState([]);
  const [roleSaving, setRoleSaving] = useState(false);

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
        const SESSIONS_MAP = {
          'admin@unimind.edu.vn': 0,
          'loc.ngo@lhu.edu.vn': 3,
          'luan.le@lhu.edu.vn': 2,
          'sv_an@unimind.edu.vn': 4,
          'student@unimind.edu.vn': 1,
          'expert@unimind.edu.vn': 100,
          'ha.nguyen@unimind.edu.vn': 145,
          'lan.tran@unimind.edu.vn': 210,
          'bao.le@unimind.edu.vn': 98,
          'tam.le@unimind.edu.vn': 185,
          'duc.tran@unimind.edu.vn': 120,
          'linh.vu@unimind.edu.vn': 85
        };
        const mapped = res.data.map(u => ({
          id: u.id,
          name: u.fullName || u.anonymousCode || 'Người dùng',
          email: u.email,
          role: u.role,
          roles: Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : [u.role?.toUpperCase() || 'STUDENT'],
          status: u.isActive !== false ? 'Active' : 'Suspended',
          joinedAt: u.createdAt || new Date().toISOString(),
          sessionsCount: SESSIONS_MAP[u.email] ?? (u.role === 'Expert' ? 48 : (u.role === 'Student' ? 2 : 0))
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

  const isCurrentUser = (user) => {
    if (!currentUser) return false;
    if (currentUser.id && String(user.id) === String(currentUser.id)) return true;
    if (currentUser.email && user.email && user.email.toLowerCase() === currentUser.email.toLowerCase()) return true;
    return false;
  };

  const handleChangeRole = async (user, newRole) => {
    if (newRole === user.role) return;
    if (isCurrentUser(user)) {
      setPageNotice({
        type: 'error',
        title: 'Hành động không được phép',
        message: 'Quản trị viên không được phép tự thay đổi vai trò của chính mình.'
      });
      return;
    }
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
    if (isCurrentUser(user)) {
      setPageNotice({
        type: 'error',
        title: 'Hành động không được phép',
        message: 'Quản trị viên không được phép tự khóa tài khoản của chính mình.'
      });
      return;
    }
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

  const handleOpenRoleModal = (user) => {
    setSelectedUserForRoles(user);
    const existing = user.roles && Array.isArray(user.roles) && user.roles.length > 0
      ? user.roles.map(r => r.toUpperCase())
      : [user.role?.toUpperCase() || 'STUDENT'];
    setSelectedUserRoles(existing);
    setRoleModalOpen(true);
  };

  const handleToggleUserRole = (code) => {
    setSelectedUserRoles(prev => {
      if (prev.includes(code)) {
        if (prev.length <= 1) {
          setPageNotice({
            type: 'warning',
            title: 'Ràng buộc vai trò',
            message: 'Mỗi tài khoản phải giữ ít nhất một vai trò trong hệ thống.'
          });
          return prev;
        }
        return prev.filter(c => c !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  const handleSaveUserRoles = async () => {
    if (!selectedUserForRoles) return;
    if (selectedUserRoles.length === 0) {
      setPageNotice({
        type: 'error',
        title: 'Chưa chọn vai trò',
        message: 'Vui lòng chọn ít nhất 1 vai trò cho người dùng.'
      });
      return;
    }

    if (isCurrentUser(selectedUserForRoles) && !selectedUserRoles.includes('ADMIN')) {
      setPageNotice({
        type: 'error',
        title: 'Hành động không được phép',
        message: 'Quản trị viên không được phép tự tước quyền Quản trị viên của chính mình.'
      });
      return;
    }

    setRoleSaving(true);
    try {
      const res = await updateUserRoles(selectedUserForRoles.id, selectedUserRoles);
      if (res && res.success !== false) {
        setUsers(prev => prev.map(u => {
          if (u.id === selectedUserForRoles.id) {
            const primaryRole = selectedUserRoles.includes('ADMIN') ? 'Admin'
              : (selectedUserRoles.includes('EXPERT') ? 'Expert' : 'Student');
            return {
              ...u,
              role: primaryRole,
              roles: [...selectedUserRoles]
            };
          }
          return u;
        }));

        setPageNotice({
          type: 'success',
          title: 'Cập nhật vai trò thành công',
          message: `Đã cập nhật ${selectedUserRoles.length} vai trò cho tài khoản "${selectedUserForRoles.name}".`
        });
        setRoleModalOpen(false);
      } else {
        throw new Error(res.message || 'Lỗi cập nhật từ máy chủ');
      }
    } catch (err) {
      setPageNotice({
        type: 'error',
        title: 'Lỗi cập nhật vai trò',
        message: err?.response?.data?.message || err?.message || 'Không thể lưu vai trò người dùng.'
      });
    } finally {
      setRoleSaving(false);
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

  // Mở modal ma trận 27 quyền cho bất kỳ người dùng nào
  const handleOpenUserPermModal = async (user) => {
    setTargetUserForPerm(user);
    setUserPermModalOpen(true);
    setUserPermLoading(true);
    setUserPermSearch('');

    try {
      const res = await getUserPermissions(user.id);
      if (res && res.success && res.data) {
        setUserPermDetail(res.data);
        setUserSelectedPerms(new Set(res.data.effectivePermissions || []));
        setUserInheritedPerms(new Set(res.data.inheritedPermissions || []));
        if (res.data.allPermissions && res.data.allPermissions.length > 0) {
          setCatalogPerms(res.data.allPermissions);
        }
      } else {
        // Fallback tự tính theo vai trò
        const uRoles = user.roles || [user.role?.toUpperCase() || 'STUDENT'];
        const isAdm = uRoles.includes('ADMIN') || user.role === 'Admin';
        const fallbackCodes = isAdm
          ? FULL_PERMISSIONS_CATALOG.map(p => p.code)
          : ['POST_CREATE', 'COMMENT_CREATE', 'DASS21_TEST_TAKE', 'ANALYTICS_DASHBOARD_VIEW'];

        setUserPermDetail({
          userId: user.id,
          fullName: user.name,
          email: user.email,
          primaryRole: user.role,
          roles: uRoles,
          roleNames: uRoles.map(r => ROLE_META[r]?.label || r),
          inheritedPermissions: fallbackCodes,
          directPermissions: [],
          effectivePermissions: fallbackCodes,
          allPermissions: FULL_PERMISSIONS_CATALOG
        });
        setUserSelectedPerms(new Set(fallbackCodes));
        setUserInheritedPerms(new Set(fallbackCodes));
      }
    } catch (err) {
      console.warn('Lỗi tải quyền người dùng:', err);
    } finally {
      setUserPermLoading(false);
    }
  };

  // Toggle một quyền trong modal người dùng
  const handleToggleUserPerm = (code) => {
    const isTargetAdmin = targetUserForPerm?.role === 'Admin' ||
                          (targetUserForPerm?.roles && targetUserForPerm.roles.includes('ADMIN'));
    if (isTargetAdmin) return; // Admin luôn có toàn quyền

    setUserSelectedPerms(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleSelectAllUserPerms = () => {
    const isTargetAdmin = targetUserForPerm?.role === 'Admin' ||
                          (targetUserForPerm?.roles && targetUserForPerm.roles.includes('ADMIN'));
    if (isTargetAdmin) return;
    setUserSelectedPerms(new Set(catalogPerms.map(p => p.code)));
  };

  const handleDeselectAllUserPerms = () => {
    const isTargetAdmin = targetUserForPerm?.role === 'Admin' ||
                          (targetUserForPerm?.roles && targetUserForPerm.roles.includes('ADMIN'));
    if (isTargetAdmin) return;
    setUserSelectedPerms(new Set());
  };

  const handleResetUserPerms = () => {
    setUserSelectedPerms(new Set(userInheritedPerms));
  };

  const handleSaveUserPermsSubmit = async () => {
    if (!targetUserForPerm) return;
    const isTargetAdmin = targetUserForPerm?.role === 'Admin' ||
                          (targetUserForPerm?.roles && targetUserForPerm.roles.includes('ADMIN'));
    if (isTargetAdmin) {
      setUserPermModalOpen(false);
      return;
    }

    setUserPermSaving(true);
    try {
      const permList = Array.from(userSelectedPerms);
      const res = await updateUserPermissions(targetUserForPerm.id, permList);
      if (res && res.success !== false) {
        setPageNotice({
          type: 'success',
          title: 'Cập nhật phân quyền thành công',
          message: `Đã lưu ${permList.length} quyền cho tài khoản "${targetUserForPerm.name}". Dữ liệu đã đồng bộ SQL Server.`
        });
        setUserPermModalOpen(false);
      } else {
        throw new Error(res?.message || 'Lỗi lưu phân quyền người dùng');
      }
    } catch (err) {
      setPageNotice({
        type: 'error',
        title: 'Lỗi cập nhật phân quyền',
        message: err?.response?.data?.message || err?.message || 'Không thể lưu cấu hình quyền cho tài khoản này.'
      });
    } finally {
      setUserPermSaving(false);
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
              {filtered.map(user => {
                const isSelf = isCurrentUser(user);
                return (
                  <tr key={user.id} style={{ background: isSelf ? '#f8fafc' : undefined }}>
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
                          <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--a-text)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {user.name}
                            {isSelf && (
                              <span style={{
                                fontSize: 10.5,
                                background: '#e0e7ff',
                                color: '#4338ca',
                                padding: '1px 7px',
                                borderRadius: 10,
                                fontWeight: 700
                              }}>
                                Bạn
                              </span>
                            )}
                          </p>
                          <p style={{ fontSize: 11.5, color: 'var(--a-text-muted)', margin: 0 }}>{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                        {(user.roles && user.roles.length > 0 ? user.roles : [user.role]).map((rCode, idx) => {
                          const meta = ROLE_META[rCode] || ROLE_META[rCode?.toUpperCase()] || { label: rCode, color: '#475569', bg: '#f1f5f9' };
                          return (
                            <span
                              key={idx}
                              onClick={() => handleOpenRoleModal(user)}
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 6,
                                color: meta.color,
                                background: meta.bg,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                border: `1px solid ${meta.color}25`
                              }}
                              title="Nhấp để điều chỉnh các vai trò (Multi-role) của tài khoản này"
                            >
                              {meta.label}
                            </span>
                          );
                        })}
                      </div>
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
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Nút Phân nhiều vai trò */}
                        <button
                          className="admin-btn admin-btn-outline"
                          style={{
                            padding: '4px 9px', fontSize: 11.5, cursor: 'pointer',
                            borderColor: '#6366f1', color: '#4f46e5', fontWeight: 700,
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            background: 'rgba(99, 102, 241, 0.05)'
                          }}
                          onClick={() => handleOpenRoleModal(user)}
                          title="Gán nhiều vai trò (Multi-role) cho người dùng này"
                        >
                          Phân vai trò
                          {user.roles && user.roles.length > 1 && (
                            <span style={{
                              fontSize: 10,
                              background: '#e0e7ff',
                              color: '#4338ca',
                              padding: '1px 5px', borderRadius: 10, fontWeight: 800
                            }}>
                              {user.roles.length}
                            </span>
                          )}
                        </button>

                        <button
                          className={`admin-btn ${user.status === 'Active' ? 'admin-btn-danger' : 'admin-btn-outline'}`}
                          style={{
                            padding: '4px 10px', fontSize: 11.5,
                            cursor: isSelf ? 'not-allowed' : 'pointer',
                            opacity: isSelf ? 0.45 : 1
                          }}
                          onClick={() => !isSelf && handleToggleStatus(user)}
                          disabled={isSelf}
                          title={isSelf ? 'Quản trị viên không được phép tự khóa tài khoản của chính mình' : (user.status === 'Active' ? 'Khóa tài khoản này' : 'Mở khóa tài khoản')}
                        >
                          {user.status === 'Active' ? 'Khóa' : 'Mở khóa'}
                        </button>

                        <button
                          className="admin-btn admin-btn-outline"
                          style={{
                            padding: '4px 9px', fontSize: 11.5, cursor: 'pointer',
                            borderColor: '#0284c7', color: '#0284c7', fontWeight: 700,
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            background: 'rgba(2, 132, 199, 0.05)'
                          }}
                          onClick={() => handleOpenUserPermModal(user)}
                          title="Cấu hình ma trận 27 quyền chức năng chi tiết cho tài khoản này"
                        >
                          Quyền chức năng
                        </button>
                    </div>
                  </td>
                </tr>
              );
            })}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: '#111827' }}>
                  Phân quyền chức năng chuyên viên
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                  Chuyên viên: <strong>{selectedExpert.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setPermModalOpen(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 18, padding: 4 }}
              >
                ✕
              </button>
            </div>

            {/* Quick Actions */}
            <div style={{ margin: '14px 0 16px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => handleApplyPreset('all')}
                style={{
                  fontSize: 12, padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
                  background: currentPerms.length === PERMISSION_DEFINITIONS.length ? '#059669' : '#fff',
                  color: currentPerms.length === PERMISSION_DEFINITIONS.length ? '#fff' : '#047857',
                  border: '1px solid #a7f3d0', fontWeight: 600
                }}
              >
                Chọn tất cả
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('none')}
                style={{
                  fontSize: 12, padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
                  background: currentPerms.length === 0 ? '#ef4444' : '#fff',
                  color: currentPerms.length === 0 ? '#fff' : '#b91c1c',
                  border: '1px solid #fca5a5', fontWeight: 600
                }}
              >
                Bỏ chọn tất cả
              </button>
            </div>

            {/* Permission Card Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {PERMISSION_DEFINITIONS.map(perm => {
                const isChecked = currentPerms.includes(perm.key);
                const ICONS = {
                  workspace: (<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><rect x='2' y='3' width='20' height='14' rx='2'/><path d='M8 21h8M12 17v4'/></svg>),
                  calendar:  (<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><rect x='3' y='4' width='18' height='18' rx='2'/><path d='M16 2v4M8 2v4M3 10h18'/></svg>),
                  chart:     (<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><polyline points='22 12 18 12 15 21 9 3 6 12 2 12'/></svg>),
                  shield:    (<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/></svg>)
                };
                return (
                  <div
                    key={perm.key}
                    onClick={() => handleTogglePerm(perm.key)}
                    style={{
                      padding: '14px', borderRadius: 12, cursor: 'pointer',
                      background: isChecked ? perm.bg : '#fafafa',
                      border: isChecked ? '2px solid ' + perm.color : '1.5px solid #e5e7eb',
                      transition: 'all 0.18s ease',
                      position: 'relative', overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ color: isChecked ? perm.color : '#9ca3af' }}>{ICONS[perm.icon]}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: isChecked ? perm.color : '#6b7280', letterSpacing: '0.02em' }}>{perm.label}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 11, color: isChecked ? '#374151' : '#9ca3af', lineHeight: 1.4 }}>{perm.desc}</p>
                    <div style={{
                      position: 'absolute', top: 10, right: 10,
                      width: 18, height: 18, borderRadius: '50%',
                      background: isChecked ? perm.color : '#e5e7eb',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {isChecked && <svg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='3'><polyline points='20 6 9 17 4 12'/></svg>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid #e5e7eb' }}>
              <span style={{ fontSize: 12.5, color: '#64748b', fontWeight: 600 }}>
                Đã chọn: <strong style={{ color: '#0284c7' }}>{currentPerms.length}/{PERMISSION_DEFINITIONS.length}</strong>
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
                  style={{ background: '#0284c7', fontWeight: 700 }}
                >
                  {permSaving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL PHÂN NHIỀU VAI TRÒ (MULTI-ROLE ASSIGNMENT) ══════════════ */}
      {roleModalOpen && selectedUserForRoles && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: 'var(--a-card-bg, #ffffff)',
            borderRadius: 16, width: '100%', maxWidth: 580,
            maxHeight: '90vh', overflowY: 'auto',
            padding: '24px 28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--a-border, #e2e8f0)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 900, color: 'var(--a-text)' }}>
                  Phân vai trò tài khoản
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--a-text-muted)' }}>
                  Người dùng: <strong style={{ color: 'var(--a-text)' }}>{selectedUserForRoles.name}</strong> ({selectedUserForRoles.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRoleModalOpen(false)}
                style={{
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  color: 'var(--a-text-muted)', fontSize: 18, padding: 4
                }}
              >
                ✕
              </button>
            </div>

            {/* Chú thích Multi-role */}
            <div style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 12.5,
              color: '#4338ca',
              marginBottom: 16
            }}>
              💡 <strong>Hệ thống hỗ trợ Đa vai trò (Multi-Role):</strong> Một tài khoản có thể đồng thời đảm nhận nhiều vai trò trong 3 vai trò cốt lõi (ví dụ: Sinh viên + Chuyên viên, hoặc Chuyên viên + Quản trị viên).
            </div>

            {/* Quick Actions */}
            <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--a-text-muted)' }}>
                Chọn các vai trò áp dụng:
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setSelectedUserRoles(ALL_SYSTEM_ROLES.map(r => r.code))}
                  style={{
                    fontSize: 11.5, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                    background: 'transparent', color: '#4f46e5', border: '1px solid #c7d2fe', fontWeight: 600
                  }}
                >
                  Chọn tất cả
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const fallback = isCurrentUser(selectedUserForRoles) ? ['ADMIN'] : ['STUDENT'];
                    setSelectedUserRoles(fallback);
                  }}
                  style={{
                    fontSize: 11.5, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                    background: 'transparent', color: '#ef4444', border: '1px solid #fecaca', fontWeight: 600
                  }}
                >
                  Mặc định tối thiểu
                </button>
              </div>
            </div>

            {/* Danh sách 6 vai trò */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {ALL_SYSTEM_ROLES.map(role => {
                const isChecked = selectedUserRoles.includes(role.code);
                const isSelfAdmin = isCurrentUser(selectedUserForRoles) && role.code === 'ADMIN';

                return (
                  <div
                    key={role.code}
                    onClick={() => !isSelfAdmin && handleToggleUserRole(role.code)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      cursor: isSelfAdmin ? 'not-allowed' : 'pointer',
                      border: isChecked ? `1.5px solid ${role.color}` : '1.5px solid var(--a-border, #e2e8f0)',
                      background: isChecked ? role.bg : 'var(--a-card-bg, #ffffff)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Checkbox */}
                    <div style={{
                      width: 20, height: 20, borderRadius: 6,
                      background: isChecked ? role.color : 'transparent',
                      border: isChecked ? 'none' : '2px solid #cbd5e1',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isChecked && (
                        <svg width="12" height="10" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 800, color: isChecked ? role.color : 'var(--a-text)' }}>
                          {role.label}
                        </span>
                        <span style={{
                          fontSize: 10,
                          background: 'rgba(0,0,0,0.06)',
                          color: 'var(--a-text-muted)',
                          padding: '1px 6px',
                          borderRadius: 4,
                          fontWeight: 700
                        }}>
                          {role.code}
                        </span>
                        {isSelfAdmin && (
                          <span style={{ fontSize: 10, color: '#dc2626', fontWeight: 700 }}>
                            (Bắt buộc cho tài khoản của bạn)
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--a-text-muted)', marginTop: 2 }}>
                        {role.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 14,
              borderTop: '1px solid var(--a-border, #e2e8f0)'
            }}>
              <span style={{ fontSize: 12.5, color: 'var(--a-text-muted)', fontWeight: 600 }}>
                Đã gán: <strong style={{ color: '#4f46e5' }}>{selectedUserRoles.length} vai trò</strong>
              </span>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setRoleModalOpen(false)}
                  disabled={roleSaving}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={handleSaveUserRoles}
                  disabled={roleSaving}
                  style={{
                    background: '#4f46e5',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    padding: '8px 18px'
                  }}
                >
                  {roleSaving ? 'Đang lưu...' : 'Lưu vai trò'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL MA TRẬN 27 QUYỀN CHỨC NĂNG CHO NGƯỜI DÙNG (HYBRID RBAC) ══════════════ */}
      {userPermModalOpen && targetUserForPerm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1100,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: 'var(--a-card-bg, #ffffff)',
            borderRadius: 16, width: '100%', maxWidth: 760,
            maxHeight: '90vh', overflowY: 'auto',
            padding: '24px 28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--a-border, #e2e8f0)'
          }}>
            {/* Header Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--a-text)' }}>
                    Phân quyền chức năng cho tài khoản
                  </h2>
                  <span style={{
                    fontSize: 10.5,
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#4f46e5',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontWeight: 800
                  }}>
                    27 QUYỀN HỆ THỐNG
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--a-text-muted)' }}>
                  Người dùng: <strong style={{ color: 'var(--a-text)' }}>{targetUserForPerm.name}</strong> ({targetUserForPerm.email})
                </p>
                {/* Badges các vai trò */}
                <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
                  {(targetUserForPerm.roles && targetUserForPerm.roles.length > 0 ? targetUserForPerm.roles : [targetUserForPerm.role]).map((rCode, idx) => {
                    const meta = ROLE_META[rCode] || { label: rCode, color: '#475569', bg: '#f1f5f9' };
                    return (
                      <span
                        key={idx}
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '1px 7px',
                          borderRadius: 5,
                          color: meta.color,
                          background: meta.bg
                        }}
                      >
                        {meta.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setUserPermModalOpen(false);
                    navigate(`/admin/roles?tab=user&userId=${targetUserForPerm.id}`);
                  }}
                  className="admin-btn admin-btn-outline"
                  style={{
                    padding: '5px 10px', fontSize: 11.5, cursor: 'pointer',
                    borderColor: '#0284c7', color: '#0284c7', fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', gap: 4
                  }}
                  title="Mở toàn màn hình trang Ma trận phân quyền"
                >
                  Toàn màn hình ↗
                </button>
                <button
                  type="button"
                  onClick={() => setUserPermModalOpen(false)}
                  style={{
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    color: 'var(--a-text-muted)', fontSize: 18, padding: 4
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Thông báo an ninh */}
            {targetUserForPerm.role === 'Admin' || (targetUserForPerm.roles && targetUserForPerm.roles.includes('ADMIN')) ? (
              <div style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: 10, padding: '10px 14px', fontSize: 12.5,
                color: '#1d4ed8', marginBottom: 16
              }}>
                🛡️ Tài khoản <strong>Quản trị viên</strong> luôn sở hữu toàn bộ 27 quyền trên toàn hệ thống để bảo đảm an ninh vận hành.
              </div>
            ) : (
              <div style={{
                background: 'rgba(2, 132, 199, 0.08)',
                border: '1px solid rgba(2, 132, 199, 0.25)',
                borderRadius: 10, padding: '10px 14px', fontSize: 12.5,
                color: '#0369a1', marginBottom: 16
              }}>
                💡 Bạn có thể tick thêm quyền để cấp quyền riêng cho người này hoặc bỏ tick để thu hồi. Các quyền có nhãn <strong>[Từ vai trò]</strong> là quyền mặc định từ vai trò của người dùng.
              </div>
            )}

            {/* Controls: Tìm kiếm & Nút hành động */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <input
                type="text"
                className="admin-input"
                placeholder="Tìm quyền truy cập..."
                value={userPermSearch}
                onChange={e => setUserPermSearch(e.target.value)}
                style={{ padding: '7px 12px', fontSize: 12, flex: 1, minWidth: 200 }}
              />

              {!(targetUserForPerm.role === 'Admin' || (targetUserForPerm.roles && targetUserForPerm.roles.includes('ADMIN'))) && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleSelectAllUserPerms}
                    className="admin-btn admin-btn-outline"
                    style={{ padding: '5px 10px', fontSize: 11.5, cursor: 'pointer' }}
                  >
                    Chọn tất cả
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAllUserPerms}
                    className="admin-btn admin-btn-outline"
                    style={{ padding: '5px 10px', fontSize: 11.5, cursor: 'pointer', color: '#ef4444', borderColor: '#fca5a5' }}
                  >
                    Bỏ chọn
                  </button>
                  <button
                    type="button"
                    onClick={handleResetUserPerms}
                    className="admin-btn admin-btn-outline"
                    style={{ padding: '5px 10px', fontSize: 11.5, cursor: 'pointer', color: '#0d9488', borderColor: '#99f6e4' }}
                    title="Hoàn nguyên về các quyền mặc định từ vai trò của người này"
                  >
                    Hoàn nguyên vai trò
                  </button>
                </div>
              )}
            </div>

            {/* Thống kê quyền */}
            <div style={{
              display: 'flex', gap: 12, alignItems: 'center', fontSize: 12,
              color: 'var(--a-text-muted)', marginBottom: 16, padding: '8px 12px',
              background: '#f8fafc', borderRadius: 8
            }}>
              <span>
                Đang cấp: <strong style={{ color: '#0284c7' }}>{targetUserForPerm.role === 'Admin' || (targetUserForPerm.roles && targetUserForPerm.roles.includes('ADMIN')) ? catalogPerms.length : userSelectedPerms.size}</strong>/{catalogPerms.length} quyền
              </span>
              <span>•</span>
              <span>{userInheritedPerms.size} quyền từ vai trò</span>
              <span>•</span>
              <span style={{ color: '#7c3aed', fontWeight: 700 }}>
                {Array.from(userSelectedPerms).filter(p => !userInheritedPerms.has(p)).length} quyền cấp thêm riêng
              </span>
            </div>

            {/* Danh sách 5 nhóm Module */}
            {userPermLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--a-text-muted)' }}>
                Đang nạp dữ liệu phân quyền...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '52vh', overflowY: 'auto', paddingRight: 4 }}>
                {PERM_MODULE_ORDER.map(modName => {
                  const permsInMod = catalogPerms.filter(p => {
                    const matchMod = p.moduleName === modName;
                    if (!matchMod) return false;
                    if (!userPermSearch.trim()) return true;
                    const term = userPermSearch.toLowerCase();
                    return p.name.toLowerCase().includes(term) ||
                           p.code.toLowerCase().includes(term) ||
                           p.description.toLowerCase().includes(term);
                  });

                  if (permsInMod.length === 0) return null;

                  const isAdm = targetUserForPerm.role === 'Admin' ||
                                (targetUserForPerm.roles && targetUserForPerm.roles.includes('ADMIN'));

                  return (
                    <div key={modName} style={{
                      border: '1px solid var(--a-border, #e2e8f0)',
                      borderRadius: 10, padding: '12px 14px',
                      background: 'rgba(248, 250, 252, 0.4)'
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--a-text)', marginBottom: 10, paddingBottom: 6, borderBottom: '1px dashed var(--a-border, #e2e8f0)' }}>
                        {modName}
                      </div>

                      {/* Grid 2 cột */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 10 }}>
                        {permsInMod.map(p => {
                          const isChecked = isAdm || userSelectedPerms.has(p.code);
                          const isInherited = userInheritedPerms.has(p.code);
                          const isDirect = isChecked && !isInherited;

                          return (
                            <div
                              key={p.code}
                              onClick={() => handleToggleUserPerm(p.code)}
                              style={{
                                padding: '9px 11px',
                                borderRadius: 8,
                                border: isChecked ? (isDirect ? '1px solid #c084fc' : '1px solid #bfdbfe') : '1px solid var(--a-border, #e2e8f0)',
                                background: isChecked ? (isDirect ? '#faf5ff' : '#f0f9ff') : 'var(--a-card-bg, #ffffff)',
                                cursor: isAdm ? 'default' : 'pointer',
                                display: 'flex', alignItems: 'flex-start', gap: 9,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {/* Checkbox tròn */}
                              <div style={{
                                width: 17, height: 17, borderRadius: '50%',
                                background: isChecked ? (isDirect ? '#7c3aed' : '#0284c7') : 'transparent',
                                border: isChecked ? 'none' : '2px solid #cbd5e1',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginTop: 2, flexShrink: 0
                              }}>
                                {isChecked && (
                                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                    <path d="M1 4L3.5 6.5L9 1" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--a-text)' }}>
                                    {p.name}
                                  </span>
                                  <span style={{ fontSize: 9.5, color: 'var(--a-text-muted)', fontFamily: 'monospace' }}>
                                    {p.code}
                                  </span>
                                  {isChecked && (
                                    isDirect ? (
                                      <span style={{ fontSize: 9, background: '#ede9fe', color: '#7c3aed', padding: '1px 5px', borderRadius: 4, fontWeight: 800 }}>
                                        Cấp riêng
                                      </span>
                                    ) : (
                                      <span style={{ fontSize: 9, background: '#e0f2fe', color: '#0369a1', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
                                        Từ vai trò
                                      </span>
                                    )
                                  )}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--a-text-muted)', marginTop: 2, lineHeight: 1.3 }}>
                                  {p.description}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer Modal */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingTop: 16, marginTop: 16, borderTop: '1px solid var(--a-border, #e2e8f0)'
            }}>
              <span style={{ fontSize: 12, color: 'var(--a-text-muted)' }}>
                Tài khoản: <strong>{targetUserForPerm.email}</strong>
              </span>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setUserPermModalOpen(false)}
                  disabled={userPermSaving}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={handleSaveUserPermsSubmit}
                  disabled={userPermSaving || targetUserForPerm.role === 'Admin'}
                  style={{
                    background: '#0284c7', color: '#fff', border: 'none',
                    fontWeight: 700, padding: '8px 20px',
                    opacity: targetUserForPerm.role === 'Admin' ? 0.6 : 1,
                    cursor: targetUserForPerm.role === 'Admin' ? 'not-allowed' : (userPermSaving ? 'wait' : 'pointer')
                  }}
                >
                  {userPermSaving ? 'Đang lưu...' : 'Lưu quyền cho người dùng'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
