import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Eye,
  Calendar,
  Clock,
  User,
  Building2,
  Stethoscope,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { appointmentsApi } from '@/api/appointments';
import { doctorsApi } from '@/api/doctors';
import { clinicsApi } from '@/api/clinics';
import type { Appointment } from '@/api/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { Select } from '@/components/common/Select';
import { Spinner } from '@/components/common/Spinner';
import { formatDate } from '@/utils/formatters';
import { AppointmentStatus, AppointmentStatusType } from '@/constants/enums';

export const AppointmentsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'appointmentDate',
    sortOrder: 'desc' as 'asc' | 'desc',
    status: '',
    doctorId: '',
    clinicId: '',
    dateFrom: '',
    dateTo: '',
  });

  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);
  const [updatingStatusAppointment, setUpdatingStatusAppointment] = useState<Appointment | null>(null);
  const [newStatus, setNewStatus] = useState<AppointmentStatusType>(AppointmentStatus.CONFIRMED);

  // Doctors for filter
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-filter-options'],
    queryFn: () => doctorsApi.getDoctors({ limit: 100 }),
    staleTime: 1000 * 60 * 5,
  });

  // Clinics for filter
  const { data: clinicsData } = useQuery({
    queryKey: ['clinics-filter-options'],
    queryFn: () => clinicsApi.getClinics({ limit: 100 }),
    staleTime: 1000 * 60 * 5,
  });

  const doctorOptions = [
    { value: '', label: 'Barcha shifokorlar' },
    ...(doctorsData?.data || []).map((d) => ({
      value: d.id,
      label: `Dr. ${d.firstName} ${d.lastName}`,
    })),
  ];

  const clinicOptions = [
    { value: '', label: 'Barcha klinikalar' },
    ...(clinicsData?.data || []).map((c) => ({
      value: c.id,
      label: c.name,
    })),
  ];

  const statusOptions = [
    { value: '', label: 'Barcha holatlar' },
    ...Object.values(AppointmentStatus).map((s) => ({
      value: s,
      label: s,
    })),
  ];

  // Appointments list query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['appointments', params],
    queryFn: async () => {
      const q: Record<string, unknown> = {
        page: params.page,
        limit: params.limit,
      };
      if (params.search) q.search = params.search;
      if (params.sortBy) q.sortBy = params.sortBy;
      if (params.sortOrder) q.sortOrder = params.sortOrder;
      if (params.status) q.status = params.status;
      if (params.doctorId) q.doctorId = params.doctorId;
      if (params.clinicId) q.clinicId = params.clinicId;
      if (params.dateFrom) q.dateFrom = params.dateFrom;
      if (params.dateTo) q.dateTo = params.dateTo;

      return appointmentsApi.getAppointments(q);
    },
  });

  // Update Status Mutation
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatusType }) => {
      return appointmentsApi.updateStatus(id, status);
    },
    onSuccess: (updatedRes) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success("Qabul holati muvaffaqiyatli o'zgartirildi");
      setUpdatingStatusAppointment(null);
      if (viewingAppointment?.id === updatedRes.data?.id) {
        setViewingAppointment(updatedRes.data);
      }
    },
    onError: () => {
      toast.error("Holatni o'zgartirishda xatolik yuz berdi");
    },
  });

  const columns: Column<Appointment>[] = [
    {
      key: 'appointmentDate',
      header: 'Sana va vaqt',
      sortable: true,
      render: (a) => (
        <div>
          <div className="font-semibold text-slate-900">{formatDate(a.appointmentDate)}</div>
          <div className="text-xs text-brand-600 font-medium flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3" />
            {a.startTime} - {a.endTime}
          </div>
        </div>
      ),
    },
    {
      key: 'patient',
      header: 'Bemor',
      render: (a) => (
        <div>
          <div className="font-semibold text-slate-800">
            {a.patient?.firstName} {a.patient?.lastName}
          </div>
          <div className="text-xs text-slate-400">{a.patient?.phone || '-'}</div>
        </div>
      ),
    },
    {
      key: 'doctor',
      header: 'Shifokor',
      render: (a) => (
        <div>
          <div className="font-medium text-slate-800">
            Dr. {a.doctor?.firstName} {a.doctor?.lastName}
          </div>
          <div className="text-xs text-slate-400">{a.doctor?.specialization?.name || '-'}</div>
        </div>
      ),
    },
    {
      key: 'clinic',
      header: 'Klinika',
      render: (a) => <span className="text-xs font-medium text-slate-600">{a.clinic?.name}</span>,
    },
    {
      key: 'status',
      header: 'Holati',
      sortable: true,
      render: (a) => <StatusBadge status={a.status} />,
    },
    {
      key: 'actions',
      header: 'Amallar',
      className: 'text-right',
      render: (a) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setViewingAppointment(a)}
            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
            title="Tafsilotlar"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setUpdatingStatusAppointment(a);
              setNewStatus(a.status as AppointmentStatusType);
            }}
            className="px-2.5 py-1 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition"
          >
            Holat
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Qabullar</h1>
          <p className="mt-1 text-sm text-slate-500">
            Barcha shifokorlar va bemorlar o'rtasidagi uchrashuvlar, ularning holatlari va vaqtlari
          </p>
        </div>
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
        onRowClick={(a) => setViewingAppointment(a as unknown as Appointment)}
        filters={
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-44">
              <Select
                placeholder="Barcha holatlar"
                options={statusOptions}
                value={params.status}
                onChange={(val) => setParams((p) => ({ ...p, status: val, page: 1 }))}
              />
            </div>

            <div className="w-48">
              <Select
                placeholder="Barcha shifokorlar"
                options={doctorOptions}
                value={params.doctorId}
                onChange={(val) => setParams((p) => ({ ...p, doctorId: val, page: 1 }))}
              />
            </div>

            <div className="w-48">
              <Select
                placeholder="Barcha klinikalar"
                options={clinicOptions}
                value={params.clinicId}
                onChange={(val) => setParams((p) => ({ ...p, clinicId: val, page: 1 }))}
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200/90 rounded-xl px-2.5 py-1.5 shadow-xs">
              <input
                type="date"
                value={params.dateFrom}
                onChange={(e) => setParams((p) => ({ ...p, dateFrom: e.target.value, page: 1 }))}
                className="bg-transparent text-xs text-slate-700 outline-none"
                title="Boshlanish sanasi"
              />
              <span className="text-slate-300">-</span>
              <input
                type="date"
                value={params.dateTo}
                onChange={(e) => setParams((p) => ({ ...p, dateTo: e.target.value, page: 1 }))}
                className="bg-transparent text-xs text-slate-700 outline-none"
                title="Tugash sanasi"
              />
            </div>
          </div>
        }
      />

      {/* VIEW DETAIL MODAL */}
      <Modal
        isOpen={!!viewingAppointment}
        onClose={() => setViewingAppointment(null)}
        title="Qabul tafsilotlari"
        description="Uchrashuv, bemor, shifokor va tashrif sababi haqida to'liq ma'lumot"
        icon={<Calendar className="w-5 h-5 text-teal-600" />}
        maxWidth="lg"
      >
        {viewingAppointment && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-brand-50 text-brand-600">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {formatDate(viewingAppointment.appointmentDate)}
                  </h3>
                  <p className="text-xs text-brand-700 font-semibold flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                    {viewingAppointment.startTime} - {viewingAppointment.endTime}
                  </p>
                </div>
              </div>

              <div>
                <StatusBadge status={viewingAppointment.status} />
              </div>
            </div>

            {/* Patient & Doctor cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Patient */}
              <div className="p-4 rounded-xl border border-slate-100 bg-white space-y-2 shadow-xs">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Bemor
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {viewingAppointment.patient?.firstName} {viewingAppointment.patient?.lastName}
                </p>
                <p className="text-xs text-slate-500">
                  Tel: {viewingAppointment.patient?.phone || 'Kiritilmagan'}
                </p>
              </div>

              {/* Doctor */}
              <div className="p-4 rounded-xl border border-slate-100 bg-white space-y-2 shadow-xs">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5" /> Shifokor
                </span>
                <p className="text-sm font-bold text-slate-900">
                  Dr. {viewingAppointment.doctor?.firstName} {viewingAppointment.doctor?.lastName}
                </p>
                <p className="text-xs text-brand-600 font-medium">
                  {viewingAppointment.doctor?.specialization?.name || 'Mutaxassis'}
                </p>
              </div>
            </div>

            {/* Clinic */}
            <div className="p-4 rounded-xl border border-slate-100 bg-white space-y-1 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Klinika
              </span>
              <p className="text-sm font-bold text-slate-900">{viewingAppointment.clinic?.name}</p>
              <p className="text-xs text-slate-500">{viewingAppointment.clinic?.address}</p>
            </div>

            {/* Reason */}
            {viewingAppointment.reason && (
              <div className="p-4 rounded-xl border border-slate-100 bg-white space-y-1 shadow-xs">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Bemor shikoyati / Murojaat sababi
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">{viewingAppointment.reason}</p>
              </div>
            )}

            {/* Cancel Reason */}
            {viewingAppointment.cancelReason && (
              <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/50 space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Bekor qilish / Rad etish sababi
                </span>
                <p className="text-xs text-rose-800">{viewingAppointment.cancelReason}</p>
              </div>
            )}

            {/* Sticky Actions in detail */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-4 pb-1 border-t border-slate-100 flex items-center justify-between z-10">
              <button
                type="button"
                onClick={() => {
                  const a = viewingAppointment;
                  setViewingAppointment(null);
                  setUpdatingStatusAppointment(a);
                  setNewStatus(a.status as AppointmentStatusType);
                }}
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
              >
                Holatni o'zgartirish
              </button>

              <button
                type="button"
                onClick={() => setViewingAppointment(null)}
                className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Yopish
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* UPDATE STATUS MODAL */}
      <Modal
        isOpen={!!updatingStatusAppointment}
        onClose={() => setUpdatingStatusAppointment(null)}
        title="Qabul holatini o'zgartirish"
        description="Qabulning yangi holatini tanlang"
        icon={<Clock className="w-5 h-5 text-teal-600" />}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Holat (Status)
            </label>
            <div className="space-y-2">
              {Object.values(AppointmentStatus).map((s) => (
                <label
                  key={s}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                    newStatus === s
                      ? 'border-brand-500 bg-brand-50/30'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="status"
                      value={s}
                      checked={newStatus === s}
                      onChange={() => setNewStatus(s as AppointmentStatusType)}
                      className="text-brand-600 focus:ring-brand-500 cursor-pointer"
                    />
                    <StatusBadge status={s} />
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Sticky Modal Footer */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-4 pb-1 border-t border-slate-100 flex items-center justify-end gap-3 z-10">
            <button
              type="button"
              onClick={() => setUpdatingStatusAppointment(null)}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              disabled={statusMutation.isPending}
              onClick={() =>
                updatingStatusAppointment &&
                statusMutation.mutate({
                  id: updatingStatusAppointment.id,
                  status: newStatus,
                })
              }
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {statusMutation.isPending && <Spinner size="sm" className="border-t-white" />}
              <CheckCircle2 className="w-4 h-4" />
              Saqlash
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
