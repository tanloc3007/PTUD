import axiosClient from '../../auth/api/authApi';

/** Lấy danh sách toàn bộ người dùng */
export async function getAllUsers() {
  try {
    const res = await axiosClient.get('/admin/users');
    return res.data;
  } catch (err) {
    console.warn('API /admin/users error, falling back:', err);
    return null;
  }
}

/** Cấp tài khoản Chuyên viên Tư vấn Tâm lý mới */
export async function createExpert(expertData) {
  const res = await axiosClient.post('/admin/experts', expertData);
  return res.data;
}

/** Khóa / Mở khóa tài khoản */
export async function toggleUserStatus(userId) {
  const res = await axiosClient.patch(`/admin/users/${userId}/toggle-status`);
  return res.data;
}

/** Cập nhật vai trò người dùng */
export async function updateUserRole(userId, role) {
  const res = await axiosClient.patch(`/admin/users/${userId}/role`, { role });
  return res.data;
}

/** Lấy nhật ký hoạt động hệ thống có phân trang */
export async function getAuditLogHistory(params = {}) {
  try {
    const res = await axiosClient.get('/admin/audit-logs/history', { params });
    return res.data;
  } catch (err) {
    console.warn('API /admin/audit-logs/history error:', err);
    return null;
  }
}

/** Lấy nhật ký audit đơn giản */
export async function getAuditLogs() {
  try {
    const res = await axiosClient.get('/admin/audit-logs');
    return res.data;
  } catch (err) {
    return null;
  }
}

/** Lấy tùy chọn lọc cho nhật ký (danh sách nhân sự) */
export async function getAuditLogFilterOptions() {
  try {
    const res = await axiosClient.get('/admin/audit-logs/filter-options');
    return res.data;
  } catch (err) {
    return null;
  }
}

/** Lấy dashboard thống kê */
export async function getAdminDashboard() {
  try {
    const res = await axiosClient.get('/admin/dashboard/stats');
    return res.data;
  } catch (err) {
    return null;
  }
}

/** Lấy báo cáo tổng hợp */
export async function getAdminReports() {
  try {
    const res = await axiosClient.get('/admin/reports');
    return res.data;
  } catch (err) {
    return null;
  }
}
