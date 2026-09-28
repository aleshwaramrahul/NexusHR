import React, { useState } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import { Database, Copy, Check, ExternalLink, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const isConfigured = isSupabaseConfigured();

  if (!isOpen) return null;

  const handleCopyEnv = () => {
    const envContent = `VITE_SUPABASE_URL=https://your-supabase-project-id.supabase.co\nVITE_SUPABASE_ANON_KEY=your_anon_key_here`;
    navigator.clipboard.writeText(envContent);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Supabase Backend Integration</h3>
            <p className="text-xs text-slate-500">Connect your Supabase PostgreSQL database to NexusHR</p>
          </div>
        </div>

        {/* Current Connection Status */}
        <div className={`p-4 rounded-xl border mb-6 flex items-start space-x-3 ${
          isConfigured 
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
            : 'bg-amber-50/80 border-amber-200 text-amber-900'
        }`}>
          {isConfigured ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider">
              {isConfigured ? 'Supabase Connection Active' : 'Operating in Standalone Local Mode'}
            </h4>
            <p className="text-xs mt-1 text-slate-700 leading-relaxed">
              {isConfigured
                ? 'Your web app is synced with your live Supabase API credentials.'
                : 'The web app is running smoothly using the built-in local state layer. Follow the 3 steps below to hook up your own Supabase backend whenever you are ready.'}
            </p>
          </div>
        </div>

        {/* 3 Step Guide */}
        <div className="space-y-4 text-xs text-slate-700">
          
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-900">Step 1: Create Supabase Project</span>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 font-semibold flex items-center space-x-1 hover:underline text-[11px]"
              >
                <span>Supabase Dashboard</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-slate-500">
              Create a free project at supabase.com, then navigate to Project Settings &gt; API to find your URL and anon API key.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-900">Step 2: Run Database Schema SQL</span>
              <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                supabase_schema.sql
              </span>
            </div>
            <p className="text-slate-500 mb-2">
              We generated a complete PostgreSQL SQL DDL schema file (`supabase_schema.sql`) in your project root containing table definitions, RLS security policies, and seed data.
            </p>
            <div className="bg-slate-900 text-slate-200 p-2.5 rounded-lg font-mono text-[11px] flex justify-between items-center">
              <span>d:\ASR\test2\supabase_schema.sql</span>
              <button
                onClick={() => {
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2000);
                }}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 flex items-center space-x-1"
              >
                {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <FileText className="w-3 h-3" />}
                <span>{copiedSql ? 'Located' : 'View File'}</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-900">Step 3: Add Credentials to `.env`</span>
              <button
                onClick={handleCopyEnv}
                className="text-indigo-600 font-semibold flex items-center space-x-1 hover:underline text-[11px]"
              >
                {copiedEnv ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedEnv ? 'Copied' : 'Copy Template'}</span>
              </button>
            </div>
            <p className="text-slate-500 mb-2">
              Add your Supabase URL and anon key to `.env` or set environment variables:
            </p>
            <pre className="bg-slate-900 text-emerald-400 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here`}
            </pre>
          </div>

        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
          >
            Got it, Close
          </button>
        </div>

      </div>
    </div>
  );
};
