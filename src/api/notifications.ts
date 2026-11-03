import { api } from './client';
import type { Notification, UnreadCount } from './types';

export const notificationsApi = {
  getUnreadCount: async (): Promise<number> => {
    const res = await api.get<UnreadCount>('/notifications/unread-count');
    return res.data?.count ?? 0;
  },

  getList: async (isRead?: boolean): Promise<Notification[]> => {
    const params = isRead !== undefined ? { isRead } : undefined;
    const res = await api.get<Notification[]>('/notifications', params);
    return res.data || [];
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },
};

