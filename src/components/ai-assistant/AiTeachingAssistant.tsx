import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { ExamVariationGenerator } from './ExamVariationGenerator.tsx';
import {
  Sparkles,
  BookOpen,
  Send,
  Copy,
  Check,
  Award,
  Layers,
  FileText,
  User,
  RefreshCw,
  Shuffle,
  Grid,
  MessageSquare,
  Bot,
  Lightbulb,
  Trash2,
  HelpCircle,
  GraduationCap,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AiTeachingAssistant: React.FC = () => {
  const { subjects, students, classes, settings } = useApp();

  const [activeMode, setActiveMode] = useState<'exam_variation' | 'ai_chatbot' | 'exam_generator' | 'parent_comment'>('exam_variation');

  // Chatbot State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `Xin chào Quý Thầy/Cô! Tôi là **Trợ Lý Sư Phạm AI của Trung Tâm Phan Nguyên**.\n\nTôi có thể hỗ trợ Thầy/Cô:\n1. 🎯 **Tạo đề tương tự & trộn đề chấm TN Maker**: Đổi số liệu câu cơ bản, xáo trộn 4 mã đề, xuất bảng đáp án.\n2. 📚 **Giải đáp & Soạn giáo án chuyên sâu**: Toán, Vật Lý, Hóa Học, Tiếng Anh, Ngữ Văn theo chương trình GDPT mới.\n3. ✍️ **Soạn câu hỏi phân loại 8+ và 9+** kèm phương pháp giải nhanh và mẹo tránh bẫy.\n4. 💬 **Soạn tin nhắn nhận xét học sinh gửi Phụ Huynh** chu đáo, tâm lý.\n\nThầy/Cô cần hỗ trợ nội dung gì hôm nay?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Mode 2: Exam Generator State
  const [selectedSubject, setSelectedSubject] = useState<string>('Toán Học');
  const [selectedGrade, setSelectedGrade] = useState<string>('12');
  const [examTopic, setExamTopic] = useState<string>('Khảo sát hàm số, cực trị và bài toán thực tế');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficultyLevel, setDifficultyLevel] = useState<string>('Vận dụng cao (8+ đến 9+)');

  // Mode 3: Parent Comment State
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [studentStrength, setStudentStrength] = useState<string>('Tư duy nhanh, làm tốt câu trắc nghiệm định lượng');
  const [studentWeakness, setStudentWeakness] = useState<string>('Còn hay tính ẩu phần số học, cần luyện thêm hình không gian');
  const [recentScore, setRecentScore] = useState<string>('8.5');

  // Generated Output State
  const [generatedResult, setGeneratedResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    if (activeMode === 'ai_chatbot') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeMode, isAiThinking]);

  // Handle sending chat message
  const handleSendMessage = (customPrompt?: string) => {
    const textToSend = customPrompt || chatInput;
    if (!textToSend.trim() || isAiThinking) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setChatInput('');
    setIsAiThinking(true);

    setTimeout(() => {
      let aiResponse = '';
      const lower = textToSend.toLowerCase();

      if (lower.includes('cực trị') || lower.includes('hàm số') || lower.includes('toán')) {
        aiResponse = `### 📐 PHƯƠNG PHÁP & BÀI TẬP VỀ HÀM SỐ & CỰC TRỊ (PHÂN LOẠI 8+)

**1. Phương pháp giải nhanh cực trị hàm hợp $y = f(u(x))$:**
- Bước 1: Tính đạo hàm $y' = u'(x) \\cdot f'(u(x))$.
- Bước 2: Cho $y' = 0 \\Leftrightarrow \\left[\\begin{aligned} u'(x) &= 0 \\\\ f'(u) &= 0 \\end{aligned}\\right.$.
- Bước 3: Lập trục xét dấu hoặc đếm số nghiệm bội lẻ của hệ phương trình trên.

**2. Ví dụ mẫu tạo đề tương tự:**
*Đề bài:* Cho hàm số $f(x)$ có bảng xét dấu của đạo hàm $f'(x)$. Hỏi hàm số $g(x) = f(3 - 2x)$ có bao nhiêu điểm cực đại?
- **Phương án A:** 1
- **Phương án B:** 2
- **Phương án C:** 3
- **Phương án D:** 4
*Đáp án đúng:* **B**. Lời giải: Ta có $g'(x) = -2f'(3-2x)$. Do có dấu âm phía trước, các điểm cực đại của $f(x)$ sẽ biến thành cực tiểu của $g(x)$ và ngược lại.

👉 *Thầy/Cô có thể chuyển sang tab **"Tạo Đề Tương Tự & TN Maker"** để tự động nhân bản câu hỏi này thành 4 mã đề có số liệu khác nhau!*`;
      } else if (lower.includes('nhận xét') || lower.includes('phụ huynh') || lower.includes('zalo')) {
        aiResponse = `### 💬 MẪU NHẬN XÉT HỌC TẬP GỬI PHỤ HUYNH QUA ZALO

Kính gửi Phụ Huynh, Trung tâm Phan Nguyên xin gửi đánh giá học tập tuần này của em:
1. **Ý thức học tập:** Em chuyên cần, chuẩn bị bài tập về nhà đầy đủ và tương tác rất tích cực với giáo viên.
2. **Năng lực tiếp thu:** Nắm chắc các công thức nền tảng, hoàn thành tốt các câu hỏi trắc nghiệm mức độ 7-8 điểm.
3. **Mục tiêu bứt phá tuần tới:** Thầy/Cô đang rèn luyện thêm cho em kỹ năng đọc đồ thị nhanh và hạn chế sai sót ở các phép tính số học cơ bản.

Trân trọng cảm ơn sự đồng hành của Gia đình!`;
      } else if (lower.includes('este') || lower.includes('hóa')) {
        aiResponse = `### ⚗️ TÓM TẮT TRỌNG TÂM & MẸO GIẢI NHANH MÔN HÓA HỌC 12

**Chuyên đề Este - Lipit:**
1. Công thức phân tử este no, đơn chức, mạch hở: $\\text{C}_n\\text{H}_{2n}\\text{O}_2\\ (n \\ge 2)$.
2. Phản ứng xà phòng hóa: $\\text{RCOOR}' + \\text{NaOH} \\xrightarrow{t^o} \\text{RCOONa} + \\text{R}'\\text{OH}$.
3. **Mẹo bảo toàn khối lượng:**
$$m_{\\text{este}} + m_{\\text{NaOH}} = m_{\\text{muối}} + m_{\\text{ancol}}$$
4. Số đồng phân este no đơn chức: Áp dụng công thức tính nhanh $2^{n-2}$ (với $2 \\le n \\le 4$).`;
      } else if (lower.includes('anh') || lower.includes('ielts') || lower.includes('english')) {
        aiResponse = `### 🇬🇧 COLLOCATIONS & ADVANCED VOCABULARY FOR HIGH SCORES

1. **Address an issue:** Giải quyết một vấn đề nan giải (thay cho solve a problem).
   - *Example:* The educational reforms aim to address the persistent achievement gap.
2. **Play a pivotal role in:** Đóng vai trò then chốt trong...
   - *Example:* Critical thinking plays a pivotal role in students' academic progress.
3. **Shed light on:** Làm sáng tỏ một khía cạnh.
   - *Example:* Recent research sheds light on the advantages of personalized learning pathways.`;
      } else {
        aiResponse = `Thầy/Cô vừa yêu cầu: "${textToSend}".

Tôi đã ghi nhận nội dung và sẵn sàng hỗ trợ Thầy/Cô:
- **Soạn bài giảng / đề thi:** Thầy/Cô có thể chỉ định môn học, khối lớp và số lượng câu hỏi để tôi sinh đề mẫu chi tiết.
- **Trộn đề TN Maker:** Sử dụng công cụ tích hợp sẵn để xuất trực tiếp bảng đáp án và đề Word theo chuẩn cơ sở Phan Nguyên.
- **Tư vấn sư phạm:** Thầy/Cô có thể hỏi thêm về phương pháp dạy học phân hóa, quản lý lớp hoặc giáo án thực nghiệm.`;
      }

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: aiResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsAiThinking(false);
    }, 600);
  };

  const handleGenerateExam = () => {
    setIsLoading(true);
    setTimeout(() => {
      let result = '';
      if (selectedSubject === 'Toán Học') {
        result = `### MA TRẬN & ĐỀ LUYỆN TẬP CHUYÊN ĐỀ ${selectedSubject.toUpperCase()} LỚP ${selectedGrade}
**Chủ đề:** ${examTopic} | **Mức độ:** ${difficultyLevel} | **Số câu:** ${questionCount} câu

---
**Câu 1 (Thông hiểu - Nhận biết):**
Cho hàm số $y = f(x)$ liên tục trên $\\mathbb{R}$ có bảng xét dấu đạo hàm $f'(x)$. Hỏi hàm số $y = f(x)$ có bao nhiêu điểm cực trị?
- A. 1
- B. 2
- C. 3
- D. 4
*Đáp án:* **B**. Lời giải: Đạo hàm đổi dấu 2 lần qua các điểm $x = -1$ và $x = 2$.

---
**Câu 2 (Vận dụng):**
Tìm tất cả các giá trị thực của tham số $m$ để hàm số $y = x^3 - 3mx^2 + 3(m^2 - 1)x + 2$ đạt cực đại tại $x = 1$.
- A. $m = 0$
- B. $m = 2$
- C. $m = 0$ hoặc $m = 2$
- D. Không tồn tại $m$
*Đáp án:* **A**. Lời giải: Ta có $y' = 3x^2 - 6mx + 3(m^2 - 1)$. Để hàm số đạt cực đại tại $x=1$ thì $y'(1) = 0 \\Leftrightarrow 3 - 6m + 3m^2 - 3 = 0 \\Leftrightarrow 3m(m-2) = 0 \\Rightarrow m=0$ hoặc $m=2$. Thử lại với $y''(1) < 0$, ta chọn $m = 0$.

---
**Câu 3 (Vận dụng cao - Đích 9+):**
Một cơ sở sản xuất muốn làm một bồn chứa nước hình trụ bằng inox có dung tích $V = 100\\pi\\text{ m}^3$. Chi phí làm đáy và nắp bồn là $300.000\\text{ đ/m}^2$, chi phí làm thân bồn là $200.000\\text{ đ/m}^2$. Tính bán kính đáy $R$ để tổng chi phí làm bồn chứa là nhỏ nhất?
- A. $R = \\sqrt[3]{50}\\text{ m}$
- B. $R = \\sqrt[3]{100/3}\\text{ m}$
- C. $R = \\sqrt[3]{100/3}\\text{ m}$
- D. $R = 5\\text{ m}$
*Đáp án:* **B**. Lời giải: $V = \\pi R^2 h = 100\\pi \\Rightarrow h = \\frac{100}{R^2}$. Tổng chi phí $C(R) = 300.000 \\cdot 2\\pi R^2 + 200.000 \\cdot 2\\pi Rh = 600.000\\pi R^2 + \\frac{40.000.000\\pi}{R}$. Khảo sát hàm số đạt GTNN khi $R = \\sqrt[3]{\\frac{100}{3}}\\text{ m}$.

---
**Câu 4 & 5 (Trắc nghiệm đúng sai & Trả lời ngắn):**
- Câu 4: Cho hàm số $f(x) = \\frac{ax+b}{cx+d}$. Xét tính đúng sai của các mệnh đề đường tiệm cận.
- Câu 5: Số giá trị nguyên của $m \\in [-10; 10]$ để đồ thị hàm số có 3 điểm cực trị tạo thành tam giác vuông cân là: **4**.`;
      } else if (selectedSubject.includes('Anh') || selectedSubject.includes('IELTS')) {
        result = `### ĐỀ THI & BÀI TẬP TIẾNG ANH / IELTS INTENSIVE (GRADE ${selectedGrade})
**Topic:** ${examTopic} | **Level:** ${difficultyLevel}

---
**Part 1: Grammar & Advanced Collocations (3 questions)**
1. The government has taken stringent measures to ______ the spread of misinformation on social platforms.
   A. curb   B. foster   C. induce   D. provoke
   *Key:* **A. curb** (Collocation: curb the spread = kìm hãm sự lây lan).

2. It is imperative that every student ______ the mock examination on time.
   A. attends   B. attend   C. attended   D. will attend
   *Key:* **B. attend** (Subjunctive mood: It is imperative that + S + V-bare).

3. The research findings cast doubt ______ the long-held belief regarding cognitive retention.
   A. in   B. at   C. on   D. with
   *Key:* **C. on** (Collocation: cast doubt on sth = gieo rắc nghi ngờ).`;
      } else {
        result = `### TỔNG HỢP BÀI TẬP BỨT PHÁ MÔN ${selectedSubject.toUpperCase()} KHỐI ${selectedGrade}
**Chuyên đề:** ${examTopic}
**Định hướng:** Rèn luyện kỹ năng phân tích bản chất, công thức tính nhanh và mẹo tránh bẫy đề thi.

1. Câu hỏi trọng tâm 1: Bản chất hiện tượng và sơ đồ tư duy logic.
2. Câu hỏi 2: Áp dụng định luật bảo toàn / biến đổi phương trình.
3. Câu hỏi 3: Dạng bài phân loại điểm 9+ kèm lời giải chi tiết từng bước.`;
      }

      setGeneratedResult(result);
      setIsLoading(false);
    }, 600);
  };

  const handleGenerateParentComment = () => {
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) return;

    setIsLoading(true);
    setTimeout(() => {
      const msg = `Kính gửi Phụ Huynh em ${student.name},\n\nTrung tâm xin gửi đến Gia đình báo cáo đánh giá học tập định kỳ môn học của em:\n\n1. Về Chuyên cần & Ý thức: Em ${student.name} luôn đi học đúng giờ, tác phong nghiêm túc và tập trung cao độ trong các giờ giảng của thầy cô.\n2. Về Năng lực tiếp thu & Điểm mạnh: ${studentStrength}. Điểm bài kiểm tra khảo sát gần nhất em đạt ${recentScore}/10 điểm - nằm trong nhóm học sinh có sự bứt phá tốt.\n3. Hướng khắc phục & Đồng hành: ${studentWeakness}. Thầy cô tại trung tâm sẽ tiếp tục kèm cặp, giao thêm các phiếu bài tập bổ trợ để em hoàn thiện kỹ năng trước kỳ thi chính thức.\n\nKính mong Phụ huynh tiếp tục động viên, nhắc nhở em duy trì phong độ. Trung tâm xin chân thành cảm ơn sự tin tưởng và đồng hành của Gia đình!\n\nTrân trọng,\nBan Chuyên Môn & Giáo Viên Phụ Trách.`;
      setGeneratedResult(msg);
      setIsLoading(false);
    }, 500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedResult);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Header & Mode Switcher */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-600 font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Trợ Lý Sư Phạm & AI Giáo Viên
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Trợ Lý AI Dành Cho Giáo Viên & Quản Lý Trung Tâm
          </h2>
          <p className="text-xs text-slate-500">
            Tạo đề tương tự & trộn đề chấm TN Maker, hỏi đáp sư phạm 24/7, soạn ma trận đề thi và thư nhận xét học sinh
          </p>
        </div>

        {/* 4 Modes Switcher */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200 gap-1">
          <button
            onClick={() => setActiveMode('exam_variation')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'exam_variation'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Tạo Đề & TN Maker</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
              activeMode === 'exam_variation' ? 'bg-indigo-700 text-amber-300' : 'bg-indigo-100 text-indigo-700'
            }`}>
              Mới
            </span>
          </button>

          <button
            onClick={() => setActiveMode('ai_chatbot')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'ai_chatbot'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Hỏi Đáp Sư Phạm AI</span>
          </button>

          <button
            onClick={() => setActiveMode('exam_generator')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'exam_generator'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Soạn Đề Chuyên Đề</span>
          </button>

          <button
            onClick={() => setActiveMode('parent_comment')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'parent_comment'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Nhận Xét Phụ Huynh</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Exam Variation Generator & TN Maker Shuffler */}
      {activeMode === 'exam_variation' && <ExamVariationGenerator />}

      {/* Mode 2: Interactive AI Pedagogical Chatbot */}
      {activeMode === 'ai_chatbot' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  Trợ Lý Giảng Dạy & Sư Phạm AI
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-[11px] text-slate-500">
                  Phục vụ giáo viên và quản lý trung tâm Phan Nguyên 24/7
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setMessages([
                  {
                    id: `msg-${Date.now()}`,
                    sender: 'assistant',
                    text: 'Cuộc trò chuyện đã được làm mới. Thầy/Cô cần hỗ trợ gì tiếp theo ạ?',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ]);
              }}
              className="px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              title="Làm mới hội thoại"
            >
              <Trash2 className="w-3.5 h-3.5" /> Làm mới
            </button>
          </div>

          {/* Chat Messages Thread */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-indigo-600 text-white shadow-xs'
                  }`}
                >
                  {msg.sender === 'user' ? 'GV' : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed space-y-2 ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-xs'
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
                  <div
                    className={`text-[10px] text-right font-mono ${
                      msg.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {isAiThinking && (
              <div className="flex gap-3 max-w-md">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>Trợ lý AI đang suy nghĩ và tổng hợp kiến thức...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Suggestion Prompt Chips */}
          <div className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-[11px] text-slate-600">
            <span className="text-slate-400 font-bold shrink-0 flex items-center gap-1">
              <Lightbulb className="w-3 h-3 text-amber-500" /> Gợi ý nhanh:
            </span>
            <button
              onClick={() => handleSendMessage('Giải thích phương pháp giải nhanh cực trị hàm hợp Toán 12')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-full shrink-0 transition-colors cursor-pointer border border-slate-200"
            >
              📐 Cực trị hàm hợp Toán 12
            </button>
            <button
              onClick={() => handleSendMessage('Tóm tắt các phản ứng trọng tâm của Este và Lipit Hóa 12')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-full shrink-0 transition-colors cursor-pointer border border-slate-200"
            >
              ⚗️ Este & Lipit Hóa 12
            </button>
            <button
              onClick={() => handleSendMessage('Gợi ý từ vựng và Collocations điểm cao môn Tiếng Anh THPT')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-full shrink-0 transition-colors cursor-pointer border border-slate-200"
            >
              🇬🇧 Collocations Tiếng Anh
            </button>
            <button
              onClick={() => handleSendMessage('Soạn mẫu nhận xét Zalo gửi phụ huynh học sinh cần rèn luyện thêm')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-full shrink-0 transition-colors cursor-pointer border border-slate-200"
            >
              💬 Mẫu nhận xét Zalo
            </button>
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder="Nhập câu hỏi, bài toán cần giải, yêu cầu soạn đề hoặc xin ý kiến sư phạm..."
              className="flex-1 px-4 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!chatInput.trim() || isAiThinking}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" /> Gửi
            </button>
          </div>
        </div>
      )}

      {/* Mode 3: General Topic Exam Generator */}
      {activeMode === 'exam_generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 text-xs shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" /> Cấu Hình Soạn Đề Thi
            </h3>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Môn Học *</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-medium"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Khối Lớp *</label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              >
                <option value="9">Khối 9 (Ôn thi vào 10)</option>
                <option value="10">Khối 10</option>
                <option value="11">Khối 11</option>
                <option value="12">Khối 12 (Luyện thi THPTQG)</option>
                <option value="IELTS">IELTS Intensive</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Chủ Đề / Chuyên Đề Cần Ra Đề *</label>
              <input
                type="text"
                value={examTopic}
                onChange={(e) => setExamTopic(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                placeholder="VD: Hàm số, Tích phân, Dao động cơ, Hóa hữu cơ..."
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Mức Độ Phân Hóa</label>
              <select
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              >
                <option value="Vận dụng cao (8+ đến 9+)">Vận dụng cao (8+ đến 9+ điểm)</option>
                <option value="Vận dụng (7+ đến 8+)">Vận dụng (7+ đến 8+ điểm)</option>
                <option value="Thông hiểu & Vận dụng cơ bản">Thông hiểu & Vận dụng cơ bản (6+ đến 7+)</option>
                <option value="Đề Ôn Thi Học Sinh Giỏi / Chuyên">Đề Ôn Thi Học Sinh Giỏi / Chuyên</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleGenerateExam}
              disabled={isLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Đang tạo đề thi...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Tạo Đề & Lời Giải Chi Tiết
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-sm">Kết Quả Đề Thi & Lời Giải AI</span>
                {generatedResult && (
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Đã sao chép' : 'Sao chép đề'}</span>
                  </button>
                )}
              </div>

              {generatedResult ? (
                <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono whitespace-pre-wrap max-h-[480px] overflow-y-auto leading-relaxed">
                  {generatedResult}
                </div>
              ) : (
                <div className="py-24 text-center text-slate-400 text-xs">
                  Nhập thông tin bên trái và bấm <strong>"Tạo Đề & Lời Giải Chi Tiết"</strong> để hệ thống soạn đề.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mode 4: Parent Comment Generator */}
      {activeMode === 'parent_comment' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 text-xs shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" /> Thông Tin Học Sinh Cần Đánh Giá
            </h3>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Chọn Học Sinh *</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-medium"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name} ({s.school})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Điểm Thi Khảo Sát Gần Nhất (Thang 10)</label>
              <input
                type="text"
                value={recentScore}
                onChange={(e) => setRecentScore(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-mono font-bold text-blue-700"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Điểm Mạnh / Tiến Bộ Của Em</label>
              <textarea
                rows={2}
                value={studentStrength}
                onChange={(e) => setStudentStrength(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Điểm Cần Rèn Luyện Thêm</label>
              <textarea
                rows={2}
                value={studentWeakness}
                onChange={(e) => setStudentWeakness(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerateParentComment}
              disabled={isLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Đang soạn thư...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Soạn Thư Nhận Xét Zalo Chuẩn Mực
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-sm">Nội Dung Thư Gửi Phụ Huynh</span>
                {generatedResult && (
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Đã sao chép' : 'Sao chép để gửi Zalo'}</span>
                  </button>
                )}
              </div>

              {generatedResult ? (
                <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 whitespace-pre-wrap max-h-[480px] overflow-y-auto leading-relaxed">
                  {generatedResult}
                </div>
              ) : (
                <div className="py-24 text-center text-slate-400 text-xs">
                  Chọn học sinh bên trái và bấm <strong>"Soạn Thư Nhận Xét Zalo"</strong> để tự động tạo nội dung cá nhân hóa.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
