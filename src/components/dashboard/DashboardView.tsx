import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Users,
  BookOpen,
  DollarSign,
  AlertCircle,
  CalendarCheck,
  CheckCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Award,
  ChevronRight,
  Calendar,
  AlertTriangle,
  School,
  Sparkles,
  Share2,
} from 'lucide-react';
import { formatVND, getDayOfWeekName } from '../../utils/formatters.ts';
import { BrandBanner } from '../layout/BrandBanner.tsx';

interface DashboardViewProps {
  onOpenAttendanceModal: (classId?: string) => void;
  onOpenStudentModal: (studentId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAttendanceModal,
  onOpenStudentModal,
}) => {
  const {
    students,
    classes,
    teachers,
    subjects,
    attendance,
    rooms,
    materials,
    sessions,
    setActiveTab,
    setSelectedClassId,
    setIsShareModalOpen,
  } = useApp();

  // Current Day of Week in JS (0 is Sunday -> convert to our 8; 1 is Monday -> 2, etc.)
  const today = new Date();
  const dayIndex = today.getDay(); // 0 (CN), 1 (T2), ..., 6 (T7)
  const currentDayNum = dayIndex === 0 ? 8 : dayIndex + 1;
  const todayStr = today.toISOString().split('T')[0];

  // Classes occurring today
  const todayClasses = classes.filter((c) => c.daysOfWeek.includes(currentDayNum) && c.status === 'active');

  // Today Attendance count
  const todayAttendanceRecords = attendance.filter((a) => a.sessionDate === todayStr);
  const presentCount = todayAttendanceRecords.filter((a) => a.status === 'present').length;
  const attendanceRate = todayAttendanceRecords.length > 0
    ? Math.round((presentCount / todayAttendanceRecords.length) * 100)
    : 96;

  // Multi-subject distribution
  const subjectDistribution = subjects.map((subj) => {
    const subjClasses = classes.filter((c) => c.subjectId === subj.id);
    const studentCount = new Set(subjClasses.flatMap((c) => c.studentIds)).size;
    return {
      subject: subj,
      classCount: subjClasses.length,
      studentCount,
    };
  }).sort((a, b) => b.studentCount - a.studentCount);

  return (
    <div className="space-y-6 pb-12">
      {/* Main Brand Banner: HỘ KINH DOANH PHAN NGUYÊN */}
      <BrandBanner />

      {/* Top Header & Quick Actions Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>{getDayOfWeekName(currentDayNum)}</span>
            <span aria-hidden="true">·</span>
            <span>Ngày {today.toLocaleDateString('vi-VN')}</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-600 font-semibold">Trung tâm đang hoạt động bình thường</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Bảng Điều Khiển Trung Tâm Đa Môn
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('ai_assistant')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span>Trợ Lý AI & Tạo Đề</span>
          </button>
          <button
            onClick={() => setActiveTab('schedule_reminders')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Nhắc Lịch Ca Học</span>
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Kho Bài Giảng</span>
          </button>
          {/* Nút Chia Sẻ App Cho Mọi Người Xem */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-lg shadow-2xs transition-all cursor-pointer active:scale-95"
            title="Chia sẻ đường dẫn liên kết & mã QR cho phụ huynh và học sinh xem thời khóa biểu, lịch học"
          >
            <Share2 className="w-4 h-4 text-white" />
            <span>Chia Sẻ App</span>
          </button>
          <button
            onClick={() => onOpenAttendanceModal()}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Điểm Danh Ca Học</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Students */}
        <div
          onClick={() => setActiveTab('students')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tổng Học Sinh Theo Học</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {students.length}
            </span>
            <span className="text-xs text-emerald-600 font-medium flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> 100% hoạt động
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {classes.length} lớp học · {subjects.length} môn giảng dạy
          </div>
        </div>

        {/* Card 2: Materials Repository */}
        <div
          onClick={() => setActiveTab('materials')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Kho Bài Giảng & Học Liệu</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 font-mono tabular-nums">
              {materials.length}
            </span>
            <span className="text-xs text-slate-500 font-normal">tài liệu</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span>PDF, Word, Slide & Video giảng dạy</span>
          </div>
        </div>

        {/* Card 3: Attendance Rate */}
        <div
          onClick={() => onOpenAttendanceModal()}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tỷ Lệ Chuyên Cần</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 font-mono tabular-nums">
              {attendanceRate}%
            </span>
            <span className="text-xs text-emerald-600 font-medium">chuyên cần</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {presentCount} học sinh có mặt hôm nay
          </div>
        </div>

        {/* Card 4: Teachers & Classes Today */}
        <div
          onClick={() => setActiveTab('timetable')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Ca Học Hôm Nay</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-700 font-mono tabular-nums">
              {todayClasses.length} lớp
            </span>
            <span className="text-xs text-slate-500">
              ({teachers.length} giáo viên)
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {rooms.length} phòng học hoạt động
          </div>
        </div>
      </div>

      {/* Main Content Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Classes Timeline & Live Monitoring */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Schedule Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Lịch Học & Giảng Dạy Hôm Nay ({getDayOfWeekName(currentDayNum)})
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('timetable')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                Xem toàn bộ TKB tuần <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {todayClasses.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Hôm nay không có ca học nào được xếp lịch.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 mt-2">
                {todayClasses.map((cls) => {
                  const teacher = teachers.find((t) => t.id === cls.teacherId);
                  const room = rooms.find((r) => r.id === cls.roomId);
                  const subject = subjects.find((s) => s.id === cls.subjectId);
                  const classAttendance = attendance.filter(
                    (a) => a.classId === cls.id && a.sessionDate === todayStr
                  );
                  const isChecked = classAttendance.length > 0;

                  return (
                    <div
                      key={cls.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs font-mono font-bold text-center shrink-0">
                          <div>{cls.timeSlot.start}</div>
                          <div className="text-[10px] text-blue-500 font-normal">đến {cls.timeSlot.end}</div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">
                              {cls.name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              ({cls.code})
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                            <span>Môn: <strong className="text-slate-700 font-medium">{subject?.name}</strong></span>
                            <span aria-hidden="true">·</span>
                            <span>GV: <strong className="text-slate-700 font-medium">{teacher?.name}</strong></span>
                            <span aria-hidden="true">·</span>
                            <span>Phòng: <strong className="text-slate-700 font-medium">{room?.name}</strong></span>
                            <span aria-hidden="true">·</span>
                            <span>Sĩ số: <strong className="text-slate-700 font-mono tabular-nums">{cls.studentIds.length}/{cls.maxCapacity}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {isChecked ? (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Đã điểm danh ({classAttendance.filter((a) => a.status === 'present').length}/{cls.studentIds.length})</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedClassId(cls.id);
                              onOpenAttendanceModal(cls.id);
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-sm"
                          >
                            Điểm Danh Ngay
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Subject Distribution & Overview */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <School className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Quy Mô & Phân Bổ Học Sinh Theo Môn Học
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('subjects')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                Quản lý môn học <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {subjectDistribution.map(({ subject, classCount, studentCount }) => (
                <div
                  key={subject.id}
                  onClick={() => setActiveTab('classes')}
                  className="p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                    <span className="truncate">{subject.name}</span>
                    <span className="text-[11px] font-mono text-slate-400">({subject.code})</span>
                  </div>
                  <div className="mt-2 text-lg font-bold text-slate-800 font-mono tabular-nums">
                    {studentCount} <span className="text-xs font-normal text-slate-500">học sinh</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {classCount} lớp đang giảng dạy
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Urgent Attention, Financial Alerts & AI Assistant Promo */}
        <div className="space-y-6">
          {/* AI Teaching Assistant Banner */}
          <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white p-5 rounded-xl border border-indigo-700/50 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Trợ Lý AI Giáo Viên
            </div>
            <h4 className="text-base font-bold text-white mt-1.5">
              Soạn Ma Trận Đề & Nhận Xét Nhanh
            </h4>
            <p className="text-xs text-slate-200 mt-1 leading-relaxed">
              Tạo đề thi trắc nghiệm theo môn & gửi tin nhắn nhận xét học bạ Zalo cá nhân hóa cho phụ huynh chỉ trong 3 giây.
            </p>
            <button
              onClick={() => setActiveTab('ai_assistant')}
              className="mt-3.5 w-full py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors text-center cursor-pointer shadow"
            >
              Mở Trợ Lý AI Ngay
            </button>
          </div>

          {/* Recent Materials List */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Tài Liệu & Bài Giảng Mới ({materials.length})
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('materials')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
              >
                Xem tất cả
              </button>
            </div>

            {materials.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                Chưa có tài liệu nào trong kho.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs mt-2">
                {materials.slice(0, 5).map((mat) => {
                  const subj = subjects.find((s) => s.id === mat.subjectId);
                  return (
                    <div
                      key={mat.id}
                      onClick={() => setActiveTab('materials')}
                      className="py-2.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer rounded px-1 transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-slate-800 truncate text-xs">
                          {mat.title}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {subj?.name} · Khối {mat.gradeLevel} · {mat.fileSize}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono uppercase bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded border border-blue-100 shrink-0">
                        {mat.fileType}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Center Info Summary */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs text-slate-600 space-y-2">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <School className="w-4 h-4 text-blue-600" />
              <span>Tiện ích & Quy chuẩn trung tâm</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Hệ thống tự động đồng bộ thời khóa biểu, điểm danh, kho bài giảng học liệu và gửi thông báo nhắc lịch học tự động 24/7.
            </p>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Tổng phòng học:</span>
              <strong className="text-slate-800 font-mono tabular-nums">{rooms.length} phòng</strong>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Giáo viên trực thuộc:</span>
              <strong className="text-slate-800 font-mono tabular-nums">{teachers.length} thầy cô</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
