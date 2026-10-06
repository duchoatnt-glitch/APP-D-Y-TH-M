import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Student, GradeLevel } from '../../types/index.ts';
import { X, Save } from 'lucide-react';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingStudent?: Student | null;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  editingStudent,
}) => {
  const { classes, addStudent, updateStudent } = useApp();

  const [formData, setFormData] = useState<Partial<Student>>({
    code: '',
    name: '',
    gender: 'Nam',
    dob: '2008-01-01',
    phone: '',
    school: '',
    gradeLevel: '12',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    address: '',
    enrolledClassIds: [],
    status: 'active',
    targetGoal: '',
    notes: '',
    joinDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (editingStudent) {
      setFormData(editingStudent);
    } else {
      setFormData({
        code: `HS-${Math.floor(26000 + Math.random() * 900)}`,
        name: '',
        gender: 'Nam',
        dob: '2008-05-15',
        phone: '',
        school: '',
        gradeLevel: '12',
        parentName: '',
        parentPhone: '',
        parentEmail: '',
        address: '',
        enrolledClassIds: [],
        status: 'active',
        targetGoal: '',
        notes: '',
        joinDate: new Date().toISOString().split('T')[0],
      });
    }
  }, [editingStudent, isOpen]);

  if (!isOpen) return null;

  const handleClassToggle = (classId: string) => {
    const current = formData.enrolledClassIds || [];
    if (current.includes(classId)) {
      setFormData({
        ...formData,
        enrolledClassIds: current.filter((id) => id !== classId),
      });
    } else {
      setFormData({
        ...formData,
        enrolledClassIds: [...current, classId],
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.parentPhone) {
      alert('Vui lòng điền họ tên học sinh và số điện thoại phụ huynh!');
      return;
    }

    if (editingStudent) {
      updateStudent(editingStudent.id, formData);
    } else {
      addStudent({
        ...formData as Student,
        id: `stu-${Date.now()}`,
        enrolledClassIds: formData.enrolledClassIds || [],
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-900 text-base">
            {editingStudent ? 'Cập Nhật Hồ Sơ Học Sinh' : 'Tiếp Nhận Học Sinh Mới'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Row 1: Code, Name, Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Mã Học Sinh *</label>
              <input
                type="text"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-mono"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Họ và Tên Học Sinh *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                placeholder="VD: Nguyễn Hoàng Minh"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Giới Tính</label>
              <select
                value={formData.gender || 'Nam'}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Nam' | 'Nữ' })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
          </div>

          {/* Row 2: School, School Class, Grade, Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Trường Đang Học</label>
              <input
                type="text"
                value={formData.school || ''}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                placeholder="VD: THPT Chu Văn An"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Lớp (Ở Trường)</label>
              <input
                type="text"
                value={formData.schoolClass || ''}
                onChange={(e) => setFormData({ ...formData, schoolClass: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                placeholder="VD: 12A1, 10 Chuyên..."
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Khối Lớp *</label>
              <select
                value={formData.gradeLevel || '12'}
                onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value as GradeLevel })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
              >
                <option value="6">Khối 6</option>
                <option value="7">Khối 7</option>
                <option value="8">Khối 8</option>
                <option value="9">Khối 9 (Vào 10)</option>
                <option value="10">Khối 10</option>
                <option value="11">Khối 11</option>
                <option value="12">Khối 12</option>
                <option value="IELTS">IELTS</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">SĐT Học Sinh</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-mono"
                placeholder="0912..."
              />
            </div>
          </div>

          {/* Row 3: Parent details */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="font-semibold text-slate-800">Thông Tin Phụ Huynh Liên Hệ</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 mb-1">Họ Tên Phụ Huynh *</label>
                <input
                  type="text"
                  value={formData.parentName || ''}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none"
                  placeholder="VD: Nguyễn Văn Thành (Bố)"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Số Điện Thoại Phụ Huynh *</label>
                <input
                  type="text"
                  value={formData.parentPhone || ''}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none font-mono"
                  placeholder="0912.888.999"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Email Phụ Huynh (Tùy chọn)</label>
                <input
                  type="email"
                  value={formData.parentEmail || ''}
                  onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none"
                  placeholder="email@gmail.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Địa Chỉ Nhà</label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none"
                placeholder="VD: Số 88 Cầu Giấy, Hà Nội"
              />
            </div>
          </div>

          {/* Row 4: Target & Goal */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Mục Tiêu Học Tập / Điểm Số</label>
            <input
              type="text"
              value={formData.targetGoal || ''}
              onChange={(e) => setFormData({ ...formData, targetGoal: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
              placeholder="VD: Luyện thi đỗ ĐH Bách Khoa Khối A00 (28+ điểm) / IELTS 7.5..."
            />
          </div>

          {/* Row 5: Enrolled Classes selection */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              Đăng Ký Các Lớp Học Tại Trung Tâm (Chọn nhiều môn)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50/50">
              {classes.map((cls) => {
                const isSelected = (formData.enrolledClassIds || []).includes(cls.id);
                return (
                  <label
                    key={cls.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 text-blue-900 font-medium'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleClassToggle(cls.id)}
                      className="rounded text-blue-600"
                    />
                    <div className="min-w-0">
                      <div className="truncate font-bold text-xs">{cls.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{cls.code} (Khối {cls.gradeLevel})</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{editingStudent ? 'Lưu Hồ Sơ' : 'Tiếp Nhận Học Sinh'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
