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
    const term = (searchTerms[status] || '').toLocaleLowerCase('tr').trim();
    const columnTasks = tasks.filter(t => t.status === status);

    if (!term) return columnTasks;

    return columnTasks.filter(task => {
      return (
        task.title.toLocaleLowerCase('tr').includes(term) ||
        (task.jobDescription && task.jobDescription.toLocaleLowerCase('tr').includes(term)) ||
        task.orderNumber.toString().includes(term) ||
        (task.phone && task.phone.includes(term)) ||
        (task.address && task.address.toLocaleLowerCase('tr').includes(term))
      );
    });
  };

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 w-full h-full">
      <div className="flex gap-6 h-full min-w-[1500px]">
        {columns.map((status) => {
          const filteredTasks = getFilteredTasks(status);
          const searchTerm = searchTerms[status] || '';

          return (
            <div key={status} className="flex-1 flex flex-col min-w-[280px] bg-slate-100/80 rounded-2xl border border-slate-200/60 backdrop-blur-sm shadow-sm">
              {/* Column Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-slate-700">
                  <StatusIcon status={status} />
                  <span className="truncate">{StatusLabels[status]}</span>
                  <span className="ml-2 px-2 py-0.5 text-xs bg-white border border-slate-200 rounded-full text-slate-500 font-bold">
                    {tasks.filter(t => t.status === status).length}
                  </span>
                </div>
                <button className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-full transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="px-3 py-2 border-b border-slate-200 bg-white/50">
                <div className="relative group">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Ara (İsim, No, Adres...)"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(status, e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-1.5 pl-8 pr-3 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/20 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Tasks Container */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {filteredTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className={`
                      px-3.5 py-3.5 rounded-xl border transition-all cursor-pointer group relative shadow-sm hover:shadow-md hover:-translate-y-0.5
                      ${task.checkStatus === 'missing'
                        ? 'bg-slate-200 border-l-4 border-l-orange-500 border-slate-300 hover:border-orange-500/50'
                        : task.checkStatus === 'clean'
                          ? 'bg-slate-200 border-l-4 border-l-emerald-500 border-slate-300 hover:border-emerald-500/50'
                          : 'bg-slate-200 border-l-4 border-l-slate-400 border-slate-300 hover:border-blue-500/50 hover:border-l-blue-500'
                      }
                    `}
                  >
                    {/* Row Number Badge - Compact */}
                    <div className={`absolute top-2 right-2 text-[10px] font-mono font-bold opacity-60 ${task.checkStatus === 'missing' ? 'text-orange-600' :
                      task.checkStatus === 'clean' ? 'text-emerald-600' : 'text-slate-500'
                      }`}>
                      #{task.orderNumber}
                    </div>

                    {/* Title */}
                    <h4 className={`font-medium text-sm leading-snug pr-8 mb-1.5 ${task.checkStatus === 'missing' ? 'text-orange-700' :
                      task.checkStatus === 'clean' ? 'text-emerald-700' : 'text-slate-700'
                      }`}>
                      {task.title}
                      {task.jobDescription && <span className="ml-2 text-xs font-normal opacity-60 italic text-slate-500">({task.jobDescription})</span>}
                    </h4>

                    {/* Address Only - Compact */}
                    {task.address && (
                      <div className={`flex items-center gap-1.5 text-xs ${task.checkStatus === 'missing' ? 'text-orange-600/70' :
                        task.checkStatus === 'clean' ? 'text-emerald-600/70' : 'text-slate-500'
                        }`}>
                        <MapPin className={`w-3 h-3 flex-shrink-0 ${task.checkStatus === 'missing' ? 'text-orange-500' :
                          task.checkStatus === 'clean' ? 'text-emerald-500' : 'text-slate-400'
                          }`} />
                        <span className="truncate max-w-[200px] text-inherit">{task.address}</span>
                      </div>
                    )}
                  </div>
                ))}

                {filteredTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-slate-300/50 rounded-lg text-slate-400">
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