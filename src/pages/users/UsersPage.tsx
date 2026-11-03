import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit2,
  Trash2,
  Lock,
  Unlock,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { usersApi } from '@/api/users';
import type { User } from '@/api/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/Badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Select } from '@/components/common/Select';
import { Role, UserStatus } from '@/constants/enums';
import { formatDateTime } from '@/utils/formatters';

const roleOptions = [
  { value: Role.SUPER_ADMIN, label: 'Super Admin' },
  { value: Role.ADMIN, label: 'Admin' },
  { value: Role.CLINIC_MANAGER, label: 'Klinika menejeri' },
  { value: Role.DOCTOR, label: 'Shifokor' },
  { value: Role.PATIENT, label: 'Bemor' },
];

const statusOptions = [
  { value: UserStatus.ACTIVE, label: 'Faol' },
  { value: UserStatus.PENDING_VERIFICATION, label: 'Kutilmoqda' },
  { value: UserStatus.BLOCKED, label: 'Bloklangan' },
];

export const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Search & Filter state
  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
    role: '',
    status: '',
  });

  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [blockingUser, setBlockingUser] = useState<{ user: User; action: 'block' | 'unblock' } | null>(null);

  // Users query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const q: Record<string, unknown> = {
        page: params.page,
        limit: params.limit,
      };
      if (params.search) q.search = params.search;
      if (params.sortBy) q.sortBy = params.sortBy;
      if (params.sortOrder) q.sortOrder = params.sortOrder;
      if (params.role) q.role = params.role;
      if (params.status) q.status = params.status;

      return usersApi.getUsers(q);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return usersApi.deleteUser(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Foydalanuvchi o'chirildi");
      setDeletingUser(null);
    },
    onError: (err) => {
      toast.error("O'chirishda xatolik yuz berdi");
      console.error(err);
    },
  });

  // Block/Unblock Mutation
  const toggleBlockMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'block' | 'unblock' }) => {
      if (action === 'block') {
        return usersApi.blockUser(id);
      } else {
        return usersApi.unblockUser(id);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(
        variables.action === 'block'
          ? "Foydalanuvchi bloklandi"
          : "Foydalanuvchi blokdan chiqarildi"
      );
      setBlockingUser(null);
    },
    onError: (err) => {
      toast.error("Amalni bajarishda xatolik yuz berdi");
      console.error(err);
    },
  });

  // Table Columns
  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Foydalanuvchi',
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
            {u.firstName?.[0]}
            {u.lastName?.[0]}
          </div>
          <div>
            <div className="font-semibold text-slate-900">
              {u.firstName} {u.lastName}
            </div>
            <div className="text-xs text-slate-400">{u.email || u.phone || '-'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Roli',
      sortable: true,
      render: (u) => <StatusBadge status={u.role} />,
    },
    {
      key: 'status',
      header: 'Holati',
      sortable: true,
      render: (u) => <StatusBadge status={u.status} />,
    },
    {
      key: 'createdAt',
      header: "Ro'yxatdan o'tgan",
      sortable: true,
      render: (u) => (
        <span className="text-xs text-slate-500">{formatDateTime(u.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Amallar',
      className: 'text-right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/users/${u.id}/edit`)}
            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition"
            title="Tahrirlash"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {u.status === UserStatus.BLOCKED ? (
            <button
              type="button"
              onClick={() => setBlockingUser({ user: u, action: 'unblock' })}
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition"
              title="Blokdan chiqarish"
            >
              <Unlock className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setBlockingUser({ user: u, action: 'block' })}
              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-xl transition"
              title="Bloklash"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setDeletingUser(u)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
            title="O'chirish"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Foydalanuvchilar</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tizimdagi barcha rolli foydalanuvchilar ro'yxati va ularni boshqarish
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/users/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Yangi foydalanuvchi
        </button>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        data={(data?.data || []) as unknown as Record<string, unknown>[]}
        meta={data?.meta}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        search={params.search}
        onSearchChange={(search) => setParams((p) => ({ ...p, search, page: 1 }))}
        sortBy={params.sortBy}
        sortOrder={params.sortOrder}
        onSortChange={(field) =>
          setParams((p) => ({
            ...p,
            sortBy: field,
            sortOrder: p.sortBy === field && p.sortOrder === 'asc' ? 'desc' : 'asc',
          }))
        }
        onPageChange={(page) => setParams((p) => ({ ...p, page }))}
        onLimitChange={(limit) => setParams((p) => ({ ...p, limit, page: 1 }))}
        filters={
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-44">
              <Select
                placeholder="Barcha rollar"
                options={[{ value: '', label: 'Barcha rollar' }, ...roleOptions]}
                value={params.role}
                onChange={(val) => setParams((p) => ({ ...p, role: val, page: 1 }))}
              />
            </div>

            <div className="w-44">
              <Select
                placeholder="Barcha holatlar"
                options={[{ value: '', label: 'Barcha holatlar' }, ...statusOptions]}
                value={params.status}
                onChange={(val) => setParams((p) => ({ ...p, status: val, page: 1 }))}
              />
            </div>
          </div>
        }
      />

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={() => deletingUser && deleteMutation.mutate(deletingUser.id)}
        isLoading={deleteMutation.isPending}
        title="Foydalanuvchini o'chirish"
        message={`Haqiqatan ham "${deletingUser?.firstName} ${deletingUser?.lastName}" hisobini o'chirmoqchimisiz? Ushbu amalni bekor qilib bo'lmaydi.`}
        confirmText="O'chirish"
        variant="danger"
      />

      {/* CONFIRM BLOCK/UNBLOCK DIALOG */}
      <ConfirmDialog
        isOpen={!!blockingUser}
        onClose={() => setBlockingUser(null)}
        onConfirm={() =>
          blockingUser &&
          toggleBlockMutation.mutate({
            id: blockingUser.user.id,
            action: blockingUser.action,
          })
        }
        isLoading={toggleBlockMutation.isPending}
        title={
          blockingUser?.action === 'block'
            ? "Foydalanuvchini bloklash"
            : "Foydalanuvchini blokdan chiqarish"
        }
        message={
          blockingUser?.action === 'block'
            ? `Haqiqatan ham "${blockingUser?.user.firstName} ${blockingUser?.user.lastName}" foydalanuvchisini bloklamoqchimisiz? U tizimga kira olmaydi.`
            : `Haqiqatan ham "${blockingUser?.user.firstName} ${blockingUser?.user.lastName}" foydalanuvchisini blokdan chiqarmoqchimisiz?`
        }
        confirmText={blockingUser?.action === 'block' ? "Bloklash" : "Blokdan chiqarish"}
        variant={blockingUser?.action === 'block' ? 'warning' : 'primary'}
      />
    </div>
  );
};
