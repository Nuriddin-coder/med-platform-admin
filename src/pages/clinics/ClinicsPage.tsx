import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit2,
  Trash2,
  Star,
  Building2,
  Clock,
  UserPlus,
  Eye,
  MapPin,
  Phone,
  Mail,
  Stethoscope,
  UserMinus,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { clinicsApi } from '@/api/clinics';
import { doctorsApi } from '@/api/doctors';
import type { Clinic } from '@/api/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Select } from '@/components/common/Select';
import { Spinner } from '@/components/common/Spinner';
import { formatDayOfWeek, formatPrice } from '@/utils/formatters';
import { useAuth } from '@/store/authStore';
import { Role } from '@/constants/enums';

export const ClinicsPage: React.FC = () => {
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
    city: '',
  });

  const [deletingClinic, setDeletingClinic] = useState<Clinic | null>(null);
  const [viewingClinicId, setViewingClinicId] = useState<string | null>(null);
  const [managingDoctorsClinic, setManagingDoctorsClinic] = useState<Clinic | null>(null);
  const [selectedDoctorToAssign, setSelectedDoctorToAssign] = useState<string>('');

  // Clinics list query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['clinics', params],
    queryFn: async () => {
      const q: Record<string, unknown> = {
        page: params.page,
        limit: params.limit,
      };
      if (params.search) q.search = params.search;
      if (params.sortBy) q.sortBy = params.sortBy;
      if (params.sortOrder) q.sortOrder = params.sortOrder;
      if (params.city) q.city = params.city;

      return clinicsApi.getClinics(q);
    },
  });

  // Single clinic detail query (when viewing detail)
  const { data: clinicDetailData, isLoading: detailLoading } = useQuery({
    queryKey: ['clinic-detail', viewingClinicId],
    queryFn: () => (viewingClinicId ? clinicsApi.getClinic(viewingClinicId) : null),
    enabled: !!viewingClinicId,
  });

  // All doctors for assignment and clinic team view
  const { data: allDoctorsData, isLoading: doctorsLoading } = useQuery({
    queryKey: ['all-doctors-for-assignment'],
    queryFn: () => doctorsApi.getDoctors({ limit: 100 }),
    enabled: !!managingDoctorsClinic,
  });

  // Doctors belonging to this clinic
  const clinicAssignedDoctors = (allDoctorsData?.data || []).filter((d) =>
    d.clinics?.some((c) => c.id === managingDoctorsClinic?.id)
  );

  // Doctors NOT in this clinic yet (available to assign)
  const availableDoctorsToAssign = (allDoctorsData?.data || []).filter(
    (doc) => !doc.clinics?.some((c) => c.id === managingDoctorsClinic?.id)
  );

  const doctorOptions = availableDoctorsToAssign.map((d) => ({
    value: d.id,
    label: `Dr. ${d.firstName} ${d.lastName}`,
    sublabel: `${d.specialization?.name || 'Mutaxassis'} • ${d.experienceYears ? `${d.experienceYears} yil tajriba` : "0 yil tajriba"} • ${formatPrice(d.consultationPrice)}`,
  }));

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return clinicsApi.deleteClinic(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinics'] });
      toast.success("Klinika o'chirildi");
      setDeletingClinic(null);
    },
    onError: (err) => {
      toast.error("O'chirishda xatolik yuz berdi");
      console.error(err);
    },
  });

  // Add doctor to clinic
  const addDoctorMutation = useMutation({
    mutationFn: async ({ clinicId, doctorId }: { clinicId: string; doctorId: string }) => {
      return clinicsApi.addDoctor(clinicId, doctorId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-doctors-for-assignment'] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      queryClient.invalidateQueries({ queryKey: ['clinics'] });
      toast.success("Shifokor klinikaga muvaffaqiyatli biriktirildi");
      setSelectedDoctorToAssign('');
    },
    onError: (err) => {
      toast.error("Biriktirishda xatolik yuz berdi");
      console.error(err);
    },
  });

  // Remove doctor from clinic
  const removeDoctorMutation = useMutation({
    mutationFn: async ({ clinicId, doctorId }: { clinicId: string; doctorId: string }) => {
      return clinicsApi.removeDoctor(clinicId, doctorId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-doctors-for-assignment'] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      queryClient.invalidateQueries({ queryKey: ['clinics'] });
      toast.success("Shifokor klinikadan ajratildi");
    },
    onError: (err) => {
      toast.error("Ajratishda xatolik yuz berdi");
      console.error(err);
    },
  });

  const columns: Column<Clinic>[] = [
    {
      key: 'name',
      header: 'Klinika',
      render: (c) => (
        <div className="flex items-center gap-3">
          {c.logoUrl ? (
            <img
              src={c.logoUrl.startsWith('http') ? c.logoUrl : `http://localhost:4000${c.logoUrl}`}
              alt={c.name}
              className="w-10 h-10 rounded-2xl object-cover border border-slate-200/80 shadow-xs"
            />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-400 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="font-semibold text-slate-900">{c.name}</div>
            <div className="text-xs text-slate-400">
              {c.city}, {c.address}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Aloqa',
      render: (c) => (
        <div>
          <div className="text-xs text-slate-800 font-medium">{c.phone}</div>
          <div className="text-[11px] text-slate-400">{c.email || '-'}</div>
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Reyting',
      sortable: true,
      render: (c) => (
        <div className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{c.rating ? c.rating.toFixed(1) : '0.0'}</span>
          <span className="text-[10px] text-slate-400">({c.reviewsCount || 0})</span>
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Holati',
      render: (c) => (
        <Badge variant={c.isActive ? 'success' : 'danger'} dot>
          {c.isActive ? 'Faol' : 'Nofaol'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Amallar',
      className: 'text-right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setViewingClinicId(c.id)}
            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition"
            title="Tafsilotlar"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setManagingDoctorsClinic(c);
              setSelectedDoctorToAssign('');
            }}
            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition"
            title="Klinika shifokorlari"
          >
            <Users className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => navigate(`/clinics/${c.id}/edit`)}
            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition"
            title="Tahrirlash"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {isSuperOrAdmin && (
            <button
              type="button"
              onClick={() => setDeletingClinic(c)}
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Klinikalar</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tibbiy markazlar katalogi, haftalik ish tartibi, shifokorlar va xizmatlar boshqaruvi
          </p>
        </div>

        {isSuperOrAdmin && (
          <button
            type="button"
            onClick={() => navigate('/clinics/new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-xs transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            Yangi klinika
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
        onRowClick={(c) => setViewingClinicId((c as unknown as Clinic).id)}
      />

      {/* ======================================================== */}
      {/* MANAGE CLINIC DOCTORS MODAL (IDEAL DESIGN)               */}
      {/* ======================================================== */}
      <Modal
        isOpen={!!managingDoctorsClinic}
        onClose={() => setManagingDoctorsClinic(null)}
        title="Klinika shifokorlari jamoasi"
        description="Klinikada faoliyat yurituvchi shifokorlar tarkibi va yangi mutaxassislarni biriktirish"
        icon={<Stethoscope className="w-5 h-5 text-teal-600" />}
        maxWidth="3xl"
      >
        <div className="space-y-6">
          {/* Clinic Banner Card */}
          {managingDoctorsClinic && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-teal-50/80 via-emerald-50/30 to-slate-50 border border-teal-100 shadow-xs">
              <div className="flex items-center gap-4">
                {managingDoctorsClinic.logoUrl ? (
                  <img
                    src={
                      managingDoctorsClinic.logoUrl.startsWith('http')
                        ? managingDoctorsClinic.logoUrl
                        : `http://localhost:4000${managingDoctorsClinic.logoUrl}`
                    }
                    alt={managingDoctorsClinic.name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white border border-slate-200/80 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                    <Building2 className="w-7 h-7" />
                  </div>
                )}
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    {managingDoctorsClinic.name}
                  </h4>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-teal-600" />
                      {managingDoctorsClinic.city}, {managingDoctorsClinic.address}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {managingDoctorsClinic.phone}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="px-4 py-2 rounded-xl bg-white border border-teal-100/80 shadow-xs text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Biriktirilgan jamoa
                  </span>
                  <span className="text-base font-extrabold text-teal-700">
                    {clinicAssignedDoctors.length} nafar shifokor
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Doctor Assignment Card */}
          <div className="p-4.5 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-teal-100/70 text-teal-700 flex items-center justify-center shadow-xs">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Yangi shifokorni biriktirish
                </h5>
                <p className="text-[11px] text-slate-500">
                  Tizimdagi mutaxassisni tanlang va klinika ish jadvaliga qo'shing
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <div className="w-full sm:flex-1">
                <Select
                  placeholder="Shifokorni tanlang..."
                  options={doctorOptions}
                  value={selectedDoctorToAssign}
                  onChange={(val) => setSelectedDoctorToAssign(val)}
                  disabled={availableDoctorsToAssign.length === 0}
                />
              </div>

              <button
                type="button"
                disabled={!selectedDoctorToAssign || addDoctorMutation.isPending}
                onClick={() =>
                  managingDoctorsClinic &&
                  addDoctorMutation.mutate({
                    clinicId: managingDoctorsClinic.id,
                    doctorId: selectedDoctorToAssign,
                  })
                }
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all duration-200 active:scale-[0.98] disabled:opacity-50 shrink-0"
              >
                {addDoctorMutation.isPending ? (
                  <Spinner size="sm" className="border-t-white" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Klinikaga biriktirish
              </button>
            </div>

            {availableDoctorsToAssign.length === 0 && (
              <p className="text-[11px] text-amber-600 pt-1 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Barcha mavjud shifokorlar allaqachon ushbu klinikaga biriktirilgan
              </p>
            )}
          </div>

          {/* List of currently assigned doctors (Premium Team List) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                Klinikada faoliyat yurituvchi shifokorlar
                <span className="text-[11px] font-semibold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-full">
                  {clinicAssignedDoctors.length}
                </span>
              </h5>
            </div>

            {doctorsLoading ? (
              <div className="py-12 flex justify-center">
                <Spinner size="md" label="Shifokorlar ro'yxati yuklanmoqda..." />
              </div>
            ) : clinicAssignedDoctors.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                {clinicAssignedDoctors.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-teal-300 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="relative shrink-0">
                        {doc.avatarUrl ? (
                          <img
                            src={
                              doc.avatarUrl.startsWith('http')
                                ? doc.avatarUrl
                                : `http://localhost:4000${doc.avatarUrl}`
                            }
                            alt={doc.firstName}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-xs"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                            {doc.firstName?.[0]}
                            {doc.lastName?.[0]}
                          </div>
                        )}
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                      </div>

                      <div className="min-w-0">
                        <h6 className="text-xs font-bold text-slate-900 truncate">
                          Dr. {doc.firstName} {doc.lastName}
                        </h6>
                        <span className="inline-block mt-0.5 text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md truncate max-w-full">
                          {doc.specialization?.name || 'Mutaxassis'}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                          {doc.experienceYears ? `${doc.experienceYears} yil` : '0 yil'} tajriba •{' '}
                          <span className="text-slate-700 font-semibold">
                            {formatPrice(doc.consultationPrice)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={removeDoctorMutation.isPending}
                      onClick={() =>
                        managingDoctorsClinic &&
                        removeDoctorMutation.mutate({
                          clinicId: managingDoctorsClinic.id,
                          doctorId: doc.id,
                        })
                      }
                      className="w-8 h-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition duration-150 shrink-0 flex items-center justify-center focus:outline-none"
                      title="Klinikadan ajratish"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 px-6 text-center rounded-3xl border-2 border-dashed border-teal-200/70 bg-gradient-to-b from-teal-50/40 to-slate-50/50 flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-teal-100/70 text-teal-700 flex items-center justify-center mb-3 shadow-inner">
                  <Stethoscope className="w-7 h-7" />
                </div>
                <h6 className="text-sm font-bold text-slate-800">
                  Hozircha birorta shifokor biriktirilmagan
                </h6>
                <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                  Ushbu klinikada faoliyat yuritishi uchun yuqoridagi ro'yxatdan kerakli shifokorni
                  tanlab <span className="font-semibold text-teal-700">"Klinikaga biriktirish"</span>{' '}
                  tugmasini bosing.
                </p>
              </div>
            )}
          </div>

          {/* Sticky Modal Footer */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-4 pb-1 border-t border-slate-100 flex items-center justify-end z-10">
            <button
              type="button"
              onClick={() => setManagingDoctorsClinic(null)}
              className="px-5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition"
            >
              Yopish
            </button>
          </div>
        </div>
      </Modal>

      {/* ======================================================== */}
      {/* VIEW DETAIL CLINIC MODAL                                 */}
      {/* ======================================================== */}
      <Modal
        isOpen={!!viewingClinicId}
        onClose={() => setViewingClinicId(null)}
        title="Klinika ma'lumotlari"
        description="Klinika tafsilotlari, xizmatlari va ish jadvali"
        icon={<Eye className="w-5 h-5 text-brand-600" />}
        maxWidth="2xl"
      >
        {detailLoading ? (
          <div className="p-8 flex justify-center">
            <Spinner size="md" />
          </div>
        ) : clinicDetailData?.data ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4.5 rounded-2xl bg-gradient-to-r from-teal-50/70 to-slate-50 border border-teal-100/70">
              {clinicDetailData.data.logoUrl ? (
                <img
                  src={
                    clinicDetailData.data.logoUrl.startsWith('http')
                      ? clinicDetailData.data.logoUrl
                      : `http://localhost:4000${clinicDetailData.data.logoUrl}`
                  }
                  alt={clinicDetailData.data.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-white shadow-xs shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Building2 className="w-7 h-7" />
                </div>
              )}
              <div>
                <h3 className="text-base font-bold text-slate-900">{clinicDetailData.data.name}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  {clinicDetailData.data.city}, {clinicDetailData.data.address}
                </p>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {clinicDetailData.data.phone}
                  </span>
                  {clinicDetailData.data.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" /> {clinicDetailData.data.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {clinicDetailData.data.description && (
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Klinika haqida
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {clinicDetailData.data.description}
                </p>
              </div>
            )}

            {/* Working Hours */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-600" /> Ish tartibi
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {(clinicDetailData.data.workingHours || []).map((w) => (
                  <div
                    key={w.dayOfWeek}
                    className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <span className="font-semibold text-slate-700">{formatDayOfWeek(w.dayOfWeek)}</span>
                    <span
                      className={
                        w.isClosed
                          ? 'text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded'
                          : 'text-slate-800 font-medium'
                      }
                    >
                      {w.isClosed ? 'Dam olish kuni' : `${w.openTime} - ${w.closeTime}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                <span>Xizmatlar ({clinicDetailData.data.services?.length || 0})</span>
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {clinicDetailData.data.services && clinicDetailData.data.services.length > 0 ? (
                  clinicDetailData.data.services.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs border border-slate-100"
                    >
                      <span className="font-medium text-slate-800">{s.name}</span>
                      <span className="font-bold text-slate-900">
                        {new Intl.NumberFormat('uz-UZ').format(s.price)} so'm
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-2">Xizmatlar mavjud emas</p>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-3 pb-1 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingClinicId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Yopish
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={!!deletingClinic}
        onClose={() => setDeletingClinic(null)}
        onConfirm={() => deletingClinic && deleteMutation.mutate(deletingClinic.id)}
        isLoading={deleteMutation.isPending}
        title="Klinikani o'chirish"
        message={`Haqiqatan ham "${deletingClinic?.name}" klinikasini o'chirmoqchimisiz?`}
        confirmText="O'chirish"
        variant="danger"
      />
    </div>
  );
};
