import React from 'react';
import { Material } from '../../types/index.ts';
import { useApp } from '../../context/AppContext.tsx';
import {
  X,
  Download,
  FileText,
  Video,
  FileCode,
  Calendar,
  User,
  Eye,
  BookOpen,
  Share2,
  Check,
} from 'lucide-react';

interface MaterialPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material | null;
}

export const MaterialPreviewModal: React.FC<MaterialPreviewModalProps> = ({
  isOpen,
  onClose,
  material,
}) => {
  const { subjects, classes, teachers, recordMaterialDownload } = useApp();
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !material) return null;

  const subject = subjects.find((s) => s.id === material.subjectId);
  const cls = classes.find((c) => c.id === material.classId);
  const teacher = teachers.find((t) => t.id === material.teacherId);

  const handleDownload = () => {
    recordMaterialDownload(material.id);
    // Create simulated or real download
    const blob = new Blob([`Tài liệu: ${material.title}\nGiáo viên: ${teacher?.name || ''}\nMôn: ${subject?.name || ''}\nEduCenter Pro`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = material.fileUrl || url;
    a.download = material.fileName;
    a.click();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase">
              {material.fileType}
            </span>
            <span>·</span>
            <span>{subject?.name}</span>
            <span>·</span>
            <span>Khối {material.gradeLevel}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-snug">
              {material.title}
            </h3>
            {material.description && (
              <p className="text-slate-600 mt-2 leading-relaxed text-xs">
                {material.description}
              </p>
            )}
          </div>

          {/* Meta details strip */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">Giáo Viên Biên Soạn</span>
              <strong className="text-slate-800 font-medium">{teacher?.name || 'Giáo viên phụ trách'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Lớp Học & Môn</span>
              <strong className="text-slate-800 font-medium">{cls ? `${cls.code} (${cls.name})` : `Khối ${material.gradeLevel}`} · {subject?.name}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Chương / Chuyên Đề</span>
              <strong className="text-slate-800 font-medium">{material.chapter || 'Chuyên đề chung'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Bài Học / Tiết PPCT</span>
              <strong className="text-blue-700 font-medium">{material.lessonName || 'Bài học trọng tâm'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Định Dạng & Dung Lượng</span>
              <strong className="text-slate-800 font-mono">{material.fileName} ({material.fileSize})</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Lượt Xem / Tải Về</span>
              <strong className="text-emerald-700 font-mono">{material.viewsCount} xem · {material.downloadsCount} tải</strong>
            </div>
          </div>

          {/* Interactive Document Viewer / Player Simulation */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 text-slate-100 min-h-[300px] flex flex-col items-center justify-center p-8 text-center">
            {material.fileType === 'video' ? (
              <div className="space-y-3 max-w-md">
                <div className="w-16 h-16 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto">
                  <Video className="w-8 h-8" />
                </div>
                <div className="font-bold text-sm text-white">{material.fileName}</div>
                <p className="text-xs text-slate-400">
                  Video bài giảng độ phân giải 1080p full HD, có thể tải về máy hoặc phát trực tiếp cho học sinh.
                </p>
              </div>
            ) : material.fileType === 'pdf' ? (
              <div className="space-y-3 max-w-md">
                <div className="w-16 h-16 rounded-full bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="font-bold text-sm text-white">{material.fileName}</div>
                <p className="text-xs text-slate-400">
                  Tài liệu PDF đã được tối ưu hóa cho in ấn, đọc trên máy tính bảng và điện thoại.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-w-md">
                <div className="w-16 h-16 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div className="font-bold text-sm text-white">{material.fileName}</div>
                <p className="text-xs text-slate-400">
                  Tệp tài liệu học tập chuẩn Microsoft Office (Word / PowerPoint), sẵn sàng chỉnh sửa hoặc in đề.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/70 text-xs">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã sao chép link' : 'Chia sẻ link tài liệu'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tải Về Máy ({material.fileSize})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
