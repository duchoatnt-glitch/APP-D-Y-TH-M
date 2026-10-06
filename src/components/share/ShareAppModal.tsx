import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Download,
  Printer,
  ShieldCheck,
  Eye,
  MessageSquare,
  Users,
  Calendar,
  Sparkles,
  Link as LinkIcon,
  Phone,
  Mail,
  Send,
  HelpCircle,
} from 'lucide-react';
import { getQRCodeImageUrl, generateQRCodeSvg } from '../../utils/qrCode.ts';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'viewer' | 'parent_portal' | 'timetable';
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'viewer',
}) => {
  const { settings, getShareableAppUrl, currentUser, isPrimaryAdmin } = useApp();

  const [activeShareMode, setActiveShareMode] = useState<'viewer' | 'parent_portal' | 'timetable' | 'admin'>(defaultTab);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [customUrlOverride, setCustomUrlOverride] = useState('');
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [qrImgLoaded, setQrImgLoaded] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Compute shareable URL based on mode
  const baseUrl = getShareableAppUrl
    ? getShareableAppUrl(activeShareMode === 'admin' ? 'general' : activeShareMode)
    : (() => {
        if (typeof window === 'undefined') return 'https://phannguyen.edu.vn';
        const origin = window.location.origin;
        // In AI Studio preview: convert dev url to public shared preview if applicable
        const publicOrigin = origin.replace('ais-dev-', 'ais-pre-');
        if (activeShareMode === 'viewer') return `${publicOrigin}/?mode=viewer`;
        if (activeShareMode === 'parent_portal') return `${publicOrigin}/?tab=parent_portal&mode=viewer`;
        if (activeShareMode === 'timetable') return `${publicOrigin}/?tab=timetable&mode=viewer`;
        return publicOrigin;
      })();

  const currentShareUrl = customUrlOverride.trim() || baseUrl;
  const qrImageUrl = getQRCodeImageUrl(currentShareUrl, 360);

  // Sample share message for Zalo / SMS
  const shareMessage = `Kính gửi Quý phụ huynh & Học sinh,
${settings.centerName || 'HỘ KINH DOANH PHAN NGUYÊN'} (Thầy Nguyễn Đức Hoà - SĐT: 0945.001.262) xin trân trọng gửi liên kết tra cứu thời khóa biểu, lịch học và thông tin lớp:
👉 ${currentShareUrl}
(Quý phụ huynh và các em học sinh có thể xem trực tiếp trên điện thoại hoặc máy tính mà không cần cài đặt).
Trân trọng cảm ơn!`;

  useEffect(() => {
    if (isOpen) {
      setCopiedLink(false);
      setCopiedMessage(false);
      setQrImgLoaded(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(currentShareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = currentShareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  const handleCopyMessage = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareMessage);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareMessage;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2500);
    } catch (err) {
      console.warn('Copy message failed:', err);
    }
  };

  const handleOpenPreview = () => {
    window.open(currentShareUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadQr = () => {
    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.download = `QR_Chia_Se_${(settings.centerName || 'Phan_Nguyen').replace(/\s+/g, '_')}.png`;
    link.target = '_blank';
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareZalo = () => {
    // Open Zalo web share dialog
    const zaloShareUrl = `https://chat.zalo.me/`;
    handleCopyMessage();
    window.open(zaloShareUrl, '_blank');
  };

  const handleShareFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentShareUrl)}`;
    window.open(fbUrl, '_blank', 'width=600,height=500');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`[${settings.centerName || 'Phan Nguyên'}] Liên kết tra cứu thời khóa biểu & lịch học`);
    const body = encodeURIComponent(shareMessage);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-4 max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-md shrink-0">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Chia Sẻ App Cho Mọi Người Xem</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold uppercase tracking-wide">
                  Quản Trị Chính
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Thầy Nguyễn Đức Hoà chia sẻ link &amp; mã QR để phụ huynh, học sinh xem tra cứu
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs text-slate-700">
          
          {/* Security Notice Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>An toàn tuyệt đối cho dữ liệu:</strong> Mọi người xem qua liên kết chia sẻ này sẽ được tự động kích hoạt <strong>Chế độ Xem (Read-Only)</strong>. Phụ huynh, học sinh chỉ có thể theo dõi thời khóa biểu, sĩ số, lịch học mà <strong>không thể thêm, sửa hay xóa bất kỳ thông tin nào</strong> của trung tâm.
            </div>
          </div>

          {/* Share Mode Selection Tabs */}
          <div>
            <label className="block text-slate-700 font-bold mb-2">
              1. Chọn mục tiêu liên kết chia sẻ:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Option 1: View Only for Everyone */}
              <button
                type="button"
                onClick={() => {
                  setActiveShareMode('viewer');
                  setCustomUrlOverride('');
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  activeShareMode === 'viewer'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-2xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span>Chế Độ Xem (Khuyên dùng)</span>
                  </div>
                  {activeShareMode === 'viewer' && (
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  Xem thời khóa biểu, lịch học, thông tin lớp cho tất cả mọi người.
                </p>
              </button>

              {/* Option 2: Parent Portal */}
              <button
                type="button"
                onClick={() => {
                  setActiveShareMode('parent_portal');
                  setCustomUrlOverride('');
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  activeShareMode === 'parent_portal'
                    ? 'border-amber-600 bg-amber-50/70 text-amber-900 shadow-2xs ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Users className="w-4 h-4 text-amber-600" />
                    <span>Cổng Phụ Huynh</span>
                  </div>
                  {activeShareMode === 'parent_portal' && (
                    <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  Tra cứu điểm số, học phí và điểm danh cho phụ huynh học sinh.
                </p>
              </button>

              {/* Option 3: Timetable Matrix */}
              <button
                type="button"
                onClick={() => {
                  setActiveShareMode('timetable');
                  setCustomUrlOverride('');
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  activeShareMode === 'timetable'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-2xs ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span>Thời Khóa Biểu Tuần</span>
                  </div>
                  {activeShareMode === 'timetable' && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  Trực quan lịch học, phòng học và ca học của các khối lớp.
                </p>
              </button>
            </div>
          </div>

          {/* Share Link Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 font-bold flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>2. Đường dẫn liên kết chia sẻ (Link truy cập):</span>
              </label>
              <button
                type="button"
                onClick={() => setIsEditingUrl(!isEditingUrl)}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
              >
                {isEditingUrl ? 'Khôi phục mặc định' : 'Tùy chỉnh link'}
              </button>
            </div>

            {isEditingUrl ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customUrlOverride}
                  onChange={(e) => setCustomUrlOverride(e.target.value)}
                  placeholder={baseUrl}
                  className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-xl font-mono text-xs text-blue-900 outline-none focus:border-blue-500 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setIsEditingUrl(false)}
                  className="px-3 py-2 bg-slate-800 text-white rounded-xl font-semibold cursor-pointer"
                >
                  Xong
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex-1 font-mono text-[11px] text-slate-800 break-all select-all truncate px-1">
                  {currentShareUrl}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                      copiedLink
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Đã Sao Chép!' : 'Sao Chép Link'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenPreview}
                    className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    title="Mở xem thử giao diện người xem (Mở tab mới)"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* QR Code and Quick Share Split Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            
            {/* Left: Dynamic QR Code Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-between text-center space-y-3">
              <div className="w-full">
                <div className="flex items-center justify-center gap-1.5 font-bold text-slate-800 text-xs mb-1">
                  <QrCode className="w-4 h-4 text-indigo-600" />
                  <span>Mã QR Quét Xem Nhanh Trên Điện Thoại</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Phụ huynh &amp; học sinh quét bằng Camera hoặc Zalo để mở ngay
                </p>
              </div>

              {/* Printable QR Frame */}
              <div
                ref={printAreaRef}
                className="bg-white p-3.5 rounded-2xl border-2 border-slate-200 shadow-md inline-flex flex-col items-center"
              >
                <div className="w-44 h-44 bg-white flex items-center justify-center relative overflow-hidden rounded-lg">
                  {/* High quality dynamic QR image */}
                  <img
                    src={qrImageUrl}
                    alt="Mã QR tra cứu app Phan Nguyên"
                    className="w-full h-full object-contain"
                    onLoad={() => setQrImgLoaded(true)}
                  />
                  {!qrImgLoaded && (
                    <div
                      className="absolute inset-0 flex items-center justify-center bg-white"
                      dangerouslySetInnerHTML={{
                        __html: generateQRCodeSvg(currentShareUrl, 176),
                      }}
                    />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div className="font-extrabold text-[11px] text-blue-900 tracking-tight uppercase">
                    {settings.centerName || 'HỘ KINH DOANH PHAN NGUYÊN'}
                  </div>
                  <div className="text-[9px] text-slate-500 font-medium">
                    Quét để tra cứu thời khóa biểu &amp; học tập
                  </div>
                </div>
              </div>

              {/* QR Actions */}
              <div className="flex items-center gap-2 w-full pt-1">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                  title="Tải ảnh QR về máy tính để gửi vào nhóm Zalo hoặc in ấn"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tải Ảnh QR</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                  title="In mã QR dán bảng thông báo trung tâm"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>In Mã QR</span>
                </button>
              </div>
            </div>

            {/* Right: Instant Share Message & Social Channels */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>Mẫu Tin Nhắn Gửi Phụ Huynh (Zalo / SMS)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedMessage ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedMessage ? 'Đã chép!' : 'Chép mẫu'}</span>
                  </button>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 text-[11px] text-slate-700 font-mono whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto shadow-2xs">
                  {shareMessage}
                </div>
              </div>

              {/* Quick Share Buttons */}
              <div>
                <span className="text-[11px] font-bold text-slate-600 block mb-2">
                  Chia sẻ trực tiếp qua ứng dụng:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleShareZalo}
                    className="py-2 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold text-[11px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                    title="Sao chép tin nhắn và mở Zalo Web"
                  >
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-black">
                      Z
                    </span>
                    <span>Gửi Zalo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareFacebook}
                    className="py-2 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-[11px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                    title="Chia sẻ lên Facebook"
                  >
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-black">
                      f
                    </span>
                    <span>Facebook</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareEmail}
                    className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl font-bold text-[11px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                    title="Gửi Email cho phụ huynh"
                  >
                    <Mail className="w-4 h-4 text-slate-700" />
                    <span>Email</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Information & Admin Contact Footer */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Người quản trị chính:</span>
              <strong className="text-blue-900 font-bold">Thầy Nguyễn Đức Hoà</strong>
              <span>· 0945.001.262</span>
            </div>
            <div className="text-slate-400">
              Cơ sở 1: 11 Trần Kiên, thôn 4, Ea Knốp, Đăk Lăk
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleOpenPreview}
            className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Xem thử trang người xem sẽ thấy</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Đã Sao Chép Link!' : 'Sao Chép Link'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-medium text-xs transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
