import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  getRolesMatrix,
  updateRolePermissions,
  getAllUsersPermissionsSummary,
  getUserPermissions,
  updateUserPermissions
} from '../api/adminApi';
import InPageNotification from '../../../shared/components/InPageNotification';

// ── Icons SVG nội bộ nhẹ nhàng, sắc nét chuẩn Glassmorphism ──
function ShieldIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function KeyIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5-2 2 1.5 1.5-5 5H4v3h3v-2h2v-2l5-5 1.5 1.5 2-2-1.5-1.5L21 2z" />
    </svg>
  );
}

function UsersIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function UserIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function CheckCircleIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function RefreshIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

const ROLE_META = {
  ADMIN: { label: 'Quản trị viên', color: '#4f46e5', bg: '#e0e7ff', border: '#c7d2fe' },
  Admin: { label: 'Quản trị viên', color: '#4f46e5', bg: '#e0e7ff', border: '#c7d2fe' },
  EXPERT: { label: 'Chuyên viên', color: '#0284c7', bg: '#e0f2fe', border: '#bae6fd' },
  Expert: { label: 'Chuyên viên', color: '#0284c7', bg: '#e0f2fe', border: '#bae6fd' },
  STUDENT: { label: 'Sinh viên', color: '#059669', bg: '#d1fae5', border: '#a7f3d0' },
  Student: { label: 'Sinh viên', color: '#059669', bg: '#d1fae5', border: '#a7f3d0' }
};

const MODULE_ORDER = [
  'Người dùng & Phân quyền',
  'Tư vấn & SafeRoom',
  'Khủng hoảng & Triage',
  'Cộng đồng & Kiểm duyệt',
  'Báo cáo & Thống kê'
];

