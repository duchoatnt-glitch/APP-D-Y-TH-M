import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { ClassRoom, ClassSessionSchedule, ClassSession } from '../../types/index.ts';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  CalendarCheck,
  RotateCcw,
  Sparkles,
  User,
} from 'lucide-react';
import { getDayOfWeekName } from '../../utils/formatters.ts';

interface ClassScheduleRescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  cls: ClassRoom | null;
  defaultMode?: 'reschedule_single' | 'change_weekly_schedule';
}

export const ClassScheduleRescheduleModal: React.FC<ClassScheduleRescheduleModalProps> = ({
  isOpen,
  onClose,
  cls,
  defaultMode = 'reschedule_single',
}) => {
  const {
    teachers,
    rooms,
    subjects,
    updateClassScheduleWithEffectiveDate,
    addSession,
    sendNotification,
    students,
  } = useApp();

  const [mode, setMode] = useState<'reschedule_single' | 'change_weekly_schedule'>(defaultMode);

  // Mode 1: Dạy Bù / Thay thế cho 1 buổi cụ thể
  const [makeupDate, setMakeupDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [makeupStartTime, setMakeupStartTime] = useState('17:45');
  const [makeupEndTime, setMakeupEndTime] = useState('19:30');
  const [makeupRoomId, setMakeupRoomId] = useState('');
  const [makeupTeacherId, setMakeupTeacherId] = useState('');
  const [makeupReason, setMakeupReason] = useState('Dạy bù cho buổi nghỉ lễ / lịch đột xuất');
  const [makeupType, setMakeupType] = useState<'makeup' | 'extra'>('makeup');
  const [notifyParents, setNotifyParents] = useState(true);

  // Mode 2: Đổi Lịch Học Định Kỳ (Áp Dụng Từ Ngày)
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [declaredBy, setDeclaredBy] = useState('');
  const [scheduleReason, setScheduleReason] = useState('Điều chỉnh thời khóa biểu định kỳ theo học kỳ mới');
  const [weeklySchedules, setWeeklySchedules] = useState<ClassSessionSchedule[]>([]);

  useEffect(() => {
    if (cls) {
      setMakeupRoomId(cls.roomId);
      setMakeupTeacherId(cls.teacherId);
      const teacher = teachers.find((t) => t.id === cls.teacherId);
      setDeclaredBy(teacher?.name || 'Giáo viên bộ môn');

      if (cls.weeklySchedules && cls.weeklySchedules.length > 0) {
        setWeeklySchedules(
          cls.weeklySchedules.map((s, idx) => ({
            ...s,
            id: s.id || `ws-${idx}-${Date.now()}`,
          }))
        );
      } else if (cls.daysOfWeek && cls.daysOfWeek.length > 0) {
        setWeeklySchedules(
          cls.daysOfWeek.map((day, idx) => ({
            id: `ws-${idx}-${Date.now()}`,
            dayOfWeek: day,
            startTime: cls.timeSlot?.start || '17:45',
            endTime: cls.timeSlot?.end || '19:30',
            roomId: cls.roomId,
          }))
        );
      } else {
        setWeeklySchedules([
          { id: '1', dayOfWeek: 2, startTime: '17:45', endTime: '19:30', roomId: cls.roomId },
          { id: '2', dayOfWeek: 5, startTime: '17:45', endTime: '19:30', roomId: cls.roomId },
        ]);
      }
    }
  }, [cls, teachers]);

  if (!isOpen || !cls) return null;

  const currentTeacher = teachers.find((t) => t.id === cls.teacherId);
  const currentSubject = subjects.find((s) => s.id === cls.subjectId);

  // Handle adding makeup session
  const handleSubmitMakeup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!makeupDate || !makeupStartTime || !makeupEndTime) {
      alert('Vui lòng nhập đầy đủ ngày và giờ dạy bù!');
      return;
    }

    const newSession: ClassSession = {
      id: `session-makeup-${Date.now()}`,
      classId: cls.id,
      subjectId: cls.subjectId,
      date: makeupDate,
      startTime: makeupStartTime,
      endTime: makeupEndTime,
      roomId: makeupRoomId || cls.roomId,
      teacherId: makeupTeacherId || cls.teacherId,
      topic: `${makeupType === 'makeup' ? 'Dạy bù' : 'Học tăng cường'}: ${makeupReason}`,
      type: makeupType,
      remindMinutesBefore: 60,
      reminderSent: false,
    };

    addSession(newSession);

    // Send notifications if checked
    if (notifyParents) {
      const enrolledStudents = students.filter((s) => cls.studentIds.includes(s.id));
      enrolledStudents.forEach((st) => {
        sendNotification({
          studentId: st.id,
          parentPhone: st.parentPhone || st.phone,
          type: 'reminder',
          channel: 'Zalo',
          message: `Lớp ${cls.code} (${cls.name}) có lịch ${makeupType === 'makeup' ? 'dạy bù' : 'tăng cường'} vào ngày ${makeupDate} (${makeupStartTime} - ${makeupEndTime}) tại phòng ${rooms.find((r) => r.id === (makeupRoomId || cls.roomId))?.name || 'Phòng học'}. Lý do: ${makeupReason}.`,
        });
      });
    }

    alert(`Đã xếp thành công buổi ${makeupType === 'makeup' ? 'dạy bù' : 'tăng cường'} ngày ${makeupDate} cho lớp ${cls.name}! Lịch học đầu năm của lớp không bị thay đổi.`);
    onClose();
  };

  // Handle changing weekly schedule with effective date
  const handleSubmitScheduleChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveDate) {
      alert('Vui lòng chọn ngày bắt đầu áp dụng lịch mới!');
      return;
    }
    if (weeklySchedules.length === 0) {
      alert('Vui lòng thiết lập ít nhất 1 buổi học trong tuần!');
      return;
    }

    const daysOfWeek = Array.from(new Set(weeklySchedules.map((s) => s.dayOfWeek))).sort();
    const primarySlot = {
      start: weeklySchedules[0]?.startTime || '17:45',
      end: weeklySchedules[0]?.endTime || '19:30',
    };

    updateClassScheduleWithEffectiveDate(
      cls.id,
      effectiveDate,
      {
        daysOfWeek,
        timeSlot: primarySlot,
        weeklySchedules,
        roomId: weeklySchedules[0]?.roomId || cls.roomId,
      },
      declaredBy || currentTeacher?.name || 'Giáo viên',
      scheduleReason || 'Đổi lịch học theo yêu cầu'
    );

    alert(`Đã cập nhật lịch học mới cho lớp ${cls.name} (Áp dụng từ ngày ${effectiveDate}). Các buổi học và điểm danh trước ngày ${effectiveDate} được bảo lưu an toàn!`);
    onClose();
  };

  const dayOptions = [
    { num: 2, label: 'Thứ 2' },
    { num: 3, label: 'Thứ 3' },
    { num: 4, label: 'Thứ 4' },
    { num: 5, label: 'Thứ 5' },
    { num: 6, label: 'Thứ 6' },
    { num: 7, label: 'Thứ 7' },
    { num: 8, label: 'Chủ Nhật' },
  ];

  const handleAddSessionRow = () => {
    const existingDays = weeklySchedules.map((s) => s.dayOfWeek);
    let nextDay = 2;
    for (let d = 2; d <= 8; d++) {
      if (!existingDays.includes(d)) {
        nextDay = d;
        break;
      }
    }
    const last = weeklySchedules[weeklySchedules.length - 1];
    setWeeklySchedules([
      ...weeklySchedules,
      {
        id: `ws-${Date.now()}`,
        dayOfWeek: nextDay,
        startTime: last?.startTime || '17:45',
        endTime: last?.endTime || '19:30',
        roomId: cls.roomId,
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-2xs">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Thay Đổi Lịch Học & Xếp Lịch Dạy Bù
              </h3>
              <p className="text-xs text-slate-500">
                Lớp: <strong className="text-blue-700">{cls.code} - {cls.name}</strong> · GV: {currentTeacher?.name}
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

        {/* Tab Selection Mode */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode('reschedule_single')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              mode === 'reschedule_single'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>1. Xếp Lịch Dạy Bù / Thay Thế 1 Buổi (Không đổi lịch cả năm)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('change_weekly_schedule')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              mode === 'change_weekly_schedule'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>2. Đổi Lịch Học Định Kỳ (Áp dụng từ ngày)</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {mode === 'reschedule_single' ? (
            <form onSubmit={handleSubmitMakeup} className="space-y-4">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Chức năng Dạy Bù / Thay Thế Buổi Học:</strong> Cho phép giáo viên xếp một ca học bù hoặc học tăng cường riêng lẻ mà KHÔNG làm xáo trộn thời khóa biểu cố định đầu năm học của cả lớp.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Loại Buổi Học *</label>
                  <select
                    value={makeupType}
                    onChange={(e) => setMakeupType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="makeup">Dạy bù (Bù cho buổi nghỉ / lễ / đột xuất)</option>
                    <option value="extra">Học tăng cường / Ôn thi cấp tốc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Ngày Dạy Bù / Thay Thế *</label>
                  <input
                    type="date"
                    value={makeupDate}
                    onChange={(e) => setMakeupDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Giờ Bắt Đầu *</label>
                  <input
                    type="text"
                    value={makeupStartTime}
                    onChange={(e) => setMakeupStartTime(e.target.value)}
                    placeholder="17:45"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-800 outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Giờ Kết Thúc *</label>
                  <input
                    type="text"
                    value={makeupEndTime}
                    onChange={(e) => setMakeupEndTime(e.target.value)}
                    placeholder="19:30"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-800 outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phòng Học</label>
                  <select
                    value={makeupRoomId}
                    onChange={(e) => setMakeupRoomId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 outline-none focus:border-blue-500"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.floor})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Giáo Viên Dạy</label>
                  <select
                    value={makeupTeacherId}
                    onChange={(e) => setMakeupTeacherId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 outline-none focus:border-blue-500"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Lý Do Dạy Bù / Thay Thế *</label>
                <input
                  type="text"
                  value={makeupReason}
                  onChange={(e) => setMakeupReason(e.target.value)}
                  placeholder="VD: Bù buổi nghỉ 02/09, Bù buổi cô giáo bận hội thảo, Ôn thi giữa kỳ..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 outline-none focus:border-blue-500 font-medium"
                  required
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyParents}
                    onChange={(e) => setNotifyParents(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span>Tự động gửi thông báo lịch dạy bù qua Zalo/SMS cho {cls.studentIds.length} phụ huynh lớp này</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Xác Nhận Xếp Lịch Dạy Bù</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmitScheduleChange} className="space-y-4">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Bảo Lưu Dữ Liệu Lịch Sử:</strong> Khi đổi lịch học áp dụng từ ngày cụ thể, toàn bộ dữ liệu điểm danh, bài kiểm tra và lịch học các tuần trước ngày áp dụng sẽ được <strong>giữ nguyên vẹn 100%</strong>, không bị xáo trộn.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Áp Dụng Lịch Mới Từ Ngày *
                  </label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-blue-800 outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Người Kê Khai Sửa Lịch</label>
                  <input
                    type="text"
                    value={declaredBy}
                    onChange={(e) => setDeclaredBy(e.target.value)}
                    placeholder="Tên giáo viên / Quản lý"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Lý Do Điều Chỉnh Lịch Học</label>
                <input
                  type="text"
                  value={scheduleReason}
                  onChange={(e) => setScheduleReason(e.target.value)}
                  placeholder="VD: Điều chỉnh theo thời khóa biểu học kỳ mới của trường phổ thông..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              {/* Weekly sessions editor */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                  <span>Khung Giờ Học Mới Hàng Tuần (Từ ngày {effectiveDate})</span>
                  <button
                    type="button"
                    onClick={handleAddSessionRow}
                    className="text-blue-700 hover:text-blue-800 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm buổi</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {weeklySchedules.map((ws, idx) => (
                    <div
                      key={ws.id || idx}
                      className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg shadow-2xs"
                    >
                      <span className="w-14 font-bold text-slate-700 text-xs">Buổi {idx + 1}:</span>

                      <select
                        value={ws.dayOfWeek}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setWeeklySchedules((prev) =>
                            prev.map((s, i) => (i === idx ? { ...s, dayOfWeek: val } : s))
                          );
                        }}
                        className="px-2.5 py-1.5 border border-slate-300 rounded font-semibold text-slate-800 outline-none"
                      >
                        {dayOptions.map((d) => (
                          <option key={d.num} value={d.num}>
                            {d.label}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={ws.startTime}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWeeklySchedules((prev) =>
                              prev.map((s, i) => (i === idx ? { ...s, startTime: val } : s))
                            );
                          }}
                          placeholder="17:45"
                          className="w-20 px-2 py-1.5 border border-slate-300 rounded font-mono text-center outline-none"
                        />
                        <span>-</span>
                        <input
                          type="text"
                          value={ws.endTime}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWeeklySchedules((prev) =>
                              prev.map((s, i) => (i === idx ? { ...s, endTime: val } : s))
                            );
                          }}
                          placeholder="19:30"
                          className="w-20 px-2 py-1.5 border border-slate-300 rounded font-mono text-center outline-none"
                        />
                      </div>

                      <select
                        value={ws.roomId || cls.roomId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWeeklySchedules((prev) =>
                            prev.map((s, i) => (i === idx ? { ...s, roomId: val } : s))
                          );
                        }}
                        className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-slate-600 outline-none text-[11px]"
                      >
                        {rooms.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          if (weeklySchedules.length <= 1) return;
                          setWeeklySchedules((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        disabled={weeklySchedules.length <= 1}
                        className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Schedule history if exists */}
              {cls.scheduleHistory && cls.scheduleHistory.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="font-semibold text-slate-700 text-xs">Lịch Sử Các Lần Thay Đổi Lịch:</span>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto">
                    {cls.scheduleHistory.map((h, i) => (
                      <div key={h.id || i} className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100 flex justify-between items-center">
                        <div>
                          <strong className="text-blue-700">Áp dụng từ: {h.effectiveDate}</strong> · Lý do: {h.reason}
                        </div>
                        <div className="text-slate-400 font-mono">{h.declaredBy}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Áp Dụng Lịch Mới Từ {effectiveDate}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
