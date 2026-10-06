import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Subject, GradeLevel, CurriculumLesson, ClassRoom } from '../../types/index.ts';
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowRight,
  Filter,
  Check,
  RefreshCw,
  Info,
} from 'lucide-react';

interface AutoScheduleCurriculumModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject;
  gradeLevel: GradeLevel;
  existingLessons: CurriculumLesson[];
}

export const AutoScheduleCurriculumModal: React.FC<AutoScheduleCurriculumModalProps> = ({
  isOpen,
  onClose,
  subject,
  gradeLevel,
  existingLessons,
}) => {
  const { classes, replaceCurriculumLessons } = useApp();

  // Mode: theo lớp cụ thể hoặc tự thiết lập chung
  const [configMode, setConfigMode] = useState<'by_class' | 'custom'>('custom');
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Weekly parameters
  const [sessionsPerWeek, setSessionsPerWeek] = useState<number>(2); // 2 buổi / tuần
  const [periodsPerSession, setPeriodsPerSession] = useState<number>(2); // 2 tiết / buổi
  // Total periods/week = sessionsPerWeek * periodsPerSession

  // Real-time semester calendar parameters
  const [startDateSemester1, setStartDateSemester1] = useState<string>('2026-09-07');
  const [semester1Weeks, setSemester1Weeks] = useState<number>(18);
  const [startDateSemester2, setStartDateSemester2] = useState<string>('2027-01-18');
  const [semester2Weeks, setSemester2Weeks] = useState<number>(17);
  const [startWeekNumber, setStartWeekNumber] = useState<number>(1);

  // Splitting mode: true = tách bài nhiều tiết thành các buổi cụ thể (ví dụ 6 tiết = 3 buổi)
  const [splitIntoSessions, setSplitIntoSessions] = useState<boolean>(true);

  // Success notification
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);

  // Filter classes matching this subject and gradeLevel
  const matchingClasses = useMemo(() => {
    return classes.filter(
      (c) => c.subjectId === subject.id && c.gradeLevel === gradeLevel
    );
  }, [classes, subject.id, gradeLevel]);

  // Handle selecting a specific class
  const handleSelectClass = (clsId: string) => {
    setSelectedClassId(clsId);
    if (!clsId) return;
    const cls = classes.find((c) => c.id === clsId);
    if (!cls) return;

    // Detect sessions per week from weeklySchedules or daysOfWeek
    let sessionsCount = 2;
    if (cls.weeklySchedules && cls.weeklySchedules.length > 0) {
      sessionsCount = cls.weeklySchedules.length;
    } else if (cls.daysOfWeek && cls.daysOfWeek.length > 0) {
      sessionsCount = cls.daysOfWeek.length;
    }
    setSessionsPerWeek(Math.max(1, sessionsCount));
    setPeriodsPerSession(2);
  };

  // Helper to format date
  const formatDateVN = (d: Date) => {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  // Compute date range for a given week index (1-indexed)
  const getWeekDateRange = (weekNum: number) => {
    if (weekNum <= semester1Weeks) {
      // Semester 1
      const start = new Date(startDateSemester1);
      const weekStart = new Date(start.getTime() + (weekNum - 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      return {
        semester: 'HK1',
        startFormatted: formatDateVN(weekStart),
        endFormatted: formatDateVN(weekEnd),
      };
    } else {
      // Semester 2
      const sem2WeekOffset = weekNum - semester1Weeks;
      const start = new Date(startDateSemester2);
      const weekStart = new Date(start.getTime() + (sem2WeekOffset - 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      return {
        semester: 'HK2',
        startFormatted: formatDateVN(weekStart),
        endFormatted: formatDateVN(weekEnd),
      };
    }
  };

  // -------------------------------------------------------------
  // CALCULATION ENGINE: Phân chia tự động theo tuần và học kỳ
  // -------------------------------------------------------------
  const scheduledResult = useMemo(() => {
    if (!existingLessons || existingLessons.length === 0) {
      return {
        lessons: [],
        totalPeriods: 0,
        totalSessions: 0,
        totalWeeks: 0,
        hk1LessonsCount: 0,
        hk2LessonsCount: 0,
      };
    }

    const sortedOriginal = [...existingLessons].sort((a, b) => a.stt - b.stt);
    const newLessons: CurriculumLesson[] = [];

    let globalPeriodCounter = 0; // Đếm số tiết tích lũy toàn năm (1, 2, 3...)
    let currentSessionIndex = 0; // Đếm số buổi học tích lũy (0, 1, 2...)
    let currentStt = 1;

    if (splitIntoSessions) {
      // -------------------------------------------------------------
      // CHẾ ĐỘ 1: TỰ ĐỘNG CHÈN & TÁCH BÀI NHIỀU TIẾT THÀNH CÁC BUỔI
      // Ví dụ bài 6 tiết (mỗi buổi 2 tiết) -> Tách thành 3 buổi:
      // Buổi 1: Tiết 1-2
      // Buổi 2: Tiết 3-4
      // Buổi 3: Tiết 5-6
      // -------------------------------------------------------------
      sortedOriginal.forEach((original) => {
        const rawPeriods = Number(original.periods) || 2;
        // Số buổi cần cho bài học này
        const sessionCountForThisLesson = Math.max(1, Math.ceil(rawPeriods / periodsPerSession));

        let remainingPeriods = rawPeriods;
        let lessonPeriodOffset = 0;

        for (let s = 0; s < sessionCountForThisLesson; s++) {
          const periodsInThisSession = Math.min(periodsPerSession, remainingPeriods);
          remainingPeriods -= periodsInThisSession;

          const startPeriodInLesson = lessonPeriodOffset + 1;
          const endPeriodInLesson = lessonPeriodOffset + periodsInThisSession;
          lessonPeriodOffset += periodsInThisSession;

          // Tiết tích lũy toàn khóa
          const globalStartPeriod = globalPeriodCounter + 1;
          const globalEndPeriod = globalPeriodCounter + periodsInThisSession;
          globalPeriodCounter += periodsInThisSession;

          // Xác định tuần và buổi trong tuần
          const sessionIndexInWeek = (currentSessionIndex % sessionsPerWeek) + 1; // Buổi 1, Buổi 2...
          const weekNumber = startWeekNumber + Math.floor(currentSessionIndex / sessionsPerWeek);
          currentSessionIndex++;

          // Xác định học kỳ
          const weekDates = getWeekDateRange(weekNumber);
          const semester = weekDates.semester;

          // Đặt tên bài học kèm ghi chú buổi / tiết
          let sessionTitle = original.title;
          if (sessionCountForThisLesson > 1) {
            sessionTitle = `${original.title} (Buổi ${s + 1}/${sessionCountForThisLesson} - Tiết ${startPeriodInLesson}${periodsInThisSession > 1 ? `-${endPeriodInLesson}` : ''})`;
          }

          const lessonNumberStr =
            globalStartPeriod === globalEndPeriod
              ? `Tiết ${globalStartPeriod}`
              : `Tiết ${globalStartPeriod}-${globalEndPeriod}`;

          newLessons.push({
            id: `sch-${original.id}-${s}-${Date.now()}`,
            subjectId: subject.id,
            gradeLevel: gradeLevel,
            stt: currentStt++,
            lessonNumber: lessonNumberStr,
            title: sessionTitle,
            periods: periodsInThisSession,
            week: weekNumber,
            semester: semester,
            objectives: original.objectives || '',
            notes: `Tuần ${weekNumber} (${weekDates.startFormatted} - ${weekDates.endFormatted}) · Buổi ${sessionIndexInWeek}/${sessionsPerWeek}`,
          });
        }
      });
    } else {
      // -------------------------------------------------------------
      // CHẾ ĐỘ 2: GIỮ NGUYÊN BÀI HỌC GỐC, TỰ ĐỘNG TÍNH TUẦN VÀ HỌC KỲ
      // -------------------------------------------------------------
      sortedOriginal.forEach((original) => {
        const rawPeriods = Number(original.periods) || 2;
        const globalStartPeriod = globalPeriodCounter + 1;
        const globalEndPeriod = globalPeriodCounter + rawPeriods;
        globalPeriodCounter += rawPeriods;

        // Tính số buổi bài này tương ứng
        const sessionsForLesson = Math.max(1, Math.ceil(rawPeriods / periodsPerSession));
        const weekNumber = startWeekNumber + Math.floor(currentSessionIndex / sessionsPerWeek);
        currentSessionIndex += sessionsForLesson;

        const weekDates = getWeekDateRange(weekNumber);
        const semester = weekDates.semester;

        const lessonNumberStr =
          globalStartPeriod === globalEndPeriod
            ? `Tiết ${globalStartPeriod}`
            : `Tiết ${globalStartPeriod}-${globalEndPeriod}`;

        newLessons.push({
          id: `sch-${original.id}-${Date.now()}`,
          subjectId: subject.id,
          gradeLevel: gradeLevel,
          stt: currentStt++,
          lessonNumber: lessonNumberStr,
          title: original.title,
          periods: rawPeriods,
          week: weekNumber,
          semester: semester,
          objectives: original.objectives || '',
          notes: `Tuần ${weekNumber} (${weekDates.startFormatted} - ${weekDates.endFormatted})`,
        });
      });
    }

    const totalWeeksNeeded = Math.ceil(currentSessionIndex / sessionsPerWeek);
    const hk1Count = newLessons.filter((l) => l.semester === 'HK1').length;
    const hk2Count = newLessons.filter((l) => l.semester === 'HK2').length;

    return {
      lessons: newLessons,
      totalPeriods: globalPeriodCounter,
      totalSessions: currentSessionIndex,
      totalWeeks: totalWeeksNeeded,
      hk1LessonsCount: hk1Count,
      hk2LessonsCount: hk2Count,
    };
  }, [
    existingLessons,
    subject.id,
    gradeLevel,
    splitIntoSessions,
    sessionsPerWeek,
    periodsPerSession,
    startDateSemester1,
    semester1Weeks,
    startDateSemester2,
    semester2Weeks,
    startWeekNumber,
  ]);

  // Handle Apply to system
  const handleApplySchedule = () => {
    if (scheduledResult.lessons.length === 0) return;

    replaceCurriculumLessons(subject.id, gradeLevel, scheduledResult.lessons);
    setAppliedSuccess(true);

    setTimeout(() => {
      setAppliedSuccess(false);
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-4 max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 text-xs">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Quy Ước Tiết/Tuần & Tự Động Phân Bổ Tuần - Học Kỳ (Thời Gian Thực)
              </h3>
              <p className="text-xs text-slate-500">
                Môn: <strong className="text-slate-800">{subject.name}</strong> · Khối lớp: <strong className="text-blue-700 font-bold">Khối {gradeLevel}</strong> · Hiện có: <strong>{existingLessons.length} bài học</strong>
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

        {/* Success Alert */}
        {appliedSuccess && (
          <div className="mx-6 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Đã phân chia lại thành công {scheduledResult.lessons.length} buổi học qua {scheduledResult.totalWeeks} tuần cho môn {subject.name} (Khối {gradeLevel})!
            </span>
          </div>
        )}

        {/* Main Configuration Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {/* Section 1: Quy ước số tiết & số buổi mỗi tuần */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>1. Quy Ước Số Tiết & Số Buổi Học Mỗi Tuần</span>
              </div>

              {/* Mode switch */}
              <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setConfigMode('custom')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    configMode === 'custom' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tự Thiết Lập
                </button>
                <button
                  type="button"
                  onClick={() => setConfigMode('by_class')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    configMode === 'by_class' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Theo Lớp Cụ Thể ({matchingClasses.length})
                </button>
              </div>
            </div>

            {configMode === 'by_class' && (
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                <label className="block text-slate-700 font-semibold">
                  Chọn Lớp Học Để Lấy Quy Ước Lịch Học:
                </label>
                {matchingClasses.length > 0 ? (
                  <select
                    value={selectedClassId}
                    onChange={(e) => handleSelectClass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="">-- Chọn một lớp học trong danh sách --</option>
                    {matchingClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        [{c.code}] {c.name} - (Lịch: {c.daysOfWeek?.length || 2} buổi/tuần, {c.studentIds.length} HS)
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-slate-500 text-[11px] italic">
                    Chưa có lớp học nào cho môn {subject.name} Khối {gradeLevel}. Bạn có thể chọn chế độ "Tự Thiết Lập" ở trên.
                  </div>
                )}
              </div>
            )}

            {/* Inputs: sessionsPerWeek & periodsPerSession */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Số buổi học trong 1 tuần:
                </label>
                <select
                  value={sessionsPerWeek}
                  onChange={(e) => setSessionsPerWeek(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value={1}>1 buổi / tuần</option>
                  <option value={2}>2 buổi / tuần (Phổ biến)</option>
                  <option value={3}>3 buổi / tuần</option>
                  <option value={4}>4 buổi / tuần</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Số tiết của mỗi buổi học:
                </label>
                <select
                  value={periodsPerSession}
                  onChange={(e) => setPeriodsPerSession(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value={1}>1 tiết / buổi (45 phút)</option>
                  <option value={2}>2 tiết / buổi (90 phút - Chuẩn)</option>
                  <option value={3}>3 tiết / buổi (135 phút)</option>
                  <option value={4}>4 tiết / buổi</option>
                </select>
              </div>

              <div className="bg-blue-50/70 p-2.5 rounded-lg border border-blue-200 flex flex-col justify-center">
                <span className="text-[11px] text-blue-700 font-medium">Tổng số tiết học mỗi tuần:</span>
                <span className="text-lg font-bold text-blue-900 font-mono">
                  {sessionsPerWeek * periodsPerSession} tiết / tuần
                </span>
                <span className="text-[10px] text-slate-500">
                  ({sessionsPerWeek} buổi × {periodsPerSession} tiết/buổi)
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Thời gian học kỳ theo thời gian thực */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>2. Thiết Lập Mốc Thời Gian Học Kỳ Theo Thời Gian Thực</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Học kỳ 1 */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between font-semibold text-slate-800">
                  <span className="text-blue-700 font-bold">Học Kỳ 1 (HK1)</span>
                  <span className="text-[11px] text-slate-500">{semester1Weeks} tuần học</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Ngày Bắt Đầu HK1:</label>
                    <input
                      type="date"
                      value={startDateSemester1}
                      onChange={(e) => setStartDateSemester1(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Số Tuần HK1:</label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={semester1Weeks}
                      onChange={(e) => setSemester1Weeks(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Học kỳ 2 */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between font-semibold text-slate-800">
                  <span className="text-emerald-700 font-bold">Học Kỳ 2 (HK2)</span>
                  <span className="text-[11px] text-slate-500">{semester2Weeks} tuần học</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Ngày Bắt Đầu HK2:</label>
                    <input
                      type="date"
                      value={startDateSemester2}
                      onChange={(e) => setStartDateSemester2(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Số Tuần HK2:</label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={semester2Weeks}
                      onChange={(e) => setSemester2Weeks(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-600">
              <Info className="w-4 h-4 text-blue-500 shrink-0" />
              <span>
                Tổng thời gian 2 học kỳ: <strong>{semester1Weeks + semester2Weeks} tuần</strong> (Chuẩn năm học Việt Nam: 35 tuần). Tuần bắt đầu phân bổ:{' '}
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={startWeekNumber}
                  onChange={(e) => setStartWeekNumber(Number(e.target.value))}
                  className="w-14 px-1.5 py-0.5 border border-slate-300 rounded font-mono font-bold text-center inline-block ml-1"
                />
              </span>
            </div>
          </div>

          {/* Section 3: Chế độ xử lý bài học nhiều tiết */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span>3. Quy Tắc Xử Lý Bài Học Nhiều Tiết</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                  splitIntoSessions
                    ? 'bg-blue-50/70 border-blue-400 shadow-2xs text-blue-950'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="splitOption"
                  checked={splitIntoSessions}
                  onChange={() => setSplitIntoSessions(true)}
                  className="mt-0.5 text-blue-600 shrink-0"
                />
                <div>
                  <div className="font-bold text-xs">
                    Tự Động Chèn & Tách Bài Thành Từng Buổi (Khuyên dùng)
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Ví dụ: Bài học có <strong>6 tiết</strong> sẽ tự động được chèn vào <strong>đủ 3 buổi học liên tiếp</strong> (Buổi 1: Tiết 1-2, Buổi 2: Tiết 3-4, Buổi 3: Tiết 5-6) tương ứng theo tuần và học kỳ.
                  </p>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                  !splitIntoSessions
                    ? 'bg-blue-50/70 border-blue-400 shadow-2xs text-blue-950'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="splitOption"
                  checked={!splitIntoSessions}
                  onChange={() => setSplitIntoSessions(false)}
                  className="mt-0.5 text-blue-600 shrink-0"
                />
                <div>
                  <div className="font-bold text-xs">
                    Giữ Nguyên Tên Bài Gốc, Tự Động Tính Dải Tiết & Tuần
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Giữ nguyên tên bài học ban đầu, tự động tính toán tuần bắt đầu, tuần kết thúc, học kỳ và dải tiết PPCT lũy kế theo tuần.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Section 4: Live Preview & Summary Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Xem Trước Kết Quả Phân Bổ ({scheduledResult.lessons.length} buổi học dự kiến)</span>
              </div>

              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-slate-600">
                  HK1: <strong className="text-blue-700">{scheduledResult.hk1LessonsCount} buổi</strong>
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-600">
                  HK2: <strong className="text-emerald-700">{scheduledResult.hk2LessonsCount} buổi</strong>
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-600">
                  Tổng thời gian: <strong className="text-slate-900">{scheduledResult.totalWeeks} tuần</strong>
                </span>
              </div>
            </div>

            {/* Preview Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 text-center w-12">STT</th>
                    <th className="px-3 py-2 w-16">Học Kỳ</th>
                    <th className="px-3 py-2 w-48">Tuần & Thời Gian Thực</th>
                    <th className="px-3 py-2 w-24">Tiết PPCT</th>
                    <th className="px-3 py-2">Tên Bài Học / Buổi Học</th>
                    <th className="px-3 py-2 text-center w-16">Số Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 bg-white">
                  {scheduledResult.lessons.map((l, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-3 py-1.5 text-center font-mono text-slate-500">{l.stt}</td>
                      <td className="px-3 py-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            l.semester === 'HK1'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {l.semester}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 font-medium text-slate-700">
                        <div className="font-semibold text-slate-900">Tuần {l.week}</div>
                        <div className="text-[10px] text-slate-500">{l.notes}</div>
                      </td>
                      <td className="px-3 py-1.5 font-mono font-bold text-blue-700">{l.lessonNumber}</td>
                      <td className="px-3 py-1.5 font-medium text-slate-900">{l.title}</td>
                      <td className="px-3 py-1.5 text-center font-mono font-bold text-slate-800">
                        {l.periods}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <div className="text-slate-500 text-[11px]">
            Hệ thống sẽ cập nhật lại toàn bộ bảng PPCT môn <strong>{subject.name}</strong> (Khối {gradeLevel}).
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>

            <button
              type="button"
              onClick={handleApplySchedule}
              disabled={scheduledResult.lessons.length === 0}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Áp Dụng Phân Chia Lại PPCT ({scheduledResult.lessons.length} buổi)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
