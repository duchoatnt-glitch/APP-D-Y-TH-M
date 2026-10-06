import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Cloud,
  CheckCircle2,
  RefreshCw,
  Clock,
  Database,
  Download,
  Upload,
  ShieldCheck,
  Zap,
  Trash2,
  X,
  History,
  Layers,
  Sparkles,
} from 'lucide-react';

interface AutoUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AutoUpdateModal: React.FC<AutoUpdateModalProps> = ({ isOpen, onClose }) => {
  const {
    autoSaveEnabled,
    setAutoSaveEnabled,
    multiTabSyncEnabled,
    setMultiTabSyncEnabled,
    showToastOnSave,
    setShowToastOnSave,
    lastSavedTime,
    isSaving,
    forceSyncNow,
    snapshots,
    restoreSnapshot,
    deleteSnapshot,
    clearAllSnapshots,
    exportDataJson,
    importDataJson,
    teachers,
    classes,
    students,
    curriculumLessons,
    sessions,
    grades,
    attendance,
    settings,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'status' | 'history' | 'backup'>('status');
  const [importJsonText, setImportJsonText] = useState('');
  const [importFeedback, setImportFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleForceSync = () => {
    forceSyncNow();
    setSyncFeedback('Đã cập nhật và lưu trữ toàn bộ dữ liệu mới nhất thành công!');
    setTimeout(() => setSyncFeedback(null), 3500);
  };

  const handleRestore = (id: string, label: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn khôi phục lại dữ liệu từ phiên:\n"${label}"?\n\nDữ liệu hiện tại sẽ được cập nhật đồng bộ về trạng thái của phiên này.`)) {
      const ok = restoreSnapshot(id);
      if (ok) {
        setSyncFeedback('Đã khôi phục thành công về phiên được chọn!');
        setTimeout(() => setSyncFeedback(null), 3500);
      }
    }
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phannguyen-dulieu-${new Date().toISOString().split('T')[0]}-${new Date().getHours()}h${new Date().getMinutes()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = () => {
    if (!importJsonText.trim()) return;
    const ok = importDataJson(importJsonText);
    if (ok) {
      setImportFeedback({ success: true, message: 'Đã khôi phục dữ liệu từ file JSON thành công!' });
      setImportJsonText('');
      setTimeout(() => setImportFeedback(null), 4000);
    } else {
      setImportFeedback({ success: false, message: 'Định dạng file sao lưu JSON không hợp lệ. Vui lòng kiểm tra lại!' });
    }
  };

  const formatTime = (d: Date | null) => {
    if (!d) return 'Chưa ghi nhận';
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
      ' (' + d.toLocaleDateString('vi-VN') + ')';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <Cloud className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Trung Tâm Tự Động Cập Nhật Dữ Liệu</h3>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Thời gian thực
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Tự động lưu và đồng bộ toàn bộ thay đổi khi bạn làm việc trên hệ thống
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('status')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'status'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Trạng Thái & Cấu Hình
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            Lịch Sử Phiên Tự Động Lưu ({snapshots.length})
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'backup'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            Sao Lưu Ngoại Tuyến (JSON)
          </button>
        </div>

        {/* Feedback Alert */}
        {syncFeedback && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-semibold">{syncFeedback}</span>
            </div>
          </div>
        )}

        {/* Body content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'status' && (
            <>
              {/* Status Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-sm shadow-emerald-200">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-800">
                        Hệ Thống Tự Động Cập Nhật: {autoSaveEnabled ? 'ĐANG BẬT' : 'TẠM TẮT'}
                      </h4>
                      {isSaving && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Đang lưu...
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Mọi hành động nhập điểm, điểm danh, xếp lịch, sửa giáo viên/lớp học đều được tự động cập nhật ngay lập tức.
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Cập nhật gần nhất:</span>
                      <strong className="text-slate-700">{formatTime(lastSavedTime)}</strong>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleForceSync}
                  disabled={isSaving}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Cập Nhật & Lưu Ngay</span>
                </button>
              </div>

              {/* Engine switches */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Cơ Chế & Tùy Chọn Tự Động Lưu
                </h5>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Tự động cập nhật tức thì (Instant Realtime Auto-Save)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Tự động ghi nhận và lưu vĩnh viễn vào bộ nhớ trình duyệt ngay khi bạn thay đổi bất kỳ ô nhập liệu nào.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={autoSaveEnabled}
                      onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Đồng bộ đa tab / đa cửa sổ (Multi-Tab Live Sync)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Khi mở song song 2 hoặc nhiều tab, thay đổi ở tab này sẽ tự động cập nhật ngay trên tất cả các tab khác.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={multiTabSyncEnabled}
                      onChange={(e) => setMultiTabSyncEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Thông báo nổi khi có cập nhật mới (Toast Notification)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Hiển thị một thông báo nhỏ ở góc màn hình báo hiệu khi có thông tin mới được lưu tự động.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={showToastOnSave}
                      onChange={(e) => setShowToastOnSave(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Data protection metrics */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tổng Dữ Liệu Đang Được Bảo Vệ
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-[11px] text-slate-500 block">Giáo Viên</span>
                    <strong className="text-base text-slate-800">{teachers.length}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-[11px] text-slate-500 block">Lớp Học</span>
                    <strong className="text-base text-slate-800">{classes.length}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-[11px] text-slate-500 block">Học Sinh</span>
                    <strong className="text-base text-slate-800">{students.length}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-[11px] text-slate-500 block">Tiết PPCT</span>
                    <strong className="text-base text-slate-800">{curriculumLessons.length}</strong>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Lịch Sử Các Bản Sao Lưu Tự Động (Auto-Snapshots)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Hệ thống tự động lưu giữ các mốc thời gian khi bạn thao tác để bạn có thể khôi phục lại bất kỳ lúc nào.
                  </p>
                </div>
                {snapshots.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử sao lưu không?')) {
                        clearAllSnapshots();
                      }
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa lịch sử
                  </button>
                )}
              </div>

              {snapshots.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <Database className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 font-medium">Chưa có mốc sao lưu nào được ghi nhận.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Bấm &quot;Cập Nhật &amp; Lưu Ngay&quot; ở tab trạng thái để tạo mốc sao lưu đầu tiên!
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {snapshots.map((snap) => (
                    <div
                      key={snap.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600 flex-shrink-0 mt-0.5">
                          <History className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">{snap.label}</span>
                            <span className="text-[11px] font-medium text-slate-400">
                              {new Date(snap.timestamp).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}{' '}
                              - {new Date(snap.timestamp).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-slate-500">
                            <span>GV: <strong>{snap.counts.teachers}</strong></span>
                            <span>•</span>
                            <span>Lớp: <strong>{snap.counts.classes}</strong></span>
                            <span>•</span>
                            <span>HS: <strong>{snap.counts.students}</strong></span>
                            <span>•</span>
                            <span>PPCT: <strong>{snap.counts.curriculumLessons}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleRestore(snap.id, snap.label)}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                        >
                          Khôi phục mốc này
                        </button>
                        <button
                          onClick={() => deleteSnapshot(snap.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                          title="Xóa bản này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  Xuất & Nhập Bản Sao Lưu Ngoại Tuyến (JSON)
                </h4>
                <p className="text-xs text-slate-500">
                  Tải file sao lưu về máy tính hoặc chuyển toàn bộ dữ liệu qua máy tính / điện thoại khác một cách an toàn.
                </p>
              </div>

              {/* Export Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Tải về bản sao lưu toàn bộ hệ thống
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Bao gồm toàn bộ giáo viên, các lớp Vật lí, học sinh, thời khóa biểu, PPCT, điểm số, học phí.
                  </span>
                </div>
                <button
                  onClick={handleDownloadBackup}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Tải File JSON
                </button>
              </div>

              {/* Import Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <span className="text-xs font-bold text-slate-800 block">
                  Khôi phục hoặc nạp dữ liệu từ file JSON
                </span>
                <textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder="Dán nội dung JSON sao lưu vào đây..."
                  rows={4}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-400 outline-none font-mono resize-none"
                />
                {importFeedback && (
                  <p
                    className={`text-xs font-semibold ${
                      importFeedback.success ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {importFeedback.message}
                  </p>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={handleImportJson}
                    disabled={!importJsonText.trim()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    Khôi Phục Ngay
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Hệ thống tự động đồng bộ bảo mật cho <strong>{settings.centerName}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
