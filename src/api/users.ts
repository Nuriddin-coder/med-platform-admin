import { api } from './client';
import type {
  User,
  CreateUserDto,
  UpdateUserDto,
  PaginationQueryParams,
} from './types';

export interface UsersQueryParams extends PaginationQueryParams {
  role?: string;
  status?: string;
}

export const usersApi = {
  getUsers: async (params?: UsersQueryParams) => {
    return api.get<User[]>('/users', params as Record<string, unknown>);
  },

  getUser: async (id: string) => {
    return api.get<User>(`/users/${id}`);
  },

  createUser: async (data: CreateUserDto) => {
    return api.post<User, CreateUserDto>('/users', data);
  },

  updateUser: async (id: string, data: UpdateUserDto) => {
    return api.patch<User, UpdateUserDto>(`/users/${id}`, data);
  },

  deleteUser: async (id: string) => {
    return api.delete<{ message: string }>(`/users/${id}`);
  },

  blockUser: async (id: string) => {
    return api.patch<User>(`/users/${id}/block`);
  },

  unblockUser: async (id: string) => {
    return api.patch<User>(`/users/${id}/unblock`);
  },
};

