import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  GraduationCap,
  Sparkles,
  Award,
  BookOpen,
  Trophy,
  Target,
  Flame,
  CheckCircle2,
  MapPin,
} from 'lucide-react';

interface BrandBannerProps {
  compact?: boolean;
}

export const BrandBanner: React.FC<BrandBannerProps> = ({ compact = false }) => {
  const { settings, classes, students, teachers, subjects } = useApp();

  const businessName = settings.centerName || 'HỘ KINH DOANH PHAN NGUYÊN';
  const slogan =
    settings.centerSlogan ||
    'Kiến Tạo Tư Duy - Bứt Phá Điểm Số - Đồng Hành Cùng Tương Lai';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-slate-900 via-blue-950 to-indigo-950 text-white shadow-xl border border-blue-900/60 p-4 sm:p-6 mb-6 select-none group">
      {/* ------------------------------------------------------------- */}
      {/* BACKGROUND WATERMARK: HÌNH LUYỆN THI ẨN NGHỆ THUẬT             */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Glow ambient meshes */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl" />

        {/* Artistic Hidden Exam Preparation Vector Watermark Graphic */}
        <svg
          className="absolute right-0 top-0 h-full w-auto max-w-[55%] opacity-15 text-blue-200 transition-opacity duration-700 group-hover:opacity-25"
          viewBox="0 0 600 240"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle Grid / Math Graph Lines */}
          <line x1="50" y1="20" x2="550" y2="20" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1="50" y1="80" x2="550" y2="80" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1="50" y1="140" x2="550" y2="140" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1="50" y1="200" x2="550" y2="200" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" />

          {/* Graduation Cap (Nón Cử Nhân) */}
          <g transform="translate(380, 25) scale(0.95)">
            <polygon points="90,15 170,45 90,75 10,45" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="2.5" />
            <path d="M40,57 L40,95 C40,115 140,115 140,95 L140,57" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="2" />
            {/* Tassel */}
            <path d="M170,45 C185,55 190,80 185,105" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
            <circle cx="185" cy="110" r="4" fill="#f59e0b" />
          </g>

          {/* Exam Paper with A+ & 10/10 Grade Mark */}
          <g transform="translate(230, 40) rotate(-6)">
            <rect x="0" y="0" width="90" height="125" rx="6" fill="#1e293b" fillOpacity="0.6" stroke="currentColor" strokeWidth="2" />
            <line x1="15" y1="25" x2="75" y2="25" stroke="currentColor" strokeWidth="2" />
            <line x1="15" y1="42" x2="65" y2="42" stroke="currentColor" strokeWidth="1.5" />
            <line x1="15" y1="58" x2="75" y2="58" stroke="currentColor" strokeWidth="1.5" />
            <line x1="15" y1="74" x2="55" y2="74" stroke="currentColor" strokeWidth="1.5" />
            {/* A+ & 10 Red Badge Stamp */}
            <circle cx="62" cy="98" r="16" fill="#dc2626" fillOpacity="0.35" stroke="#ef4444" strokeWidth="1.5" />
            <text x="54" y="103" fill="#fca5a5" fontSize="13" fontWeight="bold" fontFamily="sans-serif">10</text>
          </g>

          {/* Open Knowledge Book (Quyển Sách Tri Thức Luyện Thi) */}
          <g transform="translate(130, 95)">
            <path
              d="M10,65 C35,45 75,45 100,55 C125,45 165,45 190,65 L190,115 C165,95 125,95 100,105 C75,95 35,95 10,115 Z"
              fill="currentColor"
              fillOpacity="0.25"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line x1="100" y1="55" x2="100" y2="105" stroke="currentColor" strokeWidth="2" />
            {/* Rays of Wisdom */}
            <path d="M100,20 L100,40 M65,25 L75,42 M135,25 L125,42" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* Victory Trophy (Cúp Vinh Danh Học Sinh Xuất Sắc) */}
          <g transform="translate(480, 80) scale(0.85)">
            <path d="M25,15 L75,15 L70,60 C68,75 57,85 50,85 C43,85 32,75 30,60 Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="2" />
            <path d="M25,25 C10,25 10,50 28,52" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M75,25 C90,25 90,50 72,52" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M47,85 L47,105 L35,115 L65,115 L53,105 L53,85" fill="currentColor" stroke="currentColor" strokeWidth="2" />
            <polygon points="50,30 54,40 64,40 56,46 59,56 50,50 41,56 44,46 36,40 46,40" fill="#fbbf24" />
          </g>

          {/* Academic & Scientific Formulas Watermark */}
          <text x="310" y="30" fill="currentColor" fontSize="12" fontFamily="monospace" opacity="0.6">∫ f(x)dx</text>
          <text x="180" y="35" fill="currentColor" fontSize="11" fontFamily="monospace" opacity="0.5">E = mc²</text>
          <text x="350" y="195" fill="currentColor" fontSize="11" fontFamily="monospace" opacity="0.5">Δ = b² - 4ac</text>
          <text x="240" y="210" fill="currentColor" fontSize="13" fontFamily="monospace" opacity="0.6">∑ xᵢ / n</text>
          <text x="460" y="45" fill="currentColor" fontSize="11" fontFamily="monospace" opacity="0.5">100% ĐỖ ĐH</text>
        </svg>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MAIN BANNER CONTENT: HỘ KINH DOANH PHAN NGUYÊN               */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-10 flex flex-col gap-3">
        {/* Top Tagline / Category */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>HỆ THỐNG LUYỆN THI & BỒI DƯỠNG VĂN HÓA CHẤT LƯỢNG CAO</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <CheckCircle2 className="w-3 h-3" />
              <span>Đang Hoạt Động</span>
            </span>
          </div>

          {/* Stats Badges */}
          <div className="flex items-center gap-3 text-xs text-blue-200/80 font-medium">
            <span><b>{classes.length}</b> Lớp học</span>
            <span className="text-blue-400/40">·</span>
            <span><b>{students.length}</b> Học sinh</span>
            <span className="text-blue-400/40">·</span>
            <span><b>{teachers.length}</b> Giáo viên</span>
          </div>
        </div>

        {/* Business Main Title */}
        <div className="flex items-center gap-3.5 pt-1">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-linear-to-br from-blue-500 via-indigo-600 to-amber-500 p-0.5 shadow-lg shadow-blue-500/30 shrink-0">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-amber-400">
              <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight bg-linear-to-r from-white via-blue-100 to-amber-200 bg-clip-text text-transparent uppercase drop-shadow-sm">
              {businessName}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-blue-200/90 mt-1 font-medium">
              <span>Trung Tâm Bồi Dưỡng Văn Hóa · Luyện Thi Vào 10 · Luyện Thi THPT QG</span>
              <span className="hidden sm:inline text-blue-400/50">|</span>
              <span className="inline-flex items-center gap-1 text-amber-200/90">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{settings.centerAddress || 'Cơ sở 1, 11 Trần Kiên, thôn 4, xã Ea Knốp, tỉnh Đăk Lăk'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* RUNNING MARQUEE SLOGAN (DÒNG CHỮ CHẠY DƯỚI TÊN HỘ KINH DOANH) */}
        {/* ------------------------------------------------------------- */}
        <div className="mt-2 pt-2.5 border-t border-white/10 overflow-hidden relative rounded-xl bg-slate-950/40 backdrop-blur-xs py-2 px-3 border border-blue-500/20">
          <div className="flex items-center gap-2">
            <div className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold uppercase tracking-wider">
              <Flame className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Khẩu Hiệu</span>
            </div>

            <div className="overflow-hidden relative flex-1">
              <div className="animate-marquee flex items-center gap-10 text-xs sm:text-sm font-bold text-amber-300 tracking-wide">
                {/* Repetition 1 */}
                <span className="flex items-center gap-3 whitespace-nowrap">
                  <span className="text-white">✨</span>
                  <span className="bg-linear-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent drop-shadow-xs">
                    {slogan}
                  </span>
                  <span className="text-blue-300/60 font-normal text-xs">
                    · Tận Tâm - Uy Tín - Bứt Phá Thành Công ·
                  </span>
                </span>

                {/* Repetition 2 */}
                <span className="flex items-center gap-3 whitespace-nowrap">
                  <span className="text-white">✨</span>
                  <span className="bg-linear-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent drop-shadow-xs">
                    {slogan}
                  </span>
                  <span className="text-blue-300/60 font-normal text-xs">
                    · Luyện Thi Trọng Tâm - Đảm Bảo Đầu Ra ·
                  </span>
                </span>

                {/* Repetition 3 */}
                <span className="flex items-center gap-3 whitespace-nowrap">
                  <span className="text-white">✨</span>
                  <span className="bg-linear-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent drop-shadow-xs">
                    {slogan}
                  </span>
                  <span className="text-blue-300/60 font-normal text-xs">
                    · Nâng Tầm Tri Thức Học Sinh Việt ·
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
