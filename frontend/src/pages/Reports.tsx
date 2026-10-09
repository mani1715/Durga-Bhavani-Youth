import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { Printer, Filter, Download } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Reports: React.FC = () => {
  const { token, user } = useAuth();
  const { activeEvent } = useEvent();
  const [searchParams] = useSearchParams();
  const { lang } = useLanguage();

  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'AUDIT'>(() => {
    return searchParams.get('tab') === 'audit' ? 'AUDIT' : 'SUMMARY';
  });

  const [dataSummary, setDataSummary] = useState<any | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [teamUsers, setTeamUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Fetch Financial Summary
  useEffect(() => {
    if (activeEvent && token) {
      fetch(`/api/reports/summary?event_id=${activeEvent.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setDataSummary(data))
        .catch(() => {});
    }
  }, [activeEvent, token]);

  // Fetch Audit Logs when on AUDIT tab
  useEffect(() => {
    if (activeTab === 'AUDIT' && token) {
      setLoadingAudit(true);
      const url = selectedUser ? `/api/audit?user_id=${selectedUser}` : '/api/audit';
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setAuditLogs(data);
        })
        .finally(() => setLoadingAudit(false));

      fetch('/api/auth/users', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setTeamUsers(data);
        })
        .catch(() => {});
    }
  }, [activeTab, token, selectedUser]);

  const handlePrint = () => {
    window.print();
  };

  const exportToCSV = () => {
    if (!dataSummary) return;
    const rows = [
      ["Parameter", "Value"],
      ["Total Collections", dataSummary.total_donations],
      ["Total Expenses", dataSummary.total_expenses],
      ["Cash Reserve Balance", dataSummary.current_balance],
      ["Receipts Processed", dataSummary.receipts_count],
      ["Expenses Logged", dataSummary.expenses_count]
    ];
    
    let csvContent = "data:text/csv;charset=utf-8,";
    rows.forEach(row => {
      csvContent += row.join(",") + "\r\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financial_report_${activeEvent?.name || 'festival'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isSuperOrOrgAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ORG_ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium text-slate-900 leading-tight">
            {lang === 'te' ? 'ఆర్థిక & ఆడిట్ నివేదికలు' : 'Financial & Audit Reports'}
          </h1>
          <p className="text-sm text-slate-500 font-normal mt-1">
            {lang === 'te' 
              ? 'ఉత్సవ ఖర్చులు, విరాళాల సమగ్ర వివరాలు మరియు ఆడిట్ లాగ్స్ పరిశీలన.' 
              : 'Review official aggregates, cash balances, and administrative audit trails.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-medium shadow-xs cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>{lang === 'te' ? 'ప్రింట్' : 'Print'}</span>
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs sm:text-sm font-medium shadow-xs shadow-orange-500/20 cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{lang === 'te' ? 'CSV డౌన్‌లోడ్' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 print:hidden">
        <button
          onClick={() => setActiveTab('SUMMARY')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
            activeTab === 'SUMMARY'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          {lang === 'te' ? 'ఆర్థిక సంక్షిప్త పట్టిక (Financial Summary)' : 'Financial Balance Sheet'}
        </button>

        {isSuperOrOrgAdmin && (
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'AUDIT'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            {lang === 'te' ? 'భద్రతా & ఆడిట్ లాగ్స్ (Audit Logs)' : 'Security & Audit Trail'}
          </button>
        )}
      </div>

      {/* TAB 1: FINANCIAL BALANCE SHEET */}
      {activeTab === 'SUMMARY' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="text-center pb-6 border-b border-slate-100">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200 inline-block mb-2">
              🌺 శ్రీ దుర్గాభవాని యూత్ — గరువుపాలెం
            </span>
            <h2 className="text-xl sm:text-2xl font-medium text-slate-900">
              31వ దేవీ శరన్నవరాత్రి మహోత్సవముల అధికారిక లెక్కల పట్టిక
            </h2>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">
              Official Festival Financial Statement (2026)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
            {/* Debit / Collections */}
            <div className="space-y-3 bg-slate-50/60 p-5 rounded-2xl border border-slate-100">
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {lang === 'te' ? 'స్వీకరించిన విరాళాలు (Collections)' : 'Collections (Debit)'}
              </h3>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-200/60">
                <span className="text-sm text-slate-700">{lang === 'te' ? 'మొత్తం విరాళాలు' : 'Total Donations Collected'}</span>
                <span className="text-base font-medium text-emerald-600">
                  ₹{Number(dataSummary?.total_donations || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-sm text-slate-700">{lang === 'te' ? 'నమోదైన రశీదుల సంఖ్య' : 'Donations Count'}</span>
                <span className="text-sm font-medium text-slate-900">{dataSummary?.receipts_count || 0}</span>
              </div>
            </div>

            {/* Credit / Expenses */}
            <div className="space-y-3 bg-slate-50/60 p-5 rounded-2xl border border-slate-100">
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {lang === 'te' ? 'చేసిన ఖర్చులు (Expenditure)' : 'Expenditure (Credit)'}
              </h3>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-200/60">
                <span className="text-sm text-slate-700">{lang === 'te' ? 'మొత్తం ఖర్చులు' : 'Total Operational Expenses'}</span>
                <span className="text-base font-medium text-rose-600">
                  ₹{Number(dataSummary?.total_expenses || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-sm text-slate-700">{lang === 'te' ? 'ఖర్చు రికార్డుల సంఖ్య' : 'Expense Logs'}</span>
                <span className="text-sm font-medium text-slate-900">{dataSummary?.expenses_count || 0}</span>
              </div>
            </div>
          </div>

          {/* Net Balance Highlight */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-orange-50/50 p-5 rounded-2xl border border-orange-100">
            <div>
              <h4 className="text-xs uppercase tracking-wider font-medium text-orange-800">
                {lang === 'te' ? 'నికర నగదు నిల్వ (Net Cash Reserves)' : 'Net Cash Reserves Balance'}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'te' ? 'ప్రస్తుత కమిటీ నిధి నిల్వ' : 'Authoritative closing reserve balance'}
              </p>
            </div>
            <span className="text-2xl sm:text-3xl font-medium text-slate-900">
              ₹{Number(dataSummary?.current_balance || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOGS TRAIL */}
      {activeTab === 'AUDIT' && isSuperOrOrgAdmin && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-medium text-slate-900">
                {lang === 'te' ? 'సిస్టమ్ ఆడిట్ లాగ్స్' : 'System Activity Audit Trail'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'te' 
                  ? 'కమిటీ సభ్యులు నిర్వహించిన నవీకరణలు మరియు కార్యకలాపాల రికార్డు.' 
                  : 'Track all database modifications and user activities in chronological order.'}
              </p>
            </div>

            {/* Filter by Team Member */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">{lang === 'te' ? 'సభ్యుడు:' : 'Filter Member:'}</span>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="bg-transparent text-slate-800 focus:outline-none cursor-pointer text-xs"
              >
                <option value="">{lang === 'te' ? 'అందరూ' : 'All Members'}</option>
                {teamUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                  <th className="py-3 px-4">సమయం (Timestamp)</th>
                  <th className="py-3 px-4">సభ్యుడు (User)</th>
                  <th className="py-3 px-4">చర్య (Action)</th>
                  <th className="py-3 px-4">విభాగం (Entity)</th>
                  <th className="py-3 px-4">వివరాలు (Changes)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {auditLogs.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div>
                        <p>{item.user_name || 'System User'}</p>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">{item.user_role}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase border ${
                        item.action === 'CREATE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        item.action === 'CANCEL' || item.action === 'DELETE' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-orange-50 text-orange-700 border-orange-200'
                      }`}>
                        {item.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 text-xs font-mono">
                      {item.entity_type}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs max-w-xs truncate">
                      {item.new_value ? JSON.stringify(item.new_value) : (item.previous_value ? JSON.stringify(item.previous_value) : '—')}
                    </td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                      {loadingAudit ? 'లాగ్స్ లోడ్ అవుతున్నాయి...' : 'ఎటువంటి ఆడిట్ రికార్డులు లేవు.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
