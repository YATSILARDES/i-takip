import React from 'react';
import { Home, Briefcase, Settings, BarChart2, FolderOpen, LogOut, Layout } from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    activeTab: string;
    onTabChange: (tab: string) => void;
    isAdmin: boolean;
    onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, activeTab, onTabChange, isAdmin, onLogout }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Panel', icon: Home },
        { id: 'projects', label: 'Projeler', icon: Briefcase },
        { id: 'reports', label: 'Raporlar', icon: BarChart2 },
        { id: 'archive', label: 'Arşiv', icon: FolderOpen },
    ];

    if (isAdmin) {
        menuItems.push({ id: 'settings', label: 'Ayarlar', icon: Settings });
    }

    return (
        <div
            className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 shadow-2xl shadow-black/20
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
        flex flex-col
      `}
        >
            {/* Logo Area */}
            <div className="h-20 flex items-center px-8 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-900/40 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">İ</span>
                    </div>
                    <span className="font-bold text-xl text-slate-100 tracking-tight">İş Takip</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-8 space-y-2">
                {menuItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`
                w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                                    ? 'bg-blue-600/10 text-blue-400 shadow-sm shadow-blue-900/20 ring-1 ring-blue-500/20'
                                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                                }
              `}
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-current'}`} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-800">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 text-white shadow-lg shadow-black/20 mb-4 border border-slate-700">
                    <h4 className="font-bold text-sm mb-1 text-slate-200">Pro Sürüm</h4>
                    <p className="text-xs text-slate-400 mb-3">Tüm özelliklere erişmek için yükseltin.</p>
                    <button className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold transition-colors text-white">
                        Planı İncele
                    </button>
                </div>

                {onLogout && (
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Çıkış Yap
                    </button>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
