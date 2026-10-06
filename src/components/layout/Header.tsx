import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { AutoUpdateModal } from './AutoUpdateModal.tsx';
import {
  Search,
  Plus,
  Bell,
  GraduationCap,
  CalendarCheck,
  UserPlus,
  BookOpen,
  UserCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Sparkles,
  Cloud,
  RefreshCw,
  Zap,
  LogOut,
  UserCircle,
  Shield,
  User,
  LogIn,
  KeyRound,
  Share2,
} from 'lucide-react';
import { LoginView } from '../auth/LoginView.tsx';
import { ShareAppModal } from '../share/ShareAppModal.tsx';

interface HeaderProps {
  onOpenQuickAttendance: () => void;
  onOpenNewStudent: () => void;
  onOpenNewClass: () => void;
  onOpenLoginModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenQuickAttendance,
  onOpenNewStudent,
  onOpenNewClass,
  onOpenLoginModal,
}) => {
  const {
    settings,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    notifications,
    students,
    autoSaveEnabled,
    lastSavedTime,
    isSaving,
    forceSyncNow,
    currentUser,
    logout,
    canPerform,
    isPrimaryAdmin,
    isShareModalOpen,
    setIsShareModalOpen,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isAutoUpdateModalOpen, setIsAutoUpdateModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const totalUnreadCount = notifications.length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left Zone: Brand & Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-sm font-bold text-base">
              <GraduationCap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 leading-tight uppercase">
                {settings.centerName || 'HỘ KINH DOANH PHAN NGUYÊN'}
              </h1>
              <p className="text-[11px] text-blue-700 font-semibold hidden sm:block">
                {settings.centerSlogan || 'Kiến Tạo Tư Duy - Bứt Phá Điểm Số - Đồng Hành Cùng Tương Lai'}
              </p>
            </div>
          </div>
        </div>

        {/* Center Zone: Quick Search & Navigation Bar Shortcut */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm nhanh học sinh, mã số, lớp học, giáo viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-400 rounded-lg outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
          </div>
        </div>

        {/* Right Zone: Actions, Parent Portal Mode, AI Assistant, Notifications, Quick Action */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Auto-Update & Persistence Status Badge */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsAutoUpdateModalOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                isSaving
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : autoSaveEnabled
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 shadow-2xs'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
              title="Trung tâm Tự Động Cập Nhật & Lưu Trữ Dữ Liệu (Nhấp để xem/quản lý)"
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              ) : autoSaveEnabled ? (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              )}
              <span className="hidden md:inline font-semibold">
                {isSaving ? 'Đang lưu...' : autoSaveEnabled ? 'Tự động lưu: BẬT' : 'Tự động lưu: TẮT'}
              </span>
              {lastSavedTime && !isSaving && (
                <span className="hidden xl:inline text-[11px] text-emerald-600 font-normal">
                  ({lastSavedTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})
                </span>
              )}
            </button>

            {/* Instant force sync button */}
            <button
              onClick={() => forceSyncNow()}
              disabled={isSaving}
              className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Cập nhật & lưu dữ liệu ngay lập tức"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
            </button>
          </div>

          {/* AI Teaching Assistant quick shortcut */}
          <button
            onClick={() => setActiveTab(activeTab === 'ai_assistant' ? 'dashboard' : 'ai_assistant')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              activeTab === 'ai_assistant'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-indigo-50/80 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Trợ Lý AI & Tạo Đề</span>
          </button>

          {/* Mode Switcher: Parent Portal quick preview */}
          <button
            onClick={() => setActiveTab(activeTab === 'parent_portal' ? 'dashboard' : 'parent_portal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              activeTab === 'parent_portal'
                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cổng Phụ Huynh</span>
          </button>

          {/* Nút Chia Sẻ App Cho Mọi Người Xem */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-emerald-600 shadow-2xs active:scale-95"
            title="Chia sẻ đường dẫn liên kết & mã QR ứng dụng cho mọi người xem (Phụ huynh, học sinh, giáo viên)"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Chia Sẻ App</span>
          </button>

          {/* Notifications dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowQuickActions(false);
              }}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Thông báo hệ thống"
            >
              <Bell className="w-4 h-4" />
              {totalUnreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900">Thông Báo & Nhắc Việc</span>
                  <span className="text-xs text-slate-500 font-mono tabular-nums">{totalUnreadCount} mục</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {notifications.slice(0, 8).map((n) => (
                    <div key={n.id} className="p-3 hover:bg-slate-50 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-800">{n.type === 'attendance' ? 'Đã gửi điểm danh' : 'Thông báo Zalo'}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-2">{n.message}</p>
                      </div>
                    </div>
                  ))}
                  {totalUnreadCount === 0 && (
                    <div className="p-6 text-center text-slate-400">Không có thông báo mới nào</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Create Dropdown (Ẩn hoàn toàn với Phụ Huynh & Học Sinh) */}
          {currentUser && currentUser.role !== 'parent' && currentUser.role !== 'student' && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowQuickActions(!showQuickActions);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Tác Vụ Nhanh</span>
              </button>

              {showQuickActions && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
                  {canPerform('canManageAttendance') && (
                    <button
                      onClick={() => {
                        setShowQuickActions(false);
                        onOpenQuickAttendance();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <CalendarCheck className="w-4 h-4 text-blue-600" />
                      <span>Điểm danh ca học hôm nay</span>
                    </button>
                  )}
                  {canPerform('canAddStudent') && (
                    <button
                      onClick={() => {
                        setShowQuickActions(false);
                        onOpenNewStudent();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4 text-emerald-600" />
                      <span>Tiếp nhận học sinh mới</span>
                    </button>
                  )}
                  {canPerform('canAddClass') && (
                    <button
                      onClick={() => {
                        setShowQuickActions(false);
                        onOpenNewClass();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-purple-600" />
                      <span>Mở lớp học mới</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowQuickActions(false);
                      setActiveTab('ai_assistant');
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2.5 transition-colors border-t border-slate-100 cursor-pointer"
                  >
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    <span>Trợ lý AI soạn đề & nhận xét</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* User Account Profile / Login Button */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                  setShowQuickActions(false);
                }}
                className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer bg-white"
                title="Tài khoản người dùng (Nhấp để đổi tài khoản hoặc đăng xuất)"
              >
                <div className="w-7 h-7 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden shadow-2xs">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    currentUser.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px]">
                    {currentUser.name}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${
                      isPrimaryAdmin
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : currentUser.role === 'sub_admin'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : currentUser.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : currentUser.role === 'teacher'
                        ? 'bg-blue-100 text-blue-700'
                        : currentUser.role === 'parent'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {isPrimaryAdmin
                        ? 'Quản Trị Chính'
                        : currentUser.role === 'sub_admin'
                        ? 'Quản Trị Ủy Quyền'
                        : currentUser.role === 'admin'
                        ? 'Quản Trị Viên'
                        : currentUser.role === 'teacher'
                        ? 'Giáo Viên'
                        : currentUser.role === 'parent'
                        ? 'Phụ Huynh (Chỉ xem)'
                        : currentUser.role === 'student'
                        ? 'Học Sinh (Chỉ xem)'
                        : 'Nhân Viên'}
                    </span>
                  </div>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-68 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="pb-3 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden shadow-sm">
                      {currentUser.avatar ? (
                        <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                      ) : (
                        currentUser.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.email || currentUser.phone || 'Chưa cập nhật'}</p>
                      <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {currentUser.title || (currentUser.role === 'admin' ? 'Chủ cơ sở Phan Nguyên' : 'Thành viên hệ thống')}
                      </span>
                    </div>
                  </div>

                  <div className="py-2 space-y-1 text-xs">
                    {currentUser.role === 'teacher' && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setActiveTab('teachers');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                      >
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                        <span>Hồ sơ &amp; Lớp dạy của tôi</span>
                      </button>
                    )}
                    {currentUser.role === 'parent' && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setActiveTab('parent_portal');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                      >
                        <User className="w-4 h-4 text-amber-600" />
                        <span>Cổng thông tin con tôi</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setIsShareModalOpen(true);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 text-emerald-800 flex items-center gap-2 font-semibold cursor-pointer transition-colors"
                    >
                      <Share2 className="w-4 h-4 text-emerald-600" />
                      <span>Chia Sẻ App Cho Mọi Người Xem</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        if (onOpenLoginModal) {
                          onOpenLoginModal();
                        } else {
                          setIsLoginModalOpen(true);
                        }
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-blue-700 hover:bg-blue-50 flex items-center gap-2 font-semibold cursor-pointer transition-colors"
                    >
                      <KeyRound className="w-4 h-4 text-blue-600" />
                      <span>Đổi Tài Khoản / Đăng Nhập Email, SĐT</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full text-left px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng Xuất Hệ Thống</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                if (onOpenLoginModal) {
                  onOpenLoginModal();
                } else {
                  setIsLoginModalOpen(true);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng Nhập</span>
            </button>
          )}
        </div>
      </div>

      {/* Auto-Update Management Modal */}
      <AutoUpdateModal
        isOpen={isAutoUpdateModalOpen}
        onClose={() => setIsAutoUpdateModalOpen(false)}
      />

      {/* Login / Switch Account Modal */}
      {isLoginModalOpen && (
        <LoginView
          isModal
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={() => setIsLoginModalOpen(false)}
        />
      )}
    </header>
  );
};
