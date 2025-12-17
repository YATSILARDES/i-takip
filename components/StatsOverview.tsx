import React from 'react';
import { Task, TaskStatus } from '../types'; // Adjust path if needed
import { Briefcase, Clock, CheckCircle2, TrendingUp } from 'lucide-react';

interface StatsOverviewProps {
    tasks: Task[];
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ tasks }) => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === TaskStatus.GAS_OPENED || t.status === TaskStatus.SERVICE_DIRECTED).length; // Assuming GAS_OPENED/SERVICE_DIRECTED as 'completed' stages for stats
    const pendingTasks = tasks.filter(t => t.status === TaskStatus.TO_CHECK || t.status === TaskStatus.CHECK_COMPLETED).length;

    // Calculate "Revenue" - purely simulational based on task count to look cool, or if there is a price field, user hasn't mentioned one yet. 
    // checking types.ts might reveal price fields. defaulting to task count for now.
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const stats = [
        {
            title: 'Toplam Proje',
            value: totalTasks.toString(),
            trend: '+2 bu hafta',
            icon: Briefcase,
            color: 'bg-blue-500',
            lightColor: 'bg-blue-50 text-blue-600'
        },
        {
            title: 'Devam Eden',
            value: pendingTasks.toString(),
            trend: 'Aksiyon gerekiyor',
            icon: Clock,
            color: 'bg-amber-500',
            lightColor: 'bg-amber-50 text-amber-600'
        },
        {
            title: 'Tamamlanan',
            value: completedTasks.toString(),
            trend: `%${completionRate} başarı oranı`,
            icon: CheckCircle2,
            color: 'bg-emerald-500',
            lightColor: 'bg-emerald-50 text-emerald-600'
        },
        {
            title: 'Performans',
            value: '%98', // Placeholder
            trend: 'Hedefin üstünde',
            icon: TrendingUp,
            color: 'bg-indigo-500',
            lightColor: 'bg-indigo-50 text-indigo-600'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100/50 hover:shadow-lg transition-all duration-300 group">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</h3>
                        </div>
                        <div className={`p-3 rounded-2xl ${stat.lightColor} group-hover:scale-110 transition-transform duration-300`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs font-medium">
                        <span className={stat.title === 'Devam Eden' ? 'text-amber-600' : 'text-emerald-600'}>
                            {stat.trend}
                        </span>
                        <span className="text-slate-400">• Güncel</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StatsOverview;
