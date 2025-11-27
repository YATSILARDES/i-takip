import React, { useState } from 'react';
import { Task, TaskStatus, StatusLabels } from '../types';
import { MoreVertical, ClipboardList, ClipboardCheck, Banknote, Flame, Wrench, Circle, Phone, MapPin, CheckCircle2, Search } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const StatusIcon = ({ status }: { status: TaskStatus }) => {
  switch (status) {
    case TaskStatus.TO_CHECK: return <ClipboardList className="w-4 h-4 text-slate-400" />;
    case TaskStatus.CHECK_COMPLETED: return <ClipboardCheck className="w-4 h-4 text-emerald-400" />;
    case TaskStatus.DEPOSIT_PAID: return <Banknote className="w-4 h-4 text-green-400" />;
    case TaskStatus.GAS_OPENED: return <Flame className="w-4 h-4 text-orange-400" />;
    case TaskStatus.SERVICE_DIRECTED: return <Wrench className="w-4 h-4 text-blue-400" />;
    default: return <Circle className="w-4 h-4 text-gray-400" />;
  }
};

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onTaskClick }) => {
  // State to track search queries for each column
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});

  // Define the order explicitly including the new column
  const columns = [
    TaskStatus.TO_CHECK,
    TaskStatus.CHECK_COMPLETED,
    TaskStatus.DEPOSIT_PAID,
    TaskStatus.GAS_OPENED,
    TaskStatus.SERVICE_DIRECTED
  ];

  const handleSearchChange = (status: string, value: string) => {
    setSearchTerms(prev => ({
      ...prev,
      [status]: value
    }));
  };

  const getFilteredTasks = (status: TaskStatus) => {
    const term = (searchTerms[status] || '').toLowerCase().trim();
    const columnTasks = tasks.filter(t => t.status === status);

    if (!term) return columnTasks;

    return columnTasks.filter(task => {
      return (
        task.title.toLowerCase().includes(term) ||
        task.orderNumber.toString().includes(term) ||
        (task.phone && task.phone.includes(term)) ||
        (task.address && task.address.toLowerCase().includes(term))
      );
    });
  };

  // Helper to determine card style based on verification and notes
  const getCardStyle = (task: Task) => {
    if (task.isCheckVerified) {
      if (task.teamNote && task.teamNote.trim().length > 0) {
        // Verified but has notes -> Orange (Warning/Issue)
        return {
          container: 'bg-orange-900/40 border-orange-500/50 hover:border-orange-400 shadow-orange-900/10',
          text: 'text-orange-100',
          badge: 'text-orange-300',
          subText: 'text-orange-200/70',
          icon: 'text-orange-400'
        };
      } else {
        // Verified and NO notes -> Green (Clean)
        return {
          container: 'bg-emerald-900/40 border-emerald-500/50 hover:border-emerald-400 shadow-emerald-900/10',
          text: 'text-emerald-100',
          badge: 'text-emerald-300',
          subText: 'text-emerald-200/70',
          icon: 'text-emerald-400'
        };
      }
    }
    // Default
    return {
      container: 'bg-slate-700/40 border-slate-600/30 hover:border-blue-500/30 hover:shadow-lg',
      text: 'text-slate-200',
      badge: 'text-slate-500',
      subText: 'text-slate-400',
      icon: 'text-slate-500'
    };
  };

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
      <div className="flex gap-6 h-full min-w-[1500px]">
        {columns.map((status) => {
          const filteredTasks = getFilteredTasks(status);
          const searchTerm = searchTerms[status] || '';

          return (
            <div key={status} className="flex-1 flex flex-col min-w-[280px] bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm">
              {/* Column Header */}
              <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-slate-200">
                  <StatusIcon status={status} />
                  <span className="truncate">{StatusLabels[status]}</span>
                  <span className="ml-2 px-2 py-0.5 text-xs bg-slate-700 rounded-full text-slate-300">
                    {tasks.filter(t => t.status === status).length}
                  </span>
                </div>
                <button className="text-slate-500 hover:text-slate-300">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="px-3 py-2 border-b border-slate-700/30 bg-slate-800/30">
                <div className="relative group">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input 
                    type="text"
                    placeholder="Ara (İsim, No, Adres...)"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(status, e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-md py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Tasks Container */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
                {filteredTasks.map(task => {
                  const style = getCardStyle(task);
                  return (
                    <div 
                      key={task.id} 
                      onClick={() => onTaskClick(task)}
                      className={`
                        px-3 py-3 rounded-lg border transition-all cursor-pointer group relative
                        ${style.container}
                      `}
                    >
                      {/* Row Number Badge - Compact */}
                      <div className={`absolute top-2 right-2 text-[10px] font-mono font-bold opacity-60 ${style.badge}`}>
                        #{task.orderNumber}
                      </div>

                      {/* Title */}
                      <h4 className={`font-medium text-sm leading-snug pr-8 mb-1.5 ${style.text}`}>
                        {task.title}
                      </h4>
                      
                      {/* Address Only - Compact */}
                      {task.address && (
                        <div className={`flex items-center gap-1.5 text-xs ${style.subText}`}>
                           <MapPin className={`w-3 h-3 flex-shrink-0 ${style.icon}`} />
                           <span className="truncate max-w-[200px]">{task.address}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {filteredTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-slate-700/50 rounded-lg text-slate-500">
                    <span className="text-xs opacity-70">
                       {searchTerm ? 'Sonuç bulunamadı' : 'İş kaydı yok'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanBoard;