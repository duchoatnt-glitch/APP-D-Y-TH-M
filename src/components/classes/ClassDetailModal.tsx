import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext.tsx';
import { ClassRoom, Student, GradeLevel } from '../../types/index.ts';
import {
  X,
  Users,
  UserPlus,
  UserMinus,
  Trash2,
  CalendarCheck,
  Award,
  Phone,
  School,
  DollarSign,
  User,
  MapPin,
  Clock,
  CheckCircle2,
  Upload,
  Download,
  Edit2,
  FileSpreadsheet,
  Search,
  Save,
  GraduationCap,
  BookOpen,
  Plus,
  AlertTriangle,
  Mail,
  CheckSquare,
  Square,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { formatVND, getDayOfWeekName } from '../../utils/formatters.ts';
import { ImportStudentsModal } from './ImportStudentsModal.tsx';

interface ClassDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cls: ClassRoom | null;
  onOpenAttendanceModal: (classId: string) => void;
  onOpenStudentDetailModal: (studentId: string) => void;
}

export const ClassDetailModal: React.FC<ClassDetailModalProps> = ({
  isOpen,
  onClose,
  cls,
  onOpenAttendanceModal,
  onOpenStudentDetailModal,
}) => {
  const {
    classes,
    students,
    teachers,
    subjects,
    rooms,
    settings,
    curriculumLessons,
    assignStudentToClass,
    removeStudentFromClass,
    removeStudentsFromClassBatch,
    addStudent,
    updateStudent,
    deleteStudent,
    deleteStudentsPermanentlyBatch,
    grades,
    attendance,
    canPerform,
    currentUser,
    isPrimaryAdmin,
  } = useApp();

  const isReadOnlyUser = currentUser?.role === 'parent' || currentUser?.role === 'student';
  const canAddStudent = !isReadOnlyUser && canPerform('canAddStudent');
  const canEditStudent = !isReadOnlyUser && canPerform('canEditStudent');
  const canDeleteStudent = !isReadOnlyUser && canPerform('canDeleteStudent');
  const canManageGrades = !isReadOnlyUser && canPerform('canManageGrades');
  const canManageAttendance = !isReadOnlyUser && canPerform('canManageAttendance');

  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'roster' | 'grades' | 'attendance' | 'curriculum'>('roster');
  const [searchRoster, setSearchRoster] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Batch selection state
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Modals state
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Delete / Remove confirmation state
  const [confirmModalData, setConfirmModalData] = useState<{
    isOpen: boolean;
    type: 'remove_single' | 'delete_single' | 'remove_batch' | 'delete_batch';
    student?: Student;
  }>({
    isOpen: false,
    type: 'remove_single',
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Student Form State
  const [newStudentData, setNewStudentData] = useState({
    code: '',
    name: '',
    gender: 'Nam' as 'Nam' | 'Nữ',
    dob: '2008-01-01',
    schoolClass: '',
    school: '',
    phone: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    address: '',
    targetGoal: '',
    notes: '',
    status: 'active' as 'active' | 'trial',
  });

  // Edit Student Form State
  const [editFormData, setEditFormData] = useState({
    code: '',
    name: '',
    gender: 'Nam' as 'Nam' | 'Nữ',
    dob: '',
    schoolClass: '',
    gradeLevel: '12' as GradeLevel,
    school: '',
    phone: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    address: '',
    targetGoal: '',
    notes: '',
    status: 'active' as 'active' | 'trial' | 'paused' | 'dropped',
  });

  if (!isOpen || !cls) return null;

  // Always bind to current fresh class object from AppContext
  const currentClass = classes.find((c) => c.id === cls.id) || cls;
  const subject = subjects.find((s) => s.id === currentClass.subjectId);
  const teacher = teachers.find((t) => t.id === currentClass.teacherId);
  const room = rooms.find((r) => r.id === currentClass.roomId);

  // Enrolled students in this class
  const enrolledStudents = students.filter((s) => currentClass.studentIds.includes(s.id));

  // Filtered enrolled students for search
  const filteredStudents = enrolledStudents.filter((st) => {
    const q = searchRoster.toLowerCase();
    return (
      st.name.toLowerCase().includes(q) ||
      (st.schoolClass && st.schoolClass.toLowerCase().includes(q)) ||
      (st.school && st.school.toLowerCase().includes(q)) ||
      (st.notes && st.notes.toLowerCase().includes(q)) ||
      (st.phone && st.phone.includes(q)) ||
      (st.parentPhone && st.parentPhone.includes(q)) ||
      st.code.toLowerCase().includes(q)
    );
  });

  // Available students not in this class
  const unassignedStudents = students.filter((s) => !currentClass.studentIds.includes(s.id));

  // Class grades
  const classGrades = grades.filter((g) => g.classId === currentClass.id);

  // Class attendance
  const classAttendance = attendance.filter((a) => a.classId === currentClass.id);

  // Class PPCT Curriculum
  const classCurriculum = curriculumLessons.filter(
    (cl) => cl.subjectId === currentClass.subjectId && cl.gradeLevel === currentClass.gradeLevel
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Add existing student from center
  const handleAddExistingStudent = () => {
    if (!selectedStudentToAdd) return;
    const st = students.find((s) => s.id === selectedStudentToAdd);
    assignStudentToClass(currentClass.id, selectedStudentToAdd);
    setSelectedStudentToAdd('');
    showToast(`Đã thêm học sinh "${st?.name || ''}" vào lớp thành công!`);
  };

  // Open New Student Modal
  const handleOpenNewStudentModal = () => {
    setNewStudentData({
      code: `HS-${Math.floor(26000 + Math.random() * 900)}`,
      name: '',
      gender: 'Nam',
      dob: '2008-05-15',
      schoolClass: `Khối ${currentClass.gradeLevel}`,
      school: '',
      phone: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      address: '',
      targetGoal: '',
      notes: '',
      status: 'active',
    });
    setIsNewStudentModalOpen(true);
  };

  // Save New Student directly into this class
  const handleSaveNewStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentData.name.trim()) {
      alert('Vui lòng nhập họ và tên học sinh!');
      return;
    }
    if (!newStudentData.parentPhone.trim()) {
      alert('Vui lòng nhập số điện thoại phụ huynh để liên lạc!');
      return;
    }

    const newId = `stu-${Date.now()}`;
    const studentToSave: Student = {
      id: newId,
      code: newStudentData.code.trim() || `HS-${Math.floor(26000 + Math.random() * 900)}`,
      name: newStudentData.name.trim(),
      gender: newStudentData.gender,
      dob: newStudentData.dob || '2008-01-01',
      phone: newStudentData.phone.trim(),
      school: newStudentData.school.trim() || 'Chưa cập nhật',
      schoolClass: newStudentData.schoolClass.trim() || `Khối ${currentClass.gradeLevel}`,
      gradeLevel: currentClass.gradeLevel,
      parentName: newStudentData.parentName.trim(),
      parentPhone: newStudentData.parentPhone.trim(),
      parentEmail: newStudentData.parentEmail.trim(),
      address: newStudentData.address.trim(),
      enrolledClassIds: [currentClass.id],
      status: newStudentData.status,
      targetGoal: newStudentData.targetGoal.trim(),
      notes: newStudentData.notes.trim(),
      joinDate: new Date().toISOString().split('T')[0],
    };

    addStudent(studentToSave);
    assignStudentToClass(currentClass.id, newId);
    setIsNewStudentModalOpen(false);
    showToast(`Đã thêm mới học sinh "${studentToSave.name}" vào lớp ${currentClass.name}!`);
  };

  // Open Edit Student Modal
  const handleStartEditStudent = (st: Student) => {
    setEditingStudent(st);
    setEditFormData({
      code: st.code || '',
      name: st.name || '',
      gender: st.gender || 'Nam',
      dob: st.dob || '2008-01-01',
      schoolClass: st.schoolClass || `Khối ${st.gradeLevel}`,
      gradeLevel: st.gradeLevel || currentClass.gradeLevel,
      school: st.school || '',
      phone: st.phone || '',
      parentName: st.parentName || '',
      parentPhone: st.parentPhone || '',
      parentEmail: st.parentEmail || '',
      address: st.address || '',
      targetGoal: st.targetGoal || '',
      notes: st.notes || '',
      status: st.status || 'active',
    });
  };

  // Save Edit Student
  const handleSaveEditStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    if (!editFormData.name.trim()) {
      alert('Vui lòng nhập họ và tên học sinh!');
      return;
    }

    updateStudent(editingStudent.id, {
      code: editFormData.code.trim(),
      name: editFormData.name.trim(),
      gender: editFormData.gender,
      dob: editFormData.dob,
      schoolClass: editFormData.schoolClass.trim(),
      gradeLevel: editFormData.gradeLevel,
      school: editFormData.school.trim(),
      phone: editFormData.phone.trim(),
      parentName: editFormData.parentName.trim(),
      parentPhone: editFormData.parentPhone.trim(),
      parentEmail: editFormData.parentEmail.trim(),
      address: editFormData.address.trim(),
      targetGoal: editFormData.targetGoal.trim(),
      notes: editFormData.notes.trim(),
      status: editFormData.status,
    });

    setEditingStudent(null);
    showToast(`Đã cập nhật thông tin học sinh "${editFormData.name}" thành công!`);
  };

  // Prompt Remove from class
  const handlePromptRemoveStudent = (st: Student) => {
    setConfirmModalData({
      isOpen: true,
      type: 'remove_single',
      student: st,
    });
  };

  // Prompt Permanent Delete
  const handlePromptDeleteStudent = (st: Student) => {
    setConfirmModalData({
      isOpen: true,
      type: 'delete_single',
      student: st,
    });
  };

  // Execute Confirmation
  const handleExecuteConfirm = () => {
    const { type, student } = confirmModalData;

    if (type === 'remove_single' && student) {
      removeStudentFromClass(currentClass.id, student.id);
      setSelectedStudentIds((prev) => prev.filter((id) => id !== student.id));
      showToast(`Đã rút học sinh "${student.name}" khỏi lớp ${currentClass.name}.`);
    } else if (type === 'delete_single' && student) {
      deleteStudent(student.id);
      setSelectedStudentIds((prev) => prev.filter((id) => id !== student.id));
      showToast(`Đã xóa vĩnh viễn học sinh "${student.name}" khỏi toàn hệ thống.`);
    } else if (type === 'remove_batch') {
      removeStudentsFromClassBatch(currentClass.id, selectedStudentIds);
      const count = selectedStudentIds.length;
      setSelectedStudentIds([]);
      showToast(`Đã rút ${count} học sinh đã chọn khỏi lớp ${currentClass.name}.`);
    } else if (type === 'delete_batch') {
      deleteStudentsPermanentlyBatch(selectedStudentIds);
      const count = selectedStudentIds.length;
      setSelectedStudentIds([]);
      showToast(`Đã xóa vĩnh viễn ${count} học sinh khỏi toàn hệ thống.`);
    }

    setConfirmModalData({ isOpen: false, type: 'remove_single' });
  };

  // Toggle Single Selection
  const handleToggleSelectStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  // Toggle Select All Filtered Students
  const handleToggleSelectAll = () => {
    const filteredIds = filteredStudents.map((s) => s.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedStudentIds.includes(id));
    if (allSelected) {
      setSelectedStudentIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  // Export Roster to Excel
  const handleExportToExcel = () => {
    if (enrolledStudents.length === 0) {
      alert('Lớp học chưa có học sinh để xuất file!');
      return;
    }

    const exportRows = [
      ['TT', 'Họ tên học sinh', 'Mã HS', 'Giới tính', 'Ngày sinh', 'Lớp trường', 'Khối', 'Trường học', 'Ghi chú & Mục tiêu', 'Số điện thoại', 'Họ tên phụ huynh', 'SĐT phụ huynh', 'Địa chỉ', 'Trạng thái'],
      ...enrolledStudents.map((st, idx) => [
        idx + 1,
        st.name,
        st.code,
        st.gender || 'Nam',
        st.dob || '',
        st.schoolClass || `Khối ${st.gradeLevel}`,
        st.gradeLevel,
        st.school || '',
        st.notes || st.targetGoal || '',
        st.phone || '',
        st.parentName || '',
        st.parentPhone || '',
        st.address || '',
        st.status === 'active' ? 'Chính thức' : st.status === 'trial' ? 'Học thử' : st.status === 'paused' ? 'Tạm dừng' : 'Thôi học',
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Lop_${currentClass.code}`);
    XLSX.writeFile(wb, `Danh_Sach_${currentClass.code}_${currentClass.name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
  };

  // Export PPCT to Excel
  const handleExportCurriculumToExcel = () => {
    const wb = XLSX.utils.book_new();
    const aoaData: any[][] = [
      [settings.centerName || 'HỘ KINH DOANH PHAN NGUYÊN'],
      [`KẾ HOẠCH BÀI DẠY & PHÂN PHỐI CHƯƠNG TRÌNH LỚP ${currentClass.name.toUpperCase()}`],
      [`Mã lớp: ${currentClass.code}`, `Môn học: ${subject?.name || ''}`, `Khối: ${currentClass.gradeLevel}`],
      [`Giáo viên phụ trách: ${teacher?.name || ''}`, `Phòng học: ${room?.name || ''}`],
      [
        `Lịch học trong tuần: ${
          currentClass.weeklySchedules && currentClass.weeklySchedules.length > 0
            ? currentClass.weeklySchedules.map((s) => `${getDayOfWeekName(s.dayOfWeek)} (${s.startTime}-${s.endTime})`).join(', ')
            : `${currentClass.daysOfWeek.map((d) => getDayOfWeekName(d)).join(', ')} (${currentClass.timeSlot.start}-${currentClass.timeSlot.end})`
        }`,
      ],
      [],
      ['STT', 'Tuần', 'Học Kỳ', 'Tiết PPCT', 'Tên Bài Dạy / Chuyên Đề', 'Số Tiết', 'Mục Tiêu & Trọng Tâm', 'Ghi Chú'],
    ];

    classCurriculum.forEach((cl, idx) => {
      aoaData.push([
        idx + 1,
        `Tuần ${cl.week}`,
        cl.semester,
        cl.lessonNumber,
        cl.title,
        cl.periods,
        cl.objectives || '',
        cl.notes || '',
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoaData);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 10 },
      { wch: 10 },
      { wch: 14 },
      { wch: 38 },
      { wch: 10 },
      { wch: 50 },
      { wch: 25 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'PPCT_LOP');
    XLSX.writeFile(wb, `PPCT_Lop_${currentClass.code}_${currentClass.name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_')}.xlsx`);
  };

  const isAllFilteredSelected =
    filteredStudents.length > 0 && filteredStudents.every((s) => selectedStudentIds.includes(s.id));

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden my-4 max-h-[94vh] flex flex-col relative">
          
          {/* In-modal Toast Notification */}
          {toastMessage && (
            <div className="absolute top-4 right-6 z-50 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-lg border border-slate-700 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {currentClass.code}
                </span>
                <span>·</span>
                <span>Khối {currentClass.gradeLevel}</span>
                <span>·</span>
                <span className="font-semibold text-slate-700">{subject?.name}</span>
              </div>
              <h3 className="font-bold text-slate-900 text-lg mt-1">
                {currentClass.name}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Class Overview Mini Cards */}
          <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Giáo Viên Phụ Trách</span>
              <strong className="text-slate-800 font-medium">{teacher?.name || 'Chưa phân công'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Phòng Học</span>
              <strong className="text-slate-800 font-medium">
                {room?.name} ({room?.floor})
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Lịch Học Trong Tuần</span>
              <div className="font-semibold text-slate-800 truncate" title={
                currentClass.weeklySchedules && currentClass.weeklySchedules.length > 0
                  ? currentClass.weeklySchedules.map((s) => `${getDayOfWeekName(s.dayOfWeek)} (${s.startTime}-${s.endTime})`).join(', ')
                  : `${currentClass.daysOfWeek.map((d) => getDayOfWeekName(d)).join(', ')} (${currentClass.timeSlot.start}-${currentClass.timeSlot.end})`
              }>
                {currentClass.weeklySchedules && currentClass.weeklySchedules.length > 0
                  ? currentClass.weeklySchedules.map((s) => `${getDayOfWeekName(s.dayOfWeek)} (${s.startTime}-${s.endTime})`).join(', ')
                  : `${currentClass.daysOfWeek.map((d) => getDayOfWeekName(d)).join(', ')} (${currentClass.timeSlot.start}-${currentClass.timeSlot.end})`}
              </div>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Sĩ Số Lớp Hiện Tại</span>
              <strong className="text-blue-700 font-mono font-bold text-sm">
                {enrolledStudents.length} học sinh
              </strong>
            </div>
          </div>

          {/* Tab Controls */}
          <div className="px-6 border-b border-slate-200 flex items-center justify-between text-xs font-medium bg-white">
            <div className="flex items-center gap-4 overflow-x-auto">
              <button
                onClick={() => setActiveTab('roster')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'roster'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" /> Danh Sách Học Sinh ({enrolledStudents.length})
              </button>
              <button
                onClick={() => setActiveTab('grades')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'grades'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Award className="w-4 h-4" /> Bảng Điểm & Thi Thử ({classGrades.length})
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'attendance'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <CalendarCheck className="w-4 h-4" /> Nhật Ký Điểm Danh ({classAttendance.length})
              </button>
              <button
                onClick={() => setActiveTab('curriculum')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'curriculum'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4" /> Phân Phối Chương Trình ({classCurriculum.length})
              </button>
            </div>

            {/* Quick Actions at tab bar for curriculum */}
            {activeTab === 'curriculum' && (
              <div className="flex items-center gap-2 py-2">
                <button
                  type="button"
                  onClick={handleExportCurriculumToExcel}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  title="Xuất kế hoạch bài dạy và PPCT ra Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Xuất File PPCT Lớp (.xlsx)</span>
                </button>
              </div>
            )}

            {/* Quick Actions at tab bar for roster */}
            {activeTab === 'roster' && (
              <div className="flex items-center gap-2 py-2">
                {/* Button Thêm Mới Học Sinh vào lớp */}
                {canAddStudent && (
                  <button
                    type="button"
                    onClick={handleOpenNewStudentModal}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                    title="Thêm mới một học sinh trực tiếp vào lớp này"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Thêm Học Sinh Mới</span>
                  </button>
                )}

                {canAddStudent && (
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(true)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                    title="Thêm danh sách học sinh từ máy tính (.xlsx, .csv, copy-paste)"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Nhập File (.xlsx)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleExportToExcel}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  title="Xuất danh sách ra file Excel"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Xuất Excel</span>
                </button>
              </div>
            )}
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
            {activeTab === 'roster' && (
              <div className="space-y-4">
                {/* Read-Only Notice for Parents & Students */}
                {isReadOnlyUser && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>Chế độ xem dành cho Phụ huynh & Học sinh:</strong> Bạn chỉ có thể theo dõi thông tin học tập của học sinh trong lớp (Không có quyền thêm, sửa hoặc xóa học sinh).
                    </span>
                  </div>
                )}

                {/* Top Action Bar: Add from existing students + Search filter */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  {/* Left: Add existing student from center */}
                  {canAddStudent ? (
                    <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="w-full sm:w-80">
                        <select
                          value={selectedStudentToAdd}
                          onChange={(e) => setSelectedStudentToAdd(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 shadow-2xs"
                        >
                          <option value="">-- Chọn học sinh có sẵn tại trung tâm ({unassignedStudents.length}) --</option>
                          {unassignedStudents.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.code} - {s.name} ({s.schoolClass || `Khối ${s.gradeLevel}`} - {s.school || 'Chưa có trường'})
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddExistingStudent}
                        disabled={!selectedStudentToAdd}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Thêm Vào Lớp
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 text-slate-500 text-xs">
                      Danh sách học sinh chính thức của lớp ({filteredStudents.length} học sinh)
                    </div>
                  )}

                  {/* Right: Search Filter */}
                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm tên, mã, trường, SĐT, ghi chú..."
                      value={searchRoster}
                      onChange={(e) => setSearchRoster(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Batch Action Bar if items selected */}
                {canDeleteStudent && selectedStudentIds.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-blue-900 animate-in fade-in">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">
                        {selectedStudentIds.length}
                      </span>
                      <span>Học sinh được chọn</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmModalData({
                            isOpen: true,
                            type: 'remove_batch',
                          })
                        }
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        title="Rút các học sinh đã chọn khỏi lớp này (vẫn giữ trong trung tâm)"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                        <span>Rút ({selectedStudentIds.length}) Khỏi Lớp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setConfirmModalData({
                            isOpen: true,
                            type: 'delete_batch',
                          })
                        }
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        title="Xóa vĩnh viễn các học sinh đã chọn khỏi toàn hệ thống"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa Vĩnh Viễn ({selectedStudentIds.length}) HS</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedStudentIds([])}
                        className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>
                )}

                {/* Table of Enrolled Students with Required & Action Columns */}
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs shadow-2xs bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                        <tr>
                          {/* Checkbox All */}
                          {canDeleteStudent && (
                            <th className="px-3 py-3 w-10 text-center">
                              <input
                                type="checkbox"
                                checked={isAllFilteredSelected}
                                onChange={handleToggleSelectAll}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                title="Chọn / Bỏ chọn tất cả"
                              />
                            </th>
                          )}
                          <th className="px-2 py-3 w-10 text-center">TT</th>
                          <th className="px-4 py-3 min-w-[170px]">Họ Tên Học Sinh</th>
                          <th className="px-3 py-3 min-w-[90px]">Lớp Trường</th>
                          <th className="px-4 py-3 min-w-[140px]">Trường Học</th>
                          <th className="px-4 py-3 min-w-[160px]">Ghi Chú & Mục Tiêu</th>
                          <th className="px-3 py-3 min-w-[120px]">Liên Hệ</th>
                          <th className="px-3 py-3 min-w-[100px] text-center">Trạng Thái</th>
                          <th className="px-4 py-3 text-right min-w-[150px]">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                              {enrolledStudents.length === 0 ? (
                                <div className="space-y-3 max-w-sm mx-auto">
                                  <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <Users className="w-6 h-6" />
                                  </div>
                                  <p className="font-medium text-slate-700 text-sm">
                                    Lớp học chưa có học sinh nào
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    Thêm mới học sinh trực tiếp vào lớp, chọn từ danh sách trung tâm hoặc nhập từ file Excel.
                                  </p>
                                  <div className="flex items-center justify-center gap-2 pt-2">
                                    <button
                                      type="button"
                                      onClick={handleOpenNewStudentModal}
                                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                                    >
                                      <Plus className="w-4 h-4" /> Thêm Mới Học Sinh
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setIsImportModalOpen(true)}
                                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                                    >
                                      <Upload className="w-4 h-4 text-blue-600" /> Nhập File Excel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                'Không tìm thấy học sinh nào khớp với từ khóa tìm kiếm.'
                              )}
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map((st, index) => {
                            const isSelected = selectedStudentIds.includes(st.id);
                            return (
                              <tr
                                key={st.id}
                                className={`transition-colors ${
                                  isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50/80'
                                }`}
                              >
                                {/* Checkbox */}
                                {canDeleteStudent && (
                                  <td className="px-3 py-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleToggleSelectStudent(st.id)}
                                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                  </td>
                                )}

                                {/* TT (STT) */}
                                <td className="px-2 py-3 text-center font-mono font-bold text-slate-500">
                                  {index + 1}
                                </td>

                                {/* Họ tên học sinh */}
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      onClick={() => {
                                        onClose();
                                        onOpenStudentDetailModal(st.id);
                                      }}
                                      className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer block text-sm"
                                      title="Xem học bạ chi tiết"
                                    >
                                      {st.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-normal">
                                      ({st.gender || 'Nam'})
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                                      {st.code}
                                    </span>
                                    {st.dob && (
                                      <span className="text-[10px] text-slate-400">
                                        · Sinh: {st.dob}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Lớp ở trường */}
                                <td className="px-3 py-3">
                                  <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                    {st.schoolClass || `Khối ${st.gradeLevel}`}
                                  </span>
                                </td>

                                {/* Trường */}
                                <td className="px-4 py-3 text-slate-700 font-medium">
                                  {st.school || '—'}
                                </td>

                                {/* Ghi chú & Mục tiêu */}
                                <td className="px-4 py-3 text-slate-600 max-w-xs">
                                  {st.targetGoal && (
                                    <div className="font-semibold text-blue-800 truncate text-[11px]" title={`Mục tiêu: ${st.targetGoal}`}>
                                      🎯 {st.targetGoal}
                                    </div>
                                  )}
                                  <div className="text-slate-500 truncate text-[11px]" title={st.notes || '—'}>
                                    {st.notes || '—'}
                                  </div>
                                </td>

                                {/* Liên hệ */}
                                <td className="px-3 py-3 font-mono text-[11px] text-slate-600">
                                  <div>{st.phone || '—'}</div>
                                  {st.parentPhone && (
                                    <div className="text-slate-500 text-[10px] font-sans">
                                      PH: <strong>{st.parentPhone}</strong> {st.parentName ? `(${st.parentName})` : ''}
                                    </div>
                                  )}
                                </td>

                                {/* Trạng thái */}
                                <td className="px-3 py-3 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[11px] font-semibold inline-block ${
                                      st.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : st.status === 'trial'
                                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                        : st.status === 'paused'
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}
                                  >
                                    {st.status === 'active'
                                      ? 'Chính thức'
                                      : st.status === 'trial'
                                      ? 'Học thử'
                                      : st.status === 'paused'
                                      ? 'Tạm dừng'
                                      : 'Thôi học'}
                                  </span>
                                </td>

                                {/* Thao tác: Sửa, Rút khỏi lớp, Xóa hoàn toàn */}
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {/* Nút Sửa Thông Tin */}
                                    {canEditStudent && (
                                      <button
                                        type="button"
                                        onClick={() => handleStartEditStudent(st)}
                                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                        title="Chỉnh sửa thông tin học sinh (Họ tên, lớp, trường, SĐT, phụ huynh, ghi chú...)"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}

                                    {/* Nút Rút Khỏi Lớp Này */}
                                    {canDeleteStudent && (
                                      <button
                                        type="button"
                                        onClick={() => handlePromptRemoveStudent(st)}
                                        className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                        title="Rút học sinh khỏi lớp này (vẫn giữ lại hồ sơ trung tâm)"
                                      >
                                        <UserMinus className="w-3.5 h-3.5" />
                                      </button>
                                    )}

                                    {/* Nút Xóa Hoàn Toàn Khỏi Hệ Thống */}
                                    {canDeleteStudent && (
                                      <button
                                        type="button"
                                        onClick={() => handlePromptDeleteStudent(st)}
                                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                        title="Xóa vĩnh viễn học sinh khỏi hệ thống"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}

                                    {!canEditStudent && !canDeleteStudent && (
                                      <span className="text-[11px] text-slate-400 italic">
                                        Chỉ xem
                                      </span>
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
              </div>
            )}

            {/* TAB 2: GRADES */}
            {activeTab === 'grades' && (
              <div className="space-y-4">
                {classGrades.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Chưa có bài kiểm tra hoặc khảo sát nào cho lớp này. Hãy vào mục "Sổ Điểm" để nhập điểm.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                        <tr>
                          <th className="px-4 py-2.5">Học Sinh</th>
                          <th className="px-4 py-2.5">Bài Kiểm Tra / Khảo Sát</th>
                          <th className="px-4 py-2.5">Ngày Thi</th>
                          <th className="px-4 py-2.5">Điểm Số</th>
                          <th className="px-4 py-2.5">Nhận Xét Của GV</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {classGrades.map((g) => {
                          const st = students.find((s) => s.id === g.studentId);
                          return (
                            <tr key={g.id} className="hover:bg-slate-50">
                              <td className="px-4 py-2.5 font-bold text-slate-900">{st?.name}</td>
                              <td className="px-4 py-2.5 text-slate-700">{g.examName}</td>
                              <td className="px-4 py-2.5 font-mono text-slate-500">{g.examDate}</td>
                              <td className="px-4 py-2.5 font-mono font-bold text-blue-600">
                                {g.score} / {g.maxScore}
                              </td>
                              <td className="px-4 py-2.5 text-slate-500 italic">{g.teacherComment || 'Tốt'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ATTENDANCE */}
            {activeTab === 'attendance' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    Tổng {classAttendance.length} lượt điểm danh đã ghi nhận
                  </span>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAttendanceModal(currentClass.id);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <CalendarCheck className="w-4 h-4" /> Điểm danh ca mới
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                      <tr>
                        <th className="px-4 py-2.5">Ngày Học</th>
                        <th className="px-4 py-2.5">Học Sinh</th>
                        <th className="px-4 py-2.5">Trạng Thái</th>
                        <th className="px-4 py-2.5">BTVN</th>
                        <th className="px-4 py-2.5">Ghi Chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {classAttendance.map((a) => {
                        const st = students.find((s) => s.id === a.studentId);
                        return (
                          <tr key={a.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 font-mono text-slate-600">{a.sessionDate}</td>
                            <td className="px-4 py-2.5 font-bold text-slate-900">{st?.name}</td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  a.status === 'present'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : a.status === 'late'
                                    ? 'bg-purple-50 text-purple-700'
                                    : 'bg-rose-50 text-rose-700'
                                }`}
                              >
                                {a.status === 'present'
                                  ? 'Có mặt'
                                  : a.status === 'late'
                                  ? 'Đi muộn'
                                  : 'Vắng mặt'}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-medium">
                              {a.homeworkDone ? (
                                <span className="text-emerald-600">Đầy đủ</span>
                              ) : (
                                <span className="text-rose-500">Chưa làm</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-slate-500">{a.teacherNote || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: CURRICULUM */}
            {activeTab === 'curriculum' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 text-xs">
                  <div>
                    <div className="font-bold text-indigo-950 text-sm flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      Phân Phối Chương Trình Môn {subject?.name} - Khối {currentClass.gradeLevel}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Đồng bộ chuẩn 100% với Thời khóa biểu của lớp, Lịch giảng dạy của giáo viên ({teacher?.name}) và Sổ đầu bài
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportCurriculumToExcel}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Tải File Excel PPCT Lớp</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs bg-white shadow-xs">
                  <div className="max-h-[380px] overflow-y-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider sticky top-0 border-b border-slate-200 text-[11px]">
                        <tr>
                          <th className="px-3 py-2.5 text-center w-12">STT</th>
                          <th className="px-3 py-2.5 text-center w-20">Tuần</th>
                          <th className="px-3 py-2.5 text-center w-24">Tiết PPCT</th>
                          <th className="px-4 py-2.5">Tên Bài Dạy / Chuyên Đề Trọng Tâm</th>
                          <th className="px-4 py-2.5">Mục Tiêu & Yêu Cầu Cần Đạt</th>
                          <th className="px-3 py-2.5 w-32">Ghi Chú</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {classCurriculum.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400">
                              Chưa có dữ liệu PPCT cho môn {subject?.name} khối {currentClass.gradeLevel}.
                            </td>
                          </tr>
                        ) : (
                          classCurriculum.map((cl, idx) => (
                            <tr key={cl.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-3 py-2.5 text-center font-mono text-slate-500 font-bold">
                                {idx + 1}
                              </td>
                              <td className="px-3 py-2.5 text-center font-semibold text-indigo-700 bg-indigo-50/30">
                                Tuần {cl.week}
                              </td>
                              <td className="px-3 py-2.5 text-center font-mono font-bold text-blue-700">
                                {cl.lessonNumber}
                              </td>
                              <td className="px-4 py-2.5 font-bold text-slate-900">
                                {cl.title}
                              </td>
                              <td className="px-4 py-2.5 text-slate-600 text-[11px] leading-relaxed">
                                {cl.objectives || 'Theo khung chuẩn Bộ GD&ĐT'}
                              </td>
                              <td className="px-3 py-2.5 text-slate-500 text-[11px] italic">
                                {cl.notes || '-'}
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
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-xs">
            <div className="text-slate-500">
              Khai giảng ngày: <strong>{currentClass.startDate}</strong> · Sĩ số: <strong>{enrolledStudents.length}</strong> học sinh
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenAttendanceModal(currentClass.id);
                }}
                className="px-3.5 py-1.5 bg-blue-600 text-white hover:bg-blue-700 font-semibold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CalendarCheck className="w-4 h-4" /> Điểm Danh Buổi Này
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Internal Import Students Modal */}
      <ImportStudentsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        targetClass={currentClass}
        onSuccess={(count) => showToast(`Đã thêm thành công ${count} học sinh vào lớp!`)}
      />

      {/* MODAL 1: THÊM MỚI HỌC SINH TRỰC TIẾP VÀO LỚP */}
      {isNewStudentModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-4 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  Thêm Mới Học Sinh Vào Lớp: {currentClass.name}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Học sinh mới sẽ được lưu vào hệ thống trung tâm và ghi danh trực tiếp vào lớp này.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewStudentModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewStudent} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Row 1: Code, Name, Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã Học Sinh</label>
                  <input
                    type="text"
                    value={newStudentData.code}
                    onChange={(e) => setNewStudentData({ ...newStudentData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none font-mono"
                    placeholder="HS-..."
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Họ Và Tên Học Sinh *</label>
                  <input
                    type="text"
                    value={newStudentData.name}
                    onChange={(e) => setNewStudentData({ ...newStudentData, name: e.target.value })}
                    placeholder="VD: Nguyễn Hoàng Long"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giới Tính</label>
                  <select
                    value={newStudentData.gender}
                    onChange={(e) => setNewStudentData({ ...newStudentData, gender: e.target.value as 'Nam' | 'Nữ' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              {/* Row 2: DOB, School Class, School, Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày Sinh</label>
                  <input
                    type="date"
                    value={newStudentData.dob}
                    onChange={(e) => setNewStudentData({ ...newStudentData, dob: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lớp (Ở Trường)</label>
                  <input
                    type="text"
                    value={newStudentData.schoolClass}
                    onChange={(e) => setNewStudentData({ ...newStudentData, schoolClass: e.target.value })}
                    placeholder={`VD: 12A1, Khối ${currentClass.gradeLevel}`}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trường Đang Học</label>
                  <input
                    type="text"
                    value={newStudentData.school}
                    onChange={(e) => setNewStudentData({ ...newStudentData, school: e.target.value })}
                    placeholder="VD: THPT Chu Văn An"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số ĐT Học Sinh</label>
                  <input
                    type="text"
                    value={newStudentData.phone}
                    onChange={(e) => setNewStudentData({ ...newStudentData, phone: e.target.value })}
                    placeholder="09..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Row 3: Parent Info */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
                <span className="font-bold text-slate-800 text-[11px] block uppercase tracking-wider">
                  Thông Tin Phụ Huynh & Liên Lạc
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Họ Tên Phụ Huynh</label>
                    <input
                      type="text"
                      value={newStudentData.parentName}
                      onChange={(e) => setNewStudentData({ ...newStudentData, parentName: e.target.value })}
                      placeholder="VD: Bác Tuấn (Bố)"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Số ĐT Phụ Huynh *</label>
                    <input
                      type="text"
                      value={newStudentData.parentPhone}
                      onChange={(e) => setNewStudentData({ ...newStudentData, parentPhone: e.target.value })}
                      placeholder="09..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 outline-none font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Phụ Huynh</label>
                    <input
                      type="email"
                      value={newStudentData.parentEmail}
                      onChange={(e) => setNewStudentData({ ...newStudentData, parentEmail: e.target.value })}
                      placeholder="phuhuynh@gmail.com"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Địa Chỉ Thường Trú</label>
                  <input
                    type="text"
                    value={newStudentData.address}
                    onChange={(e) => setNewStudentData({ ...newStudentData, address: e.target.value })}
                    placeholder="VD: Số 12, Ngõ 45, Đống Đa, Hà Nội"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Row 4: Goals, Notes, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Mục Tiêu Thi Cử / Điểm Số</label>
                  <input
                    type="text"
                    value={newStudentData.targetGoal}
                    onChange={(e) => setNewStudentData({ ...newStudentData, targetGoal: e.target.value })}
                    placeholder="VD: Đạt 9+ THPTQG Khối A, thi ĐGNL ĐHQG..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trạng Thái Học Tập</label>
                  <select
                    value={newStudentData.status}
                    onChange={(e) => setNewStudentData({ ...newStudentData, status: e.target.value as 'active' | 'trial' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none bg-white font-medium"
                  >
                    <option value="active">Chính thức</option>
                    <option value="trial">Học thử</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi Chú Sư Phạm Của Lớp</label>
                <textarea
                  rows={2}
                  value={newStudentData.notes}
                  onChange={(e) => setNewStudentData({ ...newStudentData, notes: e.target.value })}
                  placeholder="VD: Cần kèm thêm phần hình không gian, tiếp thu nhanh..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewStudentModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Lưu & Ghi Danh Vào Lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CHỈNH SỬA THÔNG TIN HỌC SINH ĐẦY ĐỦ */}
      {editingStudent && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-4 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-blue-600" />
                  Chỉnh Sửa Thông Tin Học Sinh: {editingStudent.name}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Mã học sinh: <span className="font-mono font-bold text-blue-700">{editingStudent.code}</span> · Lớp {currentClass.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStudent} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Row 1: Code, Name, Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã Học Sinh</label>
                  <input
                    type="text"
                    value={editFormData.code}
                    onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none font-mono"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Họ Và Tên Học Sinh *</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none font-semibold text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giới Tính</label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value as 'Nam' | 'Nữ' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              {/* Row 2: DOB, School Class, Grade, School */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày Sinh</label>
                  <input
                    type="date"
                    value={editFormData.dob}
                    onChange={(e) => setEditFormData({ ...editFormData, dob: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lớp (Ở Trường)</label>
                  <input
                    type="text"
                    value={editFormData.schoolClass}
                    onChange={(e) => setEditFormData({ ...editFormData, schoolClass: e.target.value })}
                    placeholder="VD: 12A1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khối Lớp</label>
                  <select
                    value={editFormData.gradeLevel}
                    onChange={(e) => setEditFormData({ ...editFormData, gradeLevel: e.target.value as GradeLevel })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="6">Khối 6</option>
                    <option value="7">Khối 7</option>
                    <option value="8">Khối 8</option>
                    <option value="9">Khối 9</option>
                    <option value="10">Khối 10</option>
                    <option value="11">Khối 11</option>
                    <option value="12">Khối 12</option>
                    <option value="IELTS">IELTS</option>
                    <option value="Luyện Thi ĐH">Luyện Thi ĐH</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trường Đang Học</label>
                  <input
                    type="text"
                    value={editFormData.school}
                    onChange={(e) => setEditFormData({ ...editFormData, school: e.target.value })}
                    placeholder="VD: THPT Chu Văn An"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Parent & Contact */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
                <span className="font-bold text-slate-800 text-[11px] block uppercase tracking-wider">
                  Thông Tin Phụ Huynh & Liên Lạc
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Họ Tên Phụ Huynh</label>
                    <input
                      type="text"
                      value={editFormData.parentName}
                      onChange={(e) => setEditFormData({ ...editFormData, parentName: e.target.value })}
                      placeholder="VD: Anh Nam (Bố)"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">SĐT Phụ Huynh *</label>
                    <input
                      type="text"
                      value={editFormData.parentPhone}
                      onChange={(e) => setEditFormData({ ...editFormData, parentPhone: e.target.value })}
                      placeholder="09..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 outline-none font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Số ĐT Học Sinh</label>
                    <input
                      type="text"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      placeholder="09..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Phụ Huynh</label>
                    <input
                      type="email"
                      value={editFormData.parentEmail}
                      onChange={(e) => setEditFormData({ ...editFormData, parentEmail: e.target.value })}
                      placeholder="phuhuynh@..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Địa Chỉ Thường Trú</label>
                    <input
                      type="text"
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      placeholder="Địa chỉ..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Status & Goal */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Mục Tiêu Điểm Số / Thi Cử</label>
                  <input
                    type="text"
                    value={editFormData.targetGoal}
                    onChange={(e) => setEditFormData({ ...editFormData, targetGoal: e.target.value })}
                    placeholder="VD: Đạt 9+ môn Toán..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trạng Thái Học Sinh</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none bg-white font-medium"
                  >
                    <option value="active">Chính thức</option>
                    <option value="trial">Học thử</option>
                    <option value="paused">Tạm dừng</option>
                    <option value="dropped">Thôi học</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi Chú Sư Phạm</label>
                <textarea
                  rows={2}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Ghi chú về năng lực, thái độ học tập..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Cập Nhật Thông Tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: XÁC NHẬN XÓA / RÚT HỌC SINH */}
      {confirmModalData.isOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className={`p-5 border-b flex items-start gap-3.5 ${
              confirmModalData.type.startsWith('delete')
                ? 'bg-rose-50/70 border-rose-100'
                : 'bg-amber-50/70 border-amber-100'
            }`}>
              <div className={`p-2 rounded-xl shrink-0 ${
                confirmModalData.type.startsWith('delete')
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {confirmModalData.type.startsWith('delete') ? (
                  <ShieldAlert className="w-6 h-6" />
                ) : (
                  <UserMinus className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`font-bold text-sm ${
                  confirmModalData.type.startsWith('delete') ? 'text-rose-900' : 'text-amber-900'
                }`}>
                  {confirmModalData.type === 'remove_single' && 'Rút Học Sinh Khỏi Lớp'}
                  {confirmModalData.type === 'delete_single' && 'XÓA VĨNH VIỄN Học Sinh Khỏi Hệ Thống'}
                  {confirmModalData.type === 'remove_batch' && `Rút ${selectedStudentIds.length} Học Sinh Khỏi Lớp`}
                  {confirmModalData.type === 'delete_batch' && `XÓA VĨNH VIỄN ${selectedStudentIds.length} Học Sinh Khỏi Hệ Thống`}
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {confirmModalData.type === 'remove_single' && (
                    <>
                      Bạn có chắc chắn muốn rút học sinh <strong>"{confirmModalData.student?.name}"</strong> ({confirmModalData.student?.code}) khỏi lớp <strong>{currentClass.name}</strong>?
                      <span className="block mt-1 text-slate-500 italic">
                        Lưu ý: Hồ sơ của học sinh vẫn được lưu giữ an toàn tại trung tâm và ở các lớp học khác (nếu có).
                      </span>
                    </>
                  )}
                  {confirmModalData.type === 'delete_single' && (
                    <>
                      Hành động này sẽ <strong className="text-rose-700">XÓA HOÀN TOÀN</strong> học sinh <strong>"{confirmModalData.student?.name}"</strong> ({confirmModalData.student?.code}) khỏi toàn bộ hệ thống trung tâm, bao gồm tất cả các lớp học, bảng điểm và nhật ký điểm danh!
                      <span className="block mt-1 text-rose-600 font-semibold">
                        Cảnh báo: Hành động này KHÔNG THỂ HOÀN TÁC!
                      </span>
                    </>
                  )}
                  {confirmModalData.type === 'remove_batch' && (
                    <>
                      Bạn có chắc chắn muốn rút <strong>{selectedStudentIds.length} học sinh đã chọn</strong> khỏi lớp <strong>{currentClass.name}</strong>?
                      <span className="block mt-1 text-slate-500 italic">
                        Hồ sơ của các học sinh này vẫn được lưu giữ tại trung tâm.
                      </span>
                    </>
                  )}
                  {confirmModalData.type === 'delete_batch' && (
                    <>
                      Hành động này sẽ <strong className="text-rose-700">XÓA HOÀN TOÀN {selectedStudentIds.length} học sinh đã chọn</strong> khỏi toàn bộ hệ thống trung tâm!
                      <span className="block mt-1 text-rose-600 font-semibold">
                        Cảnh báo: Toàn bộ hồ sơ, bảng điểm và nhật ký của các học sinh này sẽ bị xóa vĩnh viễn!
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 flex items-center justify-end gap-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setConfirmModalData({ isOpen: false, type: 'remove_single' })}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200/80 rounded-lg font-medium cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirm}
                className={`px-4 py-2 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer ${
                  confirmModalData.type.startsWith('delete')
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {confirmModalData.type.startsWith('delete') ? 'Xác Nhận Xóa Vĩnh Viễn' : 'Xác Nhận Rút Khỏi Lớp'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
