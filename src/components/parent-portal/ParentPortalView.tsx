import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Search,
  School,
  User,
  Phone,
  Calendar,
  Award,
  CalendarCheck,
  CheckCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import { formatVND, getDayOfWeekName } from '../../utils/formatters.ts';

interface ParentPortalViewProps {
  onOpenQrModal?: (invoiceId: string) => void;
}

export const ParentPortalView: React.FC<ParentPortalViewProps> = () => {
  const { students, classes, subjects, teachers, attendance, grades, settings, materials, recordMaterialDownload } = useApp();

  const [lookupQuery, setLookupQuery] = useState<string>('HS-26001');
  const [searchedStudentId, setSearchedStudentId] = useState<string>('stu-01');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = lookupQuery.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    const found = students.find((s) => {
      const codeClean = s.code.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      const phoneClean = s.parentPhone.replace(/[^0-9]/g, '');
      const stPhoneClean = s.phone.replace(/[^0-9]/g, '');
      return codeClean.includes(clean) || phoneClean.includes(clean) || stPhoneClean.includes(clean);
    });

    if (found) {
      setSearchedStudentId(found.id);
    } else {
      alert('Không tìm thấy học sinh phù hợp. Hãy thử lại bằng Mã HS (ví dụ: HS-26001) hoặc Số điện thoại phụ huynh!');
    }
  };

  const student = students.find((s) => s.id === searchedStudentId);
  const studentClasses = classes.filter((c) => student?.enrolledClassIds.includes(c.id));
  const studentGrades = grades
    .filter((g) => g.studentId === student?.id)
    .sort((a, b) => b.examDate.localeCompare(a.examDate));
  const studentAttendance = attendance
    .filter((a) => a.studentId === student?.id)
    .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));

  const presentCount = studentAttendance.filter((a) => a.status === 'present').length;
  const attendancePct = studentAttendance.length > 0 ? Math.round((presentCount / studentAttendance.length) * 100) : 100;

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Cổng Thông Tin Trực Tuyến Dành Cho Phụ Huynh & Học Sinh
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">
              Tra Cứu Lịch Học, Điểm Số & Tiến Bộ
            </h2>
            <p className="text-xs text-blue-100 mt-1 max-w-xl">
              Phụ huynh có thể theo dõi tình hình chuyên cần, điểm kiểm tra định kỳ của con và tải tài liệu học tập 24/7.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex items-center gap-2 bg-white/10 backdrop-blur p-1.5 rounded-xl border border-white/20">
            <input
              type="text"
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              placeholder="Nhập Mã HS hoặc SĐT Phụ Huynh..."
              className="px-3 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 rounded-lg outline-none w-56 font-mono font-medium"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-sm shrink-0"
            >
              Tra Cứu
            </button>
          </form>
        </div>

        {/* Quick select sample chips */}
        <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-blue-200 text-[11px]">Gợi ý tra cứu nhanh:</span>
          {students.slice(0, 4).map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setLookupQuery(s.code);
                setSearchedStudentId(s.id);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                searchedStudentId === s.id
                  ? 'bg-white text-blue-900 font-bold shadow-xs'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              {s.code} · {s.name}
            </button>
          ))}
        </div>
      </div>

      {student && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Student Profile Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center">
                  {student.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-lg">{student.name}</h3>
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {student.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {student.school} · Khối {student.gradeLevel} · Phụ huynh: <strong>{student.parentName}</strong> ({student.parentPhone})
                  </p>
                </div>
              </div>

              <div className="text-right bg-blue-50 p-3 rounded-xl border border-blue-100 text-xs">
                <span className="text-slate-500 block text-[11px]">Mục tiêu đăng ký tại trung tâm</span>
                <strong className="text-blue-900 font-bold text-sm block mt-0.5">{student.targetGoal}</strong>
              </div>
            </div>

            {/* Quick 3 metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">LỚP ĐANG HỌC</span>
                <strong className="text-slate-900 text-sm font-mono">{studentClasses.length} môn học</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">CHUYÊN CẦN</span>
                <strong className="text-emerald-700 text-sm font-mono">{attendancePct}% Có mặt</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">BÀI THI GẦN NHẤT</span>
                <strong className="text-blue-700 text-sm font-mono">
                  {studentGrades[0] ? `${studentGrades[0].score}/10 (${studentGrades[0].examName.slice(0, 20)}...)` : 'Chưa có'}
                </strong>
              </div>
            </div>
          </div>

          {/* 2 Columns: Timetable & Invoices QR */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Timetable */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-900 text-sm">Thời Khóa Biểu Hàng Tuần</h4>
              </div>

              <div className="space-y-2">
                {studentClasses.map((cls) => {
                  const teacher = teachers.find((t) => t.id === cls.teacherId);
                  const subj = subjects.find((s) => s.id === cls.subjectId);
                  return (
                    <div key={cls.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{cls.name}</span>
                        <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {cls.timeSlot.start} - {cls.timeSlot.end}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                        <span>Thứ: <strong className="text-slate-700">{cls.daysOfWeek.map((d) => getDayOfWeekName(d)).join(', ')}</strong></span>
                        <span>·</span>
                        <span>GV: <strong className="text-slate-700">{teacher?.name}</strong></span>
                        <span>·</span>
                        <span>Phòng: <strong className="text-slate-700">{cls.roomId}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Attendance & Class Participation */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-slate-900 text-sm">Điểm Danh & Ý Thức Học Tập</h4>
                </div>
                <span className="text-[11px] text-emerald-700 font-medium">Chuyên cần {attendancePct}%</span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {studentAttendance.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    Chưa có dữ liệu điểm danh.
                  </div>
                ) : (
                  studentAttendance.slice(0, 6).map((rec) => {
                    const cls = classes.find((c) => c.id === rec.classId);
                    return (
                      <div key={rec.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{cls?.name || 'Ca học'}</span>
                            <span className="text-[10px] text-slate-500 font-mono font-normal">({rec.sessionDate})</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            BTVN: {rec.homeworkDone ? <span className="text-emerald-600 font-medium">Hoàn thành</span> : <span className="text-rose-500 font-medium">Chưa làm</span>}
                            {rec.teacherNote && <span> · "{rec.teacherNote}"</span>}
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          rec.status === 'present'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : rec.status === 'absent_excused'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : rec.status === 'late'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {rec.status === 'present' ? 'Có mặt' : rec.status === 'absent_excused' ? 'Nghỉ có phép' : rec.status === 'late' ? 'Đi muộn' : 'Vắng'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Grades & Teacher Remarks */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Award className="w-4 h-4 text-amber-500" />
              <h4 className="font-bold text-slate-900 text-sm">Điểm Thi Thử & Lời Nhận Xét Của Giáo Viên</h4>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {studentGrades.map((g) => (
                <div key={g.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900 text-xs sm:text-sm">{g.examName}</div>
                    <div className="text-slate-500 text-[11px] font-mono mt-0.5">
                      Ngày thi: {g.examDate} · Xếp hạng: <strong className="text-emerald-700">{g.rankInClass ? `Top ${g.rankInClass}` : '-'}</strong>
                    </div>
                    {g.teacherComment && (
                      <p className="text-slate-700 italic mt-1 bg-amber-50/60 p-2 rounded border border-amber-100 text-[11px]">
                        Nhận xét: "{g.teacherComment}"
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold font-mono text-blue-700">
                      {g.score} <span className="text-xs font-normal text-slate-400">/ {g.maxScore}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Student's Course Materials Repository for Download */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-900 text-sm">Kho Bài Giảng & Đề Thi Tải Về Của Em</h4>
              </div>
              <span className="text-xs text-slate-500 font-mono">Tài liệu chính thức từ Thầy Cô</span>
            </div>

            {/* Filter materials matching student's enrolled courses or grade */}
            {(() => {
              const studentSubjectIds = Array.from(new Set(studentClasses.map((c) => c.subjectId)));
              const studentMaterials = materials.filter(
                (m) =>
                  studentSubjectIds.includes(m.subjectId) ||
                  m.gradeLevel === student.gradeLevel ||
                  (m.classId && student.enrolledClassIds.includes(m.classId))
              );

              if (studentMaterials.length === 0) {
                return (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    Hiện chưa có tài liệu mới nào cho các lớp của em.
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {studentMaterials.map((mat) => {
                    const subj = subjects.find((s) => s.id === mat.subjectId);
                    const teacher = teachers.find((t) => t.id === mat.teacherId);

                    return (
                      <div
                        key={mat.id}
                        className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex flex-col justify-between hover:bg-slate-100/70 transition-colors"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1.5 border-b border-slate-200/70">
                            <span className="font-mono font-bold text-blue-700 uppercase bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                              {mat.fileType}
                            </span>
                            <span>{subj?.name}</span>
                          </div>

                          <h5 className="font-bold text-slate-900 text-xs mt-2 line-clamp-2 leading-snug">
                            {mat.title}
                          </h5>
                          <p className="text-[11px] text-slate-500 mt-1">
                            GV: {teacher?.name} · {mat.fileSize}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-200/70 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-mono">{mat.uploadDate}</span>
                          <button
                            onClick={() => {
                              recordMaterialDownload(mat.id);
                              const blob = new Blob([`Tài liệu: ${mat.title}\nGiáo viên: ${teacher?.name || ''}\nEduCenter Pro`], { type: 'text/plain;charset=utf-8' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = mat.fileUrl || url;
                              a.download = mat.fileName;
                              a.click();
                            }}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            Tải Về Máy
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
