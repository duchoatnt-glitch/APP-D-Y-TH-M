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
  GraduationCap,
} from 'lucide-react';
import { getDayOfWeekName } from '../../utils/formatters.ts';

interface TimetableScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingClass?: ClassRoom | null;
  defaultGradeLevel?: GradeLevel;
  defaultDayOfWeek?: number;
}

export const TimetableScheduleModal: React.FC<TimetableScheduleModalProps> = ({
  isOpen,
  onClose,
  editingClass,
  defaultGradeLevel = '12',
  defaultDayOfWeek = 2,
}) => {
  const { subjects, teachers, rooms, addClass, updateClass } = useApp();

  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(defaultGradeLevel);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [teacherId, setTeacherId] = useState(teachers[0]?.id || '');
  const [roomId, setRoomId] = useState(rooms[0]?.id || '');
  const [note, setNote] = useState('');

  // Weekly sessions
  const [sessions, setSessions] = useState<ClassSessionSchedule[]>([
    { id: '1', dayOfWeek: defaultDayOfWeek, startTime: '17:45', endTime: '19:30' },
  ]);

  useEffect(() => {
    if (editingClass) {
      setGradeLevel(editingClass.gradeLevel);
      setCode(editingClass.code);
      setName(editingClass.name);
      setSubjectId(editingClass.subjectId);
      setTeacherId(editingClass.teacherId);
      setRoomId(editingClass.roomId);
      setNote(editingClass.note || '');

      if (editingClass.weeklySchedules && editingClass.weeklySchedules.length > 0) {
        setSessions(
          editingClass.weeklySchedules.map((s, idx) => ({
            ...s,
            id: s.id || `s-${idx}-${Date.now()}`,
          }))
        );
      } else if (editingClass.daysOfWeek && editingClass.daysOfWeek.length > 0) {
        setSessions(
          editingClass.daysOfWeek.map((day, idx) => ({
            id: `s-${idx}-${Date.now()}`,
            dayOfWeek: day,
            startTime: editingClass.timeSlot?.start || '17:45',
            endTime: editingClass.timeSlot?.end || '19:30',
            roomId: editingClass.roomId,
          }))
        );
      } else {
        setSessions([
          { id: '1', dayOfWeek: 2, startTime: '17:45', endTime: '19:30' },
        ]);
      }
    } else {
      setGradeLevel(defaultGradeLevel);
      setCode(`TKB-${defaultGradeLevel}-${Math.floor(100 + Math.random() * 900)}`);
      setName('');
      setSubjectId(subjects[0]?.id || '');
      setTeacherId(teachers[0]?.id || '');
      setRoomId(rooms[0]?.id || '');
      setNote('');
      setSessions([
        { id: '1', dayOfWeek: defaultDayOfWeek, startTime: '17:45', endTime: '19:30' },
      ]);
    }
  }, [editingClass, isOpen, defaultGradeLevel, defaultDayOfWeek, subjects, teachers, rooms]);

  if (!isOpen) return null;

  const handleAddSession = () => {
    const existingDays = sessions.map((s) => s.dayOfWeek);
    let nextDay = 2;
    for (let d = 2; d <= 8; d++) {
      if (!existingDays.includes(d)) {
        nextDay = d;
        break;
      }
    }
    const last = sessions[sessions.length - 1];
    setSessions([
      ...sessions,
      {
        id: `sess-${Date.now()}`,
        dayOfWeek: nextDay,
        startTime: last?.startTime || '17:45',
        endTime: last?.endTime || '19:30',
        roomId: '',
      },
    ]);
  };

  const handleRemoveSession = (id?: string) => {
    if (sessions.length <= 1) {
      alert('Thời khóa biểu cần có ít nhất 1 ca học trong tuần!');
      return;
    }
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSessionChange = (id: string | undefined, field: keyof ClassSessionSchedule, val: any) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: val } : s))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      alert('Vui lòng nhập tên lớp và mã thời khóa biểu!');
      return;
    }

    if (sessions.length === 0) {
      alert('Vui lòng thêm ít nhất 1 buổi học trong tuần!');
      return;
    }

    const daysOfWeek = Array.from(new Set(sessions.map((s) => s.dayOfWeek))).sort();
    const primarySlot = {
      start: sessions[0]?.startTime || '17:45',
      end: sessions[0]?.endTime || '19:30',
    };

    if (editingClass) {
      updateClass(editingClass.id, {
        name: name.trim(),
        code: code.trim(),
        gradeLevel,
        subjectId,
        teacherId,
        roomId,
        note: note.trim(),
        daysOfWeek,
        timeSlot: primarySlot,
        weeklySchedules: sessions,
      });
    } else {
      addClass({
        id: `cls-${Date.now()}`,
        name: name.trim(),
        code: code.trim(),
        gradeLevel,
        subjectId,
        teacherId,
        roomId,
        note: note.trim(),
        daysOfWeek,
        timeSlot: primarySlot,
        weeklySchedules: sessions,
        studentIds: [],
        status: 'active',
        startDate: new Date().toISOString().split('T')[0],
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {editingClass
                  ? `Chỉnh Sửa Thời Khóa Biểu Khối ${gradeLevel}`
                  : `Thêm Thời Khóa Biểu Mới (Khối ${gradeLevel})`}
              </h3>
              <p className="text-xs text-slate-500">
                Thiết lập ca học, thứ trong tuần, giờ bắt đầu, giờ kết thúc, phòng và giáo viên cho khối lớp.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Row 1: Grade Level & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Khối Lớp Áp Dụng *
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:border-blue-500 font-semibold text-blue-800"
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

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Mã Lớp / Ca Học *
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono outline-none focus:border-blue-500"
                placeholder="VD: T12-VIP01"
                required
              />
            </div>
          </div>

          {/* Row 2: Name */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Tên Lớp Học / Ca Thời Khóa Biểu *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium outline-none focus:border-blue-500"
              placeholder="VD: Toán 12 Nâng Cao (Thứ 2 & Thứ 5)"
              required
            />
          </div>

          {/* Row 3: Subject, Teacher, Room */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Môn Học *</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Giáo Viên *</label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Phòng Học Chính *</label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.floor})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section: Lịch từng ca học trong tuần */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Các Buổi Học Trong Tuần Của Ca Này ({sessions.length} buổi):
                </span>
                <p className="text-[11px] text-slate-500">
                  Chỉnh sửa thứ trong tuần, giờ bắt đầu và kết thúc cho từng buổi.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddSession}
                className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Buổi</span>
              </button>
            </div>

            <div className="space-y-2 pt-1">
              {sessions.map((sess, idx) => (
                <div
                  key={sess.id || idx}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg shadow-2xs"
                >
                  <span className="w-14 shrink-0 font-bold text-blue-700 text-xs">
                    Buổi {idx + 1}:
                  </span>

                  {/* Day */}
                  <div className="flex-1 sm:w-36">
                    <select
                      value={sess.dayOfWeek}
                      onChange={(e) =>
                        handleSessionChange(sess.id, 'dayOfWeek', Number(e.target.value))
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-semibold text-slate-800 outline-none"
                    >
                      {dayOptions.map((d) => (
                        <option key={d.num} value={d.num}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Start time */}
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 text-[11px]">Từ:</span>
                    <input
                      type="text"
                      value={sess.startTime}
                      onChange={(e) =>
                        handleSessionChange(sess.id, 'startTime', e.target.value)
                      }
                      placeholder="17:45"
                      className="w-20 px-2 py-1.5 border border-slate-300 rounded font-mono text-center outline-none"
                    />
                  </div>

                  {/* End time */}
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 text-[11px]">Đến:</span>
                    <input
                      type="text"
                      value={sess.endTime}
                      onChange={(e) =>
                        handleSessionChange(sess.id, 'endTime', e.target.value)
                      }
                      placeholder="19:30"
                      className="w-20 px-2 py-1.5 border border-slate-300 rounded font-mono text-center outline-none"
                    />
                  </div>

                  {/* Delete session */}
                  <button
                    type="button"
                    onClick={() => handleRemoveSession(sess.id)}
                    disabled={sessions.length <= 1}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 rounded transition-colors"
                    title="Xóa buổi này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Ghi Chú</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Phòng có máy chiếu, học sinh mang theo máy tính cầm tay..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{editingClass ? 'Lưu Thay Đổi TKB' : 'Tạo Thời Khóa Biểu'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
