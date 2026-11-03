/**
 * Contract 1: Biznes timezone Asia/Tashkent, pul so'mda, ISO 8601 UTC sanalar
 */

export function formatPrice(amount?: number | null): string {
  if (amount == null) return '-';
  return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Tashkent',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tashkent',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatDayOfWeek(day: number): string {
  const days: Record<number, string> = {
    1: 'Dushanba',
    2: 'Seshanba',
    3: 'Chorshanba',
    4: 'Payshanba',
    5: 'Juma',
    6: 'Shanba',
    7: 'Yakshanba',
  };
  return days[day] || `${day}-kun`;
}

export function getInitials(firstName?: string | null, lastName?: string | null): string {
  const f = firstName?.trim().charAt(0) || '';
  const l = lastName?.trim().charAt(0) || '';
  return (f + l).toUpperCase() || 'U';
}

