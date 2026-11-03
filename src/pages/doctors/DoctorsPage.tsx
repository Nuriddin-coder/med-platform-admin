import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit2,
  Trash2,
  Star,
  Building2,
  Link as LinkIcon,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { doctorsApi } from '@/api/doctors';
import { specializationsApi } from '@/api/specializations';
import { clinicsApi } from '@/api/clinics';
import type { Doctor } from '@/api/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Select } from '@/components/common/Select';
import { Spinner } from '@/components/common/Spinner';
import { formatPrice } from '@/utils/formatters';
import { useAuth } from '@/store/authStore';
import { Role } from '@/constants/enums';

export const DoctorsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSuperOrAdmin = user?.role === Role.SUPER_ADMIN || user?.role === Role.ADMIN;

  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
    specializationId: '',
    clinicId: '',
  });

  const [deletingDoctor, setDeletingDoctor] = useState<Doctor | null>(null);
  const [managingClinicsDoctor, setManagingClinicsDoctor] = useState<Doctor | null>(null);
  const [selectedClinicToAssign, setSelectedClinicToAssign] = useState<string>('');

  // Fetch specializations for filter
  const { data: specData } = useQuery({
    queryKey: ['specializations-options'],
    queryFn: () => specializationsApi.getSpecializations({ limit: 100 }),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch clinics for filter
  const { data: clinicsData } = useQuery({
    queryKey: ['clinics-options'],
    queryFn: () => clinicsApi.getClinics({ limit: 100 }),
    staleTime: 1000 * 60 * 5,
  });

  const specializationOptions = (specData?.data || []).map((s) => ({
    value: s.id,
    label: s.name,
    sublabel: s.description || undefined,
  }));

  const clinicOptions = (clinicsData?.data || []).map((c) => ({
    value: c.id,
    label: c.name,
    sublabel: `${c.city}, ${c.address}`,
  }));

  // Doctors list query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['doctors', params],
    queryFn: async () => {
      const q: Record<string, unknown> = {
        page: params.page,
        limit: params.limit,
      };
      if (params.search) q.search = params.search;
      if (params.sortBy) q.sortBy = params.sortBy;
      if (params.sortOrder) q.sortOrder = params.sortOrder;
      if (params.specializationId) q.specializationId = params.specializationId;
      if (params.clinicId) q.clinicId = params.clinicId;

      return doctorsApi.getDoctors(q);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return doctorsApi.deleteDoctor(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      toast.success("Shifokor o'chirildi");
      setDeletingDoctor(null);
    },
    onError: (err) => {
      toast.error("O'chirishda xatolik yuz berdi");
      console.error(err);
    },
  });

  // Assign doctor to clinic mutation
  const assignClinicMutation = useMutation({
    mutationFn: async ({ clinicId, doctorId }: { clinicId: string; doctorId: string }) => {
      return clinicsApi.addDoctor(clinicId, doctorId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      toast.success("Shifokor klinikaga muvaffaqiyatli biriktirildi");
      setSelectedClinicToAssign('');
      setManagingClinicsDoctor(null);
    },
    onError: (err) => {
      toast.error("Klinikaga biriktirishda xatolik yuz berdi");
      console.error(err);
    },
  });

  // Remove doctor from clinic mutation
  const removeClinicMutation = useMutation({
    mutationFn: async ({ clinicId, doctorId }: { clinicId: string; doctorId: string }) => {
      return clinicsApi.removeDoctor(clinicId, doctorId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      toast.success("Shifokor klinikadan ajratildi");
      setManagingClinicsDoctor(null);
    },
    onError: (err) => {
      toast.error("Ajratishda xatolik yuz berdi");
      console.error(err);
    },
  });

  const columns: Column<Doctor>[] = [
    {
      key: 'name',
      header: 'Shifokor',
      render: (d) => (
        <div className="flex items-center gap-3">
          {d.avatarUrl ? (
            <img
              src={d.avatarUrl.startsWith('http') ? d.avatarUrl : `http://localhost:4000${d.avatarUrl}`}
              alt={d.firstName}
              className="w-10 h-10 rounded-2xl object-cover border border-slate-200/80 shadow-xs"
            />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {d.firstName?.[0]}
              {d.lastName?.[0]}
            </div>
          )}
          <div>
            <div className="font-semibold text-slate-900">
              Dr. {d.firstName} {d.lastName}
            </div>
            <div className="text-xs text-brand-600 font-medium">
              {d.specialization?.name || 'Mutaxassis'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'clinics',
      header: 'Klinikalar',
      render: (d) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {d.clinics && d.clinics.length > 0 ? (
            d.clinics.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
              >
                <Building2 className="w-3 h-3 text-slate-400" />
                {c.name}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">Klinikasi yo'q</span>
          )}
        </div>
      ),
    },
    {
      key: 'experienceYears',
      header: 'Tajriba',
      sortable: true,
      render: (d) => (
        <span className="text-xs text-slate-700 font-medium">
          {d.experienceYears ? `${d.experienceYears} yil` : '-'}
        </span>
      ),
    },
    {
      key: 'consultationPrice',
      header: 'Qabul narxi',
      sortable: true,
      render: (d) => (
        <span className="text-xs font-semibold text-slate-900">
          {formatPrice(d.consultationPrice)}
        </span>
      ),
    },
    {
      key: 'rating',
      header: 'Reyting',
      sortable: true,
      render: (d) => (
        <div className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{d.rating ? d.rating.toFixed(1) : '0.0'}</span>
          <span className="text-[10px] text-slate-400">({d.reviewsCount || 0})</span>
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Holati',
      render: (d) => (
        <Badge variant={d.isActive ? 'success' : 'danger'} dot>
          {d.isActive ? 'Faol' : 'Nofaol'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Amallar',
      className: 'text-right',
      render: (d) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              setManagingClinicsDoctor(d);
              setSelectedClinicToAssign('');
            }}
            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition"
            title="Klinikalarga biriktirish"
          >
            <LinkIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => navigate(`/doctors/${d.id}/edit`)}
            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition"
            title="Tahrirlash"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {isSuperOrAdmin && (
            <button
              type="button"
              onClick={() => setDeletingDoctor(d)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
              title="O'chirish"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Shifokorlar</h1>
          <p className="mt-1 text-sm text-slate-500">
            Platformada faoliyat yuritayotgan shifokorlar ro'yxati, mutaxassisliklari va qabul narxlari
          </p>
        </div>

        {isSuperOrAdmin && (
          <button
            type="button"
            onClick={() => navigate('/doctors/new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-xs transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            Yangi shifokor
          </button>
        )}
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
            <div className="w-52">
              <Select
                placeholder="Barcha mutaxassisliklar"
                options={[{ value: '', label: 'Barcha mutaxassisliklar' }, ...specializationOptions]}
                value={params.specializationId}
                onChange={(val) => setParams((p) => ({ ...p, specializationId: val, page: 1 }))}
              />
            </div>

            <div className="w-52">
              <Select
                placeholder="Barcha klinikalar"
                options={[{ value: '', label: 'Barcha klinikalar' }, ...clinicOptions]}
                value={params.clinicId}
                onChange={(val) => setParams((p) => ({ ...p, clinicId: val, page: 1 }))}
              />
            </div>
          </div>
        }
      />

      {/* MANAGE CLINICS MODAL */}
      <Modal
        isOpen={!!managingClinicsDoctor}
        onClose={() => setManagingClinicsDoctor(null)}
        title="Klinikalarga biriktirish"
        description={`Dr. ${managingClinicsDoctor?.firstName} ${managingClinicsDoctor?.lastName} ishlaydigan tibbiyot markazlari`}
        icon={<Building2 className="w-5 h-5 text-teal-600" />}
        maxWidth="2xl"
      >
        <div className="space-y-6">
          {/* Doctor Hero Card */}
          {managingClinicsDoctor && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-teal-50/80 via-emerald-50/30 to-slate-50 border border-teal-100 shadow-xs">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  {managingClinicsDoctor.avatarUrl ? (
                    <img
                      src={
                        managingClinicsDoctor.avatarUrl.startsWith('http')
                          ? managingClinicsDoctor.avatarUrl
                          : `http://localhost:4000${managingClinicsDoctor.avatarUrl}`
                      }
                      alt={managingClinicsDoctor.firstName}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white border border-slate-200/80 shadow-xs"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center font-bold text-base shadow-xs">
                      {managingClinicsDoctor.firstName?.[0]}
                      {managingClinicsDoctor.lastName?.[0]}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>

                <div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    Dr. {managingClinicsDoctor.firstName} {managingClinicsDoctor.lastName}
                  </h4>
                  <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-lg">
                      {managingClinicsDoctor.specialization?.name || 'Mutaxassis'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {managingClinicsDoctor.experienceYears || 0} yil tajriba
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="px-4 py-2 rounded-xl bg-white border border-teal-100/80 shadow-xs text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Faoliyat joylari
                  </span>
                  <span className="text-base font-extrabold text-teal-700">
                    {managingClinicsDoctor.clinics?.length || 0} ta klinika
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Assign Clinic Card */}
          <div className="p-4.5 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-teal-100/70 text-teal-700 flex items-center justify-center shadow-xs">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Yangi klinikaga biriktirish
                </h5>
                <p className="text-[11px] text-slate-500">
                  Shifokor qabul o'tkazadigan yangi tibbiyot markazini belgilang
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <div className="w-full sm:flex-1">
                <Select
                  placeholder="Klinikani tanlang..."
                  options={clinicOptions.filter(
                    (opt) => !managingClinicsDoctor?.clinics?.some((c) => c.id === opt.value)
                  )}
                  value={selectedClinicToAssign}
                  onChange={(val) => setSelectedClinicToAssign(val)}
                />
              </div>

              <button
                type="button"
                disabled={!selectedClinicToAssign || assignClinicMutation.isPending}
                onClick={() =>
                  managingClinicsDoctor &&
                  assignClinicMutation.mutate({
                    clinicId: selectedClinicToAssign,
                    doctorId: managingClinicsDoctor.id,
                  })
                }
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all duration-200 active:scale-[0.98] disabled:opacity-50 shrink-0"
              >
                {assignClinicMutation.isPending ? (
                  <Spinner size="sm" className="border-t-white" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Biriktirish
              </button>
            </div>
          </div>

          {/* Currently Assigned Clinics */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2 px-1">
              <Building2 className="w-4 h-4 text-slate-400" />
              Biriktirilgan klinikalar ro'yxati
              <span className="text-[11px] font-semibold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-full">
                {managingClinicsDoctor?.clinics?.length || 0}
              </span>
            </h5>

            {managingClinicsDoctor?.clinics && managingClinicsDoctor.clinics.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                {managingClinicsDoctor.clinics.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-teal-300 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h6 className="text-xs font-bold text-slate-900 truncate">{c.name}</h6>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {c.city}, {c.address}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={removeClinicMutation.isPending}
                      onClick={() =>
                        managingClinicsDoctor &&
                        removeClinicMutation.mutate({
                          clinicId: c.id,
                          doctorId: managingClinicsDoctor.id,
                        })
                      }
                      className="w-8 h-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition duration-150 shrink-0 flex items-center justify-center focus:outline-none"
                      title="Klinikadan ajratish"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 px-6 text-center rounded-3xl border-2 border-dashed border-teal-200/70 bg-gradient-to-b from-teal-50/40 to-slate-50/50 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-teal-100/70 text-teal-700 flex items-center justify-center mb-2.5 shadow-inner">
                  <Building2 className="w-6 h-6" />
                </div>
                <h6 className="text-sm font-bold text-slate-800">
                  Ushbu shifokor hech qaysi klinikaga biriktirilmagan
                </h6>
                <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                  Shifokorni kerakli tibbiyot markaziga biriktirish uchun yuqoridagi ro'yxatdan
                  klinikani tanlab "Biriktirish" tugmasini bosing.
                </p>
              </div>
            )}
          </div>

          {/* Sticky Modal Footer */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-4 pb-1 border-t border-slate-100 flex items-center justify-end z-10">
            <button
              type="button"
              onClick={() => setManagingClinicsDoctor(null)}
              className="px-5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition"
            >
              Yopish
            </button>
          </div>
        </div>
      </Modal>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={!!deletingDoctor}
        onClose={() => setDeletingDoctor(null)}
        onConfirm={() => deletingDoctor && deleteMutation.mutate(deletingDoctor.id)}
        isLoading={deleteMutation.isPending}
        title="Shifokorni o'chirish"
        message={`Haqiqatan ham "Dr. ${deletingDoctor?.firstName} ${deletingDoctor?.lastName}" profilini o'chirmoqchimisiz?`}
        confirmText="O'chirish"
        variant="danger"
      />
    </div>
  );
};
