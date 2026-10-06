import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Settings,
  Building,
  Database,
  Download,
  Upload,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  X,
  Users,
  Cloud,
  RefreshCw,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Phone,
  Mail,
  UserCheck,
  Calendar,
  BookOpen,
  Award,
  CalendarCheck,
  Info,
  Share2,
  QrCode,
  ExternalLink,
  Copy,
  Check,
  Eye,
  Sparkles,
} from 'lucide-react';
import { Room, DelegatedAdminAccount, Teacher } from '../../types/index.ts';
import { AdminDelegationModal } from './AdminDelegationModal.tsx';
import { ShareAppModal } from '../share/ShareAppModal.tsx';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportDataJson,
    importDataJson,
    resetToDefault,
    students,
    classes,
    teachers,
    rooms,
    addRoom,
    updateRoom,
    deleteRoom,
    autoSaveEnabled,
    setAutoSaveEnabled,
    multiTabSyncEnabled,
    setMultiTabSyncEnabled,
    showToastOnSave,
    setShowToastOnSave,
    lastSavedTime,
    isSaving,
    forceSyncNow,
    delegatedAdmins,
    updateDelegatedAdmin,
    revokeDelegatedAdmin,
    isPrimaryAdmin,
    currentUser,
    isShareModalOpen,
    setIsShareModalOpen,
    getShareableAppUrl,
  } = useApp();

  const [formData, setFormData] = useState(settings);
  const [importText, setImportText] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [copiedQuickLink, setCopiedQuickLink] = useState(false);

  // Delegated Admin modal state
  const [isDelegationModalOpen, setIsDelegationModalOpen] = useState(false);
  const [editingDelegationAccount, setEditingDelegationAccount] = useState<DelegatedAdminAccount | null>(null);
  const [prefillTeacherForDelegation, setPrefillTeacherForDelegation] = useState<Teacher | null>(null);

  // Room modal state
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomFormData, setRoomFormData] = useState<Partial<Room>>({
    name: '',
    capacity: 30,
    floor: 'Tầng 1',
    facilities: ['Máy lạnh', 'Bảng từ', 'Máy chiếu'],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleDownloadBackup = () => {
    const json = exportDataJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `educenter-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const ok = importDataJson(importText);
    if (ok) {
      alert('Đã khôi phục dữ liệu từ bản sao lưu thành công!');
      setImportText('');
    } else {
      alert('Dữ liệu JSON không hợp lệ. Vui lòng kiểm tra lại!');
    }
  };

  const handleReset = () => {
    if (
      window.confirm(
        'CẢNH BÁO: Thao tác này sẽ đặt lại toàn bộ hệ thống về dữ liệu mẫu chuẩn ban đầu. Bạn có chắc chắn muốn tiếp tục không?'
      )
    ) {
      resetToDefault();
      alert('Đã đặt lại dữ liệu mẫu thành công!');
    }
  };

  const handleOpenAddRoom = () => {
    setEditingRoom(null);
    setRoomFormData({
      name: '',
      capacity: 30,
      floor: 'Tầng 1',
      facilities: ['Máy lạnh', 'Bảng từ', 'Máy chiếu'],
    });
    setIsRoomModalOpen(true);
  };

  const handleOpenEditRoom = (r: Room) => {
    setEditingRoom(r);
    setRoomFormData({
      name: r.name,
      capacity: r.capacity,
      floor: r.floor,
      facilities: r.facilities || [],
    });
    setIsRoomModalOpen(true);
  };

  const handleDeleteRoom = (id: string, name: string) => {
    if (window.confirm(`Xác nhận xóa phòng học "${name}"?`)) {
      deleteRoom(id);
    }
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomFormData.name?.trim()) return;

    if (editingRoom) {
      updateRoom(editingRoom.id, {
        name: roomFormData.name.trim(),
        capacity: Number(roomFormData.capacity) || 20,
        floor: roomFormData.floor || 'Tầng 1',
        facilities: roomFormData.facilities || [],
      });
    } else {
      addRoom({
        id: `room-${Date.now()}`,
        name: roomFormData.name.trim(),
        capacity: Number(roomFormData.capacity) || 20,
        floor: roomFormData.floor || 'Tầng 1',
        facilities: roomFormData.facilities || ['Máy lạnh', 'Bảng từ'],
      });
    }
    setIsRoomModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span>Cấu Hình & Cơ Sở Vật Chất Hệ Thống</span>
          <span aria-hidden="true">·</span>
          <span>Dữ liệu lưu trữ an toàn</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mt-0.5">
          Cài Đặt Trung Tâm & Quản Lý Cơ Sở
        </h2>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Đã lưu thành công thông tin cấu hình hộ kinh doanh!</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 space-y-6 text-xs">
        {/* Center Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
            <Building className="w-4 h-4 text-blue-600" />
            <span>Thông Tin Pháp Nhân & Địa Chỉ Cơ Sở</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Tên Đơn Vị / Hộ Kinh Doanh (Hiển thị trên Phiếu Thu / Báo Cáo)</label>
              <input
                type="text"
                value={formData.centerName}
                onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-medium"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Khẩu Hiệu / Slogan</label>
              <input
                type="text"
                value={formData.centerSlogan}
                onChange={(e) => setFormData({ ...formData, centerSlogan: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Địa Chỉ Cơ Sở *</label>
              <input
                type="text"
                value={formData.centerAddress}
                onChange={(e) => setFormData({ ...formData, centerAddress: e.target.value })}
                placeholder="Cơ sở 1, 11 Trần Kiên, thôn 4, xã Ea Knốp, tỉnh Đăk Lăk"
                className="w-full px-3 py-2 border border-blue-200 rounded-lg outline-none font-semibold text-slate-900 bg-blue-50/30 focus:border-blue-500"
                required
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Địa chỉ áp dụng in trên hồ sơ giảng dạy, thời khóa biểu và các phiếu báo.
              </span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Hotline Liên Hệ</label>
              <input
                type="text"
                value={formData.centerPhone}
                onChange={(e) => setFormData({ ...formData, centerPhone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Email Liên Hệ</label>
              <input
                type="email"
                value={formData.centerEmail}
                onChange={(e) => setFormData({ ...formData, centerEmail: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
              />
            </div>

            <div className="sm:col-span-2 bg-blue-50/60 p-3 rounded-xl border border-blue-100">
              <label className="block text-blue-950 font-bold mb-1">
                Ngày Khai Giảng Năm Học / Trung Tâm (Mốc Tính Tuần 1 Chuẩn):
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <input
                  type="date"
                  value={formData.openingDate || '2026-09-07'}
                  onChange={(e) => setFormData({ ...formData, openingDate: e.target.value })}
                  className="px-3 py-2 bg-white border border-blue-300 rounded-lg outline-none font-bold text-blue-900 focus:border-blue-500"
                />
                <span className="text-[11px] text-blue-700">
                  * Tuần chứa ngày này sẽ được đồng nhất là <strong>Tuần 1</strong> trong phân phối chương trình, thời khóa biểu và lịch báo giảng toàn hệ thống.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Thông Tin Cấu Hình</span>
          </button>
        </div>
      </form>

      {/* Thông Tin Quản Trị Viên Hệ Thống */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-blue-700/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg overflow-hidden shrink-0 shadow">
              <img
                src="https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=200&h=200&q=80"
                alt="Thầy Nguyễn Đức Hoà"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Thầy Nguyễn Đức Hoà</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold uppercase">
                  Quản Trị Viên
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Chủ cơ sở & Quản lý điều hành Hộ kinh doanh Phan Nguyên
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-100 mt-2">
                <span>✉ Email: <strong className="font-mono text-white">duchoatnt@gmail.com</strong></span>
                <span>📱 SĐT / Zalo: <strong className="font-mono text-white">0945001262</strong> (0945.001.262)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs text-blue-200">
              Mật khẩu đăng nhập mặc định: <strong className="text-amber-300 font-mono">123456</strong>
            </div>

            {/* NÚT CHỨC NĂNG CHIA SẺ APP CHO MỌI NGƯỜI XEM TRONG MỤC QUẢN TRỊ CHÍNH */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 hover:from-emerald-600 hover:via-teal-600 hover:to-blue-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-2 transition-all cursor-pointer border border-white/20 active:scale-95"
              title="Chia sẻ đường dẫn liên kết & mã QR ứng dụng cho phụ huynh, học sinh và giáo viên xem thông tin"
            >
              <Share2 className="w-4 h-4 text-white" />
              <span>Chia Sẻ App Cho Mọi Người Xem</span>
            </button>
          </div>
        </div>
      </div>

      {/* Khung Chức Năng Chia Sẻ Ứng Dụng Nhanh (Dành Cho Mọi Người Xem / Phụ Huynh & Học Sinh) */}
      <div className="bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/50 p-5 rounded-2xl border border-indigo-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-slate-900 text-sm">
                  Liên Kết &amp; Mã QR Chia Sẻ Ứng Dụng (Chế Độ Xem Cho Mọi Người)
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                  Chỉ Xem · Tự Động Khóa Sửa Xóa
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Thầy Nguyễn Đức Hoà có thể chia sẻ liên kết này cho <strong>Phụ Huynh, Học Sinh và Giáo Viên</strong> mở trên điện thoại hoặc máy tính để tra cứu thời khóa biểu, lịch học, thông tin lớp học.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer whitespace-nowrap self-start md:self-auto"
          >
            <QrCode className="w-4 h-4" />
            <span>Mở Bảng QR &amp; Chi Tiết Chia Sẻ</span>
          </button>
        </div>

        {/* Quick Link Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <div className="flex-1 bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 select-all truncate shadow-2xs flex items-center gap-2">
            <span className="text-slate-400 shrink-0 text-[11px]">🔗 Link xem:</span>
            <span className="font-semibold text-blue-700 truncate">{getShareableAppUrl('viewer')}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={async () => {
                const url = getShareableAppUrl('viewer');
                try {
                  if (navigator.clipboard) {
                    await navigator.clipboard.writeText(url);
                  }
                  setCopiedQuickLink(true);
                  setTimeout(() => setCopiedQuickLink(false), 2500);
                } catch {
                  // ignore
                }
              }}
              className={`px-3 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                copiedQuickLink
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {copiedQuickLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedQuickLink ? 'Đã Sao Chép!' : 'Sao Chép Link'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.open(getShareableAppUrl('viewer'), '_blank')}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Mở xem thử giao diện người xem (Mở tab mới)"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Xem Thử</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500">
          <span className="flex items-center gap-1 text-emerald-700 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Bảo mật: Người xem không thể chỉnh sửa, thêm hoặc xóa dữ liệu
          </span>
          <span>·</span>
          <span className="flex items-center gap-1 text-blue-700 font-medium">
            <QrCode className="w-3.5 h-3.5 text-blue-600" />
            Hỗ trợ quét mã QR qua Zalo &amp; Camera điện thoại
          </span>
        </div>
      </div>

      {/* Quản Lý Cấp Quyền Quản Trị Viên Ủy Quyền (Thầy Nguyễn Đức Hoà Phân Quyền) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 text-xs shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Phân Quyền & Cấp Quyền Quản Trị Viên Ủy Quyền</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {delegatedAdmins.length} tài khoản ủy quyền
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Người quản trị chính: <strong className="text-slate-800">Thầy Nguyễn Đức Hoà</strong>. Thầy Hoà cấp quyền qua Số điện thoại hoặc Gmail và giới hạn các tính năng: thêm/xoá lớp học, thêm/xoá danh sách học sinh, thêm thời khoá biểu môn học.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingDelegationAccount(null);
              setPrefillTeacherForDelegation(null);
              setIsDelegationModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
            title="Thầy Nguyễn Đức Hoà cấp quyền quản trị cho giáo viên khác"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Cấp Quyền Cho Giáo Viên</span>
          </button>
        </div>

        {/* Danh Sách Giáo Viên Được Cấp Quyền */}
        {delegatedAdmins.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-700">Chưa có giáo viên nào được cấp quyền quản trị ủy quyền</p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Thầy Nguyễn Đức Hoà có thể bấm nút phía trên để cấp quyền quản trị cho giáo viên bằng Số điện thoại hoặc Gmail và giới hạn các quyền tương ứng.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {delegatedAdmins.map((da) => {
              const linkedT = teachers.find((t) => t.id === da.teacherId);
              return (
                <div
                  key={da.id}
                  className={`p-4 rounded-xl border transition-all ${
                    da.status === 'active'
                      ? 'bg-slate-50/70 border-slate-200 hover:bg-white hover:shadow-xs'
                      : 'bg-rose-50/40 border-rose-200 opacity-75'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Left: Info */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                        {da.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{da.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              da.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {da.status === 'active' ? 'Đang Hoạt Động' : 'Tạm Khóa'}
                          </span>
                          <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">
                            Ủy quyền bởi Thầy Hoà
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 mt-1">
                          {da.phone && (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <strong className="text-slate-800">{da.phone}</strong>
                            </span>
                          )}
                          {da.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="text-slate-800">{da.email}</span>
                            </span>
                          )}
                          {linkedT && (
                            <span className="text-slate-500">
                              (Giáo viên: {linkedT.specialty || linkedT.degree})
                            </span>
                          )}
                        </div>

                        {da.note && (
                          <p className="text-[11px] text-slate-500 mt-1 italic">
                            &quot;{da.note}&quot;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 self-end lg:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          updateDelegatedAdmin(da.id, {
                            status: da.status === 'active' ? 'suspended' : 'active',
                          });
                        }}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                          da.status === 'active'
                            ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        }`}
                        title={da.status === 'active' ? 'Tạm khóa quyền quản trị' : 'Mở khóa lại quyền'}
                      >
                        {da.status === 'active' ? 'Tạm Khóa' : 'Kích Hoạt'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingDelegationAccount(da);
                          setPrefillTeacherForDelegation(null);
                          setIsDelegationModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Chỉnh sửa quyền Thầy Hoà giới hạn"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Sửa Quyền</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Xác nhận THU HỒI quyền quản trị viên của "${da.name}"?`)) {
                            revokeDelegatedAdmin(da.id);
                          }
                        }}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                        title="Thu hồi quyền hoàn toàn"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Permissions detail matrix badges */}
                  <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                      Quyền Thầy Hoà cấp:
                    </span>

                    {/* Thêm lớp */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                        da.permissions.canAddClass
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-400 line-through'
                      }`}
                    >
                      {da.permissions.canAddClass ? '✓' : '✗'} Thêm lớp học
                    </span>

                    {/* Xóa lớp */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                        da.permissions.canDeleteClass
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 font-bold'
                          : 'bg-amber-50 text-amber-800 border border-amber-200 font-medium'
                      }`}
                    >
                      {da.permissions.canDeleteClass ? '✓ Cho phép xoá lớp' : '🔒 Cấm xoá lớp'}
                    </span>

                    {/* Thêm HS */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                        da.permissions.canAddStudent
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-400 line-through'
                      }`}
                    >
                      {da.permissions.canAddStudent ? '✓' : '✗'} Thêm học sinh
                    </span>

                    {/* Xóa HS */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                        da.permissions.canDeleteStudent
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 font-bold'
                          : 'bg-amber-50 text-amber-800 border border-amber-200 font-medium'
                      }`}
                    >
                      {da.permissions.canDeleteStudent ? '✓ Cho phép xoá học sinh' : '🔒 Cấm xoá học sinh'}
                    </span>

                    {/* Thêm thời khóa biểu */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                        da.permissions.canManageTimetable
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                          : 'bg-slate-100 text-slate-400 line-through'
                      }`}
                    >
                      {da.permissions.canManageTimetable ? '✓' : '✗'} Xếp thời khoá biểu môn học
                    </span>

                    {/* Điểm số */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                        da.permissions.canManageGrades
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-slate-100 text-slate-400 line-through'
                      }`}
                    >
                      {da.permissions.canManageGrades ? '✓' : '✗'} Sổ điểm
                    </span>

                    {/* Điểm danh */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                        da.permissions.canManageAttendance
                          ? 'bg-teal-50 text-teal-700 border border-teal-200'
                          : 'bg-slate-100 text-slate-400 line-through'
                      }`}
                    >
                      {da.permissions.canManageAttendance ? '✓' : '✗'} Điểm danh
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Read-only reminder for Parents & Students */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Quy định bảo mật & phân quyền:</strong> Học sinh và phụ huynh khi đăng nhập bằng SĐT hoặc Gmail của mình chỉ được xem thời khóa biểu, lịch học, điểm danh, sổ điểm và tài liệu, <strong>hoàn toàn không được chỉnh sửa</strong> bất kỳ dữ liệu nào của trung tâm.
          </span>
        </div>
      </div>

      {/* Quản Lý Danh Sách Phòng Học (Rooms Management) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>Quản Lý Phòng Học & Cơ Sở Vật Chất</span>
            <span className="text-[11px] text-slate-400 font-normal">({rooms.length} phòng)</span>
          </div>

          {/* NÚT THÊM PHÒNG HỌC */}
          <button
            onClick={handleOpenAddRoom}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Phòng Học</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rooms.map((r) => (
            <div
              key={r.id}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">{r.name}</h4>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 font-mono">
                    {r.floor}
                  </span>
                </div>

                <div className="mt-2 text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Sức chứa: <strong className="text-slate-800 font-mono">{r.capacity} học sinh</strong></span>
                  </div>

                  {r.facilities && r.facilities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {r.facilities.map((fac, idx) => (
                        <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                          {fac}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sửa / Xóa Phòng Học */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenEditRoom(r)}
                  className="px-2 py-0.5 text-slate-700 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded text-[11px] font-medium flex items-center gap-0.5 cursor-pointer transition-colors"
                  title="Sửa phòng học"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Sửa</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteRoom(r.id, r.name)}
                  className="px-2 py-0.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded text-[11px] font-medium flex items-center gap-0.5 cursor-pointer transition-colors"
                  title="Xóa phòng học"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Xóa</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-Update & Real-Time Sync Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Cloud className="w-4 h-4 text-blue-600" />
            <span>Cơ Chế Tự Động Cập Nhật & Lưu Trữ Dữ Liệu Thời Gian Thực</span>
          </div>
          <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            Đang hoạt động
          </span>
        </div>

        {syncNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{syncNotice}</span>
          </div>
        )}

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <span>Trạng thái: {autoSaveEnabled ? 'Tự động lưu tức thì' : 'Tạm tắt tự động lưu'}</span>
              {isSaving && (
                <span className="text-blue-600 flex items-center gap-1 text-[11px]">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Đang cập nhật...
                </span>
              )}
            </div>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Cập nhật gần nhất: {lastSavedTime ? lastSavedTime.toLocaleTimeString('vi-VN') + ' (' + lastSavedTime.toLocaleDateString('vi-VN') + ')' : 'Chưa ghi nhận'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              forceSyncNow();
              setSyncNotice('Đã đồng bộ và lưu toàn bộ thông tin mới nhất thành công!');
              setTimeout(() => setSyncNotice(null), 3000);
            }}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Zap className="w-4 h-4 text-amber-300" /> Cập Nhật & Lưu Ngay
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="p-3 border border-slate-200 rounded-xl bg-white flex items-center justify-between gap-2 cursor-pointer hover:border-blue-300 transition-colors">
            <div>
              <span className="font-bold text-slate-800 block text-xs">Tự động cập nhật</span>
              <span className="text-[10px] text-slate-500">Lưu ngay khi thay đổi</span>
            </div>
            <input
              type="checkbox"
              checked={autoSaveEnabled}
              onChange={(e) => setAutoSaveEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </label>

          <label className="p-3 border border-slate-200 rounded-xl bg-white flex items-center justify-between gap-2 cursor-pointer hover:border-blue-300 transition-colors">
            <div>
              <span className="font-bold text-slate-800 block text-xs">Đồng bộ đa tab</span>
              <span className="text-[10px] text-slate-500">Đồng bộ giữa các tab</span>
            </div>
            <input
              type="checkbox"
              checked={multiTabSyncEnabled}
              onChange={(e) => setMultiTabSyncEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </label>

          <label className="p-3 border border-slate-200 rounded-xl bg-white flex items-center justify-between gap-2 cursor-pointer hover:border-blue-300 transition-colors">
            <div>
              <span className="font-bold text-slate-800 block text-xs">Thông báo Toast</span>
              <span className="text-[10px] text-slate-500">Báo hiệu khi lưu</span>
            </div>
            <input
              type="checkbox"
              checked={showToastOnSave}
              onChange={(e) => setShowToastOnSave(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </label>
        </div>
      </div>

      {/* Backup & Restore Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
          <Database className="w-4 h-4 text-purple-600" />
          <span>Sao Lưu & Phục Hồi Dữ Liệu</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="font-bold text-slate-900">Xuất Dữ Liệu Sao Lưu (JSON)</div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Tải về toàn bộ cơ sở dữ liệu gồm {students.length} học sinh, {classes.length} lớp học, {teachers.length} giáo viên, phòng học và tài liệu để lưu trữ an toàn.
            </p>
            <button
              onClick={handleDownloadBackup}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" /> Tải Bản Sao Lưu JSON
            </button>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="font-bold text-slate-900">Khôi Phục Dữ Liệu Từ JSON</div>
            <textarea
              rows={2}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Dán nội dung tệp JSON sao lưu vào đây..."
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg outline-none font-mono text-[11px]"
            />
            <button
              onClick={handleImport}
              disabled={!importText.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" /> Nhập Dữ Liệu
            </button>
          </div>
        </div>

        {/* Reset */}
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900">
          <div>
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Khôi Phục Dữ Liệu Mẫu Ban Đầu</span>
            </div>
            <p className="text-[11px] text-rose-700 mt-0.5">
              Khôi phục lại toàn bộ dữ liệu mẫu đầy đủ cho 8 môn học, 12 lớp, 35 học sinh và lịch học.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-4 h-4" /> Đặt Lại Mặc Định
          </button>
        </div>
      </div>

      {/* Modal: Thêm / Sửa Phòng Học */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden text-xs">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingRoom ? 'Chỉnh Sửa Phòng Học' : 'Thêm Phòng Học Mới'}
              </h3>
              <button
                onClick={() => setIsRoomModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="p-5 space-y-3.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tên Phòng Học *</label>
                <input
                  type="text"
                  placeholder="VD: Phòng 201 (VIP), Hội trường A"
                  value={roomFormData.name || ''}
                  onChange={(e) => setRoomFormData({ ...roomFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Sức Chứa (Học Sinh)</label>
                  <input
                    type="number"
                    min="5"
                    max="200"
                    value={roomFormData.capacity || 25}
                    onChange={(e) => setRoomFormData({ ...roomFormData, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tầng / Vị Trí</label>
                  <input
                    type="text"
                    placeholder="VD: Tầng 2, Dãy B"
                    value={roomFormData.floor || ''}
                    onChange={(e) => setRoomFormData({ ...roomFormData, floor: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Trang Thiết Bị (Cách nhau bởi dấu phẩy)</label>
                <input
                  type="text"
                  placeholder="Máy lạnh, Máy chiếu, Bảng từ, TV 65 inch"
                  value={roomFormData.facilities?.join(', ') || ''}
                  onChange={(e) =>
                    setRoomFormData({
                      ...roomFormData,
                      facilities: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingRoom ? 'Lưu Thay Đổi' : 'Thêm Phòng'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cấp & Chỉnh Sửa Quyền Quản Trị Viên Ủy Quyền */}
      <AdminDelegationModal
        isOpen={isDelegationModalOpen}
        onClose={() => {
          setIsDelegationModalOpen(false);
          setEditingDelegationAccount(null);
          setPrefillTeacherForDelegation(null);
        }}
        editingAccount={editingDelegationAccount}
        prefillTeacher={prefillTeacherForDelegation}
      />
    </div>
  );
};
