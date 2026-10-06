import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { DelegatedAdminAccount, AdminPermissions, Teacher } from '../../types/index.ts';
import {
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  UserPlus,
  Edit2,
  Trash2,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Lock,
  Unlock,
  BookOpen,
  Users,
  Calendar,
  Sparkles,
  Info,
  Check,
  KeyRound,
} from 'lucide-react';

interface DelegatedAdminManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTeacher?: Teacher | null;
}

export const DelegatedAdminManagementModal: React.FC<DelegatedAdminManagementModalProps> = ({
  isOpen,
  onClose,
  targetTeacher,
}) => {
  const {
    currentUser,
    isPrimaryAdmin,
    teachers,
    delegatedAdmins,
    grantDelegatedAdmin,
    updateDelegatedAdmin,
    revokeDelegatedAdmin,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [editingAccount, setEditingAccount] = useState<DelegatedAdminAccount | null>(null);

  // Form state for creating / editing delegated admin
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [adminName, setAdminName] = useState<string>('');
  const [adminPhone, setAdminPhone] = useState<string>('');
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminNote, setAdminNote] = useState<string>('');

  const [permissions, setPermissions] = useState<AdminPermissions>({
    canAddClass: true,
    canDeleteClass: false,
    canEditClass: true,
    canAddStudent: true,
    canDeleteStudent: false,
    canEditStudent: true,
    canManageTimetable: true,
    canManageGrades: true,
    canManageAttendance: true,
    canExportData: true,
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // If a targetTeacher prop was provided, switch to create tab and prefill
  useEffect(() => {
    if (targetTeacher && isOpen) {
      const existing = delegatedAdmins.find(
        (da) =>
          da.teacherId === targetTeacher.id ||
          (targetTeacher.email && da.email === targetTeacher.email) ||
          (targetTeacher.phone && da.phone === targetTeacher.phone)
      );

      if (existing) {
        handleStartEdit(existing);
      } else {
        setSelectedTeacherId(targetTeacher.id);
        setAdminName(targetTeacher.name);
        setAdminPhone(targetTeacher.phone || '');
        setAdminEmail(targetTeacher.email || '');
        setAdminNote(`Cấp quyền quản trị viên cho ${targetTeacher.name}`);
        setEditingAccount(null);
        setActiveTab('create');
      }
    }
  }, [targetTeacher, isOpen]);

  if (!isOpen) return null;

  const handleTeacherSelect = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    if (!teacherId) return;

    const t = teachers.find((tc) => tc.id === teacherId);
    if (t) {
      setAdminName(t.name);
      setAdminPhone(t.phone || '');
      setAdminEmail(t.email || '');
      setAdminNote(`Ủy quyền cho ${t.name} (${t.specialty || 'Giáo viên bộ môn'})`);
    }
  };

  const handleStartEdit = (account: DelegatedAdminAccount) => {
    setEditingAccount(account);
    setSelectedTeacherId(account.teacherId || '');
    setAdminName(account.name);
    setAdminPhone(account.phone || '');
    setAdminEmail(account.email || '');
    setAdminNote(account.note || '');
    setPermissions(account.permissions);
    setActiveTab('create');
  };

  const handleResetForm = () => {
    setEditingAccount(null);
    setSelectedTeacherId('');
    setAdminName('');
    setAdminPhone('');
    setAdminEmail('');
    setAdminNote('');
    setPermissions({
      canAddClass: true,
      canDeleteClass: false,
      canEditClass: true,
      canAddStudent: true,
      canDeleteStudent: false,
      canEditStudent: true,
      canManageTimetable: true,
      canManageGrades: true,
      canManageAttendance: true,
      canExportData: true,
    });
  };

  // Preset permission templates
  const applyPreset = (preset: 'safe_admin' | 'student_manager' | 'timetable_manager' | 'full_admin') => {
    if (preset === 'safe_admin') {
      // Cho phép thêm lớp, thêm học sinh, xếp TKB; CẤM XOÁ lớp & học sinh
      setPermissions({
        canAddClass: true,
        canDeleteClass: false,
        canEditClass: true,
        canAddStudent: true,
        canDeleteStudent: false,
        canEditStudent: true,
        canManageTimetable: true,
        canManageGrades: true,
        canManageAttendance: true,
        canExportData: true,
      });
    } else if (preset === 'student_manager') {
      // Chỉ chuyên quản lý học sinh
      setPermissions({
        canAddClass: false,
        canDeleteClass: false,
        canEditClass: false,
        canAddStudent: true,
        canDeleteStudent: false,
        canEditStudent: true,
        canManageTimetable: false,
        canManageGrades: true,
        canManageAttendance: true,
        canExportData: true,
      });
    } else if (preset === 'timetable_manager') {
      // Chỉ chuyên xếp thời khóa biểu
      setPermissions({
        canAddClass: false,
        canDeleteClass: false,
        canEditClass: true,
        canAddStudent: false,
        canDeleteStudent: false,
        canEditStudent: false,
        canManageTimetable: true,
        canManageGrades: true,
        canManageAttendance: true,
        canExportData: true,
      });
    } else if (preset === 'full_admin') {
      // Toàn quyền
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
    }
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPrimaryAdmin) {
      alert('Chỉ Thầy Nguyễn Đức Hoà mới có quyền cấp hoặc sửa quyền quản trị viên!');
      return;
    }

    if (!adminName.trim()) {
      alert('Vui lòng nhập họ và tên của giáo viên!');
      return;
    }

    if (!adminPhone.trim() && !adminEmail.trim()) {
      alert('Vui lòng nhập ít nhất Số điện thoại hoặc Gmail để giáo viên có thể đăng nhập!');
      return;
    }

    if (editingAccount) {
      updateDelegatedAdmin(editingAccount.id, {
        name: adminName.trim(),
        phone: adminPhone.trim() || undefined,
        email: adminEmail.trim() || undefined,
        teacherId: selectedTeacherId || undefined,
        note: adminNote.trim() || undefined,
        permissions,
      });
      showToast(`Đã cập nhật quyền hạn cho ${adminName.trim()} thành công!`);
    } else {
      grantDelegatedAdmin({
        name: adminName.trim(),
        phone: adminPhone.trim() || undefined,
        email: adminEmail.trim() || undefined,
        teacherId: selectedTeacherId || undefined,
        note: adminNote.trim() || undefined,
        permissions,
        status: 'active',
      });
      showToast(`Thầy Nguyễn Đức Hoà đã cấp quyền quản trị viên cho ${adminName.trim()}!`);
    }

    handleResetForm();
    setActiveTab('list');
  };

  const handleRevoke = (id: string, name: string) => {
    if (!isPrimaryAdmin) {
      alert('Chỉ Thầy Nguyễn Đức Hoà mới có quyền thu hồi quyền quản trị viên!');
      return;
    }

    if (
      window.confirm(
        `Xác nhận thu hồi quyền quản trị viên của giáo viên "${name}"?\nGiáo viên này sẽ quay lại quyền tài khoản giáo viên thông thường.`
      )
    ) {
      revokeDelegatedAdmin(id);
      showToast(`Đã thu hồi quyền quản trị viên của ${name}.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col relative">
        {/* Floating Toast */}
        {toastMsg && (
          <div className="absolute top-4 right-6 z-50 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-lg border border-slate-700 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-inner">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  Phân Quyền & Quản Trị Viên Ủy Quyền
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Thầy Nguyễn Đức Hoà
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Cấp quyền và giới hạn tính năng cho giáo viên khác bằng Số điện thoại hoặc Gmail
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Admin Notice Banner */}
        <div className="px-6 py-2.5 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Người quản trị chính:</strong> Thầy Nguyễn Đức Hoà (Toàn quyền). Người được cấp quyền sẽ bị giới hạn các tính năng cụ thể do Thầy Hoà phê duyệt.
            </span>
          </div>
          <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-full">
            {delegatedAdmins.length} quản trị viên ủy quyền
          </span>
        </div>

        {/* Tab Controls */}
        <div className="px-6 border-b border-slate-200 flex items-center justify-between bg-white text-xs font-semibold">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setActiveTab('list');
                setEditingAccount(null);
              }}
              className={`py-3 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'list'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Danh Sách Quản Trị Viên ({delegatedAdmins.length})</span>
            </button>

            <button
              onClick={() => {
                handleResetForm();
                setActiveTab('create');
              }}
              className={`py-3 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'create'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>{editingAccount ? 'Chỉnh Sửa Phân Quyền' : '+ Cấp Quyền Cho Giáo Viên'}</span>
            </button>
          </div>

          {!isPrimaryAdmin && (
            <span className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 flex items-center gap-1 font-medium">
              <Lock className="w-3 h-3 text-amber-600" />
              Chế độ chỉ xem (Chỉ Thầy Hoà mới được sửa)
            </span>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* TAB 1: LIST OF DELEGATED ADMINS */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              {delegatedAdmins.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-slate-700 text-sm">
                    Chưa có giáo viên nào được cấp quyền quản trị viên ủy quyền
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Thầy Nguyễn Đức Hoà có thể bấm nút "Cấp Quyền Cho Giáo Viên" phía trên để phân quyền cho giáo viên khác bằng Số điện thoại hoặc Gmail.
                  </p>
                  {isPrimaryAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        handleResetForm();
                        setActiveTab('create');
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" /> Cấp Quyền Cho Giáo Viên Ngay
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {delegatedAdmins.map((adm) => {
                    return (
                      <div
                        key={adm.id}
                        className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-xs transition-all space-y-3 flex flex-col justify-between"
                      >
                        <div>
                          {/* Top Meta */}
                          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-900 text-sm">{adm.name}</h4>
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                  Ủy quyền
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                                {adm.phone && (
                                  <span className="flex items-center gap-1 font-mono">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    {adm.phone}
                                  </span>
                                )}
                                {adm.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-slate-400" />
                                    {adm.email}
                                  </span>
                                )}
                              </div>
                            </div>

                            {isPrimaryAdmin && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(adm)}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title="Chỉnh sửa quyền hạn"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRevoke(adm.id, adm.name)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Thu hồi quyền quản trị"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Note */}
                          {adm.note && (
                            <p className="text-[11px] text-slate-600 italic mt-2 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                              "{adm.note}"
                            </p>
                          )}

                          {/* Permission Badges Grid */}
                          <div className="mt-3 space-y-1.5 text-[11px]">
                            <div className="font-semibold text-slate-700 text-[10px] uppercase tracking-wider">
                              Quyền Hạn Được Thầy Hoà Thiết Lập:
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                              {/* Thêm lớp */}
                              <div
                                className={`px-2 py-1 rounded flex items-center justify-between border ${
                                  adm.permissions.canAddClass
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-rose-50/60 text-rose-700 border-rose-200'
                                }`}
                              >
                                <span>Thêm lớp học</span>
                                <span className="font-bold">{adm.permissions.canAddClass ? '✓ Có' : '✗ Cấm'}</span>
                              </div>

                              {/* Xoá lớp */}
                              <div
                                className={`px-2 py-1 rounded flex items-center justify-between border ${
                                  adm.permissions.canDeleteClass
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-rose-50/60 text-rose-700 border-rose-200'
                                }`}
                              >
                                <span>Xoá lớp học</span>
                                <span className="font-bold">{adm.permissions.canDeleteClass ? '✓ Có' : '✗ Cấm'}</span>
                              </div>

                              {/* Thêm học sinh */}
                              <div
                                className={`px-2 py-1 rounded flex items-center justify-between border ${
                                  adm.permissions.canAddStudent
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-rose-50/60 text-rose-700 border-rose-200'
                                }`}
                              >
                                <span>Thêm học sinh</span>
                                <span className="font-bold">{adm.permissions.canAddStudent ? '✓ Có' : '✗ Cấm'}</span>
                              </div>

                              {/* Xoá học sinh */}
                              <div
                                className={`px-2 py-1 rounded flex items-center justify-between border ${
                                  adm.permissions.canDeleteStudent
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-rose-50/60 text-rose-700 border-rose-200'
                                }`}
                              >
                                <span>Xoá học sinh</span>
                                <span className="font-bold">{adm.permissions.canDeleteStudent ? '✓ Có' : '✗ Cấm'}</span>
                              </div>

                              {/* Thời khóa biểu */}
                              <div
                                className={`px-2 py-1 rounded flex items-center justify-between border ${
                                  adm.permissions.canManageTimetable
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-rose-50/60 text-rose-700 border-rose-200'
                                }`}
                              >
                                <span>Thời khoá biểu</span>
                                <span className="font-bold">{adm.permissions.canManageTimetable ? '✓ Có' : '✗ Cấm'}</span>
                              </div>

                              {/* Nhập điểm & Điểm danh */}
                              <div
                                className={`px-2 py-1 rounded flex items-center justify-between border ${
                                  adm.permissions.canManageGrades && adm.permissions.canManageAttendance
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                              >
                                <span>Sổ điểm & Điểm danh</span>
                                <span className="font-bold">
                                  {adm.permissions.canManageGrades ? '✓ Có' : '✗'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Footer info */}
                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                          <span>Người cấp: <strong className="text-slate-600">{adm.grantedBy}</strong></span>
                          <span>{new Date(adm.grantedAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CREATE / EDIT DELEGATED ADMIN */}
          {activeTab === 'create' && (
            <form onSubmit={handleSaveSubmit} className="space-y-5 text-xs max-w-2xl mx-auto">
              {!isPrimaryAdmin && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Chỉ Thầy Nguyễn Đức Hoà mới có quyền phân quyền quản trị. Đăng nhập tài khoản Thầy Hoà để thực hiện.
                  </span>
                </div>
              )}

              {/* Step 1: Select Teacher or Enter Details */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3.5">
                <span className="font-bold text-slate-900 text-xs block uppercase tracking-wider">
                  1. Chọn Giáo Viên Hoặc Nhập Số Điện Thoại / Gmail
                </span>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Chọn nhanh từ danh sách Giáo viên trung tâm
                  </label>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => handleTeacherSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 outline-none focus:border-blue-500"
                    disabled={!isPrimaryAdmin}
                  >
                    <option value="">-- Hoặc nhập thông tin thủ công phía dưới --</option>
                    {teachers.map((tc) => (
                      <option key={tc.id} value={tc.id}>
                        {tc.name} ({tc.code}) - {tc.phone || 'Chưa SĐT'} - {tc.email || 'Chưa Email'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Họ và Tên Giáo Viên *
                    </label>
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="VD: Cô Trần Thị Mai"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-medium"
                      required
                      disabled={!isPrimaryAdmin}
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Số Điện Thoại (Đăng nhập)
                    </label>
                    <input
                      type="text"
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value)}
                      placeholder="0912..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-mono"
                      disabled={!isPrimaryAdmin}
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Gmail / Email (Đăng nhập)
                    </label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="giaovien@gmail.com"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                      disabled={!isPrimaryAdmin}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ghi Chú Phạm Vi Phân Quyền
                  </label>
                  <input
                    type="text"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="VD: Phụ trách quản lý học sinh và xếp lịch ca học, không có quyền xóa lớp"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                    disabled={!isPrimaryAdmin}
                  />
                </div>
              </div>

              {/* Step 2: Presets & Granular Permissions */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 text-xs block uppercase tracking-wider">
                    2. Cấu Hình Giới Hạn Tính Năng Của Quản Trị Viên
                  </span>

                  {/* Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyPreset('safe_admin')}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md border border-blue-200 cursor-pointer"
                      title="Cho phép thêm lớp, học sinh, xếp TKB; Khóa xoá lớp & học sinh"
                    >
                      🚀 Khuyên dùng (Trừ xoá)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('student_manager')}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md border border-emerald-200 cursor-pointer"
                    >
                      👥 Quản lý học sinh
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('timetable_manager')}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md border border-amber-200 cursor-pointer"
                    >
                      📅 Xếp thời khóa biểu
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('full_admin')}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-md border border-purple-200 cursor-pointer"
                    >
                      ⭐ Toàn quyền
                    </button>
                  </div>
                </div>

                {/* Group 1: Classes */}
                <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    Chức Năng Lớp Học
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={permissions.canAddClass}
                        onChange={(e) => setPermissions({ ...permissions, canAddClass: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600"
                        disabled={!isPrimaryAdmin}
                      />
                      <span className="font-semibold text-slate-800">Thêm lớp học</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={permissions.canDeleteClass}
                        onChange={(e) => setPermissions({ ...permissions, canDeleteClass: e.target.checked })}
                        className="rounded border-slate-300 text-rose-600"
                        disabled={!isPrimaryAdmin}
                      />
                      <span className="font-semibold text-rose-700">Xoá lớp học</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={permissions.canEditClass}
                        onChange={(e) => setPermissions({ ...permissions, canEditClass: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600"
                        disabled={!isPrimaryAdmin}
                      />
                      <span className="font-semibold text-slate-800">Sửa thông tin lớp</span>
                    </label>
                  </div>
                </div>

                {/* Group 2: Students */}
                <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    Chức Năng Học Sinh
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={permissions.canAddStudent}
                        onChange={(e) => setPermissions({ ...permissions, canAddStudent: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600"
                        disabled={!isPrimaryAdmin}
                      />
                      <span className="font-semibold text-slate-800">Thêm học sinh & Import</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={permissions.canDeleteStudent}
                        onChange={(e) => setPermissions({ ...permissions, canDeleteStudent: e.target.checked })}
                        className="rounded border-slate-300 text-rose-600"
                        disabled={!isPrimaryAdmin}
                      />
                      <span className="font-semibold text-rose-700">Xoá học sinh</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={permissions.canEditStudent}
                        onChange={(e) => setPermissions({ ...permissions, canEditStudent: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600"
                        disabled={!isPrimaryAdmin}
                      />
                      <span className="font-semibold text-slate-800">Sửa thông tin học sinh</span>
                    </label>
                  </div>
                </div>

                {/* Group 3: Timetable & Academic */}
                <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Chức Năng Thời Khóa Biểu & Học Vụ
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={permissions.canManageTimetable}
                        onChange={(e) => setPermissions({ ...permissions, canManageTimetable: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600"
                        disabled={!isPrimaryAdmin}
                      />
                      <span className="font-semibold text-slate-800">Thêm thời khoá biểu môn học</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={permissions.canManageGrades}
                        onChange={(e) => setPermissions({ ...permissions, canManageGrades: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600"
                        disabled={!isPrimaryAdmin}
                      />
                      <span className="font-semibold text-slate-800">Nhập & sửa sổ điểm</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={permissions.canManageAttendance}
                        onChange={(e) => setPermissions({ ...permissions, canManageAttendance: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600"
                        disabled={!isPrimaryAdmin}
                      />
                      <span className="font-semibold text-slate-800">Điểm danh ca học</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    handleResetForm();
                    setActiveTab('list');
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={!isPrimaryAdmin}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingAccount ? 'Lưu Thay Đổi Phân Quyền' : 'Xác Nhận Cấp Quyền Quản Trị'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
