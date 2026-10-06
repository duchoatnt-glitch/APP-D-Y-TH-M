import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Material, MaterialCategory, MaterialFileType, GradeLevel } from '../../types/index.ts';
import { MaterialModalPresets } from './MaterialModal.tsx';
import {
  FileText,
  Video,
  Download,
  Eye,
  Plus,
  Search,
  Filter,
  Layers,
  BookOpen,
  Calendar,
  User,
  Edit2,
  Trash2,
  Share2,
  Sparkles,
  Folder,
  FolderOpen,
  FolderPlus,
  FilePlus,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  Upload,
  CheckCircle2,
  Tag,
  Clock,
  School,
  FileSpreadsheet,
} from 'lucide-react';

interface MaterialsViewProps {
  onOpenUploadModal: (mat?: Material, presets?: MaterialModalPresets) => void;
  onOpenPreviewModal: (mat: Material) => void;
}

export const MaterialsView: React.FC<MaterialsViewProps> = ({
  onOpenUploadModal,
  onOpenPreviewModal,
}) => {
  const {
    materials,
    subjects,
    classes,
    teachers,
    curriculumLessons,
    deleteMaterial,
    recordMaterialView,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterFileType, setFilterFileType] = useState('all');
  const [viewMode, setViewMode] = useState<'tree' | 'grid' | 'table'>('tree');

  // Collapsed state for chapters in tree view
  const [collapsedChapters, setCollapsedChapters] = useState<Record<string, boolean>>({});

  const toggleChapterCollapse = (key: string) => {
    setCollapsedChapters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const search = searchTerm.toLowerCase();
      const matchSearch =
        m.title.toLowerCase().includes(search) ||
        m.fileName.toLowerCase().includes(search) ||
        (m.chapter && m.chapter.toLowerCase().includes(search)) ||
        (m.lessonName && m.lessonName.toLowerCase().includes(search)) ||
        (m.description && m.description.toLowerCase().includes(search));

      const matchSubject = filterSubject === 'all' || m.subjectId === filterSubject;
      const matchClass = filterClass === 'all' || m.classId === filterClass;
      const matchGrade = filterGrade === 'all' || m.gradeLevel === filterGrade;
      const matchCategory = filterCategory === 'all' || m.category === filterCategory;
      const matchFileType = filterFileType === 'all' || m.fileType === filterFileType;

      return matchSearch && matchSubject && matchClass && matchGrade && matchCategory && matchFileType;
    });
  }, [materials, searchTerm, filterSubject, filterClass, filterGrade, filterCategory, filterFileType]);

  const totalDownloads = materials.reduce((sum, m) => sum + m.downloadsCount, 0);
  const totalViews = materials.reduce((sum, m) => sum + m.viewsCount, 0);
  const videoCount = materials.filter((m) => m.fileType === 'video').length;

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Xác nhận xóa tài liệu "${title}" khỏi hệ thống?`)) {
      deleteMaterial(id);
    }
  };

  const handlePreview = (mat: Material) => {
    recordMaterialView(mat.id);
    onOpenPreviewModal(mat);
  };

  const handleDownload = (mat: Material) => {
    // Mock download action
    alert(`Đang tải tệp: "${mat.fileName}" (${mat.fileSize}) về máy tính...`);
  };

  const getCategoryBadge = (cat: MaterialCategory) => {
    switch (cat) {
      case 'lecture':
        return { label: 'Bài Giảng', bg: 'bg-blue-50 border-blue-200 text-blue-700' };
      case 'exercise':
        return { label: 'Bài Tập', bg: 'bg-emerald-50 border-emerald-200 text-emerald-700' };
      case 'exam':
        return { label: 'Đề Thi / Kiểm Tra', bg: 'bg-rose-50 border-rose-200 text-rose-700' };
      case 'reference':
        return { label: 'Tài Liệu Tham Khảo', bg: 'bg-purple-50 border-purple-200 text-purple-700' };
      case 'solution':
        return { label: 'Lời Giải Chi Tiết', bg: 'bg-amber-50 border-amber-200 text-amber-700' };
      default:
        return { label: cat, bg: 'bg-slate-50 border-slate-200 text-slate-700' };
    }
  };

  const getFileIcon = (type: MaterialFileType) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4 text-purple-600" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-rose-600" />;
      case 'doc':
        return <BookOpen className="w-4 h-4 text-blue-600" />;
      case 'slide':
        return <Layers className="w-4 h-4 text-amber-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  // Grouping for Tree View (By Class / Subject -> Chapters -> Lessons)
  interface TreeStructure {
    classItem?: typeof classes[0];
    subjectItem: typeof subjects[0];
    gradeLevel: GradeLevel;
    chapters: {
      chapterName: string;
      lessons: {
        lessonName: string;
        curriculumItem?: typeof curriculumLessons[0];
        materials: Material[];
      }[];
      materialsWithoutLesson: Material[];
    }[];
    generalMaterials: Material[];
  }

  const treeData = useMemo(() => {
    const list: TreeStructure[] = [];

    // If a class filter is selected, group primarily by that class
    const targetClasses = filterClass !== 'all' ? classes.filter((c) => c.id === filterClass) : classes;

    // First group by classes
    targetClasses.forEach((cls) => {
      const subject = subjects.find((s) => s.id === cls.subjectId);
      if (!subject) return;
      if (filterSubject !== 'all' && subject.id !== filterSubject) return;
      if (filterGrade !== 'all' && cls.gradeLevel !== filterGrade) return;

      const classMaterials = filteredMaterials.filter((m) => m.classId === cls.id);
      const classCurriculum = curriculumLessons.filter(
        (cl) => cl.subjectId === cls.subjectId && cl.gradeLevel === cls.gradeLevel
      );

      // Collect all chapter names for this subject/grade
      const chapterSet = new Set<string>();
      classMaterials.forEach((m) => {
        if (m.chapter?.trim()) chapterSet.add(m.chapter.trim());
      });

      // Default chapters if set is empty
      if (chapterSet.size === 0) {
        chapterSet.add('Chương 1: Kiến Thức Nền Tảng & Trọng Tâm');
        chapterSet.add('Chuyên Đề Luyện Thi & Bồi Dưỡng Nâng Cao');
      }

      const chaptersList: TreeStructure['chapters'] = [];

      chapterSet.forEach((chapterName) => {
        const chapterMats = classMaterials.filter((m) => m.chapter === chapterName);

        // Group by lesson
        const lessonMap = new Map<string, Material[]>();
        const matsWithoutLesson: Material[] = [];

        chapterMats.forEach((m) => {
          if (m.lessonName?.trim()) {
            const existing = lessonMap.get(m.lessonName.trim()) || [];
            existing.push(m);
            lessonMap.set(m.lessonName.trim(), existing);
          } else {
            matsWithoutLesson.push(m);
          }
        });

        // Add curriculum lessons for suggestions if empty
        classCurriculum.slice(0, 4).forEach((cl) => {
          const formattedTitle = `${cl.lessonNumber ? `${cl.lessonNumber}: ` : ''}${cl.title}`;
          if (!lessonMap.has(formattedTitle) && !lessonMap.has(cl.title)) {
            lessonMap.set(formattedTitle, []);
          }
        });

        const lessonsArray = Array.from(lessonMap.entries()).map(([lessonName, mats]) => {
          const currItem = classCurriculum.find((c) => c.title === lessonName || `${c.lessonNumber}: ${c.title}` === lessonName);
          return {
            lessonName,
            curriculumItem: currItem,
            materials: mats,
          };
        });

        chaptersList.push({
          chapterName,
          lessons: lessonsArray,
          materialsWithoutLesson: matsWithoutLesson,
        });
      });

      const generalMats = classMaterials.filter((m) => !m.chapter);

      list.push({
        classItem: cls,
        subjectItem: subject,
        gradeLevel: cls.gradeLevel,
        chapters: chaptersList,
        generalMaterials: generalMats,
      });
    });

    // Also include general materials not assigned to any specific class
    const unassignedMats = filteredMaterials.filter((m) => !m.classId);
    if (unassignedMats.length > 0) {
      subjects.forEach((subj) => {
        const subjMats = unassignedMats.filter((m) => m.subjectId === subj.id);
        if (subjMats.length === 0) return;
        if (filterSubject !== 'all' && subj.id !== filterSubject) return;

        list.push({
          subjectItem: subj,
          gradeLevel: '12',
          chapters: [
            {
              chapterName: 'Kho Tài Liệu Chung (Dùng Chung Toàn Khối)',
              lessons: [],
              materialsWithoutLesson: subjMats,
            },
          ],
          generalMaterials: [],
        });
      });
    }

    return list;
  }, [filteredMaterials, classes, subjects, curriculumLessons, filterClass, filterSubject, filterGrade]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Quick Actions */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Folder className="w-4 h-4 text-blue-600" />
            <span>Kho Lưu Trữ Bài Giảng & Tài Liệu Học Tập</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-blue-700">{materials.length} học liệu trực tuyến</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Kho Bài Giảng, Đề Thi & Tài Liệu Học Tập
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý và đăng tải tài liệu từ máy tính theo <strong>Lớp học</strong>, <strong>Chương chuyên đề</strong> và <strong>Bài học</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1.5 font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'tree'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Cây Thư Mục Theo Lớp/Chương/Bài</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Dạng Thẻ</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Dạng Bảng</span>
            </button>
          </div>

          {/* Master Add Material Button */}
          <button
            type="button"
            onClick={() => onOpenUploadModal()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <Upload className="w-4 h-4" />
            <span>Tải Lên Tài Liệu Từ Máy Tính</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-slate-500 block text-xs font-medium">Tổng Số Tài Liệu Hệ Thống</span>
          <div className="text-xl font-bold text-slate-900 font-mono mt-1 tabular-nums">
            {materials.length} tài liệu
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
            {subjects.length} bộ môn · {classes.length} lớp học
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-slate-500 block text-xs font-medium">Lượt Học Sinh Tải Về</span>
          <div className="text-xl font-bold text-emerald-600 font-mono mt-1 tabular-nums">
            {totalDownloads.toLocaleString('vi-VN')} lượt tải
          </div>
          <span className="text-[11px] text-emerald-700 font-medium mt-0.5 block">
            Học sinh tự do tải về ôn luyện 24/7
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-slate-500 block text-xs font-medium">Tổng Lượt Xem Trực Tiếp</span>
          <div className="text-xl font-bold text-blue-600 font-mono mt-1 tabular-nums">
            {totalViews.toLocaleString('vi-VN')} lượt xem
          </div>
          <span className="text-[11px] text-blue-700 font-medium mt-0.5 block">
            Xem online qua Cổng Phụ Huynh & Học Sinh
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-slate-500 block text-xs font-medium">Video Bài Giảng & Slide</span>
          <div className="text-xl font-bold text-purple-600 font-mono mt-1 tabular-nums">
            {videoCount} video bài giảng
          </div>
          <span className="text-[11px] text-purple-700 font-medium mt-0.5 block">
            Bài giảng số hóa đa phương tiện
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Keyword Search */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên bài giảng, chương, bài, tên file, giáo viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-medium"
            />
          </div>

          {/* Filter by Class */}
          <div>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800 focus:border-blue-500"
            >
              <option value="all">-- Tất Cả Lớp Học --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Subject */}
          <div>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800 focus:border-blue-500"
            >
              <option value="all">-- Tất Cả Môn Học --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Grade */}
          <div>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium focus:border-blue-500"
            >
              <option value="all">-- Tất Cả Khối --</option>
              <option value="6">Khối 6</option>
              <option value="7">Khối 7</option>
              <option value="8">Khối 8</option>
              <option value="9">Khối 9</option>
              <option value="10">Khối 10</option>
              <option value="11">Khối 11</option>
              <option value="12">Khối 12</option>
              <option value="IELTS">IELTS</option>
              <option value="Ôn Chuyên">Ôn Chuyên</option>
              <option value="Luyện Thi ĐH">ĐGNL / ĐGTD</option>
            </select>
          </div>

          {/* Filter by Category */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium focus:border-blue-500"
            >
              <option value="all">-- Tất Cả Loại --</option>
              <option value="lecture">Bài Giảng</option>
              <option value="exercise">Bài Tập</option>
              <option value="exam">Đề Thi</option>
              <option value="reference">Tham Khảo</option>
              <option value="solution">Lời Giải</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Reset and Stats */}
        <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1">
          <div>
            Đang hiển thị <strong>{filteredMaterials.length}</strong> / {materials.length} tài liệu học tập
          </div>
          {(searchTerm || filterClass !== 'all' || filterSubject !== 'all' || filterGrade !== 'all' || filterCategory !== 'all' || filterFileType !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFilterClass('all');
                setFilterSubject('all');
                setFilterGrade('all');
                setFilterCategory('all');
                setFilterFileType('all');
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
            >
              Xóa tất cả bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. VIEW MODE: HIERARCHICAL TREE (THEO KHỐI/LỚP -> CHƯƠNG -> BÀI HỌC) */}
      {/* ========================================================================= */}
      {viewMode === 'tree' && (
        <div className="space-y-6">
          {treeData.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <FolderPlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-base">Không tìm thấy tài liệu phù hợp</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Chưa có tài liệu nào trong danh mục hoặc bộ lọc hiện tại. Bạn có thể bắt đầu đăng tải tài liệu từ máy tính ngay bây giờ.
              </p>
              <button
                type="button"
                onClick={() => onOpenUploadModal()}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Tài Liệu Mới</span>
              </button>
            </div>
          ) : (
            treeData.map((node, nodeIdx) => {
              const classTitle = node.classItem
                ? `Lớp ${node.classItem.code} - ${node.classItem.name}`
                : `Môn ${node.subjectItem.name} (Khối ${node.gradeLevel})`;
              const teacherObj = teachers.find((t) => t.id === node.classItem?.teacherId);

              return (
                <div
                  key={`tree-node-${nodeIdx}`}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
                >
                  {/* Class / Subject Card Header with Direct Add Material for Class Button */}
                  <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        <GraduationCap className="w-5 h-5 text-amber-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-900 text-base">
                            {classTitle}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            {node.subjectItem.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                            Khối {node.gradeLevel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {teacherObj ? `Giáo viên phụ trách: ${teacherObj.name} (${teacherObj.code})` : 'Tài liệu dùng chung toàn khối'}
                        </p>
                      </div>
                    </div>

                    {/* Button: ADD MATERIAL FOR THIS CLASS */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onOpenUploadModal(undefined, {
                            classId: node.classItem?.id,
                            subjectId: node.subjectItem.id,
                            gradeLevel: node.gradeLevel,
                          })
                        }
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        title="Tải lên tài liệu mới gắn trực tiếp cho lớp này"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Thêm Tài Liệu Cho Lớp Này</span>
                      </button>
                    </div>
                  </div>

                  {/* Chapters List */}
                  <div className="p-4 space-y-4">
                    {node.chapters.map((chap, chapIdx) => {
                      const collapseKey = `${node.classItem?.id || node.subjectItem.id}-${chap.chapterName}`;
                      const isCollapsed = collapsedChapters[collapseKey];
                      const totalMatsInChapter =
                        chap.materialsWithoutLesson.length +
                        chap.lessons.reduce((sum, l) => sum + l.materials.length, 0);

                      return (
                        <div
                          key={`chap-${chapIdx}`}
                          className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs"
                        >
                          {/* Chapter Header with Direct Add Material for Chapter Button */}
                          <div className="bg-slate-100/80 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200">
                            <button
                              type="button"
                              onClick={() => toggleChapterCollapse(collapseKey)}
                              className="flex items-center gap-2 text-left font-bold text-slate-800 text-sm hover:text-blue-600 transition-colors cursor-pointer flex-1"
                            >
                              {isCollapsed ? (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-600" />
                              )}
                              <Folder className="w-4 h-4 text-amber-500 fill-amber-100" />
                              <span>{chap.chapterName}</span>
                              <span className="text-[11px] font-normal text-slate-500 font-mono">
                                ({totalMatsInChapter} tài liệu)
                              </span>
                            </button>

                            {/* Button: ADD MATERIAL FOR THIS CHAPTER */}
                            <div className="flex items-center gap-2 pl-6 sm:pl-0">
                              <button
                                type="button"
                                onClick={() =>
                                  onOpenUploadModal(undefined, {
                                    classId: node.classItem?.id,
                                    subjectId: node.subjectItem.id,
                                    gradeLevel: node.gradeLevel,
                                    chapter: chap.chapterName,
                                  })
                                }
                                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Thêm tài liệu từ máy tính cho chương này"
                              >
                                <FolderPlus className="w-3.5 h-3.5 text-blue-600" />
                                <span>+ Thêm Tài Liệu Cho Chương Này</span>
                              </button>
                            </div>
                          </div>

                          {/* Chapter Content (Lessons & Direct Materials) */}
                          {!isCollapsed && (
                            <div className="p-3 space-y-3 bg-slate-50/40">
                              {/* Materials directly under chapter without specific lesson */}
                              {chap.materialsWithoutLesson.length > 0 && (
                                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                                  <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                                    <Tag className="w-3.5 h-3.5 text-blue-500" />
                                    <span>Tài Liệu Tổng Ôn & Chuyên Đề Chương:</span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {chap.materialsWithoutLesson.map((mat) => (
                                      <MaterialCardItem
                                        key={mat.id}
                                        mat={mat}
                                        onPreview={() => handlePreview(mat)}
                                        onDownload={() => handleDownload(mat)}
                                        onEdit={() => onOpenUploadModal(mat)}
                                        onDelete={() => handleDelete(mat.id, mat.title)}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Lessons inside chapter */}
                              {chap.lessons.map((les, lesIdx) => (
                                <div
                                  key={`les-${lesIdx}`}
                                  className="bg-white rounded-xl border border-slate-200 p-3 space-y-2.5 hover:border-blue-200 transition-colors"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                    <div className="flex items-start gap-2">
                                      <BookOpen className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                      <div>
                                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                                          {les.lessonName}
                                        </h4>
                                        {les.curriculumItem?.objectives && (
                                          <p className="text-[11px] text-slate-500 italic mt-0.5 line-clamp-1">
                                            {les.curriculumItem.objectives}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Button: ADD MATERIAL FOR THIS LESSON */}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onOpenUploadModal(undefined, {
                                          classId: node.classItem?.id,
                                          subjectId: node.subjectItem.id,
                                          gradeLevel: node.gradeLevel,
                                          chapter: chap.chapterName,
                                          lessonName: les.lessonName,
                                          lessonId: les.curriculumItem?.id,
                                        })
                                      }
                                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                                      title="Tải lên tệp từ máy tính cho bài học này"
                                    >
                                      <FilePlus className="w-3.5 h-3.5" />
                                      <span>+ Thêm Tài Liệu Cho Bài Này</span>
                                    </button>
                                  </div>

                                  {/* Materials in this lesson */}
                                  {les.materials.length === 0 ? (
                                    <div className="py-2.5 text-center text-slate-400 text-xs italic bg-slate-50/50 rounded-lg border border-dashed border-slate-200 flex items-center justify-center gap-2">
                                      <span>Chưa có tài liệu đính kèm cho bài này.</span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onOpenUploadModal(undefined, {
                                            classId: node.classItem?.id,
                                            subjectId: node.subjectItem.id,
                                            gradeLevel: node.gradeLevel,
                                            chapter: chap.chapterName,
                                            lessonName: les.lessonName,
                                            lessonId: les.curriculumItem?.id,
                                          })
                                        }
                                        className="text-blue-600 hover:text-blue-800 font-bold underline not-italic cursor-pointer"
                                      >
                                        Bấm vào đây để tải lên từ máy tính
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {les.materials.map((mat) => (
                                        <MaterialCardItem
                                          key={mat.id}
                                          mat={mat}
                                          onPreview={() => handlePreview(mat)}
                                          onDownload={() => handleDownload(mat)}
                                          onEdit={() => onOpenUploadModal(mat)}
                                          onDelete={() => handleDelete(mat.id, mat.title)}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VIEW MODE: GRID CARDS */}
      {/* ========================================================================= */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((mat) => {
            const subject = subjects.find((s) => s.id === mat.subjectId);
            const teacher = teachers.find((t) => t.id === mat.teacherId);
            const cls = classes.find((c) => c.id === mat.classId);
            const catBadge = getCategoryBadge(mat.category);

            return (
              <div
                key={mat.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all p-4 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        {getFileIcon(mat.fileType)}
                      </div>
                      <div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${catBadge.bg}`}>
                          {catBadge.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono ml-2">
                          {mat.fileSize}
                        </span>
                      </div>
                    </div>
                  </div>

                  <h3
                    onClick={() => handlePreview(mat)}
                    className="font-bold text-slate-900 text-sm line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer"
                    title={mat.title}
                  >
                    {mat.title}
                  </h3>

                  {mat.chapter && (
                    <div className="text-[11px] text-slate-600 font-medium line-clamp-1 flex items-center gap-1">
                      <Folder className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>{mat.chapter}</span>
                    </div>
                  )}

                  {mat.lessonName && (
                    <div className="text-[11px] text-blue-700 font-medium line-clamp-1 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-blue-500 shrink-0" />
                      <span>{mat.lessonName}</span>
                    </div>
                  )}

                  {mat.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {mat.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>{cls ? `${cls.code} (${cls.name})` : `Khối ${mat.gradeLevel}`}</span>
                    <span>GV: {teacher?.name || 'Trung tâm'}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handlePreview(mat)}
                      className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg flex items-center justify-center gap-1 text-xs transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem Trước</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload(mat)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                      title="Tải về máy tính"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenUploadModal(mat)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(mat.id, mat.title)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VIEW MODE: TABLE LIST */}
      {/* ========================================================================= */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3.5 py-3 text-center w-12">STT</th>
                  <th className="px-3.5 py-3 min-w-[240px]">Tên Tài Liệu / Bài Giảng</th>
                  <th className="px-3.5 py-3 w-32">Môn / Lớp</th>
                  <th className="px-3.5 py-3 min-w-[180px]">Chương & Bài Học</th>
                  <th className="px-3.5 py-3 w-28">Loại</th>
                  <th className="px-3.5 py-3 w-24">Tệp & Kích Thước</th>
                  <th className="px-3.5 py-3 w-32">Giáo Viên</th>
                  <th className="px-3.5 py-3 text-center w-28">Lượt Tải / Xem</th>
                  <th className="px-3.5 py-3 text-right w-28">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredMaterials.map((mat, idx) => {
                  const subject = subjects.find((s) => s.id === mat.subjectId);
                  const teacher = teachers.find((t) => t.id === mat.teacherId);
                  const cls = classes.find((c) => c.id === mat.classId);
                  const catBadge = getCategoryBadge(mat.category);

                  return (
                    <tr key={mat.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-3.5 py-2.5 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="px-3.5 py-2.5">
                        <div
                          onClick={() => handlePreview(mat)}
                          className="font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer line-clamp-1"
                        >
                          {mat.title}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{mat.fileName}</div>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span className="font-bold text-slate-800 block">{subject?.name}</span>
                        <span className="text-[11px] text-slate-500">
                          {cls ? cls.name : `Khối ${mat.gradeLevel}`}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="text-slate-800 font-medium line-clamp-1">
                          {mat.chapter || '—'}
                        </div>
                        <div className="text-[11px] text-blue-700 line-clamp-1">
                          {mat.lessonName || '—'}
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${catBadge.bg}`}>
                          {catBadge.label}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-[11px]">
                        <span className="uppercase font-bold text-slate-700 block">{mat.fileType}</span>
                        <span className="text-slate-400">{mat.fileSize}</span>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-700 font-medium">
                        {teacher?.name || 'Trung tâm'}
                      </td>
                      <td className="px-3.5 py-2.5 text-center font-mono text-[11px]">
                        <span className="text-emerald-700 font-bold">{mat.downloadsCount} tải</span>
                        <span className="text-slate-400 block">{mat.viewsCount} xem</span>
                      </td>
                      <td className="px-3.5 py-2.5 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => handlePreview(mat)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          title="Xem trước"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(mat)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                          title="Tải về"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenUploadModal(mat)}
                          className="p-1 text-slate-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          title="Sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(mat.id, mat.title)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Material Card in Tree View
interface MaterialCardItemProps {
  mat: Material;
  onPreview: () => void;
  onDownload: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const MaterialCardItem: React.FC<MaterialCardItemProps> = ({
  mat,
  onPreview,
  onDownload,
  onEdit,
  onDelete,
}) => {
  const getBadge = () => {
    switch (mat.category) {
      case 'lecture':
        return { label: 'Bài Giảng', bg: 'bg-blue-100 text-blue-800' };
      case 'exercise':
        return { label: 'Bài Tập', bg: 'bg-emerald-100 text-emerald-800' };
      case 'exam':
        return { label: 'Đề Thi', bg: 'bg-rose-100 text-rose-800' };
      case 'reference':
        return { label: 'Tham Khảo', bg: 'bg-purple-100 text-purple-800' };
      case 'solution':
        return { label: 'Lời Giải', bg: 'bg-amber-100 text-amber-800' };
      default:
        return { label: mat.category, bg: 'bg-slate-100 text-slate-800' };
    }
  };

  const badge = getBadge();

  return (
    <div className="bg-white border border-slate-200 hover:border-blue-300 rounded-lg p-2.5 flex items-center justify-between gap-3 shadow-2xs group transition-all">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
          {mat.fileType === 'pdf' ? (
            <FileText className="w-4 h-4 text-rose-600" />
          ) : mat.fileType === 'doc' ? (
            <BookOpen className="w-4 h-4 text-blue-600" />
          ) : mat.fileType === 'video' ? (
            <Video className="w-4 h-4 text-purple-600" />
          ) : (
            <Layers className="w-4 h-4 text-amber-600" />
          )}
        </div>
        <div className="min-w-0">
          <div
            onClick={onPreview}
            className="font-bold text-slate-900 text-xs truncate hover:text-blue-600 cursor-pointer"
            title={mat.title}
          >
            {mat.title}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
            <span className={`px-1.5 py-0.2 rounded font-bold ${badge.bg}`}>{badge.label}</span>
            <span className="font-mono">{mat.fileSize}</span>
            <span>·</span>
            <span>{mat.downloadsCount} tải</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onPreview}
          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
          title="Xem trực tuyến"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onDownload}
          className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
          title="Tải về máy tính"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
          title="Sửa thông tin"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
          title="Xóa"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
