import React, { useState, useEffect } from 'react';
import { X, Calendar, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../src/firebase';

interface Appointment {
    id: string;
    projectName?: string;
    projectType?: string;
    projectAddress?: string;
    appointmentDate?: any; // Timestamp or Object with seconds
    [key: string]: any;
}

interface AppointmentsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const WEEK_DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

const AppointmentsModal: React.FC<AppointmentsModalProps> = ({ isOpen, onClose }) => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        if (!isOpen) return;

        setLoading(true);
        setError(null);

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
            setError("Veriye erişim izni yok veya bağlantı hatası.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isOpen]);

    // Yardımcı Fonksiyon: Tarihi Parse Etme
    const parseDate = (dateData: any): Date | null => {
        if (!dateData) return null;

        let date: Date | null = null;

        // 1. Firebase Timestamp (veya n8n JSON formatı: { seconds: ..., nanoseconds: ... })
        if (dateData.seconds || dateData.saniyeler) {
            const seconds = dateData.seconds || dateData.saniyeler;
            date = new Date(seconds * 1000);
        }
        // 2. String Format (ISO vb.)
        else if (typeof dateData === 'string') {
            const parsed = new Date(dateData);
            if (!isNaN(parsed.getTime())) {
                date = parsed;
            }
        }

        // Türkiye Saati Ayarı (Otomatik: Tarayıcı zaten yerel saati gösterir)
        // Ekstra manuel eklemeye gerek yok.
        if (date) {
            return date;
        }

        return null;
    };

    // Şu anki haftanın başlangıcını ve bitişini bulma
    const getWeekRange = (date: Date) => {
        const start = new Date(date);
        const day = start.getDay(); // 0 (Pazar) - 6 (Cumartesi)
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Pazartesi'ye ayarla
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }

        return { start, end, days };
    };

    const { start: weekStart, end: weekEnd, days: weekDays } = getWeekRange(currentDate);

    // Randevuları Günlere Dağıtma
    const groupAppointmentsByDay = () => {
        const groups: { [key: string]: Appointment[] } = {};
        weekDays.forEach(d => groups[d.toDateString()] = []);

        appointments.forEach(apt => {
            const date = parseDate(apt.appointmentDate || apt.randevuTarihi);
            if (date) {
                // Tarih bu hafta içinde mi?
                if (date >= weekStart && date <= weekEnd) {
                    const dateKey = date.toDateString();
                    if (groups[dateKey]) {
                        groups[dateKey].push(apt);
                    }
                }
            }
        });

        // Her gün için saat sıralaması yap
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => {
                const dateA = parseDate(a.appointmentDate || a.randevuTarihi);
                const dateB = parseDate(b.appointmentDate || b.randevuTarihi);
                if (!dateA || !dateB) return 0;
                return dateA.getTime() - dateB.getTime();
            });
        });

        return groups;
    };

    const weeklyAppointments = groupAppointmentsByDay();

    const handlePrevWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl rounded-xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-slate-700 bg-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-purple-600/20 p-2 rounded-lg">
                            <Calendar className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Haftalık Randevu Takvimi</h2>
                            <p className="text-xs text-slate-400">
                                {weekStart.toLocaleDateString('tr-TR')} - {weekEnd.toLocaleDateString('tr-TR')}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg p-1 ml-4 shadow-inner">
                            <button onClick={handlePrevWeek} className="p-1 hover:bg-slate-600 rounded text-slate-300">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setCurrentDate(new Date())}
                                className="px-2 py-0.5 text-xs font-medium text-slate-300 hover:text-white"
                            >
                                Bugün
                            </button>
                            <button onClick={handleNextWeek} className="p-1 hover:bg-slate-600 rounded text-slate-300">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content - Calendar Grid */}
                <div className="flex-1 overflow-hidden flex flex-col bg-slate-950">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-slate-500 gap-2">
                            <RefreshCw className="w-5 h-5 animate-spin" /> Yükleniyor...
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-red-400 gap-2">
                            <p>{error}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-7 h-full divide-x divide-slate-800">
                            {weekDays.map((date, index) => {
                                const dateKey = date.toDateString();
                                const dayAppointments = weeklyAppointments[dateKey] || [];
                                const isToday = date.toDateString() === new Date().toDateString();

                                return (
                                    <div key={index} className={`flex flex-col h-full min-w-[140px] ${isToday ? 'bg-slate-900/80' : ''}`}>
                                        {/* Day Header */}
                                        <div className={`p-2 border-b border-slate-800 text-center ${isToday ? 'bg-purple-900/20 border-purple-500/30' : 'bg-slate-900'}`}>
                                            <div className={`text-sm font-semibold ${isToday ? 'text-purple-400' : 'text-slate-300'}`}>
                                                {WEEK_DAYS[index]}
                                            </div>
                                            <div className={`text-xs ${isToday ? 'text-purple-300' : 'text-slate-500'}`}>
                                                {date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                                            </div>
                                        </div>

                                        {/* Appointments List */}
                                        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                                            {dayAppointments.length > 0 ? (
                                                dayAppointments.map(apt => {
                                                    const aptDate = parseDate(apt.appointmentDate || apt.randevuTarihi);
                                                    const aptTime = aptDate?.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

                                                    return (
                                                        <div key={apt.id} className="bg-slate-800 border-l-2 border-purple-500 rounded p-2 text-xs shadow-sm hover:bg-slate-700 transition-colors group relative overflow-hidden">
                                                            {/* Time Badge */}
                                                            <div className="absolute top-0 right-0 bg-purple-600/20 text-purple-300 px-1.5 py-0.5 rounded-bl text-[10px] font-mono font-bold">
                                                                {aptTime}
                                                            </div>

                                                            <div className="font-bold text-slate-200 mb-1 truncate pr-8" title={apt.projectName}>
                                                                {apt.projectName || 'İsimsiz'}
                                                            </div>

                                                            {apt.projectType && (
                                                                <div className="inline-block px-1.5 py-0.5 bg-slate-900 rounded text-[10px] text-purple-300 mb-1">
                                                                    {apt.projectType}
                                                                </div>
                                                            )}

                                                            <div className="text-slate-400 line-clamp-2" title={apt.projectAddress}>
                                                                {apt.projectAddress || 'Adres yok'}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-slate-700 text-xs italic">
                                                    Boş
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AppointmentsModal;
