import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import * as XLSX from 'xlsx';
import { getCenterCommuneOrLocation } from '../../utils/formatters.ts';
import {
  FileText,
  Sparkles,
  Shuffle,
  Download,
  Copy,
  Check,
  Upload,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Layers,
  HelpCircle,
  FileSpreadsheet,
  Printer,
  Grid,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  BookOpen,
  ArrowRight,
  Sliders,
  CheckSquare,
  Hash,
} from 'lucide-react';

export interface OptionItem {
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface ParsedQuestion {
  id: string;
  rawNumber: number;
  questionText: string;
  options: OptionItem[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  level?: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';
  isBasicCalculable?: boolean;
  // Variants with numerical modifications for basic questions
  numericVariants?: {
    questionText: string;
    options: OptionItem[];
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    explanation?: string;
  }[];
}

export interface GeneratedExamVersion {
  examCode: string;
  title: string;
  subject: string;
  grade: string;
  questions: {
    originalId: string;
    numberInExam: number;
    questionText: string;
    options: OptionItem[];
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    explanation?: string;
    hasNumericMutation: boolean;
  }[];
  answerKeyString: string; // "1A 2B 3C..."
  answerKeyCompact: string; // "1A2B3C..."
}

// Built-in sample question banks for 1-click loading
const SAMPLE_EXAMS: {
  id: string;
  name: string;
  subject: string;
  grade: string;
  duration: number;
  questions: ParsedQuestion[];
}[] = [
  {
    id: 'math-12-hamso',
    name: 'Toán 12 - Khảo sát & Cực trị hàm số (Chuẩn cấu trúc 10 câu)',
    subject: 'Toán Học',
    grade: '12',
    duration: 45,
    questions: [
      {
        id: 'q1',
        rawNumber: 1,
        level: 'Nhận biết',
        isBasicCalculable: true,
        questionText: 'Cho hàm số $y = f(x)$ có bảng biến thiên với đạo hàm đổi dấu từ dương sang âm khi qua điểm $x_0 = 2$. Khẳng định nào sau đây là đúng?',
        options: [
          { label: 'A', text: 'Hàm số đạt cực tiểu tại $x = 2$' },
          { label: 'B', text: 'Hàm số đạt cực đại tại $x = 2$' },
          { label: 'C', text: 'Giá trị cực đại của hàm số là $y = 2$' },
          { label: 'D', text: 'Hàm số đồng biến trên toàn bộ $\\mathbb{R}$' },
        ],
        correctAnswer: 'B',
        explanation: 'Đạo hàm đổi dấu từ (+) sang (-) qua $x_0$ thì hàm số đạt cực đại tại điểm $x_0$.',
        numericVariants: [
          {
            questionText: 'Cho hàm số $y = f(x)$ có đạo hàm đổi dấu từ âm sang dương khi qua điểm $x_0 = -3$. Khẳng định nào sau đây là đúng?',
            options: [
              { label: 'A', text: 'Hàm số đạt cực đại tại $x = -3$' },
              { label: 'B', text: 'Hàm số đạt cực tiểu tại $x = -3$' },
              { label: 'C', text: 'Giá trị cực tiểu của hàm số là $y = -3$' },
              { label: 'D', text: 'Hàm số nghịch biến trên $\\mathbb{R}$' },
            ],
            correctAnswer: 'B',
            explanation: 'Đạo hàm đổi dấu từ (-) sang (+) qua $x_0$ thì hàm số đạt cực tiểu tại $x_0 = -3$.',
          },
          {
            questionText: 'Cho hàm số $y = f(x)$ có đạo hàm $f\'(x) = (x-1)^2(x+4)$. Số điểm cực trị của hàm số đã cho là:',
            options: [
              { label: 'A', text: '1 điểm' },
              { label: 'B', text: '2 điểm' },
              { label: 'C', text: '3 điểm' },
              { label: 'D', text: '0 điểm' },
            ],
            correctAnswer: 'A',
            explanation: 'Đạo hàm chỉ đổi dấu qua nghiệm đơn $x = -4$, nghiệm bội chẵn $x = 1$ không đổi dấu. Vậy có 1 cực trị.',
          },
        ],
      },
      {
        id: 'q2',
        rawNumber: 2,
        level: 'Nhận biết',
        isBasicCalculable: true,
        questionText: 'Đồ thị của hàm số $y = \\frac{2x - 1}{x + 3}$ có đường tiệm cận ngang là đường thẳng:',
        options: [
          { label: 'A', text: '$y = 2$' },
          { label: 'B', text: '$y = -3$' },
          { label: 'C', text: '$x = -3$' },
          { label: 'D', text: '$y = -\\frac{1}{3}$' },
        ],
        correctAnswer: 'A',
        explanation: 'Tiệm cận ngang là $y = \\lim_{x \\to \\pm\\infty} \\frac{2x-1}{x+3} = 2$.',
        numericVariants: [
          {
            questionText: 'Đồ thị của hàm số $y = \\frac{3x + 5}{x - 2}$ có đường tiệm cận ngang là đường thẳng:',
            options: [
              { label: 'A', text: '$y = 3$' },
              { label: 'B', text: '$x = 2$' },
              { label: 'C', text: '$y = -2$' },
              { label: 'D', text: '$y = -\\frac{5}{2}$' },
            ],
            correctAnswer: 'A',
            explanation: 'Tiệm cận ngang là $y = 3$.',
          },
          {
            questionText: 'Đồ thị của hàm số $y = \\frac{4x - 7}{2x + 6}$ có đường tiệm cận đứng là đường thẳng:',
            options: [
              { label: 'A', text: '$x = -3$' },
              { label: 'B', text: '$y = 2$' },
              { label: 'C', text: '$x = 3$' },
              { label: 'D', text: '$y = -3$' },
            ],
            correctAnswer: 'A',
            explanation: 'Mẫu số $2x + 6 = 0 \\Leftrightarrow x = -3$, vậy tiệm cận đứng là $x = -3$.',
          },
        ],
      },
      {
        id: 'q3',
        rawNumber: 3,
        level: 'Thông hiểu',
        isBasicCalculable: true,
        questionText: 'Giá trị lớn nhất của hàm số $y = x^3 - 3x + 2$ trên đoạn $[0; 2]$ bằng:',
        options: [
          { label: 'A', text: '4' },
          { label: 'B', text: '2' },
          { label: 'C', text: '0' },
          { label: 'D', text: '6' },
        ],
        correctAnswer: 'A',
        explanation: 'Ta có $y\' = 3x^2 - 3 = 0 \\Leftrightarrow x = 1 \\in [0;2]$. Tính $y(0)=2, y(1)=0, y(2)=4$. Vậy $\\max = 4$.',
        numericVariants: [
          {
            questionText: 'Giá trị nhỏ nhất của hàm số $y = x^3 - 3x + 5$ trên đoạn $[0; 2]$ bằng:',
            options: [
              { label: 'A', text: '3' },
              { label: 'B', text: '5' },
              { label: 'C', text: '7' },
              { label: 'D', text: '1' },
            ],
            correctAnswer: 'A',
            explanation: 'Ta có $y(0)=5, y(1)=3, y(2)=7$. Vậy $\\min = 3$.',
          },
          {
            questionText: 'Giá trị lớn nhất của hàm số $y = -x^3 + 3x^2 + 1$ trên đoạn $[0; 3]$ bằng:',
            options: [
              { label: 'A', text: '5' },
              { label: 'B', text: '1' },
              { label: 'C', text: '0' },
              { label: 'D', text: '4' },
            ],
            correctAnswer: 'A',
            explanation: 'Ta có $y\' = -3x^2+6x = 0 \\Rightarrow x=0, x=2$. $y(0)=1, y(2)=5, y(3)=1$. Vậy $\\max = 5$.',
          },
        ],
      },
      {
        id: 'q4',
        rawNumber: 4,
        level: 'Thông hiểu',
        isBasicCalculable: true,
        questionText: 'Điểm cực tiểu của đồ thị hàm số $y = x^3 - 3x^2 + 4$ là:',
        options: [
          { label: 'A', text: '$(2; 0)$' },
          { label: 'B', text: '$(0; 4)$' },
          { label: 'C', text: '$x = 2$' },
          { label: 'D', text: '$y = 0$' },
        ],
        correctAnswer: 'A',
        explanation: '$y\' = 3x^2 - 6x = 0 \\Leftrightarrow x=0$ hoặc $x=2$. Tại $x=2 \\Rightarrow y=0$. Điểm cực tiểu của đồ thị là $(2; 0)$.',
        numericVariants: [
          {
            questionText: 'Điểm cực đại của đồ thị hàm số $y = -x^3 + 3x + 2$ là:',
            options: [
              { label: 'A', text: '$(1; 4)$' },
              { label: 'B', text: '$(-1; 0)$' },
              { label: 'C', text: '$x = 1$' },
              { label: 'D', text: '$y = 4$' },
            ],
            correctAnswer: 'A',
            explanation: '$y\' = -3x^2+3=0 \\Leftrightarrow x=\\pm 1$. Tại $x=1, y=4$. Điểm cực đại là $(1; 4)$.',
          },
        ],
      },
      {
        id: 'q5',
        rawNumber: 5,
        level: 'Thông hiểu',
        isBasicCalculable: true,
        questionText: 'Đường cong trong hình bên là đồ thị của hàm số nào dưới đây?',
        options: [
          { label: 'A', text: '$y = x^3 - 3x + 1$' },
          { label: 'B', text: '$y = -x^3 + 3x + 1$' },
          { label: 'C', text: '$y = x^4 - 2x^2 + 1$' },
          { label: 'D', text: '$y = \\frac{x+1}{x-1}$' },
        ],
        correctAnswer: 'A',
        explanation: 'Nhánh phải hướng lên ($a > 0$), có 2 điểm cực trị và cắt trục tung tại $(0; 1)$.',
      },
      {
        id: 'q6',
        rawNumber: 6,
        level: 'Vận dụng',
        isBasicCalculable: true,
        questionText: 'Tìm tất cả các giá trị của tham số $m$ để hàm số $y = \\frac{1}{3}x^3 - mx^2 + (m^2 - 4)x + 3$ đạt cực đại tại $x = 1$.',
        options: [
          { label: 'A', text: '$m = 3$' },
          { label: 'B', text: '$m = -1$' },
          { label: 'C', text: '$m = 3$ hoặc $m = -1$' },
          { label: 'D', text: 'Không tồn tại $m$' },
        ],
        correctAnswer: 'B',
        explanation: '$y\' = x^2 - 2mx + m^2 - 4$. Để đạt cực đại tại $x=1$ thì $y\'(1) = 1 - 2m + m^2 - 4 = 0 \\Leftrightarrow m^2 - 2m - 3 = 0 \\Leftrightarrow m=3$ hoặc $m=-1$. Với $y\'\'(1) = 2 - 2m < 0 \\Rightarrow m > 1$, chọn $m = 3$ là cực tiểu, $m = -1$ cho cực đại.',
      },
      {
        id: 'q7',
        rawNumber: 7,
        level: 'Vận dụng',
        isBasicCalculable: false,
        questionText: 'Có bao nhiêu giá trị nguyên của tham số $m \\in [-10; 10]$ để hàm số $y = x^3 - 3(m+1)x^2 + 3m(m+2)x + 1$ đồng biến trên khoảng $(2; +\\infty)$?',
        options: [
          { label: 'A', text: '12' },
          { label: 'B', text: '11' },
          { label: 'C', text: '10' },
          { label: 'D', text: '9' },
        ],
        correctAnswer: 'A',
        explanation: 'Xét $y\' \\ge 0, \\forall x > 2$. Ta được các khoảng nguyên của $m$ thỏa mãn, tổng cộng có 12 giá trị nguyên.',
      },
      {
        id: 'q8',
        rawNumber: 8,
        level: 'Vận dụng cao',
        isBasicCalculable: false,
        questionText: 'Một hồ bơi hình chữ nhật có chu vi mặt nước là $40\\text{ m}$. Hỏi diện tích mặt nước lớn nhất có thể đạt được là bao nhiêu để tạo cảnh quan tối ưu?',
        options: [
          { label: 'A', text: '$100\\text{ m}^2$' },
          { label: 'B', text: '$400\\text{ m}^2$' },
          { label: 'C', text: '$200\\text{ m}^2$' },
          { label: 'D', text: '$80\\text{ m}^2$' },
        ],
        correctAnswer: 'A',
        explanation: 'Nửa chu vi $a + b = 20$. Diện tích $S = a(20-a) \\le \\left(\\frac{a+20-a}{2}\\right)^2 = 100\\text{ m}^2$. Dấu bằng khi hình vuông cạnh $10\\text{ m}$.',
      },
    ],
  },
  {
    id: 'physics-12-dao-dong',
    name: 'Vật Lý 12 - Dao động điều hòa & Con lắc lò xo (8 câu)',
    subject: 'Vật Lý',
    grade: '12',
    duration: 30,
    questions: [
      {
        id: 'p1',
        rawNumber: 1,
        level: 'Nhận biết',
        isBasicCalculable: true,
        questionText: 'Một vật dao động điều hòa theo phương trình $x = A\\cos(\\omega t + \\varphi)$. Đại lượng $\\omega$ được gọi là:',
        options: [
          { label: 'A', text: 'Tần số góc của dao động' },
          { label: 'B', text: 'Biên độ dao động' },
          { label: 'C', text: 'Pha ban đầu' },
          { label: 'D', text: 'Chu kì dao động' },
        ],
        correctAnswer: 'A',
        explanation: '$\\omega$ (rad/s) là tần số góc của dao động điều hòa.',
      },
      {
        id: 'p2',
        rawNumber: 2,
        level: 'Thông hiểu',
        isBasicCalculable: true,
        questionText: 'Một con lắc lò xo có độ cứng $k = 100\\text{ N/m}$, gắn vật có khối lượng $m = 100\\text{ g}$. Lấy $\\pi^2 = 10$. Chu kì dao động riêng của con lắc là:',
        options: [
          { label: 'A', text: '$0{,}2\\text{ s}$' },
          { label: 'B', text: '$0{,}1\\text{ s}$' },
          { label: 'C', text: '$5\\text{ s}$' },
          { label: 'D', text: '$2\\text{ s}$' },
        ],
        correctAnswer: 'A',
        explanation: '$T = 2\\pi \\sqrt{\\frac{m}{k}} = 2\\pi \\sqrt{\\frac{0{,}1}{100}} = 2\\pi \\cdot \\frac{1}{10\\sqrt{10}} = \\frac{2}{10} = 0{,}2\\text{ s}$.',
        numericVariants: [
          {
            questionText: 'Một con lắc lò xo có độ cứng $k = 40\\text{ N/m}$, gắn vật khối lượng $m = 100\\text{ g}$. Lấy $\\pi^2 = 10$. Tần số góc $\\omega$ của con lắc là:',
            options: [
              { label: 'A', text: '$20\\text{ rad/s}$' },
              { label: 'B', text: '$10\\text{ rad/s}$' },
              { label: 'C', text: '$400\\text{ rad/s}$' },
              { label: 'D', text: '$2\\text{ rad/s}$' },
            ],
            correctAnswer: 'A',
            explanation: '$\\omega = \\sqrt{\\frac{k}{m}} = \\sqrt{\\frac{40}{0{,}1}} = 20\\text{ rad/s}$.',
          },
        ],
      },
      {
        id: 'p3',
        rawNumber: 3,
        level: 'Vận dụng',
        isBasicCalculable: true,
        questionText: 'Vật dao động điều hòa với biên độ $A = 6\\text{ cm}$. Khi vật có li độ $x = 3\\text{ cm}$ thì tỉ số giữa thế năng và động năng của vật là:',
        options: [
          { label: 'A', text: '$\\frac{1}{3}$' },
          { label: 'B', text: '$3$' },
          { label: 'C', text: '$\\frac{1}{4}$' },
          { label: 'D', text: '$1$' },
        ],
        correctAnswer: 'A',
        explanation: '$\\frac{W_t}{W_d} = \\frac{x^2}{A^2 - x^2} = \\frac{3^2}{6^2 - 3^2} = \\frac{9}{27} = \\frac{1}{3}$.',
      },
    ],
  },
  {
    id: 'english-thpt-grammar',
    name: 'Tiếng Anh THPT - Ngữ pháp & Trọng âm (8 câu)',
    subject: 'Tiếng Anh',
    grade: '12',
    duration: 30,
    questions: [
      {
        id: 'e1',
        rawNumber: 1,
        level: 'Nhận biết',
        isBasicCalculable: false,
        questionText: 'Mark the letter A, B, C, or D to indicate the word whose underlined part differs from the other three in pronunciation:',
        options: [
          { label: 'A', text: 'look<u>ed</u>' },
          { label: 'B', text: 'watch<u>ed</u>' },
          { label: 'C', text: 'play<u>ed</u>' },
          { label: 'D', text: 'laugh<u>ed</u>' },
        ],
        correctAnswer: 'C',
        explanation: 'play<u>ed</u> phát âm là /d/, các từ còn lại phát âm là /t/.',
      },
      {
        id: 'e2',
        rawNumber: 2,
        level: 'Thông hiểu',
        isBasicCalculable: false,
        questionText: 'If students ______ harder during the term, they would achieve much higher scores in the graduation exam.',
        options: [
          { label: 'A', text: 'studied' },
          { label: 'B', text: 'study' },
          { label: 'C', text: 'had studied' },
          { label: 'D', text: 'would study' },
        ],
        correctAnswer: 'A',
        explanation: 'Câu điều kiện loại 2: If + S + V2/ed, S + would + V-inf.',
      },
      {
        id: 'e3',
        rawNumber: 3,
        level: 'Vận dụng',
        isBasicCalculable: false,
        questionText: 'The new educational regulations are designed to prevent students ______ cheating in national examinations.',
        options: [
          { label: 'A', text: 'from' },
          { label: 'B', text: 'with' },
          { label: 'C', text: 'against' },
          { label: 'D', text: 'off' },
        ],
        correctAnswer: 'A',
        explanation: 'Cấu trúc: prevent sb from doing sth (ngăn cản ai làm việc gì).',
      },
    ],
  },
];

export const ExamVariationGenerator: React.FC = () => {
  const { settings, subjects } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configuration State
  const [examTitle, setExamTitle] = useState<string>('BÀI KIỂM TRA ĐỊNH KỲ CHẤT LƯỢNG CAO');
  const [examSubject, setExamSubject] = useState<string>('Toán Học');
  const [examGrade, setExamGrade] = useState<string>('12');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [numVersions, setNumVersions] = useState<number>(4); // 2, 4, 6, 8
  const [startingCode, setStartingCode] = useState<number>(101); // 101 -> 101, 102, 103, 104

  // Shuffling & Variation Rules
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(true);
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(true);
  const [mutateNumbersForBasic, setMutateNumbersForBasic] = useState<boolean>(true);
  const [keepHardQuestionsAtEnd, setKeepHardQuestionsAtEnd] = useState<boolean>(true);

  // Raw text input or parsed questions
  const [inputMode, setInputMode] = useState<'sample' | 'editor' | 'raw_paste'>('sample');
  const [rawText, setRawText] = useState<string>('');
  const [questions, setQuestions] = useState<ParsedQuestion[]>(SAMPLE_EXAMS[0].questions);

  // Generated Multi-Code Versions
  const [generatedVersions, setGeneratedVersions] = useState<GeneratedExamVersion[]>([]);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'preview_exams' | 'matrix_tn_maker' | 'bubble_sheet'>('config');

  // Load a built-in sample
  const handleLoadSample = (sampleId: string) => {
    const sample = SAMPLE_EXAMS.find((s) => s.id === sampleId);
    if (sample) {
      setExamTitle(sample.name);
      setExamSubject(sample.subject);
      setExamGrade(sample.grade);
      setDurationMinutes(sample.duration);
      setQuestions(JSON.parse(JSON.stringify(sample.questions)));
      setGeneratedVersions([]);
    }
  };

  // Parse raw text into structured ParsedQuestion array
  const parseRawExamText = (text: string): ParsedQuestion[] => {
    const parsedList: ParsedQuestion[] = [];
    if (!text.trim()) return parsedList;

    // Split by "Câu X" or "Câu X:" or "X." or "X/"
    const questionBlocks = text.split(/(?:^|\n)(?:Câu\s*\d+[\s:.]*|\d+[\s:.)/]+)/i).filter((b) => b.trim().length > 0);

    questionBlocks.forEach((block, index) => {
      const qNumber = index + 1;
      let questionContent = block;
      let explanation = '';
      let correctAns: 'A' | 'B' | 'C' | 'D' = 'A';

      // Extract explanation / solution if present
      const solutionMatch = questionContent.match(/(?:Lời giải|Hướng dẫn giải|Giải thích|HDG|Hds)[:\s]+([\s\S]*)/i);
      if (solutionMatch) {
        explanation = solutionMatch[1].trim();
        questionContent = questionContent.substring(0, solutionMatch.index).trim();
      }

      // Extract explicit answer key if present (e.g. "Đáp án: B" or "[B]" or "Key: C" or "Chọn A")
      const keyMatch = questionContent.match(/(?:Đáp án|Đ\/A|Key|Chọn|KQ)[:\s*\[]*([A-D])[\]\s*.]*/i);
      if (keyMatch) {
        correctAns = keyMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D';
        questionContent = questionContent.replace(keyMatch[0], '').trim();
      }

      // Extract 4 options A, B, C, D
      const options: OptionItem[] = [];
      const optionLetters: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];

      // Regex for finding options like A. ..., B. ..., C. ..., D. ...
      const optRegex = /(?:^|\s|\n)([A-D])[\s:.)\-]+([\s\S]*?)(?=(?:^|\s|\n)[A-D][\s:.)\-]+|$)/gi;
      const optMatches = Array.from(questionContent.matchAll(optRegex));

      if (optMatches.length >= 2) {
        // We found options in the text
        const firstOptIndex = optMatches[0].index || 0;
        const mainText = questionContent.substring(0, firstOptIndex).trim();

        optMatches.forEach((m) => {
          const letter = m[1].toUpperCase() as 'A' | 'B' | 'C' | 'D';
          const optText = m[2].trim();
          options.push({ label: letter, text: optText });
        });

        // Ensure we have A, B, C, D
        const filledOptions: OptionItem[] = optionLetters.map((l) => {
          const existing = options.find((o) => o.label === l);
          return existing || { label: l, text: `Phương án ${l}` };
        });

        parsedList.push({
          id: `raw-q-${qNumber}`,
          rawNumber: qNumber,
          questionText: mainText || `Nội dung câu hỏi số ${qNumber}`,
          options: filledOptions,
          correctAnswer: correctAns,
          explanation: explanation || undefined,
          level: qNumber <= 3 ? 'Nhận biết' : qNumber <= 7 ? 'Thông hiểu' : 'Vận dụng',
          isBasicCalculable: qNumber <= 5,
        });
      } else {
        // Fallback simple parsing
        parsedList.push({
          id: `raw-q-${qNumber}`,
          rawNumber: qNumber,
          questionText: questionContent.trim(),
          options: [
            { label: 'A', text: 'Phương án A' },
            { label: 'B', text: 'Phương án B' },
            { label: 'C', text: 'Phương án C' },
            { label: 'D', text: 'Phương án D' },
          ],
          correctAnswer: correctAns,
          explanation: explanation || undefined,
          level: 'Thông hiểu',
          isBasicCalculable: true,
        });
      }
    });

    return parsedList;
  };

  const handleParseRawText = () => {
    if (!rawText.trim()) return;
    const parsed = parseRawExamText(rawText);
    if (parsed.length > 0) {
      setQuestions(parsed);
      setInputMode('editor');
    }
  };

  // Handle file upload from computer (.txt, .doc, .docx text)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        const parsed = parseRawExamText(content);
        if (parsed.length > 0) {
          setQuestions(parsed);
          setInputMode('editor');
        } else {
          setInputMode('raw_paste');
        }
      }
    };
    reader.readAsText(file);
  };

  // Question editing helper
  const handleUpdateQuestion = (index: number, updated: Partial<ParsedQuestion>) => {
    setQuestions((prev) => {
      const clone = [...prev];
      clone[index] = { ...clone[index], ...updated };
      return clone;
    });
  };

  const handleAddQuestion = () => {
    const nextNum = questions.length + 1;
    const newQ: ParsedQuestion = {
      id: `q-custom-${Date.now()}`,
      rawNumber: nextNum,
      questionText: `Câu hỏi số ${nextNum}: Nhập nội dung câu hỏi tại đây...`,
      options: [
        { label: 'A', text: 'Phương án đúng A' },
        { label: 'B', text: 'Phương án B' },
        { label: 'C', text: 'Phương án C' },
        { label: 'D', text: 'Phương án D' },
      ],
      correctAnswer: 'A',
      level: 'Thông hiểu',
      isBasicCalculable: true,
    };
    setQuestions((prev) => [...prev, newQ]);
  };

  const handleDeleteQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Core Mutation & Shuffling Algorithm
  const handleGenerateVariations = () => {
    if (questions.length === 0) return;
    setIsGenerating(true);

    setTimeout(() => {
      const versions: GeneratedExamVersion[] = [];
      const optionLabels: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];

      for (let vIdx = 0; vIdx < numVersions; vIdx++) {
        const code = String(startingCode + vIdx);
        let qPool = JSON.parse(JSON.stringify(questions)) as ParsedQuestion[];

        // 1. Apply numeric mutations for basic questions if enabled and available
        const mutatedQuestions = qPool.map((q) => {
          let finalQText = q.questionText;
          let finalOptions = [...q.options];
          let finalCorrect = q.correctAnswer;
          let finalExp = q.explanation;
          let hasNumericMutation = false;

          if (mutateNumbersForBasic && q.numericVariants && q.numericVariants.length > 0) {
            // Pick variation based on version index
            const variantIdx = vIdx % (q.numericVariants.length + 1);
            if (variantIdx > 0) {
              const variant = q.numericVariants[variantIdx - 1];
              finalQText = variant.questionText;
              finalOptions = [...variant.options];
              finalCorrect = variant.correctAnswer;
              finalExp = variant.explanation || q.explanation;
              hasNumericMutation = true;
            }
          }

          return {
            originalId: q.id,
            rawNumber: q.rawNumber,
            level: q.level || 'Thông hiểu',
            questionText: finalQText,
            options: finalOptions,
            correctAnswer: finalCorrect,
            explanation: finalExp,
            hasNumericMutation,
          };
        });

        // 2. Separate into easy/medium and hard questions if keepHardQuestionsAtEnd is enabled
        let orderedQuestions = [...mutatedQuestions];
        if (shuffleQuestions) {
          if (keepHardQuestionsAtEnd) {
            const normalGroup = orderedQuestions.filter((q) => q.level !== 'Vận dụng cao');
            const hardGroup = orderedQuestions.filter((q) => q.level === 'Vận dụng cao');

            // Shuffle each group with deterministic-random seed
            const shuffleArray = <T,>(arr: T[]): T[] => {
              const res = [...arr];
              for (let i = res.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [res[i], res[j]] = [res[j], res[i]];
              }
              return res;
            };

            // Keep version 1 somewhat canonical, other versions shuffled
            const shuffledNormal = vIdx === 0 ? normalGroup : shuffleArray(normalGroup);
            const shuffledHard = vIdx === 0 ? hardGroup : shuffleArray(hardGroup);
            orderedQuestions = [...shuffledNormal, ...shuffledHard];
          } else {
            // Fully shuffle all questions
            if (vIdx > 0) {
              for (let i = orderedQuestions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [orderedQuestions[i], orderedQuestions[j]] = [orderedQuestions[j], orderedQuestions[i]];
              }
            }
          }
        }

        // 3. Shuffle Options (A, B, C, D) and track the new correct answer
        const finalVersionQuestions = orderedQuestions.map((q, qIndex) => {
          let currentOptions = [...q.options];
          let currentCorrect = q.correctAnswer;

          if (shuffleOptions && vIdx > 0) {
            // Find the correct option text before shuffling
            const correctOptObj = currentOptions.find((o) => o.label === currentCorrect);
            const correctText = correctOptObj ? correctOptObj.text : '';

            // Shuffle option contents
            const shuffledContents = currentOptions.map((o) => o.text);
            for (let i = shuffledContents.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffledContents[i], shuffledContents[j]] = [shuffledContents[j], shuffledContents[i]];
            }

            // Reassign labels A, B, C, D
            currentOptions = optionLabels.map((lbl, idx) => ({
              label: lbl,
              text: shuffledContents[idx],
            }));

            // Find where the correctText moved to
            const newCorrectIndex = currentOptions.findIndex((o) => o.text === correctText);
            currentCorrect = newCorrectIndex !== -1 ? optionLabels[newCorrectIndex] : 'A';
          }

          return {
            originalId: q.originalId,
            numberInExam: qIndex + 1,
            questionText: q.questionText,
            options: currentOptions,
            correctAnswer: currentCorrect,
            explanation: q.explanation,
            hasNumericMutation: q.hasNumericMutation,
          };
        });

        // 4. Generate answer keys (Standard TN Maker format)
        const keyString = finalVersionQuestions.map((q) => `${q.numberInExam}${q.correctAnswer}`).join(' ');
        const keyCompact = finalVersionQuestions.map((q) => `${q.numberInExam}${q.correctAnswer}`).join('');

        versions.push({
          examCode: code,
          title: examTitle,
          subject: examSubject,
          grade: examGrade,
          questions: finalVersionQuestions,
          answerKeyString: keyString,
          answerKeyCompact: keyCompact,
        });
      }

      setGeneratedVersions(versions);
      setSelectedVersionIndex(0);
      setIsGenerating(false);
      setActiveTab('preview_exams');
    }, 500);
  };

  // Export to Excel for TN Maker import and matrix sheet
  const handleExportTNMakerExcel = () => {
    if (generatedVersions.length === 0) return;

    const wb = XLSX.utils.book_new();

    // Sheet 1: TN Maker Import Sheet (Format: Mã đề, Câu 1, Câu 2, ...)
    const maxQuestions = Math.max(...generatedVersions.map((v) => v.questions.length));
    const headerRow = ['MÃ ĐỀ', ...Array.from({ length: maxQuestions }, (_, i) => `CÂU ${i + 1}`), 'CHUỖI ĐÁP ÁN TN MAKER'];
    const matrixRows: any[] = [headerRow];

    generatedVersions.forEach((v) => {
      const row = [
        v.examCode,
        ...v.questions.map((q) => q.correctAnswer),
        v.answerKeyString,
      ];
      matrixRows.push(row);
    });

    const wsMatrix = XLSX.utils.aoa_to_sheet(matrixRows);
    XLSX.utils.book_append_sheet(wb, wsMatrix, 'BANG_DAP_AN_TN_MAKER');

    // Sheet 2: TN Maker Quick Format (Mã đề, Chuỗi)
    const quickRows = [
      ['MÃ ĐỀ', 'ĐỊNH DẠNG IMPORT TN MAKER', 'TỔNG SỐ CÂU'],
      ...generatedVersions.map((v) => [v.examCode, v.answerKeyString, v.questions.length]),
    ];
    const wsQuick = XLSX.utils.aoa_to_sheet(quickRows);
    XLSX.utils.book_append_sheet(wb, wsQuick, 'DANH_SACH_MA_DE');

    const fileName = `Bang_Dap_An_TNMaker_${examSubject.replace(/\s+/g, '_')}_${examGrade}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Export TXT file formatted specifically for TN Maker mobile app
  const handleExportTNMakerTxt = () => {
    if (generatedVersions.length === 0) return;

    let txtContent = `=== BẢNG ĐÁP ÁN CHẤM BẰNG PHẦN MỀM TN MAKER ===\n`;
    txtContent += `Môn: ${examSubject} - Khối: ${examGrade} - Thời gian: ${durationMinutes} phút\n`;
    txtContent += `Đơn vị: ${settings.centerName || 'HỘ KINH DOANH PHAN NGUYÊN'}\n`;
    txtContent += `Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}\n\n`;

    generatedVersions.forEach((v) => {
      txtContent += `[Mã đề: ${v.examCode}]\n`;
      txtContent += `${v.answerKeyString}\n\n`;
    });

    txtContent += `=== MA TRẬN ĐỐI CHIẾU CHI TIẾT ===\n`;
    txtContent += `Câu\t` + generatedVersions.map((v) => `Mã ${v.examCode}`).join('\t') + '\n';

    const maxQ = Math.max(...generatedVersions.map((v) => v.questions.length));
    for (let i = 0; i < maxQ; i++) {
      const line = `${i + 1}\t` + generatedVersions.map((v) => v.questions[i]?.correctAnswer || '-').join('\t');
      txtContent += line + '\n';
    }

    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dap_An_TNMaker_${examSubject}_Khoi_${examGrade}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Word .doc file of exam (Current version or all versions)
  const handleExportWordDoc = (allVersions: boolean = false) => {
    const versionsToExport = allVersions ? generatedVersions : [generatedVersions[selectedVersionIndex]];
    if (versionsToExport.length === 0) return;

    const centerLoc = getCenterCommuneOrLocation(settings.centerAddress);
    const currentDate = new Date().toLocaleDateString('vi-VN');

    let contentHtml = '';

    versionsToExport.forEach((v, vIndex) => {
      const questionsHtml = v.questions
        .map(
          (q) => `
        <div style="margin-bottom: 14px; page-break-inside: avoid;">
          <div style="font-weight: bold; margin-bottom: 4px; color: #111;">
            Câu ${q.numberInExam}: <span style="font-weight: normal;">${q.questionText}</span>
          </div>
          <table style="width: 100%; border: none; margin-left: 10px;">
            <tr>
              <td style="width: 50%; padding: 2px 0; border: none;"><b>A.</b> ${q.options.find((o) => o.label === 'A')?.text || ''}</td>
              <td style="width: 50%; padding: 2px 0; border: none;"><b>B.</b> ${q.options.find((o) => o.label === 'B')?.text || ''}</td>
            </tr>
            <tr>
              <td style="width: 50%; padding: 2px 0; border: none;"><b>C.</b> ${q.options.find((o) => o.label === 'C')?.text || ''}</td>
              <td style="width: 50%; padding: 2px 0; border: none;"><b>D.</b> ${q.options.find((o) => o.label === 'D')?.text || ''}</td>
            </tr>
          </table>
        </div>
      `
        )
        .join('');

      const pageBreak = vIndex < versionsToExport.length - 1 ? '<div style="page-break-after: always;"></div>' : '';

      contentHtml += `
        <table style="width: 100%; border: none; margin-bottom: 12px;">
          <tr>
            <td style="width: 45%; border: none; font-size: 10pt; line-height: 1.3;">
              <b>${settings.centerName || 'HỘ KINH DOANH PHAN NGUYÊN'}</b><br/>
              <b>BAN CHUYÊN MÔN & LUYỆN THI</b><br/>
              <i>(Đề thi có ${v.questions.length} câu)</i>
            </td>
            <td style="width: 55%; border: none; text-align: center; font-size: 11pt; line-height: 1.3;">
              <b style="font-size: 12pt; text-transform: uppercase;">${v.title}</b><br/>
              <b>Môn: ${v.subject} - Khối ${v.grade}</b><br/>
              <i>Thời gian làm bài: ${durationMinutes} phút (không kể phát đề)</i>
            </td>
          </tr>
        </table>

        <div style="border: 1.5px solid #000; padding: 8px 12px; margin-bottom: 14px; font-size: 10.5pt; background-color: #fafafa;">
          <table style="width: 100%; border: none;">
            <tr>
              <td style="width: 60%; border: none;">Họ và tên thí sinh: ............................................................................</td>
              <td style="width: 40%; border: none; text-align: right;"><b>MÃ ĐỀ THI: <span style="font-size: 13pt; color: #b91c1c;">${v.examCode}</span></b></td>
            </tr>
            <tr>
              <td style="width: 60%; border: none;">Số báo danh (SBD): ...................................... Lớp: .........................</td>
              <td style="width: 40%; border: none; text-align: right; font-size: 9.5pt; color: #444;"><i>(Chấm bằng phần mềm TN Maker)</i></td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 10px;">
          ${questionsHtml}
        </div>

        <div style="text-align: center; margin-top: 25px; font-style: italic; font-weight: bold; border-top: 1px dashed #666; padding-top: 10px;">
          ---------- HẾT ----------<br/>
          <span style="font-size: 9pt; font-weight: normal; color: #666;">Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm.</span>
        </div>

        ${pageBreak}
      `;
    });

    const fullDoc = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${examTitle} - Ma De ${versionsToExport.map((v) => v.examCode).join('_')}</title>
        <style>
          @page { size: 21cm 29.7cm; margin: 1.5cm; }
          body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #111; line-height: 1.35; }
          table { border-collapse: collapse; }
        </style>
      </head>
      <body>
        ${contentHtml}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', fullDoc], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `De_Thi_${examSubject}_Ma_${versionsToExport.map((v) => v.examCode).join('_')}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy 1-click answer key
  const handleCopyAnswerKey = (keyString: string, label: string) => {
    navigator.clipboard.writeText(keyString);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Print Bubble Answer Sheet (TN Maker Standard Sheet)
  const handlePrintBubbleSheet = () => {
    window.print();
  };

  const currentVersion = generatedVersions[selectedVersionIndex];

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Tabs */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-1.5">
            <Shuffle className="w-3.5 h-3.5" /> Tạo Đề Tương Tự & Trộn Đề Chấm TN Maker
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Tạo Biến Thể Đề Thi, Đổi Số Liệu & Xuất File TN Maker
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tự động đổi số liệu câu cơ bản, đảo vị trí câu hỏi & 4 phương án A-B-C-D, tạo nhiều mã đề và xuất bảng đáp án chuẩn app TN Maker
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'config' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> Cấu Hình & Soạn Đề ({questions.length} câu)
          </button>
          <button
            onClick={() => {
              if (generatedVersions.length === 0) handleGenerateVariations();
              setActiveTab('preview_exams');
            }}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'preview_exams' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Xem Đề Từng Mã ({generatedVersions.length || numVersions} mã)
          </button>
          <button
            onClick={() => {
              if (generatedVersions.length === 0) handleGenerateVariations();
              setActiveTab('matrix_tn_maker');
            }}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'matrix_tn_maker' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Grid className="w-3.5 h-3.5" /> Bảng Đáp Án TN Maker
          </button>
          <button
            onClick={() => setActiveTab('bubble_sheet')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'bubble_sheet' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer className="w-3.5 h-3.5" /> Phiếu Tô TN Maker
          </button>
        </div>
      </div>

      {/* TAB 1: CONFIGURATION & QUESTION EDITOR */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Settings Sidebar (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Quick Sample Banks */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-600" /> Ngân Hàng Đề Mẫu Chuẩn
                </span>
                <span className="text-[11px] text-slate-500 font-medium">1-Click Nạp Đề</span>
              </div>
              <div className="space-y-1.5">
                {SAMPLE_EXAMS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleLoadSample(s.id)}
                    className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-xs flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 group-hover:text-indigo-700">{s.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {s.subject} · Khối {s.grade} · {s.questions.length} câu trắc nghiệm
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* General Exam Parameters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" /> Thông Tin Đề Thi
              </h3>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tiêu Đề Đề Thi *</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-medium focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Môn Học *</label>
                  <select
                    value={examSubject}
                    onChange={(e) => setExamSubject(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                    <option value="Toán Học">Toán Học</option>
                    <option value="Vật Lý">Vật Lý</option>
                    <option value="Hóa Học">Hóa Học</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                    <option value="Sinh Học">Sinh Học</option>
                    <option value="Ngữ Văn">Ngữ Văn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Khối Lớp *</label>
                  <select
                    value={examGrade}
                    onChange={(e) => setExamGrade(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                  >
                    <option value="6">Khối 6</option>
                    <option value="7">Khối 7</option>
                    <option value="8">Khối 8</option>
                    <option value="9">Khối 9</option>
                    <option value="10">Khối 10</option>
                    <option value="11">Khối 11</option>
                    <option value="12">Khối 12</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Thời Gian (Phút)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value) || 45)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none font-medium"
                    min={10}
                    max={180}
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Số Lượng Mã Đề</label>
                  <select
                    value={numVersions}
                    onChange={(e) => setNumVersions(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg outline-none font-bold text-indigo-700"
                  >
                    <option value={2}>2 Mã Đề (101, 102)</option>
                    <option value={4}>4 Mã Đề (101 - 104)</option>
                    <option value={6}>6 Mã Đề (101 - 106)</option>
                    <option value={8}>8 Mã Đề (101 - 108)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mã Đề Bắt Đầu</label>
                <input
                  type="number"
                  value={startingCode}
                  onChange={(e) => setStartingCode(Number(e.target.value) || 101)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none font-mono"
                  placeholder="101"
                />
              </div>
            </div>

            {/* Shuffling & Variation Rules */}
            <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-200 shadow-sm space-y-2.5 text-xs">
              <h3 className="font-bold text-indigo-950 flex items-center gap-1.5">
                <Shuffle className="w-4 h-4 text-indigo-600" /> Tùy Chọn Đổi Số Liệu & Trộn Đề
              </h3>

              <label className="flex items-start gap-2.5 cursor-pointer p-1.5 hover:bg-white/60 rounded-lg transition-all">
                <input
                  type="checkbox"
                  checked={mutateNumbersForBasic}
                  onChange={(e) => setMutateNumbersForBasic(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <div>
                  <div className="font-bold text-indigo-950">Thay đổi số liệu cho câu cơ bản</div>
                  <div className="text-[11px] text-slate-600">
                    Tự động tạo biến thể số liệu tương đương cho các câu thông hiểu, giữ nguyên cấu trúc bài
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer p-1.5 hover:bg-white/60 rounded-lg transition-all">
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <div>
                  <div className="font-bold text-indigo-950">Đảo thứ tự các câu hỏi</div>
                  <div className="text-[11px] text-slate-600">Mỗi mã đề sẽ có thứ tự câu hỏi ngẫu nhiên khác nhau</div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer p-1.5 hover:bg-white/60 rounded-lg transition-all">
                <input
                  type="checkbox"
                  checked={shuffleOptions}
                  onChange={(e) => setShuffleOptions(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <div>
                  <div className="font-bold text-indigo-950">Đảo thứ tự 4 đáp án A, B, C, D</div>
                  <div className="text-[11px] text-slate-600">Tự động cập nhật lại vị trí đáp án đúng chính xác 100%</div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer p-1.5 hover:bg-white/60 rounded-lg transition-all">
                <input
                  type="checkbox"
                  checked={keepHardQuestionsAtEnd}
                  onChange={(e) => setKeepHardQuestionsAtEnd(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <div>
                  <div className="font-bold text-indigo-950">Giữ nhóm câu Vận Dụng Cao ở cuối</div>
                  <div className="text-[11px] text-slate-600">Đảm bảo tính sư phạm: làm câu dễ trước, câu phân hóa sau</div>
                </div>
              </label>

              <button
                type="button"
                onClick={handleGenerateVariations}
                disabled={isGenerating || questions.length === 0}
                className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer text-sm"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Đang tạo {numVersions} mã đề...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Bắt Đầu Tạo {numVersions} Mã Đề & TN Maker
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Question Bank & Editor (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Action Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">
                  Danh Sách Câu Hỏi Gốc ({questions.length} câu)
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold text-[11px]">
                  Đã sẵn sàng tạo đề
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.doc,.docx"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
                  title="Nhập đề mẫu từ file txt trên máy tính"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-600" /> Tải Tệp Đề Từ Máy Tính (.txt/.doc)
                </button>

                <button
                  onClick={() => {
                    setInputMode(inputMode === 'raw_paste' ? 'editor' : 'raw_paste');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer ${
                    inputMode === 'raw_paste'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" /> {inputMode === 'raw_paste' ? 'Quay Lại Bảng Soạn' : 'Dán Đề Văn Bản'}
                </button>

                <button
                  onClick={handleAddQuestion}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm Câu Hỏi
                </button>
              </div>
            </div>

            {/* Raw Text Paste Box (If active) */}
            {inputMode === 'raw_paste' && (
              <div className="bg-white p-5 rounded-xl border border-indigo-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" /> Dán Nội Dung Đề Thi Trắc Nghiệm Dạng Văn Bản
                  </span>
                  <span className="text-[11px] text-slate-500">Hỗ trợ nhận diện tự động Câu 1, 2... và A. B. C. D.</span>
                </div>
                <textarea
                  rows={10}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Ví dụ định dạng đề:
Câu 1: Cho hàm số y = f(x)...
A. Phương án 1
B. Phương án 2
C. Phương án 3
D. Phương án 4
Đáp án: A
Lời giải: Giải thích chi tiết...

Câu 2: Đồ thị hàm số...
A. ...  B. ...  C. ...  D. ...`}
                  className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setInputMode('editor')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    onClick={handleParseRawText}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <CheckSquare className="w-4 h-4" /> Bóc Tách Tự Động & Chuyển Vào Danh Sách
                  </button>
                </div>
              </div>
            )}

            {/* Question List Accordion / Editor */}
            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
              {questions.map((q, qIndex) => (
                <div
                  key={q.id || `q-${qIndex}`}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs space-y-3 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center shrink-0">
                        {qIndex + 1}
                      </span>
                      <span className="font-bold text-slate-800">Câu {qIndex + 1}</span>
                      <select
                        value={q.level || 'Thông hiểu'}
                        onChange={(e) => handleUpdateQuestion(qIndex, { level: e.target.value as any })}
                        className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-100 border border-slate-200 text-slate-700 outline-none"
                      >
                        <option value="Nhận biết">Nhận biết</option>
                        <option value="Thông hiểu">Thông hiểu</option>
                        <option value="Vận dụng">Vận dụng</option>
                        <option value="Vận dụng cao">Vận dụng cao</option>
                      </select>
                      {q.numericVariants && q.numericVariants.length > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-800 rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-600" /> Có {q.numericVariants.length} biến thể số liệu
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 font-medium text-[11px]">Đáp án đúng:</span>
                        <div className="flex items-center gap-1">
                          {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleUpdateQuestion(qIndex, { correctAnswer: opt })}
                              className={`w-6 h-6 rounded-md font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                                q.correctAnswer === opt
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteQuestion(qIndex)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-all cursor-pointer"
                        title="Xóa câu hỏi này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div>
                    <textarea
                      rows={2}
                      value={q.questionText}
                      onChange={(e) => handleUpdateQuestion(qIndex, { questionText: e.target.value })}
                      className="w-full p-2.5 text-xs text-slate-900 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-slate-50/50"
                      placeholder="Nhập nội dung câu hỏi..."
                    />
                  </div>

                  {/* Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={opt.label}
                        className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                          q.correctAnswer === opt.label
                            ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300'
                            : 'bg-slate-50/70 border-slate-200'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleUpdateQuestion(qIndex, { correctAnswer: opt.label })}
                          className={`w-6 h-6 rounded font-bold text-xs shrink-0 flex items-center justify-center cursor-pointer ${
                            q.correctAnswer === opt.label
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => {
                            const newOpts = [...q.options];
                            newOpts[oIdx] = { ...newOpts[oIdx], text: e.target.value };
                            handleUpdateQuestion(qIndex, { options: newOpts });
                          }}
                          className="w-full bg-transparent text-xs outline-none font-medium text-slate-800"
                          placeholder={`Phương án ${opt.label}...`}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Explanation if any */}
                  {q.explanation && (
                    <div className="p-2.5 bg-blue-50/50 border border-blue-100 rounded-lg text-[11px] text-blue-900 flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Hướng dẫn giải / Đáp án: </span>
                        <span>{q.explanation}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PREVIEW EXAMS (EACH CODE 101, 102...) */}
      {activeTab === 'preview_exams' && (
        <div className="space-y-5">
          {generatedVersions.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm space-y-4">
              <AlertCircle className="w-10 h-10 text-indigo-600 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Chưa tạo biến thể mã đề thi</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Vui lòng bấm nút bên dưới để hệ thống tự động đổi số liệu, xáo trộn câu hỏi và tạo các mã đề thi kèm đáp án TN Maker.
                </p>
              </div>
              <button
                onClick={handleGenerateVariations}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" /> Bắt Đầu Tạo {numVersions} Mã Đề
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Selector & Exports (4 Cols) */}
              <div className="lg:col-span-4 space-y-4">
                {/* Code Selector */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-600" /> Chọn Mã Đề Thi Xem Trước
                    </span>
                    <span className="text-[11px] font-bold text-indigo-600">
                      {generatedVersions.length} Mã Đề
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {generatedVersions.map((ver, idx) => (
                      <button
                        key={ver.examCode}
                        onClick={() => setSelectedVersionIndex(idx)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          selectedVersionIndex === idx
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        <div className="text-[10px] opacity-80 uppercase tracking-wider">Mã Đề</div>
                        <div className="text-lg font-black">{ver.examCode}</div>
                        <div className="text-[10px] mt-0.5 opacity-90">{ver.questions.length} câu</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick TN Maker Answer Key Box for Current Code */}
                {currentVersion && (
                  <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-4 rounded-xl shadow-md space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-white">Đáp Án TN Maker (Mã {currentVersion.examCode})</span>
                      </div>
                      <button
                        onClick={() => handleCopyAnswerKey(currentVersion.answerKeyString, `key-${currentVersion.examCode}`)}
                        className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        {copiedKey === `key-${currentVersion.examCode}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-300" /> Đã chép
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Chép mã
                          </>
                        )}
                      </button>
                    </div>

                    <div className="bg-black/40 p-2.5 rounded-lg font-mono text-[11px] text-amber-200 break-words leading-relaxed border border-white/10">
                      {currentVersion.answerKeyString}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-white/10">
                      <span>Dán chuỗi trên vào app TN Maker</span>
                      <span className="text-amber-400 font-bold">1-Click Chấm Điểm</span>
                    </div>
                  </div>
                )}

                {/* Export Buttons */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2.5 text-xs">
                  <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-indigo-600" /> Xuất Bản Đề Thi & Bảng Đáp Án
                  </h3>

                  <button
                    onClick={() => handleExportWordDoc(false)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <FileText className="w-4 h-4" /> Tải Đề Word Mã {currentVersion?.examCode} (.doc)
                  </button>

                  <button
                    onClick={() => handleExportWordDoc(true)}
                    className="w-full py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Layers className="w-4 h-4" /> Tải Gộp Tất Cả {generatedVersions.length} Mã Đề (.doc)
                  </button>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={handleExportTNMakerExcel}
                      className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" /> File Excel TN Maker
                    </button>
                    <button
                      onClick={handleExportTNMakerTxt}
                      className="py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" /> File TXT TN Maker
                    </button>
                  </div>

                  <button
                    onClick={handleGenerateVariations}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Trộn Lại & Sinh Số Liệu Mới
                  </button>
                </div>
              </div>

              {/* Right Paper Preview (8 Cols) */}
              <div className="lg:col-span-8">
                {currentVersion && (
                  <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-md space-y-6 font-serif text-slate-900 leading-relaxed text-sm">
                    {/* Official Exam Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-200 font-sans">
                      <div>
                        <div className="font-bold text-slate-900 text-xs uppercase">
                          {settings.centerName || 'HỘ KINH DOANH PHAN NGUYÊN'}
                        </div>
                        <div className="font-semibold text-slate-700 text-[11px]">
                          BAN CHUYÊN MÔN & BỒI DƯỠNG VĂN HÓA
                        </div>
                        <div className="text-[10px] text-slate-500 italic">
                          (Đề thi gồm {currentVersion.questions.length} câu trắc nghiệm)
                        </div>
                      </div>

                      <div className="text-center sm:text-right">
                        <div className="font-black text-indigo-950 text-sm uppercase">
                          {currentVersion.title}
                        </div>
                        <div className="font-bold text-slate-800 text-xs">
                          Môn: {currentVersion.subject} - Khối {currentVersion.grade}
                        </div>
                        <div className="text-[11px] text-slate-600 italic">
                          Thời gian: {durationMinutes} phút (Không kể thời gian phát đề)
                        </div>
                      </div>
                    </div>

                    {/* Student Info Box */}
                    <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg font-sans text-xs flex flex-col sm:flex-row justify-between items-center gap-3">
                      <div className="space-y-1 w-full sm:w-auto">
                        <div>Họ và tên thí sinh: ..........................................................................</div>
                        <div>Số báo danh (SBD): ................................. Lớp: .........................</div>
                      </div>
                      <div className="bg-red-50 border-2 border-red-500 text-red-700 px-4 py-1.5 rounded-lg font-black text-sm text-center shrink-0">
                        MÃ ĐỀ: {currentVersion.examCode}
                      </div>
                    </div>

                    {/* Questions Body */}
                    <div className="space-y-5">
                      {currentVersion.questions.map((q) => (
                        <div key={q.numberInExam} className="space-y-2">
                          <div className="font-medium">
                            <span className="font-bold text-slate-950 font-sans">Câu {q.numberInExam}: </span>
                            <span>{q.questionText}</span>
                            {q.hasNumericMutation && (
                              <span className="ml-2 font-sans px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-800 font-bold rounded">
                                Biến thể số liệu
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4">
                            {q.options.map((opt) => (
                              <div
                                key={opt.label}
                                className={`text-xs p-1.5 rounded flex items-start gap-1.5 ${
                                  opt.label === q.correctAnswer
                                    ? 'bg-emerald-50 text-emerald-950 font-semibold border border-emerald-200'
                                    : 'text-slate-800'
                                }`}
                              >
                                <span className="font-bold font-sans">{opt.label}.</span>
                                <span>{opt.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Exam End Note */}
                    <div className="text-center pt-6 border-t border-slate-200 text-xs italic font-sans text-slate-500">
                      ---------- HẾT ----------
                      <br />
                      <span className="text-[11px]">Thí sinh không được sử dụng tài liệu. Chấm tự động bằng phần mềm TN Maker.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MATRIX & TN MAKER QUICK SCAN SHEET */}
      {activeTab === 'matrix_tn_maker' && (
        <div className="space-y-6">
          {generatedVersions.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm space-y-4">
              <AlertCircle className="w-10 h-10 text-indigo-600 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Chưa tạo biến thể mã đề thi</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Vui lòng bấm nút bên dưới để tạo các mã đề và bảng ma trận đáp án TN Maker.
                </p>
              </div>
              <button
                onClick={handleGenerateVariations}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" /> Bắt Đầu Tạo {numVersions} Mã Đề
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Actions */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Grid className="w-5 h-5 text-indigo-600" /> Bảng Ma Trận Đáp Án & Định Dạng Import TN Maker
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Đầy đủ {generatedVersions.length} mã đề ({generatedVersions.map((v) => v.examCode).join(', ')}) với chuỗi đáp án chuẩn
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleExportTNMakerExcel}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Tải File Excel TN Maker
                  </button>
                  <button
                    onClick={handleExportTNMakerTxt}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <FileText className="w-4 h-4" /> Tải File TXT TN Maker
                  </button>
                </div>
              </div>

              {/* Quick Copy Cards for TN Maker */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {generatedVersions.map((ver) => (
                  <div
                    key={ver.examCode}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mã Đề</span>
                        <div className="text-lg font-black text-indigo-900">{ver.examCode}</div>
                      </div>
                      <button
                        onClick={() => handleCopyAnswerKey(ver.answerKeyString, `card-${ver.examCode}`)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        {copiedKey === `card-${ver.examCode}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Đã sao chép
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Sao chép
                          </>
                        )}
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Chuỗi Đáp Án TN Maker:</label>
                      <div className="mt-1 p-2 bg-slate-50 rounded-lg font-mono text-[11px] font-bold text-slate-800 break-words leading-relaxed border border-slate-200">
                        {ver.answerKeyString}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-1 text-center text-[10px] pt-1">
                      {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                        const count = ver.questions.filter((q) => q.correctAnswer === opt).length;
                        return (
                          <div key={opt} className="bg-slate-100 p-1 rounded font-semibold text-slate-700">
                            {opt}: <span className="font-bold text-indigo-600">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Full Comparison Matrix Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Grid className="w-4 h-4 text-indigo-600" /> Bảng Đối Chiếu Đáp Án Tất Cả Các Câu
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Tổng số {Math.max(...generatedVersions.map((v) => v.questions.length))} câu
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 w-16 text-center">Câu</th>
                        {generatedVersions.map((v) => (
                          <th key={v.examCode} className="py-3 px-4 text-center">
                            Mã {v.examCode}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Array.from({ length: Math.max(...generatedVersions.map((v) => v.questions.length)) }).map((_, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-4 font-bold text-center text-slate-900 bg-slate-50/50">
                            {idx + 1}
                          </td>
                          {generatedVersions.map((v) => {
                            const ans = v.questions[idx]?.correctAnswer || '-';
                            return (
                              <td key={v.examCode} className="py-2.5 px-4 text-center">
                                <span
                                  className={`inline-block w-7 h-7 leading-7 rounded-md font-bold text-xs ${
                                    ans === 'A'
                                      ? 'bg-blue-100 text-blue-800'
                                      : ans === 'B'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : ans === 'C'
                                      ? 'bg-amber-100 text-amber-800'
                                      : ans === 'D'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-slate-100 text-slate-400'
                                  }`}
                                >
                                  {ans}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PRINTABLE BUBBLE SHEET (TN MAKER COMPLIANT) */}
      {activeTab === 'bubble_sheet' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" /> Mẫu Phiếu Trả Lời Trắc Nghiệm Chuẩn TN Maker
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mẫu phiếu tô chuẩn kích thước chấm camera điện thoại TN Maker (20 câu / 40 câu / 50 câu)
              </p>
            </div>

            <button
              onClick={handlePrintBubbleSheet}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" /> In Phiếu Trắc Nghiệm Này (Ctrl + P)
            </button>
          </div>

          {/* Printable Sheet Frame */}
          <div className="bg-white p-8 max-w-3xl mx-auto rounded-xl border-2 border-slate-800 shadow-lg font-sans text-slate-900 space-y-6">
            {/* Sheet Header */}
            <div className="text-center border-b-2 border-slate-800 pb-4 space-y-1">
              <div className="font-bold text-xs uppercase tracking-wider text-slate-700">
                {settings.centerName || 'HỘ KINH DOANH PHAN NGUYÊN'}
              </div>
              <div className="font-black text-lg text-slate-950 uppercase">
                PHIẾU TRẢ LỜI TRẮC NGHIỆM CHUẨN TN MAKER
              </div>
              <div className="text-[11px] text-slate-600 italic">
                (Dùng bút chì 2B để tô kín các ô tròn tương ứng với phương án lựa chọn)
              </div>
            </div>

            {/* Info Fill Block */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-slate-400 p-3 rounded-lg text-xs">
              <div className="sm:col-span-2 space-y-2">
                <div>Họ và tên thí sinh: ............................................................................</div>
                <div>Lớp: ......................... Phòng thi: ..................... Ngày: ....................</div>
                <div>Môn thi: .........................................................................................</div>
              </div>
              <div className="border-l sm:border-slate-300 sm:pl-3 space-y-1 text-center">
                <div className="font-bold uppercase text-[11px]">Khung Điền Mã Đề & SBD</div>
                <div className="grid grid-cols-2 gap-1 pt-1 font-mono text-center">
                  <div className="border border-slate-400 p-1 rounded">
                    <div className="text-[9px] text-slate-500 font-bold">SBD</div>
                    <div className="text-xs font-black">| | | | | |</div>
                  </div>
                  <div className="border border-red-500 bg-red-50 p-1 rounded">
                    <div className="text-[9px] text-red-600 font-bold">MÃ ĐỀ</div>
                    <div className="text-xs font-black text-red-700">| | |</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] flex items-center justify-around">
              <div className="flex items-center gap-1.5">
                <span className="font-bold">ĐÚNG:</span>
                <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[9px] font-bold flex items-center justify-center">●</span>
                <span className="italic text-slate-600">Tô tròn đậm</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="font-bold text-red-600">SAI:</span>
                <span>✕ Gạch chéo</span>
                <span>✔ Đánh dấu</span>
                <span>◯ Tô mờ</span>
              </div>
            </div>

            {/* 40 Bubble Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              {Array.from({ length: 4 }).map((_, colIdx) => (
                <div key={colIdx} className="space-y-1.5 border border-slate-200 p-2 rounded">
                  {Array.from({ length: 10 }).map((_, rowIdx) => {
                    const qNum = colIdx * 10 + rowIdx + 1;
                    return (
                      <div key={qNum} className="flex items-center justify-between text-[11px]">
                        <span className="w-6 font-bold text-slate-700">{qNum}.</span>
                        <div className="flex items-center gap-1">
                          {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                            <span
                              key={opt}
                              className="w-4 h-4 rounded-full border border-slate-400 text-slate-700 text-[9px] font-bold flex items-center justify-center hover:bg-slate-900 hover:text-white transition-colors cursor-pointer"
                            >
                              {opt}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] text-slate-400 italic pt-2">
              Bản quyền biểu mẫu © {new Date().getFullYear()} {settings.centerName || 'HỘ KINH DOANH PHAN NGUYÊN'} - Tương thích máy chấm TN Maker.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
