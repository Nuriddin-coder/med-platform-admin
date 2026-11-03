import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { servicesApi } from '@/api/services';
import { clinicsApi } from '@/api/clinics';
import type { Service, PaginationMeta } from '@/api/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { Badge } from '@/components/common/Badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Select } from '@/components/common/Select';
import { formatPrice } from '@/utils/formatters';

export const ServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'name',
    sortOrder: 'asc' as 'asc' | 'desc',
    clinicId: '',
  });

  const [deletingItem, setDeletingItem] = useState<Service | null>(null);

  // Fetch clinics for filter
  const { data: clinicsData } = useQuery({
    queryKey: ['clinics-options-for-services'],
    queryFn: () => clinicsApi.getClinics({ limit: 100 }),
    staleTime: 1000 * 60 * 5,
  });

  const clinicOptions = (clinicsData?.data || []).map((c) => ({
    value: c.id,
    label: `${c.name} (${c.city})`,
  }));

  // Services list query:
  // CONTRACT 103: GET /services (query: clinicId only)
  // Backend strictly forbids any non-whitelisted params like page, limit, search, sortBy
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['services', params.clinicId],
    queryFn: async () => {
      return servicesApi.getServices({
        clinicId: params.clinicId || undefined,
      });
    },
  });

  // Client-side search and sorting over the backend services array
  const rawList = data?.data || [];

  const filteredAndSorted = useMemo(() => {
    let list = [...rawList];

    // Search filter (name or description)
    if (params.search.trim()) {
      const term = params.search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          (s.description && s.description.toLowerCase().includes(term))
      );
    }

    // Sort
    if (params.sortBy) {
      list.sort((a, b) => {
        let valA = a[params.sortBy as keyof Service];
        let valB = b[params.sortBy as keyof Service];

        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

        if (typeof valA === 'number' && typeof valB === 'number') {
          return params.sortOrder === 'asc' ? valA - valB : valB - valA;
        }

        return params.sortOrder === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return list;
  }, [rawList, params.search, params.sortBy, params.sortOrder]);

  // Client-side pagination
  const total = filteredAndSorted.length;
  const limit = params.limit;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(params.page, totalPages);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return filteredAndSorted.slice(start, start + limit);
  }, [filteredAndSorted, currentPage, limit]);

  const meta: PaginationMeta = {
    page: currentPage,
    limit,
    total,
    totalPages,
  };

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return servicesApi.deleteService(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success("Xizmat o'chirildi");
      setDeletingItem(null);
    },
    onError: (err) => {
      toast.error("O'chirishda xatolik yuz berdi");
      console.error(err);
    },
  });

  const columns: Column<Service>[] = [
    {
      key: 'name',
      header: 'Xizmat nomi',
      sortable: true,
      render: (s) => (
        <div>
          <div className="font-semibold text-slate-900">{s.name}</div>
          <div className="text-xs text-slate-400 line-clamp-1">{s.description || '-'}</div>
        </div>
      ),
    },
    {
      key: 'clinic',
      header: 'Klinika',
      render: (s) => (
        <span className="text-xs text-slate-700 font-medium">
          {clinicsData?.data?.find((c) => c.id === s.clinicId)?.name || s.clinicId || '-'}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Narxi',
      sortable: true,
      render: (s) => (
        <span className="text-xs font-semibold text-slate-900">
          {formatPrice(s.price)}
        </span>
      ),
    },
    {
      key: 'durationMinutes',
      header: 'Davomiyligi',
      sortable: true,
      render: (s) => (
        <span className="text-xs text-slate-600">
          {s.durationMinutes} daqiqa
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
            onClick={() => navigate(`/services/${s.id}/edit`)}
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Xizmatlar</h1>
          <p className="mt-1 text-sm text-slate-500">
            Klinikalar tomonidan ko'rsatiladigan tibbiy xizmatlar, narxlar va davomiyligi
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/services/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Yangi xizmat
        </button>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        data={paginatedData as unknown as Record<string, unknown>[]}
        meta={meta}
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
          <div className="w-60">
            <Select
              placeholder="Barcha klinikalar"
              options={[{ value: '', label: 'Barcha klinikalar' }, ...clinicOptions]}
              value={params.clinicId}
              onChange={(val) => setParams((p) => ({ ...p, clinicId: val, page: 1 }))}
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
        title="Xizmatni o'chirish"
        message={`Haqiqatan ham "${deletingItem?.name}" xizmatini o'chirmoqchimisiz?`}
        confirmText="O'chirish"
        variant="danger"
      />
    </div>
  );
};
