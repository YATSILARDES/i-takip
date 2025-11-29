import React, { useState, useEffect } from 'react';
import { X, Save, Bell, Mail, User } from 'lucide-react';
import { AppSettings, TaskStatus, StatusLabels } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: AppSettings) => void;
    initialSettings: AppSettings;
    users: string[]; // Öneri için kullanıcı listesi
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, initialSettings, users }) => {
    const [settings, setSettings] = useState<AppSettings>(initialSettings);
    const [activeTab, setActiveTab] = useState<TaskStatus>(TaskStatus.TO_CHECK);

    useEffect(() => {
        setSettings(initialSettings);
    }, [initialSettings, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(settings);
        onClose();
    };

    const handleEmailChange = (status: TaskStatus, email: string) => {
        setSettings(prev => ({
            ...prev,
            notifications: {
                ...prev.notifications,
                [status]: email
            }
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col h-[80vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-700 bg-slate-800 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Bell className="w-5 h-5 text-yellow-500" />
                        Bildirim Ayarları
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-2 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-1/3 bg-slate-800/50 border-r border-slate-700 overflow-y-auto">
                        {Object.values(TaskStatus).map((status) => (
                            <button
                                key={status}
                                onClick={() => setActiveTab(status)}
                                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border-l-4 ${activeTab === status
                                    ? 'bg-slate-800 border-blue-500 text-blue-400'
                                    : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                    }`}
                            >
                                {StatusLabels[status]}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 bg-slate-900 overflow-y-auto">
                        <form id="settingsForm" onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-slate-200 font-medium border-b border-slate-700 pb-2">
                                    <Mail className="w-4 h-4 text-blue-400" /> {StatusLabels[activeTab]} Bildirimi
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400">Bildirim Gidecek Kişi (E-posta)</label>
                                    <p className="text-xs text-slate-500 mb-2">
                                        Bu aşamaya bir iş düştüğünde, aşağıdaki kullanıcıya bildirim gönderilir.
                                    </p>

                                    <div className="relative">
                                        <input
                                            type="email"
                                            value={settings.notifications?.[activeTab] || ''}
                                            onChange={(e) => handleEmailChange(activeTab, e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-600"
                                            placeholder="ornek@email.com"
                                            list="users-list"
                                        />
                                        <datalist id="users-list">
                                            {users.map(email => (
                                                <option key={email} value={email} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>

                                <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                                        <User className="w-4 h-4" /> Önizleme
                                    </h4>
                                    <p className="text-xs text-slate-300">
                                        Bildirim: "Sayın <strong>{settings.notifications?.[activeTab] || 'Kullanıcı'}</strong>, <strong>Daire 5</strong> işi <strong>{StatusLabels[activeTab]}</strong> aşamasına geldi."
                                    </p>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-700 bg-slate-800 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors text-sm">
                        Vazgeç
                    </button>
                    <button type="button" onClick={handleSubmit} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all text-sm font-medium">
                        <Save className="w-4 h-4" /> Tümünü Kaydet
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
