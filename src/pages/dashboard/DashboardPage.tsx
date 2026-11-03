import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Stethoscope,
  Building2,
  CalendarDays,
  UserCheck,
  TrendingUp,
  CheckCircle2,
  XCircle,
  BarChart2,
  LineChart,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { adminApi } from '@/api/admin';
import { Spinner } from '@/components/common/Spinner';
import { ErrorState } from '@/components/common/ErrorState';
import { useAuth } from '@/store/authStore';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedDays, setSelectedDays] = useState<number>(30);
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminApi.getStats,
  });

  const {
    data: chartData = [],
    isLoading: chartLoading,
    isError: chartError,
    refetch: refetchChart,
  } = useQuery({
    queryKey: ['admin', 'appointments-chart', selectedDays],
    queryFn: () => adminApi.getAppointmentsChart(selectedDays),
  });

  if (statsLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" label="Boshqaruv paneli yuklanmoqda..." />
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="py-12">
        <ErrorState onRetry={() => refetchStats()} />
      </div>
    );
  }

  // Contract 161-162: 8 KPI keys exactly as in Contract
  const statCards = [
    {
      key: 'totalUsers',
      title: 'Jami foydalanuvchilar',
      value: stats?.totalUsers ?? 0,
      sub: stats?.newUsersThisWeek ? `+${stats.newUsersThisWeek} bu hafta` : 'Faol foydalanuvchilar',
      icon: <Users className="w-5 h-5 text-sky-600" />,
      bg: 'bg-sky-50',
    },
    {
      key: 'totalDoctors',
      title: 'Shifokorlar',
      value: stats?.totalDoctors ?? 0,
      sub: 'Platformadagi mutaxassislar',
      icon: <Stethoscope className="w-5 h-5 text-teal-600" />,
      bg: 'bg-teal-50',
    },
    {
      key: 'totalPatients',
      title: 'Bemorlar',
      value: stats?.totalPatients ?? 0,
      sub: "Ro'yxatdan o'tganlar",
      icon: <UserCheck className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-50',
    },
    {
      key: 'totalClinics',
      title: 'Klinikalar',
      value: stats?.totalClinics ?? 0,
      sub: 'Hamkor tibbiyot markazlari',
      icon: <Building2 className="w-5 h-5 text-purple-600" />,
      bg: 'bg-purple-50',
    },
    {
      key: 'todayAppointments',
      title: 'Bugungi qabullar',
      value: stats?.todayAppointments ?? 0,
      sub: 'Kutilayotgan uchrashuvlar',
      icon: <CalendarDays className="w-5 h-5 text-amber-600" />,
      bg: 'bg-amber-50',
    },
    {
      key: 'confirmedAppointments',
      title: 'Tasdiqlangan qabullar',
      value: stats?.confirmedAppointments ?? 0,
      sub: 'Jami tasdiqlangan',
      icon: <CheckCircle2 className="w-5 h-5 text-teal-600" />,
      bg: 'bg-teal-50',
    },
    {
      key: 'cancelledAppointments',
      title: 'Bekor qilingan qabullar',
      value: stats?.cancelledAppointments ?? 0,
      sub: 'Rad etilgan yoki bekor',
      icon: <XCircle className="w-5 h-5 text-rose-600" />,
      bg: 'bg-rose-50',
    },
    {
      key: 'newUsersThisWeek',
      title: 'Yangi a\'zolar',
      value: stats?.newUsersThisWeek ?? 0,
      sub: 'Oxirgi 7 kunda',
      icon: <TrendingUp className="w-5 h-5 text-indigo-600" />,
      bg: 'bg-indigo-50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Assalomu alaykum, {user?.firstName}!
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tibbiy platformaning umumiy ko'rsatkichlari va qabullar tahlili
          </p>
        </div>
      </div>

      {/* 8 KPI Cards (Contract keys) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-2.5 rounded-xl ${card.bg}`}>{card.icon}</div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {card.value}
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-400 font-medium">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Qabullar dinamikasi (Monitoring)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tanlangan muddat bo'yicha jami, tasdiqlangan va bekor qilingan uchrashuvlar
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Days period selector */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50/70 p-1">
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setSelectedDays(days)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                    selectedDays === days
                      ? 'bg-white text-brand-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {days} kun
                </button>
              ))}
            </div>

            {/* Chart type toggle */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50/70 p-1">
              <button
                type="button"
                onClick={() => setChartType('area')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                  chartType === 'area'
                    ? 'bg-white text-brand-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Chiziqli grafik"
              >
                <LineChart className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chiziqli</span>
              </button>
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                  chartType === 'bar'
                    ? 'bg-white text-brand-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Ustunli grafik"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ustunli</span>
              </button>
            </div>
          </div>
        </div>

        {/* Chart Content Area */}
        {chartLoading ? (
          <div className="h-72 flex items-center justify-center">
            <Spinner size="md" label="Grafik yuklanmoqda..." />
          </div>
        ) : chartError ? (
          <div className="h-72 flex items-center justify-center">
            <ErrorState
              title="Grafik ma'lumotlarini yuklab bo'lmadi"
              onRetry={() => refetchChart()}
            />
          </div>
        ) : chartData.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorConfirmed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorCancelled" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Jami qabullar"
                    stroke="#0d9488"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="confirmed"
                    name="Tasdiqlangan"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorConfirmed)"
                  />
                  <Area
                    type="monotone"
                    dataKey="cancelled"
                    name="Bekor qilingan"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCancelled)"
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                  />
                  <Bar dataKey="total" name="Jami qabullar" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="confirmed" name="Tasdiqlangan" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cancelled" name="Bekor qilingan" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center text-xs text-slate-400">
            Tanlangan muddat uchun ma'lumot topilmadi
          </div>
        )}
      </div>
    </div>
  );
};
