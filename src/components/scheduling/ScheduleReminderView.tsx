import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { ClassSession, SessionType } from '../../types/index.ts';
import {
  Calendar,
  Clock,
  Bell,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
  User,
  MapPin,
  Users,
  Search,
  Filter,
  Check,
  Edit2,
  Trash2,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { getDayOfWeekName } from '../../utils/formatters.ts';

interface ScheduleReminderViewProps {
  onOpenNewSessionModal: (session?: ClassSession) => void;
  onOpenAttendanceModal: (classId: string) => void;
}

export const ScheduleReminderView: React.FC<ScheduleReminderViewProps> = ({
  onOpenNewSessionModal,
  onOpenAttendanceModal,
}) => {
  const {
    sessions,
    classes,
    subjects,
    teachers,
    rooms,
    students,
    deleteSession,
    sendSessionReminder,
    sendAllDueReminders,
    notifications,
  } = useApp();

  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterDateTab, setFilterDateTab] = useState<'all' | 'today' | 'upcoming'>('all');
  const [selectedChannel, setSelectedChannel] = useState<'Zalo' | 'SMS' | 'Hệ thống'>('Zalo');
  const [lastBatchCount, setLastBatchCount] = useState<number | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredSessions = sessions.filter((s) => {
    if (filterSubject !== 'all' && s.subjectId !== filterSubject) return false;
    if (filterClass !== 'all' && s.classId !== filterClass) return false;
    if (filterDateTab === 'today' && s.date !== todayStr) return false;
    if (filterDateTab === 'upcoming' && s.date <= todayStr) return false;
    return true;
  }).sort((a, b) => {
    const comp = a.date.localeCompare(b.date);
    if (comp !== 0) return comp;
    return a.startTime.localeCompare(b.startTime);
  });

  const todaySessions = sessions.filter((s) => s.date === todayStr);
  const pendingRemindersToday = todaySessions.filter((s) => !s.reminderSent);

  const handleSendReminderSingle = (sessionId: string) => {
    const count = sendSessionReminder(sessionId, selectedChannel);
    alert(`Đã gửi thành công tin nhắn nhắc lịch học tới ${count} học sinh và giáo viên phụ trách qua ${selectedChannel}!`);
  };

  const handleSendAllBatch = () => {
    const count = sendAllDueReminders();
    setLastBatchCount(count);
    alert(`Đã tự động gửi ${count} tin nhắn nhắc nhở ca học hôm nay qua Zalo / SMS cho toàn bộ phụ huynh và giáo viên!`);
    setTimeout(() => setLastBatchCount(null), 4000);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Xóa ca học này khỏi lịch trung tâm?')) {
      deleteSession(id);
    }
  };

  // Reminder notifications logs
  const reminderLogs = notifications.filter((n) => n.type === 'reminder');

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Quick Bulk Action */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Hệ Thống Lịch Học & Nhắc Nhở Tự Động Trước Giờ Học</span>
            <span aria-hidden="true">·</span>
            <span>Tự động gửi Zalo & SMS cho Phụ huynh & Thầy cô</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Lịch Học & Trung Tâm Nhắc Lịch Ca Học
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {pendingRemindersToday.length > 0 && (
            <button
              onClick={handleSendAllBatch}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <Bell className="w-4 h-4" />
              <span>Gửi Nhắc Nhở Toàn Bộ Hôm Nay ({pendingRemindersToday.length})</span>
            </button>
          )}

          <button
            onClick={() => onOpenNewSessionModal()}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Ca Học Mới</span>
          </button>
        </div>
      </div>

      {/* Live Reminder Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-slate-500 block text-xs font-medium">Ca Học Diễn Ra Hôm Nay</span>
          <div className="text-xl font-bold text-slate-900 font-mono mt-1 tabular-nums">
            {todaySessions.length} ca học
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Ngày {todayStr}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-slate-500 block text-xs font-medium">Trạng Thái Nhắc Nhở Hôm Nay</span>
          <div className="text-xl font-bold text-emerald-600 font-mono mt-1 tabular-nums">
            {todaySessions.filter((s) => s.reminderSent).length} / {todaySessions.length} đã nhắc
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {pendingRemindersToday.length === 0 ? 'Tất cả ca học đã được nhắc' : `Còn ${pendingRemindersToday.length} ca chưa gửi`}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-slate-500 block text-xs font-medium">Kênh Gửi Nhắc Nhở Tự Động</span>
          <div className="flex items-center gap-2 mt-1.5">
            {(['Zalo', 'SMS', 'Hệ thống'] as const).map((ch) => (
              <button
                key={ch}
                onClick={() => setSelectedChannel(ch)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  selectedChannel === ch
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Mẫu tin nhắn tự động điền họ tên, phòng và giờ học
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-slate-500 mb-1 font-medium">Phạm Vi Thời Gian</label>
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setFilterDateTab('all')}
              className={`flex-1 py-1 text-center font-medium rounded transition-colors ${
                filterDateTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Tất Cả
            </button>
            <button
              onClick={() => setFilterDateTab('today')}
              className={`flex-1 py-1 text-center font-medium rounded transition-colors ${
                filterDateTab === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Hôm Nay
            </button>
            <button
              onClick={() => setFilterDateTab('upcoming')}
              className={`flex-1 py-1 text-center font-medium rounded transition-colors ${
                filterDateTab === 'upcoming' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Sắp Tới
            </button>
          </div>
        </div>

        <div>
          <label className="block text-slate-500 mb-1 font-medium">Lọc Theo Môn Học</label>
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none"
          >
            <option value="all">Tất cả môn học ({subjects.length})</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-500 mb-1 font-medium">Lọc Theo Lớp Học</label>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none"
          >
            <option value="all">Tất cả lớp học ({classes.length})</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end justify-end">
          <span className="text-slate-500 text-xs">
            Tổng cộng: <strong className="text-slate-900 font-mono">{filteredSessions.length}</strong> ca học
          </span>
        </div>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSessions.map((session) => {
          const cls = classes.find((c) => c.id === session.classId);
          const subject = subjects.find((s) => s.id === session.subjectId);
          const teacher = teachers.find((t) => t.id === session.teacherId);
          const room = rooms.find((r) => r.id === session.roomId);

          const isToday = session.date === todayStr;

          return (
            <div
              key={session.id}
              className={`bg-white rounded-xl border p-5 transition-all flex flex-col justify-between ${
                isToday ? 'border-blue-400 ring-2 ring-blue-50 shadow-xs' : 'border-slate-200'
              }`}
            >
              <div>
                {/* Header: Date & Time */}
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 font-bold font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{session.startTime} - {session.endTime}</span>
                  </div>

                  <span className="text-slate-500 font-mono text-[11px]">
                    {session.date} {isToday && '(Hôm nay)'}
                  </span>
                </div>

                {/* Class Title */}
                <h3 className="font-bold text-slate-900 text-sm mt-3 line-clamp-2">
                  {cls?.name || 'Ca học'}
                </h3>

                {session.topic && (
                  <p className="text-xs text-slate-600 mt-1 italic line-clamp-1">
                    Chuyên đề: "{session.topic}"
                  </p>
                )}

                {/* Details */}
                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Giáo viên: <strong className="text-slate-800">{teacher?.name}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Phòng học: <strong className="text-slate-800">{room?.name}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Sĩ số: <strong className="text-slate-800 font-mono">{cls?.studentIds.length || 0} học sinh</strong></span>
                  </div>
                </div>

                {/* Automated Reminder Status Badge */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  {session.reminderSent ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Đã gửi nhắc nhở {session.reminderSentAt && `(${session.reminderSentAt})`}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 font-medium">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Chưa nhắc (Cấu hình: trước {session.remindMinutesBefore} phút)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleSendReminderSingle(session.id)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi Nhắc Nhở ({selectedChannel})</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {cls && (
                    <button
                      onClick={() => onOpenAttendanceModal(cls.id)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium cursor-pointer"
                      title="Điểm danh"
                    >
                      Điểm danh
                    </button>
                  )}
                  <button
                    onClick={() => onOpenNewSessionModal(session)}
                    className="px-2 py-1 text-slate-700 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    title="Chỉnh sửa ca học"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Sửa</span>
                  </button>
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="px-2 py-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    title="Xóa ca học"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reminder History Log Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <h4 className="font-bold text-slate-900 text-sm">
              Nhật Ký Tin Nhắn Nhắc Lịch Học Đã Gửi ({reminderLogs.length})
            </h4>
          </div>
          <span className="text-xs text-slate-500 font-mono">Đồng bộ tự động</span>
        </div>

        {reminderLogs.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Chưa có tin nhắn nhắc nhở nào được gửi trong phiên làm việc.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs max-h-64 overflow-y-auto">
            {reminderLogs.map((log) => {
              const st = students.find((s) => s.id === log.studentId);
              return (
                <div key={log.id} className="py-2.5 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900">
                      Gửi tới PH: {st?.parentName || 'Phụ huynh'} ({log.parentPhone}) - Học sinh: {st?.name}
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5 whitespace-pre-wrap bg-slate-50 p-2 rounded border border-slate-150">
                      {log.message}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded text-[10px]">
                      {log.channel}
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">{log.sentAt}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
