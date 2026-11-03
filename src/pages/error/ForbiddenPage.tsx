import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const ForbiddenPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
      <div className="max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Ruxsat etilmagan (403)</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sizning rolingiz ushbu bo'limni ko'rish yoki boshqarish huquqiga ega emas.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Asosiy sahifaga qaytish
          </Link>
        </div>
      </div>
    </div>
  );
};

