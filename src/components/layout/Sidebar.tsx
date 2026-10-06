import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Layers,
  Users,
  Award,
  Briefcase,
  Sparkles,
  Settings,
  GraduationCap,
  ExternalLink,
  Bell,
  FileText,
  KeyRound,
  LogIn,
  LogOut,
  Share2,
} from 'lucide-react';

interface SidebarProps {
  onOpenLogin?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenLogin }) => {
  const { activeTab, setActiveTab, classes, students, teachers, currentUser, logout, setIsShareModalOpen } = useApp();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Tổng Quan',
      icon: LayoutDashboard,
      description: 'Chỉ số & ca học hôm nay',
    },
    {
      id: 'timetable',
      label: 'Thời Khóa Biểu',
      icon: CalendarDays,
      description: 'Lịch học theo phòng & ca',
    },
    {
      id: 'schedule_reminders',
      label: 'Lịch Học & Nhắc Nhở',
      icon: Bell,
      description: 'Nhắc nhở tự động trước giờ học',
    },
    {
      id: 'materials',
      label: 'Kho Bài Giảng & Tài Liệu',
      icon: FileText,
      description: 'PDF, Word, Video, Slide',
    },
    {
      id: 'classes',
      label: 'Quản Lý Lớp Học',
      icon: BookOpen,
      count: classes.length,
      description: 'Danh sách lớp & sĩ số',
    },
    {
      id: 'subjects',
      label: 'Môn Học & Khóa',
      icon: Layers,
      description: 'Toán, Lý, Hóa, Anh, Văn...',
    },
    {
      id: 'students',
      label: 'Quản Lý Học Sinh',
      icon: Users,
      count: students.length,
      description: 'Phân loại môn/lớp & hồ sơ',
    },
    {
      id: 'grades',
      label: 'Sổ Điểm & Tiến Bộ',
      icon: Award,
      description: 'Điểm 15p, 1 tiết, thi thử',
    },
    {
      id: 'teachers',
      label: 'Giáo viên',
      icon: Briefcase,
      count: teachers.length,
      description: 'Hồ sơ giáo viên & lớp phụ trách',
    },
    {
      id: 'parent_portal',
      label: 'Cổng Tra Cứu Phụ Huynh',
      icon: ExternalLink,
      description: 'Giao diện tra cứu nhanh',
      highlight: true,
    },
    {
      id: 'ai_assistant',
      label: 'Trợ Lý Giáo Viên AI',
      icon: Sparkles,
      description: 'Soạn đề thi & nhận xét học sinh',
      highlightAi: true,
    },
    {
      id: 'settings',
      label: 'Cài Đặt & Dữ Liệu',
      icon: Settings,
      description: 'VietQR, sao lưu, thông tin',
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow">
          <GraduationCap className="w-5 h-5 text-amber-300" />
        </div>
        <div>
          <div className="text-sm font-bold text-white tracking-tight uppercase">PHAN NGUYÊN</div>
          <div className="text-[11px] text-blue-300 font-medium truncate max-w-[170px]">Hộ Kinh Doanh Phan Nguyên</div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Chức Năng Chính
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : item.highlight
                  ? 'text-amber-300 hover:bg-slate-800/80 hover:text-amber-200'
                  : item.highlightAi
                  ? 'text-indigo-300 hover:bg-slate-800/80 hover:text-indigo-200'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {/* Status / Count indicator */}
              <div className="flex items-center gap-1.5 ml-2">
                {item.count !== undefined && !isActive && (
                  <span className="text-[10px] font-mono tabular-nums text-slate-400 group-hover:text-slate-300">
                    {item.count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Nút Chia Sẻ App Cho Mọi Người Xem */}
      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={() => setIsShareModalOpen(true)}
          className="w-full py-2 px-3 bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-600 hover:to-teal-600 border border-emerald-500/30 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer group active:scale-95"
          title="Chia sẻ đường dẫn liên kết & mã QR ứng dụng cho mọi người xem"
        >
          <Share2 className="w-3.5 h-3.5 text-emerald-300 group-hover:scale-110 transition-transform" />
          <span>Chia Sẻ App Cho Mọi Người</span>
        </button>
      </div>

      {/* User Account Quick Card */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        {currentUser ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden shadow-xs">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  currentUser.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate max-w-[115px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-blue-400 font-medium truncate max-w-[115px]">
                  {currentUser.isPrimaryAdmin || currentUser.id === 'usr-admin-01'
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
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onOpenLogin?.()}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Đổi tài khoản đăng nhập (Email/SĐT)"
              >
                <KeyRound className="w-4 h-4 text-blue-400" />
              </button>
              <button
                type="button"
                onClick={() => logout()}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Đăng xuất khỏi hệ thống"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onOpenLogin?.()}
            className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Đăng Nhập Hệ Thống</span>
          </button>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <div>
          <span className="text-slate-300 font-medium">Hệ Thống Đang Chạy</span>
          <div className="text-[10px] text-slate-500">Phiên bản 2026.1 · Sẵn sàng</div>
        </div>
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>
    </aside>
  );
};
