import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Menu,
  LogOut,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/store/authStore';
import { notificationsApi } from '@/api/notifications';
import { apiClient } from '@/api/client';
import { StatusBadge } from '@/components/common/Badge';
import { getInitials, formatDateTime } from '@/utils/formatters';
import toast from 'react-hot-toast';

interface TopbarProps {
  onMobileMenuToggle: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMobileMenuToggle }) => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fetch unread count every 30 seconds
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Fetch recent notifications when dropdown is opened
  const { data: notifications = [], isLoading: notifsLoading } = useQuery({
    queryKey: ['notifications', 'list', filterUnreadOnly],
    queryFn: () => notificationsApi.getList(filterUnreadOnly ? false : undefined),
    enabled: isNotifOpen,
  });

  // Mark all read mutation
  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success("Barcha bildirishnomalar o'qildi deb belgilandi");
    },
  });

  // Mark single notification read
  const markSingleMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Outside click listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('med_refresh_token');
      if (refreshToken) {
        // Contract 84: POST /auth/logout body { refreshToken }
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch (e) {
      console.warn('Logout API error', e);
    } finally {
      logout();
      window.location.href = '/login';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          aria-label="Menyu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-200">
            Tibbiy boshqaruv tizimi
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition focus:outline-none"
            aria-label="Bildirishnomalar"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-rose-600 rounded-full px-1 shadow-sm ring-2 ring-white animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">Bildirishnomalar</h4>
                    {unreadCount > 0 && (
                      <span className="text-[11px] bg-rose-50 text-rose-700 border border-rose-200 font-bold px-2 py-0.5 rounded-full">
                        {unreadCount} ta yangi
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllMutation.mutate()}
                      className="text-xs text-brand-600 hover:text-brand-800 font-semibold transition"
                    >
                      Barchasini o'qish
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setFilterUnreadOnly(false)}
                    className={`flex-1 py-1 rounded-lg font-semibold transition text-center ${
                      !filterUnreadOnly
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Barchasi
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterUnreadOnly(true)}
                    className={`flex-1 py-1 rounded-lg font-semibold transition text-center ${
                      filterUnreadOnly
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    O'qilmaganlar ({unreadCount})
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifsLoading ? (
                  <div className="p-6 text-center text-xs text-slate-400">Yuklanmoqda...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Yangi bildirishnomalar yo'q
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.isRead && markSingleMutation.mutate(n.id)}
                      className={`p-3.5 hover:bg-slate-50 transition cursor-pointer flex items-start gap-3 ${
                        !n.isRead ? 'bg-brand-50/20' : ''
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-teal-50 text-teal-600 mt-0.5">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-slate-900 truncate">{n.title}</p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {formatDateTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                      </div>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0 mt-2" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100 transition focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 text-white font-semibold text-xs flex items-center justify-center shadow-sm">
              {getInitials(user?.firstName, user?.lastName)}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-sm font-semibold text-slate-800 leading-tight">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-[11px] text-slate-500">{user?.role}</span>
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-500 truncate">{user?.email || user?.phone}</p>
                <div className="mt-2">
                  <StatusBadge status={user?.role} />
                </div>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Tizimdan chiqish (Logout)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
