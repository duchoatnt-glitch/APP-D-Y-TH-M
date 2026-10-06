import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext.tsx';
import { Teacher, ClassRoom } from '../../types/index.ts';
import {
  X,
  Download,
  Calendar,
  User,
  Clock,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  BookOpen,
  Filter,
  GraduationCap,
  Layers,
} from 'lucide-react';
import { getDayOfWeekName, getCenterCommuneOrLocation } from '../../utils/formatters.ts';

interface TeacherTimetableExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTeacherId?: string;
}

export const TeacherTimetableExportModal: React.FC<TeacherTimetableExportModalProps> = ({
  isOpen,
  onClose,
  defaultTeacherId,
}) => {
  const { teachers, classes, subjects, rooms, settings, curriculumLessons } = useApp();

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    defaultTeacherId || teachers[0]?.id || 'all'
  );
  const [exportType, setExportType] = useState<'week' | 'month'>('week');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedWeek, setSelectedWeek] = useState<number>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  });
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const centerLocation = getCenterCommuneOrLocation(settings.centerAddress);

  // Selected Teacher Object
  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);

  // Helper to extract all sessions for a teacher, completely synchronized with Class Timetable & PPCT
  const getTeacherSessions = (teacher: Teacher) => {
    const teacherClasses = classes.filter(
      (c) => c.teacherId === teacher.id && c.status === 'active'
    );

    const sessions: Array<{
      classId: string;
      classCode: string;
      className: string;
      gradeLevel: string;
      subjectId: string;
      subjectName: string;
      dayOfWeek: number;
      dayName: string;
      startTime: string;
      endTime: string;
      roomName: string;
      studentCount: number;
      ppctPeriod: string;
      ppctLessonTitle: string;
      note?: string;
    }> = [];

    teacherClasses.forEach((cls) => {
      const subj = subjects.find((s) => s.id === cls.subjectId)?.name || 'Môn học';
      const defaultRoom = rooms.find((r) => r.id === cls.roomId)?.name || 'Phòng học';

      // Strictly find matching PPCT curriculum by subjectId and gradeLevel
      const matchingCurriculum = curriculumLessons.filter(
        (cl) => cl.subjectId === cls.subjectId && cl.gradeLevel === cls.gradeLevel
      );
      const defaultLesson = matchingCurriculum[0];

      if (cls.weeklySchedules && cls.weeklySchedules.length > 0) {
        cls.weeklySchedules.forEach((ws, wsIdx) => {
          const roomObj = ws.roomId ? rooms.find((r) => r.id === ws.roomId) : null;
          const lesson =
            matchingCurriculum.find((cl) => cl.week === selectedWeek && (cl.stt === wsIdx + 1 || matchingCurriculum.length <= 1)) ||
            matchingCurriculum.find((cl) => cl.week === selectedWeek) ||
            matchingCurriculum[wsIdx % (matchingCurriculum.length || 1)] ||
            defaultLesson;

          sessions.push({
            classId: cls.id,
            classCode: cls.code,
            className: cls.name,
            gradeLevel: cls.gradeLevel,
            subjectId: cls.subjectId,
            subjectName: subj,
            dayOfWeek: ws.dayOfWeek,
            dayName: getDayOfWeekName(ws.dayOfWeek),
            startTime: ws.startTime,
            endTime: ws.endTime,
            roomName: roomObj?.name || defaultRoom,
            studentCount: cls.studentIds?.length || 0,
            ppctPeriod: lesson?.lessonNumber || `Tiết ${wsIdx * 2 + 1}-${wsIdx * 2 + 2}`,
            ppctLessonTitle: lesson?.title || 'Chuyên đề trọng tâm & Ôn luyện',
            note: cls.note,
          });
        });
      } else {
        (cls.daysOfWeek || []).forEach((d, dIdx) => {
          const lesson =
            matchingCurriculum.find((cl) => cl.week === selectedWeek && (cl.stt === dIdx + 1 || matchingCurriculum.length <= 1)) ||
            matchingCurriculum.find((cl) => cl.week === selectedWeek) ||
            matchingCurriculum[dIdx % (matchingCurriculum.length || 1)] ||
            defaultLesson;

          sessions.push({
            classId: cls.id,
            classCode: cls.code,
            className: cls.name,
            gradeLevel: cls.gradeLevel,
            subjectId: cls.subjectId,
            subjectName: subj,
            dayOfWeek: d,
            dayName: getDayOfWeekName(d),
            startTime: cls.timeSlot?.start || '17:45',
            endTime: cls.timeSlot?.end || '19:30',
            roomName: defaultRoom,
            studentCount: cls.studentIds?.length || 0,
            ppctPeriod: lesson?.lessonNumber || `Tiết ${dIdx * 2 + 1}-${dIdx * 2 + 2}`,
            ppctLessonTitle: lesson?.title || 'Chuyên đề trọng tâm & Ôn luyện',
            note: cls.note,
          });
        });
      }
    });

    // Sort by dayOfWeek then startTime
    return sessions.sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      return a.startTime.localeCompare(b.startTime);
    });
  };

  const previewSessions = selectedTeacher ? getTeacherSessions(selectedTeacher) : [];

  // Export to Excel with full PPCT & Timetable consistency
  const handleExportExcel = () => {
    const targetTeachers =
      selectedTeacherId === 'all'
        ? teachers
        : teachers.filter((t) => t.id === selectedTeacherId);

    if (targetTeachers.length === 0) {
      alert('Không tìm thấy giáo viên để xuất lịch!');
      return;
    }

    const workbook = XLSX.utils.book_new();

    targetTeachers.forEach((teacher) => {
      const teacherSessions = getTeacherSessions(teacher);
      const teacherSubjs = subjects
        .filter((s) => teacher.subjectIds?.includes(s.id))
        .map((s) => s.name)
        .join(', ');

      const timeScopeLabel =
        exportType === 'week'
          ? `Tuần ${selectedWeek} - Năm ${selectedYear}`
          : `Tháng ${selectedMonth}/${selectedYear}`;

      const aoaData: any[][] = [
        [settings.centerName || 'HỘ KINH DOANH PHAN NGUYÊN'],
        ['HỆ THỐNG QUẢN LÝ ĐÀO TẠO & THỜI KHÓA BIỂU ĐỒNG BỘ PPCT'],
        [],
        ['BẢNG PHÂN CÔNG THỜI KHÓA BIỂU GIẢNG DẠY KHỚP PPCT MÔN HỌC'],
        [`Giáo viên: ${teacher.name} (${teacher.code})`, `Môn phụ trách: ${teacherSubjs || 'Tất cả'}`],
        [`Học vị: ${teacher.degree || 'Cử nhân'}`, `Số điện thoại: ${teacher.phone}`],
        [`Kỳ áp dụng: ${timeScopeLabel}`, `Địa điểm: ${centerLocation}, ngày ${new Date().toLocaleDateString('vi-VN')}`],
        [],
        [
          'STT',
          'Thứ Trong Tuần',
          'Khung Giờ',
          'Khối Lớp',
          'Mã Lớp',
          'Tên Lớp Học',
          'Môn Học',
          'Tiết PPCT',
          'Tên Bài Dạy Theo PPCT Môn Học',
          'Phòng Học',
          'Sĩ Số Học Sinh',
          'Ghi Chú',
        ],
      ];

      teacherSessions.forEach((s, idx) => {
        aoaData.push([
          idx + 1,
          s.dayName,
          `${s.startTime} - ${s.endTime}`,
          `Khối ${s.gradeLevel}`,
          s.classCode,
          s.className,
          s.subjectName,
          s.ppctPeriod,
          s.ppctLessonTitle,
          s.roomName,
          `${s.studentCount} HS`,
          s.note || '',
        ]);
      });

      // Summary lines
      const totalEstimatedSessions =
        exportType === 'week'
          ? teacherSessions.length
          : teacherSessions.length * 4;

      aoaData.push([]);
      aoaData.push([
        'TỔNG CỘNG',
        `Tổng số ca dạy: ${teacherSessions.length} ca/tuần`,
        `Dự kiến trong ${timeScopeLabel}: ~${totalEstimatedSessions} buổi dạy`,
      ]);
      aoaData.push([]);
      aoaData.push([
        'XÁC NHẬN CỦA GIÁO VIÊN',
        '',
        '',
        '',
        '',
        '',
        '',
        `${centerLocation}, ngày ${new Date().toLocaleDateString('vi-VN')}`,
      ]);
      aoaData.push([
        '(Ký và ghi rõ họ tên)',
        '',
        '',
        '',
        '',
        '',
        '',
        'BAN CHUYÊN MÔN & ĐÀO TẠO (Ký duyệt)',
      ]);

      const worksheet = XLSX.utils.aoa_to_sheet(aoaData);

      // Set column widths
      worksheet['!cols'] = [
        { wch: 6 },  // STT
        { wch: 16 }, // Thứ
        { wch: 18 }, // Giờ
        { wch: 12 }, // Khối
        { wch: 14 }, // Mã lớp
        { wch: 30 }, // Tên lớp
        { wch: 14 }, // Môn
        { wch: 14 }, // Tiết PPCT
        { wch: 42 }, // Tên bài dạy
        { wch: 16 }, // Phòng
        { wch: 14 }, // Sĩ số
        { wch: 25 }, // Ghi chú
      ];

      const safeName = teacher.name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
      const sheetName = `${teacher.code}_${safeName}`.slice(0, 31);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    const fileSuffix =
      selectedTeacherId === 'all'
        ? 'Tat_Ca_Giao_Vien'
        : selectedTeacher?.name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');

    const fileName = `TKB_GiaoVien_DongBo_PPCT_${fileSuffix}_${exportType === 'week' ? `Tuan_${selectedWeek}` : `Thang_${selectedMonth}`}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    setExportSuccessMsg(`Đã xuất thành công tệp "${fileName}"!`);
    setTimeout(() => setExportSuccessMsg(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Xuất Thời Khóa Biểu Giáo Viên (Đồng Bộ Lớp Học & Khớp PPCT)
              </h3>
              <p className="text-xs text-slate-500">
                Tải về tệp Excel thời khóa biểu chuẩn hóa, khớp từng tiết phân phối chương trình môn học
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {exportSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{exportSuccessMsg}</span>
            </div>
          )}

          {/* Configuration Form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            {/* Teacher Select */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Chọn Giáo Viên</label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none font-medium"
              >
                <option value="all">Tất Cả Giáo Viên ({teachers.length} Thầy/Cô)</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} - {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Scope Type */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phạm Vi Thời Gian</label>
              <div className="grid grid-cols-2 gap-1 bg-white p-1 rounded-lg border border-slate-300">
                <button
                  type="button"
                  onClick={() => setExportType('week')}
                  className={`py-1 text-center rounded font-semibold transition-all cursor-pointer ${
                    exportType === 'week' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Theo Tuần
                </button>
                <button
                  type="button"
                  onClick={() => setExportType('month')}
                  className={`py-1 text-center rounded font-semibold transition-all cursor-pointer ${
                    exportType === 'month' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Theo Tháng
                </button>
              </div>
            </div>

            {/* Week or Month select */}
            <div>
              {exportType === 'week' ? (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chọn Tuần Học</label>
                  <select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none font-medium"
                  >
                    {Array.from({ length: 52 }, (_, i) => i + 1).map((w) => (
                      <option key={w} value={w}>
                        Tuần {w} (Năm học 2026 - 2027)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tháng</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg outline-none font-medium"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>
                          Tháng {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Năm</label>
                    <input
                      type="number"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg outline-none font-medium"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Xem Trước Lịch & Bài Dạy Theo PPCT (
                {selectedTeacherId === 'all'
                  ? `Toàn bộ ${teachers.length} giáo viên`
                  : selectedTeacher?.name || ''}
                )
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {previewSessions.length} ca dạy trong tuần
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider sticky top-0 border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">STT</th>
                      <th className="py-2.5 px-3">Thứ</th>
                      <th className="py-2.5 px-3">Khung Giờ</th>
                      <th className="py-2.5 px-3">Lớp & Khối</th>
                      <th className="py-2.5 px-3">Môn Học</th>
                      <th className="py-2.5 px-3">Tiết PPCT</th>
                      <th className="py-2.5 px-3">Tên Bài Dạy (Khớp PPCT)</th>
                      <th className="py-2.5 px-3">Phòng Học</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewSessions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          Chưa có lịch dạy phân công cho giáo viên này.
                        </td>
                      </tr>
                    ) : (
                      previewSessions.map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 text-slate-500 font-mono text-center w-10">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{s.dayName}</td>
                          <td className="py-2.5 px-3 font-mono font-medium text-blue-700">
                            {s.startTime} - {s.endTime}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{s.className}</div>
                            <div className="text-[10px] text-slate-500">Mã: {s.classCode}</div>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-700">{s.subjectName}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-indigo-700 bg-indigo-50/50 text-center">
                            {s.ppctPeriod}
                          </td>
                          <td className="py-2.5 px-3 text-slate-800 font-medium max-w-xs truncate" title={s.ppctLessonTitle}>
                            {s.ppctLessonTitle}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-600">{s.roomName}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span>Đồng bộ 100% giữa TKB Lớp - TKB Giáo Viên - Phân phối chương trình</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              onClick={handleExportExcel}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" /> Xuất Excel (.xlsx) Đã Khớp PPCT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
