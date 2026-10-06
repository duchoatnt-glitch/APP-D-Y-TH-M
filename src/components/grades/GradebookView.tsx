import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { GradeEntry, ExamType } from '../../types/index.ts';
import {
  Award,
  Plus,
  Save,
  Search,
  BookOpen,
  Calendar,
  TrendingUp,
  Download,
  Printer,
  ChevronRight,
  Sparkles,
  Edit2,
  Trash2,
  X,
  AlertCircle,
} from 'lucide-react';

export const GradebookView: React.FC = () => {
  const {
    classes,
    students,
    subjects,
    teachers,
    grades,
    addGradeBatch,
    updateGradeEntry,
    deleteGradeEntry,
    deleteGradeBatchByExam,
  } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [examName, setExamName] = useState<string>('Khảo sát chất lượng định kỳ tháng 9');
  const [examType, setExamType] = useState<ExamType>('mock_test');
  const [examDate, setExamDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [maxScore, setMaxScore] = useState<number>(10);

  // Edit single grade modal state
  const [editingGrade, setEditingGrade] = useState<GradeEntry | null>(null);
  const [editFormData, setEditFormData] = useState<{
    score: number;
    maxScore: number;
    comment: string;
    examName: string;
    examDate: string;
  }>({
    score: 10,
    maxScore: 10,
    comment: '',
    examName: '',
    examDate: '',
  });

  // Scores input state: { [studentId]: { score: number, comment: string } }
  const [scoreInputs, setScoreInputs] = useState<Record<string, { score: string; comment: string }>>({});

  const currentClass = classes.find((c) => c.id === selectedClassId);
  const currentSubject = subjects.find((s) => s.id === currentClass?.subjectId);
  const currentTeacher = teachers.find((t) => t.id === currentClass?.teacherId);

  // Students in this class
  const classStudents = students.filter((s) => currentClass?.studentIds.includes(s.id));

  // Existing grades for this class
  const classGrades = grades
    .filter((g) => g.classId === selectedClassId)
    .sort((a, b) => b.examDate.localeCompare(a.examDate));

  // Unique exams recorded
  const distinctExams = Array.from(new Set(classGrades.map((g) => g.examName)));

  const handleScoreChange = (studentId: string, val: string) => {
    setScoreInputs((prev) => ({
      ...prev,
      [studentId]: {
        score: val,
        comment: prev[studentId]?.comment || '',
      },
    }));
  };

  const handleCommentChange = (studentId: string, comment: string) => {
    setScoreInputs((prev) => ({
      ...prev,
      [studentId]: {
        score: prev[studentId]?.score || '',
        comment,
      },
    }));
  };

  const handleSaveGrades = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClass) return;

    const entriesToSave: GradeEntry[] = [];
    classStudents.forEach((st) => {
      const input = scoreInputs[st.id];
      if (input && input.score !== '') {
        const numScore = parseFloat(input.score);
        if (!isNaN(numScore)) {
          entriesToSave.push({
            id: `grd-${Date.now()}-${st.id}`,
            classId: selectedClassId,
            studentId: st.id,
            examName,
            examType,
            examDate,
            score: numScore,
            maxScore,
            teacherComment: input.comment || 'Đã hoàn thành bài thi',
          });
        }
      }
    });

    if (entriesToSave.length === 0) {
      alert('Vui lòng nhập ít nhất 1 điểm số của học sinh!');
      return;
    }

    // Sort to determine ranks
    entriesToSave.sort((a, b) => b.score - a.score);
    entriesToSave.forEach((entry, idx) => {
      entry.rankInClass = idx + 1;
    });

    addGradeBatch(entriesToSave);
    alert(`Đã lưu ${entriesToSave.length} điểm thi thành công!`);
    setScoreInputs({});
  };

  const handleOpenEditGrade = (g: GradeEntry) => {
    setEditingGrade(g);
    setEditFormData({
      score: g.score,
      maxScore: g.maxScore,
      comment: g.teacherComment || '',
      examName: g.examName,
      examDate: g.examDate,
    });
  };

  const handleSaveEditGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrade) return;
    updateGradeEntry(editingGrade.id, {
      score: Number(editFormData.score),
      maxScore: Number(editFormData.maxScore),
      teacherComment: editFormData.comment,
      examName: editFormData.examName,
      examDate: editFormData.examDate,
    });
    setEditingGrade(null);
  };

  const handleDeleteGradeSingle = (id: string, stName?: string) => {
    if (window.confirm(`Xác nhận xóa bản ghi điểm của học sinh "${stName || ''}"?`)) {
      deleteGradeEntry(id);
    }
  };

  const handleDeleteExamBatch = (exName: string) => {
    if (window.confirm(`Xác nhận xóa toàn bộ điểm thi "${exName}" của lớp này?`)) {
      deleteGradeBatchByExam(selectedClassId, exName);
    }
  };

  const handleResetForNewExam = () => {
    setExamName(`Bài kiểm tra ${currentSubject?.name || 'Mới'} - ${new Date().toLocaleDateString('vi-VN')}`);
    setScoreInputs({});
  };

  // Summary stats for existing grades
  const validScores = classGrades.map((g) => g.score);
  const highestScore = validScores.length > 0 ? Math.max(...validScores) : 0;
  const lowestScore = validScores.length > 0 ? Math.min(...validScores) : 0;
  const avgScore = validScores.length > 0 ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Sổ Điểm & Theo Dõi Năng Lực Học Sinh</span>
            <span aria-hidden="true">·</span>
            <span>Thang điểm 10 & Thang điểm IELTS 9.0</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Sổ Điểm & Đánh Giá Tiến Bộ
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetForNewExam}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Bài Thi Mới</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>In Bảng Điểm</span>
          </button>
        </div>
      </div>

      {/* Class Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block text-slate-600 font-semibold mb-1">Chọn Lớp Học Cần Nhập / Xem Điểm</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold outline-none focus:border-blue-500"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name} ({c.studentIds.length} HS)
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2 flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
          <div>
            <span className="text-slate-400 block text-[10px]">Môn Học & Khối</span>
            <strong className="text-slate-800 font-medium">{currentSubject?.name} (Khối {currentClass?.gradeLevel})</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Giáo Viên Phụ Trách</span>
            <strong className="text-slate-800 font-medium">{currentTeacher?.name}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Điểm TB Lớp</span>
            <strong className="text-blue-700 font-mono font-bold text-sm">{avgScore} / 10</strong>
          </div>
        </div>
      </div>

      {/* 2 Columns: Fast Grade Entry Form + Historical Exams & Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Grade Entry Form */}
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleSaveGrades} className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Nhập Điểm Bài Kiểm Tra / Đề Khảo Sát Mới
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {classStudents.length} học sinh
              </span>
            </div>

            {/* Exam Details */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">Tên Bài Kiểm Tra / Khảo Sát *</label>
                <input
                  type="text"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-medium"
                  placeholder="VD: Kiểm tra 1 tiết chương Hàm Số / Mock Test 1"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Loại Bài Thi</label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value as ExamType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                >
                  <option value="mock_test">Thi Thử / Khảo Sát</option>
                  <option value="45min">Kiểm Tra 1 Tiết</option>
                  <option value="15min">Kiểm Tra 15 Phút</option>
                  <option value="midterm">Giữa Kỳ</option>
                  <option value="final">Cuối Kỳ</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Ngày Thi</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-mono"
                />
              </div>
            </div>

            {/* Student list with input fields */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="px-3 py-2.5">Họ Tên Học Sinh</th>
                    <th className="px-3 py-2.5 w-28">Điểm Số (0-10)</th>
                    <th className="px-3 py-2.5">Nhận Xét Của Giáo Viên</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {classStudents.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                        Chưa có học sinh nào trong lớp.
                      </td>
                    </tr>
                  ) : (
                    classStudents.map((st) => {
                      const input = scoreInputs[st.id] || { score: '', comment: '' };
                      return (
                        <tr key={st.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-medium">
                            <div className="font-bold text-slate-900">{st.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{st.code} · {st.school}</div>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max={maxScore}
                              value={input.score}
                              onChange={(e) => handleScoreChange(st.id, e.target.value)}
                              placeholder="Điểm..."
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-mono font-bold text-blue-700 bg-white"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={input.comment}
                              onChange={(e) => handleCommentChange(st.id, e.target.value)}
                              placeholder="Lời phê & hướng khắc phục..."
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-slate-700"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition-all cursor-pointer text-xs"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Bảng Điểm Kỳ Thi Này</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Historical Exams & Top Performers */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Lịch Sử Các Bài Thi Đã Ghi Nhận
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">{classGrades.length} điểm số</span>
            </div>

            {/* Quick delete by exam batch if needed */}
            {distinctExams.length > 0 && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-600 block">Các đợt thi của lớp:</span>
                <div className="space-y-1">
                  {distinctExams.map((exName) => (
                    <div key={exName} className="flex items-center justify-between gap-2 text-[11px] bg-white px-2 py-1 rounded border border-slate-200">
                      <span className="truncate font-medium text-slate-800">{exName}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteExamBatch(exName)}
                        className="text-rose-600 hover:text-rose-800 text-[10px] font-semibold hover:underline shrink-0 cursor-pointer flex items-center gap-0.5"
                        title="Xóa cả đợt thi này"
                      >
                        <Trash2 className="w-3 h-3" /> Xóa Đợt Thi
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {classGrades.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Chưa có dữ liệu bài thi cho lớp này.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs max-h-96 overflow-y-auto">
                {classGrades.map((g) => {
                  const st = students.find((s) => s.id === g.studentId);
                  return (
                    <div key={g.id} className="py-2.5 flex items-start justify-between gap-2 group">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 truncate">{st?.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono truncate">
                          {g.examName} · {g.examDate}
                        </div>
                        {g.teacherComment && (
                          <div className="text-[11px] text-slate-600 italic mt-0.5 truncate">
                            "{g.teacherComment}"
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-blue-700 font-mono text-sm">
                            {g.score} / {g.maxScore}
                          </span>
                          {g.rankInClass && (
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1 rounded border border-emerald-200">
                              Hạng {g.rankInClass}
                            </span>
                          )}
                        </div>

                        {/* Sửa & Xóa Buttons for this grade */}
                        <div className="flex items-center gap-1 mt-0.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditGrade(g)}
                            className="px-2 py-0.5 text-[11px] text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded flex items-center gap-0.5 cursor-pointer transition-colors"
                            title="Sửa điểm này"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Sửa</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGradeSingle(g.id, st?.name)}
                            className="px-2 py-0.5 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded flex items-center gap-0.5 cursor-pointer transition-colors"
                            title="Xóa điểm này"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Xóa</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Chỉnh Sửa Điểm Thi */}
      {editingGrade && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden text-xs">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                Chỉnh Sửa Điểm Thi Của Học Sinh
              </h3>
              <button
                onClick={() => setEditingGrade(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditGrade} className="p-5 space-y-3.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tên Bài Thi / Đợt Khảo Sát</label>
                <input
                  type="text"
                  value={editFormData.examName}
                  onChange={(e) => setEditFormData({ ...editFormData, examName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Điểm Số Đạt Được *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={editFormData.maxScore}
                    value={editFormData.score}
                    onChange={(e) => setEditFormData({ ...editFormData, score: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-mono font-bold text-blue-700 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Thang Điểm Tối Đa</label>
                  <input
                    type="number"
                    value={editFormData.maxScore}
                    onChange={(e) => setEditFormData({ ...editFormData, maxScore: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Ngày Thi</label>
                <input
                  type="date"
                  value={editFormData.examDate}
                  onChange={(e) => setEditFormData({ ...editFormData, examDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Lời Phê & Nhận Xét Của Giáo Viên</label>
                <textarea
                  rows={3}
                  value={editFormData.comment}
                  onChange={(e) => setEditFormData({ ...editFormData, comment: e.target.value })}
                  placeholder="Nhận xét sự tiến bộ, điểm cần khắc phục..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingGrade(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu Thay Đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
