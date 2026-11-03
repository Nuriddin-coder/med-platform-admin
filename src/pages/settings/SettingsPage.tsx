import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Sliders,
  ShieldCheck,
  Building,
  Phone,
  Mail,
  Save,
  Lock,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { adminApi } from '@/api/admin';
import type {
  UpdatePlatformSettingsDto,
} from '@/api/types';
import { useAuth } from '@/store/authStore';
import { Role } from '@/constants/enums';
import { FormField } from '@/components/common/FormField';
import { Spinner } from '@/components/common/Spinner';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/Badge';

// -------------------------------------------------------------
// Validation schema for Settings
// -------------------------------------------------------------
const settingsSchema = z.object({
  platformName: z.string().min(2, "Platforma nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
  supportPhone: z.string().min(9, "To'g'ri telefon raqami kiriting (masalan: +998712000000)"),
  supportEmail: z.string().email("To'g'ri email manzil kiriting (masalan: support@med.uz)"),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.role === Role.SUPER_ADMIN;

  const [activeTab, setActiveTab] = useState<'settings' | 'permissions'>('settings');

  // =========================================================
  // Platform Settings Queries & Mutations
  // =========================================================
  const {
    data: settingsData,
    isLoading: settingsLoading,
    isError: settingsError,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: adminApi.getSettings,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      platformName: '',
      supportPhone: '',
      supportEmail: '',
    },
  });

  useEffect(() => {
    if (settingsData) {
      reset({
        platformName: settingsData.platformName || '',
        supportPhone: settingsData.supportPhone || '',
        supportEmail: settingsData.supportEmail || '',
      });
    }
  }, [settingsData, reset]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: UpdatePlatformSettingsDto) => {
      return adminApi.updateSettings(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success("Platforma sozlamalari muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Sozlamalarni yangilashda xatolik yuz berdi");
    },
  });

  const onSubmitSettings: SubmitHandler<SettingsFormData> = (formData) => {
    updateSettingsMutation.mutate({
      platformName: formData.platformName.trim(),
      supportPhone: formData.supportPhone.trim(),
      supportEmail: formData.supportEmail.trim(),
    });
  };

  // =========================================================
  // Permissions Queries & Mutations (SUPER_ADMIN)
  // =========================================================
  const {
    data: permissionsData,
    isLoading: permissionsLoading,
    isError: permissionsError,
    refetch: refetchPermissions,
  } = useQuery({
    queryKey: ['admin-permissions'],
    queryFn: adminApi.getPermissions,
    enabled: isSuperAdmin && activeTab === 'permissions',
  });

  const [selectedUserPermissions, setSelectedUserPermissions] = useState<Record<string, string[]>>({});
  const [permissionUserSearch, setPermissionUserSearch] = useState('');

  useEffect(() => {
    if (permissionsData?.users) {
      const initialMap: Record<string, string[]> = {};
      permissionsData.users.forEach((u) => {
        initialMap[u.userId] = [...u.permissions];
      });
      setSelectedUserPermissions(initialMap);
    }
  }, [permissionsData]);

  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: string[] }) => {
      return adminApi.updateUserPermissions(userId, { permissions });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-permissions'] });
      toast.success("Foydalanuvchi huquqlari muvaffaqiyatli saqlandi");
    },
    onError: () => {
      toast.error("Huquqlarni saqlashda xatolik yuz berdi");
    },
  });

  const handleTogglePermission = (userId: string, permKey: string) => {
    setSelectedUserPermissions((prev) => {
      const current = prev[userId] || [];
      const hasPerm = current.includes(permKey);
      const next = hasPerm ? current.filter((p) => p !== permKey) : [...current, permKey];
      return {
        ...prev,
        [userId]: next,
      };
    });
  };

  const filteredUsers = (permissionsData?.users || []).filter((u) => {
    if (!permissionUserSearch) return true;
    const term = permissionUserSearch.toLowerCase();
    return (
      (u.email && u.email.toLowerCase().includes(term)) ||
      u.role.toLowerCase().includes(term) ||
      u.userId.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sozlamalar va Huquqlar</h1>
        <p className="mt-1 text-sm text-slate-500">
          Platforma aloqa ma'lumotlari, tizim parametrlari va foydalanuvchilarning ruxsatlarini boshqarish
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition -mb-px ${
            activeTab === 'settings'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Platforma sozlamalari</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('permissions')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition -mb-px ${
            activeTab === 'permissions'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Tizim huquqlari (Permissions)</span>
          {!isSuperAdmin && (
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
              Super Admin
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: Platform Settings */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl">
          {settingsLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Spinner size="lg" label="Sozlamalar yuklanmoqda..." />
            </div>
          ) : settingsError ? (
            <div className="py-8">
              <ErrorState onRetry={() => refetchSettings()} />
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-xs">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Aloqa va Platforma nomi</h3>
                  <p className="text-xs text-slate-500">
                    Ushbu ma'lumotlar barcha bemorlar va shifokorlar sahifalarida qo'llab-quvvatlash uchun ko'rinadi
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmitSettings)} className="space-y-5">
                <FormField
                  label="Platforma nomi"
                  required
                  error={errors.platformName?.message}
                >
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-200/90 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15 transition shadow-xs"
                      placeholder="MED Medical Platform"
                      {...register('platformName')}
                    />
                  </div>
                </FormField>

                <FormField
                  label="Qo'llab-quvvatlash telefon raqami"
                  required
                  error={errors.supportPhone?.message}
                >
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-200/90 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15 transition shadow-xs"
                      placeholder="+998712000000"
                      {...register('supportPhone')}
                    />
                  </div>
                </FormField>

                <FormField
                  label="Qo'llab-quvvatlash elektron pochtasi"
                  required
                  error={errors.supportEmail?.message}
                >
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      className="w-full bg-white border border-slate-200/90 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15 transition shadow-xs"
                      placeholder="support@med.uz"
                      {...register('supportEmail')}
                    />
                  </div>
                </FormField>

                <div className="pt-4 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting || updateSettingsMutation.isPending}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white text-sm font-bold rounded-xl shadow-md shadow-teal-700/20 transition-all duration-200 active:scale-95 disabled:opacity-50"
                  >
                    {(isSubmitting || updateSettingsMutation.isPending) && (
                      <Spinner size="sm" className="border-t-white" />
                    )}
                    <Save className="w-4 h-4" />
                    <span>O'zgarishlarni saqlash</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Permissions Management */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          {!isSuperAdmin ? (
            <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 max-w-2xl flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-amber-900">Huquqlar cheklangan</h4>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Tizim foydalanuvchilarining huquqlarini (permissions) ko'rish va o'zgartirish faqat{' '}
                  <strong>SUPER_ADMIN</strong> roliga ega bo'lgan foydalanuvchilar uchun ruxsat etilgan.
                </p>
              </div>
            </div>
          ) : permissionsLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Spinner size="lg" label="Huquqlar ro'yxati yuklanmoqda..." />
            </div>
          ) : permissionsError ? (
            <div className="py-8">
              <ErrorState onRetry={() => refetchPermissions()} />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Permissions Legend Banner */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4.5 h-4.5 text-teal-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Tizimda mavjud barcha huquqlar ({permissionsData?.permissions?.length || 0} ta)
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(permissionsData?.permissions || []).map((perm) => (
                    <span
                      key={perm}
                      className="px-2.5 py-1 rounded-xl bg-teal-50 text-teal-800 border border-teal-200/70 text-xs font-mono font-semibold"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Email yoki rol bo'yicha qidirish..."
                    value={permissionUserSearch}
                    onChange={(e) => setPermissionUserSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200/90 rounded-xl pl-10 pr-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15 transition shadow-xs"
                  />
                </div>
                <span className="text-xs text-slate-500">
                  Jami: <strong className="text-slate-800">{filteredUsers.length}</strong> nafar administrator
                </span>
              </div>

              {/* Users Permission Matrix Cards */}
              <div className="space-y-4">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-100">
                    Foydalanuvchi topilmadi
                  </div>
                ) : (
                  filteredUsers.map((item) => {
                    const userPerms = selectedUserPermissions[item.userId] || [];
                    const isPending = updatePermissionsMutation.isPending;

                    return (
                      <div
                        key={item.userId}
                        className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/90 shadow-xs space-y-4 transition hover:border-slate-300"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                              {item.email ? item.email[0].toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm">
                                  {item.email || 'Email mavjud emas'}
                                </span>
                                <StatusBadge status={item.role} />
                              </div>
                              <span className="text-[11px] text-slate-400 font-mono">
                                ID: {item.userId}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500">
                              Faol ruxsatlar: <strong className="text-teal-700 font-bold">{userPerms.length}</strong>
                            </span>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() =>
                                updatePermissionsMutation.mutate({
                                  userId: item.userId,
                                  permissions: userPerms,
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 disabled:opacity-50"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Saqlash</span>
                            </button>
                          </div>
                        </div>

                        {/* Checkbox grid of permissions */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                          {(permissionsData?.permissions || []).map((permKey) => {
                            const isChecked = userPerms.includes(permKey);
                            return (
                              <label
                                key={permKey}
                                className={`flex items-center gap-2 p-2.5 rounded-xl border transition cursor-pointer select-none text-xs font-medium ${
                                  isChecked
                                    ? 'bg-teal-50/80 border-teal-200 text-teal-900 font-semibold shadow-2xs'
                                    : 'bg-slate-50/60 border-slate-200/80 text-slate-600 hover:bg-slate-100/60'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(item.userId, permKey)}
                                  className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer"
                                />
                                <span className="font-mono text-[11px] truncate" title={permKey}>
                                  {permKey}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
