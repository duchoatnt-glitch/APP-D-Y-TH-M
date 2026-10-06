import React, { useState, useRef, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext.tsx';
import { Subject, GradeLevel, CurriculumLesson } from '../../types/index.ts';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Trash2,
  Plus,
  ClipboardList,
  FileText,
  BookOpen,
  Sparkles,
  Calendar,
  Clock,
  SlidersHorizontal,
  RefreshCw,
  Info,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface ImportCurriculumModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubjectId?: string;
  defaultGradeLevel?: GradeLevel;
  onSuccess?: (count: number) => void;
}

interface RawInputLesson {
  id: string;
  rawStt?: number;
  rawLessonNumber?: string;
  title: string;
  periods: number;
  rawWeek?: number;
  notes?: string;
}

interface ProcessedLessonRow {
  id: string;
  stt: number;
  lessonNumber: string; // e.g. Tiết 1-2, Tiết 3-4
  title: string;
  periods: number;
  gradeLevel: GradeLevel;
  week: number;
  sessionIndex: number; // 1, 2, 3...
  sessionInWeek: number; // Buổi 1, Buổi 2...
  semester: string;
  notes: string;
  originalLessonTitle?: string;
}

export const ImportCurriculumModal: React.FC<ImportCurriculumModalProps> = ({
  isOpen,
  onClose,
  defaultSubjectId,
  defaultGradeLevel = '12',
  onSuccess,
}) => {
  const { subjects, classes, batchAddCurriculumLessons } = useApp();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    defaultSubjectId || subjects[0]?.id || ''
  );
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(defaultGradeLevel);
  const [inputMode, setInputMode] = useState<'file' | 'paste'>('file');
  const [fileName, setFileName] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');

  // Raw extracted lessons (before/during auto-allocation)
  const [rawLessons, setRawLessons] = useState<RawInputLesson[]>([]);

  // Allocation configuration parameters
  const [periodsPerSession, setPeriodsPerSession] = useState<number>(2); // 2 tiết / buổi
  const [sessionsPerWeek, setSessionsPerWeek] = useState<number>(2); // 2 buổi / tuần
  const [startWeek, setStartWeek] = useState<number>(1); // Tuần 1
  const [allocationMode, setAllocationMode] = useState<'split_sessions' | 'keep_lessons'>('split_sessions');

  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultSubjectId) setSelectedSubjectId(defaultSubjectId);
    if (defaultGradeLevel) setSelectedGrade(defaultGradeLevel);
  }, [defaultSubjectId, defaultGradeLevel]);

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  // Detect suggested sessions/week from existing classes of this subject & grade
  useEffect(() => {
    const matchingClass = classes.find(
      (c) => c.subjectId === selectedSubjectId && c.gradeLevel === selectedGrade
    );
    if (matchingClass) {
      if (matchingClass.weeklySchedules && matchingClass.weeklySchedules.length > 0) {
        setSessionsPerWeek(matchingClass.weeklySchedules.length);
      } else if (matchingClass.daysOfWeek && matchingClass.daysOfWeek.length > 0) {
        setSessionsPerWeek(matchingClass.daysOfWeek.length);
      }
    }
  }, [selectedSubjectId, selectedGrade, classes]);

  const normalizeHeader = (hdr: string): string => {
    return hdr
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  // -------------------------------------------------------------
  // PARSER: Flexible detection for 2-column or multi-column files
  // -------------------------------------------------------------
  const processRawDataRows = (rawData: any[][], sourceName?: string) => {
    if (!rawData || rawData.length === 0) {
      alert('Không tìm thấy dữ liệu trong tệp.');
      return;
    }

    let headerIdx = -1;
    let colMap: Record<string, number> = {};

    // Scan top rows for recognizable headers
    for (let r = 0; r < Math.min(10, rawData.length); r++) {
      const row = rawData[r];
      if (!Array.isArray(row)) continue;

      const normalizedRow = row.map((cell) => normalizeHeader(String(cell || '')));

      const hasTitle = normalizedRow.some((c) =>
        c.includes('tenbai') ||
        c.includes('chude') ||
        c.includes('tenbaihoc') ||
        c.includes('baihoc') ||
        c.includes('title') ||
        c.includes('noidung') ||
        c.includes('lesson')
      );

      if (hasTitle) {
        headerIdx = r;
        normalizedRow.forEach((cell, idx) => {
          if (cell.includes('stt') || cell.includes('tt') || cell.includes('no')) {
            colMap['stt'] = idx;
          } else if (
            cell.includes('tietppct') ||
            cell.includes('tietphanphoi') ||
            cell.includes('tietthu') ||
            (cell.includes('tiet') && !cell.includes('sotiet'))
          ) {
            colMap['lessonNumber'] = idx;
          } else if (
            cell.includes('tenbai') ||
            cell.includes('chude') ||
            cell.includes('tenbaihoc') ||
            cell.includes('noidung') ||
            cell.includes('title') ||
            cell.includes('baihoc')
          ) {
            if (colMap['title'] === undefined) colMap['title'] = idx;
          } else if (cell.includes('sotiet') || cell.includes('tietday') || cell.includes('periods')) {
            colMap['periods'] = idx;
          } else if (cell.includes('tuan') || cell.includes('week')) {
            colMap['week'] = idx;
          } else if (cell.includes('ghichu') || cell.includes('note') || cell.includes('nhanxet')) {
            colMap['notes'] = idx;
          }
        });
        break;
      }
    }

    const startRow = headerIdx >= 0 ? headerIdx + 1 : 0;
    const extracted: RawInputLesson[] = [];
    let autoIndex = 1;

    for (let i = startRow; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || !Array.isArray(row)) continue;

      // Filter out empty rows
      const nonEmptyCells = row.map((c) => String(c || '').trim()).filter((c) => c.length > 0);
      if (nonEmptyCells.length === 0) continue;

      let title = '';
      let periods = 2; // Default 2 periods
      let rawStt: number | undefined = undefined;
      let rawWeek: number | undefined = undefined;
      let notes = '';

      if (headerIdx !== -1) {
        // Use detected column map
        if (colMap['title'] !== undefined) {
          title = String(row[colMap['title']] || '').trim();
        }
        if (colMap['periods'] !== undefined) {
          const p = Number(row[colMap['periods']]);
          if (!isNaN(p) && p > 0) periods = p;
        }
        if (colMap['stt'] !== undefined) {
          const s = Number(row[colMap['stt']]);
          if (!isNaN(s)) rawStt = s;
        }
        if (colMap['week'] !== undefined) {
          const w = Number(row[colMap['week']]);
          if (!isNaN(w)) rawWeek = w;
        }
        if (colMap['notes'] !== undefined) {
          notes = String(row[colMap['notes']] || '').trim();
        }
      } else {
        // No header detected -> Smart heuristic detection:
        // Case A: 2 columns: [Tên bài học, Số tiết] OR [Số tiết, Tên bài học]
        // Case B: 3 columns: [STT, Tên bài học, Số tiết]
        // Case C: 4 columns: [STT, Tiết PPCT, Tên bài học, Số tiết]
        if (nonEmptyCells.length === 2) {
          const cell0Num = Number(nonEmptyCells[0]);
          const cell1Num = Number(nonEmptyCells[1]);

          if (isNaN(cell0Num) && !isNaN(cell1Num) && cell1Num > 0) {
            // [Tên bài học, Số tiết]
            title = nonEmptyCells[0];
            periods = cell1Num;
          } else if (!isNaN(cell0Num) && cell0Num > 0 && isNaN(cell1Num)) {
            // [Số tiết, Tên bài học]
            periods = cell0Num;
            title = nonEmptyCells[1];
          } else {
            // Fallback: cell 0 is title, default 2 periods
            title = nonEmptyCells[0];
          }
        } else if (nonEmptyCells.length === 3) {
          const c0 = Number(nonEmptyCells[0]);
          const c2 = Number(nonEmptyCells[2]);

          if (!isNaN(c0) && isNaN(Number(nonEmptyCells[1])) && !isNaN(c2)) {
            // [STT, Tên bài học, Số tiết]
            rawStt = c0;
            title = nonEmptyCells[1];
            periods = c2;
          } else {
            title = nonEmptyCells[1] || nonEmptyCells[0];
            periods = !isNaN(c2) && c2 > 0 ? c2 : 2;
          }
        } else {
          // Find the longest text cell as title, and first small positive integer as periods
          let longestText = '';
          let foundPeriods: number | null = null;

          for (const cell of nonEmptyCells) {
            const num = Number(cell);
            if (!isNaN(num) && num >= 1 && num <= 20 && foundPeriods === null) {
              foundPeriods = num;
            } else if (cell.length > longestText.length && isNaN(Number(cell))) {
              longestText = cell;
            }
          }

          title = longestText;
          if (foundPeriods) periods = foundPeriods;
        }
      }

      if (!title) continue;

      extracted.push({
        id: `raw-ppct-${Date.now()}-${i}-${autoIndex}`,
        rawStt: rawStt || autoIndex,
        title,
        periods: Math.max(1, Math.round(periods)),
        rawWeek,
        notes,
      });

      autoIndex++;
    }

    if (extracted.length === 0) {
      alert('Không nhận diện được bài học nào từ file/dữ liệu. Vui lòng kiểm tra lại bảng.');
      return;
    }

    setRawLessons(extracted);
    if (sourceName) setFileName(sourceName);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setFileName(file.name);

    const reader = new FileReader();

    if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
      reader.onload = (evt) => {
        try {
          const content = evt.target?.result as string;
          const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
          const rawData = lines.map((line) => {
            if (line.includes('\t')) return line.split('\t');
            if (line.includes(';')) return line.split(';');
            return line.split(',');
          });
          processRawDataRows(rawData, file.name);
        } catch (err) {
          console.error(err);
          alert('Không thể đọc tệp CSV.');
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsText(file, 'utf-8');
    } else {
      // Excel .xlsx or .xls
      reader.onload = (evt) => {
        try {
          const buffer = evt.target?.result;
          const workbook = XLSX.read(buffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          processRawDataRows(rawData, file.name);
        } catch (err) {
          console.error(err);
          alert('Không thể đọc file Excel. Vui lòng kiểm tra định dạng tệp .xlsx hoặc .xls.');
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleProcessPasted = () => {
    if (!pastedText.trim()) {
      alert('Vui lòng dán nội dung phân phối chương trình (Tên bài học và Số tiết) vào ô bên dưới!');
      return;
    }
    const lines = pastedText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const rawData = lines.map((line) => {
      if (line.includes('\t')) return line.split('\t');
      if (line.includes(';')) return line.split(';');
      if (line.includes(',')) return line.split(',');
      return line.split(/\s{2,}/);
    });
    processRawDataRows(rawData, 'Dán trực tiếp');
  };

  // -------------------------------------------------------------
  // AUTO-ALLOCATION ENGINE: Distribute lessons by Session & Week
  // -------------------------------------------------------------
  const processedRows: ProcessedLessonRow[] = useMemo(() => {
    if (rawLessons.length === 0) return [];

    const result: ProcessedLessonRow[] = [];
    let globalPeriodCounter = 0; // Cumulative period count: 1, 2, 3, 4...
    let globalSessionCounter = 0; // Cumulative session count: 0, 1, 2, 3...
    let currentStt = 1;

    if (allocationMode === 'split_sessions') {
      // MODE 1: Split multi-period lessons into individual sessions
      // e.g. Lesson with 4 periods (periodsPerSession = 2) -> Session 1 (Tiết 1-2) + Session 2 (Tiết 3-4)
      rawLessons.forEach((raw) => {
        const totalPeriods = raw.periods || 2;
        let remainingPeriods = totalPeriods;
        let partIndex = 1;
        const totalParts = Math.ceil(totalPeriods / periodsPerSession);

        while (remainingPeriods > 0) {
          const sessionPeriods = Math.min(remainingPeriods, periodsPerSession);
          const startP = globalPeriodCounter + 1;
          const endP = globalPeriodCounter + sessionPeriods;
          globalPeriodCounter += sessionPeriods;

          const weekNum = startWeek + Math.floor(globalSessionCounter / sessionsPerWeek);
          const sessionInWeek = (globalSessionCounter % sessionsPerWeek) + 1;
          const semester = weekNum <= 18 ? 'HK1' : 'HK2';

          const lessonNumber = startP === endP ? `Tiết ${startP}` : `Tiết ${startP}-${endP}`;

          let sessionTitle = raw.title;
          if (totalParts > 1) {
            sessionTitle = `${raw.title} (Tiết ${startP}-${endP} / ${totalPeriods}T)`;
          }

          result.push({
            id: `allocated-${raw.id}-${partIndex}`,
            stt: currentStt,
            lessonNumber,
            title: sessionTitle,
            periods: sessionPeriods,
            gradeLevel: selectedGrade,
            week: weekNum,
            sessionIndex: globalSessionCounter + 1,
            sessionInWeek,
            semester,
            notes: raw.notes || '',
            originalLessonTitle: raw.title,
          });

          currentStt++;
          globalSessionCounter++;
          remainingPeriods -= sessionPeriods;
          partIndex++;
        }
      });
    } else {
      // MODE 2: Keep whole lessons as rows, automatically calculate period ranges & week
      rawLessons.forEach((raw) => {
        const lessonPeriods = raw.periods || 2;
        const startP = globalPeriodCounter + 1;
        const endP = globalPeriodCounter + lessonPeriods;
        globalPeriodCounter += lessonPeriods;

        const weekNum = startWeek + Math.floor(globalSessionCounter / sessionsPerWeek);
        const sessionInWeek = (globalSessionCounter % sessionsPerWeek) + 1;
        const semester = weekNum <= 18 ? 'HK1' : 'HK2';

        const lessonNumber = startP === endP ? `Tiết ${startP}` : `Tiết ${startP}-${endP}`;

        // Number of sessions this lesson spans
        const lessonSessions = Math.ceil(lessonPeriods / periodsPerSession);

        result.push({
          id: `allocated-whole-${raw.id}`,
          stt: currentStt,
          lessonNumber,
          title: raw.title,
          periods: lessonPeriods,
          gradeLevel: selectedGrade,
          week: weekNum,
          sessionIndex: globalSessionCounter + 1,
          sessionInWeek,
          semester,
          notes: raw.notes || '',
          originalLessonTitle: raw.title,
        });

        currentStt++;
        globalSessionCounter += Math.max(1, lessonSessions);
      });
    }

    return result;
  }, [rawLessons, allocationMode, periodsPerSession, sessionsPerWeek, startWeek, selectedGrade]);

  // Sample downloads
  const handleDownloadSampleExcel = (type: 'simple' | 'full') => {
    let sample: any[][];

    if (type === 'simple') {
      sample = [
        ['Tên bài học / Chủ đề', 'Số tiết', 'Ghi chú'],
        ['Sự đồng biến, nghịch biến của hàm số', 4, 'Trọng tâm thi THPTQG'],
        ['Cực trị của hàm số', 4, 'Định lý 1 & 2 về cực trị'],
        ['Giá trị lớn nhất và nhỏ nhất của hàm số', 2, 'Kỹ năng tìm GTLN, GTNN'],
        ['Đường tiệm cận của đồ thị hàm số', 2, 'Tiệm cận đứng, ngang, xiên'],
        ['Khảo sát sự biến thiên và vẽ đồ thị hàm số', 4, 'Nhận diện đồ thị'],
        ['Ôn tập và kiểm tra định kỳ 45 phút Chương 1', 2, 'Đánh giá năng lực giải đề'],
        ['Khái niệm về khối đa diện', 2, 'Hình học không gian'],
        ['Khối đa diện lồi và khối đa diện đều', 2, '5 loại khối đa diện đều'],
        ['Khái niệm về thể tích của khối đa diện', 4, 'Thể tích khối lăng trụ và chóp'],
      ];
    } else {
      sample = [
        ['STT', 'Tiết theo PPCT', 'Tên bài học / Chủ đề', 'Số tiết', 'Tuần', 'Học kỳ', 'Ghi chú'],
        [1, 'Tiết 1-2', 'Sự đồng biến, nghịch biến của hàm số', 2, 1, 'HK1', 'Trọng tâm thi THPTQG'],
        [2, 'Tiết 3-4', 'Cực trị của hàm số', 2, 1, 'HK1', 'Định lý 1 & 2'],
        [3, 'Tiết 5-6', 'Giá trị lớn nhất và nhỏ nhất của hàm số', 2, 2, 'HK1', 'Kỹ năng Casio giải nhanh'],
        [4, 'Tiết 7-8', 'Đường tiệm cận của đồ thị hàm số', 2, 2, 'HK1', 'Tiệm cận đứng, ngang'],
      ];
    }

    const ws = XLSX.utils.aoa_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PPCT_Mau');
    XLSX.writeFile(
      wb,
      type === 'simple'
        ? `Mau_PPCT_DonGian_2Cot_${currentSubject?.name || 'MonHoc'}.xlsx`
        : `Mau_Phan_Phoi_Chuong_Trinh_${currentSubject?.name || 'MonHoc'}.xlsx`
    );
  };

  const handleDownloadSampleCSV = () => {
    const csvContent =
      'Tên bài học / Chủ đề,Số tiết,Ghi chú\n' +
      'Sự đồng biến nghịch biến của hàm số,4,Lý thuyết và bài tập cơ bản\n' +
      'Cực trị của hàm số,4,Dạng toán chứa tham số m\n' +
      'Giá trị lớn nhất và nhỏ nhất của hàm số,2,Bài toán thực tế tối ưu\n' +
      'Đường tiệm cận của đồ thị hàm số,2,Nhận diện đồ thị\n' +
      'Kiểm tra định kỳ 15 phút,2,Khảo sát nhanh mức độ tiếp thu\n';

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Mau_PPCT_2Cot_${currentSubject?.name || 'MonHoc'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRowChange = (id: string, field: keyof ProcessedLessonRow, val: any) => {
    // If user manually edits a cell in the preview
    // If title or periods changed in raw lessons
    setRawLessons((prev) =>
      prev.map((r) => {
        if (r.id === id || id.includes(r.id)) {
          return { ...r, [field]: val };
        }
        return r;
      })
    );
  };

  const handleDeleteRawLesson = (id: string) => {
    setRawLessons((prev) => prev.filter((r) => r.id !== id && !id.includes(r.id)));
  };

  const handleAddManualRow = () => {
    const nextStt = rawLessons.length + 1;
    setRawLessons((prev) => [
      ...prev,
      {
        id: `manual-raw-${Date.now()}`,
        rawStt: nextStt,
        title: '',
        periods: 2,
        notes: '',
      },
    ]);
  };

  // -------------------------------------------------------------
  // SAVE ALL LESSONS INTO APP CURRICULUM
  // -------------------------------------------------------------
  const handleSaveToCurriculum = () => {
    const validRows = processedRows.filter((r) => r.title.trim().length > 0);
    if (validRows.length === 0) {
      alert('Vui lòng nhập tên bài học cho ít nhất 1 dòng!');
      return;
    }

    const lessonsToSave: CurriculumLesson[] = validRows.map((r, idx) => ({
      id: `ppct-${currentSubject.id}-${selectedGrade}-${Date.now()}-${idx}`,
      subjectId: currentSubject.id,
      gradeLevel: selectedGrade,
      stt: r.stt || idx + 1,
      lessonNumber: r.lessonNumber || `Tiết ${idx + 1}`,
      title: r.title.trim(),
      periods: Number(r.periods) || 2,
      week: r.week,
      semester: r.semester || (r.week <= 18 ? 'HK1' : 'HK2'),
      objectives: '',
      notes: r.notes?.trim() || '',
    }));

    batchAddCurriculumLessons(lessonsToSave);
    const totalPeriods = lessonsToSave.reduce((sum, l) => sum + l.periods, 0);
    const maxWeek = lessonsToSave.reduce((max, l) => Math.max(max, l.week || 0), 0);

    setSuccessMsg(
      `Đã phân bổ và lưu thành công ${lessonsToSave.length} buổi học (${totalPeriods} tiết, trải dài ${maxWeek} tuần) vào PPCT ${currentSubject.name} - Khối ${selectedGrade}!`
    );

    setTimeout(() => {
      if (onSuccess) onSuccess(lessonsToSave.length);
      onClose();
    }, 1200);
  };

  const totalPeriodsCalculated = processedRows.reduce((sum, r) => sum + (Number(r.periods) || 0), 0);
  const totalWeeksCalculated = processedRows.reduce((max, r) => Math.max(max, r.week || 0), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden my-4 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-2xs">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>Nhập PPCT & Tự Động Phân Bổ Buổi, Tuần Lên Lịch</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  Tự Động Tính Toán
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Giáo viên chỉ cần nhập <strong>Tên bài học</strong> và <strong>Số tiết</strong>, hệ thống tự động phân bổ theo buổi học và theo tuần để lên lịch thời khóa biểu chính xác.
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

        {/* Selection Bar: Môn học & Khối lớp & Tải File Mẫu */}
        <div className="px-6 py-3 bg-blue-50/70 border-b border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Môn học:</span>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="bg-white border border-blue-200 rounded-lg px-3 py-1 font-bold text-blue-800 outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Khối lớp:</span>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value as GradeLevel)}
                className="bg-white border border-blue-200 rounded-lg px-3 py-1 font-bold text-blue-800 outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleDownloadSampleExcel('simple')}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Tải file mẫu Excel 2 cột đơn giản: Tên bài học và Số tiết"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mẫu 2 Cột (Tên Bài + Số Tiết)</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownloadSampleExcel('full')}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-medium flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Tải file mẫu Excel đầy đủ các cột"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              <span>Mẫu Đầy Đủ</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadSampleCSV}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-medium flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Tải file mẫu CSV"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Mẫu CSV</span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Body content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5 text-xs">
          {/* Input Method Switcher */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <button
              type="button"
              onClick={() => setInputMode('file')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                inputMode === 'file'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Tải file Excel PPCT (.xlsx, .xls, .csv)
            </button>
            <button
              type="button"
              onClick={() => setInputMode('paste')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                inputMode === 'paste'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" /> Dán trực tiếp 2 cột (Tên bài & Số tiết)
            </button>
          </div>

          {/* Mode 1: File Upload */}
          {inputMode === 'file' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-200 hover:border-blue-500 bg-blue-50/30 hover:bg-blue-50/60 rounded-2xl p-6 text-center cursor-pointer transition-all group"
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Nhấn vào đây để chọn tệp PPCT từ máy tính
                </h4>
                <p className="text-slate-500 mt-1">
                  Định dạng: <strong>Excel (.xlsx, .xls)</strong> hoặc <strong>CSV (.csv)</strong>
                </p>
                <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-blue-100/80 text-blue-800 rounded-full font-semibold text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Chỉ cần 2 cột: <strong>Tên bài học / Chủ đề</strong> và <strong>Số tiết</strong> — App tự động tính Tiết PPCT, Buổi và Tuần</span>
                </div>
              </div>

              {fileName && (
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2 text-slate-800 font-medium">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>
                      Tệp: <strong className="font-semibold text-slate-900">{fileName}</strong>
                    </span>
                    <span className="text-slate-400">({rawLessons.length} bài học gốc)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    Đổi tệp khác
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Paste Direct */}
          {inputMode === 'paste' && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <span>Dán danh sách (Tên bài học và Số tiết) từ Excel hoặc Word:</span>
                  </label>
                  <span className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold">
                    Định dạng: [Tên bài học] [Số tiết]
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`Sự đồng biến, nghịch biến của hàm số\t4\nCực trị của hàm số\t4\nGiá trị lớn nhất và nhỏ nhất của hàm số\t2\nĐường tiệm cận của đồ thị hàm số\t2\nKhảo sát sự biến thiên và vẽ đồ thị hàm số\t4\nKiểm tra định kỳ 45 phút Chương 1\t2`}
                  className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl outline-none focus:border-blue-500 bg-slate-50 leading-relaxed"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Mỗi dòng là 1 bài học: <strong>Tên bài học</strong> cách nhau bằng phím Tab hoặc dấu phẩy với <strong>Số tiết</strong>
                </span>
                <button
                  type="button"
                  onClick={handleProcessPasted}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Trích xuất & Tự động phân bổ ngay</span>
                </button>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* CONTROL PANEL: CẤU HÌNH TỰ ĐỘNG PHÂN BỔ BUỔI & TUẦN LÊN LỊCH */}
          {/* ------------------------------------------------------------- */}
          {rawLessons.length > 0 && (
            <div className="p-4 bg-linear-to-br from-indigo-50/90 via-blue-50/70 to-slate-50 border border-indigo-200/80 rounded-2xl shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-indigo-950 text-xs uppercase tracking-wide">
                      Cấu Hình Tự Động Phân Bổ Buổi & Tuần Lên Lịch Cho Đúng
                    </h4>
                    <p className="text-[11px] text-indigo-700">
                      Tự động tính toán số tiết mỗi ca dạy, tuần học và học kỳ cho từng buổi lên thời khóa biểu.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2.5 py-1 bg-white border border-indigo-200 rounded-lg font-bold text-indigo-900 shadow-2xs">
                    Tổng bài gốc: <b>{rawLessons.length}</b>
                  </span>
                  <span className="px-2.5 py-1 bg-white border border-blue-200 rounded-lg font-bold text-blue-900 shadow-2xs">
                    Tổng buổi lên lịch: <b>{processedRows.length}</b>
                  </span>
                  <span className="px-2.5 py-1 bg-white border border-emerald-200 rounded-lg font-bold text-emerald-900 shadow-2xs">
                    Tổng {totalPeriodsCalculated} tiết ({totalWeeksCalculated} tuần)
                  </span>
                </div>
              </div>

              {/* Parameter Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1">
                {/* 1. Số tiết mỗi buổi */}
                <div className="bg-white p-2.5 rounded-xl border border-indigo-100 shadow-2xs">
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Số Tiết / Mỗi Buổi Dạy:</span>
                  </label>
                  <select
                    value={periodsPerSession}
                    onChange={(e) => setPeriodsPerSession(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-indigo-900 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value={1}>1 tiết / buổi</option>
                    <option value={2}>2 tiết / buổi (Khuyên dùng)</option>
                    <option value={3}>3 tiết / buổi</option>
                    <option value={4}>4 tiết / buổi</option>
                  </select>
                </div>

                {/* 2. Số buổi mỗi tuần */}
                <div className="bg-white p-2.5 rounded-xl border border-indigo-100 shadow-2xs">
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Số Buổi / Mỗi Tuần:</span>
                  </label>
                  <select
                    value={sessionsPerWeek}
                    onChange={(e) => setSessionsPerWeek(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-indigo-900 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value={1}>1 buổi / tuần</option>
                    <option value={2}>2 buổi / tuần (Phổ biến)</option>
                    <option value={3}>3 buổi / tuần</option>
                    <option value={4}>4 buổi / tuần</option>
                    <option value={5}>5 buổi / tuần</option>
                  </select>
                </div>

                {/* 3. Tuần bắt đầu */}
                <div className="bg-white p-2.5 rounded-xl border border-indigo-100 shadow-2xs">
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Bắt Đầu Từ Tuần Học:</span>
                  </label>
                  <select
                    value={startWeek}
                    onChange={(e) => setStartWeek(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-indigo-900 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {Array.from({ length: 52 }, (_, i) => i + 1).map((w) => (
                      <option key={w} value={w}>
                        Tuần {w} {w <= 18 ? '(Học kỳ 1)' : '(Học kỳ 2)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Chế độ phân bổ */}
                <div className="bg-white p-2.5 rounded-xl border border-indigo-100 shadow-2xs">
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Phương Thức Phân Bổ:</span>
                  </label>
                  <select
                    value={allocationMode}
                    onChange={(e) => setAllocationMode(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-indigo-900 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="split_sessions">
                      Tách chi tiết từng buổi dạy (1 dòng = 1 buổi)
                    </option>
                    <option value="keep_lessons">
                      Giữ nguyên bài gốc & tự đánh số tiết/tuần
                    </option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {processedRows.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 uppercase tracking-wide">
                    Xem Trước Phân Bổ Buổi & Tuần Lên Lịch ({processedRows.length} buổi):
                  </span>
                  <span className="px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800">
                    Môn {currentSubject?.name} · Khối {selectedGrade}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddManualRow}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm bài học mới
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRawLessons([]);
                      setFileName(null);
                    }}
                    className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    Xóa danh sách này
                  </button>
                </div>
              </div>

              {/* Table with columns: STT, Buổi & Tuần, Tiết PPCT, Tên bài học/chủ đề, Số tiết, Học kỳ, Ghi chú */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="max-h-80 overflow-y-auto overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200 z-10">
                      <tr>
                        <th className="px-3 py-2.5 w-12 text-center">STT</th>
                        <th className="px-3 py-2.5 w-32 text-center">Buổi & Tuần</th>
                        <th className="px-3 py-2.5 w-28 text-center">Tiết PPCT</th>
                        <th className="px-3 py-2.5 min-w-[240px]">Tên Bài Học / Chủ Đề Đã Phân Bổ</th>
                        <th className="px-3 py-2.5 w-20 text-center">Số Tiết</th>
                        <th className="px-3 py-2.5 w-20 text-center">Học Kỳ</th>
                        <th className="px-3 py-2.5 min-w-[140px]">Ghi Chú</th>
                        <th className="px-3 py-2.5 w-12 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800 bg-white">
                      {processedRows.map((row) => (
                        <tr key={row.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="px-3 py-2 text-center font-mono font-medium text-slate-500">
                            {row.stt}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold bg-indigo-50 text-indigo-800 border border-indigo-100 font-mono text-[11px]">
                              Tuần {row.week} · Buổi {row.sessionInWeek}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className="inline-block px-2 py-0.5 rounded font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 text-[11px]">
                              {row.lessonNumber}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-medium">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900">{row.title}</span>
                              {row.originalLessonTitle && row.originalLessonTitle !== row.title && (
                                <span className="text-[10px] text-slate-400">
                                  Bài gốc: {row.originalLessonTitle}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className="font-mono font-bold text-blue-700">
                              {row.periods}T
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span
                              className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                                row.semester === 'HK1'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {row.semester}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-500">
                            {row.notes || <span className="italic text-slate-300">Không có</span>}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRawLesson(row.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Xóa bài này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/80 text-xs">
          <div className="text-slate-500 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>
              Môn: <strong>{currentSubject?.name}</strong> · Khối: <strong>{selectedGrade}</strong>
              {processedRows.length > 0 && (
                <span className="text-blue-700 font-semibold ml-1">
                  ({processedRows.length} buổi học · {totalPeriodsCalculated} tiết · {totalWeeksCalculated} tuần)
                </span>
              )}
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
              onClick={handleSaveToCurriculum}
              disabled={processedRows.length === 0 || isProcessing}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Lưu Vào Phân Phối Chương Trình {processedRows.length > 0 ? `(${processedRows.length} Buổi)` : ''}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
