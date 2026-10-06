import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { GradeLevel, ClassRoom } from '../../types/index.ts';
import {
  Calendar,
  Filter,
  AlertTriangle,
  Clock,
  User,
  MapPin,
  Users,
  Plus,
  CalendarCheck,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Edit2,
  Trash2,
  GraduationCap,
  Layers,
  Search,
  Eye,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { getDayOfWeekName } from '../../utils/formatters.ts';
import { TeacherTimetableExportModal } from './TeacherTimetableExportModal.tsx';
import { TimetableScheduleModal } from './TimetableScheduleModal.tsx';

interface TimetableMatrixViewProps {
  onOpenNewClass: () => void;
  onOpenAttendanceModal: (classId: string) => void;
}

export const TimetableMatrixView: React.FC<TimetableMatrixViewProps> = ({
  onOpenNewClass,
  onOpenAttendanceModal,
}) => {
  const { classes, subjects, teachers, rooms, setSelectedClassId, deleteClass, canPerform, currentUser } = useApp();
  const isReadOnlyUser = currentUser?.role === 'parent' || currentUser?.role === 'student';
  const canManageTimetable = !isReadOnlyUser && canPerform('canManageTimetable');

  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterTeacher, setFilterTeacher] = useState<string>('all');
  const [filterRoom, setFilterRoom] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');

  // Modal States
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingScheduleClass, setEditingScheduleClass] = useState<ClassRoom | null>(null);
  const [scheduleToDelete, setScheduleToDelete] = useState<ClassRoom | null>(null);

  const daysOfWeek = [2, 3, 4, 5, 6, 7, 8]; // Thứ 2 -> CN

  const gradeOptions: { id: string; label: string }[] = [
    { id: 'all', label: 'Tất Cả Khối Lớp' },
    { id: '6', label: 'Khối 6' },
    { id: '7', label: 'Khối 7' },
    { id: '8', label: 'Khối 8' },
    { id: '9', label: 'Khối 9 (Vào 10)' },
    { id: '10', label: 'Khối 10' },
    { id: '11', label: 'Khối 11' },
    { id: '12', label: 'Khối 12 (Luyện ĐH)' },
    { id: 'Ôn Chuyên', label: 'Ôn Chuyên' },
    { id: 'IELTS', label: 'IELTS' },
    { id: 'Luyện Thi ĐH', label: 'Đánh Giá Năng Lực' },
  ];

  // Filtered classes
  const filteredClasses = classes.filter((cls) => {
    if (cls.status !== 'active') return false;
    if (selectedGrade !== 'all' && cls.gradeLevel !== selectedGrade) return false;
    if (filterSubject !== 'all' && cls.subjectId !== filterSubject) return false;
    if (filterTeacher !== 'all' && cls.teacherId !== filterTeacher) return false;
    if (filterRoom !== 'all' && cls.roomId !== filterRoom) return false;
    if (
      searchQuery &&
      !cls.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !cls.code.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Open Schedule Modal for Adding
  const handleOpenAddSchedule = () => {
    setEditingScheduleClass(null);
    setIsScheduleModalOpen(true);
  };

  // Open Schedule Modal for Editing
  const handleOpenEditSchedule = (cls: ClassRoom) => {
    setEditingScheduleClass(cls);
    setIsScheduleModalOpen(true);
  };

  // Confirm delete schedule/class
  const handleConfirmDeleteSchedule = () => {
    if (scheduleToDelete) {
      deleteClass(scheduleToDelete.id);
      setScheduleToDelete(null);
    }
  };

  // Conflict Detection
  interface Conflict {
    type: 'room' | 'teacher';
    day: number;
    classA: string;
    classB: string;
    message: string;
  }

  const conflicts: Conflict[] = [];
  daysOfWeek.forEach((day) => {
    const dayClasses = classes.filter((c) => {
      if (c.status !== 'active') return false;
      if (c.weeklySchedules && c.weeklySchedules.length > 0) {
        return c.weeklySchedules.some((s) => s.dayOfWeek === day);
      }
      return c.daysOfWeek.includes(day);
    });

    for (let i = 0; i < dayClasses.length; i++) {
      for (let j = i + 1; j < dayClasses.length; j++) {
        const c1 = dayClasses[i];
        const c2 = dayClasses[j];

        // Find session time for c1 on this day
        const s1 = c1.weeklySchedules?.find((s) => s.dayOfWeek === day);
        const start1 = s1 ? s1.startTime : c1.timeSlot.start;
        const end1 = s1 ? s1.endTime : c1.timeSlot.end;
        const room1 = s1?.roomId || c1.roomId;

        // Find session time for c2 on this day
        const s2 = c2.weeklySchedules?.find((s) => s.dayOfWeek === day);
        const start2 = s2 ? s2.startTime : c2.timeSlot.start;
        const end2 = s2 ? s2.endTime : c2.timeSlot.end;
        const room2 = s2?.roomId || c2.roomId;

        // Check time overlap: (start1 < end2 && start2 < end1)
        const overlap = start1 < end2 && start2 < end1;
        if (overlap) {
          if (room1 === room2) {
            conflicts.push({
              type: 'room',
              day,
              classA: c1.name,
              classB: c2.name,
              message: `Trùng phòng ${rooms.find((r) => r.id === room1)?.name || room1} (${getDayOfWeekName(day)}) giữa lớp "${c1.name}" và "${c2.name}"`,
            });
          }
          if (c1.teacherId === c2.teacherId) {
            conflicts.push({
              type: 'teacher',
              day,
              classA: c1.name,
              classB: c2.name,
              message: `Trùng lịch giáo viên ${teachers.find((t) => t.id === c1.teacherId)?.name} (${getDayOfWeekName(day)}) giữa 2 lớp "${c1.name}" và "${c2.name}"`,
            });
          }
        }
      }
    }
  });

  return (
    <div className="space-y-5 pb-12">
      {/* Header & Main Actions */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Hệ Thống Phân Khóa & Thời Khóa Biểu</span>
              <span aria-hidden="true">·</span>
              <span>
                {selectedGrade === 'all'
                  ? `Tất cả các khối (${filteredClasses.length} ca học)`
                  : `Khối ${selectedGrade} (${filteredClasses.length} ca học)`}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              Thời Khóa Biểu Giảng Dạy & Lịch Học
            </h2>
          </div>

          {/* Action Buttons: Add Timetable Schedule, Export Teacher Timetable */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                  viewMode === 'matrix'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ma Trận Tuần
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bảng Lịch Khối
              </button>
            </div>

            {/* NÚT XUẤT FILE THỜI KHÓA BIỂU THEO TUẦN, THÁNG CỦA TỪNG GIÁO VIÊN */}
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg shadow-2xs transition-all cursor-pointer whitespace-nowrap"
              title="Xuất file thời khóa biểu theo tuần, tháng của từng giáo viên (Excel / In)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Xuất TKB Giáo Viên (Tuần / Tháng)</span>
            </button>

            {/* NÚT THÊM THỜI KHÓA BIỂU TỪNG KHỐI LỚP (Chỉ hiển thị khi có quyền) */}
            {canManageTimetable && (
              <button
                type="button"
                onClick={handleOpenAddSchedule}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
                title="Thêm ca học / lịch thời khóa biểu mới cho khối lớp"
              >
                <Plus className="w-4 h-4" />
                <span>
                  + Thêm TKB Khối {selectedGrade === 'all' ? 'Lớp' : selectedGrade}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Read-Only Notice for Parents & Students */}
        {isReadOnlyUser && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Chế độ xem dành cho Phụ huynh & Học sinh:</strong> Bạn đang theo dõi thời khóa biểu các môn học và ca học của trung tâm (Không có quyền thêm hoặc chỉnh sửa).
            </span>
          </div>
        )}

        {/* Delegated Admin notice if sub_admin */}
        {currentUser?.role === 'sub_admin' && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-2.5 text-xs text-indigo-900 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>
                Quyền quản trị thời khóa biểu (Thầy Hoà cấp): <strong>{canManageTimetable ? 'Được phép thêm / chỉnh sửa lịch học' : 'Chỉ xem (Không được xếp lịch)'}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Grade-Level Tabs / Selector */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-slate-400 font-medium text-[11px] shrink-0 mr-1 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-blue-600" /> Khối Lớp:
            </span>
            {gradeOptions.map((gr) => {
              const isSelected = selectedGrade === gr.id;
              const countForGrade =
                gr.id === 'all'
                  ? classes.filter((c) => c.status === 'active').length
                  : classes.filter((c) => c.status === 'active' && c.gradeLevel === gr.id).length;

              return (
                <button
                  type="button"
                  key={gr.id}
                  onClick={() => setSelectedGrade(gr.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span>{gr.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {countForGrade}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mã lớp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-500"
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
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-500"
            >
              <option value="all">Tất cả giáo viên ({teachers.length})</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-500"
            >
              <option value="all">Tất cả phòng học ({rooms.length})</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.capacity} chỗ)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Conflict Alert Banner */}
      {conflicts.length > 0 ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Phát hiện {conflicts.length} xung đột lịch học / trùng phòng!</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-rose-700 pl-1">
            {conflicts.map((c, idx) => (
              <li key={idx}>{c.message}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Hệ thống đã kiểm tra: Không có trùng lặp phòng học hay lịch giáo viên trong tuần.
            </span>
          </div>
          <span className="font-semibold text-emerald-900">
            Đang hiển thị {filteredClasses.length} lớp học hoạt động
          </span>
        </div>
      )}

      {/* VIEW MODE: 7-DAY TIMETABLE MATRIX */}
      {viewMode === 'matrix' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
          {daysOfWeek.map((dayNum) => {
            const dayClasses = filteredClasses
              .filter((c) => {
                if (c.weeklySchedules && c.weeklySchedules.length > 0) {
                  return c.weeklySchedules.some((s) => s.dayOfWeek === dayNum);
                }
                return c.daysOfWeek.includes(dayNum);
              })
              .sort((a, b) => {
                const s1 = a.weeklySchedules?.find((s) => s.dayOfWeek === dayNum);
                const s2 = b.weeklySchedules?.find((s) => s.dayOfWeek === dayNum);
                const start1 = s1 ? s1.startTime : a.timeSlot.start;
                const start2 = s2 ? s2.startTime : b.timeSlot.start;
                return start1.localeCompare(start2);
              });

            const isToday = (dayNum === 8 ? 0 : dayNum - 1) === new Date().getDay();

            return (
              <div
                key={dayNum}
                className={`bg-white rounded-xl border flex flex-col min-h-[540px] shadow-2xs ${
                  isToday ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'
                }`}
              >
                {/* Day Header */}
                <div
                  className={`p-3 border-b text-center ${
                    isToday
                      ? 'bg-blue-600 text-white rounded-t-xl'
                      : 'bg-slate-50 text-slate-800 border-slate-100 rounded-t-xl'
                  }`}
                >
                  <div className="font-bold text-xs">{getDayOfWeekName(dayNum)}</div>
                  <div
                    className={`text-[11px] font-mono mt-0.5 ${
                      isToday ? 'text-blue-100' : 'text-slate-500'
                    }`}
                  >
                    {dayClasses.length} ca học
                  </div>
                </div>

                {/* Sessions List */}
                <div className="p-2 space-y-2.5 flex-1 overflow-y-auto">
                  {dayClasses.length === 0 ? (
                    <div className="py-14 text-center text-[11px] text-slate-300">
                      Trống lịch
                    </div>
                  ) : (
                    dayClasses.map((cls) => {
                      const subject = subjects.find((s) => s.id === cls.subjectId);
                      const teacher = teachers.find((t) => t.id === cls.teacherId);
                      const specificSession = cls.weeklySchedules?.find((s) => s.dayOfWeek === dayNum);
                      const sessionStart = specificSession?.startTime || cls.timeSlot.start;
                      const sessionEnd = specificSession?.endTime || cls.timeSlot.end;
                      const roomObj = specificSession?.roomId
                        ? rooms.find((r) => r.id === specificSession.roomId)
                        : rooms.find((r) => r.id === cls.roomId);

                      return (
                        <div
                          key={cls.id}
                          className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-blue-50/40 hover:border-blue-300 transition-all text-xs group relative flex flex-col justify-between"
                        >
                          <div>
                            {/* Time & Grade Badge */}
                            <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 mb-1">
                              <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                {sessionStart} - {sessionEnd}
                              </span>
                              <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">
                                Khối {cls.gradeLevel}
                              </span>
                            </div>

                            {/* Class Name */}
                            <div
                              onClick={() => setSelectedClassId(cls.id)}
                              className="font-bold text-slate-900 text-xs line-clamp-2 mt-1 hover:text-blue-600 cursor-pointer"
                              title={cls.name}
                            >
                              {cls.name}
                            </div>

                            {/* Meta info */}
                            <div className="mt-2 space-y-1 text-[11px] text-slate-600">
                              <div className="flex items-center gap-1 font-medium truncate">
                                <User className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{teacher?.name}</span>
                              </div>
                              <div className="flex items-center gap-1 truncate text-slate-500">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{roomObj?.name}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                Sĩ số: <strong className="text-slate-800">{cls.studentIds.length}</strong> HS
                              </div>
                            </div>
                          </div>

                          {/* ACTION BUTTONS: Sửa, Xóa, Điểm Danh */}
                          <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenAttendanceModal(cls.id);
                              }}
                              className="text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-0.5 cursor-pointer"
                              title="Điểm danh lớp này"
                            >
                              <CalendarCheck className="w-3 h-3" /> Điểm danh
                            </button>

                            {canManageTimetable && (
                              <div className="flex items-center gap-1">
                                {/* NÚT CHỈNH SỬA THỜI KHÓA BIỂU */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditSchedule(cls);
                                  }}
                                  className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                                  title="Chỉnh sửa ca học này trên thời khóa biểu"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>

                                {/* NÚT XÓA THỜI KHÓA BIỂU */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setScheduleToDelete(cls);
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                  title="Xóa ca học này khỏi thời khóa biểu"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VIEW MODE: DETAILED TABLE FOR SELECTED GRADE */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Mã & Tên Lớp Học</th>
                  <th className="px-4 py-3">Khối Lớp</th>
                  <th className="px-4 py-3">Môn Học</th>
                  <th className="px-4 py-3">Giáo Viên Phụ Trách</th>
                  <th className="px-4 py-3">Lịch Từng Buổi Trong Tuần</th>
                  <th className="px-4 py-3">Phòng Học</th>
                  <th className="px-4 py-3">Sĩ Số</th>
                  <th className="px-4 py-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredClasses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Không có lớp nào thuộc khối {selectedGrade === 'all' ? 'này' : selectedGrade}.
                    </td>
                  </tr>
                ) : (
                  filteredClasses.map((cls) => {
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
                        <td className="px-4 py-3 font-medium">
                          <div className="font-bold text-slate-900 text-sm">{cls.name}</div>
                          <div className="font-mono text-[11px] text-blue-700">{cls.code}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-semibold text-[11px] border border-blue-100">
                            Khối {cls.gradeLevel}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700">{subject?.name}</td>
                        <td className="px-4 py-3 text-slate-700 font-medium">{teacher?.name}</td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {sessionsList.map((s, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                                <span className="font-bold text-blue-700 w-14">
                                  {getDayOfWeekName(s.dayOfWeek)}:
                                </span>
                                <span className="font-mono text-slate-700">
                                  {s.startTime} - {s.endTime}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-medium">{room?.name}</td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          {cls.studentIds.length} HS
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onOpenAttendanceModal(cls.id)}
                              className="px-2.5 py-1 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer"
                              title="Điểm danh"
                            >
                              <CalendarCheck className="w-3.5 h-3.5" />
                              <span>Điểm danh</span>
                            </button>

                            {/* SỬA & XÓA THỜI KHÓA BIỂU (Chỉ khi có quyền) */}
                            {canManageTimetable && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditSchedule(cls)}
                                  className="px-2.5 py-1 text-xs bg-white text-slate-700 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Chỉnh sửa ca học này"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span>Sửa TKB</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setScheduleToDelete(cls)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                                  title="Xóa ca học này khỏi thời khóa biểu"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: THÊM / CHỈNH SỬA THỜI KHÓA BIỂU TỪNG KHỐI LỚP */}
      <TimetableScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setEditingScheduleClass(null);
        }}
        editingClass={editingScheduleClass}
        defaultGradeLevel={
          selectedGrade !== 'all' ? (selectedGrade as GradeLevel) : '12'
        }
      />

      {/* MODAL: XUẤT FILE THỜI KHÓA BIỂU THEO TUẦN, THÁNG CỦA TỪNG GIÁO VIÊN */}
      <TeacherTimetableExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* MODAL: XÁC NHẬN XÓA THỜI KHÓA BIỂU */}
      {scheduleToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Xác Nhận Xóa Thời Khóa Biểu
                </h3>
                <p className="text-xs text-slate-500">
                  Hành động này sẽ xóa ca học này khỏi thời khóa biểu của khối lớp.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-700 space-y-1">
              <div>
                Tên lớp: <strong className="text-slate-900">{scheduleToDelete.name}</strong>
              </div>
              <div>
                Mã lớp: <span className="font-mono text-blue-700 font-semibold">{scheduleToDelete.code}</span>
              </div>
              <div>
                Khối lớp: <span className="font-semibold text-blue-800">Khối {scheduleToDelete.gradeLevel}</span>
              </div>
              <div>
                Sĩ số hiện tại: <strong>{scheduleToDelete.studentIds.length} học sinh</strong>
              </div>
            </div>

            <p className="text-slate-600 text-[11px] leading-relaxed">
              Bạn có chắc chắn muốn xóa ca học này khỏi thời khóa biểu không? Thao tác này không thể hoàn tác.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setScheduleToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSchedule}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xác Nhận Xóa TKB</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
