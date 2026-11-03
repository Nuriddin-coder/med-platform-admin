import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  UserCheck,
  Building2,
  CalendarDays,
  Award,
  Layers,
  History,
  Settings,
  Activity,
  X,
} from 'lucide-react';
import { useAuth } from '@/store/authStore';
import { Role, RoleType } from '@/constants/enums';
import { cn } from '@/utils/cn';

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  allowedRoles: RoleType[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onMobileClose }) => {
  const { user } = useAuth();
  const location = useLocation();
  const userRole = (user?.role as RoleType) || Role.ADMIN;

  const navItems: NavItem[] = [
    {
      title: 'Boshqaruv paneli',
      path: '/',
      icon: <LayoutDashboard className="w-5 h-5" />,
      allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CLINIC_MANAGER],
    },
    {
      title: 'Foydalanuvchilar',
      path: '/users',
      icon: <Users className="w-5 h-5" />,
      allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN],
    },
    {
      title: 'Shifokorlar',
      path: '/doctors',
      icon: <Stethoscope className="w-5 h-5" />,
      allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CLINIC_MANAGER],
    },
    {
      title: 'Bemorlar',
      path: '/patients',
      icon: <UserCheck className="w-5 h-5" />,
      allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN],
    },
    {
      title: 'Klinikalar',
      path: '/clinics',
      icon: <Building2 className="w-5 h-5" />,
      allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CLINIC_MANAGER],
    },
    {
      title: 'Qabullar',
      path: '/appointments',
      icon: <CalendarDays className="w-5 h-5" />,
      allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CLINIC_MANAGER],
    },
    {
      title: 'Mutaxassisliklar',
      path: '/specializations',
      icon: <Award className="w-5 h-5" />,
      allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN],
    },
    {
      title: 'Xizmatlar',
      path: '/services',
      icon: <Layers className="w-5 h-5" />,
      allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CLINIC_MANAGER],
    },
    {
      title: 'Tizim loglari',
      path: '/logs',
      icon: <History className="w-5 h-5" />,
      allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN],
    },
    {
      title: 'Sozlamalar',
      path: '/settings',
      icon: <Settings className="w-5 h-5" />,
      allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN],
    },
  ];

  // Filter items based on user's role
  const visibleItems = navItems.filter((item) => item.allowedRoles.includes(userRole));

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/80">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 tracking-tight text-sm sm:text-base leading-none">
              MedPlatform
            </h2>
            <span className="text-[10px] font-medium text-brand-600 uppercase tracking-wider">
              Boshqaruv
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onMobileClose}
          className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          aria-label="Yopish"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
        <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Asosiy menyu
        </p>
        {visibleItems.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <span className={isActive ? 'text-brand-600' : 'text-slate-400'}>
                {item.icon}
              </span>
              <span>{item.title}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Role Footer Card */}
      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
            {userRole.slice(0, 2)}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-800 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] text-slate-400 font-medium truncate">{userRole}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          {/* Drawer container */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] z-50 transform transition-transform ease-in-out duration-300">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

