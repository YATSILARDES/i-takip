import React, { useState, useEffect } from 'react';
import { X, Calendar, RefreshCw } from 'lucide-react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../src/firebase';

interface Appointment {
    id: string;
    [key: string]: any;
}

interface AppointmentsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AppointmentsModal: React.FC<AppointmentsModalProps> = ({ isOpen, onClose }) => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        setLoading(true);
        setError(null);

        // "randevular" koleksiyonunu dinle
        const q = query(collection(db, 'randevular'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedAppointments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAppointments(fetchedAppointments);
            setLoading(false);
        }, (err) => {
            console.error("Randevular çekilirken hata:", err);
            setError("Veriye erişim izni yok veya bağlantı hatası. (Firebase Kurallarını kontrol edin: allow read: if true)");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col h-[80vh]">

                {/* Header */}
                <div className="p-4 border-b border-slate-700 bg-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-600/20 p-2 rounded-lg">
                            <Calendar className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Dipos Randevuları</h2>
                            <p className="text-xs text-slate-400">Otomatik güncellenen randevu listesi</p>
                        </div>
                        <span className="ml-4 px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-xs font-bold">
                            {appointments.length} Kayıt
                        </span>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-slate-500 gap-2">
                            <RefreshCw className="w-5 h-5 animate-spin" /> Yükleniyor...
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-red-400 gap-2 p-4 text-center">
                            <p className="font-bold">Bir hata oluştu</p>
                            <p className="text-sm">{error}</p>
                            <p className="text-xs text-slate-500 mt-2">Firebase Console {'>'} Firestore Database {'>'} Rules sekmesini kontrol ediniz.</p>
                        </div>
                    ) : appointments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                            <Calendar className="w-8 h-8 opacity-50 mb-2" />
                            <p>Henüz randevu verisi yok.</p>
                            <p className="text-xs opacity-50 mt-1">Veritabanında 'randevular' koleksiyonu var mı?</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {appointments.map((apt) => (
                                <div key={apt.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-purple-500/30 transition-colors">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-semibold text-slate-200">
                                                {/* Veri Yapısı: projectName, appointmentDate, projectType */}
                                                {apt.projectName || apt.musteriAdi || apt.title || 'İsimsiz'}
                                            </h3>
                                            <span className="text-xs font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
                                                {apt.appointmentDate ? String(apt.appointmentDate) : 'Tarih Yok'}
                                            </span>
                                        </div>

                                        <div className="text-sm text-slate-400">
                                            {apt.projectType && <span className="text-purple-400 mr-2 font-bold">[{apt.projectType}]</span>}
                                            {apt.adres || apt.address || ''}
                                        </div>

                                        <details className="mt-2">
                                            <summary className="text-[10px] text-slate-600 cursor-pointer hover:text-slate-400">Veri Detayı (Debug)</summary>
                                            <pre className="text-[10px] text-slate-500 mt-1 overflow-x-auto bg-slate-950/50 p-2 rounded border border-slate-800">
                                                {JSON.stringify(apt, null, 2)}
                                            </pre>
                                        </details>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AppointmentsModal;
