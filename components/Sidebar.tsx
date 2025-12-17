import React from 'react';
import { Home, Layout, Users, FileText, Settings, LogOut } from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    activeTab?: string;
    onTabChange?: (tab: string) => void;
    isAdmin?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, activeTab = 'home', onTabChange, isAdmin }) => {
    const menuItems = [
        { id: 'home', label: 'Genel Bakış', icon: Home },
        { id: 'board', label: 'Proje Panosu', icon: Layout },
        { id: 'customers', label: 'Müşteriler', icon: Users },
        { id: 'reports', label: 'Raporlar', icon: FileText },
    ];

    return (
        <div className={`
      flex-shrink-0 bg-white border-r border-slate-200 transition-all duration-300 ease-in-out flex flex-col
      ${isOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden'}
    `}>
            <div className="p-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-600/20">
                        <Layout className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-slate-800 tracking-tight leading-tight">ONAY</h1>
                        <p className="text-xs text-slate-500 font-medium tracking-wider">MÜHENDİSLİK</p>
                    </div>
                </div>

                <nav className="space-y-1">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onTabChange?.(item.id)}
                            className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${activeTab === item.id
                                    ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-100 ring-1 ring-blue-100'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
              `}
                        >
                            <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-blue-600' : 'text-slate-400'}`} />
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-auto p-4 border-t border-slate-100">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <h4 className="text-xs font-semibold text-slate-900 mb-1">Pro Versiyon</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed mb-3">
                        Tüm özelliklere erişiminiz var.
                    </p>
                    {isAdmin && (
                        <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
                            <Settings className="w-3.5 h-3.5" />
                            <span>Yönetici Paneli</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
