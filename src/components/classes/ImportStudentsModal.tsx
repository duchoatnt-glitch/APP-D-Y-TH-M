import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext.tsx';
import { ClassRoom, Student, GradeLevel } from '../../types/index.ts';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Plus,
  ClipboardList,
  FileText,
  UserCheck,
} from 'lucide-react';

interface ImportStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetClass: ClassRoom | null;
  onSuccess?: (addedCount: number) => void;
}

interface ParsedStudentRow {
  id: string;
  stt: number;
  name: string;
  schoolClass: string;
  school: string;
  notes: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  gender: 'Nam' | 'Nữ';
  gradeLevel: GradeLevel;
  isValid: boolean;
  error?: string;
}

export const ImportStudentsModal: React.FC<ImportStudentsModalProps> = ({
  isOpen,
  onClose,
  targetClass,
  onSuccess,
}) => {
  const { classes, batchAddStudentsToClass } = useApp();
  const [selectedClassId, setSelectedClassId] = useState<string>(targetClass?.id || '');
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [inputMode, setInputMode] = useState<'file' | 'paste'>('file');
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync selected class with prop if changed
  React.useEffect(() => {
    if (targetClass?.id) {
      setSelectedClassId(targetClass.id);
    }
  }, [targetClass]);

  if (!isOpen) return null;

  const currentClass = classes.find((c) => c.id === selectedClassId) || targetClass || classes[0];

  const normalizeHeader = (hdr: string): string => {
    return hdr
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  const processRawDataRows = (rawData: any[][], sourceFileName?: string) => {
    if (!rawData || rawData.length === 0) {
      alert('Không tìm thấy dữ liệu trong tệp.');
      return;
    }

    // Find header row index
    let headerIdx = -1;
    let colMap: Record<string, number> = {};

    for (let r = 0; r < Math.min(10, rawData.length); r++) {
      const row = rawData[r];
      if (!Array.isArray(row)) continue;
      
      const normalizedRow = row.map((cell) => normalizeHeader(String(cell || '')));
      
      // Look for standard column keywords
      const hasName = normalizedRow.some((c) =>
        c.includes('ten') || c.includes('hoten') || c.includes('name') || c.includes('sinhvien') || c.includes('hocsinh')
      );

      if (hasName) {
        headerIdx = r;
        normalizedRow.forEach((cell, idx) => {
          if (cell.includes('stt') || cell.includes('tt') || cell.includes('no') || cell.includes('sothutu')) {
            colMap['stt'] = idx;
          } else if (cell.includes('hoten') || cell.includes('ten') || cell.includes('name')) {
            if (colMap['name'] === undefined) colMap['name'] = idx;
          } else if (cell.includes('lop') || cell.includes('khoi') || cell.includes('class')) {
            colMap['schoolClass'] = idx;
          } else if (cell.includes('truong') || cell.includes('school')) {
            colMap['school'] = idx;
          } else if (cell.includes('ghichu') || cell.includes('note') || cell.includes('nhanxet') || cell.includes('luuy')) {
            colMap['notes'] = idx;
          } else if (cell.includes('sdt') || cell.includes('dienthoai') || cell.includes('phone') || cell.includes('tel')) {
            if (colMap['phone'] === undefined) colMap['phone'] = idx;
            else colMap['parentPhone'] = idx;
          } else if (cell.includes('phuhuynh') || cell.includes('bome') || cell.includes('parent')) {
            colMap['parentName'] = idx;
          } else if (cell.includes('gioitinh') || cell.includes('gender')) {
            colMap['gender'] = idx;
          }
        });
        break;
      }
    }

    // If no explicit header recognized, assume default order:
    // Col 0: STT, Col 1: Họ tên, Col 2: Lớp, Col 3: Trường, Col 4: Ghi chú
    const startRow = headerIdx >= 0 ? headerIdx + 1 : 0;
    if (headerIdx === -1) {
      colMap = {
        stt: 0,
        name: 1,
        schoolClass: 2,
        school: 3,
        notes: 4,
      };
    }

    const defaultGrade: GradeLevel = currentClass ? currentClass.gradeLevel : '12';
    const rows: ParsedStudentRow[] = [];
    let autoIndex = 1;

    for (let i = startRow; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || !Array.isArray(row)) continue;

      const rawName = colMap['name'] !== undefined ? String(row[colMap['name']] || '').trim() : '';
      if (!rawName) continue; // Skip empty row

      const rawStt = colMap['stt'] !== undefined ? Number(row[colMap['stt']]) : autoIndex;
      const stt = isNaN(rawStt) || rawStt <= 0 ? autoIndex : rawStt;
      autoIndex++;

      const schoolClass = colMap['schoolClass'] !== undefined ? String(row[colMap['schoolClass']] || '').trim() : '';
      const school = colMap['school'] !== undefined ? String(row[colMap['school']] || '').trim() : '';
      const notes = colMap['notes'] !== undefined ? String(row[colMap['notes']] || '').trim() : '';
      const phone = colMap['phone'] !== undefined ? String(row[colMap['phone']] || '').trim() : '';
      const parentName = colMap['parentName'] !== undefined ? String(row[colMap['parentName']] || '').trim() : '';
      const parentPhone = colMap['parentPhone'] !== undefined ? String(row[colMap['parentPhone']] || '').trim() : '';
      const rawGender = colMap['gender'] !== undefined ? String(row[colMap['gender']] || '').trim().toLowerCase() : '';
      const gender: 'Nam' | 'Nữ' = rawGender.includes('nu') || rawGender.includes('nữ') || rawGender.includes('female') ? 'Nữ' : 'Nam';

      rows.push({
        id: `import-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        stt,
        name: rawName,
        schoolClass: schoolClass || (currentClass ? `Khối ${currentClass.gradeLevel}` : '12A1'),
        school: school || 'THPT Chuyên / Công Lập',
        notes: notes || 'Học sinh nhập từ danh sách máy tính',
        phone: phone || `09${Math.floor(10000000 + Math.random() * 90000000)}`,
        parentName: parentName || 'Phụ huynh',
        parentPhone: parentPhone || phone || '0901.234.567',
        gender,
        gradeLevel: defaultGrade,
        isValid: true,
      });
    }

    if (rows.length === 0) {
      alert('Không trích xuất được học sinh nào từ dữ liệu. Vui lòng kiểm tra lại file hoặc dán định dạng đúng cột (Họ tên, Lớp, Trường, Ghi chú...).');
      return;
    }

    setParsedRows(rows);
    if (sourceFileName) setFileName(sourceFileName);
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
            // Check comma or tab
            if (line.includes('\t')) return line.split('\t');
            if (line.includes(';')) return line.split(';');
            return line.split(',');
          });
          processRawDataRows(rawData, file.name);
        } catch (err) {
          console.error(err);
          alert('Không thể đọc file CSV. Vui lòng kiểm tra định dạng.');
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
      alert('Vui lòng dán danh sách học sinh vào ô bên dưới!');
      return;
    }
    const lines = pastedText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const rawData = lines.map((line) => {
      if (line.includes('\t')) return line.split('\t');
      if (line.includes(';')) return line.split(';');
      if (line.includes(',')) return line.split(',');
      return line.split(/\s{2,}/); // 2 or more spaces
    });
    processRawDataRows(rawData, 'Dán trực tiếp');
  };

  const handleRowChange = (id: string, field: keyof ParsedStudentRow, val: any) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  const handleDeleteRow = (id: string) => {
    setParsedRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddManualRow = () => {
    const nextStt = parsedRows.length + 1;
    setParsedRows((prev) => [
      ...prev,
      {
        id: `manual-${Date.now()}`,
        stt: nextStt,
        name: '',
        schoolClass: currentClass ? `Lớp ${currentClass.gradeLevel}` : '12A1',
        school: 'THPT Chu Văn An',
        notes: '',
        phone: '',
        parentName: '',
        parentPhone: '',
        gender: 'Nam',
        gradeLevel: currentClass ? currentClass.gradeLevel : '12',
        isValid: true,
      },
    ]);
  };

  const handleDownloadSampleExcel = () => {
    const sampleData = [
      ['STT', 'Họ tên học sinh', 'Lớp', 'Trường', 'Ghi chú', 'Số điện thoại', 'Phụ huynh', 'SĐT phụ huynh', 'Giới tính'],
      [1, 'Nguyễn Văn An', '12A1', 'THPT Chu Văn An', 'Học sinh giỏi Toán, cần nâng cao đề 9+', '0912345678', 'Nguyễn Văn Bình (Bố)', '0912345679', 'Nam'],
      [2, 'Trần Thị Mai', '12A2', 'THPT Kim Liên', 'Chăm chỉ, cần củng cố phần hình không gian', '0923456789', 'Lê Thị Cúc (Mẹ)', '0923456780', 'Nữ'],
      [3, 'Lê Hoàng Nam', '12 Chuyên Lý', 'THPT Chuyên Hà Nội - Amsterdam', 'Mục tiêu đỗ Bách Khoa, tiếp thu nhanh', '0934567890', 'Lê Văn Dũng', '0934567891', 'Nam'],
      [4, 'Phạm Quỳnh Anh', '12D1', 'THPT Phan Đình Phùng', 'Xin phép vào muộn 15 phút ca thứ 6 do kẹt xe', '0945678901', 'Phạm Thị Hạnh', '0945678902', 'Nữ'],
      [5, 'Vũ Đức Minh', '12A5', 'THPT Thăng Long', 'Học sinh mới chuyển vào từ đầu tháng', '0956789012', 'Vũ Văn Quang', '0956789013', 'Nam'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSachHocSinh');
    XLSX.writeFile(wb, 'Mau_Danh_Sach_Hoc_Sinh_EduCenter.xlsx');
  };

  const handleDownloadSampleCSV = () => {
    const csvContent =
      'STT,Họ tên học sinh,Lớp,Trường,Ghi chú,Số điện thoại,Phụ huynh,SĐT phụ huynh\n' +
      '1,Nguyễn Văn An,12A1,THPT Chu Văn An,Học sinh khá Toán,0912345678,Nguyễn Văn Bình,0912345679\n' +
      '2,Trần Thị Mai,12A2,THPT Kim Liên,Cần phụ đạo hình học,0923456789,Lê Thị Cúc,0923456780\n' +
      '3,Lê Hoàng Nam,12 Tin,THPT Chuyên KHTN,Đích 9+ THPTQG,0934567890,Lê Văn Dũng,0934567891\n' +
      '4,Vũ Đức Minh,12A3,THPT Việt Đức,Chăm chỉ làm BTVN,0945678901,Vũ Văn Quang,0945678902\n';

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Mau_Danh_Sach_Hoc_Sinh.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveToClass = () => {
    if (!currentClass) {
      alert('Vui lòng chọn lớp học để thêm danh sách học sinh!');
      return;
    }

    const validRows = parsedRows.filter((r) => r.name.trim().length > 0);
    if (validRows.length === 0) {
      alert('Danh sách không có học sinh hợp lệ nào. Vui lòng nhập họ tên cho ít nhất 1 học sinh!');
      return;
    }

    const newStudentObjects: Student[] = validRows.map((r, idx) => {
      const codeNum = Math.floor(10000 + Math.random() * 90000);
      return {
        id: `stu-import-${Date.now()}-${idx}`,
        code: `HS-${codeNum}`,
        name: r.name.trim(),
        gender: r.gender || 'Nam',
        dob: '2008-01-01',
        phone: r.phone.trim() || `09${Math.floor(10000000 + Math.random() * 90000000)}`,
        school: r.school.trim() || 'THPT',
        schoolClass: r.schoolClass.trim() || `Khối ${currentClass.gradeLevel}`,
        gradeLevel: currentClass.gradeLevel,
        parentName: r.parentName.trim() || 'Phụ huynh',
        parentPhone: r.parentPhone.trim() || r.phone.trim() || '0901.234.567',
        address: 'Hà Nội',
        enrolledClassIds: [currentClass.id],
        status: 'active',
        targetGoal: r.notes.trim() || 'Nâng cao kiến thức và đạt kết quả cao trong kỳ thi',
        notes: r.notes.trim() || `Nhập từ máy tính vào lớp ${currentClass.name}`,
        joinDate: new Date().toISOString().split('T')[0],
      };
    });

    batchAddStudentsToClass(currentClass.id, newStudentObjects);
    setImportSuccessMsg(`Đã thêm thành công ${newStudentObjects.length} học sinh vào lớp "${currentClass.name}"!`);

    setTimeout(() => {
      if (onSuccess) onSuccess(newStudentObjects.length);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Thêm Danh Sách Học Sinh Từ Máy Tính Vào Lớp
              </h3>
              <p className="text-xs text-slate-500">
                Hỗ trợ tệp Excel (.xlsx, .xls), CSV hoặc dán bảng trực tiếp với đầy đủ: TT, Họ tên, Lớp, Trường, Ghi chú...
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Class Info Bar */}
        <div className="px-6 py-3 bg-blue-50/60 border-b border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700">Lớp tiếp nhận học sinh:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-white border border-blue-200 rounded-lg px-3 py-1 font-bold text-blue-800 outline-none focus:ring-2 focus:ring-blue-400"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name} (Khối {c.gradeLevel} - Hiện có {c.studentIds.length} HS)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadSampleExcel}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Tải file mẫu Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tải File Mẫu Excel</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadSampleCSV}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Tải file mẫu CSV"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>File Mẫu CSV</span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner if saved */}
        {importSuccessMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{importSuccessMsg}</span>
          </div>
        )}

        {/* Body content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {/* Input Method Switcher */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <button
              type="button"
              onClick={() => setInputMode('file')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                inputMode === 'file'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Chọn tệp từ máy tính (.xlsx, .csv)
            </button>
            <button
              type="button"
              onClick={() => setInputMode('paste')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                inputMode === 'paste'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" /> Dán nhanh từ bảng tính Excel
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
                  Nhấn vào đây để chọn file từ máy tính
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Định dạng được hỗ trợ: <strong>Excel (.xlsx, .xls)</strong> hoặc <strong>CSV (.csv)</strong>
                </p>
                <p className="text-[11px] text-blue-600 font-medium mt-2">
                  Cột dữ liệu yêu cầu: TT (Số thứ tự), Họ và tên, Lớp, Trường, Ghi chú
                </p>
              </div>

              {fileName && (
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <div className="flex items-center gap-2 text-slate-800 font-medium">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Tệp đã chọn: <strong className="font-semibold text-slate-900">{fileName}</strong></span>
                    <span className="text-slate-400">({parsedRows.length} học sinh trích xuất)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:underline font-semibold"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dán các dòng từ bảng Excel / Google Sheets vào đây (Ctrl+V):
                </label>
                <textarea
                  rows={4}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`1\tNguyễn Văn An\t12A1\tTHPT Chu Văn An\tHọc sinh giỏi Toán\n2\tTrần Thị Mai\t12A2\tTHPT Kim Liên\tCần kèm thêm hình học\n3\tLê Hoàng Nam\t12 Chuyên Lý\tTHPT Chuyên Hà Nội - Amsterdam\tMục tiêu đỗ Bách Khoa`}
                  className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl outline-none focus:border-blue-500 bg-slate-50"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Thứ tự cột mặc định: <strong>TT | Họ tên học sinh | Lớp | Trường | Ghi chú</strong>
                </span>
                <button
                  type="button"
                  onClick={handleProcessPasted}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Trích xuất danh sách
                </button>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Xem Trước Danh Sách Học Sinh Chuẩn Bị Thêm:
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                    {parsedRows.length} học sinh
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddManualRow}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm 1 dòng mới
                  </button>
                  <button
                    type="button"
                    onClick={() => setParsedRows([])}
                    className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-medium transition-colors"
                  >
                    Xóa danh sách này
                  </button>
                </div>
              </div>

              {/* Table with columns: TT, Họ tên, Lớp, Trường, Ghi chú */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="max-h-72 overflow-y-auto overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100/90 text-slate-700 font-semibold sticky top-0 border-b border-slate-200 z-10">
                      <tr>
                        <th className="px-3 py-2.5 w-14 text-center">TT</th>
                        <th className="px-3 py-2.5 min-w-[160px]">Họ Tên Học Sinh *</th>
                        <th className="px-3 py-2.5 min-w-[100px]">Lớp</th>
                        <th className="px-3 py-2.5 min-w-[150px]">Trường</th>
                        <th className="px-3 py-2.5 min-w-[180px]">Ghi Chú</th>
                        <th className="px-3 py-2.5 min-w-[110px]">Số ĐT</th>
                        <th className="px-3 py-2.5 w-12 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800 bg-white">
                      {parsedRows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-3 py-2 text-center font-mono font-medium text-slate-500">
                            <input
                              type="number"
                              value={row.stt}
                              onChange={(e) => handleRowChange(row.id, 'stt', Number(e.target.value))}
                              className="w-10 text-center font-mono py-0.5 bg-slate-50 border border-slate-200 rounded"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={row.name}
                              onChange={(e) => handleRowChange(row.id, 'name', e.target.value)}
                              placeholder="Họ và tên..."
                              className="w-full px-2 py-1 font-semibold text-slate-900 border border-slate-200 rounded bg-white focus:border-blue-500 outline-none"
                              required
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={row.schoolClass}
                              onChange={(e) => handleRowChange(row.id, 'schoolClass', e.target.value)}
                              placeholder="VD: 12A1"
                              className="w-full px-2 py-1 border border-slate-200 rounded bg-white focus:border-blue-500 outline-none"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={row.school}
                              onChange={(e) => handleRowChange(row.id, 'school', e.target.value)}
                              placeholder="VD: THPT Chu Văn An"
                              className="w-full px-2 py-1 border border-slate-200 rounded bg-white focus:border-blue-500 outline-none"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={row.notes}
                              onChange={(e) => handleRowChange(row.id, 'notes', e.target.value)}
                              placeholder="VD: Đích 9+ THPTQG, học khá..."
                              className="w-full px-2 py-1 border border-slate-200 rounded bg-white focus:border-blue-500 outline-none"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={row.phone}
                              onChange={(e) => handleRowChange(row.id, 'phone', e.target.value)}
                              placeholder="09..."
                              className="w-full px-2 py-1 font-mono text-[11px] border border-slate-200 rounded bg-white focus:border-blue-500 outline-none"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Xóa dòng này"
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
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/70 text-xs">
          <div className="text-slate-500 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>
              Sĩ số hiện tại: <strong>{currentClass?.studentIds.length || 0}</strong> học sinh
              {parsedRows.length > 0 && (
                <span className="text-emerald-700 font-semibold ml-1">
                  (Dự kiến sau khi thêm: {(currentClass?.studentIds.length || 0) + parsedRows.length} HS)
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSaveToClass}
              disabled={parsedRows.length === 0 || isProcessing}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Xác Nhận Thêm {parsedRows.length > 0 ? `${parsedRows.length} Học Sinh` : ''} Vào Lớp
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
