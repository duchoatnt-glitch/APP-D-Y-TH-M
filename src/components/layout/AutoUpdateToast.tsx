import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { CheckCircle2, RefreshCw, X, Zap } from 'lucide-react';

interface AutoUpdateToastProps {
  onOpenCenter?: () => void;
}

export const AutoUpdateToast: React.FC<AutoUpdateToastProps> = ({ onOpenCenter }) => {
  const { autoUpdateNotice, clearAutoUpdateNotice, isSaving } = useApp();

  if (!autoUpdateNotice && !isSaving) return null;

  return (
    <aside
      aria-label="Thông báo cập nhật hệ thống"
      className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {isSaving ? (
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 flex-shrink-0">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
          ) : (
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Tự Động Cập Nhật
              </span>
              <span className="text-[10px] text-slate-400">• Vừa xong</span>
            </div>
            <p className="text-xs font-medium text-slate-100 truncate">
              {autoUpdateNotice || 'Đang đồng bộ dữ liệu vào hệ thống...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {onOpenCenter && (
            <button
              onClick={onOpenCenter}
              className="px-2 py-1 text-[11px] font-semibold text-blue-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              Xem
            </button>
          )}
          <button
            onClick={clearAutoUpdateNotice}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
