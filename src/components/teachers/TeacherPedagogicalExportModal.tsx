import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Teacher, ClassRoom } from '../../types/index.ts';
import {
  X,
  Printer,
  FileSpreadsheet,
  FileText,
  Calendar,
  BookOpen,
  ClipboardList,
  CheckSquare,
  Square,
  SlidersHorizontal,
  FileDown,
  CheckCircle2,
  Users,
  UserCheck,
  UserX,
  Clock,
  Filter,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { getDayOfWeekName, getAcademicWeekDates, getAcademicWeekNumber, getCenterCommuneOrLocation } from '../../utils/formatters.ts';

interface TeacherPedagogicalExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTeacher?: Teacher | null;
  defaultTab?: 'timetable' | 'teaching_plan' | 'class_journal';
}

export interface ExportColumnSettings {
  className: boolean;     // 'Tên lớp'
  roomName: boolean;      // 'Phòng học'
  timeSlot: boolean;      // 'Thời gian'
  absentOrLate: boolean;  // 'Tên học sinh đi muộn hoặc vắng học'
  note: boolean;          // 'Ghi chú' (mặc định để trống)
  subject: boolean;       // 'Môn học'
  studentCount: boolean;  // 'Sĩ số'
  ppctPeriod: boolean;    // 'Tiết PPCT'
  lessonName: boolean;    // 'Tên bài dạy / Nội dung'
  equipment: boolean;     // 'Đồ dùng / Thiết bị'
  rating: boolean;        // 'Xếp loại'
}

