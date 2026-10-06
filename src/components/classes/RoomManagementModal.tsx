import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Room } from '../../types/index.ts';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Save,
  MapPin,
  Users,
  CheckCircle2,
  Building,
} from 'lucide-react';

interface RoomManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoom?: (roomId: string) => void;
}

export const RoomManagementModal: React.FC<RoomManagementModalProps> = ({
  isOpen,
  onClose,
  onSelectRoom,
}) => {
  const { rooms, addRoom, updateRoom, deleteRoom, classes } = useApp();

  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    floor: 'Tầng 1',
    capacity: 35,
    facilities: 'Máy chiếu, Điều hòa, Bảng chống lóa',
  });

  const [isAddingNew, setIsAddingNew] = useState(false);

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setIsAddingNew(true);
    setEditingRoomId(null);
    setFormData({
      name: `Phòng ${rooms.length + 101}`,
      floor: 'Tầng 2',
      capacity: 35,
      facilities: 'Máy chiếu, Điều hòa, Bảng chống lóa',
    });
  };

  const handleStartEdit = (room: Room) => {
    setIsAddingNew(false);
    setEditingRoomId(room.id);
    setFormData({
      name: room.name,
      floor: room.floor,
      capacity: room.capacity,
      facilities: room.facilities.join(', '),
    });
  };

  const handleCancelForm = () => {
    setIsAddingNew(false);
    setEditingRoomId(null);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên phòng học!');
      return;
    }

    const facilitiesArr = formData.facilities
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (isAddingNew) {
      const newRoom: Room = {
        id: `room-${Date.now()}`,
        name: formData.name.trim(),
        floor: formData.floor.trim(),
        capacity: Number(formData.capacity) || 30,
        facilities: facilitiesArr.length > 0 ? facilitiesArr : ['Máy chiếu', 'Điều hòa'],
      };
      addRoom(newRoom);
      if (onSelectRoom) {
        onSelectRoom(newRoom.id);
      }
      setIsAddingNew(false);
    } else if (editingRoomId) {
      updateRoom(editingRoomId, {
        name: formData.name.trim(),
        floor: formData.floor.trim(),
        capacity: Number(formData.capacity) || 30,
        facilities: facilitiesArr,
      });
      setEditingRoomId(null);
    }
  };

  const handleDelete = (room: Room) => {
    const classesUsing = classes.filter((c) => c.roomId === room.id);
    if (classesUsing.length > 0) {
      const confirmDelete = window.confirm(
        `Phòng "${room.name}" hiện đang được sử dụng bởi ${classesUsing.length} lớp học (${classesUsing.map((c) => c.code).join(', ')}). Bạn vẫn muốn xóa phòng này?`
      );
      if (!confirmDelete) return;
    } else {
      if (!window.confirm(`Xóa phòng học "${room.name}"?`)) return;
    }
    deleteRoom(room.id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-2xs">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Quản Lý Danh Sách & Sửa Tên Phòng Học
              </h3>
              <p className="text-xs text-slate-500">
                Thêm mới, đổi tên phòng học, cấu hình vị trí tầng và sức chứa cho trung tâm.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action button to add */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-600 font-medium">
            Hiện có <strong className="text-slate-900">{rooms.length} phòng học</strong> trong hệ thống
          </span>
          {!isAddingNew && (
            <button
              type="button"
              onClick={handleStartAdd}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thêm Phòng Học Mới</span>
            </button>
          )}
        </div>

        {/* Add / Edit Form */}
        {(isAddingNew || editingRoomId) && (
          <form onSubmit={handleSaveForm} className="p-5 bg-blue-50/50 border-b border-blue-100 text-xs space-y-3">
            <div className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
              <Edit2 className="w-4 h-4 text-blue-600" />
              <span>{isAddingNew ? 'Thêm Phòng Học Mới' : 'Chỉnh Sửa Tên & Thông Tin Phòng Học'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tên Phòng Học *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Phòng 101, Phòng VIP 1..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Vị Trí / Tầng</label>
                <input
                  type="text"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  placeholder="VD: Tầng 1, Tòa A Tầng 2..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Sức Chứa Tối Đa (HS)</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Trang Thiết Bị (Phân cách bằng dấu phẩy)</label>
              <input
                type="text"
                value={formData.facilities}
                onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                placeholder="Máy chiếu, Điều hòa, Bảng trượt, Wifi..."
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancelForm}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isAddingNew ? 'Tạo Phòng' : 'Cập Nhật Tên Phòng'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Room List Table */}
        <div className="p-6 overflow-y-auto flex-1 space-y-2 text-xs">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5">Tên Phòng Học</th>
                <th className="px-3 py-2.5">Vị Trí / Tầng</th>
                <th className="px-3 py-2.5 text-center">Sức Chứa</th>
                <th className="px-3 py-2.5">Trang Thiết Bị</th>
                <th className="px-3 py-2.5 text-center">Lớp Đang Học</th>
                <th className="px-3 py-2.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {rooms.map((r) => {
                const classesInRoom = classes.filter((c) => c.roomId === r.id);
                return (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-3 py-2.5 font-bold text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{r.name}</span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{r.floor}</td>
                    <td className="px-3 py-2.5 text-center font-mono font-semibold text-slate-700">
                      {r.capacity} HS
                    </td>
                    <td className="px-3 py-2.5 text-slate-500 text-[11px] truncate max-w-[180px]">
                      {r.facilities?.join(', ') || 'Cơ bản'}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {classesInRoom.length} lớp
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right space-x-1 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(r)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                        title="Sửa tên / thông tin phòng"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r)}
                        disabled={rooms.length <= 1}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 disabled:opacity-30 rounded-md transition-colors cursor-pointer"
                        title="Xóa phòng"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold transition-colors cursor-pointer"
          >
            Hoàn Tất
          </button>
        </div>
      </div>
    </div>
  );
};
