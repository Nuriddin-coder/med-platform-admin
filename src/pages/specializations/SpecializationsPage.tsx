import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { specializationsApi } from '@/api/specializations';
import type { Specialization } from '@/api/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { Badge } from '@/components/common/Badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Select } from '@/components/common/Select';

export const SpecializationsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [params, setParams] = useState<{
    page: number;
    limit: number;
    search: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    isActive?: boolean;
  }>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
    isActive: undefined,
  });

  const [deletingItem, setDeletingItem] = useState<Specialization | null>(null);

  // Specializations query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['specializations', params],
    queryFn: async () => {
      const q: Record<string, unknown> = {
        page: params.page,
        limit: params.limit,
      };
      if (params.search) q.search = params.search;
      if (params.sortBy) q.sortBy = params.sortBy;
      if (params.sortOrder) q.sortOrder = params.sortOrder;
      if (params.isActive !== undefined) q.isActive = params.isActive;

      return specializationsApi.getSpecializations(q);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return specializationsApi.deleteSpecialization(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specializations'] });
      toast.success("Mutaxassislik o'chirildi");
      setDeletingItem(null);
    },
    onError: (err) => {
      toast.error("O'chirishda xatolik yuz berdi");
      console.error(err);
    },
  });

  const columns: Column<Specialization>[] = [
    {
      key: 'name',
      header: 'Mutaxassislik',
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-3">
          {s.iconUrl ? (
            <img src={s.iconUrl} alt={s.name} className="w-8 h-8 rounded-lg object-contain" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
              {s.name[0]}
            </div>
          )}
          <div>
            <div className="font-semibold text-slate-900">{s.name}</div>
            <div className="text-xs text-slate-400 font-mono">{s.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Tavsif',
      render: (s) => (
        <span className="text-xs text-slate-500 line-clamp-1 max-w-sm block">
          {s.description || '-'}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Holati',
      render: (s) => (
        <Badge variant={s.isActive ? 'success' : 'danger'} dot>
          {s.isActive ? 'Faol' : 'Nofaol'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Amallar',
      className: 'text-right',
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/specializations/${s.id}/edit`)}
            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
            title="Tahrirlash"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeletingItem(s)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Mutaxassisliklar
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tibbiy sohalar va mutaxassisliklar katalogi
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/specializations/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Yangi mutaxassislik
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
          <div className="w-44">
            <Select
              placeholder="Barcha holatlar"
              options={[
                { value: '', label: 'Barcha holatlar' },
                { value: 'true', label: 'Faqat faol' },
                { value: 'false', label: 'Faqat nofaol' },
              ]}
              value={params.isActive === undefined ? '' : String(params.isActive)}
              onChange={(val) =>
                setParams((p) => ({
                  ...p,
                  isActive: val === '' ? undefined : val === 'true',
                  page: 1,
                }))
              }
            />
          </div>
        }
      />

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => deletingItem && deleteMutation.mutate(deletingItem.id)}
        isLoading={deleteMutation.isPending}
        title="Mutaxassislikni o'chirish"
        message={`Haqiqatan ham "${deletingItem?.name}" mutaxassisligini o'chirmoqchimisiz?`}
        confirmText="O'chirish"
        variant="danger"
      />
    </div>
  );
};
