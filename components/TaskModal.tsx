import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, StatusLabels } from '../types';
import { X, Save, Calendar, MapPin, Phone, FileText, User, Trash2, AlertTriangle, CheckCircle2, PhoneCall } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
  task?: Task; // If provided, we are editing
  nextOrderNumber: number;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, onDelete, task, nextOrderNumber }) => {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    status: TaskStatus.TO_CHECK,
    assignee: '',
    date: '',
    address: '',
    phone: '',
    teamNote: '',
    isCheckVerified: false
  });

  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setIsDeleting(false); // Reset delete state on open/change
    if (task) {
      setFormData({ ...task });
    } else {
      // Reset for new task
      setFormData({
        title: '',
        status: TaskStatus.TO_CHECK,
        assignee: '',
        date: new Date().toISOString().split('T')[0], // Default today
        address: '',
        phone: '',
        teamNote: '',
        isCheckVerified: false,
        orderNumber: nextOrderNumber
      });
    }
  }, [task, isOpen, nextOrderNumber]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleDeleteClick = () => {
    setIsDeleting(true);
  };

  const handleConfirmDelete = () => {
    if (task && onDelete) {
      onDelete(task.id);
      onClose();
    }
  };

  const handleCancelDelete = () => {
    setIsDeleting(false);
  };

  const isEdit = !!task;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between bg-slate-900/50">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            {isEdit ? `Müşteri Düzenle (#${task.orderNumber})` : `Yeni Müşteri Ekle (#${nextOrderNumber})`}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title / Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <User className="w-4 h-4" /> Müşteri Adı / İş Tanımı
              </label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Örn: Ahmet Yılmaz - Daire 5"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Durum</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {Object.entries(StatusLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Phone & Call Button */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Phone className="w-4 h-4" /> Telefon
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="05XX XXX XX XX"
                />
                {formData.phone && (
                  <a
                    href={`tel:${formData.phone}`}
                    className="bg-green-600 hover:bg-green-500 text-white p-2.5 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/20 transition-all active:scale-95"
                    title="Hemen Ara"
                  >
                    <PhoneCall className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Tarih
              </label>
              <input
                type="date"
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Adres
            </label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Mahalle, Cadde, No..."
            />
          </div>

          {/* Verification Checkbox */}
          <div className="p-4 bg-slate-700/30 border border-slate-700 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-slate-700/50 transition-colors"
               onClick={() => setFormData({ ...formData, isCheckVerified: !formData.isCheckVerified })}>
            <div className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${
               formData.isCheckVerified 
                 ? 'bg-orange-500 border-orange-500 text-white' 
                 : 'border-slate-500 text-transparent'
            }`}>
               <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
               <span className="text-sm font-medium text-slate-200">Kontrolü Yapıldı</span>
               <span className="text-xs text-slate-400">İşaretlendiğinde kart turuncu renkte görünür.</span>
            </div>
          </div>

          {/* Control Note */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-orange-400 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Kontrol Ekibi Notu
            </label>
            <textarea
              rows={4}
              value={formData.teamNote || ''}
              onChange={(e) => setFormData({ ...formData, teamNote: e.target.value })}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-orange-500/50 outline-none"
              placeholder="Kontrol sırasında fark edilen eksikler veya notlar..."
            />
          </div>

        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-900/50 flex justify-between items-center gap-3">
          
          {/* Delete Button (Only for Edit Mode) */}
          <div className="flex-1">
             {isEdit && onDelete && (
                isDeleting ? (
                  <div className="flex items-center gap-3 animate-fadeIn">
                    <span className="text-sm text-red-400 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Silmek istediğinize emin misiniz?
                    </span>
                    <button 
                      onClick={handleConfirmDelete}
                      className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded transition-colors"
                    >
                      Evet
                    </button>
                    <button 
                      onClick={handleCancelDelete}
                      className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded transition-colors"
                    >
                      İptal
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleDeleteClick}
                    className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-all text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Kaydı Sil
                  </button>
                )
             )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
            >
              <Save className="w-4 h-4" />
              {isEdit ? 'Kaydet' : 'Oluştur'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;