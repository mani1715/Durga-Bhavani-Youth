import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Database, Download, UploadCloud, RefreshCw, AlertTriangle } from 'lucide-react';

interface BackupHistory {
  id: string;
  filename: string;
  timestamp: string;
  size_bytes: number;
}

export const Backup: React.FC = () => {
  const { lang } = useLanguage();
  const { token } = useAuth();
  const [history, setHistory] = useState<BackupHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/backup/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchHistory();
  }, [token]);

  const handleCreateBackup = async () => {
    setCreating(true);
    setMessage(null);
    try {
      const res = await fetch('/api/backup/create', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Backup creation failed');
      setMessage({ text: 'Backup created successfully!', type: 'success' });
      fetchHistory();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('WARNING: Restoring a backup will OVERWRITE all current data. Do you wish to continue?')) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setRestoring(true);
    setMessage(null);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) throw new Error('Failed to restore backup');
      setMessage({ text: 'Backup restored successfully! Please refresh the page.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Database className="h-6 w-6 text-amber-600" /> {lang === 'te' ? 'బ్యాకప్ మరియు పునరుద్ధరణ' : 'Backup & Restore'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {lang === 'te' ? 'మీ సమాచారాన్ని భద్రపరచండి లేదా పర్యావరణాల మధ్య తరలించండి' : 'Safeguard your data or migrate between environments'}
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">
            {lang === 'te' ? 'నూతన బ్యాకప్ రూపొందించండి' : 'Create Backup'}
          </h2>
          <p className="text-sm text-slate-600">
            {lang === 'te' 
              ? 'ఈవెంట్‌లు, రసీదులు, ఖర్చులు మరియు సెట్టింగ్‌లతో సహా ప్రస్తుత డేటాబేస్ యొక్క పూర్తి స్నాప్‌షాట్‌ను రూపొందించండి.'
              : 'Generate a full snapshot of your current database, including all events, receipts, expenses, and settings.'}
          </p>
          <button 
            onClick={handleCreateBackup}
            disabled={creating}
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {creating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
            {creating ? (lang === 'te' ? 'బ్యాకప్ సిద్ధమవుతోంది...' : 'Generating Backup...') : (lang === 'te' ? 'కొత్త బ్యాకప్ రూపొందించు' : 'Create New Backup')}
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">Warning: Overwrite Data</p>
              <p className="mt-1">Restoring a backup will completely replace your current database. We recommend creating a backup first.</p>
            </div>
          </div>
          
          <input 
            type="file" 
            accept=".json" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange}
          />
          <button 
            onClick={handleRestoreClick}
            disabled={restoring}
            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {restoring ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {restoring ? 'Restoring...' : 'Restore from JSON File'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-800">Backup History</h2>
        </div>
        
        {loading ? (
          <div className="p-6 text-center text-slate-500 text-sm">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No backups found on server.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Timestamp</th>
                  <th className="px-6 py-3 font-medium">Filename</th>
                  <th className="px-6 py-3 font-medium">Size</th>
                  <th className="px-6 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((bkp) => (
                  <tr key={bkp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-700 whitespace-nowrap">
                      {new Date(bkp.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {bkp.filename}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatSize(bkp.size_bytes)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a 
                        href={`/api/backup/download/${bkp.filename}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md font-medium text-xs transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
