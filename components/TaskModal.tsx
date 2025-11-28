import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, StatusLabels } from '../types';
import { X, Save, Calendar, MapPin, Phone, FileText, User, Trash2, AlertTriangle, CheckCircle2, PhoneCall, Share2, Flame, Wrench, ClipboardCheck, ScanBarcode } from 'lucide-react';
import Scanner from './Scanner';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
  task?: Task; // If provided, we are editing
  nextOrderNumber: number;
}

type TabType = 'personal' | 'gas' | 'service' | 'control';

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, onDelete, task, nextOrderNumber }) => {
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    status: TaskStatus.TO_CHECK,
    assignee: '',
    date: '',
    address: '',
    phone: '',
    generalNote: '',
    teamNote: '',
    checkStatus: undefined,
    gasOpeningDate: '',
    gasNote: '',
    serviceSerialNumber: '',
    serviceNote: ''
  });

  const [isDeleting, setIsDeleting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    setIsDeleting(false); // Reset delete state on open/change
    setActiveTab('personal'); // Reset tab
    setShowScanner(false);
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
        generalNote: '',
        teamNote: '',
        checkStatus: undefined,
        orderNumber: nextOrderNumber,
        gasOpeningDate: '',
        gasNote: '',
        serviceSerialNumber: '',
        serviceNote: ''
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

  const handleShare = async () => {
    const shareText = `${formData.title}\nTel: ${formData.phone || 'Yok'}\nAdres: ${formData.address || 'Yok'}`;
    const shareData = {
      title: 'Müşteri Bilgileri',
      text: shareText
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareText);
        alert('Bilgiler panoya kopyalandı.');
      }
    } catch (err) {
      console.error('Sharing failed', err);
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    setFormData({ ...formData, serviceSerialNumber: decodedText });
    setShowScanner(false);
  };

  const isEdit = !!task;



  const renderSidebarItem = (id: TabType, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-4 ${activeTab === id
        ? 'bg-slate-800 border-blue-500 text-blue-400'
        : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
        }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <>
      {showScanner && (
        <Scanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-700 bg-slate-800">
            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2 whitespace-nowrap">
                  {isEdit ? `Müşteri Düzenle (#${task.orderNumber})` : `Yeni Müşteri (#${nextOrderNumber})`}
                </h2>

                {/* Desktop Status Selector */}
                <div className="flex-1 max-w-xs">
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                  >
                    {Object.entries(StatusLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isEdit && (
                  <button
                    onClick={handleShare}
                    className="text-slate-400 hover:text-blue-400 p-2 rounded-lg hover:bg-slate-700 transition-all"
                    title="Bilgileri Paylaş"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                )}
                <button onClick={onClose} className="text-slate-400 hover:text-white p-2 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between gap-3">
              <div className="flex-1">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value as TabType)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-base text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                >
                  <option value="personal">👤 Kişi Bilgileri</option>
                  <option value="gas">🔥 Gaz Açım</option>
                  <option value="service">🔧 Servis</option>
                  <option value="control">📋 Kontrol</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                {isEdit && (
                  <button
                    onClick={handleShare}
                    className="text-slate-400 hover:text-blue-400 p-2 rounded-lg hover:bg-slate-700 transition-all"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                )}
                <button onClick={onClose} className="text-slate-400 hover:text-white p-2 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Body Container */}
          <div className="flex flex-1 overflow-hidden">

            {/* Left Sidebar */}
            <div className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col py-4 hidden md:flex">
              <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Bilgi Kartları</div>
              {renderSidebarItem('personal', 'Kişi Bilgileri', <User className="w-4 h-4" />)}
              {renderSidebarItem('gas', 'Gaz Açım Bilgileri', <Flame className="w-4 h-4" />)}
              {renderSidebarItem('service', 'Servis Bilgileri', <Wrench className="w-4 h-4" />)}
              {renderSidebarItem('control', 'Kontrol Elemanı', <ClipboardCheck className="w-4 h-4" />)}
            </div>


            {/* Right Content */}
            <div className="flex-1 bg-slate-800/50 flex flex-col overflow-hidden">
              <form id="taskForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* --- PERSONAL INFO TAB --- */}
                {activeTab === 'personal' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex items-center gap-2 text-lg font-medium text-slate-200 border-b border-slate-700 pb-2">
                      <User className="w-5 h-5 text-blue-400" /> Kişi Bilgileri
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Adı Soyadı / İş Tanımı</label>
                        <input required type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Telefon</label>
                        <div className="flex gap-2">
                          <input type="tel" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                          {formData.phone && (
                            <a href={`tel:${formData.phone}`} className="bg-green-600 hover:bg-green-500 text-white p-2.5 rounded-lg">
                              <PhoneCall className="w-5 h-5" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">İşi Yapan Usta</label>
                        <input type="text" value={formData.assignee || ''} onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                          className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Örn: Ahmet Usta" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">Adres</label>
                      <input type="text" value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">Genel Not</label>
                      <textarea rows={3} value={formData.generalNote || ''} onChange={(e) => setFormData({ ...formData, generalNote: e.target.value })}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Müşteri hakkında genel notlar..." />
                    </div>
                  </div>
                )}

                {/* --- GAS OPENING INFO TAB --- */}
                {activeTab === 'gas' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex items-center gap-2 text-lg font-medium text-slate-200 border-b border-slate-700 pb-2">
                      <Flame className="w-5 h-5 text-orange-400" /> Gaz Açım Bilgileri
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400 flex items-center gap-2"><Calendar className="w-4 h-4" /> Gaz Açım Tarihi</label>
                        <input type="date" value={formData.gasOpeningDate || ''} onChange={(e) => setFormData({ ...formData, gasOpeningDate: e.target.value })}
                          className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-orange-500 outline-none" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">Gaz Açım Notu</label>
                      <textarea rows={4} value={formData.gasNote || ''} onChange={(e) => setFormData({ ...formData, gasNote: e.target.value })}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Randevu saati, eksikler vb." />
                    </div>
                  </div>
                )}

                {/* --- SERVICE INFO TAB --- */}
                {activeTab === 'service' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex items-center gap-2 text-lg font-medium text-slate-200 border-b border-slate-700 pb-2">
                      <Wrench className="w-5 h-5 text-blue-400" /> Servis Bilgileri
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">Cihaz Seri Numarası / Barkod</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.serviceSerialNumber || ''}
                          onChange={(e) => setFormData({ ...formData, serviceSerialNumber: e.target.value })}
                          className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="SN-123456789"
                        />
                        <button
                          type="button"
                          onClick={() => setShowScanner(true)}
                          className="bg-slate-700 hover:bg-slate-600 text-blue-400 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 border border-slate-600"
                          title="Barkod Tara"
                        >
                          <ScanBarcode className="w-5 h-5" />
                          <span className="hidden sm:inline text-sm">Barkod Oku</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">Servis Notu</label>
                      <textarea rows={4} value={formData.serviceNote || ''} onChange={(e) => setFormData({ ...formData, serviceNote: e.target.value })}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Yönlendirme notları, garanti durumu vb." />
                    </div>
                  </div>
                )}

                {/* --- CONTROL STAFF INFO TAB --- */}
                {activeTab === 'control' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex items-center gap-2 text-lg font-medium text-slate-200 border-b border-slate-700 pb-2">
                      <ClipboardCheck className="w-5 h-5 text-emerald-400" /> Kontrol Elemanı Bilgileri
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Eksik Var Butonu */}
                      <div
                        onClick={() => setFormData({ ...formData, checkStatus: formData.checkStatus === 'missing' ? undefined : 'missing' })}
                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${formData.checkStatus === 'missing'
                          ? 'bg-orange-600/20 border-orange-500 text-orange-400'
                          : 'bg-slate-700/30 border-slate-700 text-slate-400 hover:bg-slate-700/50'
                          }`}
                      >
                        <AlertTriangle className={`w-8 h-8 ${formData.checkStatus === 'missing' ? 'text-orange-500' : 'text-slate-500'}`} />
                        <span className="font-medium">Eksik Var</span>
                      </div>

                      {/* Eksik Yok Butonu */}
                      <div
                        onClick={() => setFormData({ ...formData, checkStatus: formData.checkStatus === 'clean' ? undefined : 'clean' })}
                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${formData.checkStatus === 'clean'
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                          : 'bg-slate-700/30 border-slate-700 text-slate-400 hover:bg-slate-700/50'
                          }`}
                      >
                        <CheckCircle2 className={`w-8 h-8 ${formData.checkStatus === 'clean' ? 'text-emerald-500' : 'text-slate-500'}`} />
                        <span className="font-medium">Eksik Yok</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Kontrol Ekibi Notu
                      </label>
                      <textarea
                        rows={6}
                        value={formData.teamNote || ''}
                        onChange={(e) => setFormData({ ...formData, teamNote: e.target.value })}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                        placeholder="Kontrol sırasında fark edilen eksikler, kaçaklar veya diğer notlar..."
                      />
                    </div>
                  </div>
                )}

              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-700 bg-slate-800 flex flex-col md:flex-row justify-between items-center gap-3">

            {/* Mobile Status Selector */}
            <div className="w-full md:hidden mb-2">
              <label className="text-xs text-slate-400 mb-1 block">Durum</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {Object.entries(StatusLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Delete Button (Only for Edit Mode) */}
            <div className="flex-1">
              {isEdit && onDelete && (
                isDeleting ? (
                  <div className="flex items-center gap-3 animate-fadeIn">
                    <span className="text-sm text-red-400 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Silmek istediğinize emin misiniz?
                    </span>
                    <button onClick={handleConfirmDelete} className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded">Evet</button>
                    <button onClick={handleCancelDelete} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded">İptal</button>
                  </div>
                ) : (
                  <button onClick={handleDeleteClick} className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-all text-sm">
                    <Trash2 className="w-4 h-4" /> Kaydı Sil
                  </button>
                )
              )}
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors">Vazgeç</button>
              <button type="button" onClick={handleSubmit} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all">
                <Save className="w-4 h-4" /> {isEdit ? 'Kaydet' : 'Oluştur'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskModal;