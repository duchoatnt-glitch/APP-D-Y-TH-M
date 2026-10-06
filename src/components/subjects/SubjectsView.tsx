import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext.tsx';
import { Subject, GradeLevel, CurriculumLesson } from '../../types/index.ts';
import {
  Layers,
  Plus,
  BookOpen,
  Users,
  GraduationCap,
  Edit2,
  Trash2,
  X,
  Save,
  CheckCircle2,
  Calendar,
  Clock,
  Upload,
  Download,
  Search,
  Filter,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ImportCurriculumModal } from './ImportCurriculumModal.tsx';
import { CurriculumLessonModal } from './CurriculumLessonModal.tsx';
import { AutoScheduleCurriculumModal } from './AutoScheduleCurriculumModal.tsx';

export const SubjectsView: React.FC = () => {
  const {
    subjects,
    classes,
    addSubject,
    updateSubject,
    deleteSubject,
    curriculumLessons,
    deleteCurriculumLesson,
    clearCurriculumLessons,
  } = useApp();

  // Active view: 'subjects' (danh sách môn) or 'curriculum' (phân phối chương trình từng khối)
  const [activeMainTab, setActiveMainTab] = useState<'subjects' | 'curriculum'>('subjects');

  // Modal states for Subject
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectFormData, setSubjectFormData] = useState<Partial<Subject>>({
    name: '',
    code: '',
    description: '',
    color: 'blue',
    targetGrades: ['6', '7', '8', '9', '10', '11', '12'],
  });

  // Curriculum filter states
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>('12');
  const [searchCurriculum, setSearchCurriculum] = useState('');

  // Modals for Curriculum
  const [isImportCurriculumOpen, setIsImportCurriculumOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<CurriculumLesson | null>(null);
  const [isAutoScheduleOpen, setIsAutoScheduleOpen] = useState(false);

  // Lesson to delete confirm
  const [lessonToDelete, setLessonToDelete] = useState<CurriculumLesson | null>(null);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  // Filtered curriculum lessons for current subject & grade
  const currentGradeLessons = curriculumLessons
    .filter((l) => l.subjectId === (selectedSubject?.id || '') && l.gradeLevel === selectedGrade)
    .sort((a, b) => a.stt - b.stt);

  const displayLessons = currentGradeLessons.filter((l) => {
    const q = searchCurriculum.toLowerCase();
    return (
      l.title.toLowerCase().includes(q) ||
      l.lessonNumber.toLowerCase().includes(q) ||
      (l.notes && l.notes.toLowerCase().includes(q)) ||
      (l.objectives && l.objectives.toLowerCase().includes(q))
    );
  });

  const totalPeriods = currentGradeLessons.reduce((sum, l) => sum + (Number(l.periods) || 0), 0);
  const maxWeek = currentGradeLessons.reduce((max, l) => Math.max(max, l.week || 0), 0);

  // Handle open Subject Modal
  const handleOpenSubjectModal = (subj?: Subject) => {
    if (subj) {
      setEditingSubject(subj);
      setSubjectFormData({
        name: subj.name,
        code: subj.code,
        description: subj.description,
        color: subj.color,
        targetGrades: subj.targetGrades,
      });
    } else {
      setEditingSubject(null);
      setSubjectFormData({
        name: '',
        code: '',
        description: '',
        color: 'blue',
        targetGrades: ['6', '7', '8', '9', '10', '11', '12'],
      });
    }
    setIsSubjectModalOpen(true);
  };

  const handleSubmitSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectFormData.name || !subjectFormData.code) return;

    if (editingSubject) {
      updateSubject(editingSubject.id, subjectFormData);
    } else {
      addSubject({
        ...subjectFormData as Subject,
        id: `subj-${Date.now()}`,
        targetGrades: subjectFormData.targetGrades || ['10', '11', '12'],
        iconName: 'BookOpen',
      });
    }
    setIsSubjectModalOpen(false);
  };

  const handleDeleteSubject = (id: string, name: string) => {
    if (window.confirm(`Xóa môn học "${name}" khỏi hệ thống?`)) {
      deleteSubject(id);
    }
  };

  // Jump directly to PPCT tab for a specific subject
  const handleNavigateToCurriculum = (subjId: string) => {
    setSelectedSubjectId(subjId);
    setActiveMainTab('curriculum');
  };

  // Export PPCT to Excel
  const handleExportCurriculumExcel = () => {
    if (currentGradeLessons.length === 0) {
      alert('Chưa có dữ liệu bài học nào để xuất file!');
      return;
    }

    const exportData = [
      ['STT', 'Tiết theo PPCT', 'Tên bài học / Chủ đề', 'Số tiết (dùng xếp TKB)', 'Khối lớp', 'Tuần', 'Học kỳ', 'Trọng tâm kiến thức / Yêu cầu', 'Ghi chú'],
      ...currentGradeLessons.map((l) => [
        l.stt,
        l.lessonNumber,
        l.title,
        l.periods,
        l.gradeLevel,
        l.week || '',
        l.semester || 'HK1',
        l.objectives || '',
        l.notes || '',
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    const sheetName = `PPCT_${selectedSubject?.code || 'MON'}_K${selectedGrade}`.substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(
      wb,
      `Phan_Phoi_Chuong_Trinh_${selectedSubject?.name || 'MonHoc'}_Khoi_${selectedGrade}.xlsx`
    );
  };

  const handleClearCurrentGradePPCT = () => {
    if (!selectedSubject) return;
    if (
      window.confirm(
        `Bạn có chắc chắn muốn xóa toàn bộ ${currentGradeLessons.length} bài học trong PPCT môn "${selectedSubject.name}" - Khối ${selectedGrade}?`
      )
    ) {
      clearCurriculumLessons(selectedSubject.id, selectedGrade);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Segmented Tab Switcher */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Chương Trình Đào Tạo & Kế Hoạch Dạy Học</span>
            <span aria-hidden="true">·</span>
            <span>{subjects.length} môn học đang giảng dạy</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Quản Lý Môn Học & Phân Phối Chương Trình (PPCT)
          </h2>
        </div>

        {/* Tab Switcher: Danh Sách Môn vs Phân Phối Chương Trình */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setActiveMainTab('subjects')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeMainTab === 'subjects'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Danh Sách Môn Học
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab('curriculum')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMainTab === 'curriculum'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Phân Phối Chương Trình (PPCT)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DANH SÁCH MÔN HỌC */}
      {activeMainTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Các môn học đào tạo tại trung tâm
            </span>
            <button
              onClick={() => handleOpenSubjectModal()}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Môn Học Mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subj) => {
              const subjClasses = classes.filter((c) => c.subjectId === subj.id);
              const studentCount = new Set(subjClasses.flatMap((c) => c.studentIds)).size;
              const subjLessons = curriculumLessons.filter((l) => l.subjectId === subj.id);
              const totalLessonsCount = subjLessons.length;
              const totalLessonPeriods = subjLessons.reduce((sum, l) => sum + l.periods, 0);

              return (
                <div
                  key={subj.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {subj.code}
                        </span>
                        <h3 className="font-bold text-slate-900 text-base mt-2">
                          {subj.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenSubjectModal(subj)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Chỉnh sửa môn học"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSubject(subj.id, subj.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa môn"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {subj.description || 'Chương trình giảng dạy trọng tâm và bám sát cấu trúc đề thi.'}
                    </p>

                    {/* Target Grades */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1">
                      {subj.targetGrades.map((g) => (
                        <span
                          key={g}
                          className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium"
                        >
                          Khối {g}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Metrics & PPCT Action (Đã bỏ học phí chuẩn/buổi) */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Lớp đang mở</span>
                        <strong className="text-slate-900 font-mono">{subjClasses.length} lớp</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Học sinh</span>
                        <strong className="text-slate-900 font-mono">{studentCount} HS</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px]">PPCT đã soạn</span>
                        <strong className="text-blue-700 font-mono">
                          {totalLessonsCount} bài ({totalLessonPeriods} tiết)
                        </strong>
                      </div>
                    </div>

                    {/* Button Xem & Soạn PPCT */}
                    <button
                      type="button"
                      onClick={() => handleNavigateToCurriculum(subj.id)}
                      className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Xem & Soạn Phân Phối Chương Trình</span>
                      <ArrowRight className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PHÂN PHỐI CHƯƠNG TRÌNH TỪNG KHỐI LỚP (PPCT) */}
      {activeMainTab === 'curriculum' && (
        <div className="space-y-5">
          {/* Controls: Chọn Môn & Khối lớp + Actions */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Selectors for Subject & Grade */}
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Chọn Môn Học:
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Chọn Khối Lớp:
                  </label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value as GradeLevel)}
                    className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-blue-700 outline-none focus:border-blue-500"
                  >
                    <option value="6">Khối 6</option>
                    <option value="7">Khối 7</option>
                    <option value="8">Khối 8</option>
                    <option value="9">Khối 9 (Ôn thi vào 10)</option>
                    <option value="10">Khối 10</option>
                    <option value="11">Khối 11</option>
                    <option value="12">Khối 12 (Luyện thi THPTQG)</option>
                    <option value="Ôn Chuyên">Ôn Chuyên</option>
                    <option value="IELTS">IELTS</option>
                    <option value="Luyện Thi ĐH">Luyện Thi ĐH / ĐGNL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Tìm Kiếm Bài Học:
                  </label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm tên bài học, chủ đề, tiết..."
                      value={searchCurriculum}
                      onChange={(e) => setSearchCurriculum(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 w-56"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons: Thêm, Quy Ước & Tự Động Phân Bổ, Import Excel, Export Excel */}
              <div className="flex flex-wrap items-center gap-2 self-start lg:self-end">
                <button
                  type="button"
                  onClick={() => setIsAutoScheduleOpen(true)}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                  title="Quy ước số tiết/tuần và tự động phân chia lại theo tuần & học kỳ theo thời gian thực"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Quy Ước Tiết/Tuần & Tự Động Phân Bổ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsImportCurriculumOpen(true)}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  title="Nhập danh sách bài học và số tiết từ file Excel/CSV"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Add từ file Excel PPCT</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCurriculumExcel}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  title="Tải bảng PPCT hiện tại về máy tính dạng Excel"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Xuất Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingLesson(null);
                    setIsLessonModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Bài Học Mới</span>
                </button>
              </div>
            </div>

            {/* Quick KPI Overview for Curriculum */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <span className="text-slate-500 block text-[10px]">Tổng Số Bài Học / Chủ Đề</span>
                <strong className="text-slate-900 text-base font-bold">
                  {currentGradeLessons.length} bài
                </strong>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <span className="text-emerald-700 block text-[10px] font-medium">Tổng Số Tiết Dạy (Phân Công TKB)</span>
                <strong className="text-emerald-800 text-base font-mono font-bold">
                  {totalPeriods} tiết
                </strong>
              </div>

              <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                <span className="text-purple-700 block text-[10px] font-medium">Số Tuần Học Dự Kiến</span>
                <strong className="text-purple-900 text-base font-mono font-bold">
                  {maxWeek > 0 ? `${maxWeek} tuần` : `~${Math.ceil(totalPeriods / 2)} tuần`}
                </strong>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Môn & Khối Lớp</span>
                <strong className="text-slate-800 text-xs font-bold block truncate">
                  {selectedSubject?.name} · Khối {selectedGrade}
                </strong>
              </div>
            </div>
          </div>

          {/* Table of PPCT */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">
                  Phân Phối Chương Trình Môn {selectedSubject?.name} - Khối {selectedGrade}
                </span>
                <span className="text-slate-400">({displayLessons.length} bài học hiển thị)</span>
              </div>

              {currentGradeLessons.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearCurrentGradePPCT}
                  className="text-slate-400 hover:text-rose-600 text-xs font-medium transition-colors"
                >
                  Xóa toàn bộ PPCT khối này
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-3 w-12 text-center">STT</th>
                    <th className="px-3 py-3 min-w-[90px]">Tiết PPCT</th>
                    <th className="px-4 py-3 min-w-[220px]">Tên Bài Học / Chủ Đề</th>
                    <th className="px-3 py-3 w-24 text-center">Số Tiết</th>
                    <th className="px-3 py-3 w-24 text-center">Tuần / Kỳ</th>
                    <th className="px-4 py-3 min-w-[220px]">Trọng Tâm & Yêu Cầu Cần Đạt</th>
                    <th className="px-4 py-3 min-w-[140px]">Ghi Chú</th>
                    <th className="px-4 py-3 text-right w-24">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {displayLessons.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-14 text-center text-slate-400">
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                            <BookOpen className="w-6 h-6" />
                          </div>
                          <h4 className="font-bold text-slate-800 text-sm">
                            Chưa có phân phối chương trình cho {selectedSubject?.name} - Khối {selectedGrade}
                          </h4>
                          <p className="text-xs text-slate-500">
                            Bạn có thể thêm từng bài học hoặc nhập nhanh toàn bộ danh sách bài học và số tiết từ file Excel (.xlsx, .csv).
                          </p>
                          <div className="flex items-center justify-center gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setIsImportCurriculumOpen(true)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Add từ file Excel PPCT</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLesson(null);
                                setIsLessonModalOpen(true);
                              }}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Thêm bài đầu tiên</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayLessons.map((lesson) => (
                      <tr key={lesson.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3 py-3 text-center font-mono font-bold text-slate-500">
                          {lesson.stt}
                        </td>
                        <td className="px-3 py-3 font-mono font-semibold text-blue-700">
                          <span className="bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {lesson.lessonNumber || `Tiết ${lesson.stt}`}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 text-xs">
                            {lesson.title}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="px-2.5 py-1 rounded-full font-mono font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {lesson.periods} tiết
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center text-slate-600">
                          {lesson.week ? `Tuần ${lesson.week}` : '—'}
                          {lesson.semester && (
                            <span className="block text-[10px] text-slate-400 font-mono">
                              {lesson.semester}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">
                          {lesson.objectives || '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {lesson.notes || '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLesson(lesson);
                                setIsLessonModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Sửa bài học này"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setLessonToDelete(lesson)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Xóa bài học này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Subject (ĐÃ BỎ TRƯỜNG HỌC PHÍ CHUẨN) */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingSubject ? 'Chỉnh Sửa Môn Học' : 'Thêm Môn Học Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSubject} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mã Môn *</label>
                  <input
                    type="text"
                    value={subjectFormData.code || ''}
                    onChange={(e) =>
                      setSubjectFormData({ ...subjectFormData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="VD: MATH, CHEM, ENG"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-mono uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tên Môn Học *</label>
                  <input
                    type="text"
                    value={subjectFormData.name || ''}
                    onChange={(e) =>
                      setSubjectFormData({ ...subjectFormData, name: e.target.value })
                    }
                    placeholder="VD: Toán Học"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mô Tả Chương Trình</label>
                <textarea
                  rows={3}
                  value={subjectFormData.description || ''}
                  onChange={(e) =>
                    setSubjectFormData({ ...subjectFormData, description: e.target.value })
                  }
                  placeholder="VD: Khóa học rèn luyện tư duy logic, các dạng bài bứt phá 9+..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Khối Lớp Áp Dụng</label>
                <div className="flex flex-wrap gap-1.5">
                  {['6', '7', '8', '9', '10', '11', '12', 'Ôn Chuyên', 'IELTS', 'Luyện Thi ĐH'].map((g) => {
                    const isSelected = (subjectFormData.targetGrades || []).includes(g as GradeLevel);
                    return (
                      <button
                        type="button"
                        key={g}
                        onClick={() => {
                          const current = subjectFormData.targetGrades || [];
                          if (isSelected) {
                            setSubjectFormData({
                              ...subjectFormData,
                              targetGrades: current.filter((x) => x !== g),
                            });
                          } else {
                            setSubjectFormData({
                              ...subjectFormData,
                              targetGrades: [...current, g as GradeLevel],
                            });
                          }
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Khối {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingSubject ? 'Lưu Thay Đổi' : 'Tạo Môn Học'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import PPCT from Excel */}
      <ImportCurriculumModal
        isOpen={isImportCurriculumOpen}
        onClose={() => setIsImportCurriculumOpen(false)}
        defaultSubjectId={selectedSubject?.id}
        defaultGradeLevel={selectedGrade}
      />

      {/* Modal Add / Edit Individual Lesson */}
      <CurriculumLessonModal
        isOpen={isLessonModalOpen}
        onClose={() => setIsLessonModalOpen(false)}
        editingLesson={editingLesson}
        defaultSubjectId={selectedSubject?.id}
        defaultGradeLevel={selectedGrade}
      />

      {/* Delete Lesson Confirmation Modal */}
      {lessonToDelete && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Xác nhận xóa bài học?
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {lessonToDelete.title} ({lessonToDelete.periods} tiết)
                  </p>
                </div>
              </div>
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setLessonToDelete(null)}
                className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteCurriculumLesson(lessonToDelete.id);
                  setLessonToDelete(null);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold"
              >
                Xóa Bài Học
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: QUY ƯỚC TIẾT/TUẦN & TỰ ĐỘNG PHÂN BỔ TUẦN - HỌC KỲ */}
      {selectedSubject && (
        <AutoScheduleCurriculumModal
          isOpen={isAutoScheduleOpen}
          onClose={() => setIsAutoScheduleOpen(false)}
          subject={selectedSubject}
          gradeLevel={selectedGrade}
          existingLessons={currentGradeLessons}
        />
      )}
    </div>
  );
};