const FALLBACK_ALL_PERMISSIONS = [
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

const DEFAULT_USERS_FALLBACK = [
  { userId: '11111111-1111-1111-1111-111111111111', fullName: 'Quản trị viên Nguyễn Văn An', email: 'admin@unimind.edu.vn', role: 'Admin', roles: ['ADMIN'], effectivePermissionCount: 27, directPermissionCount: 0, isActive: true },
  { userId: '22222222-2222-2222-2222-222222222224', fullName: 'Lê Minh Luân', email: 'luan.le@lhu.edu.vn', role: 'Admin', roles: ['ADMIN', 'EXPERT', 'STUDENT'], effectivePermissionCount: 27, directPermissionCount: 0, isActive: true },
  { userId: '33333333-3333-3333-3333-333333333330', fullName: 'Chuyên viên Tư Vấn Mẫu', email: 'expert@unimind.edu.vn', role: 'Expert', roles: ['EXPERT'], effectivePermissionCount: 17, directPermissionCount: 0, isActive: true },
  { userId: '33333333-3333-3333-3333-333333333331', fullName: 'ThS. Tâm lý Nguyễn Thanh Hà', email: 'ha.nguyen@unimind.edu.vn', role: 'Expert', roles: ['EXPERT'], effectivePermissionCount: 17, directPermissionCount: 0, isActive: true },
  { userId: '33333333-3333-3333-3333-333333333333', fullName: 'ThS. Lê Quốc Bảo', email: 'bao.le@unimind.edu.vn', role: 'Expert', roles: ['EXPERT'], effectivePermissionCount: 17, directPermissionCount: 0, isActive: true },
  { userId: '22222222-2222-2222-2222-222222222223', fullName: 'Ngô Tấn Lộc', email: 'loc.ngo@lhu.edu.vn', role: 'Student', roles: ['STUDENT'], effectivePermissionCount: 4, directPermissionCount: 0, isActive: true },
  { userId: '22222222-2222-2222-2222-222222222222', fullName: 'Sinh viên Nguyễn Hoàng An', email: 'sv_an@unimind.edu.vn', role: 'Student', roles: ['STUDENT'], effectivePermissionCount: 4, directPermissionCount: 0, isActive: true },
  { userId: '22222222-2222-2222-2222-222222222221', fullName: 'Sinh viên Thử Nghiệm', email: 'student@unimind.edu.vn', role: 'Student', roles: ['STUDENT'], effectivePermissionCount: 4, directPermissionCount: 0, isActive: true }
];

export default function RolesAndPermissionsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Chế độ phân quyền: 'ROLE' (Theo vai trò) hoặc 'USER' (Theo người dùng) ──
  const initialMode = searchParams.get('tab') === 'user' || searchParams.get('userId') ? 'USER' : 'ROLE';
  const [mode, setMode] = useState(initialMode);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageNotice, setPageNotice] = useState(null);

  // ── Dữ liệu phân quyền Vai trò ──
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState(FALLBACK_ALL_PERMISSIONS);
  const [totalRoles, setTotalRoles] = useState(3);
  const [totalPermissions, setTotalPermissions] = useState(27);
  const [totalAssignments, setTotalAssignments] = useState(10);

  const [selectedRoleCode, setSelectedRoleCode] = useState('ADMIN');
  const [roleSearch, setRoleSearch] = useState('');
  const [permissionSearch, setPermissionSearch] = useState('');
  const [selectedPerms, setSelectedPerms] = useState(new Set());

  // ── Dữ liệu phân quyền Người dùng riêng lẻ ──
  const [usersList, setUsersList] = useState(DEFAULT_USERS_FALLBACK);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(searchParams.get('userId') || DEFAULT_USERS_FALLBACK[0].userId);
  const [currentUserDetail, setCurrentUserDetail] = useState(null);
  const [userPermsLoading, setUserPermsLoading] = useState(false);

  // Tập hợp các quyền đang chọn cho người dùng
  const [userSelectedPerms, setUserSelectedPerms] = useState(new Set());
  // Danh sách các quyền kế thừa từ vai trò của người dùng
  const [userInheritedPerms, setUserInheritedPerms] = useState(new Set());
  // Danh sách các quyền cấp riêng ban đầu
  const [userDirectPerms, setUserDirectPerms] = useState(new Set());

  // ── 1. NẠP DỮ LIỆU BAN ĐẦU ──
  const loadInitialData = async () => {
    setLoading(true);
    try {
      // 1.1 Lấy ma trận vai trò
      const matrixRes = await getRolesMatrix();
      if (matrixRes && matrixRes.success && matrixRes.data) {
        setRoles(matrixRes.data.roles || []);
        if (matrixRes.data.allPermissions && matrixRes.data.allPermissions.length > 0) {
          setAllPermissions(matrixRes.data.allPermissions);
        }
        setTotalRoles(matrixRes.data.totalRoles || 6);
        setTotalPermissions(matrixRes.data.totalPermissions || 27);
        setTotalAssignments(matrixRes.data.totalAssignments || 19);

        const initialRole = matrixRes.data.roles.find(r => r.roleCode === selectedRoleCode) || matrixRes.data.roles[0];
        if (initialRole) {
          setSelectedRoleCode(initialRole.roleCode);
          setSelectedPerms(new Set(initialRole.permissions || []));
        }
      }

      // 1.2 Lấy danh sách tóm tắt người dùng
      const usersRes = await getAllUsersPermissionsSummary();
      if (usersRes && usersRes.success && Array.isArray(usersRes.data) && usersRes.data.length > 0) {
        setUsersList(usersRes.data);

        const targetId = searchParams.get('userId');
        const found = targetId ? usersRes.data.find(u => String(u.userId).toLowerCase() === String(targetId).toLowerCase()) : null;
        if (found) {
          setSelectedUserId(found.userId);
        } else if (!selectedUserId) {
          setSelectedUserId(usersRes.data[0].userId);
        }
      }
    } catch (err) {
      console.warn('Load matrix warning, using cached fallback data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Đồng bộ param khi đổi tab hoặc URL
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    const urlUserId = searchParams.get('userId');
    if (urlTab === 'user' || urlUserId) {
      setMode('USER');
      if (urlUserId && String(urlUserId).toLowerCase() !== String(selectedUserId).toLowerCase()) {
        setSelectedUserId(urlUserId);
      }
    }
  }, [searchParams]);

  // Chuyển tab chế độ
  const handleSwitchMode = (newMode) => {
    setMode(newMode);
    setPermissionSearch('');
    if (newMode === 'USER') {
      const nextUserId = selectedUserId || (usersList[0]?.userId ?? '');
      setSearchParams(nextUserId ? { tab: 'user', userId: nextUserId } : { tab: 'user' });
    } else {
      setSearchParams({ tab: 'role' });
    }
  };

  // ── 2. XỬ LÝ KHI CHỌN VAI TRÒ ──
  const currentRole = useMemo(() => {
    return roles.find(r => r.roleCode === selectedRoleCode) || roles[0] || null;
  }, [roles, selectedRoleCode]);

  useEffect(() => {
    if (currentRole) {
      setSelectedPerms(new Set(currentRole.permissions || []));
    }
  }, [currentRole]);

  // ── 3. XỬ LÝ KHI CHỌN NGƯỜI DÙNG ──
  const loadUserPermissionsDetail = useCallback(async (userId) => {
    if (!userId) return;
    setUserPermsLoading(true);

    // Tìm thông tin người dùng từ usersList
    const targetUser = usersList.find(u => String(u.userId).toLowerCase() === String(userId).toLowerCase()) ||
                       DEFAULT_USERS_FALLBACK.find(u => String(u.userId).toLowerCase() === String(userId).toLowerCase()) ||
                       usersList[0];

    try {
      const res = await getUserPermissions(userId);
      if (res && res.success && res.data) {
        setCurrentUserDetail(res.data);
        setUserSelectedPerms(new Set(res.data.effectivePermissions || []));
        setUserInheritedPerms(new Set(res.data.inheritedPermissions || []));
        setUserDirectPerms(new Set(res.data.directPermissions || []));
      } else {
        // Fallback tức thì nếu API đang nạp hoặc có lỗi
        const uRoles = targetUser?.roles || [targetUser?.role?.toUpperCase() || 'STUDENT'];
        const isAdm = uRoles.includes('ADMIN') || targetUser?.role === 'Admin';
        const isExp = uRoles.includes('EXPERT') || targetUser?.role === 'Expert';

        let fallbackCodes = ['POST_CREATE', 'COMMENT_CREATE', 'DASS21_TEST_TAKE', 'ANALYTICS_DASHBOARD_VIEW'];
        if (isAdm) {
          fallbackCodes = allPermissions.map(p => p.code);
        } else if (isExp) {
          fallbackCodes = [
            'USER_VIEW', 'SLOT_MANAGE', 'APPOINTMENT_APPROVE', 'SAFEROOM_CALL_HOST', 'CLINICAL_NOTE_WRITE', 'EMERGENCY_ESCALATE',
            'TRIAGE_QUEUE_VIEW', 'TRIAGE_STATUS_UPDATE', 'AI_SENTIMENT_RUN', 'POST_CREATE', 'COMMENT_CREATE', 'POST_MODERATE',
            'IMAGE_MODERATE', 'COMMENT_MODERATE', 'EXPERT_ADVICE_PIN', 'DASS21_REPORT_VIEW', 'ANALYTICS_DASHBOARD_VIEW'
          ];
        }

        const fallbackDetail = {
          userId: targetUser?.userId || userId,
          fullName: targetUser?.fullName || 'Người dùng',
          email: targetUser?.email || '',
          primaryRole: targetUser?.role || 'Student',
          roles: uRoles,
          roleNames: uRoles.map(r => ROLE_META[r]?.label || r),
          inheritedPermissions: fallbackCodes,
          directPermissions: [],
          effectivePermissions: fallbackCodes,
          allPermissions: allPermissions
        };

        setCurrentUserDetail(fallbackDetail);
        setUserSelectedPerms(new Set(fallbackCodes));
        setUserInheritedPerms(new Set(fallbackCodes));
        setUserDirectPerms(new Set());
      }
    } catch (err) {
      console.warn('Lỗi nạp quyền người dùng:', err);
    } finally {
      setUserPermsLoading(false);
    }
  }, [usersList, allPermissions]);

  useEffect(() => {
    if (mode === 'USER' && selectedUserId) {
      loadUserPermissionsDetail(selectedUserId);
    }
  }, [mode, selectedUserId, loadUserPermissionsDetail]);

  const handleSelectUser = (uId) => {
    setSelectedUserId(uId);
    setSearchParams({ tab: 'user', userId: uId });
  };

  // ── 4. SẮP XẾP VÀ BỘ LỌC TÌM KIẾM ──
  const filteredRoles = useMemo(() => {
    if (!roleSearch.trim()) return roles;
    const term = roleSearch.toLowerCase();
    return roles.filter(r =>
      r.roleName.toLowerCase().includes(term) ||
      r.roleCode.toLowerCase().includes(term) ||
      (r.description && r.description.toLowerCase().includes(term))
    );
  }, [roles, roleSearch]);

  // Sắp xếp người dùng theo thứ tự vai trò khoa học: Admin -> Expert -> Student
  const sortedAndFilteredUsers = useMemo(() => {
    const list = [...usersList].sort((a, b) => {
      const getPriority = (u) => {
        const rList = Array.isArray(u.roles) ? u.roles : [u.role?.toUpperCase() || 'STUDENT'];
        if (rList.includes('ADMIN') || u.role === 'Admin') return 1;
        if (rList.includes('EXPERT') || u.role === 'Expert') return 2;
        return 3;
      };
      const diff = getPriority(a) - getPriority(b);
      if (diff !== 0) return diff;
      return (a.fullName || '').localeCompare(b.fullName || '', 'vi');
    });

    return list.filter(u => {
      const matchSearch = !userSearch.trim() ||
        (u.fullName || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.roles && u.roles.some(r => r.toLowerCase().includes(userSearch.toLowerCase())));

      const matchRole = !userRoleFilter || (u.roles && u.roles.includes(userRoleFilter));
      return matchSearch && matchRole;
    });
  }, [usersList, userSearch, userRoleFilter]);

  // Nhóm quyền theo 5 module
  const groupedPermissions = useMemo(() => {
    const map = {};
    MODULE_ORDER.forEach(mod => { map[mod] = []; });

    const term = permissionSearch.trim().toLowerCase();
    allPermissions.forEach(p => {
      if (term) {
        const match = p.name.toLowerCase().includes(term) ||
                      p.code.toLowerCase().includes(term) ||
                      p.description.toLowerCase().includes(term);
        if (!match) return;
      }
      const mod = p.moduleName || 'Hệ thống';
      if (!map[mod]) map[mod] = [];
      map[mod].push(p);
    });

    return map;
  }, [allPermissions, permissionSearch]);

  // ── 5. THAO TÁC TICK / BỎ TICK QUYỀN ──
  const isCurrentUserAdmin = useMemo(() => {
    if (mode === 'ROLE') {
      return selectedRoleCode === 'ADMIN';
    }
    return currentUserDetail?.roles?.includes('ADMIN') || currentUserDetail?.primaryRole === 'Admin';
  }, [mode, selectedRoleCode, currentUserDetail]);

  // Toggle một quyền (Role hoặc User)
  const handleTogglePerm = (code) => {
    if (isCurrentUserAdmin) return; // Admin luôn có toàn quyền, không được phép thu hồi để bảo vệ an toàn

    if (mode === 'ROLE') {
      setSelectedPerms(prev => {
        const next = new Set(prev);
        if (next.has(code)) next.delete(code);
        else next.add(code);
        return next;
      });
    } else {
      setUserSelectedPerms(prev => {
        const next = new Set(prev);
        if (next.has(code)) next.delete(code);
        else next.add(code);
        return next;
      });
    }
  };

  // Chọn tất cả quyền
  const handleSelectAll = () => {
    if (isCurrentUserAdmin) return;
    const allCodes = allPermissions.map(p => p.code);
    if (mode === 'ROLE') {
      setSelectedPerms(new Set(allCodes));
    } else {
      setUserSelectedPerms(new Set(allCodes));
    }
  };

  // Bỏ chọn tất cả quyền
  const handleDeselectAll = () => {
    if (isCurrentUserAdmin) return;
    if (mode === 'ROLE') {
      setSelectedPerms(new Set());
    } else {
      setUserSelectedPerms(new Set());
    }
  };

  // Khôi phục quyền mặc định theo vai trò (chỉ ở tab Người dùng)
  const handleResetToRoleDefaults = () => {
    if (!currentUserDetail || isCurrentUserAdmin) return;
    setUserSelectedPerms(new Set(userInheritedPerms));
    setPageNotice({
      type: 'info',
      title: 'Đã hoàn nguyên quyền mặc định',
      message: `Đã khôi phục các quyền theo vai trò (${userInheritedPerms.size} quyền) cho "${currentUserDetail.fullName}". Bấm "Lưu quyền cho người dùng" để xác nhận.`
    });
  };

  // Toggle theo nhóm module
  const handleToggleModule = (moduleName, isSelectAll) => {
    if (isCurrentUserAdmin) return;
    const permsInMod = groupedPermissions[moduleName] || [];
    const modCodes = permsInMod.map(p => p.code);

    if (mode === 'ROLE') {
      setSelectedPerms(prev => {
        const next = new Set(prev);
        if (isSelectAll) modCodes.forEach(c => next.add(c));
        else modCodes.forEach(c => next.delete(c));
        return next;
      });
    } else {
      setUserSelectedPerms(prev => {
        const next = new Set(prev);
        if (isSelectAll) modCodes.forEach(c => next.add(c));
        else modCodes.forEach(c => next.delete(c));
        return next;
      });
    }
  };

  // ── 6. LƯU CẤU HÌNH PHÂN QUYỀN VAI TRÒ ──
  const handleSaveRolePermissions = async () => {
    if (!currentRole) return;
    if (currentRole.roleCode === 'ADMIN') {
      setPageNotice({
        type: 'info',
        title: 'Quyền Quản trị viên được bảo vệ',
        message: 'Quản trị viên luôn có toàn quyền hệ thống. Ma trận được khóa để tránh thu hồi quyền quản trị cốt lõi.'
      });
      return;
    }

    setSaving(true);
    try {
      const permList = Array.from(selectedPerms);
      const res = await updateRolePermissions(currentRole.roleCode, permList);
      if (res && res.success !== false) {
        setPageNotice({
          type: 'success',
          title: 'Lưu quyền vai trò thành công',
          message: `Đã cập nhật ${permList.length} quyền cho vai trò "${currentRole.roleName}". Dữ liệu đã đồng bộ SQL Server.`
        });
        setRoles(prev => prev.map(r => r.roleCode === currentRole.roleCode ? { ...r, permissions: permList, permissionCount: permList.length } : r));
      } else {
        throw new Error(res.message || 'Lỗi cập nhật từ máy chủ');
      }
    } catch (err) {
      setPageNotice({
        type: 'error',
        title: 'Lỗi lưu phân quyền',
        message: err?.response?.data?.message || err?.message || 'Không thể lưu cấu hình quyền vai trò.'
      });
    } finally {
      setSaving(false);
    }
  };

  // ── 7. LƯU CẤU HÌNH PHÂN QUYỀN CHO NGƯỜI DÙNG RIÊNG LẺ ──
  const handleSaveUserPermissions = async () => {
    if (!currentUserDetail) return;
    if (isCurrentUserAdmin) {
      setPageNotice({
        type: 'info',
        title: 'Tài khoản Quản trị viên được bảo vệ',
        message: 'Tài khoản Quản trị viên luôn sở hữu toàn bộ quyền hạn trên hệ thống.'
      });
      return;
    }

    setSaving(true);
    try {
      const permList = Array.from(userSelectedPerms);
      const res = await updateUserPermissions(currentUserDetail.userId, permList);
      if (res && res.success !== false) {
        setPageNotice({
          type: 'success',
          title: 'Lưu quyền người dùng thành công',
          message: `Đã cập nhật phân quyền riêng cho tài khoản "${currentUserDetail.fullName}" (${permList.length} quyền được cấp). Thông báo an ninh đã được gửi đến người dùng.`
        });

        // Cập nhật lại danh sách tóm tắt
        setUsersList(prev => prev.map(u => {
          if (String(u.userId).toLowerCase() === String(currentUserDetail.userId).toLowerCase()) {
            return {
              ...u,
              effectivePermissionCount: permList.length,
              directPermissionCount: permList.filter(p => !userInheritedPerms.has(p)).length
            };
          }
          return u;
        }));

        // Nạp lại chi tiết quyền
        await loadUserPermissionsDetail(currentUserDetail.userId);
      } else {
        throw new Error(res?.message || 'Lỗi cập nhật quyền người dùng');
      }
    } catch (err) {
      setPageNotice({
        type: 'error',
        title: 'Lỗi lưu phân quyền người dùng',
        message: err?.response?.data?.message || err?.message || 'Không thể lưu cấu hình quyền cho người dùng này.'
      });
    } finally {
      setSaving(false);
    }
  };

  // Thống kê số lượng quyền hiện tại
  const activePermsCount = mode === 'ROLE'
    ? (selectedRoleCode === 'ADMIN' ? totalPermissions : selectedPerms.size)
    : (isCurrentUserAdmin ? totalPermissions : userSelectedPerms.size);

  const activeTargetName = mode === 'ROLE'
    ? (currentRole?.roleName || 'Đang chọn')
    : (currentUserDetail?.fullName || 'Đang chọn');

  return (
    <div className="admin-page-shell" style={{ paddingBottom: 40 }}>
      {/* ── BREADCRUMB & HEADER ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--a-text-muted)' }}>
            <span>IT-LAB</span>
            <span>/</span>
            <span style={{ color: 'var(--a-text)', fontWeight: 600 }}>Phân quyền</span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className="admin-btn admin-btn-outline"
            style={{ padding: '4px 10px', fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            ← Quay lại Quản lý tài khoản
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                display: 'inline-flex',
                background: 'rgba(99, 102, 241, 0.1)',
                color: '#4f46e5',
                padding: '3px 8px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.05em'
              }}>
                RBAC + HYBRID
              </div>
              <span style={{ fontSize: 12, color: 'var(--a-text-muted)' }}>Mô hình phân quyền đa tầng UniMind</span>
            </div>
            <h1 className="admin-page-title" style={{ fontSize: 24, fontWeight: 900, marginTop: 4, marginBottom: 2 }}>
              Vai trò &amp; phân quyền hệ thống
            </h1>
            <p className="admin-page-subtitle" style={{ fontSize: 13, margin: 0, color: 'var(--a-text-muted)' }}>
              Thiết lập phạm vi truy cập theo vai trò hoặc tùy biến phân quyền riêng lẻ cho từng người dùng cụ thể.
            </p>
          </div>
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

      {/* ── 4 KPI CARDS (Theo đúng Hình 2) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 16,
        marginBottom: 20
      }}>
        {/* Card 1: Vai trò hệ thống / Người dùng */}
        <div className="admin-card" style={{
          padding: '18px 22px',
          background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
          color: '#ffffff',
          borderRadius: 14,
          boxShadow: '0 8px 20px rgba(79, 70, 229, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.85 }}>
                {mode === 'ROLE' ? 'Vai trò hệ thống' : 'Tổng người dùng'}
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, marginTop: 4, lineHeight: 1 }}>
                {mode === 'ROLE' ? totalRoles : sortedAndFilteredUsers.length}
              </div>
              <div style={{ fontSize: 11.5, opacity: 0.8, marginTop: 6 }}>
                {mode === 'ROLE' ? 'Đồng bộ từ database' : 'Tài khoản đăng ký'}
              </div>
            </div>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {mode === 'ROLE' ? <ShieldIcon size={20} color="#fff" /> : <UsersIcon size={20} color="#fff" />}
            </div>
          </div>
        </div>

        {/* Card 2: Quyền truy cập */}
        <div className="admin-card" style={{
          padding: '18px 22px',
          borderRadius: 14,
          background: 'var(--a-card-bg, #ffffff)',
          border: '1px solid var(--a-border, #e2e8f0)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--a-text-muted)' }}>Quyền truy cập</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--a-text)', marginTop: 4, lineHeight: 1 }}>{totalPermissions}</div>
            <div style={{ fontSize: 11.5, color: 'var(--a-text-muted)', marginTop: 6 }}>5 nhóm chức năng</div>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'rgba(2, 132, 199, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <KeyIcon size={20} color="#0284c7" />
          </div>
        </div>

        {/* Card 3: Tài khoản được gán */}
        <div className="admin-card" style={{
          padding: '18px 22px',
          borderRadius: 14,
          background: 'var(--a-card-bg, #ffffff)',
          border: '1px solid var(--a-border, #e2e8f0)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--a-text-muted)' }}>Tài khoản được gán</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--a-text)', marginTop: 4, lineHeight: 1 }}>{totalAssignments}</div>
            <div style={{ fontSize: 11.5, color: 'var(--a-text-muted)', marginTop: 6 }}>Tổng lượt gán vai trò</div>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'rgba(16, 185, 129, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <UsersIcon size={20} color="#10b981" />
          </div>
        </div>

        {/* Card 4: Quyền của đối tượng đang chọn */}
        <div className="admin-card" style={{
          padding: '18px 22px',
          borderRadius: 14,
          background: 'var(--a-card-bg, #ffffff)',
          border: '1px solid var(--a-border, #e2e8f0)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--a-text-muted)' }}>
              {mode === 'ROLE' ? 'Quyền của vai trò này' : 'Quyền của người dùng này'}
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#f59e0b', marginTop: 4, lineHeight: 1 }}>
              {activePermsCount}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--a-text-muted)', marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
              {activeTargetName}
            </div>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'rgba(245, 158, 11, 0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ShieldIcon size={20} color="#f59e0b" />
          </div>
        </div>
      </div>

      {/* ── BỘ CHUYỂN CHẾ ĐỘ PHÂN QUYỀN (ROLE vs USER TABS) ── */}
      <div style={{
        display: 'inline-flex',
        background: '#f1f5f9',
        padding: 4,
        borderRadius: 12,
        gap: 6,
        marginBottom: 20,
        border: '1px solid var(--a-border, #e2e8f0)'
      }}>
        <button
          type="button"
          onClick={() => handleSwitchMode('ROLE')}
          style={{
            padding: '8px 18px',
            borderRadius: 9,
            fontSize: 13,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: mode === 'ROLE' ? '#ffffff' : 'transparent',
            color: mode === 'ROLE' ? '#4f46e5' : '#64748b',
            boxShadow: mode === 'ROLE' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
          }}
        >
          <ShieldIcon size={16} color={mode === 'ROLE' ? '#4f46e5' : '#64748b'} />
          <span>Phân quyền theo Vai trò</span>
          <span style={{
            fontSize: 11,
            padding: '1px 6px',
            borderRadius: 10,
            background: mode === 'ROLE' ? '#e0e7ff' : '#e2e8f0',
            color: mode === 'ROLE' ? '#4338ca' : '#475569'
          }}>
            {roles.length || 6}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitchMode('USER')}
          style={{
            padding: '8px 18px',
            borderRadius: 9,
            fontSize: 13,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: mode === 'USER' ? '#ffffff' : 'transparent',
            color: mode === 'USER' ? '#0284c7' : '#64748b',
            boxShadow: mode === 'USER' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
          }}
        >
          <UserIcon size={16} color={mode === 'USER' ? '#0284c7' : '#64748b'} />
          <span>Phân quyền theo Người dùng riêng lẻ</span>
          <span style={{
            fontSize: 11,
            padding: '1px 6px',
            borderRadius: 10,
            background: mode === 'USER' ? '#e0f2fe' : '#e2e8f0',
            color: mode === 'USER' ? '#0369a1' : '#475569'
          }}>
            {sortedAndFilteredUsers.length}
          </span>
        </button>
      </div>

      {/* ── BỐ CỤC 2 CỘT CHUẨN HÌNH 2 ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 340px) 1fr',
        gap: 20,
        alignItems: 'start'
      }}>

        {/* ══════════════════════════════════════════════════════════
            CỘT TRÁI: DANH SÁCH ĐỐI TƯỢNG (VAI TRÒ HOẶC NGƯỜI DÙNG)
           ══════════════════════════════════════════════════════════ */}
        <div className="admin-card" style={{ padding: '18px 16px', borderRadius: 14 }}>
          {mode === 'ROLE' ? (
            /* ── CHẾ ĐỘ 1: DANH SÁCH VAI TRÒ ── */
            <>
              <div style={{ marginBottom: 12, paddingLeft: 4 }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--a-text)' }}>
                  Danh sách vai trò
                </h2>
                <p style={{ fontSize: 11.5, color: 'var(--a-text-muted)', margin: '2px 0 0' }}>
                  Chọn vai trò để xem &amp; phân quyền chung.
                </p>
              </div>

              {/* Ô tìm kiếm vai trò */}
              <div style={{ marginBottom: 14 }}>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="Tìm vai trò..."
                  value={roleSearch}
                  onChange={e => setRoleSearch(e.target.value)}
                  style={{ padding: '8px 12px', fontSize: 12.5 }}
                />
              </div>

              {/* Danh sách các vai trò */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filteredRoles.map(r => {
                  const isActive = r.roleCode === selectedRoleCode;
                  return (
                    <div
                      key={r.roleCode}
                      onClick={() => setSelectedRoleCode(r.roleCode)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        background: isActive ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                        border: isActive ? '1px solid #6366f1' : '1px solid transparent',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: isActive ? '#4f46e5' : 'rgba(100, 116, 139, 0.1)',
                        color: isActive ? '#fff' : 'var(--a-text-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {r.roleCode === 'ADMIN' && <ShieldIcon size={18} color={isActive ? '#fff' : '#6366f1'} />}
                        {r.roleCode === 'EXPERT' && <UsersIcon size={18} color={isActive ? '#fff' : '#0284c7'} />}
                        {r.roleCode === 'STUDENT' && <UsersIcon size={18} color={isActive ? '#fff' : '#10b981'} />}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--a-text)' }}>
                            {r.roleName}
                          </span>
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--a-text-muted)', marginTop: 2 }}>
                          {r.userCount} người dùng • {r.permissionCount} quyền
                        </div>
                      </div>

                      {isActive && (
                        <span style={{ fontSize: 16, color: '#4f46e5', fontWeight: 900 }}>›</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* ── CHẾ ĐỘ 2: DANH SÁCH NGƯỜI DÙNG (SẮP XẾP KHOA HỌC) ── */
            <>
              <div style={{ marginBottom: 12, paddingLeft: 4 }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--a-text)' }}>
                  Danh sách tài khoản
                </h2>
                <p style={{ fontSize: 11.5, color: 'var(--a-text-muted)', margin: '2px 0 0' }}>
                  Chọn bất kỳ tài khoản nào để cấu hình quyền riêng.
                </p>
              </div>

              {/* Ô tìm kiếm người dùng */}
              <div style={{ marginBottom: 10 }}>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="Tìm theo tên, email..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  style={{ padding: '8px 12px', fontSize: 12.5 }}
                />
              </div>

              {/* Bộ lọc vai trò nhanh */}
              <div style={{ marginBottom: 12 }}>
                <select
                  className="admin-input"
                  value={userRoleFilter}
                  onChange={e => setUserRoleFilter(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: 12 }}
                >
                  <option value="">Tất cả vai trò ({usersList.length})</option>
                  <option value="ADMIN">Quản trị viên</option>
                  <option value="EXPERT">Chuyên viên</option>
                  <option value="STUDENT">Sinh viên</option>
                </select>
              </div>

              {/* Danh sách người dùng cuộn mượt mà */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '620px', overflowY: 'auto', paddingRight: 2 }}>
                {sortedAndFilteredUsers.map(u => {
                  const isActive = String(u.userId).toLowerCase() === String(selectedUserId).toLowerCase();
                  const initialChar = (u.fullName?.[0] || 'U').toUpperCase();
                  const isAdmin = u.roles?.includes('ADMIN') || u.role === 'Admin';
                  const isExpert = u.roles?.includes('EXPERT') || u.role === 'Expert';

                  return (
                    <div
                      key={u.userId}
                      onClick={() => handleSelectUser(u.userId)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        background: isActive ? 'rgba(2, 132, 199, 0.09)' : 'transparent',
                        border: isActive ? '1px solid #0284c7' : '1px solid transparent',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10
                      }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: isAdmin ? '#4f46e5' : isExpert ? '#0284c7' : '#0d9488',
                        color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 800, flexShrink: 0
                      }}>
                        {initialChar}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--a-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                            {u.fullName}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--a-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {u.email}
                        </div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                          {(u.roles || [u.role]).map((rCode, idx) => {
                            const meta = ROLE_META[rCode] || { label: rCode, color: '#475569', bg: '#f1f5f9' };
                            return (
                              <span
                                key={idx}
                                style={{
                                  fontSize: 9.5,
                                  fontWeight: 700,
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                  color: meta.color,
                                  background: meta.bg
                                }}
                              >
                                {meta.label}
                              </span>
                            );
                          })}
                          <span style={{
                            fontSize: 10,
                            color: u.directPermissionCount > 0 ? '#7c3aed' : 'var(--a-text-muted)',
                            fontWeight: 600,
                            marginLeft: 'auto'
                          }}>
                            {u.effectivePermissionCount || 4} quyền
                            {u.directPermissionCount > 0 && ` (+${u.directPermissionCount})`}
                          </span>
                        </div>
                      </div>

                      {isActive && (
                        <span style={{ fontSize: 16, color: '#0284c7', fontWeight: 900 }}>›</span>
                      )}
                    </div>
                  );
                })}

                {sortedAndFilteredUsers.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px 8px', color: 'var(--a-text-muted)', fontSize: 12 }}>
                    Không tìm thấy tài khoản phù hợp.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════
            CỘT PHẢI: MA TRẬN PHÂN QUYỀN (VAI TRÒ HOẶC NGƯỜI DÙNG)
           ══════════════════════════════════════════════════════════ */}
        <div className="admin-card" style={{ padding: '22px 24px', borderRadius: 14 }}>
          {mode === 'ROLE' ? (
            /* ────────────────────────────────────────────────────────
               TAB 1: MA TRẬN QUYỀN CHO VAI TRÒ (CHUẨN HÌNH 2)
               ──────────────────────────────────────────────────────── */
            currentRole ? (
              <>
                {/* Header vai trò */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 16,
                  paddingBottom: 16,
                  borderBottom: '1px solid var(--a-border, #e2e8f0)'
                }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: 12,
                      background: 'rgba(79, 70, 229, 0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <ShieldIcon size={24} color="#4f46e5" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: 'var(--a-text)' }}>
                          {currentRole.roleName}
                        </h2>
                        <span style={{
                          fontSize: 10.5,
                          background: '#e0e7ff',
                          color: '#4338ca',
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontWeight: 800
                        }}>
                          {currentRole.roleCode}
                        </span>
                        {currentRole.isSystemRole && (
                          <span style={{
                            fontSize: 10.5,
                            background: 'rgba(100, 116, 139, 0.12)',
                            color: 'var(--a-text-muted)',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontWeight: 700
                          }}>
                            Vai trò hệ thống
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12.5, color: 'var(--a-text-muted)', margin: '4px 0 0' }}>
                        {currentRole.description || 'Vai trò người dùng trong hệ thống'}
                      </p>
                      <div style={{ fontSize: 11.5, color: 'var(--a-text-muted)', marginTop: 2 }}>
                        {currentRole.userCount} người dùng • {selectedRoleCode === 'ADMIN' ? totalPermissions : selectedPerms.size}/{totalPermissions} quyền được cấp
                      </div>
                    </div>
                  </div>

                  {/* Các nút hành động góc trên phải */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {selectedRoleCode !== 'ADMIN' && (
                      <>
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          className="admin-btn admin-btn-outline"
                          style={{ padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}
                        >
                          Chọn tất cả
                        </button>
                        <button
                          type="button"
                          onClick={handleDeselectAll}
                          className="admin-btn admin-btn-outline"
                          style={{ padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: '#ef4444', borderColor: '#fca5a5' }}
                        >
                          Bỏ chọn tất cả
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveRolePermissions}
                          disabled={saving}
                          className="admin-btn admin-btn-primary"
                          style={{
                            padding: '7px 16px',
                            fontSize: 12.5,
                            fontWeight: 800,
                            background: '#0284c7',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            cursor: saving ? 'wait' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          {saving ? 'Đang lưu...' : 'Lưu cấu hình quyền'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Ô tìm kiếm quyền */}
                <div style={{ marginTop: 14, marginBottom: 14 }}>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Tìm quyền truy cập..."
                    value={permissionSearch}
                    onChange={e => setPermissionSearch(e.target.value)}
                    style={{ padding: '9px 14px', fontSize: 12.5 }}
                  />
                </div>

                {/* Hộp thông báo màu xanh nhạt (Chuẩn Hình 2) */}
                <div style={{
                  background: selectedRoleCode === 'ADMIN' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                  border: selectedRoleCode === 'ADMIN' ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 12.5,
                  color: selectedRoleCode === 'ADMIN' ? '#1d4ed8' : '#047857',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <CheckCircleIcon size={16} color="currentColor" />
                  <span>
                    {selectedRoleCode === 'ADMIN'
                      ? 'Quản trị viên luôn có toàn quyền hệ thống. Ma trận được khóa để tránh thu hồi quyền quản trị cốt lõi.'
                      : `Thay đổi phân quyền cho vai trò "${currentRole.roleName}" sẽ có hiệu lực ngay lập tức và áp dụng cho toàn bộ người dùng mang vai trò này.`}
                  </span>
                </div>

                {/* ── 5 NHÓM QUYỀN TRUY CẬP ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {MODULE_ORDER.map(modName => {
                    const perms = groupedPermissions[modName] || [];
                    if (perms.length === 0) return null;

                    const selectedInGroup = perms.filter(p => selectedRoleCode === 'ADMIN' || selectedPerms.has(p.code)).length;
                    const isAllSelected = selectedInGroup === perms.length;

                    return (
                      <div key={modName} style={{
                        border: '1px solid var(--a-border, #f1f5f9)',
                        borderRadius: 12,
                        padding: '16px 18px',
                        background: 'rgba(248, 250, 252, 0.5)'
                      }}>
                        {/* Tiêu đề nhóm */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 14,
                          paddingBottom: 8,
                          borderBottom: '1px dashed var(--a-border, #e2e8f0)'
                        }}>
                          <div>
                            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--a-text)' }}>
                              {modName}
                            </span>
                            <span style={{ fontSize: 11.5, color: 'var(--a-text-muted)', marginLeft: 8 }}>
                              {selectedInGroup}/{perms.length} quyền được cấp
                            </span>
                          </div>

                          {selectedRoleCode !== 'ADMIN' && (
                            <button
                              type="button"
                              onClick={() => handleToggleModule(modName, !isAllSelected)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: isAllSelected ? '#ef4444' : '#0284c7',
                                fontSize: 11.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                                padding: '2px 6px'
                              }}
                            >
                              {isAllSelected ? 'Bỏ chọn nhóm' : 'Chọn nhóm'}
                            </button>
                          )}
                        </div>

                        {/* Danh sách thẻ quyền (Grid 2 cột) */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                          gap: 12
                        }}>
                          {perms.map(p => {
                            const isChecked = selectedRoleCode === 'ADMIN' || selectedPerms.has(p.code);
                            return (
                              <div
                                key={p.code}
                                onClick={() => handleTogglePerm(p.code)}
                                style={{
                                  padding: '10px 12px',
                                  borderRadius: 8,
                                  border: isChecked ? '1px solid #bfdbfe' : '1px solid var(--a-border, #e2e8f0)',
                                  background: isChecked ? '#f0f9ff' : 'var(--a-card-bg, #ffffff)',
                                  cursor: selectedRoleCode === 'ADMIN' ? 'default' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 10,
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {/* Checkbox tròn xanh dương chuẩn Hình 2 */}
                                <div style={{
                                  width: 18, height: 18, borderRadius: '50%',
                                  background: isChecked ? '#0284c7' : 'transparent',
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
                                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--a-text)' }}>
                                      {p.name}
                                    </span>
                                    <span style={{ fontSize: 10, color: 'var(--a-text-muted)', fontFamily: 'monospace' }}>
                                      {p.code}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: 11.5, color: 'var(--a-text-muted)', marginTop: 2, lineHeight: 1.35 }}>
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
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--a-text-muted)' }}>
                Chọn một vai trò ở danh sách bên trái để xem và phân quyền chi tiết.
              </div>
            )
          ) : (
            /* ────────────────────────────────────────────────────────
               TAB 2: MA TRẬN QUYỀN CHO NGƯỜI DÙNG RIÊNG LẺ (HYBRID RBAC)
               ──────────────────────────────────────────────────────── */
            currentUserDetail ? (
              <>
                {/* Header người dùng */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 16,
                  paddingBottom: 16,
                  borderBottom: '1px solid var(--a-border, #e2e8f0)'
                }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: isCurrentUserAdmin ? '#4f46e5' : '#0284c7',
                      color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 800
                    }}>
                      {(currentUserDetail.fullName?.[0] || 'U').toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: 'var(--a-text)' }}>
                          {currentUserDetail.fullName}
                        </h2>
                        {currentUserDetail.roles?.map((rCode, idx) => {
                          const meta = ROLE_META[rCode] || { label: rCode, color: '#475569', bg: '#f1f5f9' };
                          return (
                            <span
                              key={idx}
                              style={{
                                fontSize: 10.5,
                                background: meta.bg,
                                color: meta.color,
                                padding: '2px 8px',
                                borderRadius: 6,
                                fontWeight: 800
                              }}
                            >
                              {meta.label}
                            </span>
                          );
                        })}
                      </div>
                      <p style={{ fontSize: 12.5, color: 'var(--a-text-muted)', margin: '4px 0 0' }}>
                        {currentUserDetail.email}
                      </p>
                      <div style={{ fontSize: 11.5, color: 'var(--a-text-muted)', marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <span>
                          <strong>{isCurrentUserAdmin ? totalPermissions : userSelectedPerms.size}</strong>/{totalPermissions} quyền hiệu lực
                        </span>
                        <span>•</span>
                        <span>
                          {userInheritedPerms.size} quyền từ vai trò
                        </span>
                        <span>•</span>
                        <span style={{ color: '#7c3aed', fontWeight: 700 }}>
                          {Array.from(userSelectedPerms).filter(p => !userInheritedPerms.has(p)).length} quyền cấp thêm riêng
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nút hành động */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {!isCurrentUserAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          className="admin-btn admin-btn-outline"
                          style={{ padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}
                        >
                          Chọn tất cả
                        </button>
                        <button
                          type="button"
                          onClick={handleDeselectAll}
                          className="admin-btn admin-btn-outline"
                          style={{ padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: '#ef4444', borderColor: '#fca5a5' }}
                        >
                          Bỏ chọn tất cả
                        </button>
                        <button
                          type="button"
                          onClick={handleResetToRoleDefaults}
                          className="admin-btn admin-btn-outline"
                          style={{
                            padding: '6px 12px', fontSize: 12, cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            color: '#0d9488', borderColor: '#99f6e4'
                          }}
                          title="Hoàn nguyên về tập quyền kế thừa chuẩn từ vai trò của người này"
                        >
                          <RefreshIcon size={13} color="currentColor" />
                          Hoàn nguyên vai trò
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveUserPermissions}
                          disabled={saving}
                          className="admin-btn admin-btn-primary"
                          style={{
                            padding: '7px 16px',
                            fontSize: 12.5,
                            fontWeight: 800,
                            background: '#0284c7',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            cursor: saving ? 'wait' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          {saving ? 'Đang lưu...' : 'Lưu quyền cho người dùng'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Ô tìm kiếm quyền */}
                <div style={{ marginTop: 14, marginBottom: 14 }}>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Tìm quyền truy cập..."
                    value={permissionSearch}
                    onChange={e => setPermissionSearch(e.target.value)}
                    style={{ padding: '9px 14px', fontSize: 12.5 }}
                  />
                </div>

                {/* Hộp thông báo chỉ dẫn */}
                <div style={{
                  background: isCurrentUserAdmin ? 'rgba(59, 130, 246, 0.08)' : 'rgba(2, 132, 199, 0.08)',
                  border: isCurrentUserAdmin ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid rgba(2, 132, 199, 0.25)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 12.5,
                  color: isCurrentUserAdmin ? '#1d4ed8' : '#0369a1',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <CheckCircleIcon size={16} color="currentColor" />
                  <span>
                    {isCurrentUserAdmin
                      ? 'Tài khoản Quản trị viên luôn có toàn quyền trên toàn hệ thống. Ma trận được bảo vệ cố định.'
                      : `Bạn đang tùy chỉnh quyền hạn riêng cho tài khoản "${currentUserDetail.fullName}". Các quyền có nhãn [Từ vai trò] là mặc định. Bạn có thể tick thêm các quyền khác để cấp quyền riêng biệt cho cá nhân này.`}
                  </span>
                </div>

                {/* ── 5 NHÓM QUYỀN TRUY CẬP (USER MODE) ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {MODULE_ORDER.map(modName => {
                    const perms = groupedPermissions[modName] || [];
                    if (perms.length === 0) return null;

                    const selectedInGroup = perms.filter(p => isCurrentUserAdmin || userSelectedPerms.has(p.code)).length;
                    const isAllSelected = selectedInGroup === perms.length;

                    return (
                      <div key={modName} style={{
                        border: '1px solid var(--a-border, #f1f5f9)',
                        borderRadius: 12,
                        padding: '16px 18px',
                        background: 'rgba(248, 250, 252, 0.5)'
                      }}>
                        {/* Tiêu đề nhóm */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 14,
                          paddingBottom: 8,
                          borderBottom: '1px dashed var(--a-border, #e2e8f0)'
                        }}>
                          <div>
                            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--a-text)' }}>
                              {modName}
                            </span>
                            <span style={{ fontSize: 11.5, color: 'var(--a-text-muted)', marginLeft: 8 }}>
                              {selectedInGroup}/{perms.length} quyền được cấp
                            </span>
                          </div>

                          {!isCurrentUserAdmin && (
                            <button
                              type="button"
                              onClick={() => handleToggleModule(modName, !isAllSelected)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: isAllSelected ? '#ef4444' : '#0284c7',
                                fontSize: 11.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                                padding: '2px 6px'
                              }}
                            >
                              {isAllSelected ? 'Bỏ chọn nhóm' : 'Chọn nhóm'}
                            </button>
                          )}
                        </div>

                        {/* Danh sách thẻ quyền (Grid 2 cột) */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                          gap: 12
                        }}>
                          {perms.map(p => {
                            const isChecked = isCurrentUserAdmin || userSelectedPerms.has(p.code);
                            const isInherited = userInheritedPerms.has(p.code);
                            const isDirect = isChecked && !isInherited;

                            return (
                              <div
                                key={p.code}
                                onClick={() => handleTogglePerm(p.code)}
                                style={{
                                  padding: '10px 12px',
                                  borderRadius: 8,
                                  border: isChecked ? (isDirect ? '1px solid #c084fc' : '1px solid #bfdbfe') : '1px solid var(--a-border, #e2e8f0)',
                                  background: isChecked ? (isDirect ? '#faf5ff' : '#f0f9ff') : 'var(--a-card-bg, #ffffff)',
                                  cursor: isCurrentUserAdmin ? 'default' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 10,
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {/* Checkbox tròn chuẩn Hình 2 */}
                                <div style={{
                                  width: 18, height: 18, borderRadius: '50%',
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
                                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--a-text)' }}>
                                      {p.name}
                                    </span>
                                    <span style={{ fontSize: 10, color: 'var(--a-text-muted)', fontFamily: 'monospace' }}>
                                      {p.code}
                                    </span>
                                    {/* Nhãn nguồn gốc quyền */}
                                    {isChecked && (
                                      isDirect ? (
                                        <span style={{
                                          fontSize: 9.5,
                                          background: '#ede9fe',
                                          color: '#7c3aed',
                                          padding: '1px 5px',
                                          borderRadius: 4,
                                          fontWeight: 800
                                        }}>
                                          Cấp riêng
                                        </span>
                                      ) : (
                                        <span style={{
                                          fontSize: 9.5,
                                          background: '#e0f2fe',
                                          color: '#0369a1',
                                          padding: '1px 5px',
                                          borderRadius: 4,
                                          fontWeight: 700
                                        }}>
                                          Từ vai trò
                                        </span>
                                      )
                                    )}
                                  </div>
                                  <div style={{ fontSize: 11.5, color: 'var(--a-text-muted)', marginTop: 2, lineHeight: 1.35 }}>
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
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--a-text-muted)' }}>
                {userPermsLoading ? 'Đang nạp quyền người dùng...' : 'Chọn một tài khoản ở danh sách bên trái để phân quyền chi tiết.'}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
