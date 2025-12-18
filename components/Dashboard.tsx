import React from 'react';
import { Task, TaskStatus, StatusLabels } from '../types';
import { ChevronRight, Home, Megaphone, Calendar, Clock, Activity } from 'lucide-react';

interface DashboardProps {
    tasks: Task[];
    onNavigate: (status?: TaskStatus) => void;
    onTaskClick: (task: Task) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ tasks, onNavigate, onTaskClick }) => {
    const [filter, setFilter] = React.useState<'daily' | 'weekly' | 'monthly'>('daily');

    // --- İstatistik Hesaplamaları ---
    const getCount = (status: TaskStatus) => tasks.filter(t => t.status === status).length;

    const cards = [
        {
            title: StatusLabels[TaskStatus.TO_CHECK],
            score: getCount(TaskStatus.TO_CHECK),
            subText: 'Kontrol bekleyen yeni işler',
            status: TaskStatus.TO_CHECK,
            color: 'text-amber-500',
            borderColor: 'hover:border-amber-500'
        },
        {
            title: StatusLabels[TaskStatus.CHECK_COMPLETED],
            score: getCount(TaskStatus.CHECK_COMPLETED),
            subText: 'Kontrolü tamamlanmış işler',
            status: TaskStatus.CHECK_COMPLETED,
            color: 'text-blue-500',
            borderColor: 'hover:border-blue-500'
        },
        {
            title: StatusLabels[TaskStatus.DEPOSIT_PAID],
            score: getCount(TaskStatus.DEPOSIT_PAID),
            subText: 'Depozitosu yatırılmış işler',
            status: TaskStatus.DEPOSIT_PAID,
            color: 'text-indigo-500',
            borderColor: 'hover:border-indigo-500'
        },
        {
            title: StatusLabels[TaskStatus.GAS_OPENED],
            score: getCount(TaskStatus.GAS_OPENED),
            subText: 'Gaz açımı yapılmış işler',
            status: TaskStatus.GAS_OPENED,
            color: 'text-emerald-500',
            borderColor: 'hover:border-emerald-500'
        },
        {
            title: StatusLabels[TaskStatus.SERVICE_DIRECTED],
            score: getCount(TaskStatus.SERVICE_DIRECTED),
            subText: 'Servise yönlendirilmiş işler',
            status: TaskStatus.SERVICE_DIRECTED,
            color: 'text-purple-500',
            borderColor: 'hover:border-purple-500'
        },
    ];

    // Filtreleme Mantığı
    const filteredTasks = tasks.filter(task => {
        const taskDate = task.createdAt?.seconds ? new Date(task.createdAt.seconds * 1000) : new Date(task.date || '');
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Normalize 'now' to start of day for consistent comparison

        const taskDay = new Date(taskDate);
        taskDay.setHours(0, 0, 0, 0); // Normalize task date to start of day

        const diffTime = Math.abs(now.getTime() - taskDay.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (filter === 'daily') {
            return taskDay.getTime() === now.getTime(); // Compare normalized dates
        } else if (filter === 'weekly') {
            return diffDays <= 7;
        } else if (filter === 'monthly') {
            return diffDays <= 30;
        }
        return true;
    });

    // Son Eklenenler (Filtrelenmiş ve Sıralanmış)
    const recentTasks = [...filteredTasks]
        .sort((a, b) => {
            const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.date || '');
            const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.date || '');
            return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 5);

    return (
        <div className="flex flex-col h-full overflow-hidden bg-slate-100">

            {/* Breadcrumb Bar */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-2 text-sm text-slate-500 mb-6 shadow-sm">
                <span className="font-bold text-slate-700 text-lg mr-4">Genel Bakış</span>
                <div className="w-px h-5 bg-slate-300 mx-2" />
                <Home className="w-4 h-4" />
                <ChevronRight className="w-4 h-4" />
                <span className="font-semibold text-slate-700">Dashboard</span>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* Sol Kolon: Kartlar */}
                    <div className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {cards.map((card, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onNavigate(card.status)}
                                    className={`bg-white p-6 rounded-lg shadow-sm border-t-4 border-slate-100 ${card.borderColor} hover:shadow-md transition-all text-left flex flex-col justify-between group h-36 relative overflow-hidden`}
                                >
                                    <div className="flex justify-between items-start w-full mb-2 z-10 relative">
                                        <h3 className="font-bold text-slate-600 text-xs uppercase tracking-wider">{card.title}</h3>
                                    </div>

                                    <div className="flex items-end justify-between z-10 relative">
                                        <span className={`text-4xl font-bold ${card.color}`}>
                                            {card.score}
                                        </span>
                                        <div className={`p-2 rounded-full bg-slate-50 group-hover:bg-white transition-colors`}>
                                            <Activity className={`w-5 h-5 ${card.color} opacity-50 group-hover:opacity-100`} />
                                        </div>
                                    </div>

                                    <div className="w-full h-px bg-slate-100 my-3 relative z-10" />

                                    <p className="text-[11px] text-slate-400 font-medium relative z-10">
                                        {card.subText}
                                    </p>

                                    {/* Decorative Background Icon */}
                                    <Activity className="absolute -right-4 -bottom-4 w-32 h-32 text-slate-50 opacity-50 group-hover:scale-110 transition-transform duration-500 z-0" />
                                </button>
                            ))}

                            {/* Randevu Kartı Özel */}
                            <button
                                onClick={() => { }} // Randevu modalını açtırabiliriz
                                className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-slate-100 hover:border-rose-500 hover:shadow-md transition-all text-left flex flex-col justify-between group h-36 relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start w-full mb-2 z-10 relative">
                                    <h3 className="font-bold text-slate-600 text-xs uppercase tracking-wider">Bugünkü Randevular</h3>
                                </div>
                                <div className="flex items-end justify-between z-10 relative">
                                    <span className="text-4xl font-bold text-rose-500">
                                        {tasks.filter(t => t.date && t.date.startsWith(new Date().toISOString().split('T')[0])).length}
                                    </span>
                                    <div className="p-2 rounded-full bg-slate-50 group-hover:bg-white transition-colors">
                                        <Calendar className="w-5 h-5 text-rose-500 opacity-50 group-hover:opacity-100" />
                                    </div>
                                </div>
                                <div className="w-full h-px bg-slate-100 my-3 relative z-10" />
                                <p className="text-[11px] text-slate-400 font-medium relative z-10">
                                    Bugün planlanan görüşmeler
                                </p>
                                <Calendar className="absolute -right-4 -bottom-4 w-32 h-32 text-slate-50 opacity-50 group-hover:scale-110 transition-transform duration-500 z-0" />
                            </button>

                        </div>
                    </div>

                    {/* Sağ Kolon: Son İşlemler / Liste */}
                    <div className="w-full lg:w-96 flex flex-col gap-6">
                        <div className="bg-white rounded-lg shadow-sm p-0 overflow-hidden border border-slate-100 h-full max-h-[600px] flex flex-col">
                            <div className="p-4 border-b border-slate-100 flex flex-col gap-3 bg-slate-50/50">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        Son Eklenenler
                                    </h3>
                                </div>
                                <div className="flex bg-slate-200 rounded-lg p-1 gap-1">
                                    <button
                                        onClick={() => setFilter('daily')}
                                        className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${filter === 'daily' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Günlük
                                    </button>
                                    <button
                                        onClick={() => setFilter('weekly')}
                                        className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${filter === 'weekly' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Haftalık
                                    </button>
                                    <button
                                        onClick={() => setFilter('monthly')}
                                        className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${filter === 'monthly' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Aylık
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-y-auto p-2 space-y-2 custom-scrollbar flex-1">
                                {recentTasks.length > 0 ? recentTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        onClick={() => onTaskClick(task)}
                                        className="group bg-white p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">#{task.orderNumber}</span>
                                            <span className="text-[10px] text-slate-400">
                                                {new Date(task.date || task.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString('tr-TR')}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-sm text-slate-700 group-hover:text-blue-600 transition-colors line-clamp-1">{task.title}</h4>
                                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{StatusLabels[task.status]}</p>
                                    </div>
                                )) : (
                                    <div className="text-center py-8 text-slate-400 text-sm">
                                        Henüz kayıt bulunmuyor.
                                    </div>
                                )}
                            </div>

                            <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
                                <button onClick={() => onNavigate()} className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">
                                    Tüm Kayıtları Görüntüle
                                </button>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Dashboard;
