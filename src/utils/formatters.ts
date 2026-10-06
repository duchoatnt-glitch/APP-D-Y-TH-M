// Format currency to Vietnamese Dong standard
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(val: number): string {
  return new Intl.NumberFormat('vi-VN').format(val);
}

export function formatDateVi(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function getDayOfWeekName(dayNum: number): string {
  switch (dayNum) {
    case 2: return 'Thứ 2';
    case 3: return 'Thứ 3';
    case 4: return 'Thứ 4';
    case 5: return 'Thứ 5';
    case 6: return 'Thứ 6';
    case 7: return 'Thứ 7';
    case 8: return 'Chủ Nhật';
    default: return `T${dayNum}`;
  }
}

export function getStatusBadge(status: string): { label: string; bg: string; text: string } {
  switch (status) {
    case 'present':
      return { label: 'Có mặt', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' };
    case 'absent_excused':
      return { label: 'Nghỉ có phép', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' };
    case 'absent_unexcused':
      return { label: 'Nghỉ không phép', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700' };
    case 'late':
      return { label: 'Đi muộn', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' };
    case 'paid':
      return { label: 'Đã đóng đủ', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' };
    case 'partial':
      return { label: 'Đóng 1 phần', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' };
    case 'unpaid':
      return { label: 'Chưa đóng', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' };
    case 'overdue':
      return { label: 'Quá hạn', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700' };
    case 'active':
      return { label: 'Đang học', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' };
    case 'trial':
      return { label: 'Học thử', bg: 'bg-sky-50 border-sky-200', text: 'text-sky-700' };
    case 'paused':
      return { label: 'Bảo lưu', bg: 'bg-slate-100 border-slate-200', text: 'text-slate-600' };
    case 'dropped':
      return { label: 'Thôi học', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-600' };
    default:
      return { label: status, bg: 'bg-slate-100 border-slate-200', text: 'text-slate-700' };
  }
}

export function generateVietQrUrl(params: {
  bankId: string;
  accountNo: string;
  accountName: string;
  amount: number;
  description: string;
}): string {
  const { bankId, accountNo, accountName, amount, description } = params;
  const cleanBank = bankId.trim();
  const cleanAccount = accountNo.trim();
  const encodedDesc = encodeURIComponent(description);
  const encodedName = encodeURIComponent(accountName);
  return `https://img.vietqr.io/image/${cleanBank}-${cleanAccount}-compact2.png?amount=${amount}&addInfo=${encodedDesc}&accountName=${encodedName}`;
}

/**
 * Lấy mốc ngày Thứ Hai đầu tuần chứa ngày khai giảng của trung tâm hoặc của lớp học
 */
export function getOpeningMonday(openingDateStr?: string): Date {
  let base: Date;
  if (openingDateStr) {
    const parts = openingDateStr.split('-');
    if (parts.length === 3) {
      base = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
      base = new Date(openingDateStr);
    }
  } else {
    base = new Date(2026, 8, 7); // Mặc định: 07/09/2026 (Năm học 2026-2027)
  }

  if (isNaN(base.getTime())) {
    base = new Date(2026, 8, 7);
  }

  const day = base.getDay(); // 0 is Sunday, 1 is Monday...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(base);
  monday.setDate(base.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Đồng nhất tính khoảng thời gian của Tuần N theo ngày khai giảng (Tuần 1 = Tuần khai giảng)
 */
export function getAcademicWeekDates(
  weekNum: number,
  openingDateStr?: string
): {
  startDateFormatted: string;
  endDateFormatted: string;
  startDateIso: string;
  endDateIso: string;
  startObj: Date;
  endObj: Date;
  semester: string;
} {
  const safeWeek = Math.max(1, weekNum || 1);
  const mondayWeek1 = getOpeningMonday(openingDateStr);

  const weekStart = new Date(mondayWeek1);
  weekStart.setDate(mondayWeek1.getDate() + (safeWeek - 1) * 7);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const toIso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const toFormatted = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

  return {
    startDateFormatted: toFormatted(weekStart),
    endDateFormatted: toFormatted(weekEnd),
    startDateIso: toIso(weekStart),
    endDateIso: toIso(weekEnd),
    startObj: weekStart,
    endObj: weekEnd,
    semester: safeWeek <= 18 ? 'HK1' : 'HK2',
  };
}

/**
 * Tính số tuần học (Tuần 1, Tuần 2...) tương ứng với một ngày cụ thể dựa trên ngày khai giảng
 */
export function getAcademicWeekNumber(
  dateIso: string,
  openingDateStr?: string
): number {
  if (!dateIso) return 1;
  let target: Date;
  const parts = dateIso.split('-');
  if (parts.length === 3) {
    target = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  } else {
    target = new Date(dateIso);
  }

  if (isNaN(target.getTime())) return 1;

  const mondayWeek1 = getOpeningMonday(openingDateStr);
  const diffMs = target.getTime() - mondayWeek1.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const weekIndex = Math.floor(diffDays / 7) + 1;
  return Math.max(1, Math.min(52, weekIndex));
}

/**
 * Trích xuất địa danh cấp Xã / Phường / Thị trấn hoặc địa phương từ địa chỉ của trung tâm
 * Ví dụ: 'Cơ sở 1, 11 Trần Kiên, thôn 4, xã Ea Knốp, tỉnh Đăk Lăk' -> 'Ea Knốp'
 */
export function getCenterCommuneOrLocation(address?: string): string {
  if (!address) return 'Ea Knốp';
  
  // 1. Kiểm tra cụm từ 'xã ...', 'phường ...', 'thị trấn ...'
  const match = address.match(/(?:xã|phường|thị trấn)\s+([^,]+)/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // 2. Kiểm tra nếu có chứa 'Ea Knốp', 'Ea Knop', 'Ea Nốp'
  if (address.includes('Ea Knốp') || address.includes('Ea Knop')) return 'Ea Knốp';
  if (address.includes('Ea Nốp') || address.includes('Ea Nop')) return 'Ea Knốp';

  // 3. Lấy phần tử hợp lý từ chuỗi địa chỉ
  const parts = address.split(',').map((p) => p.trim());
  if (parts.length >= 2) {
    return parts[parts.length - 2] || 'Ea Knốp';
  }

  return 'Ea Knốp';
}

