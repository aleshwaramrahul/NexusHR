import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Task, TaskPriority, TaskStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  CheckSquare, 
  PlusCircle, 
  LayoutGrid, 
  List, 
  MessageSquare, 
  Clock, 
  User, 
  Trash2, 
  ArrowRight, 
  CheckCircle2, 
  PlayCircle 
} from 'lucide-react';

interface TasksPageProps {
  onOpenCreateTask: () => void;
  onSelectTaskForComments: (task: Task) => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  onOpenCreateTask,
  onSelectTaskForComments
}) => {
  const { role, employee } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  useEffect(() => {
    loadTasks();
  }, [role, employee?.id]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      let fetched: Task[] = [];
      if (role === 'EMPLOYEE' && employee) {
        fetched = await storageService.fetchTasksByEmployeeRealtime(employee.id);
      } else {
        fetched = await storageService.fetchTasksRealtime();
      }
      setTasks(fetched);
    } catch (err) {
      console.error('Failed loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusMove = async (taskId: string, newStatus: TaskStatus) => {
    await storageService.updateTaskStatus(taskId, newStatus);
    await loadTasks();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this task?')) {
      await storageService.deleteTask(id);
      await loadTasks();
    }
  };

  const filteredTasks = tasks.filter(t => 
    priorityFilter === 'ALL' || t.priority === priorityFilter
  );

  const pendingTasks = filteredTasks.filter(t => t.status === 'PENDING');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'IN_PROGRESS');
  const completedTasks = filteredTasks.filter(t => t.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-soft">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Task Management & Kanban ({tasks.length})</h2>
          <p className="text-xs text-slate-500">NexusHR workflow pipeline with priority tagging and comments</p>
        </div>

        <div className="flex items-center space-x-3">
          
          {/* View Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                viewMode === 'kanban' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          {role === 'ADMIN' && (
            <button
              onClick={onOpenCreateTask}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md flex items-center space-x-1.5 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          )}

        </div>
      </div>

      {/* Priority Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft flex items-center space-x-3 text-xs">
        <span className="font-semibold text-slate-600">Filter Priority:</span>
        {['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
          <button
            key={p}
            onClick={() => setPriorityFilter(p)}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              priorityFilter === p
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column 1: PENDING */}
          <div className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <h3 className="font-bold text-slate-800 text-sm">PENDING ({pendingTasks.length})</h3>
              </div>
            </div>

            <div className="space-y-3 flex-1">
              {pendingTasks.map(t => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onMove={handleStatusMove}
                  onDelete={handleDelete}
                  onSelectComments={onSelectTaskForComments}
                  role={role}
                />
              ))}
            </div>
          </div>

          {/* Column 2: IN_PROGRESS */}
          <div className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                <h3 className="font-bold text-slate-800 text-sm">IN PROGRESS ({inProgressTasks.length})</h3>
              </div>
            </div>

            <div className="space-y-3 flex-1">
              {inProgressTasks.map(t => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onMove={handleStatusMove}
                  onDelete={handleDelete}
                  onSelectComments={onSelectTaskForComments}
                  role={role}
                />
              ))}
            </div>
          </div>

          {/* Column 3: COMPLETED */}
          <div className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h3 className="font-bold text-slate-800 text-sm">COMPLETED ({completedTasks.length})</h3>
              </div>
            </div>

            <div className="space-y-3 flex-1">
              {completedTasks.map(t => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onMove={handleStatusMove}
                  onDelete={handleDelete}
                  onSelectComments={onSelectTaskForComments}
                  role={role}
                />
              ))}
            </div>
          </div>

        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Task Title</th>
                <th className="py-3 px-4">Assigned Employee</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">{t.title}</td>
                  <td className="py-3 px-4 text-slate-600">{t.employeeName}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.priority === 'URGENT' ? 'bg-rose-100 text-rose-800' :
                      t.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{t.status}</td>
                  <td className="py-3 px-4 text-slate-500">{t.dueDate}</td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => onSelectTaskForComments(t)}
                      className="p-1.5 bg-slate-100 text-slate-700 hover:text-indigo-600 rounded"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                    {role === 'ADMIN' && (
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};

// Task Card Component for Kanban Board
const TaskCard: React.FC<{
  task: Task;
  onMove: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
  onSelectComments: (task: Task) => void;
  role: string;
}> = ({ task, onMove, onDelete, onSelectComments, role }) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-soft hover:shadow-md transition-all space-y-3">
      <div className="flex items-center justify-between">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
          task.priority === 'URGENT' ? 'bg-rose-100 text-rose-800' :
          task.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' :
          'bg-slate-100 text-slate-700'
        }`}>
          {task.priority}
        </span>
        
        {role === 'ADMIN' && (
          <button onClick={() => onDelete(task.id)} className="text-slate-400 hover:text-rose-600 p-1">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div>
        <h4 className="font-bold text-slate-900 text-xs leading-snug">{task.title}</h4>
        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{task.description}</p>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
        <div className="flex items-center space-x-1">
          <User className="w-3 h-3 text-indigo-600" />
          <span className="font-semibold text-slate-700">{task.employeeName}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>{task.dueDate}</span>
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <button
          onClick={() => onSelectComments(task)}
          className="text-slate-600 hover:text-indigo-600 flex items-center space-x-1 font-medium text-[11px]"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Comments ({task.commentsCount || 0})</span>
        </button>

        {/* Move dropdown / buttons */}
        <div className="flex items-center space-x-1">
          {task.status === 'PENDING' && (
            <button
              onClick={() => onMove(task.id, 'IN_PROGRESS')}
              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded font-semibold text-[10px] flex items-center space-x-0.5"
            >
              <span>Move Progress</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          {task.status === 'IN_PROGRESS' && (
            <button
              onClick={() => onMove(task.id, 'COMPLETED')}
              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded font-semibold text-[10px] flex items-center space-x-0.5"
            >
              <span>Complete</span>
              <CheckCircle2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
