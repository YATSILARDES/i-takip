import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import { Calendar, CheckCircle2, TrendingUp, BarChart3 } from 'lucide-react';

interface OperationsReportProps {
    tasks: Task[];
}

type Period = 'daily' | 'weekly' | 'monthly';

export const OperationsReport: React.FC<OperationsReportProps> = ({ tasks }) => {
    const [period, setPeriod] = useState<Period>('daily');

    const getFilteredCounts = () => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))); // Monday
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const filterDate = period === 'daily' ? startOfDay : period === 'weekly' ? startOfWeek : startOfMonth;

        // Filter tasks based on 'date' or 'createdAt'
        // Fallback: If 'date' string exists, try to parse it. If invalid, skip?
        // Assuming task.date is ISO or YYYY-MM-DD.
        const relevantTasks = tasks.filter(t => {
            const taskDate = t.date ? new Date(t.date) : (t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt));
            return taskDate >= filterDate;
        });

        return {
            checksDone: relevantTasks.filter(t => t.status === TaskStatus.CHECK_COMPLETED || t.status === TaskStatus.DEPOSIT_PAID || t.status === TaskStatus.GAS_OPENED || t.status === TaskStatus.SERVICE_DIRECTED).length,
            depositsPaid: relevantTasks.filter(t => t.status === TaskStatus.DEPOSIT_PAID || t.status === TaskStatus.GAS_OPENED || t.status === TaskStatus.SERVICE_DIRECTED).length,
            servicesDirected: relevantTasks.filter(t => t.status === TaskStatus.SERVICE_DIRECTED).length,
            gasOpened: relevantTasks.filter(t => t.status === TaskStatus.GAS_OPENED).length,
        };
    };

    const counts = getFilteredCounts();

    const metrics = [
        { label: 'Kontrol Yapıldı', value: counts.checksDone, color: 'text-blue-600', bg: 'bg-blue-50', icon: CheckCircle2 },
        { label: 'Depozito Alındı', value: counts.depositsPaid, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: TrendingUp },
        { label: 'Servis Yönlendirildi', value: counts.servicesDirected, color: 'text-purple-600', bg: 'bg-purple-50', icon: BarChart3 },
        // { label: 'Gaz Açıldı', value: counts.gasOpened, color: 'text-orange-600', bg: 'bg-orange-50' },
    ];

    return (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-lg shadow-slate-200/50 mb-8 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-xl">
                        <BarChart3 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Operasyon Raporu</h3>
                        <p className="text-xs text-slate-500 font-medium">Dönemsel performans özeti</p>
                    </div>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl">
                    {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${period === p
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {p === 'daily' ? 'Günlük' : p === 'weekly' ? 'Haftalık' : 'Aylık'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {metrics.map((metric) => (
                    <div key={metric.label} className={`relative overflow-hidden rounded-2xl p-5 border border-slate-100 ${metric.bg} bg-opacity-40 transition-all hover:scale-[1.02]`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2.5 rounded-xl bg-white shadow-sm ${metric.color}`}>
                                <metric.icon className="w-5 h-5" />
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full bg-white/60 ${metric.color}`}>
                                {period === 'daily' ? 'Bugün' : period === 'weekly' ? 'Bu Hafta' : 'Bu Ay'}
                            </span>
                        </div>

                        <div className="space-y-1">
                            <h4 className="text-2xl font-black text-slate-800 tracking-tight">{metric.value}</h4>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{metric.label}</p>
                        </div>

                        {/* Decorative Background Icon */}
                        <metric.icon className={`absolute -right-4 -bottom-4 w-24 h-24 opacity-5 ${metric.color}`} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OperationsReport;
