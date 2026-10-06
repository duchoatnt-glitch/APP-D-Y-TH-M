import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Material, MaterialCategory, MaterialFileType, GradeLevel } from '../../types/index.ts';
import {
  X,
  Upload,
  FileText,
  Video,
  Save,
  CheckCircle,
  FolderPlus,
  BookOpen,
  GraduationCap,
  Sparkles,
  Layers,
  FileCode,
  FileSpreadsheet,
} from 'lucide-react';

export interface MaterialModalPresets {
  classId?: string;
  subjectId?: string;
  gradeLevel?: GradeLevel;
  chapter?: string;
  lessonName?: string;
  lessonId?: string;
}

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingMaterial?: Material | null;
  presets?: MaterialModalPresets;
}

export const MaterialModal: React.FC<MaterialModalProps> = ({
  isOpen,
  onClose,
  editingMaterial,
  presets,
}) => {
  const { subjects, classes, teachers, curriculumLessons, materials, addMaterial, updateMaterial } = useApp();

  const [formData, setFormData] = useState<Partial<Material>>({
    title: '',
    description: '',
    subjectId: subjects[0]?.id || '',
    gradeLevel: '12',
    classId: '',
    chapter: '',
    lessonName: '',
    lessonId: '',
    teacherId: teachers[0]?.id || '',
    fileType: 'pdf',
    fileName: '',
    fileSize: '',
    category: 'lecture',
  });

  const [uploadedLocalFileName, setUploadedLocalFileName] = useState<string>('');
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);

  // Extract unique chapters currently in use for autocomplete
  const existingChapters = Array.from(
    new Set(
      materials
        .map((m) => m.chapter)
        .filter((ch): ch is string => Boolean(ch && ch.trim()))
    )
  );

  useEffect(() => {
    if (editingMaterial) {
      setFormData(editingMaterial);
      setUploadedLocalFileName(editingMaterial.fileName);
      setSelectedFileObj(null);
    } else {
      // Apply presets if provided
      let targetSubjectId = presets?.subjectId || subjects[0]?.id || '';
      let targetGradeLevel: GradeLevel = presets?.gradeLevel || '12';
      let targetTeacherId = teachers[0]?.id || '';

      if (presets?.classId) {
        const cls = classes.find((c) => c.id === presets.classId);
        if (cls) {
          targetSubjectId = cls.subjectId;
          targetGradeLevel = cls.gradeLevel;
          targetTeacherId = cls.teacherId || teachers[0]?.id || '';
        }
      }

      setFormData({
        title: presets?.lessonName ? `Tài liệu: ${presets.lessonName}` : '',
        description: '',
        subjectId: targetSubjectId,
        gradeLevel: targetGradeLevel,
        classId: presets?.classId || '',
        chapter: presets?.chapter || '',
        lessonName: presets?.lessonName || '',
        lessonId: presets?.lessonId || '',
        teacherId: targetTeacherId,
        fileType: 'pdf',
        fileName: '',
        fileSize: '',
        category: 'lecture',
      });
      setUploadedLocalFileName('');
      setSelectedFileObj(null);
    }
  }, [editingMaterial, presets, isOpen, subjects, classes, teachers]);

  if (!isOpen) return null;

  // Relevant curriculum lessons based on selected subject and grade
  const relevantLessons = curriculumLessons.filter(
    (l) => l.subjectId === formData.subjectId && l.gradeLevel === formData.gradeLevel
  );

  // Classes filtered by selected subject and grade
  const availableClasses = classes.filter(
    (c) =>
      (!formData.subjectId || c.subjectId === formData.subjectId) &&
      (!formData.gradeLevel || c.gradeLevel === formData.gradeLevel)
  );

  const handleClassChange = (selectedClassId: string) => {
    if (!selectedClassId) {
      setFormData((prev) => ({ ...prev, classId: '' }));
      return;
    }
    const cls = classes.find((c) => c.id === selectedClassId);
    if (cls) {
      setFormData((prev) => ({
        ...prev,
        classId: cls.id,
        subjectId: cls.subjectId,
        gradeLevel: cls.gradeLevel,
        teacherId: cls.teacherId || prev.teacherId,
      }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileObj(file);
    setUploadedLocalFileName(file.name);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    const ext = file.name.split('.').pop()?.toLowerCase();

    let detectedType: MaterialFileType = 'pdf';
    if (ext === 'doc' || ext === 'docx') detectedType = 'doc';
    else if (ext === 'mp4' || ext === 'mov' || ext === 'avi' || ext === 'mkv') detectedType = 'video';
    else if (ext === 'ppt' || ext === 'pptx') detectedType = 'slide';

    // Auto title from file name if empty
    const rawTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_\\-]/g, ' ');

    setFormData((prev) => ({
      ...prev,
      fileName: file.name,
      fileSize: `${sizeInMb} MB`,
      fileType: detectedType,
      title: prev.title || rawTitle,
    }));
  };

  const handleLessonSelect = (lessonTitle: string) => {
    const matched = relevantLessons.find((l) => l.title === lessonTitle);
    setFormData((prev) => ({
      ...prev,
      lessonName: lessonTitle,
      lessonId: matched ? matched.id : prev.lessonId,
      title: prev.title || (lessonTitle ? `Bài giảng & Bài tập: ${lessonTitle}` : prev.title),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      alert('Vui lòng nhập tiêu đề tài liệu / bài giảng!');
      return;
    }

    const defaultFileName = formData.fileName || uploadedLocalFileName || `${formData.title?.trim().replace(/\s+/g, '_')}.${formData.fileType === 'doc' ? 'docx' : formData.fileType === 'slide' ? 'pptx' : formData.fileType === 'video' ? 'mp4' : 'pdf'}`;
    const defaultFileSize = formData.fileSize || '3.5 MB';

    if (editingMaterial) {
      updateMaterial(editingMaterial.id, {
        ...formData,
        fileName: defaultFileName,
        fileSize: defaultFileSize,
      });
    } else {
      addMaterial({
        ...(formData as Material),
        id: `mat-${Date.now()}`,
        fileName: defaultFileName,
        fileSize: defaultFileSize,
        uploadDate: new Date().toISOString().split('T')[0],
        downloadsCount: 0,
        viewsCount: 0,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-2xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {editingMaterial ? 'Chỉnh Sửa Tài Liệu Học Tập' : 'Tải Lên Tài Liệu Từ Máy Tính'}
              </h3>
              <p className="text-xs text-slate-500">
                Gắn tài liệu trực tiếp theo <strong>Lớp học</strong>, <strong>Chương chuyên đề</strong> và <strong>Bài học</strong>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {/* 1. Tải Tệp Từ Máy Tính (Drag & Drop Zone) */}
          <div className="space-y-1.5">
            <label className="block text-slate-800 font-bold">
              1. Chọn Tệp Tài Liệu Từ Máy Tính <span className="text-rose-500">*</span>
            </label>
            <div className="border-2 border-dashed border-blue-300 hover:border-blue-600 rounded-xl p-5 text-center bg-blue-50/30 hover:bg-blue-50/60 transition-all cursor-pointer relative group">
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.mp4,.ppt,.pptx,.xls,.xlsx,.zip,.rar"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-12 h-12 rounded-full bg-blue-100 group-hover:bg-blue-200 text-blue-700 flex items-center justify-center mx-auto mb-2 transition-colors">
                <Upload className="w-6 h-6" />
              </div>
              {uploadedLocalFileName ? (
                <div className="space-y-1">
                  <div className="text-emerald-700 font-bold text-sm flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Đã đính kèm tệp: {uploadedLocalFileName}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Dung lượng: {formData.fileSize || '3.5 MB'} · Bấm hoặc kéo thả tệp khác để thay thế
                  </span>
                </div>
              ) : (
                <div>
                  <span className="font-bold text-slate-800 text-sm block">
                    Bấm để chọn tệp từ máy tính hoặc kéo thả tệp vào đây
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Hỗ trợ tệp PDF, Word (.docx), PowerPoint (.pptx), Excel (.xlsx), Video bài giảng (.mp4), Tệp nén (.zip)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 2. Cấu trúc phân cấp: Lớp học -> Môn học -> Khối */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="block text-slate-800 font-bold">
              2. Phân Cấp Lớp Học & Môn Học
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Gán Cho Lớp Cụ Thể</label>
                <select
                  value={formData.classId || ''}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-medium bg-white focus:border-blue-500"
                >
                  <option value="">-- Áp dụng chung cho Khối --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name} ({c.gradeLevel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Môn Học *</label>
                <select
                  value={formData.subjectId || ''}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-semibold text-slate-900 bg-white focus:border-blue-500"
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
                  value={formData.gradeLevel || '12'}
                  onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value as GradeLevel })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-semibold text-slate-900 bg-white focus:border-blue-500"
                  required
                >
                  <option value="6">Khối 6</option>
                  <option value="7">Khối 7</option>
                  <option value="8">Khối 8</option>
                  <option value="9">Khối 9 (Vào 10)</option>
                  <option value="10">Khối 10</option>
                  <option value="11">Khối 11</option>
                  <option value="12">Khối 12 (THPTQG)</option>
                  <option value="IELTS">IELTS</option>
                  <option value="Ôn Chuyên">Ôn Chuyên</option>
                  <option value="Luyện Thi ĐH">ĐGNL / ĐGTD</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Cấu trúc phân cấp: Chương / Chuyên đề & Bài học */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="block text-slate-800 font-bold">
              3. Phân Cấp Chương / Chuyên Đề & Bài Học
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Chương / Chuyên Đề
                </label>
                <input
                  type="text"
                  list="chapter-suggestions"
                  value={formData.chapter || ''}
                  onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-medium"
                  placeholder="VD: Chương 1: Ứng dụng đạo hàm khảo sát hàm số"
                />
                <datalist id="chapter-suggestions">
                  {existingChapters.map((ch, idx) => (
                    <option key={idx} value={ch} />
                  ))}
                  <option value="Chương 1: Khảo Sát Hàm Số & Ứng Dụng Đạo Hàm" />
                  <option value="Chương 2: Khối Đa Diện & Thể Tích" />
                  <option value="Chương 3: Hàm Số Lũy Thừa, Mũ & Logarit" />
                  <option value="Chương 4: Nguyên Hàm, Tích Phân & Ứng Dụng" />
                  <option value="Chuyên Đề 01: Dao Động Cơ & Sóng Cơ Học" />
                  <option value="Chuyên Đề 02: Dòng Điện Xoay Chiều & Sóng Ánh Sáng" />
                  <option value="Chuyên Đề 01: Este - Lipit & Cacbohidrat" />
                  <option value="Chuyên Đề 01: Kỹ Năng Đọc Hiểu & Nghị Luận Xã Hội" />
                </datalist>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Nhập tên chương hoặc chọn từ danh sách gợi ý
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Bài Học / Tiết PPCT
                </label>
                <input
                  type="text"
                  list="lesson-suggestions"
                  value={formData.lessonName || ''}
                  onChange={(e) => handleLessonSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-medium"
                  placeholder="VD: Bài 1: Sự đồng biến, nghịch biến của hàm số"
                />
                <datalist id="lesson-suggestions">
                  {relevantLessons.map((l) => (
                    <option key={l.id} value={`${l.lessonNumber ? `${l.lessonNumber}: ` : ''}${l.title}`} />
                  ))}
                </datalist>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Chọn từ phân phối chương trình môn học hoặc nhập tự do
                </span>
              </div>
            </div>
          </div>

          {/* 4. Thông tin chi tiết tài liệu */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Tiêu Đề Bài Giảng / Đề Thi / Tài Liệu <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-bold text-slate-900 text-xs"
                placeholder="VD: Chuyên đề 01: Khảo sát hàm số & cực trị vận dụng cao (Đích 9+)"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Giáo Viên Biên Soạn *</label>
                <select
                  value={formData.teacherId || ''}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-medium"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Phân Loại Tài Liệu</label>
                <select
                  value={formData.category || 'lecture'}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as MaterialCategory })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-medium"
                >
                  <option value="lecture">Bài Giảng Lý Thuyết</option>
                  <option value="exercise">Phiếu Bài Tập Rèn Luyện</option>
                  <option value="exam">Đề Thi / Đề Khảo Sát</option>
                  <option value="reference">Tài Liệu Tham Khảo Mở Rộng</option>
                  <option value="solution">Lời Giải & Hướng Dẫn Chi Tiết</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Định Dạng Tệp</label>
                <select
                  value={formData.fileType || 'pdf'}
                  onChange={(e) => setFormData({ ...formData, fileType: e.target.value as MaterialFileType })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none uppercase font-mono font-bold"
                >
                  <option value="pdf">PDF (Tài liệu chuẩn in)</option>
                  <option value="doc">Word (.docx)</option>
                  <option value="video">Video (.mp4 bài giảng)</option>
                  <option value="slide">Slide (.pptx)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Mô Tả Nội Dung & Yêu Cầu Học Sinh
              </label>
              <textarea
                rows={2}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="VD: Tổng hợp các dạng toán cực trị hàm số trọng tâm, học sinh in ra và làm trước khi đến lớp..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{editingMaterial ? 'Lưu Thay Đổi' : 'Lưu & Đăng Tải Lên Hệ Thống'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
