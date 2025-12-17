import React, { useState } from 'react';
import { Task, TaskStatus, StatusLabels } from '../types';
import { MoreVertical, Search, Filter, Calendar, MapPin, Phone, User as UserIcon } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const columns: TaskStatus[] = [
  TaskStatus.TO_CHECK,
  TaskStatus.CHECK_COMPLETED,
  TaskStatus.DEPOSIT_PAID,
  TaskStatus.GAS_OPENED,
  TaskStatus.SERVICE_DIRECTED,
];

const StatusIcon = ({ status }: { status: TaskStatus }) => {
  switch (status) {
    case TaskStatus.TO_CHECK: return <div className="w-2 h-2 rounded-full bg-amber-500" />;
    case TaskStatus.CHECK_COMPLETED: return <div className="w-2 h-2 rounded-full bg-blue-500" />;
    case TaskStatus.DEPOSIT_PAID: return <div className="w-2 h-2 rounded-full bg-indigo-500" />;
    case TaskStatus.GAS_OPENED: return <div className="w-2 h-2 rounded-full bg-emerald-500" />;
    case TaskStatus.SERVICE_DIRECTED: return <div className="w-2 h-2 rounded-full bg-purple-500" />;
    default: return <div className="w-2 h-2 rounded-full bg-slate-300" />;
  }
};

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onTaskClick }) => {
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});

  const handleSearchChange = (status: string, value: string) => {
    setSearchTerms(prev => ({
      ...prev,
      [status]: value
    }));
  };

  const getFilteredTasks = (status: TaskStatus) => {
    const term = (searchTerms[status] || '').toLowerCase();
    return tasks.filter(task => {
      if (task.status !== status) return false;
      if (!term) return true;
      return (
        task.title.toLowerCase().includes(term) ||
        (task.assignee && task.assignee.toLowerCase().includes(term)) ||
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
            <div key={status} className="flex-1 flex flex-col min-w-[300px] bg-slate-100/50 rounded-[2rem] border border-white/40 backdrop-blur-sm shadow-inner group-first:ml-0">
              {/* Column Header */}
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusIcon status={status} />
                  <span className="font-bold text-slate-800 tracking-tight text-sm truncate uppercase">{StatusLabels[status]}</span>
                  <span className="px-2.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded-full text-slate-500 font-bold shadow-sm">
                    {tasks.filter(t => t.status === status).length}
                  </span>
                </div>
                <button className="text-slate-300 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/50 transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="px-4 pb-2">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Ara..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(status, e.target.value)}
                    className="w-full bg-white border border-transparent focus:border-blue-200 focus:bg-white rounded-xl py-2 pl-9 pr-3 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm group-hover:shadow-md"
                  />
                </div>
              </div>

              {/* Tasks Container */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {filteredTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="
                      bg-white p-4 rounded-xl border border-transparent hover:border-blue-200 
                      shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] 
                      transition-all duration-300 cursor-pointer group relative
                    "
                  >
                    {/* Header: Title & Options */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          #{task.orderNumber}
                        </span>
                        <h4 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </h4>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-1.5 mb-3">
                      {task.address && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{task.address}</span>
                        </div>
                      )}
                      {task.assignee && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{task.assignee}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags / Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-2">
                      <div className="flex gap-1.5">
                        {task.checkStatus === 'clean' && (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-semibold rounded-md border border-emerald-100">Temiz</span>
                        )}
                        {task.checkStatus === 'missing' && (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-semibold rounded-md border border-amber-100">Eksik</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(task.date || task.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanBoard;