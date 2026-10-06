import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { ClassSession, SessionType } from '../../types/index.ts';
import { X, Calendar, Clock, Save, Plus } from 'lucide-react';

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSession?: ClassSession | null;
}

export const NewSessionModal: React.FC<NewSessionModalProps> = ({
  isOpen,
  onClose,
  editingSession,
}) => {
  const { classes, subjects, teachers, rooms, addSession, updateSession } = useApp();

  const [formData, setFormData] = useState<Partial<ClassSession>>({
    classId: classes[0]?.id || '',
    subjectId: classes[0]?.subjectId || subjects[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    startTime: '17:45',
    endTime: '19:30',
    roomId: rooms[0]?.id || '',
    teacherId: teachers[0]?.id || '',
    topic: '',
    type: 'regular',
    remindMinutesBefore: 60,
    reminderSent: false,
  });

  React.useEffect(() => {
    if (editingSession) {
      setFormData(editingSession);
    } else {
      const firstClass = classes[0];
      setFormData({
        classId: firstClass?.id || '',
        subjectId: firstClass?.subjectId || subjects[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        startTime: firstClass?.timeSlot.start || '17:45',
        endTime: firstClass?.timeSlot.end || '19:30',
        roomId: firstClass?.roomId || rooms[0]?.id || '',
        teacherId: firstClass?.teacherId || teachers[0]?.id || '',
        topic: '',
        type: 'regular',
        remindMinutesBefore: 60,
        reminderSent: false,
      });
    }
  }, [editingSession, isOpen, classes, subjects, rooms, teachers]);

  if (!isOpen) return null;

  const handleClassChange = (classId: string) => {
    const selectedCls = classes.find((c) => c.id === classId);
    if (selectedCls) {
      setFormData((prev) => ({
        ...prev,
        classId,
        subjectId: selectedCls.subjectId,
        teacherId: selectedCls.teacherId,
        roomId: selectedCls.roomId,
        startTime: selectedCls.timeSlot.start,
        endTime: selectedCls.timeSlot.end,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.classId || !formData.date || !formData.startTime) {
      alert('Vui lòng chọn lớp học và thời gian bắt đầu!');
      return;
    }

    if (editingSession) {
      updateSession(editingSession.id, formData);
    } else {
      addSession({
        ...formData as ClassSession,
        id: `ses-${Date.now()}`,
        reminderSent: false,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">
              {editingSession ? 'Cập Nhật Ca Học' : 'Tạo Lịch Ca Học Mới & Đặt Nhắc Nhở'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Chọn Lớp Học *</label>
            <select
              value={formData.classId || ''}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-bold text-slate-900"
              required
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name} ({c.studentIds.length} HS)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Ngày Diễn Ra *</label>
              <input
                type="date"
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-mono font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Loại Ca Học</label>
              <select
                value={formData.type || 'regular'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as SessionType })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
              >
                <option value="regular">Lịch Học Định Kỳ</option>
                <option value="makeup">Buổi Học Bù</option>
                <option value="extra">Tăng Cường / Phụ Đạo</option>
                <option value="exam">Thi Thử / Khảo Sát</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Giờ Bắt Đầu *</label>
              <input
                type="text"
                value={formData.startTime || '17:45'}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-mono"
                placeholder="17:45"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Giờ Kết Thúc *</label>
              <input
                type="text"
                value={formData.endTime || '19:30'}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-mono"
                placeholder="19:30"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Phòng Học *</label>
              <select
                value={formData.roomId || ''}
                onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.capacity} chỗ)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Giáo Viên Giảng Dạy *</label>
              <select
                value={formData.teacherId || ''}
                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-medium"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Cấu Hình Nhắc Nhở Tự Động Trước Giờ Học</label>
              <select
                value={formData.remindMinutesBefore || 60}
                onChange={(e) => setFormData({ ...formData, remindMinutesBefore: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-blue-700 font-bold"
              >
                <option value={30}>Nhắc trước 30 phút</option>
                <option value={60}>Nhắc trước 60 phút (1 tiếng)</option>
                <option value={120}>Nhắc trước 120 phút (2 tiếng)</option>
                <option value={1440}>Nhắc trước 1 ngày (24 tiếng)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Chuyên Đề / Nội Dung Bài Học (Tùy chọn)</label>
            <input
              type="text"
              value={formData.topic || ''}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="VD: Cực trị hàm số chứa dấu giá trị tuyệt đối, Speaking Mock Test..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{editingSession ? 'Lưu Thay Đổi' : 'Tạo Ca Học & Lên Lịch Nhắc'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
