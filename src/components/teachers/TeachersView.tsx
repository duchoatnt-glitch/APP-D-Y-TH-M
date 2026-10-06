import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Teacher, ClassRoom, DelegatedAdminAccount } from '../../types/index.ts';
import {
  Users,
  Plus,
  Phone,
  Mail,
  Award,
  BookOpen,
  Calendar,
  Edit2,
  Trash2,
  X,
  Save,
  Search,
  CheckCircle2,
  UserX,
  AlertCircle,
  GraduationCap,
  CheckSquare,
  Square,
  Check,
  Layers,
  Filter,
  FileSpreadsheet,
  FileText,
  Download,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { getDayOfWeekName } from '../../utils/formatters.ts';
import { TeacherPedagogicalExportModal } from './TeacherPedagogicalExportModal.tsx';
import { AdminDelegationModal } from '../settings/AdminDelegationModal.tsx';

export const TeachersView: React.FC = () => {
  const {
    teachers,
    classes,
    subjects,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    updateClass,
    delegatedAdmins,
    isPrimaryAdmin,
    currentUser,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal State for Add / Edit Teacher
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Modal State for Teacher Pedagogical Export (TKB tuần, Lịch báo giảng, Sổ đầu bài)
  const [pedagogicalModalState, setPedagogicalModalState] = useState<{
    isOpen: boolean;
    teacher: Teacher | null;
    tab: 'timetable' | 'teaching_plan' | 'class_journal';
  }>({
    isOpen: false,
    teacher: null,
    tab: 'timetable',
  });

  // Modal State for Quick Class Assignment (Tích chọn giáo viên dạy lớp nào)
  const [assigningTeacher, setAssigningTeacher] = useState<Teacher | null>(null);
  const [selectedClassIdsForAssign, setSelectedClassIdsForAssign] = useState<string[]>([]);
  const [assignClassSearch, setAssignClassSearch] = useState('');
  const [assignSubjectFilter, setAssignSubjectFilter] = useState('all');
  const [assignSuccessMsg, setAssignSuccessMsg] = useState<string | null>(null);

  // Delete Confirmation Modal State
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

  // Delegated Admin Modal State
  const [isDelegationModalOpen, setIsDelegationModalOpen] = useState(false);
  const [teacherForDelegation, setTeacherForDelegation] = useState<Teacher | null>(null);
  const [accountForDelegation, setAccountForDelegation] = useState<DelegatedAdminAccount | null>(null);

  const [formData, setFormData] = useState<Partial<Teacher> & { assignedClassIds?: string[] }>({
    code: '',
    name: '',
    phone: '',
    email: '',
    subjectIds: [],
    degree: '',
    specialty: '',
    experienceYears: 5,
    status: 'active',
    assignedClassIds: [],
  });

  const handleOpenAddModal = () => {
    setEditingTeacher(null);
    setFormData({
      code: `GV-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      phone: '',
      email: '',
      subjectIds: subjects.length > 0 ? [subjects[0].id] : [],
      degree: 'Cử nhân Sư phạm',
      specialty: 'Giảng dạy kiến thức trọng tâm & luyện thi',
      experienceYears: 5,
      status: 'active',
      assignedClassIds: [],
    });
    setIsTeacherModalOpen(true);
  };

  const handleOpenEditModal = (t: Teacher) => {
    setEditingTeacher(t);
    const currentAssigned = classes.filter((c) => c.teacherId === t.id).map((c) => c.id);
    setFormData({
      code: t.code,
      name: t.name,
      phone: t.phone,
      email: t.email,
      subjectIds: t.subjectIds || [],
      degree: t.degree,
      specialty: t.specialty,
      experienceYears: t.experienceYears,
      status: t.status,
      assignedClassIds: currentAssigned,
    });
    setIsTeacherModalOpen(true);
  };

  const handleSubjectToggle = (subjId: string) => {
    const current = formData.subjectIds || [];
    if (current.includes(subjId)) {
      setFormData({
        ...formData,
        subjectIds: current.filter((id) => id !== subjId),
      });
    } else {
      setFormData({
        ...formData,
        subjectIds: [...current, subjId],
      });
    }
  };

  const handleClassToggleInForm = (classId: string) => {
    const current = formData.assignedClassIds || [];
    if (current.includes(classId)) {
      setFormData({
        ...formData,
        assignedClassIds: current.filter((id) => id !== classId),
      });
    } else {
      setFormData({
        ...formData,
        assignedClassIds: [...current, classId],
      });
    }
  };

  const handleSubmitTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.phone?.trim()) {
      alert('Vui lòng nhập họ tên và số điện thoại của giáo viên!');
      return;
    }

    let targetTeacherId = '';

    if (editingTeacher) {
      targetTeacherId = editingTeacher.id;
      updateTeacher(editingTeacher.id, {
        code: formData.code || editingTeacher.code,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email?.trim() || '',
        subjectIds: formData.subjectIds || [],
        degree: formData.degree?.trim() || '',
        specialty: formData.specialty?.trim() || '',
        experienceYears: Number(formData.experienceYears) || 0,
        status: formData.status || 'active',
      });
    } else {
      targetTeacherId = `tc-${Date.now()}`;
      addTeacher({
        id: targetTeacherId,
        code: formData.code || `GV-${Math.floor(1000 + Math.random() * 9000)}`,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email?.trim() || '',
        avatar: '',
        subjectIds: formData.subjectIds || [],
        degree: formData.degree?.trim() || 'Cử nhân Sư phạm',
        specialty: formData.specialty?.trim() || 'Giảng dạy kiến thức trọng tâm',
        experienceYears: Number(formData.experienceYears) || 1,
        ratePerSession: 0,
        bankName: '',
        bankAccount: '',
        bankAccountName: '',
        status: formData.status || 'active',
      });
    }

    // Sync assigned classes
    const assignedIds = formData.assignedClassIds || [];
    classes.forEach((c) => {
      const isSelected = assignedIds.includes(c.id);
      if (isSelected && c.teacherId !== targetTeacherId) {
        updateClass(c.id, { teacherId: targetTeacherId });
      } else if (!isSelected && c.teacherId === targetTeacherId) {
        updateClass(c.id, { teacherId: '' });
      }
    });

    setIsTeacherModalOpen(false);
  };

  // Open Quick Class Assignment Modal
  const handleOpenAssignModal = (t: Teacher) => {
    setAssigningTeacher(t);
    const current = classes.filter((c) => c.teacherId === t.id).map((c) => c.id);
    setSelectedClassIdsForAssign(current);
    setAssignClassSearch('');
    setAssignSubjectFilter('all');
    setAssignSuccessMsg(null);
  };

  const handleToggleAssignClass = (classId: string) => {
    setSelectedClassIdsForAssign((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const handleSaveClassAssignment = () => {
    if (!assigningTeacher) return;
    const targetTeacherId = assigningTeacher.id;

    classes.forEach((c) => {
      const isSelected = selectedClassIdsForAssign.includes(c.id);
      if (isSelected && c.teacherId !== targetTeacherId) {
        updateClass(c.id, { teacherId: targetTeacherId });
      } else if (!isSelected && c.teacherId === targetTeacherId) {
        updateClass(c.id, { teacherId: '' });
      }
    });

    setAssignSuccessMsg(
      `Đã cập nhật phân công thành công! Giáo viên ${assigningTeacher.name} phụ trách ${selectedClassIdsForAssign.length} lớp học.`
    );

    setTimeout(() => {
      setAssigningTeacher(null);
      setAssignSuccessMsg(null);
    }, 1200);
  };

  const handleSelectAllMatchingClasses = () => {
    const matchingIds = filteredClassesForAssign.map((c) => c.id);
    setSelectedClassIdsForAssign((prev) => Array.from(new Set([...prev, ...matchingIds])));
  };

  const handleDeselectAllMatchingClasses = () => {
    const matchingIds = new Set(filteredClassesForAssign.map((c) => c.id));
    setSelectedClassIdsForAssign((prev) => prev.filter((id) => !matchingIds.has(id)));
  };

  const confirmDelete = () => {
    if (teacherToDelete) {
      deleteTeacher(teacherToDelete.id);
      setTeacherToDelete(null);
    }
  };

  // Filtered teachers list
  const filteredTeachers = teachers.filter((t) => {
    const search = searchTerm.toLowerCase();
    const matchSearch =
      !searchTerm ||
      t.name.toLowerCase().includes(search) ||
      t.code.toLowerCase().includes(search) ||
      t.phone.includes(search) ||
      t.email.toLowerCase().includes(search) ||
      t.specialty.toLowerCase().includes(search);

    const matchSubject =
      filterSubject === 'all' || (t.subjectIds && t.subjectIds.includes(filterSubject));

    const matchStatus = filterStatus === 'all' || t.status === filterStatus;

    return matchSearch && matchSubject && matchStatus;
  });

  // Filtered classes list inside Assign Modal
  const filteredClassesForAssign = classes.filter((c) => {
    const q = assignClassSearch.toLowerCase();
    const matchSearch =
      !assignClassSearch ||
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q);
    const matchSubject =
      assignSubjectFilter === 'all' || c.subjectId === assignSubjectFilter;
    return matchSearch && matchSubject;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Main Actions */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Hồ Sơ Đội Ngũ Giảng Dạy & Phân Công Lớp</span>
            <span aria-hidden="true">·</span>
            <span>Tổng {teachers.length} giáo viên & chuyên gia</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Quản Lý Giáo Viên & Phân Công Lớp
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dạng Thẻ
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dạng Bảng
            </button>
          </div>

          {/* NÚT XUẤT HỒ SƠ GIẢNG DẠY & TKB GIÁO VIÊN */}
          <button
            type="button"
            onClick={() =>
              setPedagogicalModalState({
                isOpen: true,
                teacher: teachers[0] || null,
                tab: 'timetable',
              })
            }
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-all cursor-pointer whitespace-nowrap"
            title="Xuất Thời khóa biểu tuần, Lịch báo giảng, Sổ ghi đầu bài theo định dạng Excel, Word, PDF"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Hồ Sơ & TKB Tuần</span>
          </button>

          {/* NÚT THÊM GIÁO VIÊN */}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Giáo Viên</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên giáo viên, mã GV, SĐT, chuyên môn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-500"
          />
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
                {s.name} ({s.code})
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
            <option value="active">Đang giảng dạy</option>
            <option value="leave">Tạm nghỉ</option>
          </select>
        </div>
      </div>

      {/* View Mode: Grid Cards */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map((tc) => {
            const teachingClasses = classes.filter((c) => c.teacherId === tc.id);
            const totalStudents = new Set(teachingClasses.flatMap((c) => c.studentIds)).size;
            const teacherSubjects = subjects.filter((s) => tc.subjectIds?.includes(s.id));
            const isPrimary = tc.name.includes('Nguyễn Đức Hoà') || tc.id === 'tc-hoa';
            const delegatedEntry = delegatedAdmins.find(
              (da) =>
                da.teacherId === tc.id ||
                (da.email && tc.email && da.email.toLowerCase() === tc.email.toLowerCase()) ||
                (da.phone && tc.phone && da.phone.replace(/\D/g, '') === tc.phone.replace(/\D/g, ''))
            );

            return (
              <div
                key={tc.id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar with Avatar & Actions */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-blue-600 text-white font-bold text-base flex items-center justify-center shadow-xs">
                        {tc.name.split(' ').pop()?.charAt(0) || 'G'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-sm leading-snug">{tc.name}</h3>
                          {isPrimary && (
                            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black uppercase">
                              Quản Trị Chính
                            </span>
                          )}
                          {!isPrimary && delegatedEntry && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                              delegatedEntry.status === 'active'
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              Quản Trị Ủy Quyền
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                          <span className="font-mono text-blue-700 font-semibold">{tc.code}</span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={`font-medium ${
                              tc.status === 'active' ? 'text-emerald-700' : 'text-slate-500'
                            }`}
                          >
                            {tc.status === 'active' ? 'Đang giảng dạy' : 'Tạm nghỉ'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons: Edit & Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(tc)}
                        className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Chỉnh sửa thông tin giáo viên"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setTeacherToDelete(tc)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa giáo viên"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Qualifications & Specialties */}
                  <div className="mt-3.5 space-y-2 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Học vị & bằng cấp:</span>
                      <strong className="text-slate-800 font-medium">{tc.degree || 'Cử nhân Sư phạm'}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] block">Chuyên môn giảng dạy:</span>
                      <span className="text-slate-700 leading-relaxed">{tc.specialty || 'Toàn diện'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Kinh nghiệm: <strong className="text-slate-800">{tc.experienceYears} năm</strong></span>
                    </div>

                    {/* Contact Info */}
                    <div className="pt-2 border-t border-slate-100 space-y-1">
                      <div className="flex items-center gap-2 font-mono text-[11px] text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{tc.phone}</span>
                      </div>
                      {tc.email && (
                        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-700 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{tc.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Subjects Taught */}
                    {teacherSubjects.length > 0 && (
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[11px] text-slate-400 block mb-1">Môn học phụ trách:</span>
                        <div className="flex flex-wrap gap-1">
                          {teacherSubjects.map((s) => (
                            <span
                              key={s.id}
                              className="text-[11px] font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded"
                            >
                              {s.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Assigned Classes Preview */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-semibold text-slate-700">
                          Các lớp đang dạy ({teachingClasses.length}):
                        </span>
                      </div>

                      {teachingClasses.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                          {teachingClasses.map((cls) => (
                            <span
                              key={cls.id}
                              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200"
                              title={`${cls.name} (${cls.studentIds.length} học sinh)`}
                            >
                              <span className="font-mono font-bold">{cls.code}</span>
                              <span className="truncate max-w-[120px]">{cls.name}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic py-1">
                          Chưa phân công lớp nào cho giáo viên này.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Bar: Nút tích chọn lớp dạy, Xuất hồ sơ & Phân quyền quản trị */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleOpenAssignModal(tc)}
                    className="flex-1 min-w-[90px] py-1.5 px-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    title="Tích chọn các lớp mà giáo viên này đảm nhiệm giảng dạy"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span>Lớp Dạy ({teachingClasses.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPedagogicalModalState({
                        isOpen: true,
                        teacher: tc,
                        tab: 'timetable',
                      })
                    }
                    className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    title="Xuất Thời khóa biểu tuần, Lịch báo giảng, Sổ ghi đầu bài (Excel, Word, PDF)"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Xuất TKB</span>
                  </button>

                  {!isPrimary && (
                    <button
                      type="button"
                      onClick={() => {
                        setTeacherForDelegation(tc);
                        setAccountForDelegation(delegatedEntry || null);
                        setIsDelegationModalOpen(true);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs ${
                        delegatedEntry
                          ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                          : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200'
                      }`}
                      title="Thầy Hoà phân quyền quản trị (Thêm/xoá lớp, học sinh, TKB)"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{delegatedEntry ? 'Sửa Quyền' : 'Cấp Quyền'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredTeachers.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
              Không tìm thấy giáo viên nào phù hợp với bộ lọc tìm kiếm.
            </div>
          )}
        </div>
      ) : (
        /* View Mode: Data Table */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Mã & Họ Tên</th>
                  <th className="px-4 py-3">Môn Phụ Trách</th>
                  <th className="px-4 py-3">Số Điện Thoại</th>
                  <th className="px-4 py-3 min-w-[220px]">Các Lớp Phụ Trách</th>
                  <th className="px-4 py-3">Trạng Thái</th>
                  <th className="px-4 py-3 text-right min-w-[200px]">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredTeachers.map((tc) => {
                  const teachingClasses = classes.filter((c) => c.teacherId === tc.id);
                  const teacherSubjects = subjects.filter((s) => tc.subjectIds?.includes(s.id));
                  const isPrimary = tc.name.includes('Nguyễn Đức Hoà') || tc.id === 'tc-hoa';
                  const delegatedEntry = delegatedAdmins.find(
                    (da) =>
                      da.teacherId === tc.id ||
                      (da.email && tc.email && da.email.toLowerCase() === tc.email.toLowerCase()) ||
                      (da.phone && tc.phone && da.phone.replace(/\D/g, '') === tc.phone.replace(/\D/g, ''))
                  );

                  return (
                    <tr key={tc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{tc.name}</span>
                          {isPrimary && (
                            <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black uppercase">
                              Quản Trị Chính
                            </span>
                          )}
                          {!isPrimary && delegatedEntry && (
                            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                              delegatedEntry.status === 'active'
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              Quản Trị Ủy Quyền
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-blue-700">{tc.code}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[160px]">
                          {teacherSubjects.map((s) => (
                            <span
                              key={s.id}
                              className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100"
                            >
                              {s.name}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-700 font-medium">
                        {tc.phone}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {teachingClasses.length > 0 ? (
                            teachingClasses.slice(0, 3).map((cls) => (
                              <span
                                key={cls.id}
                                className="inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-100 font-semibold"
                                title={cls.name}
                              >
                                {cls.code}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Chưa phân lớp</span>
                          )}
                          {teachingClasses.length > 3 && (
                            <span className="text-[11px] font-semibold text-slate-500">
                              +{teachingClasses.length - 3} lớp
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            tc.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {tc.status === 'active' ? 'Đang giảng dạy' : 'Tạm nghỉ'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* NÚT TÍCH CHỌN LỚP DẠY */}
                          <button
                            type="button"
                            onClick={() => handleOpenAssignModal(tc)}
                            className="px-2.5 py-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer"
                            title="Tích chọn các lớp giáo viên này đảm nhiệm"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>Chọn lớp ({teachingClasses.length})</span>
                          </button>

                          {/* NÚT XUẤT HỒ SƠ GIẢNG DẠY / TKB */}
                          <button
                            type="button"
                            onClick={() =>
                              setPedagogicalModalState({
                                isOpen: true,
                                teacher: tc,
                                tab: 'timetable',
                              })
                            }
                            className="px-2.5 py-1 text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer"
                            title="Xuất Thời khóa biểu tuần, Lịch báo giảng, Sổ đầu bài"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Xuất TKB/Lịch</span>
                          </button>

                          {!isPrimary && (
                            <button
                              type="button"
                              onClick={() => {
                                setTeacherForDelegation(tc);
                                setAccountForDelegation(delegatedEntry || null);
                                setIsDelegationModalOpen(true);
                              }}
                              className={`p-1.5 rounded transition-colors cursor-pointer ${
                                delegatedEntry
                                  ? 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
                                  : 'text-slate-500 hover:text-indigo-700 hover:bg-slate-100'
                              }`}
                              title="Thầy Hoà cấp hoặc chỉnh sửa quyền quản trị ủy quyền"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(tc)}
                            className="p-1 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded cursor-pointer"
                            title="Sửa thông tin giáo viên"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setTeacherToDelete(tc)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Xóa giáo viên"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: TÍCH CHỌN GIÁO VIÊN DẠY LỚP NÀO */}
      {assigningTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Phân Công Lớp Giảng Dạy Cho Giáo Viên
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tích chọn các lớp học mà giáo viên <strong className="text-slate-900">{assigningTeacher.name}</strong> ({assigningTeacher.code}) sẽ trực tiếp đứng lớp.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssigningTeacher(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success Alert */}
            {assignSuccessMsg && (
              <div className="mx-6 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{assignSuccessMsg}</span>
              </div>
            )}

            {/* Toolbar: Search, Filter & Quick Check */}
            <div className="px-6 py-3 border-b border-slate-100 bg-white space-y-2.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên lớp hoặc mã lớp..."
                    value={assignClassSearch}
                    onChange={(e) => setAssignClassSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <select
                    value={assignSubjectFilter}
                    onChange={(e) => setAssignSubjectFilter(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 outline-none focus:border-blue-500"
                  >
                    <option value="all">Tất cả môn học ({subjects.length})</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Select Buttons */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllMatchingClasses}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                  >
                    + Chọn tất cả lớp đang hiển thị
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleDeselectAllMatchingClasses}
                    className="text-[11px] text-slate-500 hover:text-slate-700 hover:underline"
                  >
                    Bỏ chọn tất cả
                  </button>
                </div>

                <div className="text-[11px] text-slate-600 font-semibold">
                  Đã tích chọn: <span className="text-blue-700 font-bold">{selectedClassIdsForAssign.length} lớp</span>
                </div>
              </div>
            </div>

            {/* Checklist of Classes */}
            <div className="p-6 flex-1 overflow-y-auto space-y-2 text-xs">
              {filteredClassesForAssign.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  Không tìm thấy lớp học nào phù hợp với bộ lọc tìm kiếm.
                </div>
              ) : (
                filteredClassesForAssign.map((cls) => {
                  const isChecked = selectedClassIdsForAssign.includes(cls.id);
                  const currentTeacher = teachers.find((t) => t.id === cls.teacherId);
                  const isAssignedToOther = cls.teacherId && cls.teacherId !== assigningTeacher.id;
                  const subject = subjects.find((s) => s.id === cls.subjectId);

                  return (
                    <div
                      key={cls.id}
                      onClick={() => handleToggleAssignClass(cls.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isChecked
                          ? 'bg-blue-50/70 border-blue-300 shadow-2xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {/* Checkbox Icon */}
                      <div className="mt-0.5 shrink-0">
                        {isChecked ? (
                          <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-md border-2 border-slate-300 bg-white" />
                        )}
                      </div>

                      {/* Class Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded text-[11px]">
                            {cls.code}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">
                            {cls.name}
                          </span>
                          <span className="text-[11px] px-2 py-0.2 rounded-full bg-slate-100 text-slate-700 font-medium">
                            Khối {cls.gradeLevel} · {subject?.name}
                          </span>
                        </div>

                        {/* Schedule & current teacher indicator */}
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-slate-500 text-[11px]">
                          <span>
                            Sĩ số: <strong>{cls.studentIds.length}</strong> học sinh
                          </span>
                          <span>·</span>
                          <span>
                            Lịch: {cls.daysOfWeek?.map((d) => getDayOfWeekName(d)).join(', ') || 'Chưa xếp'} ({cls.timeSlot?.start}-{cls.timeSlot?.end})
                          </span>

                          {/* Current teacher warning if assigned to another */}
                          {isAssignedToOther && (
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                              Hiện tại: {currentTeacher?.name} (sẽ chuyển sang {assigningTeacher.name})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Giáo viên: <strong>{assigningTeacher.name}</strong> · Phụ trách: <strong>{selectedClassIdsForAssign.length}</strong> lớp
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAssigningTeacher(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSaveClassAssignment}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Phân Công ({selectedClassIdsForAssign.length} lớp)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: THÊM / CHỈNH SỬA THÔNG TIN GIÁO VIÊN */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingTeacher ? 'Chỉnh Sửa Thông Tin Giáo Viên' : 'Thêm Giáo Viên Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsTeacherModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTeacher} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mã Giáo Viên *</label>
                  <input
                    type="text"
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase outline-none focus:border-blue-500"
                    placeholder="VD: GV-TOAN01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Họ và Tên *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-medium"
                    placeholder="VD: ThS. Nguyễn Văn Hưng"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Số Điện Thoại *</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono outline-none focus:border-blue-500"
                    placeholder="0912.345.678"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-mono"
                    placeholder="giaovien@gmail.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Học Vị & Bằng Cấp</label>
                <input
                  type="text"
                  value={formData.degree || ''}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  placeholder="VD: Thạc sĩ Toán học - ĐH Sư Phạm Hà Nội"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Chuyên Môn & Thế Mạnh</label>
                <input
                  type="text"
                  value={formData.specialty || ''}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  placeholder="VD: Chuyên luyện thi 9+ THPTQG & Luyện thi Chuyên Toán"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Số Năm Kinh Nghiệm</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={formData.experienceYears || 5}
                    onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Trạng Thái Giảng Dạy</label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'leave' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="active">Đang giảng dạy</option>
                    <option value="leave">Tạm nghỉ</option>
                  </select>
                </div>
              </div>

              {/* Môn học phụ trách */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Môn Học Phụ Trách</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 border border-slate-200 rounded-xl bg-slate-50/60 max-h-32 overflow-y-auto">
                  {subjects.map((s) => {
                    const isChecked = (formData.subjectIds || []).includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-blue-50 border-blue-300 text-blue-900 font-medium'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSubjectToggle(s.id)}
                          className="rounded text-blue-600"
                        />
                        <span className="truncate">{s.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* TÍCH CHỌN CÁC LỚP GIÁO VIÊN NÀY DẠY TRONG FORM */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-800 font-bold text-xs flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                    Tích Chọn Lớp Giáo Viên Này Đảm Nhiệm:
                  </label>
                  <span className="text-[11px] font-semibold text-blue-700">
                    Đã tích chọn: {(formData.assignedClassIds || []).length} lớp
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Tích chọn các lớp mà giáo viên sẽ phụ trách giảng dạy.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pt-1">
                  {classes.map((cls) => {
                    const isChecked = (formData.assignedClassIds || []).includes(cls.id);
                    const subject = subjects.find((s) => s.id === cls.subjectId);
                    return (
                      <label
                        key={cls.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-blue-50 border-blue-300 text-blue-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleClassToggleInForm(cls.id)}
                          className="rounded text-blue-600 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-xs truncate">
                            <span className="font-mono text-blue-700 mr-1">[{cls.code}]</span>
                            {cls.name}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Khối {cls.gradeLevel} · {subject?.name} ({cls.studentIds.length} HS)
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingTeacher ? 'Lưu Thay Đổi' : 'Thêm Giáo Viên'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: XÁC NHẬN XÓA GIÁO VIÊN */}
      {teacherToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Xác Nhận Xóa Giáo Viên</h3>
                <p className="text-xs text-slate-500">Thao tác này sẽ xóa hồ sơ giáo viên khỏi hệ thống.</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-700 space-y-1">
              <div>Giáo viên: <strong className="text-slate-900">{teacherToDelete.name}</strong></div>
              <div>Mã số: <span className="font-mono text-blue-700 font-semibold">{teacherToDelete.code}</span></div>
              <div>Số điện thoại: <span className="font-mono">{teacherToDelete.phone}</span></div>
            </div>

            <p className="text-slate-600 text-[11px] leading-relaxed">
              Bạn có chắc chắn muốn xóa giáo viên này không? Các lớp học đang được phân công cho giáo viên có thể cần được chỉ định giáo viên mới.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setTeacherToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xác Nhận Xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: XUẤT HỒ SƠ GIẢNG DẠY (TKB TUẦN, LỊCH BÁO GIẢNG, SỔ GHI ĐẦU BÀI) */}
      <TeacherPedagogicalExportModal
        isOpen={pedagogicalModalState.isOpen}
        onClose={() => setPedagogicalModalState((prev) => ({ ...prev, isOpen: false }))}
        initialTeacher={pedagogicalModalState.teacher}
        defaultTab={pedagogicalModalState.tab}
      />

      {/* MODAL: CẤP QUYỀN QUẢN TRỊ VIÊN ỦY QUYỀN (THẦY NGUYỄN ĐỨC HOÀ PHÂN QUYỀN) */}
      <AdminDelegationModal
        isOpen={isDelegationModalOpen}
        onClose={() => {
          setIsDelegationModalOpen(false);
          setTeacherForDelegation(null);
          setAccountForDelegation(null);
        }}
        editingAccount={accountForDelegation}
        prefillTeacher={teacherForDelegation}
      />
    </div>
  );
};
