import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  BookOpen,
  Plus,
  Search,
  Users,
  User,
  MapPin,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  CalendarCheck,
  Eye,
  Upload,
  AlertTriangle,
  Building,
  RotateCcw,
} from 'lucide-react';
import { getDayOfWeekName } from '../../utils/formatters.ts';
import { ClassRoom } from '../../types/index.ts';
import { ImportStudentsModal } from './ImportStudentsModal.tsx';
import { RoomManagementModal } from './RoomManagementModal.tsx';
import { ClassScheduleRescheduleModal } from './ClassScheduleRescheduleModal.tsx';

interface ClassesViewProps {
  onOpenClassModal: (cls?: ClassRoom) => void;
  onOpenAttendanceModal: (classId: string) => void;
  onOpenClassDetailModal: (cls: ClassRoom) => void;
}

export const ClassesView: React.FC<ClassesViewProps> = ({
  onOpenClassModal,
  onOpenAttendanceModal,
  onOpenClassDetailModal,
}) => {
  const { classes, subjects, teachers, rooms, deleteClass, canPerform, currentUser } = useApp();
  const isReadOnlyUser = currentUser?.role === 'parent' || currentUser?.role === 'student';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // State for importing student list from computer
  const [importingClass, setImportingClass] = useState<ClassRoom | null>(null);

  // State for delete confirmation modal
  const [classToDelete, setClassToDelete] = useState<ClassRoom | null>(null);

  // State for room management modal
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  // State for reschedule / makeup session modal
  const [rescheduleClass, setRescheduleClass] = useState<ClassRoom | null>(null);

  const filteredClasses = classes.filter((cls) => {
    const matchSearch =
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSubj = filterSubject === 'all' || cls.subjectId === filterSubject;
    const matchGrade = filterGrade === 'all' || cls.gradeLevel === filterGrade;
    return matchSearch && matchSubj && matchGrade;
  });

  const confirmDeleteClass = () => {
    if (classToDelete) {
      deleteClass(classToDelete.id);
      setClassToDelete(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Danh Sách Lớp Học Đang Mở</span>
              <span aria-hidden="true">·</span>
              <span>{filteredClasses.length} lớp học</span>
              <span aria-hidden="true">·</span>
              <span className="text-blue-700 font-semibold">Năm học 2026 - 2027</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              Quản Lý Lớp Học, Phòng & Lịch Giảng Dạy
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switch */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Dạng Thẻ
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bảng Chi Tiết
              </button>
            </div>

            {/* Quản lý / Sửa tên phòng học */}
            {!isReadOnlyUser && canPerform('canEditClass') && (
              <button
                type="button"
                onClick={() => setIsRoomModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                title="Thêm và chỉnh sửa tên các phòng học trong trung tâm"
              >
                <Building className="w-3.5 h-3.5 text-blue-600" />
                <span>Phòng Học ({rooms.length})</span>
              </button>
            )}

            {/* Quick Import from Computer button */}
            {!isReadOnlyUser && canPerform('canAddStudent') && (
              <button
                type="button"
                onClick={() => setImportingClass(classes[0] || null)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                title="Add danh sách học sinh từ máy tính vào một lớp"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Nhập HS Từ Máy Tính</span>
              </button>
            )}

            {/* Thêm Lớp Mới Button */}
            {!isReadOnlyUser && canPerform('canAddClass') && (
              <button
                type="button"
                onClick={() => onOpenClassModal()}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Lớp Mới</span>
              </button>
            )}
          </div>
        </div>

        {/* Read-Only Notice for Parents & Students */}
        {isReadOnlyUser && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Chế độ xem dành cho Phụ huynh & Học sinh:</strong> Bạn có thể theo dõi thời khóa biểu, lịch học và sĩ số các lớp (Không có quyền chỉnh sửa, thêm hoặc xóa).
            </span>
          </div>
        )}

        {/* Delegated Admin Permissions Badge Banner */}
        {currentUser?.role === 'sub_admin' && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
              <span>
                <strong>Quản trị viên ủy quyền (bởi Thầy Hoà):</strong> Bạn có quyền:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 font-semibold text-[11px]">
              <span className={`px-2 py-0.5 rounded ${canPerform('canAddClass') ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500 line-through'}`}>
                {canPerform('canAddClass') ? '✓' : '✗'} Thêm lớp
              </span>
              <span className={`px-2 py-0.5 rounded ${canPerform('canDeleteClass') ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                {canPerform('canDeleteClass') ? '✓ Cho phép xoá lớp' : '🔒 Cấm xoá lớp'}
              </span>
              <span className={`px-2 py-0.5 rounded ${canPerform('canAddStudent') ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500 line-through'}`}>
                {canPerform('canAddStudent') ? '✓' : '✗'} Thêm HS
              </span>
              <span className={`px-2 py-0.5 rounded ${canPerform('canDeleteStudent') ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                {canPerform('canDeleteStudent') ? '✓ Cho phép xoá HS' : '🔒 Cấm xoá HS'}
              </span>
              <span className={`px-2 py-0.5 rounded ${canPerform('canManageTimetable') ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-500 line-through'}`}>
                {canPerform('canManageTimetable') ? '✓' : '✗'} Xếp TKB môn
              </span>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên lớp hoặc mã lớp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-500"
            >
              <option value="all">Tất cả môn học ({subjects.length})</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-500"
            >
              <option value="all">Tất cả các khối lớp</option>
              <option value="6">Khối 6</option>
              <option value="7">Khối 7</option>
              <option value="8">Khối 8</option>
              <option value="9">Khối 9 (Ôn thi vào 10)</option>
              <option value="10">Khối 10</option>
              <option value="11">Khối 11</option>
              <option value="12">Khối 12 (Luyện thi ĐH)</option>
              <option value="IELTS">IELTS</option>
              <option value="Luyện Thi ĐH">Luyện Thi ĐH / ĐGNL</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Mode View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((cls) => {
            const subject = subjects.find((s) => s.id === cls.subjectId);
            const teacher = teachers.find((t) => t.id === cls.teacherId);
            const room = rooms.find((r) => r.id === cls.roomId);

            // Determine sessions to display
            const sessionsList =
              cls.weeklySchedules && cls.weeklySchedules.length > 0
                ? cls.weeklySchedules
                : (cls.daysOfWeek || []).map((day) => ({
                    dayOfWeek: day,
                    startTime: cls.timeSlot?.start || '17:45',
                    endTime: cls.timeSlot?.end || '19:30',
                    roomId: cls.roomId,
                  }));

            return (
              <div
                key={cls.id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Meta */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                    <span className="font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {cls.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-slate-700">Khối {cls.gradeLevel}</span>
                      {cls.scheduleEffectiveDate && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono" title={`Lịch áp dụng từ ${cls.scheduleEffectiveDate}`}>
                          Áp dụng từ {cls.scheduleEffectiveDate}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Class Name */}
                  <h3
                    onClick={() => onOpenClassDetailModal(cls)}
                    className="font-bold text-slate-900 text-sm mt-3 hover:text-blue-600 cursor-pointer line-clamp-2"
                  >
                    {cls.name}
                  </h3>

                  {/* Details */}
                  <div className="mt-3 space-y-2.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Môn: <strong className="text-slate-800 font-medium">{subject?.name}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>GV: <strong className="text-slate-800 font-medium">{teacher?.name}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Phòng: <strong className="text-slate-800 font-medium">{room?.name}</strong></span>
                    </div>

                    {/* Weekly Schedule by session */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Lịch học trong tuần ({sessionsList.length} buổi):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pl-5">
                        {sessionsList.map((s, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-700"
                          >
                            <span className="font-bold text-blue-700">{getDayOfWeekName(s.dayOfWeek)}:</span>
                            <span className="font-mono text-slate-600">{s.startTime}-{s.endTime}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Sĩ số hiện tại */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span>Sĩ số học sinh:</span>
                    </div>
                    <span className="font-bold text-slate-900 bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-100">
                      {cls.studentIds.length} học sinh
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenClassDetailModal(cls)}
                      className="flex-1 py-1.5 px-2 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>DS HS ({cls.studentIds.length})</span>
                    </button>

                    {!isReadOnlyUser && canPerform('canAddStudent') && (
                      <button
                        type="button"
                        onClick={() => setImportingClass(cls)}
                        className="py-1.5 px-2 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Add danh sách học sinh từ máy tính vào lớp này"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Nhập HS</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onOpenAttendanceModal(cls.id)}
                      className="py-1.5 px-2 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Điểm danh ca học"
                    >
                      <CalendarCheck className="w-3.5 h-3.5" />
                      <span>Điểm danh</span>
                    </button>
                  </div>

                  {/* Secondary row: Dạy Bù, Sửa & Xóa (Chỉ hiện khi có quyền tương ứng) */}
                  {!isReadOnlyUser && (canPerform('canManageTimetable') || canPerform('canEditClass') || canPerform('canDeleteClass')) && (
                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-50 text-xs">
                      {canPerform('canManageTimetable') ? (
                        <button
                          type="button"
                          onClick={() => setRescheduleClass(cls)}
                          className="px-2 py-1 text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md font-medium flex items-center gap-1 transition-colors cursor-pointer"
                          title="Xếp lịch dạy bù / thay thế buổi hoặc đổi lịch áp dụng từ ngày"
                        >
                          <RotateCcw className="w-3 h-3 text-amber-600" />
                          <span>Dạy Bù / Đổi Lịch</span>
                        </button>
                      ) : (
                        <div />
                      )}

                      <div className="flex items-center gap-1">
                        {canPerform('canEditClass') && (
                          <button
                            type="button"
                            onClick={() => onOpenClassModal(cls)}
                            className="px-2 py-1 text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-md font-medium flex items-center gap-1 transition-colors cursor-pointer"
                            title="Sửa thông tin và lịch từng buổi học của lớp"
                          >
                            <Edit2 className="w-3 h-3 text-slate-500" />
                            <span>Sửa</span>
                          </button>
                        )}
                        {canPerform('canEditClass') && canPerform('canDeleteClass') && (
                          <span className="text-slate-200">|</span>
                        )}
                        {canPerform('canDeleteClass') && (
                          <button
                            type="button"
                            onClick={() => setClassToDelete(cls)}
                            className="px-2 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md font-medium flex items-center gap-1 transition-colors cursor-pointer"
                            title="Xoá lớp học"
                          >
                            <Trash2 className="w-3 h-3 text-slate-400 hover:text-rose-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table Mode View */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Mã & Tên Lớp</th>
                  <th className="px-4 py-3">Môn Học</th>
                  <th className="px-4 py-3">Giáo Viên</th>
                  <th className="px-4 py-3">Lịch Từng Buổi Trong Tuần</th>
                  <th className="px-4 py-3">Phòng Học</th>
                  <th className="px-4 py-3">Sĩ Số</th>
                  <th className="px-4 py-3 text-right min-w-[340px]">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredClasses.map((cls) => {
                  const subject = subjects.find((s) => s.id === cls.subjectId);
                  const teacher = teachers.find((t) => t.id === cls.teacherId);
                  const room = rooms.find((r) => r.id === cls.roomId);

                  const sessionsList =
                    cls.weeklySchedules && cls.weeklySchedules.length > 0
                      ? cls.weeklySchedules
                      : (cls.daysOfWeek || []).map((day) => ({
                          dayOfWeek: day,
                          startTime: cls.timeSlot?.start || '17:45',
                          endTime: cls.timeSlot?.end || '19:30',
                          roomId: cls.roomId,
                        }));

                  return (
                    <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div
                          onClick={() => onOpenClassDetailModal(cls)}
                          className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer text-sm"
                        >
                          {cls.name}
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-blue-700 mt-0.5">
                          <span>{cls.code} · Khối {cls.gradeLevel}</span>
                          {cls.scheduleEffectiveDate && (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded font-sans">
                              (Từ {cls.scheduleEffectiveDate})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {subject?.name}
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">
                        {teacher?.name}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {sessionsList.map((s, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                              <span className="font-semibold text-blue-700 w-14">{getDayOfWeekName(s.dayOfWeek)}:</span>
                              <span className="font-mono text-slate-700">{s.startTime} - {s.endTime}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {room?.name}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <strong className="text-slate-900">{cls.studentIds.length}</strong> học sinh
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Nút Dạy Bù / Đổi Lịch */}
                          {!isReadOnlyUser && canPerform('canManageTimetable') && (
                            <button
                              type="button"
                              onClick={() => setRescheduleClass(cls)}
                              className="px-2.5 py-1.5 text-xs bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer"
                              title="Xếp lịch dạy bù hoặc đổi lịch áp dụng từ ngày"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                              <span>Dạy Bù</span>
                            </button>
                          )}

                          {/* Nút Xem Danh Sách Học Sinh */}
                          <button
                            type="button"
                            onClick={() => onOpenClassDetailModal(cls)}
                            className="px-2.5 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer"
                            title="Xem danh sách học sinh"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>DS HS</span>
                          </button>

                          {/* Nút Add Danh Sách Học Sinh từ máy tính */}
                          {!isReadOnlyUser && canPerform('canAddStudent') && (
                            <button
                              type="button"
                              onClick={() => setImportingClass(cls)}
                              className="px-2.5 py-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer"
                              title="Add danh sách học sinh từ file máy tính"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Nhập HS</span>
                            </button>
                          )}

                          {/* Nút Điểm Danh */}
                          <button
                            type="button"
                            onClick={() => onOpenAttendanceModal(cls.id)}
                            className="px-2.5 py-1.5 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer"
                            title="Điểm danh ca học"
                          >
                            <CalendarCheck className="w-3.5 h-3.5" />
                          </button>

                          {/* Nút Sửa Lớp */}
                          {!isReadOnlyUser && canPerform('canEditClass') && (
                            <button
                              type="button"
                              onClick={() => onOpenClassModal(cls)}
                              className="px-2.5 py-1.5 text-xs bg-white text-slate-700 hover:text-blue-700 hover:bg-slate-100 border border-slate-200 rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer"
                              title="Chỉnh sửa thông tin và lịch từng buổi học"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Sửa</span>
                            </button>
                          )}

                          {/* Nút Xóa Lớp */}
                          {!isReadOnlyUser && canPerform('canDeleteClass') && (
                            <button
                              type="button"
                              onClick={() => setClassToDelete(cls)}
                              className="px-2.5 py-1.5 text-xs bg-white text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer"
                              title="Xóa lớp học này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Room Management Modal */}
      {isRoomModalOpen && (
        <RoomManagementModal
          isOpen={isRoomModalOpen}
          onClose={() => setIsRoomModalOpen(false)}
        />
      )}

      {/* Reschedule / Makeup Modal */}
      {rescheduleClass && (
        <ClassScheduleRescheduleModal
          isOpen={rescheduleClass !== null}
          onClose={() => setRescheduleClass(null)}
          cls={rescheduleClass}
        />
      )}

      {/* Import Students Modal */}
      <ImportStudentsModal
        isOpen={importingClass !== null}
        onClose={() => setImportingClass(null)}
        targetClass={importingClass}
      />

      {/* Delete Confirmation Modal */}
      {classToDelete && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-scale-up">
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">
                    Xác nhận xóa lớp học?
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hành động này không thể hoàn tác.
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div>
                  Tên lớp: <strong className="text-slate-900">{classToDelete.name}</strong>
                </div>
                <div>
                  Mã lớp: <span className="font-mono text-blue-700 font-semibold">{classToDelete.code}</span>
                </div>
                <div>
                  Sĩ số hiện tại: <strong className="text-rose-600">{classToDelete.studentIds.length} học sinh</strong>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setClassToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDeleteClass}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa Lớp Học Này</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
