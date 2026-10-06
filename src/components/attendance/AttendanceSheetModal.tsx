import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { AttendanceRecord, AttendanceStatus, ClassRoom } from '../../types/index.ts';
import {
  X,
  CalendarCheck,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  MessageSquare,
  Copy,
  Check,
  Save,
  Send,
  Star,
} from 'lucide-react';
import { getDayOfWeekName } from '../../utils/formatters.ts';

interface AttendanceSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultClassId?: string | null;
}

export const AttendanceSheetModal: React.FC<AttendanceSheetModalProps> = ({
  isOpen,
  onClose,
  defaultClassId,
}) => {
  const {
    classes,
    students,
    subjects,
    teachers,
    rooms,
    attendance,
    saveAttendanceBatch,
    sendNotification,
    settings,
  } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [sessionDate, setSessionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [records, setRecords] = useState<Record<string, Partial<AttendanceRecord>>>({});
  const [showZaloPreview, setShowZaloPreview] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Initialize class selection
  useEffect(() => {
    if (defaultClassId) {
      setSelectedClassId(defaultClassId);
    } else if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [defaultClassId, classes, selectedClassId]);

  const currentClass = classes.find((c) => c.id === selectedClassId);
  const currentSubject = subjects.find((s) => s.id === currentClass?.subjectId);
  const currentTeacher = teachers.find((t) => t.id === currentClass?.teacherId);
  const currentRoom = rooms.find((r) => r.id === currentClass?.roomId);

  // Enrolled students in current class
  const classStudents = students.filter((s) => currentClass?.studentIds.includes(s.id));

  // Load existing records or default
  useEffect(() => {
    if (!selectedClassId || !sessionDate) return;

    const existing = attendance.filter(
      (a) => a.classId === selectedClassId && a.sessionDate === sessionDate
    );

    const initialMap: Record<string, Partial<AttendanceRecord>> = {};

    classStudents.forEach((st) => {
      const rec = existing.find((e) => e.studentId === st.id);
      if (rec) {
        initialMap[st.id] = { ...rec };
      } else {
        initialMap[st.id] = {
          studentId: st.id,
          classId: selectedClassId,
          sessionDate,
          status: 'present',
          homeworkDone: true,
          attitudeRating: 5,
          teacherNote: '',
          recordedBy: currentTeacher?.name || 'Giáo viên',
        };
      }
    });

    setRecords(initialMap);
  }, [selectedClassId, sessionDate, attendance, currentClass]);

  if (!isOpen) return null;

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleHomeworkToggle = (studentId: string) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        homeworkDone: !prev[studentId]?.homeworkDone,
      },
    }));
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        teacherNote: note,
      },
    }));
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, Partial<AttendanceRecord>> = {};
    classStudents.forEach((st) => {
      updated[st.id] = {
        ...records[st.id],
        studentId: st.id,
        classId: selectedClassId,
        sessionDate,
        status: 'present',
        homeworkDone: true,
        attitudeRating: 5,
      };
    });
    setRecords(updated);
  };

  const handleSaveAttendance = () => {
    if (!currentClass) return;

    const recordList: AttendanceRecord[] = classStudents.map((st) => {
      const r = records[st.id];
      return {
        id: r?.id || `att-${Date.now()}-${st.id}`,
        classId: selectedClassId,
        sessionDate,
        studentId: st.id,
        status: r?.status || 'present',
        homeworkDone: r?.homeworkDone ?? true,
        attitudeRating: r?.attitudeRating ?? 5,
        teacherNote: r?.teacherNote || '',
        recordedAt: new Date().toLocaleString('vi-VN'),
        recordedBy: currentTeacher?.name || 'Giáo viên',
      };
    });

    saveAttendanceBatch(recordList);

    // Auto generate notification logs for parents
    recordList.forEach((rec) => {
      const st = students.find((s) => s.id === rec.studentId);
      if (st) {
        const statusText =
          rec.status === 'present'
            ? 'Có mặt'
            : rec.status === 'late'
            ? 'Đi muộn'
            : rec.status === 'absent_excused'
            ? 'Nghỉ có phép'
            : 'Vắng không phép';

        const msg = `Kính gửi PH ${st.parentName}, Trung tâm thông báo tình hình buổi học ${sessionDate} của học sinh ${st.name} (Lớp ${currentClass.name}): Điểm danh: ${statusText} | BTVN: ${rec.homeworkDone ? 'Đầy đủ' : 'Chưa hoàn thành'} | Nhận xét: ${rec.teacherNote || 'Học tập tích cực'}. Trân trọng!`;

        sendNotification({
          studentId: st.id,
          parentPhone: st.parentPhone,
          type: 'attendance',
          message: msg,
          channel: 'Zalo',
        });
      }
    });

    alert('Đã lưu điểm danh và đồng bộ thông báo thành công!');
    onClose();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const presentCount = Object.values(records).filter((r) => r.status === 'present').length;
  const lateCount = Object.values(records).filter((r) => r.status === 'late').length;
  const absentCount = Object.values(records).filter((r) => r.status?.includes('absent')).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Sổ Điểm Danh & Nhật Ký Ca Học
              </h3>
              <p className="text-xs text-slate-500">
                Ghi nhận chuyên cần, làm bài tập về nhà và tự động gửi tin nhắn cho Phụ Huynh
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

        {/* Filters: Select Class & Date */}
        <div className="p-4 bg-slate-50/40 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Chọn Lớp Học *</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium outline-none focus:border-blue-500"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.code} - {cls.name} ({cls.studentIds.length} HS)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Ngày Buổi Học *</label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="w-full py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Tất Cả Có Mặt & Đầy Đủ</span>
            </button>
          </div>
        </div>

        {/* Summary Metric Strip */}
        <div className="px-6 py-2 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-3">
            <span>Sĩ số: <strong className="text-slate-900 font-mono">{classStudents.length} HS</strong></span>
            <span>·</span>
            <span className="text-emerald-700 font-medium">Có mặt: <strong className="font-mono">{presentCount}</strong></span>
            <span>·</span>
            <span className="text-purple-700 font-medium">Đi muộn: <strong className="font-mono">{lateCount}</strong></span>
            <span>·</span>
            <span className="text-rose-700 font-medium">Vắng: <strong className="font-mono">{absentCount}</strong></span>
          </div>

          <button
            onClick={() => setShowZaloPreview(!showZaloPreview)}
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{showZaloPreview ? 'Ẩn Mẫu Tin Nhắn Phụ Huynh' : 'Xem Tin Nhắn Zalo Phụ Huynh'}</span>
          </button>
        </div>

        {/* Table Student Attendance List */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          {showZaloPreview ? (
            /* Zalo / SMS Message preview container */
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">
                <strong>Xem trước nội dung tin nhắn gửi Phụ Huynh qua Zalo / SMS:</strong> Bạn có thể sao chép nhanh từng tin để gửi trực tiếp.
              </div>
              <div className="space-y-2.5">
                {classStudents.map((st) => {
                  const rec = records[st.id];
                  const statusText =
                    rec?.status === 'present'
                      ? 'Có mặt'
                      : rec?.status === 'late'
                      ? 'Đi muộn'
                      : rec?.status === 'absent_excused'
                      ? 'Nghỉ có phép'
                      : 'Vắng không phép';

                  const msg = `Kính gửi Phụ huynh em ${st.name},\nTrung tâm ${settings.centerName.split('(')[0].trim()} xin thông báo tình hình buổi học ngày ${sessionDate} lớp ${currentClass?.name}:\n- Điểm danh: ${statusText}\n- Làm bài tập về nhà: ${rec?.homeworkDone ? 'Đầy đủ' : 'Chưa hoàn thành'}\n- Nhận xét: ${rec?.teacherNote || 'Tiếp thu bài tốt, có ý thức học tập cao'}.\nTrân trọng cảm ơn Phụ huynh!`;

                  return (
                    <div key={st.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900">
                          {st.name} <span className="font-normal text-slate-500 font-mono">({st.parentName} - {st.parentPhone})</span>
                        </div>
                        <pre className="mt-1 font-sans text-slate-700 whitespace-pre-wrap leading-relaxed text-[11px] bg-white p-2 rounded border border-slate-200">
                          {msg}
                        </pre>
                      </div>
                      <button
                        onClick={() => copyToClipboard(msg, st.id)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                      >
                        {copiedId === st.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Đã chép
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Sao chép
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="px-3 py-2.5">Học Sinh</th>
                    <th className="px-3 py-2.5">Trạng Thái Điểm Danh</th>
                    <th className="px-3 py-2.5 text-center">Làm BTVN</th>
                    <th className="px-3 py-2.5">Nhận Xét Của Thầy/Cô</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {classStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                        Lớp học chưa có học sinh nào.
                      </td>
                    </tr>
                  ) : (
                    classStudents.map((st) => {
                      const rec = records[st.id] || { status: 'present', homeworkDone: true };
                      const currentStatus = rec.status || 'present';

                      return (
                        <tr key={st.id} className="hover:bg-slate-50/80">
                          <td className="px-3 py-2.5">
                            <div className="font-bold text-slate-900">{st.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {st.code} · {st.school}
                            </div>
                          </td>

                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(st.id, 'present')}
                                className={`px-2 py-1 rounded font-medium text-xs transition-all ${
                                  currentStatus === 'present'
                                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                Có mặt
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(st.id, 'late')}
                                className={`px-2 py-1 rounded font-medium text-xs transition-all ${
                                  currentStatus === 'late'
                                    ? 'bg-purple-600 text-white font-bold shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                Đi muộn
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(st.id, 'absent_excused')}
                                className={`px-2 py-1 rounded font-medium text-xs transition-all ${
                                  currentStatus === 'absent_excused'
                                    ? 'bg-amber-500 text-white font-bold shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                Phép
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(st.id, 'absent_unexcused')}
                                className={`px-2 py-1 rounded font-medium text-xs transition-all ${
                                  currentStatus === 'absent_unexcused'
                                    ? 'bg-rose-600 text-white font-bold shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                Không phép
                              </button>
                            </div>
                          </td>

                          <td className="px-3 py-2.5 text-center">
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={rec.homeworkDone ?? true}
                                onChange={() => handleHomeworkToggle(st.id)}
                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                              />
                            </label>
                          </td>

                          <td className="px-3 py-2.5">
                            <input
                              type="text"
                              value={rec.teacherNote || ''}
                              onChange={(e) => handleNoteChange(st.id, e.target.value)}
                              placeholder="Nhận xét thái độ, bài làm..."
                              className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-md outline-none focus:border-blue-500"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/70 text-xs">
          <div className="text-slate-500 text-[11px]">
            GV phụ trách: <strong>{currentTeacher?.name}</strong> · Phòng: <strong>{currentRoom?.name}</strong>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSaveAttendance}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Điểm Danh & Gửi Tin Nhắn</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
