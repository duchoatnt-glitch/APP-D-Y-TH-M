export type GradeLevel = '6' | '7' | '8' | '9' | '10' | '11' | '12' | 'Luyện Thi ĐH' | 'Ôn Chuyên' | 'IELTS';

export interface Subject {
  id: string;
  code: string;
  name: string;
  color: string; // Tailwind color name like 'blue', 'emerald', 'amber', 'purple', 'rose', 'indigo', 'cyan', 'teal'
  description: string;
  targetGrades: GradeLevel[];
  defaultSessionFee?: number;
  iconName: string;
}

export interface CurriculumLesson {
  id: string;
  subjectId: string;
  gradeLevel: GradeLevel;
  stt: number;            // STT: 1, 2, 3...
  lessonNumber: string;   // Tiết PPCT: ví dụ "Tiết 1-2" hoặc "1"
  title: string;          // Tên bài học / Chủ đề
  periods: number;        // Số tiết để phân công thời khóa biểu (ví dụ 1, 2, 3...)
  week?: number;          // Tuần học (ví dụ Tuần 1, Tuần 2...)
  semester?: string;      // Học kỳ (HK1, HK2, Hè)
  objectives?: string;    // Yêu cầu cần đạt / Trọng tâm kiến thức
  notes?: string;         // Ghi chú
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  floor: string;
  facilities: string[];
}

export interface Teacher {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  subjectIds: string[];
  degree: string;
  specialty: string;
  experienceYears: number;
  ratePerSession: number;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  status: 'active' | 'leave';
}

export interface TimeSlot {
  start: string; // '17:30'
  end: string;   // '19:15'
}

export interface ClassSessionSchedule {
  id?: string;
  dayOfWeek: number; // 2: Thứ 2, 3: Thứ 3, ..., 7: Thứ 7, 8: Chủ Nhật
  startTime: string; // '17:45'
  endTime: string;   // '19:30'
  roomId?: string;   // Phòng học của buổi này (tùy chọn)
}

export interface ClassScheduleChange {
  id: string;
  classId: string;
  effectiveDate: string; // 'YYYY-MM-DD' - Áp dụng từ ngày này
  previousSchedule: {
    daysOfWeek: number[];
    timeSlot: TimeSlot;
    weeklySchedules?: ClassSessionSchedule[];
    roomId?: string;
  };
  newSchedule: {
    daysOfWeek: number[];
    timeSlot: TimeSlot;
    weeklySchedules?: ClassSessionSchedule[];
    roomId?: string;
  };
  declaredBy: string; // Tên giáo viên / người kê khai sửa lịch
  reason: string;     // Lý do đổi lịch
  createdAt: string;  // Thời điểm kê khai
}

export interface ClassRoom {
  id: string;
  code: string;
  name: string;
  subjectId: string;
  gradeLevel: GradeLevel;
  teacherId: string;
  assistantTeacherId?: string;
  roomId: string;
  daysOfWeek: number[]; // 2: Thứ 2, 3: Thứ 3, ..., 7: Thứ 7, 8: Chủ Nhật
  timeSlot: TimeSlot;
  weeklySchedules?: ClassSessionSchedule[]; // Lịch học chi tiết từng buổi trong tuần
  scheduleEffectiveDate?: string; // Ngày áp dụng lịch hiện tại
  scheduleHistory?: ClassScheduleChange[]; // Lịch sử các lần đổi lịch (không ảnh hưởng buổi trước ngày áp dụng)
  sessionFee?: number;
  monthlyFee?: number;
  maxCapacity?: number;
  studentIds: string[];
  status: 'active' | 'upcoming' | 'completed';
  startDate: string;
  note?: string;
}

export interface Student {
  id: string;
  code: string;
  name: string;
  gender: 'Nam' | 'Nữ';
  dob: string;
  phone: string;
  school: string;
  schoolClass?: string; // Tên lớp ở trường (VD: 12A1, 11 Lý, 9B...)
  gradeLevel: GradeLevel;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  address: string;
  enrolledClassIds: string[];
  status: 'active' | 'trial' | 'paused' | 'dropped';
  targetGoal: string; // e.g., 'Thi vào Chuyên Toán Lê Hồng Phong', 'IELTS 7.5', 'Đạt 9+ THPTQG Khối A'
  notes?: string;
  joinDate: string;
  avatar?: string;
}

export type AttendanceStatus = 'present' | 'absent_excused' | 'absent_unexcused' | 'late';

export interface AttendanceRecord {
  id: string;
  classId: string;
  sessionDate: string; // 'YYYY-MM-DD'
  studentId: string;
  status: AttendanceStatus;
  homeworkDone: boolean; // Làm BTVN đầy đủ
  attitudeRating: number; // 1 to 5 stars
  teacherNote?: string;
  recordedAt: string;
  recordedBy: string;
}

export type ExamType = '15min' | '45min' | 'midterm' | 'final' | 'mock_test';

export interface GradeEntry {
  id: string;
  classId: string;
  studentId: string;
  examName: string;
  examType: ExamType;
  examDate: string;
  score: number;
  maxScore: number;
  rankInClass?: number;
  teacherComment?: string;
}

