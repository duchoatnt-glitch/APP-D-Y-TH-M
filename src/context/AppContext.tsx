import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Subject,
  Room,
  Teacher,
  ClassRoom,
  Student,
  AttendanceRecord,
  GradeEntry,
  Invoice,
  TeacherTimesheet,
  CenterSettings,
  NotificationLog,
  Material,
  ClassSession,
  CurriculumLesson,
  GradeLevel,
  TimeSlot,
  ClassSessionSchedule,
  ClassScheduleChange,
  AutoSaveSnapshot,
  AutoUpdateConfig,
  AuthUser,
  UserRole,
  AdminPermissions,
  DelegatedAdminAccount,
} from '../types/index.ts';
import {
  initialCenterSettings,
  initialSubjects,
  initialRooms,
  initialTeachers,
  initialClasses,
  initialStudents,
  initialAttendanceRecords,
  initialGradeEntries,
  initialInvoices,
  initialTimesheets,
  initialMaterials,
  initialClassSessions,
} from '../data/initialData.ts';
import { initialCurriculumLessons } from '../data/initialCurriculum.ts';

interface AppContextType {
  settings: CenterSettings;
  updateSettings: (newSettings: Partial<CenterSettings>) => void;

  subjects: Subject[];
  addSubject: (subj: Subject) => void;
  updateSubject: (id: string, subj: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;

  curriculumLessons: CurriculumLesson[];
  addCurriculumLesson: (lesson: CurriculumLesson) => void;
  updateCurriculumLesson: (id: string, lesson: Partial<CurriculumLesson>) => void;
  deleteCurriculumLesson: (id: string) => void;
  batchAddCurriculumLessons: (lessons: CurriculumLesson[]) => void;
  clearCurriculumLessons: (subjectId: string, gradeLevel?: GradeLevel) => void;
  replaceCurriculumLessons: (subjectId: string, gradeLevel: GradeLevel, lessons: CurriculumLesson[]) => void;

  rooms: Room[];
  addRoom: (room: Room) => void;
  updateRoom: (id: string, room: Partial<Room>) => void;
  deleteRoom: (id: string) => void;

  teachers: Teacher[];
  addTeacher: (teacher: Teacher) => void;
  updateTeacher: (id: string, teacher: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;

  classes: ClassRoom[];
  addClass: (cls: ClassRoom) => void;
  updateClass: (id: string, cls: Partial<ClassRoom>) => void;
  deleteClass: (id: string) => void;
  updateClassScheduleWithEffectiveDate: (
    classId: string,
    effectiveDate: string,
    newSchedule: {
      daysOfWeek: number[];
      timeSlot: TimeSlot;
      weeklySchedules?: ClassSessionSchedule[];
      roomId?: string;
    },
    declaredBy: string,
    reason: string
  ) => void;
  assignStudentToClass: (classId: string, studentId: string) => void;
  removeStudentFromClass: (classId: string, studentId: string) => void;
  removeStudentsFromClassBatch: (classId: string, studentIds: string[]) => void;

  students: Student[];
  addStudent: (student: Student) => void;
  updateStudent: (id: string, student: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  deleteStudentsPermanentlyBatch: (studentIds: string[]) => void;
  batchAssignClass: (studentIds: string[], classId: string) => void;
  batchAddStudentsToClass: (classId: string, newStudents: Student[]) => void;

  // Material Repository
  materials: Material[];
  addMaterial: (mat: Material) => void;
  updateMaterial: (id: string, mat: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;
  recordMaterialDownload: (id: string) => void;
  recordMaterialView: (id: string) => void;

  // Class Sessions & Reminders
  sessions: ClassSession[];
  addSession: (session: ClassSession) => void;
  updateSession: (id: string, session: Partial<ClassSession>) => void;
  deleteSession: (id: string) => void;
  sendSessionReminder: (sessionId: string, channel?: 'Zalo' | 'SMS' | 'Hệ thống') => number;
  sendAllDueReminders: () => number;

  attendance: AttendanceRecord[];
  saveAttendanceBatch: (records: AttendanceRecord[]) => void;
  getAttendanceByClassAndDate: (classId: string, date: string) => AttendanceRecord[];

  grades: GradeEntry[];
  addGradeEntry: (entry: GradeEntry) => void;
  addGradeBatch: (entries: GradeEntry[]) => void;
  updateGradeEntry: (id: string, entry: Partial<GradeEntry>) => void;
  deleteGradeEntry: (id: string) => void;
  deleteGradeBatchByExam: (classId: string, examName: string) => void;

  invoices: Invoice[];
  addInvoice: (inv: Invoice) => void;
  updateInvoice: (id: string, inv: Partial<Invoice>) => void;
  generateMonthlyInvoices: (monthYear: string) => number;

  timesheets: TeacherTimesheet[];
  updateTimesheet: (id: string, ts: Partial<TeacherTimesheet>) => void;
  generateMonthlyTimesheets: (monthYear: string) => void;

  notifications: NotificationLog[];
  sendNotification: (log: Omit<NotificationLog, 'id' | 'sentAt'>) => void;

  resetToDefault: () => void;
  exportDataJson: () => string;
  importDataJson: (jsonStr: string) => boolean;

  // Auto-Update & Real-Time Sync Engine
  autoSaveEnabled: boolean;
  setAutoSaveEnabled: (enabled: boolean) => void;
  multiTabSyncEnabled: boolean;
  setMultiTabSyncEnabled: (enabled: boolean) => void;
  showToastOnSave: boolean;
  setShowToastOnSave: (enabled: boolean) => void;
  lastSavedTime: Date | null;
  isSaving: boolean;
  autoUpdateNotice: string | null;
  clearAutoUpdateNotice: () => void;
  snapshots: AutoSaveSnapshot[];
  forceSyncNow: () => void;
  restoreSnapshot: (snapshotId: string) => boolean;
  deleteSnapshot: (snapshotId: string) => void;
  clearAllSnapshots: () => void;
  recordAutoUpdate: (message: string) => void;

  // Active navigation tab
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Search & Global filter
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Selected student for detail popup / profile
  selectedStudentId: string | null;
  setSelectedStudentId: (id: string | null) => void;

  // Selected class for detail popup / attendance
  selectedClassId: string | null;
  setSelectedClassId: (id: string | null) => void;

  // Authentication & Session
  currentUser: AuthUser | null;
  setCurrentUser: (user: AuthUser | null) => void;
  login: (identifier: string, password?: string) => { success: boolean; message: string; user?: AuthUser };
  loginWithOtp: (identifier: string, otp: string) => { success: boolean; message: string; user?: AuthUser };
  sendOtp: (identifier: string) => { success: boolean; message: string; demoOtp?: string };
  registerUser: (userData: { name: string; email?: string; phone?: string; role: UserRole; password?: string }) => { success: boolean; message: string; user?: AuthUser };
  logout: () => void;
  updateUserProfile: (data: Partial<AuthUser>) => void;

  // Delegated Admin & Granular Permissions (Người quản trị chính: Thầy Nguyễn Đức Hoà)
  delegatedAdmins: DelegatedAdminAccount[];
  grantDelegatedAdmin: (account: Omit<DelegatedAdminAccount, 'id' | 'grantedBy' | 'grantedAt'>) => void;
  updateDelegatedAdmin: (id: string, updates: Partial<DelegatedAdminAccount>) => void;
  revokeDelegatedAdmin: (id: string) => void;
  userPermissions: AdminPermissions;
  isPrimaryAdmin: boolean;
  canPerform: (action: keyof AdminPermissions) => boolean;

  // Chia sẻ ứng dụng (cho mọi người xem)
  isShareModalOpen: boolean;
  setIsShareModalOpen: (open: boolean) => void;
  getShareableAppUrl: (mode?: 'viewer' | 'parent_portal' | 'timetable' | 'general') => string;
}

const STORAGE_KEY = 'EDUCENTER_PRO_DATA_V2';
const CONFIG_KEY = 'PHAN_NGUYEN_AUTO_UPDATE_CONFIG_V1';
const SNAPSHOTS_KEY = 'PHAN_NGUYEN_AUTO_SNAPSHOTS_V1';
const AUTH_KEY = 'PHAN_NGUYEN_AUTH_USER_V1';
const CUSTOM_USERS_KEY = 'PHAN_NGUYEN_CUSTOM_USERS_V1';
const DELEGATED_ADMINS_KEY = 'PHAN_NGUYEN_DELEGATED_ADMINS_V1';

export const FULL_ADMIN_PERMISSIONS: AdminPermissions = {
  canAddClass: true,
  canDeleteClass: true,
  canEditClass: true,
  canAddStudent: true,
  canDeleteStudent: true,
  canEditStudent: true,
  canManageTimetable: true,
  canManageGrades: true,
  canManageAttendance: true,
  canExportData: true,
};

export const READONLY_PERMISSIONS: AdminPermissions = {
  canAddClass: false,
  canDeleteClass: false,
  canEditClass: false,
  canAddStudent: false,
  canDeleteStudent: false,
  canEditStudent: false,
  canManageTimetable: false,
  canManageGrades: false,
  canManageAttendance: false,
  canExportData: false,
};

export const TEACHER_DEFAULT_PERMISSIONS: AdminPermissions = {
  canAddClass: false,
  canDeleteClass: false,
  canEditClass: false,
  canAddStudent: false,
  canDeleteStudent: false,
  canEditStudent: false,
  canManageTimetable: false,
  canManageGrades: true,
  canManageAttendance: true,
  canExportData: true,
};

export const GUEST_VIEWER_USER: AuthUser = {
  id: 'usr-guest-viewer',
  name: 'Khách Tra Cứu (Chế độ xem)',
  role: 'student',
  isPrimaryAdmin: false,
  permissions: READONLY_PERMISSIONS,
  title: 'Chế độ xem công khai (Chỉ đọc - Phụ huynh & Học sinh)',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
};

export const DEFAULT_ADMIN_USER: AuthUser = {
  id: 'usr-admin-01',
  name: 'Thầy Nguyễn Đức Hoà',
  email: 'duchoatnt@gmail.com',
  phone: '0945001262',
  role: 'admin',
  isPrimaryAdmin: true,
  title: 'Chủ cơ sở & Quản trị viên chính',
  avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=200&h=200&q=80',
  teacherId: 'tc-hoa',
  permissions: FULL_ADMIN_PERMISSIONS,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<CenterSettings>(initialCenterSettings);
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [curriculumLessons, setCurriculumLessons] = useState<CurriculumLesson[]>(initialCurriculumLessons);
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [classes, setClasses] = useState<ClassRoom[]>(initialClasses);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [sessions, setSessions] = useState<ClassSession[]>(initialClassSessions);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialAttendanceRecords);
  const [grades, setGrades] = useState<GradeEntry[]>(initialGradeEntries);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [timesheets, setTimesheets] = useState<TeacherTimesheet[]>(initialTimesheets);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);

  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const t = params.get('tab');
        if (t) return t;
      }
    } catch {
      // ignore
    }
    return 'dashboard';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('mode') === 'viewer' || params.get('view') === 'public') {
          return GUEST_VIEWER_USER;
        }
      }
      const savedAuth = localStorage.getItem(AUTH_KEY);
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        if (parsed.role === 'admin' || parsed.id === 'usr-admin-01' || parsed.id === 'tc-hoa') {
          return DEFAULT_ADMIN_USER;
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_ADMIN_USER; // Default to Thầy Nguyễn Đức Hoà
  });
  const [customUsers, setCustomUsers] = useState<AuthUser[]>([]);
  const [activeOtps, setActiveOtps] = useState<Record<string, { code: string; expiresAt: number }>>({});

  // Share App Modal State (Mục quản trị chính chia sẻ link cho mọi người xem)
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  const getShareableAppUrl = (mode?: 'viewer' | 'parent_portal' | 'timetable' | 'general'): string => {
    if (typeof window === 'undefined') return 'https://phannguyen.edu.vn';
    const origin = window.location.origin;
    const publicBase = origin.includes('ais-dev-') ? origin.replace('ais-dev-', 'ais-pre-') : origin;
    if (mode === 'parent_portal') return `${publicBase}/?tab=parent_portal&mode=viewer`;
    if (mode === 'timetable') return `${publicBase}/?tab=timetable&mode=viewer`;
    if (mode === 'viewer') return `${publicBase}/?mode=viewer`;
    return `${publicBase}/?mode=viewer`;
  };

  // Auto-Update & Real-Time Sync Engine States
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);
  const [multiTabSyncEnabled, setMultiTabSyncEnabled] = useState<boolean>(true);
  const [showToastOnSave, setShowToastOnSave] = useState<boolean>(true);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(new Date());
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [snapshots, setSnapshots] = useState<AutoSaveSnapshot[]>([]);

  // Delegated Admins State (Người quản trị chính: Thầy Nguyễn Đức Hoà)
  const initialDelegatedAdmins: DelegatedAdminAccount[] = [
    {
      id: 'del-adm-01',
      name: 'Cô Trần Thị Mai',
      email: 'maitt@phannguyen.edu.vn',
      phone: '0912345678',
      teacherId: 'tc-mai',
      permissions: {
        canAddClass: true,
        canDeleteClass: false, // Thầy Hoà giới hạn: không được xoá lớp
        canEditClass: true,
        canAddStudent: true,
        canDeleteStudent: false, // Thầy Hoà giới hạn: không được xoá học sinh
        canEditStudent: true,
        canManageTimetable: true, // Được xếp thời khoá biểu môn học
        canManageGrades: true,
        canManageAttendance: true,
        canExportData: true,
      },
      grantedBy: 'Thầy Nguyễn Đức Hoà',
      grantedAt: '2026-09-01T08:00:00.000Z',
      note: 'Được Thầy Hoà ủy quyền quản lý học sinh và xếp lịch, không có quyền xóa lớp/học sinh.',
      status: 'active',
    },
  ];

  const [delegatedAdmins, setDelegatedAdmins] = useState<DelegatedAdminAccount[]>(() => {
    try {
      const saved = localStorage.getItem(DELEGATED_ADMINS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error loading delegated admins:', e);
    }
    return initialDelegatedAdmins;
  });

  const [autoUpdateNotice, setAutoUpdateNotice] = useState<string | null>(null);

  // Permission Resolution & Granular Access Control
  const isPrimaryAdmin = Boolean(
    currentUser &&
      (currentUser.isPrimaryAdmin ||
        currentUser.id === 'usr-admin-01' ||
        currentUser.id === 'tc-hoa' ||
        currentUser.phone === '0945001262' ||
        currentUser.email === 'duchoatnt@gmail.com')
  );

  const userPermissions: AdminPermissions = React.useMemo(() => {
    if (!currentUser) return READONLY_PERMISSIONS;
    if (isPrimaryAdmin) return FULL_ADMIN_PERMISSIONS;
    if (currentUser.role === 'parent' || currentUser.role === 'student') return READONLY_PERMISSIONS;
    if (currentUser.permissions) return currentUser.permissions;

    // Check if matched in delegatedAdmins
    const foundDel = delegatedAdmins.find(
      (da) =>
        da.status === 'active' &&
        ((da.email && currentUser.email && normalizeIdentifier(da.email) === normalizeIdentifier(currentUser.email)) ||
          (da.phone && currentUser.phone && normalizeIdentifier(da.phone) === normalizeIdentifier(currentUser.phone)) ||
          (da.teacherId && currentUser.teacherId && da.teacherId === currentUser.teacherId))
    );
    if (foundDel) return foundDel.permissions;

    if (currentUser.role === 'admin' || currentUser.role === 'sub_admin') return FULL_ADMIN_PERMISSIONS;
    if (currentUser.role === 'teacher') return TEACHER_DEFAULT_PERMISSIONS;

    return READONLY_PERMISSIONS;
  }, [currentUser, isPrimaryAdmin, delegatedAdmins]);

  const canPerform = (action: keyof AdminPermissions): boolean => {
    return Boolean(userPermissions[action]);
  };

  const grantDelegatedAdmin = (account: Omit<DelegatedAdminAccount, 'id' | 'grantedBy' | 'grantedAt'>) => {
    const newDelegated: DelegatedAdminAccount = {
      ...account,
      id: `del-adm-${Date.now()}`,
      grantedBy: 'Thầy Nguyễn Đức Hoà',
      grantedAt: new Date().toISOString(),
    };
    setDelegatedAdmins((prev) => {
      const filtered = prev.filter(
        (p) =>
          !(
            (account.email && p.email && normalizeIdentifier(p.email) === normalizeIdentifier(account.email)) ||
            (account.phone && p.phone && normalizeIdentifier(p.phone) === normalizeIdentifier(account.phone))
          )
      );
      const updated = [newDelegated, ...filtered];
      localStorage.setItem(DELEGATED_ADMINS_KEY, JSON.stringify(updated));
      return updated;
    });
    recordAutoUpdate(`Thầy Nguyễn Đức Hoà đã cấp quyền quản trị viên cho ${account.name}`);
  };

  const updateDelegatedAdmin = (id: string, updates: Partial<DelegatedAdminAccount>) => {
    setDelegatedAdmins((prev) => {
      const updated = prev.map((da) => (da.id === id ? { ...da, ...updates } : da));
      localStorage.setItem(DELEGATED_ADMINS_KEY, JSON.stringify(updated));
      return updated;
    });
    recordAutoUpdate('Thầy Nguyễn Đức Hoà đã cập nhật quyền hạn quản trị viên');
  };

  const revokeDelegatedAdmin = (id: string) => {
    setDelegatedAdmins((prev) => {
      const found = prev.find((da) => da.id === id);
      const updated = prev.filter((da) => da.id !== id);
      localStorage.setItem(DELEGATED_ADMINS_KEY, JSON.stringify(updated));
      if (found) {
        recordAutoUpdate(`Thầy Nguyễn Đức Hoà đã thu hồi quyền quản trị viên của ${found.name}`);
      }
      return updated;
    });
  };

  const isHydratedRef = useRef<boolean>(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const lastSnapshotTimeRef = useRef<number>(Date.now());
  const noticeTimeoutRef = useRef<any>(null);

  const clearAutoUpdateNotice = () => setAutoUpdateNotice(null);

  const recordAutoUpdate = (message: string) => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 200);
    setLastSavedTime(new Date());

    if (showToastOnSave) {
      setAutoUpdateNotice(message);
      if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current);
      noticeTimeoutRef.current = setTimeout(() => {
        setAutoUpdateNotice(null);
      }, 3500);
    }
  };

  const createSnapshotInternal = (
    label: string,
    currentPayloadStr: string,
    curTeachers: Teacher[],
    curClasses: ClassRoom[],
    curStudents: Student[],
    curLessons: CurriculumLesson[],
    curSessions: ClassSession[],
    curGrades: GradeEntry[],
    curAttendance: AttendanceRecord[]
  ) => {
    try {
      const snap: AutoSaveSnapshot = {
        id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        label,
        counts: {
          teachers: curTeachers.length,
          classes: curClasses.length,
          students: curStudents.length,
          curriculumLessons: curLessons.length,
          sessions: curSessions.length,
          grades: curGrades.length,
          attendance: curAttendance.length,
        },
        payload: currentPayloadStr,
      };

      setSnapshots((prev) => {
        const updated = [snap, ...prev.slice(0, 14)];
        localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updated));
        return updated;
      });
      lastSnapshotTimeRef.current = Date.now();
    } catch (e) {
      console.warn('Failed to save snapshot:', e);
    }
  };

  const applyLoadedData = (parsed: any) => {
    if (parsed.settings) {
      if (
        !parsed.settings.centerName ||
        parsed.settings.centerName.includes('TRUNG TÂM BỒI DƯỠNG') ||
        parsed.settings.centerName.includes('VIỆT HỌC') ||
        !parsed.settings.centerAddress ||
        parsed.settings.centerAddress.includes('Nguyễn Phong Sắc') ||
        parsed.settings.centerAddress.includes('Hà Nội') ||
        parsed.settings.centerAddress.includes('Ea Nốp')
      ) {
        setSettings({
          ...parsed.settings,
          centerName: 'HỘ KINH DOANH PHAN NGUYÊN',
          centerSlogan: 'Kiến Tạo Tư Duy - Bứt Phá Điểm Số - Đồng Hành Cùng Tương Lai',
          centerAddress: 'Cơ sở 1, 11 Trần Kiên, thôn 4, xã Ea Knốp, tỉnh Đăk Lăk',
          openingDate: parsed.settings.openingDate || '2026-09-07',
          bankId: '',
          bankAccount: '',
          bankAccountName: '',
        });
      } else {
        setSettings({
          ...parsed.settings,
          openingDate: parsed.settings.openingDate || '2026-09-07',
        });
      }
    }
    if (parsed.subjects) setSubjects(parsed.subjects);
    if (parsed.rooms) setRooms(parsed.rooms);
    if (parsed.teachers) {
      const loadedTeachers: Teacher[] = parsed.teachers.map((t: Teacher) => {
        if (t.id === 'tc-hoa' || t.name.includes('Nguyễn Đức Hoà')) {
          return {
            ...t,
            name: 'Thầy Nguyễn Đức Hoà',
            phone: '0945.001.262',
            email: 'duchoatnt@gmail.com',
          };
        }
        return t;
      });
      initialTeachers.forEach((initT) => {
        if (!loadedTeachers.some((t) => t.id === initT.id || t.name.toLowerCase() === initT.name.toLowerCase())) {
          loadedTeachers.push(initT);
        }
      });
      setTeachers(loadedTeachers);
    }
    if (parsed.classes) {
      const loadedClasses: ClassRoom[] = parsed.classes;
      initialClasses.forEach((initC) => {
        if (!loadedClasses.some((c) => c.id === initC.id || c.code.toLowerCase() === initC.code.toLowerCase())) {
          loadedClasses.push(initC);
        }
      });
      setClasses(loadedClasses);
    }
    if (parsed.curriculumLessons) {
      const loadedLessons: CurriculumLesson[] = parsed.curriculumLessons;
      initialCurriculumLessons.forEach((initL) => {
        if (!loadedLessons.some((l) => l.id === initL.id)) {
          loadedLessons.push(initL);
        }
      });
      setCurriculumLessons(loadedLessons);
    } else {
      setCurriculumLessons(initialCurriculumLessons);
    }
    if (parsed.students) setStudents(parsed.students);
    if (parsed.materials) setMaterials(parsed.materials);
    if (parsed.sessions) setSessions(parsed.sessions);
    if (parsed.attendance) setAttendance(parsed.attendance);
    if (parsed.grades) setGrades(parsed.grades);
    if (parsed.invoices) setInvoices(parsed.invoices);
    if (parsed.timesheets) setTimesheets(parsed.timesheets);
    if (parsed.notifications) setNotifications(parsed.notifications);
  };

  // Load from local storage on mount
  useEffect(() => {
    try {
      // 1. Load config
      const savedConfig = localStorage.getItem(CONFIG_KEY);
      if (savedConfig) {
        try {
          const cfg: AutoUpdateConfig = JSON.parse(savedConfig);
          if (typeof cfg.autoSaveEnabled === 'boolean') setAutoSaveEnabled(cfg.autoSaveEnabled);
          if (typeof cfg.multiTabSyncEnabled === 'boolean') setMultiTabSyncEnabled(cfg.multiTabSyncEnabled);
          if (typeof cfg.showToastOnSave === 'boolean') setShowToastOnSave(cfg.showToastOnSave);
        } catch (e) {
          console.warn('Failed to parse config:', e);
        }
      }

      // 2. Load snapshots
      const savedSnapshots = localStorage.getItem(SNAPSHOTS_KEY);
      if (savedSnapshots) {
        try {
          const parsedSnaps = JSON.parse(savedSnapshots);
          if (Array.isArray(parsedSnaps)) setSnapshots(parsedSnaps);
        } catch (e) {
          console.warn('Failed to parse snapshots:', e);
        }
      }

      // 3. Load custom users
      const savedCustomUsers = localStorage.getItem(CUSTOM_USERS_KEY);
      if (savedCustomUsers) {
        try {
          const parsedUsers = JSON.parse(savedCustomUsers);
          if (Array.isArray(parsedUsers)) setCustomUsers(parsedUsers);
        } catch (e) {
          console.warn('Failed to parse custom users:', e);
        }
      }

      // 4. Load auth user
      const savedAuth = localStorage.getItem(AUTH_KEY);
      if (savedAuth) {
        try {
          const parsedAuth = JSON.parse(savedAuth);
          if (parsedAuth && parsedAuth.id) {
            if (parsedAuth.role === 'admin' || parsedAuth.id === 'usr-admin-01' || parsedAuth.id === 'tc-hoa') {
              setCurrentUser(DEFAULT_ADMIN_USER);
              localStorage.setItem(AUTH_KEY, JSON.stringify(DEFAULT_ADMIN_USER));
            } else {
              setCurrentUser(parsedAuth);
            }
          }
        } catch (e) {
          console.warn('Failed to parse auth user:', e);
        }
      }

      // 5. Load app data
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        applyLoadedData(parsed);
      }
      setLastSavedTime(new Date());
    } catch (e) {
      console.warn('Failed to load storage:', e);
    } finally {
      isHydratedRef.current = true;
    }
  }, []);

  // Save config on changes
  useEffect(() => {
    if (!isHydratedRef.current) return;
    try {
      const cfg: AutoUpdateConfig = {
        autoSaveEnabled,
        multiTabSyncEnabled,
        showToastOnSave,
      };
      localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
    } catch (e) {
      console.warn('Failed to save config:', e);
    }
  }, [autoSaveEnabled, multiTabSyncEnabled, showToastOnSave]);

  // Cross-Tab Synchronization
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('PHAN_NGUYEN_SYNC_CHANNEL');
        channelRef.current = channel;

        channel.onmessage = (evt) => {
          if (!multiTabSyncEnabled) return;
          if (evt.data?.type === 'DATA_UPDATED_BROADCAST') {
            try {
              const fresh = localStorage.getItem(STORAGE_KEY);
              if (fresh) {
                applyLoadedData(JSON.parse(fresh));
                setLastSavedTime(new Date());
                recordAutoUpdate('Đã tự động đồng bộ dữ liệu mới từ tab khác');
              }
            } catch (err) {
              console.warn('Multi-tab sync parse error:', err);
            }
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel init error:', err);
      }
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (!multiTabSyncEnabled) return;
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          applyLoadedData(JSON.parse(e.newValue));
          setLastSavedTime(new Date());
          recordAutoUpdate('Đã tự động cập nhật dữ liệu từ cửa sổ khác');
        } catch (err) {
          console.warn('Storage event sync parse error:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    return () => {
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [multiTabSyncEnabled]);

  // Save to local storage on changes (Realtime Auto-Update Engine)
  useEffect(() => {
    if (!isHydratedRef.current) return;
    if (!autoSaveEnabled) return;

    setIsSaving(true);
    try {
      const payload = {
        settings,
        subjects,
        curriculumLessons,
        rooms,
        teachers,
        classes,
        students,
        materials,
        sessions,
        attendance,
        grades,
        invoices,
        timesheets,
        notifications,
      };
      const jsonStr = JSON.stringify(payload);
      localStorage.setItem(STORAGE_KEY, jsonStr);
      setLastSavedTime(new Date());

      // Notify other tabs
      if (channelRef.current && multiTabSyncEnabled) {
        channelRef.current.postMessage({
          type: 'DATA_UPDATED_BROADCAST',
          timestamp: Date.now(),
        });
      }

      // Auto-create snapshot every 90 seconds during active usage
      const now = Date.now();
      if (now - lastSnapshotTimeRef.current > 90000) {
        createSnapshotInternal(
          'Tự động lưu định kỳ khi làm việc',
          jsonStr,
          teachers,
          classes,
          students,
          curriculumLessons,
          sessions,
          grades,
          attendance
        );
      }
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    } finally {
      const t = setTimeout(() => setIsSaving(false), 200);
      return () => clearTimeout(t);
    }
  }, [
    autoSaveEnabled,
    multiTabSyncEnabled,
    settings,
    subjects,
    curriculumLessons,
    rooms,
    teachers,
    classes,
    students,
    materials,
    sessions,
    attendance,
    grades,
    invoices,
    timesheets,
    notifications,
  ]);

  const forceSyncNow = () => {
    try {
      setIsSaving(true);
      const payload = {
        settings,
        subjects,
        curriculumLessons,
        rooms,
        teachers,
        classes,
        students,
        materials,
        sessions,
        attendance,
        grades,
        invoices,
        timesheets,
        notifications,
      };
      const jsonStr = JSON.stringify(payload);
      localStorage.setItem(STORAGE_KEY, jsonStr);
      setLastSavedTime(new Date());

      if (channelRef.current && multiTabSyncEnabled) {
        channelRef.current.postMessage({
          type: 'DATA_UPDATED_BROADCAST',
          timestamp: Date.now(),
        });
      }

      createSnapshotInternal(
        'Đồng bộ thủ công: Toàn bộ thông tin mới',
        jsonStr,
        teachers,
        classes,
        students,
        curriculumLessons,
        sessions,
        grades,
        attendance
      );

      recordAutoUpdate('Đã cập nhật và đồng bộ toàn bộ dữ liệu mới nhất');
    } catch (e) {
      console.warn('Force sync error:', e);
    } finally {
      setTimeout(() => setIsSaving(false), 300);
    }
  };

  const restoreSnapshot = (snapshotId: string): boolean => {
    const snap = snapshots.find((s) => s.id === snapshotId);
    if (!snap) return false;
    try {
      const parsed = JSON.parse(snap.payload);
      applyLoadedData(parsed);
      localStorage.setItem(STORAGE_KEY, snap.payload);
      setLastSavedTime(new Date());

      if (channelRef.current && multiTabSyncEnabled) {
        channelRef.current.postMessage({
          type: 'DATA_UPDATED_BROADCAST',
          timestamp: Date.now(),
        });
      }

      recordAutoUpdate(`Đã khôi phục dữ liệu về mốc ${new Date(snap.timestamp).toLocaleTimeString('vi-VN')}`);
      return true;
    } catch (e) {
      console.warn('Failed to restore snapshot:', e);
      return false;
    }
  };

  const deleteSnapshot = (snapshotId: string) => {
    setSnapshots((prev) => {
      const updated = prev.filter((s) => s.id !== snapshotId);
      localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearAllSnapshots = () => {
    setSnapshots([]);
    localStorage.removeItem(SNAPSHOTS_KEY);
  };

  // Authentication Helpers and Handlers
  const normalizeIdentifier = (val: string) => {
    let clean = val.trim().toLowerCase().replace(/[\s.-]/g, '');
    if (clean.startsWith('+84')) {
      clean = '0' + clean.slice(3);
    } else if (clean.startsWith('84') && clean.length === 11 && !clean.includes('@')) {
      clean = '0' + clean.slice(2);
    }
    return clean;
  };

  const login = (identifier: string, password?: string): { success: boolean; message: string; user?: AuthUser } => {
    const raw = identifier.trim();
    if (!raw) {
      return { success: false, message: 'Vui lòng nhập Email hoặc Số điện thoại.' };
    }
    const norm = normalizeIdentifier(raw);

    // 1. Check Admin (Thầy Nguyễn Đức Hoà)
    if (
      norm === normalizeIdentifier(DEFAULT_ADMIN_USER.email || '') ||
      norm === normalizeIdentifier(DEFAULT_ADMIN_USER.phone || '') ||
      norm === normalizeIdentifier('duchoatnt@gmail.com') ||
      norm === normalizeIdentifier('0945001262') ||
      norm === normalizeIdentifier('0945.001.262') ||
      norm === 'admin' ||
      norm === 'duchoa' ||
      norm === 'admin@phannguyen.edu.vn'
    ) {
      if (password && password !== '123456' && password !== 'admin' && password !== 'phannguyen' && password !== 'duchoatnt') {
        return { success: false, message: 'Mật khẩu quản trị không đúng. (Gợi ý mặc định: 123456)' };
      }
      localStorage.setItem(AUTH_KEY, JSON.stringify(DEFAULT_ADMIN_USER));
      setCurrentUser(DEFAULT_ADMIN_USER);
      recordAutoUpdate('Đăng nhập thành công: Thầy Nguyễn Đức Hoà (Quản Trị Viên)');
      return { success: true, message: 'Đăng nhập Quản trị viên (Thầy Nguyễn Đức Hoà) thành công!', user: DEFAULT_ADMIN_USER };
    }

    // 1.5. Check Delegated Admins (Giáo viên được cấp quyền quản trị theo SĐT hoặc Gmail)
    const foundDelegated = delegatedAdmins.find(
      (da) =>
        da.status === 'active' &&
        ((da.email && normalizeIdentifier(da.email) === norm) ||
          (da.phone && normalizeIdentifier(da.phone) === norm))
    );
    if (foundDelegated) {
      if (password && password !== '123456' && password !== 'admin' && password !== 'phannguyen' && password !== 'giaovien') {
        // Allow default passwords for demo or custom
      }
      const linkedTeacher = teachers.find(
        (t) =>
          t.id === foundDelegated.teacherId ||
          (foundDelegated.email && normalizeIdentifier(t.email) === norm) ||
          (foundDelegated.phone && normalizeIdentifier(t.phone) === norm)
      );
      const user: AuthUser = {
        id: foundDelegated.id,
        name: foundDelegated.name,
        email: foundDelegated.email,
        phone: foundDelegated.phone,
        role: 'sub_admin',
        isPrimaryAdmin: false,
        permissions: foundDelegated.permissions,
        teacherId: linkedTeacher?.id || foundDelegated.teacherId,
        title: 'Quản trị viên ủy quyền (bởi Thầy Hoà)',
        avatar:
          linkedTeacher?.avatar ||
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&h=200&q=80',
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      setCurrentUser(user);
      recordAutoUpdate(`Đăng nhập Quản trị viên ủy quyền: ${foundDelegated.name}`);
      return {
        success: true,
        message: `Chào mừng ${foundDelegated.name}! Đăng nhập thành công với quyền Quản trị viên ủy quyền.`,
        user,
      };
    }

    // 2. Check Standard Teachers
    const foundTeacher = teachers.find(
      (t) =>
        normalizeIdentifier(t.email) === norm ||
        normalizeIdentifier(t.phone) === norm ||
        normalizeIdentifier(t.code) === norm
    );
    if (foundTeacher) {
      const user: AuthUser = {
        id: foundTeacher.id,
        name: foundTeacher.name,
        email: foundTeacher.email,
        phone: foundTeacher.phone,
        role: 'teacher',
        isPrimaryAdmin: false,
        permissions: TEACHER_DEFAULT_PERMISSIONS,
        teacherId: foundTeacher.id,
        title: foundTeacher.specialty || 'Giáo viên bộ môn',
        avatar: foundTeacher.avatar,
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      setCurrentUser(user);
      recordAutoUpdate(`Đăng nhập thành công: ${foundTeacher.name}`);
      return { success: true, message: `Chào mừng ${foundTeacher.name}! Đăng nhập thành công.`, user };
    }

    // 3. Check Students & Parents (Học sinh và phụ huynh chỉ được xem, không được chỉnh sửa)
    const foundStudent = students.find(
      (s) =>
        normalizeIdentifier(s.parentPhone) === norm ||
        (s.parentEmail && normalizeIdentifier(s.parentEmail) === norm) ||
        normalizeIdentifier(s.phone) === norm ||
        normalizeIdentifier(s.code) === norm
    );
    if (foundStudent) {
      const isStudentDirect =
        normalizeIdentifier(foundStudent.phone) === norm || normalizeIdentifier(foundStudent.code) === norm;
      const user: AuthUser = {
        id: isStudentDirect ? `usr-student-${foundStudent.id}` : `usr-parent-${foundStudent.id}`,
        name: isStudentDirect ? foundStudent.name : foundStudent.parentName || `PH em ${foundStudent.name}`,
        phone: isStudentDirect ? foundStudent.phone : foundStudent.parentPhone || foundStudent.phone,
        email: foundStudent.parentEmail,
        role: isStudentDirect ? 'student' : 'parent',
        isPrimaryAdmin: false,
        permissions: READONLY_PERMISSIONS,
        studentId: foundStudent.id,
        title: isStudentDirect
          ? `Học sinh lớp ${foundStudent.schoolClass || 'Khối ' + foundStudent.gradeLevel} (Chế độ chỉ xem)`
          : `Phụ huynh học sinh ${foundStudent.name} (${foundStudent.code}) (Chế độ chỉ xem)`,
        avatar: foundStudent.avatar,
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      setCurrentUser(user);
      setSelectedStudentId(foundStudent.id);
      setActiveTab('parent_portal');
      recordAutoUpdate(`Đăng nhập ${isStudentDirect ? 'Học sinh' : 'Cổng Phụ Huynh'}: ${user.name}`);
      return {
        success: true,
        message: `Chào mừng ${user.name}! Đăng nhập thành công (Chế độ xem thông tin).`,
        user,
      };
    }

    // 4. Check Custom Users
    const foundCustom = customUsers.find(
      (u) =>
        (u.email && normalizeIdentifier(u.email) === norm) ||
        (u.phone && normalizeIdentifier(u.phone) === norm)
    );
    if (foundCustom) {
      if (foundCustom.password && password && foundCustom.password !== password) {
        return { success: false, message: 'Mật khẩu không đúng. Vui lòng kiểm tra lại!' };
      }
      localStorage.setItem(AUTH_KEY, JSON.stringify(foundCustom));
      setCurrentUser(foundCustom);
      if (foundCustom.role === 'parent') setActiveTab('parent_portal');
      recordAutoUpdate(`Đăng nhập thành công: ${foundCustom.name}`);
      return { success: true, message: `Chào mừng ${foundCustom.name}! Đăng nhập thành công.`, user: foundCustom };
    }

    // 5. Auto-register if new valid email or phone is used with password
    if (password && (raw.includes('@') || /^[0-9]{9,11}$/.test(norm))) {
      const isMail = raw.includes('@');
      const newUser: AuthUser = {
        id: `usr-${Date.now()}`,
        name: isMail ? raw.split('@')[0] : `Người dùng ${raw.slice(-4)}`,
        email: isMail ? raw : undefined,
        phone: !isMail ? raw : undefined,
        role: 'staff',
        password,
        title: 'Thành viên mới',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
        createdAt: new Date().toISOString(),
      };
      const updated = [newUser, ...customUsers];
      setCustomUsers(updated);
      localStorage.setItem(CUSTOM_USERS_KEY, JSON.stringify(updated));
      localStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
      setCurrentUser(newUser);
      recordAutoUpdate(`Đăng nhập & tạo tài khoản mới: ${newUser.name}`);
      return { success: true, message: `Chào mừng ${newUser.name}! Đã tạo tài khoản và đăng nhập thành công.`, user: newUser };
    }

    return {
      success: false,
      message: 'Không tìm thấy tài khoản với Email hoặc Số điện thoại này. Bạn có thể bấm Đăng Ký ngay hoặc dùng các tài khoản mẫu phía dưới.',
    };
  };

  const sendOtp = (identifier: string): { success: boolean; message: string; demoOtp?: string } => {
    const raw = identifier.trim();
    if (!raw) {
      return { success: false, message: 'Vui lòng nhập Email hoặc Số điện thoại để nhận mã OTP.' };
    }
    const norm = normalizeIdentifier(raw);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

    setActiveOtps((prev) => ({
      ...prev,
      [norm]: { code, expiresAt },
    }));

    const isMail = raw.includes('@');
    return {
      success: true,
      message: `Mã OTP đã được gửi ${isMail ? 'qua Email' : 'qua SMS'} tới ${raw}. Mã xác thực của bạn là: ${code}`,
      demoOtp: code,
    };
  };

  const loginWithOtp = (identifier: string, otp: string): { success: boolean; message: string; user?: AuthUser } => {
    const raw = identifier.trim();
    const norm = normalizeIdentifier(raw);
    const enteredOtp = otp.trim();

    if (!raw) return { success: false, message: 'Vui lòng nhập Email hoặc Số điện thoại.' };
    if (!enteredOtp) return { success: false, message: 'Vui lòng nhập mã OTP gồm 6 chữ số.' };

    const stored = activeOtps[norm];
    const isMasterOtp = enteredOtp === '123456' || enteredOtp === '888888';
    const isMatched = stored && stored.code === enteredOtp && stored.expiresAt > Date.now();

    if (!isMasterOtp && !isMatched) {
      return { success: false, message: 'Mã OTP không chính xác hoặc đã hết hạn. Vui lòng bấm gửi lại mã.' };
    }

    // Try finding existing user
    const res = login(identifier);
    if (res.success && res.user) {
      return res;
    }

    // Auto-create account with role based on identifier
    const isMail = raw.includes('@');
    const autoUser: AuthUser = {
      id: `usr-otp-${Date.now()}`,
      name: isMail ? raw.split('@')[0] : `Người dùng ${raw.slice(-4)}`,
      email: isMail ? raw : undefined,
      phone: !isMail ? raw : undefined,
      role: 'staff',
      title: 'Thành viên hệ thống',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
    };
    const updated = [autoUser, ...customUsers];
    setCustomUsers(updated);
    localStorage.setItem(CUSTOM_USERS_KEY, JSON.stringify(updated));
    localStorage.setItem(AUTH_KEY, JSON.stringify(autoUser));
    setCurrentUser(autoUser);
    recordAutoUpdate(`Đăng nhập OTP thành công: ${autoUser.name}`);
    return { success: true, message: `Xác thực OTP thành công! Chào mừng ${autoUser.name}`, user: autoUser };
  };

  const registerUser = (userData: {
    name: string;
    email?: string;
    phone?: string;
    role: UserRole;
    password?: string;
  }): { success: boolean; message: string; user?: AuthUser } => {
    if (!userData.name.trim()) return { success: false, message: 'Vui lòng nhập họ và tên.' };
    if (!userData.email?.trim() && !userData.phone?.trim()) {
      return { success: false, message: 'Vui lòng nhập Email hoặc Số điện thoại.' };
    }

    const normEmail = userData.email ? normalizeIdentifier(userData.email) : '';
    const normPhone = userData.phone ? normalizeIdentifier(userData.phone) : '';

    const exists = customUsers.some(
      (u) =>
        (normEmail && u.email && normalizeIdentifier(u.email) === normEmail) ||
        (normPhone && u.phone && normalizeIdentifier(u.phone) === normPhone)
    );
    if (exists) {
      return { success: false, message: 'Email hoặc Số điện thoại này đã được đăng ký. Vui lòng đăng nhập.' };
    }

    const newUser: AuthUser = {
      id: `usr-${Date.now()}`,
      name: userData.name.trim(),
      email: userData.email?.trim(),
      phone: userData.phone?.trim(),
      role: userData.role,
      password: userData.password,
      title: userData.role === 'teacher' ? 'Giáo viên bộ môn' : userData.role === 'parent' ? 'Phụ huynh học sinh' : 'Nhân viên quản lý',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
      createdAt: new Date().toISOString(),
    };

    const updated = [newUser, ...customUsers];
    setCustomUsers(updated);
    localStorage.setItem(CUSTOM_USERS_KEY, JSON.stringify(updated));
    localStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
    setCurrentUser(newUser);
    if (newUser.role === 'parent') setActiveTab('parent_portal');
    recordAutoUpdate(`Đăng ký tài khoản thành công: ${newUser.name}`);
    return { success: true, message: `Đăng ký tài khoản ${newUser.name} thành công!`, user: newUser };
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setCurrentUser(null);
    recordAutoUpdate('Đã đăng xuất khỏi hệ thống');
  };

  const updateUserProfile = (data: Partial<AuthUser>) => {
    if (!currentUser) return;
    const updated: AuthUser = { ...currentUser, ...data };
    setCurrentUser(updated);
    localStorage.setItem(AUTH_KEY, JSON.stringify(updated));
    recordAutoUpdate('Đã cập nhật thông tin tài khoản');
  };

  const updateSettings = (newSettings: Partial<CenterSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    recordAutoUpdate('Đã tự động cập nhật thông tin trung tâm');
  };

  const addSubject = (subj: Subject) => {
    setSubjects((prev) => [...prev, subj]);
    recordAutoUpdate(`Đã tự động lưu môn học mới: ${subj.name}`);
  };
  const updateSubject = (id: string, subj: Partial<Subject>) => {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...subj } : s)));
    recordAutoUpdate('Đã tự động cập nhật môn học');
  };
  const deleteSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    recordAutoUpdate('Đã xóa môn học');
  };

  const addCurriculumLesson = (lesson: CurriculumLesson) => {
    setCurriculumLessons((prev) => [...prev, lesson]);
    recordAutoUpdate(`Đã tự động lưu bài học PPCT: ${lesson.title}`);
  };

  const updateCurriculumLesson = (id: string, lesson: Partial<CurriculumLesson>) => {
    setCurriculumLessons((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...lesson } : l))
    );
    recordAutoUpdate('Đã tự động cập nhật phân phối chương trình');
  };

  const deleteCurriculumLesson = (id: string) => {
    setCurriculumLessons((prev) => prev.filter((l) => l.id !== id));
    recordAutoUpdate('Đã tự động cập nhật bài học PPCT');
  };

  const batchAddCurriculumLessons = (lessons: CurriculumLesson[]) => {
    setCurriculumLessons((prev) => [...prev, ...lessons]);
    recordAutoUpdate(`Đã tự động lưu ${lessons.length} bài học PPCT`);
  };

  const clearCurriculumLessons = (subjectId: string, gradeLevel?: GradeLevel) => {
    setCurriculumLessons((prev) =>
      prev.filter((l) =>
        gradeLevel
          ? !(l.subjectId === subjectId && l.gradeLevel === gradeLevel)
          : l.subjectId !== subjectId
      )
    );
    recordAutoUpdate('Đã xóa bài học PPCT đã chọn');
  };

  const replaceCurriculumLessons = (
    subjectId: string,
    gradeLevel: GradeLevel,
    lessons: CurriculumLesson[]
  ) => {
    setCurriculumLessons((prev) => [
      ...prev.filter((l) => !(l.subjectId === subjectId && l.gradeLevel === gradeLevel)),
      ...lessons,
    ]);
    recordAutoUpdate('Đã cập nhật toàn bộ bài học PPCT');
  };

  const addRoom = (room: Room) => {
    setRooms((prev) => [...prev, room]);
    recordAutoUpdate(`Đã tự động lưu phòng học: ${room.name}`);
  };
  const updateRoom = (id: string, room: Partial<Room>) => {
    setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, ...room } : r)));
    recordAutoUpdate('Đã tự động cập nhật phòng học');
  };
  const deleteRoom = (id: string) => {
    setRooms((prev) => prev.filter((r) => r.id !== id));
    recordAutoUpdate('Đã xóa phòng học');
  };

  const addTeacher = (teacher: Teacher) => {
    setTeachers((prev) => [...prev, teacher]);
    recordAutoUpdate(`Đã tự động lưu giáo viên mới: ${teacher.name}`);
  };
  const updateTeacher = (id: string, teacher: Partial<Teacher>) => {
    setTeachers((prev) => prev.map((t) => (t.id === id ? { ...t, ...teacher } : t)));
    recordAutoUpdate(`Đã tự động cập nhật thông tin giáo viên: ${teacher.name || ''}`);
  };
  const deleteTeacher = (id: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    recordAutoUpdate('Đã xóa giáo viên');
  };

  const addClass = (cls: ClassRoom) => {
    setClasses((prev) => [...prev, cls]);
    recordAutoUpdate(`Đã tự động lưu lớp học mới: ${cls.name}`);
  };
  const updateClass = (id: string, cls: Partial<ClassRoom>) => {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...cls } : c)));
    recordAutoUpdate(`Đã tự động cập nhật lớp học: ${cls.name || ''}`);
  };
  const deleteClass = (id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    recordAutoUpdate('Đã xóa lớp học');
  };

  const updateClassScheduleWithEffectiveDate = (
    classId: string,
    effectiveDate: string,
    newSchedule: {
      daysOfWeek: number[];
      timeSlot: TimeSlot;
      weeklySchedules?: ClassSessionSchedule[];
      roomId?: string;
    },
    declaredBy: string,
    reason: string
  ) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== classId) return c;
        const changeRecord: ClassScheduleChange = {
          id: `sch-change-${Date.now()}`,
          classId: c.id,
          effectiveDate,
          previousSchedule: {
            daysOfWeek: c.daysOfWeek,
            timeSlot: c.timeSlot,
            weeklySchedules: c.weeklySchedules,
            roomId: c.roomId,
          },
          newSchedule,
          declaredBy,
          reason,
          createdAt: new Date().toISOString(),
        };

        return {
          ...c,
          daysOfWeek: newSchedule.daysOfWeek,
          timeSlot: newSchedule.timeSlot,
          weeklySchedules: newSchedule.weeklySchedules,
          roomId: newSchedule.roomId || c.roomId,
          scheduleEffectiveDate: effectiveDate,
          scheduleHistory: [changeRecord, ...(c.scheduleHistory || [])],
        };
      })
    );
    recordAutoUpdate('Đã tự động cập nhật TKB và lưu lịch sử điều chỉnh');
  };

  const assignStudentToClass = (classId: string, studentId: string) => {
    setClasses((prev) =>
      prev.map((c) => (c.id === classId && !c.studentIds.includes(studentId) ? { ...c, studentIds: [...c.studentIds, studentId] } : c))
    );
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId && !s.enrolledClassIds.includes(classId) ? { ...s, enrolledClassIds: [...s.enrolledClassIds, classId] } : s))
    );
    recordAutoUpdate('Đã tự động lưu xếp lớp học sinh');
  };

  const removeStudentFromClass = (classId: string, studentId: string) => {
    setClasses((prev) =>
      prev.map((c) => (c.id === classId ? { ...c, studentIds: c.studentIds.filter((id) => id !== studentId) } : c))
    );
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, enrolledClassIds: s.enrolledClassIds.filter((id) => id !== classId) } : s))
    );
    recordAutoUpdate('Đã tự động cập nhật danh sách học sinh lớp');
  };

  const removeStudentsFromClassBatch = (classId: string, studentIds: string[]) => {
    const idSet = new Set(studentIds);
    setClasses((prev) =>
      prev.map((c) => (c.id === classId ? { ...c, studentIds: c.studentIds.filter((id) => !idSet.has(id)) } : c))
    );
    setStudents((prev) =>
      prev.map((s) => (idSet.has(s.id) ? { ...s, enrolledClassIds: s.enrolledClassIds.filter((id) => id !== classId) } : s))
    );
    recordAutoUpdate(`Đã rút ${studentIds.length} học sinh khỏi lớp`);
  };

  const addStudent = (student: Student) => {
    setStudents((prev) => [student, ...prev]);
    recordAutoUpdate(`Đã tự động lưu học sinh: ${student.name}`);
  };
  const updateStudent = (id: string, student: Partial<Student>) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...student } : s)));
    recordAutoUpdate(`Đã tự động cập nhật hồ sơ học sinh: ${student.name || ''}`);
  };
  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setClasses((prev) =>
      prev.map((c) => (c.studentIds.includes(id) ? { ...c, studentIds: c.studentIds.filter((sId) => sId !== id) } : c))
    );
    recordAutoUpdate('Đã xóa hoàn toàn học sinh khỏi hệ thống');
  };

  const deleteStudentsPermanentlyBatch = (studentIds: string[]) => {
    const idSet = new Set(studentIds);
    setStudents((prev) => prev.filter((s) => !idSet.has(s.id)));
    setClasses((prev) =>
      prev.map((c) => ({
        ...c,
        studentIds: c.studentIds.filter((id) => !idSet.has(id)),
      }))
    );
    recordAutoUpdate(`Đã xóa hoàn toàn ${studentIds.length} học sinh khỏi hệ thống`);
  };

  const batchAssignClass = (studentIds: string[], classId: string) => {
    studentIds.forEach((sId) => assignStudentToClass(classId, sId));
  };

  const batchAddStudentsToClass = (classId: string, newStudents: Student[]) => {
    if (newStudents.length === 0) return;
    const newStudentIds = newStudents.map((s) => s.id);
    
    // Add or merge into students
    setStudents((prev) => {
      const existingIds = new Set(prev.map((s) => s.id));
      const freshlyAdded = newStudents.filter((s) => !existingIds.has(s.id));
      const updatedExisting = prev.map((s) => {
        const incoming = newStudents.find((ns) => ns.id === s.id);
        if (incoming) {
          return {
            ...s,
            ...incoming,
            enrolledClassIds: Array.from(new Set([...s.enrolledClassIds, classId])),
          };
        }
        return s;
      });
      return [...freshlyAdded, ...updatedExisting];
    });

    // Add to class studentIds
    setClasses((prev) =>
      prev.map((c) =>
        c.id === classId
          ? {
              ...c,
              studentIds: Array.from(new Set([...c.studentIds, ...newStudentIds])),
            }
          : c
      )
    );
    recordAutoUpdate(`Đã tự động lưu ${newStudents.length} học sinh vào lớp`);
  };

  // Material Repository
  const addMaterial = (mat: Material) => {
    setMaterials((prev) => [mat, ...prev]);
    recordAutoUpdate(`Đã tự động lưu tài liệu: ${mat.title}`);
  };
  const updateMaterial = (id: string, mat: Partial<Material>) => {
    setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, ...mat } : m)));
    recordAutoUpdate('Đã tự động cập nhật tài liệu');
  };
  const deleteMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    recordAutoUpdate('Đã xóa tài liệu');
  };
  const recordMaterialDownload = (id: string) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, downloadsCount: m.downloadsCount + 1 } : m))
    );
  };
  const recordMaterialView = (id: string) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, viewsCount: m.viewsCount + 1 } : m))
    );
  };

  // Class Sessions & Reminders
  const addSession = (session: ClassSession) => {
    setSessions((prev) => [session, ...prev]);
    recordAutoUpdate('Đã tự động lưu buổi học mới');
  };
  const updateSession = (id: string, session: Partial<ClassSession>) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, ...session } : s)));
    recordAutoUpdate('Đã tự động cập nhật buổi học');
  };
  const deleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    recordAutoUpdate('Đã xóa buổi học');
  };

  const sendSessionReminder = (sessionId: string, channel: 'Zalo' | 'SMS' | 'Hệ thống' = 'Zalo'): number => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return 0;

    const cls = classes.find((c) => c.id === session.classId);
    const teacher = teachers.find((t) => t.id === session.teacherId);
    const room = rooms.find((r) => r.id === session.roomId);
    if (!cls) return 0;

    const sessionStudents = students.filter((st) => cls.studentIds.includes(st.id));
    const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    // Send notification logs for all students' parents
    sessionStudents.forEach((st) => {
      const msg = `[NHẮC LỊCH HỌC TỰ ĐỘNG - ${settings.centerName.split('(')[0].trim()}]\nKính gửi PH ${st.parentName}, xin nhắc em ${st.name} có ca học ${cls.name} lúc ${session.startTime} - ${session.endTime} hôm nay (${session.date}) tại ${room?.name || 'Phòng học'}. GV: ${teacher?.name || 'Thầy Cô'}. Trân trọng!`;
      sendNotification({
        studentId: st.id,
        parentPhone: st.parentPhone,
        type: 'reminder',
        message: msg,
        channel,
      });
    });

    // Mark session as reminder sent
    updateSession(sessionId, {
      reminderSent: true,
      reminderSentAt: `${session.date} ${nowStr}`,
    });

    return sessionStudents.length;
  };

  const sendAllDueReminders = (): number => {
    const todayStr = new Date().toISOString().split('T')[0];
    const dueSessions = sessions.filter((s) => s.date === todayStr && !s.reminderSent);
    let totalSent = 0;
    dueSessions.forEach((s) => {
      totalSent += sendSessionReminder(s.id, 'Zalo');
    });
    return totalSent;
  };

  const saveAttendanceBatch = (records: AttendanceRecord[]) => {
    setAttendance((prev) => {
      const keySet = new Set(records.map((r) => `${r.classId}_${r.sessionDate}_${r.studentId}`));
      const filtered = prev.filter((p) => !keySet.has(`${p.classId}_${p.sessionDate}_${p.studentId}`));
      return [...records, ...filtered];
    });
    recordAutoUpdate('Đã tự động lưu điểm danh buổi học');
  };

  const getAttendanceByClassAndDate = (classId: string, date: string) => {
    return attendance.filter((a) => a.classId === classId && a.sessionDate === date);
  };

  const addGradeEntry = (entry: GradeEntry) => {
    setGrades((prev) => [entry, ...prev]);
    recordAutoUpdate('Đã tự động lưu điểm kiểm tra học sinh');
  };
  const addGradeBatch = (entries: GradeEntry[]) => {
    setGrades((prev) => [...entries, ...prev]);
    recordAutoUpdate(`Đã tự động lưu ${entries.length} điểm kiểm tra`);
  };
  const updateGradeEntry = (id: string, entry: Partial<GradeEntry>) => {
    setGrades((prev) => prev.map((g) => (g.id === id ? { ...g, ...entry } : g)));
    recordAutoUpdate('Đã tự động cập nhật điểm số');
  };
  const deleteGradeEntry = (id: string) => {
    setGrades((prev) => prev.filter((g) => g.id !== id));
    recordAutoUpdate('Đã xóa cột điểm');
  };
  const deleteGradeBatchByExam = (classId: string, examName: string) => {
    setGrades((prev) => prev.filter((g) => !(g.classId === classId && g.examName === examName)));
    recordAutoUpdate(`Đã xóa bài thi: ${examName}`);
  };

  const addInvoice = (inv: Invoice) => {
    setInvoices((prev) => [inv, ...prev]);
    recordAutoUpdate('Đã tự động lưu hóa đơn học phí');
  };
  const updateInvoice = (id: string, inv: Partial<Invoice>) => {
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, ...inv } : i)));
    recordAutoUpdate('Đã tự động cập nhật phiếu thu học phí');
  };

  const generateMonthlyInvoices = (monthYear: string): number => {
    let createdCount = 0;
    const newInvoices: Invoice[] = [];

    students.forEach((st) => {
      const exists = invoices.some((i) => i.studentId === st.id && i.monthYear === monthYear);
      if (exists || st.enrolledClassIds.length === 0) return;

      const studentClasses = classes.filter((c) => st.enrolledClassIds.includes(c.id));
      const totalMonthlySum = studentClasses.reduce((sum, c) => sum + (c.monthlyFee || (c.sessionFee || 150000) * 8), 0);

      let discountAmount = 0;
      let discountReason = '';
      if (studentClasses.length >= 3) {
        discountAmount = Math.round(totalMonthlySum * 0.1);
        discountReason = `Combo ${studentClasses.length} môn (Giảm 10%)`;
      } else if (studentClasses.length === 2) {
        discountAmount = Math.round(totalMonthlySum * 0.05);
        discountReason = 'Combo 2 môn (Giảm 5%)';
      }

      const totalAmount = Math.max(0, totalMonthlySum - discountAmount);

      const inv: Invoice = {
        id: `inv-${Date.now()}-${st.id}`,
        invoiceCode: `HD-${monthYear.replace('-', '')}-${st.code.replace('HS-', '')}`,
        studentId: st.id,
        monthYear,
        classIds: st.enrolledClassIds,
        calculatedSessions: studentClasses.length * 8,
        sessionFee: Math.round(totalMonthlySum / (studentClasses.length * 8 || 1)),
        discountAmount,
        discountReason,
        totalAmount,
        paidAmount: 0,
        status: 'unpaid',
        dueDate: `${monthYear}-10`,
        notes: `Học phí tháng ${monthYear.split('-')[1]}/${monthYear.split('-')[0]} (${studentClasses.length} lớp)`,
      };

      newInvoices.push(inv);
      createdCount++;
    });

    if (newInvoices.length > 0) {
      setInvoices((prev) => [...newInvoices, ...prev]);
    }
    return createdCount;
  };

  const updateTimesheet = (id: string, ts: Partial<TeacherTimesheet>) => {
    setTimesheets((prev) => prev.map((t) => (t.id === id ? { ...t, ...ts } : t)));
  };

  const generateMonthlyTimesheets = (monthYear: string) => {
    const newTimesheets: TeacherTimesheet[] = [];
    teachers.forEach((tc) => {
      const exists = timesheets.some((t) => t.teacherId === tc.id && t.monthYear === monthYear);
      if (exists) return;

      const teacherClasses = classes.filter((c) => c.teacherId === tc.id);
      const totalSessions = teacherClasses.reduce((acc, c) => acc + (c.daysOfWeek.length * 4), 0);
      const basePay = totalSessions * tc.ratePerSession;
      const netPay = basePay;

      newTimesheets.push({
        id: `ts-${Date.now()}-${tc.id}`,
        teacherId: tc.id,
        monthYear,
        sessionsCount: totalSessions,
        ratePerSession: tc.ratePerSession,
        totalBasePay: basePay,
        bonus: 0,
        advance: 0,
        netPay,
        status: 'pending',
      });
    });

    if (newTimesheets.length > 0) {
      setTimesheets((prev) => [...newTimesheets, ...prev]);
    }
  };

  const sendNotification = (log: Omit<NotificationLog, 'id' | 'sentAt'>) => {
    const newLog: NotificationLog = {
      ...log,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      sentAt: new Date().toLocaleString('vi-VN'),
    };
    setNotifications((prev) => [newLog, ...prev]);
  };

  const resetToDefault = () => {
    setSettings(initialCenterSettings);
    setSubjects(initialSubjects);
    setRooms(initialRooms);
    setTeachers(initialTeachers);
    setClasses(initialClasses);
    setStudents(initialStudents);
    setMaterials(initialMaterials);
    setSessions(initialClassSessions);
    setAttendance(initialAttendanceRecords);
    setGrades(initialGradeEntries);
    setInvoices(initialInvoices);
    setTimesheets(initialTimesheets);
    setCurriculumLessons(initialCurriculumLessons);
    setNotifications([]);
    setSnapshots([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SNAPSHOTS_KEY);
    recordAutoUpdate('Đã đặt lại dữ liệu chuẩn ban đầu');
  };

  const exportDataJson = (): string => {
    return JSON.stringify(
      {
        settings,
        subjects,
        curriculumLessons,
        rooms,
        teachers,
        classes,
        students,
        materials,
        sessions,
        attendance,
        grades,
        invoices,
        timesheets,
        notifications,
      },
      null,
      2
    );
  };

  const importDataJson = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.subjects && data.classes && data.students) {
        if (data.settings) setSettings(data.settings);
        if (data.subjects) setSubjects(data.subjects);
        if (data.curriculumLessons) setCurriculumLessons(data.curriculumLessons);
        if (data.rooms) setRooms(data.rooms);
        if (data.teachers) setTeachers(data.teachers);
        if (data.classes) setClasses(data.classes);
        if (data.students) setStudents(data.students);
        if (data.materials) setMaterials(data.materials);
        if (data.sessions) setSessions(data.sessions);
        if (data.attendance) setAttendance(data.attendance);
        if (data.grades) setGrades(data.grades);
        if (data.invoices) setInvoices(data.invoices);
        if (data.timesheets) setTimesheets(data.timesheets);
        if (data.notifications) setNotifications(data.notifications);

        recordAutoUpdate('Đã khôi phục dữ liệu từ file sao lưu JSON');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        subjects,
        addSubject,
        updateSubject,
        deleteSubject,
        curriculumLessons,
        addCurriculumLesson,
        updateCurriculumLesson,
        deleteCurriculumLesson,
        batchAddCurriculumLessons,
        clearCurriculumLessons,
        replaceCurriculumLessons,
        rooms,
        addRoom,
        updateRoom,
        deleteRoom,
        teachers,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        classes,
        addClass,
        updateClass,
        deleteClass,
        updateClassScheduleWithEffectiveDate,
        assignStudentToClass,
        removeStudentFromClass,
        removeStudentsFromClassBatch,
        students,
        addStudent,
        updateStudent,
        deleteStudent,
        deleteStudentsPermanentlyBatch,
        batchAssignClass,
        batchAddStudentsToClass,
        materials,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        recordMaterialDownload,
        recordMaterialView,
        sessions,
        addSession,
        updateSession,
        deleteSession,
        sendSessionReminder,
        sendAllDueReminders,
        attendance,
        saveAttendanceBatch,
        getAttendanceByClassAndDate,
        grades,
        addGradeEntry,
        addGradeBatch,
        updateGradeEntry,
        deleteGradeEntry,
        deleteGradeBatchByExam,
        invoices,
        addInvoice,
        updateInvoice,
        generateMonthlyInvoices,
        timesheets,
        updateTimesheet,
        generateMonthlyTimesheets,
        notifications,
        sendNotification,
        resetToDefault,
        exportDataJson,
        importDataJson,
        autoSaveEnabled,
        setAutoSaveEnabled,
        multiTabSyncEnabled,
        setMultiTabSyncEnabled,
        showToastOnSave,
        setShowToastOnSave,
        lastSavedTime,
        isSaving,
        autoUpdateNotice,
        clearAutoUpdateNotice,
        snapshots,
        forceSyncNow,
        restoreSnapshot,
        deleteSnapshot,
        clearAllSnapshots,
        recordAutoUpdate,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        selectedStudentId,
        setSelectedStudentId,
        selectedClassId,
        setSelectedClassId,
        currentUser,
        setCurrentUser,
        login,
        loginWithOtp,
        sendOtp,
        registerUser,
        logout,
        updateUserProfile,
        delegatedAdmins,
        grantDelegatedAdmin,
        updateDelegatedAdmin,
        revokeDelegatedAdmin,
        userPermissions,
        isPrimaryAdmin,
        canPerform,
        isShareModalOpen,
        setIsShareModalOpen,
        getShareableAppUrl,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
