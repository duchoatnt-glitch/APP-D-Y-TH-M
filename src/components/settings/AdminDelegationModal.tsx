import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { DelegatedAdminAccount, AdminPermissions, Teacher } from '../../types/index.ts';
import {
  X,
  ShieldCheck,
  User,
  Phone,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Save,
  BookOpen,
  Users,
  Calendar,
  Award,
  CalendarCheck,
  FileSpreadsheet,
  Check,
  Trash2,
  Ban,
} from 'lucide-react';

interface AdminDelegationModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAccount?: DelegatedAdminAccount | null;
  prefillTeacher?: Teacher | null;
}

const DEFAULT_DELEGATED_PERMISSIONS: AdminPermissions = {
  canAddClass: true,
  canDeleteClass: false, // Mặc định Thầy Hoà giới hạn: không cho xóa lớp
  canEditClass: true,
  canAddStudent: true,
  canDeleteStudent: false, // Mặc định Thầy Hoà giới hạn: không cho xóa học sinh
  canEditStudent: true,
  canManageTimetable: true, // Được xếp thời khoá biểu môn học
  canManageGrades: true,
  canManageAttendance: true,
  canExportData: true,
};

export const AdminDelegationModal: React.FC<AdminDelegationModalProps> = ({
  isOpen,
  onClose,
  editingAccount,
  prefillTeacher,
}) => {
  const {
    teachers,
    grantDelegatedAdmin,
    updateDelegatedAdmin,
    revokeDelegatedAdmin,
    isPrimaryAdmin,
  } = useApp();

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'active' | 'suspended'>('active');
  const [permissions, setPermissions] = useState<AdminPermissions>(DEFAULT_DELEGATED_PERMISSIONS);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingAccount) {
      setName(editingAccount.name);
      setPhone(editingAccount.phone || '');
      setEmail(editingAccount.email || '');
      setSelectedTeacherId(editingAccount.teacherId || '');
      setPermissions(editingAccount.permissions);
      setNote(editingAccount.note || '');
      setStatus(editingAccount.status);
    } else if (prefillTeacher) {
      setName(prefillTeacher.name);
      setPhone(prefillTeacher.phone || '');
      setEmail(prefillTeacher.email || '');
      setSelectedTeacherId(prefillTeacher.id);
      setPermissions(DEFAULT_DELEGATED_PERMISSIONS);
      setNote(`Ủy quyền quản trị cho giáo viên ${prefillTeacher.name} (${prefillTeacher.specialty || 'Bộ môn'})`);
      setStatus('active');
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setSelectedTeacherId('');
      setPermissions(DEFAULT_DELEGATED_PERMISSIONS);
      setNote('');
      setStatus('active');
    }
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [editingAccount, prefillTeacher, isOpen]);

  if (!isOpen) return null;

  // Quick preset templates
  const applyPreset = (type: 'standard' | 'full' | 'readonly') => {
    if (type === 'standard') {
      setPermissions({
        canAddClass: true,
        canDeleteClass: false, // GIỚI HẠN: KHÔNG CHO XÓA
        canEditClass: true,
        canAddStudent: true,
        canDeleteStudent: false, // GIỚI HẠN: KHÔNG CHO XÓA
        canEditStudent: true,
        canManageTimetable: true, // ĐƯỢC XẾP LỊCH TKB
        canManageGrades: true,
        canManageAttendance: true,
        canExportData: true,
      });
    } else if (type === 'full') {
      setPermissions({
        canAddClass: true,
        canDeleteClass: true,
        canEditClass: true,
        canAddStudent: true,
        canDeleteStudent: true,
        canEditStudent: true,
        canManageTimetable: true,
        canManageGrades: true,
        canManageAttendance: true,
        canExportData: true,
      });
    } else if (type === 'readonly') {
      setPermissions({
        canAddClass: false,
        canDeleteClass: false,
        canEditClass: false,
        canAddStudent: false,
        canDeleteStudent: false,
        canEditStudent: false,
        canManageTimetable: false,
        canManageGrades: true,
        canManageAttendance: true,
        canExportData: true,
      });
    }
  };

  const handleTeacherSelect = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    if (!teacherId) return;
    const t = teachers.find((tc) => tc.id === teacherId);
    if (t) {
      setName(t.name);
      setPhone(t.phone);
      setEmail(t.email);
      if (!note) {
        setNote(`Ủy quyền quản trị giáo viên bộ môn ${t.specialty || ''}`);
      }
    }
  };

  const handlePermissionChange = (key: keyof AdminPermissions, value: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setErrorMsg('Vui lòng nhập họ và tên của giáo viên / người được ủy quyền.');
      return;
    }
    if (!cleanPhone && !cleanEmail) {
      setErrorMsg('Vui lòng nhập ít nhất Số điện thoại hoặc Gmail để người này có thể đăng nhập.');
      return;
    }

    if (editingAccount) {
      updateDelegatedAdmin(editingAccount.id, {
        name: cleanName,
        phone: cleanPhone || undefined,
        email: cleanEmail || undefined,
        teacherId: selectedTeacherId || undefined,
        permissions,
        note: note.trim() || undefined,
        status,
      });
      setSuccessMsg('Đã cập nhật quyền quản trị thành công!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      grantDelegatedAdmin({
        name: cleanName,
        phone: cleanPhone || undefined,
        email: cleanEmail || undefined,
        teacherId: selectedTeacherId || undefined,
        permissions,
        note: note.trim() || 'Thầy Nguyễn Đức Hoà cấp quyền quản lý',
        status,
      });
      setSuccessMsg(`Đã cấp quyền quản trị cho ${cleanName} thành công! Người này có thể đăng nhập bằng SĐT hoặc Gmail ngay.`);
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  const handleRevoke = () => {
    if (!editingAccount) return;
    if (window.confirm(`Xác nhận THU HỒI quyền quản trị viên của "${editingAccount.name}"? Người này sẽ trở về tài khoản giáo viên thông thường.`)) {
      revokeDelegatedAdmin(editingAccount.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-4 max-h-[94vh] flex flex-col text-xs">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow">
              <ShieldCheck className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {editingAccount ? 'Chỉnh Sửa Quyền Quản Trị Viên Ủy Quyền' : 'Cấp Quyền Quản Trị Viên Cho Giáo Viên'}
              </h3>
              <p className="text-[11px] text-blue-200">
                Người quản trị chính: <strong className="text-amber-300">Thầy Nguyễn Đức Hoà</strong> (duchoatnt@gmail.com - 0945.001.262)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Teacher Picker */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Chọn Giáo Viên Từ Danh Sách Trung Tâm (Tùy chọn điền nhanh):
            </label>
            <select
              value={selectedTeacherId}
              onChange={(e) => handleTeacherSelect(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 outline-none focus:bg-white focus:border-blue-500 font-medium"
            >
              <option value="">-- Hoặc nhập thủ công thông tin phía dưới --</option>
              {teachers.map((tc) => (
                <option key={tc.id} value={tc.id}>
                  {tc.name} ({tc.phone}) - {tc.email || 'Chưa có email'} - {tc.specialty || tc.degree}
                </option>
              ))}
            </select>
          </div>

          {/* Teacher details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Họ và Tên Giáo Viên / Người Được Cấp Quyền *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Cô Trần Thị Mai"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Trạng Thái Hoạt Động
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'suspended')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-medium"
              >
                <option value="active">Đang hoạt động (Có hiệu lực đăng nhập)</option>
                <option value="suspended">Tạm khóa quyền (Không thể đăng nhập admin)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Số Điện Thoại Đăng Nhập (SĐT / Zalo) *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="0912345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Giáo viên có thể dùng SĐT này để đăng nhập vào hệ thống.
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Địa Chỉ Gmail / Email Đăng Nhập *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="maitt@phannguyen.edu.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-medium"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Hoặc dùng Gmail này để đăng nhập.
              </span>
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Ghi Chú Phân Công / Phạm Vi Quản Lý
            </label>
            <input
              type="text"
              placeholder="VD: Quản lý học sinh và xếp thời khóa biểu khối THPT, không có quyền xóa lớp"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
            />
          </div>

          {/* BẢNG PHÂN QUYỀN DO THẦY HOÀ GIỚI HẠN */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
              <div>
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Quy Định & Giới Hạn Quyền Quản Trị (Thầy Hoà Phê Duyệt)</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tích chọn các tính năng được phép thực hiện. Những tính năng không tích sẽ bị khóa hoặc ẩn.
                </p>
              </div>

              {/* Template Presets */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => applyPreset('standard')}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-semibold text-[11px] cursor-pointer shadow-2xs"
                  title="Thêm lớp, thêm HS, xếp TKB - CẤM XOÁ lớp/học sinh"
                >
                  ⚡ Mẫu Giáo Vụ (Không xóa)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('full')}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md font-semibold text-[11px] cursor-pointer shadow-2xs"
                >
                  Toàn Quyền
                </button>
              </div>
            </div>

            {/* Permission Checkbox Groups */}
            <div className="space-y-3">
              {/* 1. Nhóm Quản lý Lớp học */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span>1. Quản Lý Lớp Học:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pl-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canAddClass}
                      onChange={(e) => handlePermissionChange('canAddClass', e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="font-medium text-slate-700">Thêm lớp học</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canEditClass}
                      onChange={(e) => handlePermissionChange('canEditClass', e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="font-medium text-slate-700">Chỉnh sửa lớp học</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canDeleteClass}
                      onChange={(e) => handlePermissionChange('canDeleteClass', e.target.checked)}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    <span className={`font-semibold ${permissions.canDeleteClass ? 'text-rose-700' : 'text-slate-500'}`}>
                      Xoá lớp học {permissions.canDeleteClass ? '' : '(Đang chặn)'}
                    </span>
                  </label>
                </div>
              </div>

              {/* 2. Nhóm Quản lý Học sinh */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2. Quản Lý Danh Sách Học Sinh:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pl-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canAddStudent}
                      onChange={(e) => handlePermissionChange('canAddStudent', e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="font-medium text-slate-700">Thêm học sinh mới / Excel</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canEditStudent}
                      onChange={(e) => handlePermissionChange('canEditStudent', e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="font-medium text-slate-700">Chỉnh sửa thông tin học sinh</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canDeleteStudent}
                      onChange={(e) => handlePermissionChange('canDeleteStudent', e.target.checked)}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    <span className={`font-semibold ${permissions.canDeleteStudent ? 'text-rose-700' : 'text-slate-500'}`}>
                      Xoá danh sách học sinh {permissions.canDeleteStudent ? '' : '(Đang chặn)'}
                    </span>
                  </label>
                </div>
              </div>

              {/* 3. Nhóm Thời khóa biểu môn học */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>3. Thời Khóa Biểu & Lịch Học Môn:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canManageTimetable}
                      onChange={(e) => handlePermissionChange('canManageTimetable', e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="font-medium text-slate-700">
                      Thêm & Xếp thời khoá biểu môn học / Dạy bù
                    </span>
                  </label>
                </div>
              </div>

              {/* 4. Nhóm Nghiệp vụ hỗ trợ khác */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <Award className="w-3.5 h-3.5 text-purple-600" />
                  <span>4. Điểm Danh, Sổ Điểm & Xuất Báo Cáo:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pl-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canManageAttendance}
                      onChange={(e) => handlePermissionChange('canManageAttendance', e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="font-medium text-slate-700">Điểm danh ca học</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canManageGrades}
                      onChange={(e) => handlePermissionChange('canManageGrades', e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="font-medium text-slate-700">Nhập & sửa điểm số</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canExportData}
                      onChange={(e) => handlePermissionChange('canExportData', e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="font-medium text-slate-700">Xuất file Excel / Báo cáo</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
            <div>
              {editingAccount && (
                <button
                  type="button"
                  onClick={handleRevoke}
                  className="px-3 py-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Thu Hồi Quyền</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{editingAccount ? 'Lưu Thay Đổi Quyền' : 'Xác Nhận Cấp Quyền'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
