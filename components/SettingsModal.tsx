import React, { useState, useEffect } from 'react';
import { X, Save, Bell, Mail } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: AppSettings) => void;
    initialSettings: AppSettings;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, initialSettings }) => {
    const [settings, setSettings] = useState<AppSettings>(initialSettings);

    useEffect(() => {
        setSettings(initialSettings);
    }, [initialSettings, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(settings);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-700 bg-slate-800 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Bell className="w-5 h-5 text-yellow-500" />
                        Uygulama Ayarları
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-2 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-slate-200 font-medium border-b border-slate-700 pb-2">
                            <Mail className="w-4 h-4 text-blue-400" /> Bildirim Ayarları
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Gaz Açıldı Bildirimi Kime Gitsin?</label>
                            <p className="text-xs text-slate-500 mb-2">
                                Bir iş "Gaz Açıldı" aşamasına geldiğinde, aşağıda belirtilen e-posta adresine sahip kullanıcı programı açıksa bildirim alır.
                            </p>
                            <input
                                type="email"
                                value={settings.gasNotificationEmail}
                                onChange={(e) => setSettings({ ...settings, gasNotificationEmail: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-600"
                                placeholder="ornek@email.com"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors text-sm">
                            Vazgeç
                        </button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all text-sm font-medium">
                            <Save className="w-4 h-4" /> Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SettingsModal;