export const TeacherPedagogicalExportModal: React.FC<TeacherPedagogicalExportModalProps> = ({
  isOpen,
  onClose,
  initialTeacher,
  defaultTab = 'timetable',
}) => {
  const { settings, teachers, classes, subjects, rooms, curriculumLessons, attendance, students, sessions: classSessions } = useApp();

  const [activeTab, setActiveTab] = useState<'timetable' | 'teaching_plan' | 'class_journal'>(defaultTab);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    initialTeacher?.id || (teachers[0]?.id ?? '')
  );
  const [selectedWeek, setSelectedWeek] = useState<number>(1); // Tuần 1: Ngày khai giảng
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [filterClassId, setFilterClassId] = useState<string>('all');

  // Lấy ngày khai giảng tương ứng: Nếu chọn 1 lớp cụ thể thì lấy ngày khai giảng của lớp đó, ngược lại lấy ngày khai giảng chung của trung tâm
  const effectiveOpeningDate = useMemo(() => {
    if (filterClassId !== 'all') {
      const selectedCls = classes.find((c) => c.id === filterClassId);
      if (selectedCls?.startDate) return selectedCls.startDate;
    }
    return settings.openingDate || '2026-09-07';
  }, [filterClassId, classes, settings.openingDate]);

  // Khởi tạo thông tin tuần 1 theo ngày khai giảng
  const initialWeekInfo = useMemo(() => {
    return getAcademicWeekDates(1, effectiveOpeningDate);
  }, [effectiveOpeningDate]);

  // Bộ lọc khoảng thời gian: Từ ngày - Đến ngày
  const [startDate, setStartDate] = useState<string>(initialWeekInfo.startDateIso);
  const [endDate, setEndDate] = useState<string>(initialWeekInfo.endDateIso);

  // Cập nhật khoảng ngày khi đổi ngày khai giảng lớp hoặc trung tâm
  useEffect(() => {
    const info = getAcademicWeekDates(selectedWeek, effectiveOpeningDate);
    setStartDate(info.startDateIso);
    setEndDate(info.endDateIso);
  }, [selectedWeek, effectiveOpeningDate]);

  // Selected session IDs for checkbox export selection
  const [selectedSessionIds, setSelectedSessionIds] = useState<Record<string, boolean>>({});

  // Cài đặt định dạng xuất (checkboxes tùy chọn xuất các trường dữ liệu cụ thể - Đã bỏ Mã lớp và Khối)
  const [columnSettings, setColumnSettings] = useState<ExportColumnSettings>({
    className: true,     // Tên lớp
    roomName: true,      // Phòng học
    timeSlot: true,      // Thời gian
    absentOrLate: true,  // Tên học sinh đi muộn hoặc vắng học
    note: true,          // Ghi chú (để trống)
    subject: true,       // Môn học
    studentCount: true,  // Sĩ số
    ppctPeriod: true,    // Tiết PPCT
    lessonName: true,    // Tên bài dạy
    equipment: true,     // Đồ dùng / Thiết bị
    rating: true,        // Xếp loại
  });

  // Editable overrides for Lịch Báo Giảng & Sổ Ghi Đầu Bài & Sĩ Số & HS Vắng/Muộn & Ghi chú
  const [customPlans, setCustomPlans] = useState<
    Record<
      string,
      {
        lessonName?: string;
        ppctPeriod?: string;
        equipment?: string;
        absentOrLate?: string;
        note?: string;
        rating?: string;
        attendance?: string;
      }
    >
  >({});

  // Sync initialTeacher if it changes
  useEffect(() => {
    if (initialTeacher) {
      setSelectedTeacherId(initialTeacher.id);
    }
  }, [initialTeacher]);

  // When week selector changes, automatically sync startDate and endDate
  const handleWeekChange = (w: number) => {
    setSelectedWeek(w);
    const info = getAcademicWeekDates(w, effectiveOpeningDate);
    setStartDate(info.startDateIso);
    setEndDate(info.endDateIso);
  };

  const currentTeacher = teachers.find((t) => t.id === selectedTeacherId) || teachers[0];

  // Classes taught by current teacher
  const teacherClasses = classes.filter((c) => c.teacherId === currentTeacher?.id);

  // Format date display (DD/MM/YYYY)
  const formatDateStr = (iso: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  const startDateFormatted = formatDateStr(startDate);
  const endDateFormatted = formatDateStr(endDate);
  const centerLocation = getCenterCommuneOrLocation(settings.centerAddress);

  // Expand all sessions falling precisely within [startDate, endDate]
  interface SessionItem {
    id: string;
    classId: string;
    classCode: string;
    className: string;
    gradeLevel: string;
    subjectId: string;
    subjectName: string;
    dayOfWeek: number;
    dayName: string;
    dateFormatted: string;
    dateIso: string;
    startTime: string;
    endTime: string;
    roomName: string;
    studentCount: number;
  }

  const allTeacherSessions = useMemo(() => {
    if (!startDate || !endDate || startDate > endDate) return [];

    const list: SessionItem[] = [];
    const startObj = new Date(startDate);
    const endObj = new Date(endDate);

    // Loop through each date in the range
    const curr = new Date(startObj);
    while (curr <= endObj) {
      const day = curr.getDay();
      const dayOfWeek = day === 0 ? 8 : day + 1; // JS 0 = Sun -> 8, 1 = Mon -> 2
      const dateFormatted = `${String(curr.getDate()).padStart(2, '0')}/${String(curr.getMonth() + 1).padStart(2, '0')}/${curr.getFullYear()}`;
      const dateIso = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;

      teacherClasses.forEach((cls) => {
        const subject = subjects.find((s) => s.id === cls.subjectId);
        const room = rooms.find((r) => r.id === cls.roomId);

        // Check weekly schedules
        if (cls.weeklySchedules && cls.weeklySchedules.length > 0) {
          cls.weeklySchedules.forEach((ws, idx) => {
            if (ws.dayOfWeek === dayOfWeek) {
              const sessionRoom = ws.roomId ? rooms.find((r) => r.id === ws.roomId) || room : room;
              list.push({
                id: `${cls.id}-${dateIso}-${ws.startTime}-${idx}`,
                classId: cls.id,
                classCode: cls.code,
                className: cls.name,
                gradeLevel: cls.gradeLevel,
                subjectId: cls.subjectId,
                subjectName: subject?.name || 'Môn học',
                dayOfWeek: ws.dayOfWeek,
                dayName: getDayOfWeekName(ws.dayOfWeek),
                dateFormatted,
                dateIso,
                startTime: ws.startTime,
                endTime: ws.endTime,
                roomName: sessionRoom?.name || 'Phòng học',
                studentCount: cls.studentIds?.length || 0,
              });
            }
          });
        } else if (cls.daysOfWeek && cls.daysOfWeek.includes(dayOfWeek)) {
          list.push({
            id: `${cls.id}-${dateIso}-${cls.timeSlot?.start || '17:45'}`,
            classId: cls.id,
            classCode: cls.code,
            className: cls.name,
            gradeLevel: cls.gradeLevel,
            subjectId: cls.subjectId,
            subjectName: subject?.name || 'Môn học',
            dayOfWeek,
            dayName: getDayOfWeekName(dayOfWeek),
            dateFormatted,
            dateIso,
            startTime: cls.timeSlot?.start || '17:45',
            endTime: cls.timeSlot?.end || '19:30',
            roomName: room?.name || 'Phòng học',
            studentCount: cls.studentIds?.length || 0,
          });
        }
      });

      // Advance curr by 1 day
      curr.setDate(curr.getDate() + 1);
    }

    // Sort chronologically: Date ISO ascending, then start time
    list.sort((a, b) => {
      if (a.dateIso !== b.dateIso) return a.dateIso.localeCompare(b.dateIso);
      return a.startTime.localeCompare(b.startTime);
    });

    return list;
  }, [teacherClasses, subjects, rooms, startDate, endDate]);

  // Initialize selected session IDs when teacher / date range changes
  useEffect(() => {
    const initialSelection: Record<string, boolean> = {};
    allTeacherSessions.forEach((s) => {
      initialSelection[s.id] = true;
    });
    setSelectedSessionIds(initialSelection);
  }, [selectedTeacherId, allTeacherSessions.length, startDate, endDate]);

  // Filtered sessions by class filter
  const candidateSessions = useMemo(() => {
    if (filterClassId === 'all') return allTeacherSessions;
    return allTeacherSessions.filter((s) => s.classId === filterClassId);
  }, [allTeacherSessions, filterClassId]);

  // Only sessions that are checked (bỏ hoàn toàn các nội dung không được tích chọn)
  const activeExportSessions = useMemo(() => {
    return candidateSessions.filter((s) => selectedSessionIds[s.id] !== false);
  }, [candidateSessions, selectedSessionIds]);

  if (!isOpen) return null;

  // Toggle single session checkbox
  const toggleSessionCheck = (sessionId: string) => {
    setSelectedSessionIds((prev) => ({
      ...prev,
      [sessionId]: prev[sessionId] === false ? true : false,
    }));
  };

  // Select all or deselect all sessions in current candidate list
  const handleToggleSelectAll = (checked: boolean) => {
    const next = { ...selectedSessionIds };
    candidateSessions.forEach((s) => {
      next[s.id] = checked;
    });
    setSelectedSessionIds(next);
  };

  const isAllSelected = candidateSessions.length > 0 && candidateSessions.every((s) => selectedSessionIds[s.id] !== false);
  const selectedCount = activeExportSessions.length;

  // Toggle single column export setting
  const toggleColumn = (key: keyof ExportColumnSettings) => {
    setColumnSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Reset columns to all true
  const handleResetAllColumns = (val: boolean) => {
    setColumnSettings({
      className: val,
      roomName: val,
      timeSlot: val,
      absentOrLate: val,
      note: val,
      subject: val,
      studentCount: val,
      ppctPeriod: val,
      lessonName: val,
      equipment: val,
      rating: val,
    });
  };

  // Helper to extract Absent or Late students from attendance database
  const getAutoAbsentOrLate = (session: SessionItem) => {
    const sessionRecords = attendance.filter(
      (a) => a.classId === session.classId && a.sessionDate === session.dateIso
    );

    if (sessionRecords.length === 0) {
      return 'Không có HS vắng/muộn (Đủ)';
    }

    const absentList: string[] = [];
    const lateList: string[] = [];

    sessionRecords.forEach((rec) => {
      const st = students.find((s) => s.id === rec.studentId);
      const name = st?.name || 'Học sinh';
      if (rec.status === 'absent_excused') {
        absentList.push(`${name} (CP)`);
      } else if (rec.status === 'absent_unexcused') {
        absentList.push(`${name} (KP)`);
      } else if (rec.status === 'late') {
        absentList.push(`${name} (Muộn)`);
      }
    });

    const parts: string[] = [];
    if (absentList.length > 0) parts.push(`Vắng: ${absentList.join(', ')}`);
    if (lateList.length > 0) parts.push(`Đi muộn: ${lateList.join(', ')}`);

    return parts.length > 0 ? parts.join('; ') : 'Không có HS vắng/muộn (Đủ)';
  };

  // Auto-find curriculum lesson & absent/late students for a session
  const getSessionPlan = (session: SessionItem, sessionIdx: number) => {
    const override = customPlans[session.id] || {};
    const defaultPpctPeriod = `Tiết ${sessionIdx * 2 + 1}-${sessionIdx * 2 + 2}`;
    const autoAbsent = getAutoAbsentOrLate(session);

    if (
      override.lessonName !== undefined ||
      override.ppctPeriod !== undefined ||
      override.attendance !== undefined ||
      override.absentOrLate !== undefined ||
      override.note !== undefined
    ) {
      return {
        lessonName: override.lessonName ?? `Chủ đề trọng tâm & Ôn luyện chuyên đề ${sessionIdx + 1}`,
        ppctPeriod: override.ppctPeriod || defaultPpctPeriod,
        equipment: override.equipment || 'Máy chiếu, phiếu bài tập',
        absentOrLate: override.absentOrLate !== undefined ? override.absentOrLate : autoAbsent,
        note: override.note !== undefined ? override.note : '',
        attendance: override.attendance || `${session.studentCount}/${session.studentCount}`,
        rating: override.rating || '8/10',
      };
    }

    // Attempt to match from curriculumLessons by subject and grade strictly
    const matchingCurriculum = curriculumLessons.filter(
      (cl) => cl.subjectId === session.subjectId && cl.gradeLevel === session.gradeLevel
    );

    // Track sequential session index for this specific class
    const classSessionsPrior = activeExportSessions
      .filter((s) => s.classId === session.classId && s.dateIso <= session.dateIso)
      .sort((a, b) => a.dateIso.localeCompare(b.dateIso) || a.startTime.localeCompare(b.startTime));
    const classSessionIdx = Math.max(0, classSessionsPrior.findIndex((s) => s.id === session.id));

    // Match lesson by week first if available, otherwise by sequential class index
    const matchedLesson =
      matchingCurriculum.find((cl) => cl.week === selectedWeek && (cl.stt === classSessionIdx + 1 || matchingCurriculum.length <= 2)) ||
      matchingCurriculum.find((cl) => cl.week === selectedWeek) ||
      matchingCurriculum[classSessionIdx % (matchingCurriculum.length || 1)] ||
      matchingCurriculum[0];

    const fallbackPeriod = `Tiết ${classSessionIdx * 2 + 1}-${classSessionIdx * 2 + 2}`;

    return {
      lessonName: matchedLesson ? matchedLesson.title : `Chuyên đề ${session.subjectName} ${session.gradeLevel} - Bài ${classSessionIdx + 1}`,
      ppctPeriod: matchedLesson?.lessonNumber || fallbackPeriod,
      equipment: 'Máy chiếu, bài giảng số, đề in sẵn',
      absentOrLate: autoAbsent,
      note: '', // Để trống mặc định theo yêu cầu
      attendance: `${session.studentCount}/${session.studentCount}`,
      rating: '8/10',
    };
  };

  const updateSessionPlan = (sessionId: string, field: string, val: string) => {
    setCustomPlans((prev) => ({
      ...prev,
      [sessionId]: {
        ...prev[sessionId],
        [field]: val,
      },
    }));
  };

  // -------------------------------------------------------------
  // EXPORT EXCEL (.xlsx) - RESPECTS DATE RANGE & CHECKED SESSIONS
  // -------------------------------------------------------------
  const handleExportExcel = () => {
    if (!currentTeacher) return;
    if (activeExportSessions.length === 0) {
      alert('Vui lòng tích chọn ít nhất 1 buổi học trước khi xuất file!');
      return;
    }

    const wb = XLSX.utils.book_new();

    if (activeTab === 'timetable') {
      // 1. TIMETABLE
      const headers = ['STT', 'Thứ', 'Ngày Dạy'];
      if (columnSettings.timeSlot) headers.push('Khung Giờ (Thời gian)');
      if (columnSettings.className) headers.push('Tên Lớp Học');
      if (columnSettings.subject) headers.push('Môn Học');
      if (columnSettings.roomName) headers.push('Phòng Học');
      if (columnSettings.studentCount) headers.push('Sĩ Số');
      if (columnSettings.note) headers.push('Ghi Chú');

      const rows: any[][] = [
        ['HỘ KINH DOANH PHAN NGUYÊN - LUYỆN THI & BỒI DƯỠNG VĂN HÓA'],
        ['BẢNG PHÂN CÔNG THỜI KHÓA BIỂU GIẢNG DẠY CỦA GIÁO VIÊN'],
        [`Giáo viên: ${currentTeacher.name} | Mã GV: ${currentTeacher.code} | Điện thoại: ${currentTeacher.phone}`],
        [`Áp dụng: Từ ngày ${startDateFormatted} đến ngày ${endDateFormatted} (Năm học ${selectedYear} - ${selectedYear + 1})`],
        [],
        headers,
      ];

      activeExportSessions.forEach((s, idx) => {
        const plan = getSessionPlan(s, idx);
        const rowData: any[] = [idx + 1, s.dayName, s.dateFormatted];
        if (columnSettings.timeSlot) rowData.push(`${s.startTime} - ${s.endTime}`);
        if (columnSettings.className) rowData.push(s.className);
        if (columnSettings.subject) rowData.push(s.subjectName);
        if (columnSettings.roomName) rowData.push(s.roomName);
        if (columnSettings.studentCount) rowData.push(plan.attendance);
        if (columnSettings.note) rowData.push(plan.note);
        rows.push(rowData);
      });

      rows.push([]);
      rows.push([`Tổng số ca dạy đã chọn: ${activeExportSessions.length} buổi`]);
      rows.push([]);
      rows.push(['', '', '', '', '', `${centerLocation}, ngày ${startDateFormatted}`]);
      rows.push(['', '', '', '', '', 'GIÁO VIÊN GIẢNG DẠY']);
      rows.push(['', '', '', '', '', '(Ký và ghi rõ họ tên)']);
      rows.push([]);
      rows.push([]);
      rows.push(['', '', '', '', '', currentTeacher.name]);

      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, `TKB_${startDate}_${endDate}`);
      XLSX.writeFile(wb, `TKB_${startDate}_${endDate}_${currentTeacher.code}_${currentTeacher.name.replace(/\s+/g, '_')}.xlsx`);
    } else if (activeTab === 'teaching_plan') {
      // 2. LỊCH BÁO GIẢNG
      const headers = ['STT', 'Thứ / Ngày'];
      if (columnSettings.timeSlot) headers.push('Ca Dạy (Thời gian)');
      if (columnSettings.className) headers.push('Tên Lớp Học');
      if (columnSettings.subject) headers.push('Môn Học');
      if (columnSettings.studentCount) headers.push('Sĩ Số');
      if (columnSettings.ppctPeriod) headers.push('Tiết PPCT');
      if (columnSettings.lessonName) headers.push('Tên Bài Dạy / Chủ Đề');
      if (columnSettings.equipment) headers.push('Đồ Dùng / Thiết Bị');
      if (columnSettings.absentOrLate) headers.push('Tên Học Sinh Đi Muộn / Vắng Học');
      if (columnSettings.note) headers.push('Ghi Chú');

      const rows: any[][] = [
        ['HỘ KINH DOANH PHAN NGUYÊN - LỊCH BÁO GIẢNG GIẢNG DẠY'],
        ['LỊCH BÁO GIẢNG GIẢNG DẠY CỦA GIÁO VIÊN'],
        [`Giáo viên giảng dạy: ${currentTeacher.name} | Mã số: ${currentTeacher.code}`],
        [`Thời gian thực hiện: Từ ngày ${startDateFormatted} đến ngày ${endDateFormatted}`],
        [],
        headers,
      ];

      activeExportSessions.forEach((s, idx) => {
        const plan = getSessionPlan(s, idx);
        const rowData: any[] = [idx + 1, `${s.dayName} (${s.dateFormatted})`];
        if (columnSettings.timeSlot) rowData.push(`${s.startTime} - ${s.endTime}`);
        if (columnSettings.className) rowData.push(s.className);
        if (columnSettings.subject) rowData.push(s.subjectName);
        if (columnSettings.studentCount) rowData.push(plan.attendance);
        if (columnSettings.ppctPeriod) rowData.push(plan.ppctPeriod);
        if (columnSettings.lessonName) rowData.push(plan.lessonName);
        if (columnSettings.equipment) rowData.push(plan.equipment);
        if (columnSettings.absentOrLate) rowData.push(plan.absentOrLate);
        if (columnSettings.note) rowData.push(plan.note);
        rows.push(rowData);
      });

      rows.push([]);
      rows.push([`Tổng số ca dạy thực hiện: ${activeExportSessions.length} ca`]);
      rows.push([]);
      rows.push(['', '', '', '', '', `${centerLocation}, ngày ${startDateFormatted}`]);
      rows.push(['', '', '', '', '', 'GIÁO VIÊN BÁO GIẢNG']);
      rows.push(['', '', '', '', '', '(Ký và ghi rõ họ tên)']);
      rows.push([]);
      rows.push([]);
      rows.push(['', '', '', '', '', currentTeacher.name]);

      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, `LichBaoGiang_${startDate}_${endDate}`);
      XLSX.writeFile(wb, `LichBaoGiang_${startDate}_${endDate}_${currentTeacher.code}_${currentTeacher.name.replace(/\s+/g, '_')}.xlsx`);
    } else {
      // 3. SỔ GHI ĐẦU BÀI
      const headers = ['STT', 'Thứ, Ngày'];
      if (columnSettings.timeSlot) headers.push('Khung Giờ (Thời gian)');
      if (columnSettings.className) headers.push('Tên Lớp Học');
      if (columnSettings.roomName) headers.push('Phòng Học');
      if (columnSettings.studentCount) headers.push('Sĩ Số Lớp');
      if (columnSettings.ppctPeriod) headers.push('Tiết PPCT');
      if (columnSettings.lessonName) headers.push('Tên Bài Học / Nội Dung Giảng Dạy');
      if (columnSettings.absentOrLate) headers.push('Tên Học Sinh Đi Muộn Hoặc Vắng Học');
      if (columnSettings.rating) headers.push('Xếp Loại Tiết (Điểm)');
      if (columnSettings.note) headers.push('Ghi Chú');

      const rows: any[][] = [
        ['HỘ KINH DOANH PHAN NGUYÊN - SỔ GHI ĐẦU BÀI'],
        ['SỔ GHI ĐẦU BÀI & THEO DÕI TIẾT DẠY'],
        [`Giáo viên phụ trách: ${currentTeacher.name} - Mã GV: ${currentTeacher.code}`],
        [`Thời gian áp dụng: Từ ngày ${startDateFormatted} đến ngày ${endDateFormatted}`],
        [],
        headers,
      ];

      activeExportSessions.forEach((s, idx) => {
        const plan = getSessionPlan(s, idx);
        const rowData: any[] = [idx + 1, `${s.dayName} (${s.dateFormatted})`];
        if (columnSettings.timeSlot) rowData.push(`${s.startTime} - ${s.endTime}`);
        if (columnSettings.className) rowData.push(s.className);
        if (columnSettings.roomName) rowData.push(s.roomName);
        if (columnSettings.studentCount) rowData.push(plan.attendance);
        if (columnSettings.ppctPeriod) rowData.push(plan.ppctPeriod);
        if (columnSettings.lessonName) rowData.push(plan.lessonName);
        if (columnSettings.absentOrLate) rowData.push(plan.absentOrLate);
        if (columnSettings.rating) rowData.push(plan.rating);
        if (columnSettings.note) rowData.push(plan.note);
        rows.push(rowData);
      });

      rows.push([]);
      rows.push(['', '', '', '', '', `${centerLocation}, ngày ${startDateFormatted}`]);
      rows.push(['', '', '', '', '', 'GIÁO VIÊN GIẢNG DẠY']);
      rows.push(['', '', '', '', '', '(Ký và ghi rõ họ tên)']);
      rows.push([]);
      rows.push([]);
      rows.push(['', '', '', '', '', currentTeacher.name]);

      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, `SoGhiDauBai_${startDate}_${endDate}`);
      XLSX.writeFile(wb, `SoGhiDauBai_${startDate}_${endDate}_${currentTeacher.code}_${currentTeacher.name.replace(/\s+/g, '_')}.xlsx`);
    }
  };

  // -------------------------------------------------------------
  // EXPORT WORD (.doc) - RESPECTS DATE RANGE & CHECKED SESSIONS
  // -------------------------------------------------------------
  const handleExportWord = () => {
    if (!currentTeacher) return;
    if (activeExportSessions.length === 0) {
      alert('Vui lòng tích chọn ít nhất 1 buổi học trước khi xuất file Word!');
      return;
    }

    let docTitle = '';
    let tableHtml = '';

    if (activeTab === 'timetable') {
      docTitle = `THỜI KHÓA BIỂU GIẢNG DẠY CỦA GIÁO VIÊN (TỪ ${startDateFormatted} ĐẾN ${endDateFormatted})`;
      tableHtml = `
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse; width:100%; font-size:10.5pt; text-align:left;">
          <thead>
            <tr style="background-color:#f0f4f8; font-weight:bold; text-align:center;">
              <th style="width:35px;">STT</th>
              <th style="width:85px;">Thứ</th>
              <th style="width:95px;">Ngày</th>
              ${columnSettings.timeSlot ? '<th style="width:110px;">Khung Giờ</th>' : ''}
              ${columnSettings.className ? '<th>Tên Lớp Học</th>' : ''}
              ${columnSettings.subject ? '<th style="width:95px;">Môn</th>' : ''}
              ${columnSettings.roomName ? '<th style="width:85px;">Phòng</th>' : ''}
              ${columnSettings.studentCount ? '<th style="width:80px; text-align:center;">Sĩ Số</th>' : ''}
              ${columnSettings.note ? '<th style="width:120px;">Ghi Chú</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${activeExportSessions
              .map((s, idx) => {
                const plan = getSessionPlan(s, idx);
                return `
              <tr>
                <td style="text-align:center;">${idx + 1}</td>
                <td style="font-weight:bold;">${s.dayName}</td>
                <td style="text-align:center;">${s.dateFormatted}</td>
                ${columnSettings.timeSlot ? `<td style="text-align:center; font-family:monospace;">${s.startTime} - ${s.endTime}</td>` : ''}
                ${columnSettings.className ? `<td><b>${s.className}</b></td>` : ''}
                ${columnSettings.subject ? `<td>${s.subjectName}</td>` : ''}
                ${columnSettings.roomName ? `<td style="text-align:center;">${s.roomName}</td>` : ''}
                ${columnSettings.studentCount ? `<td style="text-align:center; font-weight:bold;">${plan.attendance}</td>` : ''}
                ${columnSettings.note ? `<td style="font-size:9pt; color:#444;">${plan.note}</td>` : ''}
              </tr>
            `;
              })
              .join('')}
          </tbody>
        </table>
      `;
    } else if (activeTab === 'teaching_plan') {
      docTitle = `LỊCH BÁO GIẢNG GIẢNG DẠY (TỪ ${startDateFormatted} ĐẾN ${endDateFormatted})`;
      tableHtml = `
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse; width:100%; font-size:10pt; text-align:left;">
          <thead>
            <tr style="background-color:#f0f4f8; font-weight:bold; text-align:center;">
              <th style="width:30px;">STT</th>
              <th style="width:105px;">Thứ / Ngày</th>
              ${columnSettings.timeSlot ? '<th style="width:95px;">Ca Học</th>' : ''}
              ${columnSettings.className ? '<th>Tên Lớp Học</th>' : ''}
              ${columnSettings.subject ? '<th style="width:90px;">Môn</th>' : ''}
              ${columnSettings.studentCount ? '<th style="width:70px;">Sĩ Số</th>' : ''}
              ${columnSettings.ppctPeriod ? '<th style="width:85px;">Tiết PPCT</th>' : ''}
              ${columnSettings.lessonName ? '<th>Tên Bài Dạy / Chủ Đề</th>' : ''}
              ${columnSettings.equipment ? '<th style="width:110px;">Đồ Dùng</th>' : ''}
              ${columnSettings.absentOrLate ? '<th style="width:170px;">Tên HS Đi Muộn / Vắng Học</th>' : ''}
              ${columnSettings.note ? '<th style="width:100px;">Ghi Chú</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${activeExportSessions
              .map((s, idx) => {
                const plan = getSessionPlan(s, idx);
                return `
                <tr>
                  <td style="text-align:center;">${idx + 1}</td>
                  <td style="font-weight:bold;">${s.dayName}<br/><span style="font-size:8.5pt; font-weight:normal; color:#555;">${s.dateFormatted}</span></td>
                  ${columnSettings.timeSlot ? `<td style="text-align:center;">${s.startTime} - ${s.endTime}</td>` : ''}
                  ${columnSettings.className ? `<td><b>${s.className}</b></td>` : ''}
                  ${columnSettings.subject ? `<td>${s.subjectName}</td>` : ''}
                  ${columnSettings.studentCount ? `<td style="text-align:center; font-weight:bold;">${plan.attendance}</td>` : ''}
                  ${columnSettings.ppctPeriod ? `<td style="text-align:center; font-weight:bold; color:#1e40af;">${plan.ppctPeriod}</td>` : ''}
                  ${columnSettings.lessonName ? `<td><b>${plan.lessonName}</b></td>` : ''}
                  ${columnSettings.equipment ? `<td>${plan.equipment}</td>` : ''}
                  ${columnSettings.absentOrLate ? `<td style="font-size:9pt; color:#c2410c;">${plan.absentOrLate}</td>` : ''}
                  ${columnSettings.note ? `<td style="font-size:8.5pt; color:#444;">${plan.note}</td>` : ''}
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>
      `;
    } else {
      docTitle = `SỔ GHI ĐẦU BÀI & THEO DÕI NỀ NẾP LỚP HỌC (TỪ ${startDateFormatted} ĐẾN ${endDateFormatted})`;
      tableHtml = `
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse; width:100%; font-size:10pt; text-align:left;">
          <thead>
            <tr style="background-color:#f0f4f8; font-weight:bold; text-align:center;">
              <th style="width:30px;">STT</th>
              <th style="width:95px;">Thứ / Ngày</th>
              ${columnSettings.timeSlot ? '<th style="width:90px;">Khung Giờ</th>' : ''}
              ${columnSettings.className ? '<th>Lớp Học</th>' : ''}
              ${columnSettings.roomName ? '<th style="width:80px;">Phòng</th>' : ''}
              ${columnSettings.studentCount ? '<th style="width:70px;">Sĩ Số</th>' : ''}
              ${columnSettings.ppctPeriod ? '<th style="width:80px;">Tiết PPCT</th>' : ''}
              ${columnSettings.lessonName ? '<th>Tên Bài Dạy / Nội Dung Giảng Dạy</th>' : ''}
              ${columnSettings.absentOrLate ? '<th style="width:180px;">Tên Học Sinh Đi Muộn Hoặc Vắng Học</th>' : ''}
              ${columnSettings.rating ? '<th style="width:75px; text-align:center;">Xếp Loại</th>' : ''}
              ${columnSettings.note ? '<th style="width:110px;">Ghi Chú</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${activeExportSessions
              .map((s, idx) => {
                const plan = getSessionPlan(s, idx);
                return `
                <tr>
                  <td style="text-align:center;">${idx + 1}</td>
                  <td><b>${s.dayName}</b><br/><span style="font-size:8.5pt; color:#666;">${s.dateFormatted}</span></td>
                  ${columnSettings.timeSlot ? `<td style="text-align:center; font-size:9pt;">${s.startTime}-${s.endTime}</td>` : ''}
                  ${columnSettings.className ? `<td><b>${s.className}</b></td>` : ''}
                  ${columnSettings.roomName ? `<td style="text-align:center;">${s.roomName}</td>` : ''}
                  ${columnSettings.studentCount ? `<td style="text-align:center; font-weight:bold;">${plan.attendance}</td>` : ''}
                  ${columnSettings.ppctPeriod ? `<td style="text-align:center; font-weight:bold;">${plan.ppctPeriod}</td>` : ''}
                  ${columnSettings.lessonName ? `<td><b>${plan.lessonName}</b></td>` : ''}
                  ${columnSettings.absentOrLate ? `<td style="font-size:9pt; color:#b91c1c;">${plan.absentOrLate}</td>` : ''}
                  ${columnSettings.rating ? `<td style="text-align:center; font-weight:bold; color:#065f46;">${plan.rating}</td>` : ''}
                  ${columnSettings.note ? `<td style="font-size:9pt; color:#333;">${plan.note}</td>` : ''}
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>
      `;
    }

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${docTitle}</title>
        <style>
          @page { size: 29.7cm 21cm; margin: 1.5cm; mso-page-orientation: landscape; }
          body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #111; line-height: 1.4; }
          .header-table { width: 100%; border: none; margin-bottom: 15px; }
          .header-table td { border: none; font-size: 10.5pt; }
          .title { font-size: 15pt; font-weight: bold; text-align: center; text-transform: uppercase; margin: 10px 0 4px 0; color: #1e3a8a; }
          .subtitle { font-size: 11pt; text-align: center; font-style: italic; margin-bottom: 15px; }
          .signature-table { width: 100%; border: none; margin-top: 30px; }
          .signature-table td { border: none; text-align: right; font-size: 11pt; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="text-align: left; width: 50%;">
              <b>HỘ KINH DOANH PHAN NGUYÊN</b><br/>
              <b>LUYỆN THI & BỒI DƯỠNG VĂN HÓA CHẤT LƯỢNG CAO</b><br/>
              <i>Mã đơn vị: HKD-PHANNGUYEN</i>
            </td>
            <td style="text-align: right; width: 50%;">
              <b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br/>
              <b>Độc lập - Tự do - Hạnh phúc</b><br/>
              <i>${centerLocation}, ngày ${startDateFormatted}</i>
            </td>
          </tr>
        </table>

        <div class="title">${docTitle}</div>
        <div class="subtitle">
          Giáo viên: <b>${currentTeacher.name}</b> (Mã GV: <b>${currentTeacher.code}</b>) · Khoảng thời gian: <b>Từ ${startDateFormatted} đến ${endDateFormatted}</b>
        </div>

        ${tableHtml}

        <table class="signature-table">
          <tr>
            <td style="width: 50%; text-align: left; font-size: 10pt; color: #555;">
              <i>* Ghi chú chung: Toàn bộ danh sách học sinh và phân phối chương trình đã được đối soát chính xác theo khoảng thời gian trên.</i>
            </td>
            <td style="width: 50%; text-align: center;">
              <i>${centerLocation}, ngày ${startDateFormatted}</i><br/>
              <b>GIÁO VIÊN THỰC HIỆN</b><br/>
              <i>(Ký và ghi rõ họ tên)</i><br/><br/><br/><br/><br/>
              <b>${currentTeacher.name}</b>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filePrefix =
      activeTab === 'timetable'
        ? 'TKB'
        : activeTab === 'teaching_plan'
        ? 'LichBaoGiang'
        : 'SoGhiDauBai';
    link.download = `${filePrefix}_${startDate}_${endDate}_${currentTeacher.code}_${currentTeacher.name.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // -------------------------------------------------------------
  // PRINT / EXPORT PDF (Direct Browser Print to PDF)
  // -------------------------------------------------------------
  const handleExportPDF = () => {
    if (activeExportSessions.length === 0) {
      alert('Vui lòng tích chọn ít nhất 1 buổi học trước khi xuất file PDF!');
      return;
    }
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full border border-slate-200 overflow-hidden my-4 max-h-[96vh] flex flex-col">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-2xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Xuất Hồ Sơ Giảng Dạy & Thời Khóa Biểu Của Giáo Viên
              </h3>
              <p className="text-xs text-slate-500">
                Lọc thời khóa biểu theo khoảng thời gian (Từ ngày - Đến ngày), tùy chọn trường cột và xuất tệp PDF, Word, Excel.
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

        {/* Tab Selection & Top Export Actions */}
        <div className="px-6 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('timetable')}
              className={`pb-2.5 px-3 border-b-2 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'timetable'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>1. Thời Khóa Biểu Tuần</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('teaching_plan')}
              className={`pb-2.5 px-3 border-b-2 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'teaching_plan'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>2. Lịch Báo Giảng Tuần</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('class_journal')}
              className={`pb-2.5 px-3 border-b-2 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'class_journal'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>3. Sổ Ghi Đầu Bài Tuần</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pb-2">
            {/* Direct PDF Export Button */}
            <button
              type="button"
              onClick={handleExportPDF}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Xuất trực tiếp file PDF (hoặc In)"
            >
              <FileDown className="w-4 h-4" />
              <span>Xuất File PDF ({selectedCount})</span>
            </button>
            <button
              type="button"
              onClick={handleExportWord}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Tải tệp văn bản Microsoft Word (.doc)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Xuất Word ({selectedCount})</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Tải tệp bảng tính Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Xuất Excel ({selectedCount})</span>
            </button>
          </div>
        </div>

        {/* Filter Controls: Teacher, Date Range (Từ ngày - Đến ngày), Tuần, Class Filter */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Chọn Giáo Viên:</label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 outline-none focus:border-blue-500"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Chọn Theo Tuần Học:</label>
            <select
              value={selectedWeek}
              onChange={(e) => handleWeekChange(Number(e.target.value))}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 outline-none focus:border-blue-500"
            >
              {Array.from({ length: 52 }, (_, i) => i + 1).map((w) => {
                const dates = getAcademicWeekDates(w, effectiveOpeningDate);
                return (
                  <option key={w} value={w}>
                    Tuần {w} {w === 1 ? '(Khai giảng: ' : '('}{dates.startDateFormatted} - {dates.endDateFormatted}{dates.semester ? ` · ${dates.semester}` : ''})
                  </option>
                );
              })}
            </select>
          </div>

          {/* BỘ LỌC KHOẢNG THỜI GIAN: TỪ NGÀY */}
          <div>
            <label className="block text-blue-900 font-bold mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Từ Ngày:</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg font-bold text-blue-900 outline-none focus:border-blue-500"
            />
          </div>

          {/* BỘ LỌC KHOẢNG THỜI GIAN: ĐẾN NGÀY */}
          <div>
            <label className="block text-blue-900 font-bold mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Đến Ngày:</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg font-bold text-blue-900 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Lọc Theo Lớp Dạy:</label>
            <select
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 outline-none focus:border-blue-500"
            >
              <option value="all">Tất cả các lớp ({teacherClasses.length} lớp)</option>
              {teacherClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CÀI ĐẶT ĐỊNH DẠNG XUẤT (CHECKBOXES TÙY CHỌN CÁC TRƯỜNG DỮ LIỆU) */}
        <div className="px-6 py-2.5 bg-indigo-50/70 border-b border-indigo-100 text-xs">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2 font-bold text-indigo-900">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              <span>Cài Đặt Định Dạng Xuất (Tùy Chọn Cột Dữ Liệu Xuất PDF / In / Word / Excel):</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleResetAllColumns(true)}
                className="text-[11px] text-indigo-700 hover:text-indigo-900 font-semibold underline cursor-pointer"
              >
                Chọn tất cả cột
              </button>
              <span className="text-indigo-300">|</span>
              <button
                type="button"
                onClick={() => handleResetAllColumns(false)}
                className="text-[11px] text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
              >
                Bỏ chọn hết
              </button>
            </div>
          </div>

          {/* Checkbox Group of Export Fields */}
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 pt-1 text-slate-800 font-medium">
            {/* 1. Tên lớp */}
            <label className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              columnSettings.className ? 'bg-white border-indigo-300 text-indigo-950 font-bold shadow-2xs' : 'bg-slate-100/70 border-slate-200 text-slate-500'
            }`}>
              <input
                type="checkbox"
                checked={columnSettings.className}
                onChange={() => toggleColumn('className')}
                className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
              />
              <span>Tên lớp</span>
            </label>

            {/* 2. Phòng học */}
            <label className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              columnSettings.roomName ? 'bg-white border-indigo-300 text-indigo-950 font-bold shadow-2xs' : 'bg-slate-100/70 border-slate-200 text-slate-500'
            }`}>
              <input
                type="checkbox"
                checked={columnSettings.roomName}
                onChange={() => toggleColumn('roomName')}
                className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
              />
              <span>Phòng học</span>
            </label>

            {/* 3. Thời gian */}
            <label className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              columnSettings.timeSlot ? 'bg-white border-indigo-300 text-indigo-950 font-bold shadow-2xs' : 'bg-slate-100/70 border-slate-200 text-slate-500'
            }`}>
              <input
                type="checkbox"
                checked={columnSettings.timeSlot}
                onChange={() => toggleColumn('timeSlot')}
                className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
              />
              <span>Thời gian (Khung giờ)</span>
            </label>

            {/* 4. Tên học sinh đi muộn hoặc vắng học */}
            <label className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              columnSettings.absentOrLate ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold shadow-2xs' : 'bg-slate-100/70 border-slate-200 text-slate-500'
            }`}>
              <input
                type="checkbox"
                checked={columnSettings.absentOrLate}
                onChange={() => toggleColumn('absentOrLate')}
                className="rounded text-rose-600 focus:ring-0 cursor-pointer"
              />
              <UserX className="w-3.5 h-3.5 text-rose-600" />
              <span>Tên HS đi muộn / vắng học</span>
            </label>

            {/* 5. Ghi chú */}
            <label className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              columnSettings.note ? 'bg-white border-indigo-300 text-indigo-950 font-bold shadow-2xs' : 'bg-slate-100/70 border-slate-200 text-slate-500'
            }`}>
              <input
                type="checkbox"
                checked={columnSettings.note}
                onChange={() => toggleColumn('note')}
                className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
              />
              <span>Ghi chú</span>
            </label>

            {/* 6. Sĩ số */}
            <label className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              columnSettings.studentCount ? 'bg-white border-indigo-300 text-indigo-950 font-bold shadow-2xs' : 'bg-slate-100/70 border-slate-200 text-slate-500'
            }`}>
              <input
                type="checkbox"
                checked={columnSettings.studentCount}
                onChange={() => toggleColumn('studentCount')}
                className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
              />
              <span>Sĩ số</span>
            </label>

            {/* 7. Môn học */}
            <label className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              columnSettings.subject ? 'bg-white border-indigo-300 text-indigo-950 font-bold shadow-2xs' : 'bg-slate-100/70 border-slate-200 text-slate-500'
            }`}>
              <input
                type="checkbox"
                checked={columnSettings.subject}
                onChange={() => toggleColumn('subject')}
                className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
              />
              <span>Môn học</span>
            </label>

            {/* 8. Tiết PPCT */}
            <label className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              columnSettings.ppctPeriod ? 'bg-white border-indigo-300 text-indigo-950 font-bold shadow-2xs' : 'bg-slate-100/70 border-slate-200 text-slate-500'
            }`}>
              <input
                type="checkbox"
                checked={columnSettings.ppctPeriod}
                onChange={() => toggleColumn('ppctPeriod')}
                className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
              />
              <span>Tiết PPCT</span>
            </label>

            {/* 9. Tên bài dạy */}
            <label className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              columnSettings.lessonName ? 'bg-white border-indigo-300 text-indigo-950 font-bold shadow-2xs' : 'bg-slate-100/70 border-slate-200 text-slate-500'
            }`}>
              <input
                type="checkbox"
                checked={columnSettings.lessonName}
                onChange={() => toggleColumn('lessonName')}
                className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
              />
              <span>Tên bài dạy</span>
            </label>

            {/* 10. Xếp loại (cho Sổ ghi đầu bài) */}
            {activeTab === 'class_journal' && (
              <label className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                columnSettings.rating ? 'bg-white border-indigo-300 text-indigo-950 font-bold shadow-2xs' : 'bg-slate-100/70 border-slate-200 text-slate-500'
              }`}>
                <input
                  type="checkbox"
                  checked={columnSettings.rating}
                  onChange={() => toggleColumn('rating')}
                  className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <span>Xếp loại</span>
              </label>
            )}
          </div>
        </div>

        {/* Checkbox Toolbar: Chọn buổi & Thông báo */}
        <div className="px-6 py-2 bg-blue-50/60 border-b border-blue-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleToggleSelectAll(!isAllSelected)}
              className="flex items-center gap-1.5 font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
            >
              {isAllSelected ? (
                <CheckSquare className="w-4 h-4 text-blue-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>{isAllSelected ? 'Bỏ chọn tất cả buổi' : 'Tích chọn tất cả buổi'}</span>
            </button>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600">
              Đang hiển thị & xuất: <strong className="text-blue-700 font-bold">{selectedCount}</strong> / {candidateSessions.length} buổi học trong khoảng từ <strong className="text-slate-900">{startDateFormatted}</strong> đến <strong className="text-slate-900">{endDateFormatted}</strong>
            </span>
          </div>

          <div className="text-[11px] text-slate-500 hidden sm:block">
            * Thay đổi ngày ở ô <strong>"Từ Ngày"</strong> và <strong>"Đến Ngày"</strong> để tùy biến khoảng thời gian xuất bất kỳ.
          </div>
        </div>

        {/* Live Document Preview Area */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4 text-xs bg-slate-100/50 print:p-0 print:bg-white">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
            {/* School Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                  TRUNG TÂM BỒI DƯỠNG VĂN HÓA & LUYỆN THI CHẤT LƯỢNG CAO
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Tổ chuyên môn & Khảo thí đào tạo · Hotline: 0912.345.678
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900 text-xs">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </div>
                <div className="text-[11px] text-slate-500 italic">Độc lập - Tự do - Hạnh phúc</div>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center my-4 space-y-1">
              <h2 className="text-lg font-bold text-blue-900 uppercase tracking-tight">
                {activeTab === 'timetable' && `THỜI KHÓA BIỂU GIẢNG DẠY CỦA GIÁO VIÊN`}
                {activeTab === 'teaching_plan' && `LỊCH BÁO GIẢNG GIẢNG DẠY`}
                {activeTab === 'class_journal' && `SỔ GHI ĐẦU BÀI & THEO DÕI NỀ NẾP LỚP HỌC`}
              </h2>
              <p className="text-xs text-slate-600">
                Giáo viên: <strong className="text-slate-900">{currentTeacher?.name}</strong> · Mã số: <strong className="font-mono text-blue-700">{currentTeacher?.code}</strong> · SĐT: {currentTeacher?.phone}
              </p>
              <p className="text-[11px] text-slate-600 font-semibold italic">
                (Khoảng thời gian: Từ ngày {startDateFormatted} đến ngày {endDateFormatted})
              </p>
            </div>

            {/* Table Preview */}
            {activeExportSessions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Không tìm thấy ca học nào trong khoảng thời gian từ <strong>{startDateFormatted}</strong> đến <strong>{endDateFormatted}</strong> hoặc chưa tích chọn buổi học nào.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                {activeTab === 'timetable' && (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2.5 text-center w-12">STT</th>
                        <th className="px-3 py-2.5 w-24">Thứ</th>
                        <th className="px-3 py-2.5 w-28">Ngày Dạy</th>
                        {columnSettings.timeSlot && <th className="px-3 py-2.5 w-32">Khung Giờ (Thời gian)</th>}
                        {columnSettings.className && <th className="px-3 py-2.5">Tên Lớp Học</th>}
                        {columnSettings.subject && <th className="px-3 py-2.5 w-32">Môn Học</th>}
                        {columnSettings.roomName && <th className="px-3 py-2.5 w-28">Phòng Học</th>}
                        {columnSettings.studentCount && <th className="px-3 py-2.5 text-center w-28">Sĩ Số</th>}
                        {columnSettings.note && <th className="px-3 py-2.5 w-36">Ghi Chú</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {activeExportSessions.map((s, idx) => {
                        const plan = getSessionPlan(s, idx);
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-3 py-2 text-center font-mono text-slate-500">{idx + 1}</td>
                            <td className="px-3 py-2 font-bold text-blue-800">{s.dayName}</td>
                            <td className="px-3 py-2 font-mono text-slate-600">{s.dateFormatted}</td>
                            {columnSettings.timeSlot && (
                              <td className="px-3 py-2 font-mono font-medium text-slate-700">{s.startTime} - {s.endTime}</td>
                            )}
                            {columnSettings.className && <td className="px-3 py-2 font-semibold text-slate-900">{s.className}</td>}
                            {columnSettings.subject && <td className="px-3 py-2 font-medium">{s.subjectName}</td>}
                            {columnSettings.roomName && <td className="px-3 py-2 text-slate-700 font-medium">{s.roomName}</td>}
                            {columnSettings.studentCount && (
                              <td className="px-3 py-2 text-center">
                                <input
                                  type="text"
                                  value={plan.attendance}
                                  onChange={(e) => updateSessionPlan(s.id, 'attendance', e.target.value)}
                                  className="w-20 px-1.5 py-0.5 border border-slate-200 rounded text-center font-bold text-xs bg-white outline-none focus:border-blue-500 print:border-none print:bg-transparent"
                                  placeholder="Sĩ số"
                                />
                              </td>
                            )}
                            {columnSettings.note && (
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={plan.note}
                                  onChange={(e) => updateSessionPlan(s.id, 'note', e.target.value)}
                                  className="w-full px-1.5 py-0.5 border border-slate-200 rounded text-[11px] bg-slate-50 focus:bg-white outline-none print:border-none print:bg-transparent"
                                  placeholder=""
                                />
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {activeTab === 'teaching_plan' && (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-2.5 py-2.5 text-center w-10">STT</th>
                        <th className="px-2.5 py-2.5 w-28">Thứ / Ngày</th>
                        {columnSettings.timeSlot && <th className="px-2.5 py-2.5 w-28">Ca Dạy (Thời gian)</th>}
                        {columnSettings.className && <th className="px-2.5 py-2.5 w-40">Tên Lớp</th>}
                        {columnSettings.subject && <th className="px-2.5 py-2.5 w-28">Môn Học</th>}
                        {columnSettings.studentCount && <th className="px-2.5 py-2.5 w-20">Sĩ Số</th>}
                        {columnSettings.ppctPeriod && <th className="px-2.5 py-2.5 w-28">Tiết PPCT</th>}
                        {columnSettings.lessonName && <th className="px-2.5 py-2.5 min-w-[200px]">Tên Bài Học / Chủ Đề</th>}
                        {columnSettings.equipment && <th className="px-2.5 py-2.5 w-28">Đồ Dùng</th>}
                        {columnSettings.absentOrLate && (
                          <th className="px-2.5 py-2.5 min-w-[190px] text-rose-900 bg-rose-50/50">
                            Tên Học Sinh Đi Muộn / Vắng Học
                          </th>
                        )}
                        {columnSettings.note && <th className="px-2.5 py-2.5 w-32">Ghi Chú</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {activeExportSessions.map((s, idx) => {
                        const plan = getSessionPlan(s, idx);
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-2.5 py-2 text-center font-mono text-slate-500">{idx + 1}</td>
                            <td className="px-2.5 py-2">
                              <div className="font-bold text-blue-800">{s.dayName}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{s.dateFormatted}</div>
                            </td>
                            {columnSettings.timeSlot && (
                              <td className="px-2.5 py-2 font-mono text-slate-700">{s.startTime} - {s.endTime}</td>
                            )}
                            {columnSettings.className && (
                              <td className="px-2.5 py-2">
                                <div className="font-bold text-slate-900 text-[11.5px] truncate max-w-[160px]">{s.className}</div>
                              </td>
                            )}
                            {columnSettings.subject && (
                              <td className="px-2.5 py-2 text-slate-700 font-medium">{s.subjectName}</td>
                            )}
                            {columnSettings.studentCount && (
                              <td className="px-2.5 py-2">
                                <input
                                  type="text"
                                  value={plan.attendance}
                                  onChange={(e) => updateSessionPlan(s.id, 'attendance', e.target.value)}
                                  className="w-16 px-1.5 py-0.5 border border-slate-200 rounded font-semibold text-center text-xs bg-slate-50 focus:bg-white outline-none print:border-none print:bg-transparent"
                                />
                              </td>
                            )}
                            {columnSettings.ppctPeriod && (
                              <td className="px-2.5 py-2">
                                <input
                                  type="text"
                                  value={plan.ppctPeriod}
                                  onChange={(e) => updateSessionPlan(s.id, 'ppctPeriod', e.target.value)}
                                  className="w-full px-1.5 py-0.5 border border-slate-200 rounded font-bold text-blue-700 text-xs bg-slate-50 focus:bg-white outline-none print:border-none print:bg-transparent"
                                  placeholder="Tiết 1-2"
                                />
                              </td>
                            )}
                            {columnSettings.lessonName && (
                              <td className="px-2.5 py-2">
                                <input
                                  type="text"
                                  value={plan.lessonName}
                                  onChange={(e) => updateSessionPlan(s.id, 'lessonName', e.target.value)}
                                  className="w-full px-2 py-0.5 border border-slate-200 rounded font-semibold text-xs text-blue-900 bg-slate-50 focus:bg-white outline-none print:border-none print:bg-transparent"
                                  placeholder="Nhập tên bài học theo PPCT..."
                                />
                              </td>
                            )}
                            {columnSettings.equipment && (
                              <td className="px-2.5 py-2">
                                <input
                                  type="text"
                                  value={plan.equipment}
                                  onChange={(e) => updateSessionPlan(s.id, 'equipment', e.target.value)}
                                  className="w-full px-1.5 py-0.5 border border-slate-200 rounded text-[11px] bg-slate-50 focus:bg-white outline-none print:border-none print:bg-transparent"
                                />
                              </td>
                            )}
                            {columnSettings.absentOrLate && (
                              <td className="px-2.5 py-2">
                                <input
                                  type="text"
                                  value={plan.absentOrLate}
                                  onChange={(e) => updateSessionPlan(s.id, 'absentOrLate', e.target.value)}
                                  className="w-full px-2 py-0.5 border border-rose-200 bg-rose-50/40 text-rose-900 rounded font-medium text-xs focus:bg-white outline-none print:border-none print:bg-transparent"
                                  placeholder="Tên học sinh đi muộn hoặc vắng..."
                                />
                              </td>
                            )}
                            {columnSettings.note && (
                              <td className="px-2.5 py-2">
                                <input
                                  type="text"
                                  value={plan.note}
                                  onChange={(e) => updateSessionPlan(s.id, 'note', e.target.value)}
                                  className="w-full px-1.5 py-0.5 border border-slate-200 rounded text-[11px] bg-slate-50 focus:bg-white outline-none print:border-none print:bg-transparent"
                                  placeholder=""
                                />
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {activeTab === 'class_journal' && (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-2.5 py-2.5 text-center w-10">STT</th>
                        <th className="px-2.5 py-2.5 w-24">Thứ / Ngày</th>
                        {columnSettings.timeSlot && <th className="px-2.5 py-2.5 w-24">Ca Học</th>}
                        {columnSettings.className && <th className="px-2.5 py-2.5 w-36">Tên Lớp</th>}
                        {columnSettings.roomName && <th className="px-2.5 py-2.5 w-20">Phòng</th>}
                        {columnSettings.studentCount && <th className="px-2.5 py-2.5 w-20">Sĩ Số</th>}
                        {columnSettings.ppctPeriod && <th className="px-2.5 py-2.5 w-24">Tiết PPCT</th>}
                        {columnSettings.lessonName && <th className="px-2.5 py-2.5 min-w-[190px]">Tên Bài Dạy / Nội Dung Giảng Dạy</th>}
                        {columnSettings.absentOrLate && (
                          <th className="px-2.5 py-2.5 min-w-[210px] text-rose-900 bg-rose-50/50">
                            Tên Học Sinh Đi Muộn Hoặc Vắng Học
                          </th>
                        )}
                        {columnSettings.rating && <th className="px-2.5 py-2.5 w-24">Xếp Loại</th>}
                        {columnSettings.note && <th className="px-2.5 py-2.5 w-32">Ghi Chú</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {activeExportSessions.map((s, idx) => {
                        const plan = getSessionPlan(s, idx);
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-2.5 py-2 text-center font-mono text-slate-500">{idx + 1}</td>
                            <td className="px-2.5 py-2">
                              <div className="font-bold text-slate-900">{s.dayName}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{s.dateFormatted}</div>
                            </td>
                            {columnSettings.timeSlot && (
                              <td className="px-2.5 py-2 font-mono text-slate-700">{s.startTime} - {s.endTime}</td>
                            )}
                            {columnSettings.className && (
                              <td className="px-2.5 py-2">
                                <div className="text-[11.5px] text-slate-900 truncate max-w-[140px] font-bold">{s.className}</div>
                              </td>
                            )}
                            {columnSettings.roomName && (
                              <td className="px-2.5 py-2 text-slate-700">{s.roomName}</td>
                            )}
                            {columnSettings.studentCount && (
                              <td className="px-2.5 py-2">
                                <input
                                  type="text"
                                  value={plan.attendance}
                                  onChange={(e) => updateSessionPlan(s.id, 'attendance', e.target.value)}
                                  className="w-full px-1.5 py-0.5 border border-slate-200 rounded font-semibold text-center text-xs bg-slate-50 focus:bg-white outline-none print:border-none print:bg-transparent"
                                />
                              </td>
                            )}
                            {columnSettings.ppctPeriod && (
                              <td className="px-2.5 py-2">
                                <input
                                  type="text"
                                  value={plan.ppctPeriod}
                                  onChange={(e) => updateSessionPlan(s.id, 'ppctPeriod', e.target.value)}
                                  className="w-full px-1.5 py-0.5 border border-slate-200 rounded font-bold text-center text-blue-700 text-xs bg-slate-50 focus:bg-white outline-none print:border-none print:bg-transparent"
                                />
                              </td>
                            )}
                            {columnSettings.lessonName && (
                              <td className="px-2.5 py-2">
                                <input
                                  type="text"
                                  value={plan.lessonName}
                                  onChange={(e) => updateSessionPlan(s.id, 'lessonName', e.target.value)}
                                  className="w-full px-2 py-0.5 border border-slate-200 rounded font-medium text-xs bg-slate-50 focus:bg-white outline-none print:border-none print:bg-transparent"
                                />
                              </td>
                            )}
                            {columnSettings.absentOrLate && (
                              <td className="px-2.5 py-2">
                                <input
                                  type="text"
                                  value={plan.absentOrLate}
                                  onChange={(e) => updateSessionPlan(s.id, 'absentOrLate', e.target.value)}
                                  className="w-full px-2 py-0.5 border border-rose-200 bg-rose-50/40 text-rose-900 rounded font-medium text-xs focus:bg-white outline-none print:border-none print:bg-transparent"
                                  placeholder="Tên học sinh đi muộn hoặc vắng..."
                                />
                              </td>
                            )}
                            {columnSettings.rating && (
                              <td className="px-2.5 py-2">
                                <input
                                  type="text"
                                  value={plan.rating}
                                  onChange={(e) => updateSessionPlan(s.id, 'rating', e.target.value)}
                                  className="w-full px-1.5 py-0.5 border border-emerald-300 rounded font-bold text-center text-emerald-800 bg-emerald-50/50 focus:bg-white outline-none text-xs print:border-none print:bg-transparent"
                                  placeholder="8/10, Tốt..."
                                />
                              </td>
                            )}
                            {columnSettings.note && (
                              <td className="px-2.5 py-2">
                                <input
                                  type="text"
                                  value={plan.note}
                                  onChange={(e) => updateSessionPlan(s.id, 'note', e.target.value)}
                                  className="w-full px-1.5 py-0.5 border border-slate-200 rounded text-[11px] bg-slate-50 focus:bg-white outline-none print:border-none print:bg-transparent"
                                  placeholder=""
                                />
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Document Footer: ONLY TEACHER SIGNATURE & GENERAL NOTE */}
            {activeExportSessions.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 text-xs">
                <div className="text-slate-500 italic text-[11px] max-w-md">
                  * Ghi chú: Danh sách học sinh đi muộn/vắng học và số tiết phân phối chương trình đã được đối soát khớp với thời khóa biểu giảng dạy thực tế trong khoảng thời gian trên.
                </div>
                <div className="text-center w-64 space-y-1 self-end">
                  <div className="italic text-slate-500">{centerLocation}, ngày {startDateFormatted}</div>
                  <div className="font-bold text-slate-900 uppercase">GIÁO VIÊN THỰC HIỆN</div>
                  <div className="text-[11px] text-slate-500 italic">(Ký và ghi rõ họ tên)</div>
                  <div className="h-16 flex items-end justify-center font-bold text-slate-900 text-sm">
                    {currentTeacher?.name}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-600 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              Đã chọn: <strong className="text-slate-900 font-bold">{selectedCount}</strong> / {candidateSessions.length} ca dạy ({startDateFormatted} - {endDateFormatted}) của giáo viên {currentTeacher?.name}.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Xuất file PDF hoặc In"
            >
              <FileDown className="w-4 h-4" />
              <span>Xuất File PDF ({selectedCount})</span>
            </button>
            <button
              type="button"
              onClick={handleExportWord}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Tải Word ({selectedCount})</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Tải Excel ({selectedCount})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
