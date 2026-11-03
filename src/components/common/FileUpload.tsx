import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { apiClient, BASE_URL } from '@/api/client';
import type { UploadedImage } from '@/api/types';
import { Spinner } from './Spinner';
import toast from 'react-hot-toast';

export type UploadFolder = 'avatar' | 'clinic-logo' | 'clinic-image' | 'diploma';

interface FileUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  onClear?: () => void;
  folder?: UploadFolder;
  label?: string;
  helperText?: string;
  error?: string;
  aspectRatio?: 'square' | 'video' | 'banner';
}

export const FileUpload: React.FC<FileUploadProps> = ({
  value,
  onChange,
  onClear,
  folder = 'avatar',
  label,
  helperText = 'PNG, JPG yoki WEBP (maks. 5MB)',
  error,
  aspectRatio = 'square',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fayl hajmi 5MB dan oshmasligi kerak!");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      setIsUploading(true);
      const res = await apiClient.post<{ success: true; data: UploadedImage }>(
        '/uploads/image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (res.data?.success && res.data.data?.url) {
        onChange(res.data.data.url);
        toast.success("Rasm muvaffaqiyatli yuklandi");
      }
    } catch (err: unknown) {
      toast.error("Rasmni yuklashda xatolik yuz berdi");
      console.error(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    if (onClear) onClear();
    else onChange('');
  };

  // Resolve absolute image URL if relative
  const displayUrl = value
    ? value.startsWith('http')
      ? value
      : `${BASE_URL.replace('/api/v1', '')}${value}`
    : null;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/jpg"
          onChange={handleFileSelect}
          className="hidden"
        />

        {displayUrl ? (
          <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
            <img
              src={displayUrl}
              alt="Uploaded preview"
              className={`max-h-48 object-cover rounded-lg ${
                aspectRatio === 'square' ? 'w-32 h-32' : 'w-full'
              }`}
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full opacity-90 hover:opacity-100 shadow transition-opacity"
              title="O'chirish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-brand-500 rounded-xl bg-slate-50/50 hover:bg-brand-50/30 transition-all cursor-pointer text-center"
          >
            {isUploading ? (
              <Spinner size="md" label="Rasm yuklanmoqda..." />
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  Rasmni tanlang yoki bu yerga tashlang
                </p>
                <p className="text-xs text-slate-400 mt-1">{helperText}</p>
              </>
            )}
          </div>
        )}
      </div>

      {error && <p className="mt-1.5 text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
};
