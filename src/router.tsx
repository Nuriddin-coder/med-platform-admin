import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '@/pages/auth/LoginPage';
import { ForbiddenPage } from '@/pages/error/ForbiddenPage';
import { NotFoundPage } from '@/pages/error/NotFoundPage';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Role } from '@/constants/enums';

// List Pages
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { UsersPage } from '@/pages/users/UsersPage';
import { DoctorsPage } from '@/pages/doctors/DoctorsPage';
import { PatientsPage } from '@/pages/patients/PatientsPage';
import { ClinicsPage } from '@/pages/clinics/ClinicsPage';
import { AppointmentsPage } from '@/pages/appointments/AppointmentsPage';
import { SpecializationsPage } from '@/pages/specializations/SpecializationsPage';
import { ServicesPage } from '@/pages/services/ServicesPage';
import { LogsPage } from '@/pages/logs/LogsPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';

// Unified Form Pages (Create & Edit)
import { ClinicFormPage } from '@/pages/clinics/ClinicFormPage';
import { DoctorFormPage } from '@/pages/doctors/DoctorFormPage';
import { UserFormPage } from '@/pages/users/UserFormPage';
import { PatientFormPage } from '@/pages/patients/PatientFormPage';
import { SpecializationFormPage } from '@/pages/specializations/SpecializationFormPage';
import { ServiceFormPage } from '@/pages/services/ServiceFormPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/forbidden',
    element: <ForbiddenPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      // Users
      {
        path: 'users',
        element: (
          <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.ADMIN]}>
            <UsersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'users/new',
        element: (
          <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.ADMIN]}>
            <UserFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'users/:id/edit',
        element: (
          <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.ADMIN]}>
            <UserFormPage />
          </ProtectedRoute>
        ),
      },
      // Doctors
      {
        path: 'doctors',
        element: <DoctorsPage />,
      },
      {
        path: 'doctors/new',
        element: (
          <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.ADMIN]}>
            <DoctorFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'doctors/:id/edit',
        element: (
          <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.ADMIN]}>
            <DoctorFormPage />
          </ProtectedRoute>
        ),
      },
      // Patients
      {
        path: 'patients',
        element: (
          <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.ADMIN]}>
            <PatientsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'patients/:id/edit',
        element: (
          <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.ADMIN]}>
            <PatientFormPage />
          </ProtectedRoute>
        ),
      },
      // Clinics
      {
        path: 'clinics',
        element: <ClinicsPage />,
      },
      {
        path: 'clinics/new',
        element: (
          <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.ADMIN]}>
            <ClinicFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'clinics/:id/edit',
        element: (
          <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.ADMIN]}>
            <ClinicFormPage />
          </ProtectedRoute>
        ),
      },
      // Appointments
      {
        path: 'appointments',
        element: <AppointmentsPage />,
      },
      // Specializations
      {
        path: 'specializations',
        element: (
          <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.ADMIN]}>
            <SpecializationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'specializations/new',
        element: (
          <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.ADMIN]}>
            <SpecializationFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'specializations/:id/edit',
        element: (
          <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.ADMIN]}>
            <SpecializationFormPage />
          </ProtectedRoute>
        ),
      },
      // Services
      {
        path: 'services',
        element: <ServicesPage />,
      },
      {
        path: 'services/new',
        element: (
          <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.ADMIN, Role.CLINIC_MANAGER]}>
            <ServiceFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'services/:id/edit',
        element: (
          <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.ADMIN, Role.CLINIC_MANAGER]}>
            <ServiceFormPage />
          </ProtectedRoute>
        ),
      },
      // Logs & Settings
      {
        path: 'logs',
        element: (
          <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.ADMIN]}>
            <LogsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.ADMIN]}>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
