import { api } from './client';
import type {
  Service,
  CreateServiceDto,
  UpdateServiceDto,
} from './types';

export interface ServicesQueryParams {
  clinicId?: string;
}

export const servicesApi = {
  getServices: async (params?: ServicesQueryParams) => {
    // Contract 103: GET /services (query: clinicId only)
    const query = params?.clinicId ? { clinicId: params.clinicId } : undefined;
    return api.get<Service[]>('/services', query);
  },

  getService: async (id: string) => {
    return api.get<Service>(`/services/${id}`);
  },

  createService: async (data: CreateServiceDto) => {
    return api.post<Service, CreateServiceDto>('/services', data);
  },

  updateService: async (id: string, data: UpdateServiceDto) => {
    return api.patch<Service, UpdateServiceDto>(`/services/${id}`, data);
  },

  deleteService: async (id: string) => {
    return api.delete<{ message: string }>(`/services/${id}`);
  },
};
