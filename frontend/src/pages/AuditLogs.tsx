import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Filter } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [teamUsers, setTeamUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchAuditLogs = () => {
    if (!token) return;
    setLoading(true);
    const url = selectedUser ? `/api/audit?user_id=${selectedUser}` : '/api/audit';
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLogs(data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token) {
      fetch('/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setTeamUsers(data);
        })
        .catch(() => {});
    }
  }, [token]);

  useEffect(() => {
    fetchAuditLogs();
  }, [token, selectedUser]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Security & Audit Logs</h1>
          <p className="text-xs text-slate-400">Track all updates, transactions, and actions performed by team members</p>
        </div>

        {/* Member filter dropdown */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-400">Filter Member:</span>
          <select 
            value={selectedUser} 
            onChange={(e) => setSelectedUser(e.target.value)}
            className="bg-transparent text-white focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-slate-950">All Team Members</option>
            {teamUsers.map(u => (
              <option key={u.id} value={u.id} className="bg-slate-950">
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Team Member</th>
                <th className="p-4">Action</th>
                <th className="p-4">Entity</th>
                <th className="p-4">Activity / Changes Done</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {logs.map((item) => (
                <tr key={item.id} className="hover:bg-slate-900/20">
                  <td className="p-4 font-medium whitespace-nowrap text-slate-400">
                    {new Date(item.timestamp).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] text-brand-300">
                        {(item.user_name || 'S').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-white leading-tight">{item.user_name || 'System User'}</p>
                        <span className="text-[9px] uppercase text-slate-500 font-bold">{item.user_role || 'ADMIN'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                      item.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      item.action === 'CANCEL' || item.action === 'DELETE' || item.action === 'VOID' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      'bg-orange-500/10 text-orange-600 border border-orange-500/20'
                    }`}>
                      {item.action}
                    </span>
                  </td>
                  <td className="p-4 text-slate-200 font-medium whitespace-nowrap">
                    {item.entity_type}
                  </td>
                  <td className="p-4 text-slate-300 max-w-sm">
                    {item.new_value ? (
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80 font-mono text-[10px] text-emerald-300/90 break-words">
                        {JSON.stringify(item.new_value)}
                      </div>
                    ) : item.previous_value ? (
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80 font-mono text-[10px] text-rose-300/90 break-words">
                        {JSON.stringify(item.previous_value)}
                      </div>
                    ) : (
                      <span className="text-slate-500">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    {loading ? 'Loading log records...' : 'No activity logged for the selected filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