export interface Invoice {
  id: string;
  invoiceCode: string;
  studentId: string;
  monthYear: string; // '2026-09'
  classIds: string[];
  calculatedSessions: number;
  sessionFee: number;
  discountAmount: number; // Miễn giảm/combo
  discountReason?: string;
  totalAmount: number;
  paidAmount: number;
  status: 'paid' | 'unpaid' | 'partial' | 'overdue';
  dueDate: string;
  paymentMethod?: 'cash' | 'transfer' | 'qr';
  paidAt?: string;
  notes?: string;
}

export interface TeacherTimesheet {
  id: string;
  teacherId: string;
  monthYear: string;
  sessionsCount: number;
  ratePerSession: number;
  totalBasePay: number;
  bonus: number;
  bonusReason?: string;
  advance: number; // Tạm ứng
  netPay: number;
  status: 'paid' | 'pending';
  paidDate?: string;
}

export interface NotificationLog {
  id: string;
  studentId: string;
  parentPhone: string;
  type: 'attendance' | 'grade' | 'tuition' | 'announcement' | 'reminder';
  message: string;
  sentAt: string;
  channel: 'Zalo' | 'SMS' | 'Hệ thống';
}

export interface CenterSettings {
  centerName: string;
  centerSlogan: string;
  centerAddress: string;
  centerPhone: string;
  centerEmail: string;
  openingDate?: string; // Ngày khai giảng năm học / mốc tính Tuần 1 chuẩn
  bankId: string; // MB, VCB, TCB, etc.
  bankAccount: string;
  bankAccountName: string;
  currency: string;
  autoSmsZaloTemplate: string;
  defaultReminderMinutes: number; // e.g. 60
}

// Material Repository types
export type MaterialFileType = 'pdf' | 'doc' | 'video' | 'slide';
export type MaterialCategory = 'lecture' | 'exercise' | 'exam' | 'reference' | 'solution';

export interface Material {
  id: string;
  title: string;
  description?: string;
  subjectId: string;
  gradeLevel: GradeLevel;
  classId?: string; // Tùy chọn: Lớp học cụ thể
  chapter?: string; // Tùy chọn: Tên Chương / Chuyên đề
  lessonId?: string; // Tùy chọn: ID bài học theo PPCT
  lessonName?: string; // Tùy chọn: Tên bài học / Tiết dạy
  teacherId: string;
  fileType: MaterialFileType;
  fileUrl?: string; // blob or demo link
  fileName: string;
  fileSize: string; // e.g. '3.5 MB'
  category: MaterialCategory;
  uploadDate: string;
  downloadsCount: number;
  viewsCount: number;
}

// Schedule Session and Reminder types
export type SessionType = 'regular' | 'makeup' | 'extra' | 'exam';

export interface ClassSession {
  id: string;
  classId: string;
  subjectId: string;
  date: string; // 'YYYY-MM-DD'
  startTime: string; // '17:45'
  endTime: string; // '19:30'
  roomId: string;
  teacherId: string;
  topic?: string;
  type: SessionType;
  remindMinutesBefore: number; // e.g. 60 or 30
  reminderSent: boolean;
  reminderSentAt?: string;
}

// Auto-Save & Synchronization Types
export interface AutoSaveSnapshot {
  id: string;
  timestamp: string; // ISO string
  label: string;
  counts: {
    teachers: number;
    classes: number;
    students: number;
    curriculumLessons: number;
    sessions: number;
    grades: number;
    attendance: number;
  };
  payload: string; // Serialized JSON of app state
}

export interface AutoUpdateConfig {
  autoSaveEnabled: boolean;
  multiTabSyncEnabled: boolean;
  showToastOnSave: boolean;
}

// Authentication & User Account Types
export type UserRole = 'admin' | 'sub_admin' | 'teacher' | 'parent' | 'student' | 'staff';

export interface AdminPermissions {
  canAddClass: boolean;           // Thêm lớp học
  canDeleteClass: boolean;        // Xoá lớp học
  canEditClass: boolean;          // Chỉnh sửa lớp học
  canAddStudent: boolean;         // Thêm học sinh
  canDeleteStudent: boolean;      // Xoá danh sách học sinh
  canEditStudent: boolean;        // Chỉnh sửa học sinh
  canManageTimetable: boolean;    // Thêm thời khoá biểu môn học / xếp lịch
  canManageGrades: boolean;       // Nhập / sửa điểm số
  canManageAttendance: boolean;   // Điểm danh ca học
  canExportData: boolean;         // Xuất file excel / báo cáo
}

export interface DelegatedAdminAccount {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  teacherId?: string; // Liên kết với giáo viên nếu có
  permissions: AdminPermissions;
  grantedBy: string; // "Thầy Nguyễn Đức Hoà"
  grantedAt: string; // ISO date
  note?: string;     // Ghi chú quyền hạn
  status: 'active' | 'suspended';
}

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  isPrimaryAdmin?: boolean; // true for Thầy Nguyễn Đức Hoà (Người quản trị chính)
  permissions?: AdminPermissions;
  avatar?: string;
  teacherId?: string; // Linked teacher ID
  studentId?: string; // Linked student ID if parent or student
  title?: string;     // Job title / Specialty
  password?: string;
  createdAt?: string;
}

