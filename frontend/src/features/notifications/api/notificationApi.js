import axiosClient from '../../auth/api/authApi';

export const getNotifications = async ({ userId, role, unreadOnly, limit = 50 } = {}) => {
  const params = {};
  if (userId) params.userId = userId;
  if (role) params.role = role;
  if (unreadOnly !== undefined) params.unreadOnly = unreadOnly;
  if (limit) params.limit = limit;

  const res = await axiosClient.get('/notifications', { params });
  return res.data;
};

export const getUnreadCount = async ({ userId, role } = {}) => {
  const params = {};
  if (userId) params.userId = userId;
  if (role) params.role = role;

  const res = await axiosClient.get('/notifications/unread-count', { params });
  return res.data;
};

export const markAsRead = async (id, userId) => {
  const params = userId ? { userId } : {};
  const res = await axiosClient.patch(`/notifications/${id}/read`, null, { params });
  return res.data;
};

export const markAllAsRead = async ({ userId, role } = {}) => {
  const params = {};
  if (userId) params.userId = userId;
  if (role) params.role = role;

  const res = await axiosClient.post('/notifications/read-all', null, { params });
  return res.data;
};

export const deleteNotification = async (id, userId) => {
  const params = userId ? { userId } : {};
  const res = await axiosClient.delete(`/notifications/${id}`, { params });
  return res.data;
};
