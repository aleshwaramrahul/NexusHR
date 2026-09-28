import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Task, TaskComment } from '../types';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, X, Clock } from 'lucide-react';

interface TaskCommentsDrawerProps {
  task: Task | null;
  onClose: () => void;
}

export const TaskCommentsDrawer: React.FC<TaskCommentsDrawerProps> = ({ task, onClose }) => {
  const { user, employee } = useAuth();
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (task) {
      loadComments(task.id);
    }
  }, [task]);

  const loadComments = async (taskId: string) => {
    try {
      const comms = await storageService.fetchTaskCommentsRealtime(taskId);
      setComments(comms);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  if (!task) return null;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    const authorName = user.name || 'Anonymous User';
    const empId = employee?.id || 'emp-demo';

    const created = await storageService.addTaskComment(task.id, empId, authorName, newComment.trim());
    setComments(prev => [...prev, created]);
    setNewComment('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-slate-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Task Discussion & Comments</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Info Summary */}
        <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 text-xs">
          <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-indigo-100 text-indigo-800">
            {task.priority} PRIORITY
          </span>
          <h4 className="font-bold text-slate-900 text-sm mt-1.5">{task.title}</h4>
          <p className="text-slate-600 mt-1">{task.description}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-indigo-100">
            <span>Assigned to: <strong>{task.employeeName}</strong></span>
            <span>Due: {task.dueDate}</span>
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {comments.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No comments yet. Start the conversation!</p>
            </div>
          ) : (
            comments.map(c => (
              <div key={c.id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-800 text-xs">{c.authorName}</span>
                  <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-700 whitespace-pre-wrap">{c.comment}</p>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <form onSubmit={handleAddComment} className="p-3 border-t border-slate-200 bg-white">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Write a comment..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm"
              title="Send Comment"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
