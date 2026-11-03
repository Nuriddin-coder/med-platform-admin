import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Edit2,
  Eye,
  UserCheck,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Droplet,
  AlertTriangle,
  User,
} from 'lucide-react';

import { patientsApi } from '@/api/patients';
import type { Patient } from '@/api/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { Modal } from '@/components/common/Modal';
import { formatDate } from '@/utils/formatters';
import { Gender } from '@/constants/enums';

export const PatientsPage: React.FC = () => {
  const navigate = useNavigate();

  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);

  // Patients list query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['patients', params],
    queryFn: async () => {
      const q: Record<string, unknown> = {
        page: params.page,
        limit: params.limit,
      };
      if (params.search) q.search = params.search;
      if (params.sortBy) q.sortBy = params.sortBy;
      if (params.sortOrder) q.sortOrder = params.sortOrder;

      return patientsApi.getPatients(q);
    },
  });

  const columns: Column<Patient>[] = [
    {
      key: 'name',
      header: 'Bemor',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
            {p.firstName?.[0]}
            {p.lastName?.[0]}
          </div>
          <div>
            <div className="font-semibold text-slate-900">
              {p.firstName} {p.lastName}
            </div>
            <div className="text-xs text-slate-400">
              {p.gender === Gender.MALE ? 'Erkak' : p.gender === Gender.FEMALE ? 'Ayol' : 'Boshqa'} •{' '}
              {p.birthDate ? formatDate(p.birthDate) : 'Sana yo\'q'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Aloqa',
      render: (p) => (
        <div>
          <div className="text-xs text-slate-800 font-medium">{p.phone || '-'}</div>
          <div className="text-[11px] text-slate-400">{p.email || '-'}</div>
        </div>
      ),
    },
    {
      key: 'bloodType',
      header: 'Qon guruhi',
      render: (p) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700">
          <Droplet className="w-3 h-3" />
          {p.bloodType || 'Noma\'lum'}
        </span>
      ),
    },
    {
      key: 'address',
      header: 'Manzil',
      render: (p) => <span className="text-xs text-slate-600 truncate max-w-xs block">{p.address || '-'}</span>,
    },
    {
      key: 'actions',
      header: 'Amallar',
      className: 'text-right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setViewingPatient(p)}
            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition"
            title="Ko'rish"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => navigate(`/patients/${p.id}/edit`)}
            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition"
            title="Tahrirlash"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bemorlar</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tizimdan ro'yxatdan o'tgan bemorlar ro'yxati va ularning tibbiy profili
        </p>
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
        onRowClick={(p) => setViewingPatient(p as unknown as Patient)}
      />

      {/* VIEW DETAIL MODAL */}
      <Modal
        isOpen={!!viewingPatient}
        onClose={() => setViewingPatient(null)}
        title="Bemor profili"
        description="Bemorning to'liq shaxsiy va tibbiy ma'lumotlari"
        icon={<User className="w-5 h-5 text-teal-600" />}
        maxWidth="lg"
      >
        {viewingPatient && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg uppercase shrink-0">
                {viewingPatient.firstName?.[0]}
                {viewingPatient.lastName?.[0]}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {viewingPatient.firstName} {viewingPatient.lastName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ID: <span className="font-mono text-slate-700">{viewingPatient.id}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-100 bg-white space-y-1 shadow-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Telefon raqami
                </span>
                <p className="text-sm font-semibold text-slate-800">{viewingPatient.phone || '-'}</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-white space-y-1 shadow-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Elektron pochta
                </span>
                <p className="text-sm font-semibold text-slate-800">{viewingPatient.email || '-'}</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-white space-y-1 shadow-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Tug'ilgan sanasi
                </span>
                <p className="text-sm font-semibold text-slate-800">{formatDate(viewingPatient.birthDate)}</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-white space-y-1 shadow-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" /> Jinsi
                </span>
                <p className="text-sm font-semibold text-slate-800">
                  {viewingPatient.gender === Gender.MALE ? 'Erkak' : viewingPatient.gender === Gender.FEMALE ? 'Ayol' : '-'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-white space-y-1 shadow-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 text-rose-500" /> Qon guruhi
                </span>
                <p className="text-sm font-semibold text-slate-800">{viewingPatient.bloodType || '-'}</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-white space-y-1 shadow-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Allergiyalar
                </span>
                <p className="text-sm font-semibold text-slate-800">{viewingPatient.allergies || "Yo'q"}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-white space-y-1 text-xs shadow-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Yashash manzili
              </span>
              <p className="text-sm font-semibold text-slate-800">{viewingPatient.address || '-'}</p>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const p = viewingPatient;
                  setViewingPatient(null);
                  navigate(`/patients/${p.id}/edit`);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Tahrirlash
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
