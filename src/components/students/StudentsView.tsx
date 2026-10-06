import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Student, GradeLevel } from '../../types/index.ts';
import {
  Users,
  Search,
  Filter,
  Plus,
  Phone,
  School,
  BookOpen,
  Award,
  CalendarCheck,
  CreditCard,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  ChevronRight,
  Target,
  Download,
  Layers,
  ArrowRightLeft,
  Check,
} from 'lucide-react';
import { getStatusBadge } from '../../utils/formatters.ts';

interface StudentsViewProps {
  onOpenStudentModal: (student?: Student) => void;
  onOpenProfileModal: (studentId: string) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  onOpenStudentModal,
  onOpenProfileModal,
}) => {
  const { students, classes, subjects, deleteStudent, invoices, batchAssignClass, canPerform, currentUser } = useApp();

  const isReadOnlyUser = currentUser?.role === 'parent' || currentUser?.role === 'student';
  const canAddStudent = !isReadOnlyUser && canPerform('canAddStudent');
  const canEditStudent = !isReadOnlyUser && canPerform('canEditStudent');
  const canDeleteStudent = !isReadOnlyUser && canPerform('canDeleteStudent');

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'by_class' | 'by_subject' | 'by_grade'>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Selected students for batch action
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [batchTargetClassId, setBatchTargetClassId] = useState<string>('');

  const filteredStudents = students.filter((st) => {
    const search = searchTerm.toLowerCase();
    const matchSearch =
      st.name.toLowerCase().includes(search) ||
      st.code.toLowerCase().includes(search) ||
      st.school.toLowerCase().includes(search) ||
      st.parentName.toLowerCase().includes(search) ||
      st.parentPhone.includes(search) ||
      st.phone.includes(search);

    const matchClass = filterClass === 'all' || st.enrolledClassIds.includes(filterClass);
    const matchGrade = filterGrade === 'all' || st.gradeLevel === filterGrade;
    const matchStatus = filterStatus === 'all' || st.status === filterStatus;

    const matchSubj =
      filterSubject === 'all' ||
      st.enrolledClassIds.some((cId) => {
        const c = classes.find((cls) => cls.id === cId);
        return c?.subjectId === filterSubject;
      });

    return matchSearch && matchClass && matchGrade && matchStatus && matchSubj;
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Xóa hồ sơ học sinh "${name}" khỏi trung tâm?`)) {
      deleteStudent(id);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleSelectStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter((sId) => sId !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const handleBatchAssign = () => {
    if (!batchTargetClassId || selectedStudentIds.length === 0) return;
    const targetClass = classes.find((c) => c.id === batchTargetClassId);
    batchAssignClass(selectedStudentIds, batchTargetClassId);
    alert(`Đã thêm ${selectedStudentIds.length} học sinh vào lớp ${targetClass?.name || ''}!`);
    setSelectedStudentIds([]);
    setBatchTargetClassId('');
  };

  const handleExportCsv = () => {
    const headers = ['Mã HS', 'Họ Tên', 'Giới Tính', 'Trường', 'Khối', 'Phụ Huynh', 'SĐT Phụ Huynh', 'Mục Tiêu', 'Số Lớp Đăng Ký'];
    const rows = filteredStudents.map((s) => [
      s.code,
      `"${s.name}"`,
      s.gender,
      `"${s.school}"`,
      s.gradeLevel,
      `"${s.parentName}"`,
      `"${s.parentPhone}"`,
      `"${s.targetGoal || ''}"`,
      s.enrolledClassIds.length,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `danh_sach_hoc_sinh_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & New Student Action */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Module Quản Lý Hồ Sơ & Phân Loại Học Sinh</span>
            <span aria-hidden="true">·</span>
            <span>Tổng {students.length} học sinh toàn trung tâm</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Quản Lý & Phân Loại Học Sinh Theo Môn / Lớp
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Xuất file danh sách học sinh"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Xuất CSV</span>
          </button>

          {/* Tiếp Nhận Học Sinh Mới Button (Guarded by canAddStudent) */}
          {canAddStudent && (
            <button
              onClick={() => onOpenStudentModal()}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Tiếp Nhận Học Sinh Mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Read-Only Notice for Parents & Students */}
      {isReadOnlyUser && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-center gap-2">
          <Eye className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Chế độ xem dành cho Phụ huynh & Học sinh:</strong> Bạn đang theo dõi thông tin học tập, hồ sơ và sĩ số học sinh (Không có quyền chỉnh sửa, thêm hoặc xóa học sinh).
          </span>
        </div>
      )}

      {/* Delegated Admin Permissions Badge Banner */}
      {currentUser?.role === 'sub_admin' && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            <span>
              <strong>Quản trị viên ủy quyền (bởi Thầy Hoà):</strong> Quyền thao tác học sinh:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 font-semibold text-[11px]">
            <span className={`px-2 py-0.5 rounded ${canPerform('canAddStudent') ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500 line-through'}`}>
              {canPerform('canAddStudent') ? '✓ Thêm học sinh' : '✕ Không thêm học sinh'}
            </span>
            <span className={`px-2 py-0.5 rounded ${canPerform('canEditStudent') ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500 line-through'}`}>
              {canPerform('canEditStudent') ? '✓ Sửa học sinh' : '✕ Không sửa'}
            </span>
            <span className={`px-2 py-0.5 rounded ${canPerform('canDeleteStudent') ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-500 line-through'}`}>
              {canPerform('canDeleteStudent') ? '✓ Xóa học sinh' : '✕ Bị khóa quyền xóa HS'}
            </span>
          </div>
        </div>
      )}

      {/* Categorization Mode Segmented Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => {
              setActiveCategoryTab('all');
              setFilterClass('all');
              setFilterSubject('all');
              setFilterGrade('all');
            }}
            className={`px-3 py-1.5 font-semibold rounded-md transition-all cursor-pointer ${
              activeCategoryTab === 'all'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất Cả Học Sinh ({students.length})
          </button>

          <button
            onClick={() => setActiveCategoryTab('by_class')}
            className={`px-3 py-1.5 font-semibold rounded-md transition-all cursor-pointer ${
              activeCategoryTab === 'by_class'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Phân Loại Theo Lớp Học ({classes.length} lớp)
          </button>

          <button
            onClick={() => setActiveCategoryTab('by_subject')}
            className={`px-3 py-1.5 font-semibold rounded-md transition-all cursor-pointer ${
              activeCategoryTab === 'by_subject'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Phân Loại Theo Môn Học ({subjects.length} môn)
          </button>

          <button
            onClick={() => setActiveCategoryTab('by_grade')}
            className={`px-3 py-1.5 font-semibold rounded-md transition-all cursor-pointer ${
              activeCategoryTab === 'by_grade'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Phân Loại Theo Khối
          </button>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bảng Chi Tiết
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dạng Thẻ
          </button>
        </div>
      </div>

      {/* Category breakdown visual widgets */}
      {activeCategoryTab === 'by_class' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {classes.map((cls) => {
            const count = cls.studentIds.length;
            const isSelected = filterClass === cls.id;
            return (
              <div
                key={cls.id}
                onClick={() => setFilterClass(isSelected ? 'all' : cls.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-100'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                    {cls.code}
                  </span>
                  <span className="font-bold text-slate-800 font-mono tabular-nums">
                    {count}/{cls.maxCapacity} HS
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs mt-2 line-clamp-1">{cls.name}</h4>
                <div className="text-[11px] text-slate-500 mt-1">
                  Khối {cls.gradeLevel} · {cls.daysOfWeek.length} buổi/tuần
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeCategoryTab === 'by_subject' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {subjects.map((subj) => {
            const subjClasses = classes.filter((c) => c.subjectId === subj.id);
            const studentCount = new Set(subjClasses.flatMap((c) => c.studentIds)).size;
            const isSelected = filterSubject === subj.id;
            return (
              <div
                key={subj.id}
                onClick={() => setFilterSubject(isSelected ? 'all' : subj.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-100'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{subj.name}</span>
                  <span className="font-mono text-blue-700 font-bold">{studentCount} HS</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {subjClasses.length} lớp học đang mở
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeCategoryTab === 'by_grade' && (
        <div className="flex flex-wrap gap-2">
          {['9', '10', '11', '12', 'IELTS', 'Ôn Chuyên'].map((gr) => {
            const count = students.filter((s) => s.gradeLevel === gr).length;
            const isSelected = filterGrade === gr;
            return (
              <button
                key={gr}
                onClick={() => setFilterGrade(isSelected ? 'all' : gr)}
                className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Khối {gr} ({count} học sinh)
              </button>
            );
          })}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên, mã HS, SĐT, trường..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-500"
          >
            <option value="all">Tất cả lớp học ({classes.length})</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
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
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang theo học</option>
            <option value="trial">Học thử</option>
            <option value="paused">Bảo lưu</option>
          </select>
        </div>
      </div>

      {/* Batch Action Toolbar when items selected */}
      {selectedStudentIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="font-semibold text-blue-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>Đã chọn {selectedStudentIds.length} học sinh</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={batchTargetClassId}
              onChange={(e) => setBatchTargetClassId(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg outline-none font-medium"
            >
              <option value="">-- Chọn lớp để gán hàng loạt --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleBatchAssign}
              disabled={!batchTargetClassId}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
            >
              Gán Vào Lớp
            </button>
            <button
              onClick={() => setSelectedStudentIds([])}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Table Mode View */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={
                        filteredStudents.length > 0 &&
                        selectedStudentIds.length === filteredStudents.length
                      }
                      onChange={handleSelectAll}
                      className="rounded text-blue-600"
                    />
                  </th>
                  <th className="px-4 py-3">Mã & Họ Tên</th>
                  <th className="px-4 py-3">Trường / Khối</th>
                  <th className="px-4 py-3">Các Lớp Đang Học</th>
                  <th className="px-4 py-3">Môn Học Tham Gia</th>
                  <th className="px-4 py-3">Liên Hệ Phụ Huynh</th>
                  <th className="px-4 py-3">Học Phí</th>
                  <th className="px-4 py-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                      Không tìm thấy học sinh nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st) => {
                    const studentClasses = classes.filter((c) => st.enrolledClassIds.includes(c.id));
                    const enrolledSubjectIds = Array.from(new Set(studentClasses.map((c) => c.subjectId)));
                    const enrolledSubjects = subjects.filter((s) => enrolledSubjectIds.includes(s.id));
                    const latestInvoice = invoices.find((i) => i.studentId === st.id);
                    const badge = getStatusBadge(latestInvoice ? latestInvoice.status : 'unpaid');
                    const isChecked = selectedStudentIds.includes(st.id);

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleSelectStudent(st.id)}
                            className="rounded text-blue-600"
                          />
                        </td>

                        {/* Student Name */}
                        <td className="px-4 py-3 font-medium">
                          <span
                            onClick={() => onOpenProfileModal(st.id)}
                            className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer text-sm block"
                          >
                            {st.name}
                          </span>
                          <span className="font-mono text-[11px] text-blue-700 font-semibold">
                            {st.code} · {st.gender}
                          </span>
                        </td>

                        {/* School */}
                        <td className="px-4 py-3 text-slate-700">
                          <div className="font-medium">{st.school}</div>
                          <div className="text-[11px] text-slate-500">Khối {st.gradeLevel}</div>
                        </td>

                        {/* Classes */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {studentClasses.map((c) => (
                              <span
                                key={c.id}
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100"
                                title={c.name}
                              >
                                {c.code}
                              </span>
                            ))}
                            {studentClasses.length === 0 && (
                              <span className="text-[11px] text-slate-400 italic">Chưa xếp lớp</span>
                            )}
                          </div>
                        </td>

                        {/* Subjects */}
                        <td className="px-4 py-3">
                          <div className="text-slate-700 font-medium">
                            {enrolledSubjects.map((s) => s.name).join(', ') || 'Chưa đăng ký'}
                          </div>
                        </td>

                        {/* Parent contact */}
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{st.parentName}</div>
                          <div className="font-mono text-[11px] text-blue-600 font-medium">
                            {st.parentPhone}
                          </div>
                        </td>

                        {/* Tuition Status */}
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-medium border ${badge.bg} ${badge.text}`}
                          >
                            {badge.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onOpenProfileModal(st.id)}
                              className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-medium text-xs flex items-center gap-1 cursor-pointer"
                              title="Hồ sơ 360°"
                            >
                              <Eye className="w-3.5 h-3.5" /> Hồ sơ
                            </button>
                            {canEditStudent && (
                              <button
                                onClick={() => onOpenStudentModal(st)}
                                className="px-2 py-1 text-slate-700 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                                title="Sửa thông tin học sinh"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Sửa</span>
                              </button>
                            )}
                            {canDeleteStudent && (
                              <button
                                onClick={() => handleDelete(st.id, st.name)}
                                className="px-2 py-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                                title="Xóa học sinh"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Xóa</span>
                              </button>
                            )}
                            {!canEditStudent && !canDeleteStudent && (
                              <span className="text-[11px] text-slate-400 italic">Chỉ xem</span>
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
      ) : (
        /* Grid Mode View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((st) => {
            const studentClasses = classes.filter((c) => st.enrolledClassIds.includes(c.id));
            const latestInvoice = invoices.find((i) => i.studentId === st.id);
            const badge = getStatusBadge(latestInvoice ? latestInvoice.status : 'unpaid');

            return (
              <div
                key={st.id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {st.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                  </div>

                  <h3
                    onClick={() => onOpenProfileModal(st.id)}
                    className="font-bold text-slate-900 text-base mt-2.5 hover:text-blue-600 cursor-pointer"
                  >
                    {st.name}
                  </h3>

                  <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{st.school} · Khối {st.gradeLevel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>PH: {st.parentName} (<span className="font-mono text-blue-600">{st.parentPhone}</span>)</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Target className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="font-medium truncate">{st.targetGoal || 'Luyện thi'}</span>
                    </div>
                  </div>

                  {/* Classes enrolled */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400 block mb-1">
                      Các lớp theo học ({studentClasses.length} lớp):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {studentClasses.map((c) => (
                        <span
                          key={c.id}
                          className="text-[11px] font-mono px-2 py-0.5 bg-slate-100 text-slate-700 rounded"
                        >
                          {c.code}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => onOpenProfileModal(st.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                  >
                    Hồ sơ 360° & Sổ điểm <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    {canEditStudent && (
                      <button
                        onClick={() => onOpenStudentModal(st)}
                        className="px-2.5 py-1 text-slate-700 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                        title="Sửa thông tin"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>
                    )}
                    {canDeleteStudent && (
                      <button
                        onClick={() => handleDelete(st.id, st.name)}
                        className="px-2.5 py-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                        title="Xóa học sinh"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    )}
                    {!canEditStudent && !canDeleteStudent && (
                      <span className="text-[11px] text-slate-400 italic">Chỉ xem</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
