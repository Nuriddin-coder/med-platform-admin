import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
      <div className="max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Sahifa topilmadi (404)</h1>
        <p className="mt-2 text-sm text-slate-600">
          Siz qidirayotgan sahifa mavjud emas yoki o'chirilgan bo'lishi mumkin.
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

