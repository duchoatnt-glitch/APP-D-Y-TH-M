import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { ClassRoom, GradeLevel, ClassSessionSchedule } from '../../types/index.ts';
import {
  X,
  Save,
  Plus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Building,
  RotateCcw,
  CalendarCheck,
} from 'lucide-react';
import { getDayOfWeekName } from '../../utils/formatters.ts';
import { RoomManagementModal } from './RoomManagementModal.tsx';
import { ClassScheduleRescheduleModal } from './ClassScheduleRescheduleModal.tsx';

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingClass?: ClassRoom | null;
}

export const ClassModal: React.FC<ClassModalProps> = ({
  isOpen,
  onClose,
  editingClass,
}) => {
  const { subjects, teachers, rooms, addClass, updateClass } = useApp();

  const [formData, setFormData] = useState<Partial<ClassRoom>>({
    code: '',
    name: '',
    subjectId: subjects[0]?.id || '',
    gradeLevel: '12',
    teacherId: teachers[0]?.id || '',
    roomId: rooms[0]?.id || '',
    studentIds: [],
    status: 'active',
    startDate: new Date().toISOString().split('T')[0],
    scheduleEffectiveDate: new Date().toISOString().split('T')[0],
    note: '',
  });

  // State for session-by-session weekly schedule
  const [weeklySchedules, setWeeklySchedules] = useState<ClassSessionSchedule[]>([
    { id: '1', dayOfWeek: 2, startTime: '17:45', endTime: '19:30' },
    { id: '2', dayOfWeek: 5, startTime: '17:45', endTime: '19:30' },
  ]);

  // Modal states for Room Management & Reschedule/Makeup
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);

  useEffect(() => {
    if (editingClass) {
      setFormData(editingClass);
      if (editingClass.weeklySchedules && editingClass.weeklySchedules.length > 0) {
        setWeeklySchedules(
          editingClass.weeklySchedules.map((s, idx) => ({
            ...s,
            id: s.id || `session-${idx}-${Date.now()}`,
          }))
        );
      } else if (editingClass.daysOfWeek && editingClass.daysOfWeek.length > 0) {
        setWeeklySchedules(
          editingClass.daysOfWeek.map((day, idx) => ({
            id: `session-${idx}-${Date.now()}`,
            dayOfWeek: day,
            startTime: editingClass.timeSlot?.start || '17:45',
            endTime: editingClass.timeSlot?.end || '19:30',
            roomId: editingClass.roomId,
          }))
        );
      } else {
        setWeeklySchedules([
          { id: '1', dayOfWeek: 2, startTime: '17:45', endTime: '19:30' },
          { id: '2', dayOfWeek: 5, startTime: '17:45', endTime: '19:30' },
        ]);
      }
    } else {
      setFormData({
        code: `CLS-${Math.floor(1000 + Math.random() * 9000)}`,
        name: '',
        subjectId: subjects[0]?.id || '',
        gradeLevel: '12',
        teacherId: teachers[0]?.id || '',
        roomId: rooms[0]?.id || '',
        studentIds: [],
        status: 'active',
        startDate: new Date().toISOString().split('T')[0],
        scheduleEffectiveDate: new Date().toISOString().split('T')[0],
        note: '',
      });
      setWeeklySchedules([
        { id: '1', dayOfWeek: 2, startTime: '17:45', endTime: '19:30' },
        { id: '2', dayOfWeek: 5, startTime: '17:45', endTime: '19:30' },
      ]);
    }
  }, [editingClass, isOpen, subjects, teachers, rooms]);

  if (!isOpen) return null;

  const handleAddSession = () => {
    const existingDays = weeklySchedules.map((s) => s.dayOfWeek);
    let nextDay = 2;
    for (let d = 2; d <= 8; d++) {
      if (!existingDays.includes(d)) {
        nextDay = d;
        break;
      }
    }
    const lastSession = weeklySchedules[weeklySchedules.length - 1];
    setWeeklySchedules([
      ...weeklySchedules,
      {
        id: `session-${Date.now()}`,
        dayOfWeek: nextDay,
        startTime: lastSession?.startTime || '17:45',
        endTime: lastSession?.endTime || '19:30',
        roomId: '',
      },
    ]);
  };

  const handleRemoveSession = (id?: string) => {
    if (weeklySchedules.length <= 1) {
      alert('Lớp học cần có ít nhất 1 buổi học trong tuần!');
      return;
    }
    setWeeklySchedules((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSessionChange = (id: string | undefined, field: keyof ClassSessionSchedule, val: any) => {
    setWeeklySchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: val } : s))
    );
  };

  const applyPreset = (days: number[], start: string, end: string) => {
    setWeeklySchedules(
      days.map((day, idx) => ({
        id: `preset-${idx}-${Date.now()}`,
        dayOfWeek: day,
        startTime: start,
        endTime: end,
        roomId: formData.roomId || '',
      }))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      alert('Vui lòng nhập tên lớp và mã lớp!');
      return;
    }

    if (weeklySchedules.length === 0) {
      alert('Vui lòng thêm ít nhất 1 buổi học trong tuần!');
      return;
    }

    const daysOfWeek = Array.from(new Set(weeklySchedules.map((s) => s.dayOfWeek))).sort();
    const primarySlot = {
      start: weeklySchedules[0]?.startTime || '17:45',
      end: weeklySchedules[0]?.endTime || '19:30',
    };

    const finalPayload: Partial<ClassRoom> = {
      ...formData,
      daysOfWeek,
      timeSlot: primarySlot,
      weeklySchedules,
      scheduleEffectiveDate: formData.scheduleEffectiveDate || formData.startDate || new Date().toISOString().split('T')[0],
    };

    delete finalPayload.sessionFee;
    delete finalPayload.maxCapacity;

    if (editingClass) {
      updateClass(editingClass.id, finalPayload);
    } else {
      addClass({
        ...finalPayload as ClassRoom,
        id: `cls-${Date.now()}`,
        studentIds: formData.studentIds || [],
      });
    }
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

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {editingClass ? 'Chỉnh Sửa Thông Tin Lớp Học' : 'Mở Lớp Học Mới'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Thiết lập thông tin môn học, giáo viên, phòng, lịch từng buổi học và ngày áp dụng.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
            {/* Quick action bar if editing existing class */}
            {editingClass && (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 text-blue-900">
                  <CalendarCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    <strong>Cần dạy bù hoặc đổi lịch đặc biệt?</strong> Giáo viên có thể xếp lịch bù riêng lẻ cho một buổi mà không làm xáo trộn lịch đầu năm.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRescheduleModalOpen(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shrink-0 shadow-xs transition-colors cursor-pointer"
                >
                  Xếp Lịch Dạy Bù / Đổi Lịch
                </button>
              </div>
            )}

            {/* Row 1: Code & Grade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mã Lớp Học *</label>
                <input
                  type="text"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-mono"
                  placeholder="VD: T12-VIP01"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Khối Lớp *</label>
                <select
                  value={formData.gradeLevel || '12'}
                  onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value as GradeLevel })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                >
                  <option value="6">Khối 6</option>
                  <option value="7">Khối 7</option>
                  <option value="8">Khối 8</option>
                  <option value="9">Khối 9 (Ôn vào 10)</option>
                  <option value="10">Khối 10</option>
                  <option value="11">Khối 11</option>
                  <option value="12">Khối 12 (Luyện thi THPTQG)</option>
                  <option value="Ôn Chuyên">Ôn Chuyên Toán/Lý/Hóa/Văn/Anh</option>
                  <option value="IELTS">IELTS Intensive</option>
                  <option value="Luyện Thi ĐH">Đánh Giá Năng Lực ĐHQG/ĐHBK</option>
                </select>
              </div>
            </div>

            {/* Row 2: Name */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Tên Lớp Học *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-medium"
                placeholder="VD: Toán 12 Nâng Cao & Đích 9+ THPTQG"
                required
              />
            </div>

            {/* Row 3: Subject, Teacher, Room */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Môn Học *</label>
                <select
                  value={formData.subjectId || ''}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Giáo Viên Phụ Trách *</label>
                <select
                  value={formData.teacherId || ''}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold">Phòng Học Chính *</label>
                  <button
                    type="button"
                    onClick={() => setIsRoomModalOpen(true)}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5 cursor-pointer"
                  >
                    <Building className="w-3 h-3" />
                    <span>+ Thêm/Sửa phòng</span>
                  </button>
                </div>
                <select
                  value={formData.roomId || ''}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.floor})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section: Sửa Lịch Học Từng Buổi Trong Tuần */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Lịch Học Trong Tuần (Tùy Chỉnh Giờ & Thứ Của Từng Buổi) *
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Mỗi buổi học có thể linh hoạt chọn ngày trong tuần, giờ bắt đầu và giờ kết thúc riêng biệt.
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-medium">Mẫu nhanh:</span>
                  <button
                    type="button"
                    onClick={() => applyPreset([2, 5], '17:45', '19:30')}
                    className="px-2 py-0.5 text-[10px] bg-white border border-slate-200 hover:border-blue-400 text-slate-700 rounded transition-colors cursor-pointer"
                  >
                    T2 - T5 (17:45)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset([3, 6], '19:45', '21:30')}
                    className="px-2 py-0.5 text-[10px] bg-white border border-slate-200 hover:border-blue-400 text-slate-700 rounded transition-colors cursor-pointer"
                  >
                    T3 - T6 (19:45)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset([7, 8], '08:00', '10:00')}
                    className="px-2 py-0.5 text-[10px] bg-white border border-slate-200 hover:border-blue-400 text-slate-700 rounded transition-colors cursor-pointer"
                  >
                    T7 - CN (Sáng)
                  </button>
                </div>
              </div>

              {/* List of Sessions */}
              <div className="space-y-2 pt-1">
                {weeklySchedules.map((session, index) => (
                  <div
                    key={session.id || index}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg shadow-2xs"
                  >
                    {/* Session Badge */}
                    <div className="w-16 shrink-0 font-bold text-blue-700 text-xs flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Buổi {index + 1}:</span>
                    </div>

                    {/* Day of Week */}
                    <div className="flex-1 sm:w-36">
                      <select
                        value={session.dayOfWeek}
                        onChange={(e) =>
                          handleSessionChange(session.id, 'dayOfWeek', Number(e.target.value))
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-semibold text-slate-800 bg-white outline-none focus:border-blue-500"
                      >
                        {dayOptions.map((d) => (
                          <option key={d.num} value={d.num}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Start Time */}
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 text-[11px]">Từ:</span>
                      <input
                        type="text"
                        value={session.startTime}
                        onChange={(e) =>
                          handleSessionChange(session.id, 'startTime', e.target.value)
                        }
                        placeholder="17:45"
                        className="w-20 px-2 py-1.5 border border-slate-300 rounded-md font-mono text-center outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* End Time */}
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 text-[11px]">Đến:</span>
                      <input
                        type="text"
                        value={session.endTime}
                        onChange={(e) =>
                          handleSessionChange(session.id, 'endTime', e.target.value)
                        }
                        placeholder="19:30"
                        className="w-20 px-2 py-1.5 border border-slate-300 rounded-md font-mono text-center outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Room Override (Optional) */}
                    <div className="flex-1 sm:min-w-[120px]">
                      <select
                        value={session.roomId || ''}
                        onChange={(e) =>
                          handleSessionChange(session.id, 'roomId', e.target.value)
                        }
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-[11px] text-slate-600 bg-slate-50 outline-none"
                      >
                        <option value="">Phòng mặc định ({rooms.find(r => r.id === formData.roomId)?.name || 'Chính'})</option>
                        {rooms.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Delete Session Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveSession(session.id)}
                      disabled={weeklySchedules.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 rounded-md transition-colors cursor-pointer"
                      title="Xóa buổi này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Session Button */}
              <div className="pt-2 flex justify-start">
                <button
                  type="button"
                  onClick={handleAddSession}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm buổi học trong tuần</span>
                </button>
              </div>
            </div>

            {/* Row 4: Start Date & Schedule Effective Date & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-blue-950 font-bold mb-1">
                  Ngày Khai Giảng (Mốc Tuần 1):
                </label>
                <input
                  type="date"
                  value={formData.startDate || '2026-09-07'}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-blue-300 bg-blue-50/40 rounded-lg outline-none font-bold text-blue-900"
                />
                <span className="text-[10px] text-blue-700 mt-0.5 block">
                  Đồng nhất là <strong>Tuần 1</strong> khi xếp thời khóa biểu
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Lịch Áp Dụng Từ Ngày *
                </label>
                <input
                  type="date"
                  value={formData.scheduleEffectiveDate || formData.startDate || ''}
                  onChange={(e) => setFormData({ ...formData, scheduleEffectiveDate: e.target.value })}
                  className="w-full px-3 py-2 border border-blue-300 bg-blue-50/40 rounded-lg outline-none font-bold text-blue-900"
                  title="Các buổi học trước ngày này không bị ảnh hưởng khi sửa lịch"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Đồng nhất theo năm học</span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Trạng Thái Lớp</label>
                <select
                  value={formData.status || 'active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                >
                  <option value="active">Đang giảng dạy (Active)</option>
                  <option value="upcoming">Sắp khai giảng</option>
                  <option value="completed">Đã kết thúc khóa học</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Ghi Chú & Mục Tiêu Khóa Học</label>
              <textarea
                rows={2}
                value={formData.note || ''}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                placeholder="VD: Lớp trọng điểm ôn thi 9+ Đại học, có kiểm tra định kỳ hàng tuần..."
              />
            </div>

            {/* Submit buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{editingClass ? 'Lưu Thay Đổi' : 'Tạo Lớp Học'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Room Management Modal */}
      {isRoomModalOpen && (
        <RoomManagementModal
          isOpen={isRoomModalOpen}
          onClose={() => setIsRoomModalOpen(false)}
          onSelectRoom={(newRoomId) => setFormData((prev) => ({ ...prev, roomId: newRoomId }))}
        />
      )}

      {/* Reschedule / Makeup Modal */}
      {isRescheduleModalOpen && editingClass && (
        <ClassScheduleRescheduleModal
          isOpen={isRescheduleModalOpen}
          onClose={() => setIsRescheduleModalOpen(false)}
          cls={editingClass}
        />
      )}
    </>
  );
};
