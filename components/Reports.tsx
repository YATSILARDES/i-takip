import React from 'react';
import { Task, TaskStatus, StatusLabels } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Download, FileSpreadsheet } from 'lucide-react';

interface ReportsProps {
    tasks: Task[];
    onExportExcel: () => void;
}

const COLORS = ['#f59e0b', '#3b82f6', '#6366f1', '#10b981', '#a855f7'];

const Reports: React.FC<ReportsProps> = ({ tasks, onExportExcel }) => {

    // --- Data Preparation ---
    const statusData = [
        TaskStatus.TO_CHECK,
        TaskStatus.CHECK_COMPLETED,
        TaskStatus.DEPOSIT_PAID,
        TaskStatus.GAS_OPENED,
        TaskStatus.SERVICE_DIRECTED
    ].map(status => ({
        name: StatusLabels[status],
        value: tasks.filter(t => t.status === status).length
    }));

    // Assignee Data (Top 5)
    const assigneeMap: Record<string, number> = {};
    tasks.forEach(t => {
        const name = t.assignee || 'Atanmamış';
        assigneeMap[name] = (assigneeMap[name] || 0) + 1;
    });
    const assigneeData = Object.entries(assigneeMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    // Calculate Completion Rate (Gas Opened + Service Directed) / Total
    const completedCount = tasks.filter(t => t.status === TaskStatus.GAS_OPENED || t.status === TaskStatus.SERVICE_DIRECTED).length;
    const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-y-auto p-6 space-y-6">

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">İş Raporları</h2>
                    <p className="text-sm text-slate-500">Genel durum ve performans analizi</p>
                </div>
                <button
                    onClick={onExportExcel}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-colors shadow-lg shadow-green-600/20"
                >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Excel İndir</span>
                </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-slate-500 text-sm font-medium mb-2">Toplam İş</h3>
                    <div className="text-4xl font-bold text-slate-800">{tasks.length}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-slate-500 text-sm font-medium mb-2">Tamamlanma Oranı</h3>
                    <div className="text-4xl font-bold text-blue-600">%{completionRate}</div>
                    <p className="text-xs text-slate-400 mt-2">Gaz açımı ve servis aşamasına gelenler</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-slate-500 text-sm font-medium mb-2">Bekleyen İşler</h3>
                    <div className="text-4xl font-bold text-amber-500">
                        {tasks.filter(t => t.status === TaskStatus.TO_CHECK).length}
                    </div>
                </div>
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
                {/* Status Distribution */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="font-bold text-slate-700 mb-4">İş Durumu Dağılımı</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Assignee Performance */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="font-bold text-slate-700 mb-4">Personel İş Dağılımı (Top 5)</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={assigneeData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
