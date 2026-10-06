import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Student } from '../../types/index.ts';
import {
  X,
  User,
  Phone,
  School,
  Calendar,
  Award,
  CalendarCheck,
  Target,
  Clock,
  Printer,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { formatVND, getDayOfWeekName, getStatusBadge } from '../../utils/formatters.ts';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string | null;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  studentId,
}) => {
  const { students, classes, subjects, teachers, attendance, grades, settings } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'grades' | 'attendance'>('overview');

  if (!isOpen || !studentId) return null;

  const student = students.find((s) => s.id === studentId);
  if (!student) return null;

  // Student's classes
  const studentClasses = classes.filter((c) => student.enrolledClassIds.includes(c.id));

  // Student's grades
  const studentGrades = grades
    .filter((g) => g.studentId === student.id)
    .sort((a, b) => b.examDate.localeCompare(a.examDate));

  // Student's attendance
  const studentAttendance = attendance
    .filter((a) => a.studentId === student.id)
    .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));

  // Calculate statistics
  const presentCount = studentAttendance.filter((a) => a.status === 'present').length;
  const attendanceRate = studentAttendance.length > 0
    ? Math.round((presentCount / studentAttendance.length) * 100)
    : 100;

  const avgScore = studentGrades.length > 0
    ? (studentGrades.reduce((sum, g) => sum + g.score, 0) / studentGrades.length).toFixed(1)
    : 'Chưa có';

  const handlePrintTranscript = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col printable-area">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-base flex items-center justify-center shadow-sm">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">{student.name}</h3>
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {student.code}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {student.school} · Khối {student.gradeLevel} · Ngày nhập học: {student.joinDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintTranscript}
              className="px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="In phiếu báo điểm & học tập"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>In Báo Cáo</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Header (Visible only when printing) */}
        <div className="hidden print:block text-center border-b pb-4 mb-4">
          <h2 className="text-lg font-bold uppercase">{settings.centerName}</h2>
          <p className="text-xs">{settings.centerAddress} - Hotline: {settings.centerPhone}</p>
          <h1 className="text-xl font-bold mt-2">PHIẾU KẾT QUẢ HỌC TẬP & THEO DÕI HỌC SINH</h1>
          <p className="text-xs">Học sinh: <strong>{student.name}</strong> - Mã: <strong>{student.code}</strong> - Trường: {student.school}</p>
        </div>

        {/* Top 4 KPI Metrics Strip */}
        <div className="px-6 py-3.5 bg-slate-50/40 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="text-slate-500 block text-[11px]">Số môn & Lớp học</span>
            <strong className="text-slate-900 text-sm font-mono">{studentClasses.length} lớp</strong>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="text-slate-500 block text-[11px]">Điểm TB kiểm tra</span>
            <strong className="text-blue-700 text-sm font-mono">{avgScore} / 10</strong>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="text-slate-500 block text-[11px]">Tỷ lệ chuyên cần</span>
            <strong className="text-emerald-700 text-sm font-mono">{attendanceRate}%</strong>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="text-slate-500 block text-[11px]">Bài KT đã làm</span>
            <strong className="text-purple-700 text-sm font-mono">{studentGrades.length} bài</strong>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="px-6 border-b border-slate-200 flex items-center gap-4 text-xs font-medium bg-white no-print">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Target className="w-4 h-4" /> Tổng Quan & Thời Khóa Biểu
          </button>
          <button
            onClick={() => setActiveTab('grades')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'grades'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4" /> Sổ Điểm Thi & Khảo Sát ({studentGrades.length})
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'attendance'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-4 h-4" /> Lịch Sử Điểm Danh ({studentAttendance.length})
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 flex-1 overflow-y-auto text-xs">
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Target & Personal Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2">
                  <div className="font-bold text-blue-900 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-blue-600" /> Mục Tiêu & Kế Hoạch Học Tập
                  </div>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {student.targetGoal || 'Đạt điểm 9+ các môn xét tuyển Đại học'}
                  </p>
                  <p className="text-[11px] text-slate-500 italic mt-1">
                    Ghi chú từ giáo viên phụ trách: {student.notes || 'Học sinh có ý thức kỷ luật tốt, tiếp thu nhanh.'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-slate-700">
                  <div className="font-bold text-slate-900 mb-2">Thông Tin Phụ Huynh Liên Hệ</div>
                  <div>Phụ huynh: <strong className="text-slate-900">{student.parentName}</strong></div>
                  <div>Số điện thoại: <strong className="font-mono text-blue-600">{student.parentPhone}</strong></div>
                  {student.parentEmail && <div>Email: <span className="font-mono">{student.parentEmail}</span></div>}
                  <div>Địa chỉ: <span>{student.address || 'Hà Nội'}</span></div>
                </div>
              </div>

              {/* Weekly Timetable for this student */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" /> Lịch Học Hàng Tuần Của Học Sinh
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="px-4 py-2.5">Lớp & Môn Học</th>
                        <th className="px-4 py-2.5">Giáo Viên</th>
                        <th className="px-4 py-2.5">Thứ Trong Tuần</th>
                        <th className="px-4 py-2.5">Giờ Học</th>
                        <th className="px-4 py-2.5">Phòng Học</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {studentClasses.map((cls) => {
                        const subj = subjects.find((s) => s.id === cls.subjectId);
                        const teacher = teachers.find((t) => t.id === cls.teacherId);
                        return (
                          <tr key={cls.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5">
                              <span className="font-bold text-slate-900">{cls.name}</span>
                              <span className="text-[11px] text-blue-700 font-mono ml-2">({subj?.name})</span>
                            </td>
                            <td className="px-4 py-2.5 font-medium">{teacher?.name}</td>
                            <td className="px-4 py-2.5 font-medium">
                              {cls.daysOfWeek.map((d) => getDayOfWeekName(d)).join(', ')}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-blue-600">
                              {cls.timeSlot.start} - {cls.timeSlot.end}
                            </td>
                            <td className="px-4 py-2.5 text-slate-600">{cls.roomId}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'grades' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Bài Khảo Sát / Kỳ Thi</th>
                      <th className="px-4 py-2.5">Ngày Thi</th>
                      <th className="px-4 py-2.5">Lớp / Môn</th>
                      <th className="px-4 py-2.5">Điểm Số</th>
                      <th className="px-4 py-2.5">Xếp Hạng</th>
                      <th className="px-4 py-2.5">Nhận Xét Của Thầy Cô</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {studentGrades.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                          Chưa có bài kiểm tra nào được ghi nhận.
                        </td>
                      </tr>
                    ) : (
                      studentGrades.map((g) => {
                        const cls = classes.find((c) => c.id === g.classId);
                        return (
                          <tr key={g.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 font-bold text-slate-900">{g.examName}</td>
                            <td className="px-4 py-2.5 font-mono text-slate-600">{g.examDate}</td>
                            <td className="px-4 py-2.5 text-slate-700">{cls?.name || 'Môn học'}</td>
                            <td className="px-4 py-2.5 font-mono font-bold text-blue-700 text-sm">
                              {g.score} <span className="text-xs text-slate-400 font-normal">/ {g.maxScore}</span>
                            </td>
                            <td className="px-4 py-2.5 font-mono text-emerald-700 font-bold">
                              {g.rankInClass ? `Top ${g.rankInClass}` : '-'}
                            </td>
                            <td className="px-4 py-2.5 text-slate-600 italic">
                              {g.teacherComment || 'Làm bài tốt'}
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

          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Ngày Học</th>
                      <th className="px-4 py-2.5">Lớp Học</th>
                      <th className="px-4 py-2.5">Trạng Thái</th>
                      <th className="px-4 py-2.5">BTVN</th>
                      <th className="px-4 py-2.5">Ghi Chú Buổi Học</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {studentAttendance.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                          Chưa có lịch sử điểm danh.
                        </td>
                      </tr>
                    ) : (
                      studentAttendance.map((a) => {
                        const cls = classes.find((c) => c.id === a.classId);
                        const badge = getStatusBadge(a.status);
                        return (
                          <tr key={a.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 font-mono font-medium text-slate-900">{a.sessionDate}</td>
                            <td className="px-4 py-2.5 text-slate-700">{cls?.name}</td>
                            <td className="px-4 py-2.5">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${badge.bg} ${badge.text}`}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-medium">
                              {a.homeworkDone ? (
                                <span className="text-emerald-700">Hoàn thành tốt</span>
                              ) : (
                                <span className="text-rose-600">Chưa nộp bài</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-slate-600">{a.teacherNote || '-'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/70 text-xs no-print">
          <div className="text-slate-500">
            Học sinh: <strong>{student.name}</strong> · Liên hệ PH: <strong className="font-mono">{student.parentPhone}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg"
          >
            Đóng Hồ Sơ
          </button>
        </div>
      </div>
    </div>
  );
};
