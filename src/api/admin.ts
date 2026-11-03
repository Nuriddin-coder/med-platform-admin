import { api } from './client';
import type {
  AdminStats,
  AppointmentsChartPoint,
  AdminLog,
  AdminLogsQueryParams,
  PlatformSettings,
  UpdatePlatformSettingsDto,
  PermissionsResponse,
  UpdateUserPermissionsDto,
} from './types';

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const res = await api.get<AdminStats>('/admin/stats');
    return res.data;
  },

  getAppointmentsChart: async (days: number = 30): Promise<AppointmentsChartPoint[]> => {
    const res = await api.get<AppointmentsChartPoint[]>('/admin/stats/appointments-chart', { days });
    return res.data || [];
  },

  getLogs: async (params?: AdminLogsQueryParams) => {
    return api.get<AdminLog[]>('/admin/logs', params as Record<string, unknown>);
  },

  getSettings: async (): Promise<PlatformSettings> => {
    const res = await api.get<PlatformSettings>('/admin/settings');
    return res.data;
  },

  updateSettings: async (data: UpdatePlatformSettingsDto): Promise<PlatformSettings> => {
    const res = await api.patch<PlatformSettings, UpdatePlatformSettingsDto>('/admin/settings', data);
    return res.data;
  },

  getPermissions: async (): Promise<PermissionsResponse> => {
    const res = await api.get<PermissionsResponse>('/admin/permissions');
    return res.data;
  },

  updateUserPermissions: async (userId: string, data: UpdateUserPermissionsDto): Promise<void> => {
    await api.put<unknown, UpdateUserPermissionsDto>(`/admin/permissions/${userId}`, data);
  },
};
