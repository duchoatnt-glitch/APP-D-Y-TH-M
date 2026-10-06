import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Subject, GradeLevel, CurriculumLesson } from '../../types/index.ts';
import { X, Save, BookOpen, Clock, Calendar } from 'lucide-react';

interface CurriculumLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingLesson?: CurriculumLesson | null;
  defaultSubjectId?: string;
  defaultGradeLevel?: GradeLevel;
}

export const CurriculumLessonModal: React.FC<CurriculumLessonModalProps> = ({
  isOpen,
  onClose,
  editingLesson,
  defaultSubjectId,
  defaultGradeLevel = '12',
}) => {
  const { subjects, addCurriculumLesson, updateCurriculumLesson, curriculumLessons } = useApp();

  const [formData, setFormData] = useState<Partial<CurriculumLesson>>({
    subjectId: defaultSubjectId || subjects[0]?.id || '',
    gradeLevel: defaultGradeLevel,
    stt: 1,
    lessonNumber: 'Tiết 1',
    title: '',
    periods: 2,
    week: 1,
    semester: 'HK1',
    objectives: '',
    notes: '',
  });

  useEffect(() => {
    if (editingLesson) {
      setFormData(editingLesson);
    } else {
      const subjectLessons = curriculumLessons.filter(
        (l) => l.subjectId === (defaultSubjectId || subjects[0]?.id) && l.gradeLevel === defaultGradeLevel
      );
      const nextStt = subjectLessons.length + 1;
      setFormData({
        subjectId: defaultSubjectId || subjects[0]?.id || '',
        gradeLevel: defaultGradeLevel,
        stt: nextStt,
        lessonNumber: `Tiết ${nextStt}`,
        title: '',
        periods: 2,
        week: Math.ceil(nextStt / 2),
        semester: 'HK1',
        objectives: '',
        notes: '',
      });
    }
  }, [editingLesson, isOpen, defaultSubjectId, defaultGradeLevel, subjects, curriculumLessons]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.subjectId || !formData.gradeLevel) {
      alert('Vui lòng nhập tên bài học / chủ đề và chọn môn học, khối lớp!');
      return;
    }

    if (editingLesson) {
      updateCurriculumLesson(editingLesson.id, formData);
    } else {
      addCurriculumLesson({
        ...formData as CurriculumLesson,
        id: `ppct-${Date.now()}`,
        stt: Number(formData.stt) || 1,
        periods: Number(formData.periods) || 2,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              {editingLesson ? 'Chỉnh Sửa Bài Học / PPCT' : 'Thêm Bài Học Mới Vào PPCT'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Nhập tên bài học và số tiết để phân công vào thời khóa biểu.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Row 1: Subject & Grade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Môn Học *</label>
              <select
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                required
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Khối Lớp *</label>
              <select
                value={formData.gradeLevel}
                onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value as GradeLevel })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                required
              >
                <option value="6">Khối 6</option>
                <option value="7">Khối 7</option>
                <option value="8">Khối 8</option>
                <option value="9">Khối 9</option>
                <option value="10">Khối 10</option>
                <option value="11">Khối 11</option>
                <option value="12">Khối 12</option>
                <option value="Ôn Chuyên">Ôn Chuyên</option>
                <option value="IELTS">IELTS</option>
                <option value="Luyện Thi ĐH">Luyện Thi ĐH</option>
              </select>
            </div>
          </div>

          {/* Row 2: Title */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Tên Bài Học / Chủ Đề *
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="VD: Cực trị của hàm số và bài toán chứa tham số m"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-medium"
              required
            />
          </div>

          {/* Row 3: Periods, Lesson Number, STT */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Số Tiết Dạy *
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={formData.periods || 2}
                onChange={(e) => setFormData({ ...formData, periods: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-blue-300 bg-blue-50/50 rounded-lg outline-none font-mono font-bold text-blue-700 text-center"
                required
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Dùng xếp TKB</span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Tiết Theo PPCT
              </label>
              <input
                type="text"
                value={formData.lessonNumber || ''}
                onChange={(e) => setFormData({ ...formData, lessonNumber: e.target.value })}
                placeholder="VD: Tiết 3-4"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Số Thứ Tự (STT)
              </label>
              <input
                type="number"
                value={formData.stt || 1}
                onChange={(e) => setFormData({ ...formData, stt: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-mono text-center"
              />
            </div>
          </div>

          {/* Row 4: Week & Semester */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Tuần Học</label>
              <input
                type="number"
                value={formData.week || ''}
                onChange={(e) => setFormData({ ...formData, week: Number(e.target.value) })}
                placeholder="VD: 1, 2, 3..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Học Kỳ</label>
              <select
                value={formData.semester || 'HK1'}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
              >
                <option value="HK1">Học kỳ 1</option>
                <option value="HK2">Học kỳ 2</option>
                <option value="Hè">Khóa học Hè</option>
                <option value="Cả năm">Toàn khóa</option>
              </select>
            </div>
          </div>

          {/* Objectives */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Trọng Tâm Kiến Thức / Yêu Cầu Cần Đạt
            </label>
            <textarea
              rows={2}
              value={formData.objectives || ''}
              onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
              placeholder="VD: Nắm vững định lý 1 & 2 về cực trị, kỹ năng giải bài toán tham số..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Ghi Chú</label>
            <input
              type="text"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="VD: Có bài kiểm tra 15 phút, dạng toán điểm 9+..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{editingLesson ? 'Lưu Thay Đổi' : 'Thêm Vào PPCT'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
