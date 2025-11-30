import React, { useState, useEffect } from 'react';
import { X, Save, Bell, Database, Download, Upload, Trash2, Plus, User, Check } from 'lucide-react';
import { AppSettings, TaskStatus, StatusLabels, Task } from '../types';
import * as XLSX from 'xlsx';

interface AdminPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSettings: (settings: AppSettings) => void;
    initialSettings: AppSettings;
    users: string[];
    tasks: Task[];
    onTasksUpdate: (newTasks: Task[]) => void;
}

type TabType = 'backup' | 'notifications';

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, onSaveSettings, initialSettings, users, tasks, onTasksUpdate }) => {
    const [activeTab, setActiveTab] = useState<TabType>('backup');
    const [activeStatus, setActiveStatus] = useState<TaskStatus>(TaskStatus.TO_CHECK);
    const [settings, setSettings] = useState<AppSettings>(initialSettings);
    const [selectedUser, setSelectedUser] = useState('');

    useEffect(() => {
        setSettings(initialSettings);
    }, [initialSettings, isOpen]);

    if (!isOpen) return null;

    // --- Excel İşlemleri ---
    const handleDownloadExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(tasks);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks");
        XLSX.writeFile(workbook, "Is_Takip_Yedek.xlsx");
        alert("Excel dosyası indirildi!");
    };

    const handleUploadExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws) as Task[];

            // Basit doğrulama
            if (data.length > 0 && data[0].title) {
                onTasksUpdate(data);
                alert(`${data.length} adet görev yüklendi!`);
            } else {
                alert("Geçersiz Excel formatı!");
            }
        };
        reader.readAsBinaryString(file);
    };

    // --- Bildirim İşlemleri ---
    const handleAddUser = () => {
        if (!selectedUser) return;

        const currentList = settings.notifications?.[activeStatus] || [];
        if (currentList.includes(selectedUser)) {
            alert("Bu kullanıcı zaten ekli.");
            return;
        }

        setSettings(prev => ({
            ...prev,
            notifications: {
                ...prev.notifications,
                [activeStatus]: [...currentList, selectedUser]
            }
        }));
        setSelectedUser('');
    };

    const handleRemoveUser = (email: string) => {
        const currentList = settings.notifications?.[activeStatus] || [];
        setSettings(prev => ({
            ...prev,
            notifications: {
                ...prev.notifications,
                [activeStatus]: currentList.filter(u => u !== email)
            }
        }));
    };

    const handleSave = () => {
        onSaveSettings(settings);
        alert("Ayarlar kaydedildi!");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-700 bg-slate-800 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <User className="w-6 h-6 text-blue-500" />
                        Yönetici Paneli
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-2 transition-colors rounded-full hover:bg-slate-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-64 bg-slate-800/50 border-r border-slate-700 flex flex-col">
                        <button
                            onClick={() => setActiveTab('backup')}
                            className={`flex items-center gap-3 px-6 py-4 text-sm font-medium transition-colors border-l-4 ${activeTab === 'backup'
                                ? 'bg-slate-800 border-emerald-500 text-emerald-400'
                                : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                }`}
                        >
                            <Database className="w-5 h-5" />
                            Yedekleme & Veri
                        </button>
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`flex items-center gap-3 px-6 py-4 text-sm font-medium transition-colors border-l-4 ${activeTab === 'notifications'
                                ? 'bg-slate-800 border-yellow-500 text-yellow-400'
                                : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                }`}
                        >
                            <Bell className="w-5 h-5" />
                            Bildirim Ayarları
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-8 overflow-y-auto bg-slate-900">
                        {activeTab === 'backup' && (
                            <div className="space-y-8 animate-fadeIn">
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <Download className="w-5 h-5 text-emerald-400" />
                                        Verileri İndir (Yedekle)
                                    </h3>
                                    <p className="text-slate-400 mb-4 text-sm">
                                        Tüm görevleri, müşterileri ve notları Excel dosyası olarak bilgisayarınıza indirin.
                                        Düzenli yedek almanız önerilir.
                                    </p>
                                    <button
                                        onClick={handleDownloadExcel}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
                                    >
                                        <Download className="w-5 h-5" />
                                        Excel Olarak İndir
                                    </button>
                                </div>

                                <div className="border-t border-slate-700 pt-8">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <Upload className="w-5 h-5 text-blue-400" />
                                        Veri Yükle (Geri Yükle)
                                    </h3>
                                    <p className="text-slate-400 mb-4 text-sm">
                                        Daha önce indirdiğiniz veya düzenlediğiniz Excel dosyasını sisteme yükleyin.
                                        <span className="text-red-400 block mt-1">Dikkat: Bu işlem mevcut verilerin üzerine yazabilir veya ekleme yapabilir.</span>
                                    </p>
                                    <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20">
                                        <Upload className="w-5 h-5" />
                                        Excel Dosyası Seç ve Yükle
                                        <input type="file" accept=".xlsx, .xls" onChange={handleUploadExcel} className="hidden" />
                                    </label>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-white">Gelişmiş Bildirim Ataması</h3>
                                    <button
                                        onClick={handleSave}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                                    >
                                        <Save className="w-4 h-4" /> Değişiklikleri Kaydet
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Durum Listesi */}
                                    <div className="lg:col-span-1 bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                                        <div className="p-3 bg-slate-800 border-b border-slate-700 font-medium text-slate-300">
                                            İş Aşaması Seçin
                                        </div>
                                        <div className="divide-y divide-slate-700/50">
                                            {Object.values(TaskStatus).map((status) => (
                                                <button
                                                    key={status}
                                                    onClick={() => setActiveStatus(status)}
                                                    className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${activeStatus === status
                                                        ? 'bg-blue-900/20 text-blue-400'
                                                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                                        }`}
                                                >
                                                    {StatusLabels[status]}
                                                    {activeStatus === status && <Check className="w-4 h-4" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Kullanıcı Atama */}
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700">
                                            <h4 className="text-md font-medium text-blue-400 mb-4 flex items-center gap-2">
                                                <Bell className="w-4 h-4" />
                                                "{StatusLabels[activeStatus]}" Bildirim Listesi
                                            </h4>

                                            <div className="flex gap-2 mb-6">
                                                <div className="relative flex-1">
                                                    <input
                                                        type="email"
                                                        value={selectedUser}
                                                        onChange={(e) => setSelectedUser(e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                        placeholder="Kullanıcı seçin veya e-posta yazın"
                                                        list="admin-users-list"
                                                    />
                                                    <datalist id="admin-users-list">
                                                        {users.map(email => (
                                                            <option key={email} value={email} />
                                                        ))}
                                                    </datalist>
                                                </div>
                                                <button
                                                    onClick={handleAddUser}
                                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                                                >
                                                    <Plus className="w-4 h-4" /> Ekle
                                                </button>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Kayıtlı Kullanıcılar</label>
                                                <div className="bg-slate-900 rounded-lg border border-slate-700 divide-y divide-slate-700">
                                                    {(settings.notifications?.[activeStatus] || []).length === 0 ? (
                                                        <div className="p-4 text-center text-slate-500 text-sm">
                                                            Bu aşama için henüz kimse atanmamış.
                                                        </div>
                                                    ) : (
                                                        (settings.notifications?.[activeStatus] || []).map((email) => (
                                                            <div key={email} className="flex items-center justify-between p-3 group">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400">
                                                                        <User className="w-4 h-4" />
                                                                    </div>
                                                                    <span className="text-slate-300">{email}</span>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleRemoveUser(email)}
                                                                    className="text-slate-500 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-all"
                                                                    title="Listeden Çıkar"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
