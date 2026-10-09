import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { AlertCircle, PlusCircle, ArrowRight, Wallet, TrendingUp, TrendingDown } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user, token } = useAuth();
  const { activeEvent } = useEvent();
  const navigate = useNavigate();

  const [todayStats, setTodayStats] = useState({
    collections: 0,
    collectionsCount: 0,
    expenses: 0,
    expensesCount: 0,
    net: 0,
  });

  const [recentReceipts, setRecentReceipts] = useState<any[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [recentDonors, setRecentDonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !activeEvent) return;

    const fetchOpsData = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        // Fetch receipts
        const receiptsRes = await fetch(`/api/receipts?event_id=${activeEvent.id}`, { headers });
        let receipts = [];
        if (receiptsRes.ok) {
          receipts = await receiptsRes.json();
        }

        // Fetch expenses
        const expensesRes = await fetch(`/api/expenses?event_id=${activeEvent.id}`, { headers });
        let expenses = [];
        if (expensesRes.ok) {
          expenses = await expensesRes.json();
        }

        // Fetch donors
        const donorsRes = await fetch(`/api/donors?search=`, { headers });
        let donors = [];
        if (donorsRes.ok) {
          donors = await donorsRes.json();
        }

        // Process Today's Stats
        const todayStr = new Date().toISOString().slice(0, 10);
        
        let tCol = 0;
        let tColCount = 0;
        receipts.forEach((r: any) => {
          const rDate = r.receipt_date ? r.receipt_date.slice(0, 10) : '';
          if (rDate === todayStr && r.status !== 'CANCELLED') {
            tCol += Number(r.amount || 0);
            tColCount++;
          }
        });

        let tExp = 0;
        let tExpCount = 0;
        expenses.forEach((e: any) => {
          const eDate = e.date ? e.date.slice(0, 10) : '';
          if (eDate === todayStr && e.status !== 'CANCELLED') {
            tExp += Number(e.amount || 0);
            tExpCount++;
          }
        });

        setTodayStats({
          collections: tCol,
          collectionsCount: tColCount,
          expenses: tExp,
          expensesCount: tExpCount,
          net: tCol - tExp
        });

        // Sort and slice lists
        setRecentReceipts(receipts.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10));
        setRecentExpenses(expenses.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5));
        setRecentDonors(donors.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 5));

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOpsData();
  }, [token, activeEvent]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  
  const todayDateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const isViewer = user?.role === 'VIEWER';

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* 1. Active Event Context Bar */}
      {!activeEvent ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center gap-3">
          <AlertCircle className="text-red-500 h-5 w-5" />
          <p className="text-red-700 text-sm font-medium">No active event selected. Please select or create an event in the sidebar.</p>
        </div>
      ) : (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded-md flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <p className="text-emerald-800 text-sm font-bold">{activeEvent.name} <span className="font-medium ml-1 text-emerald-600">(Active Operational Context)</span></p>
        </div>
      )}

      {/* 2. Greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {getGreeting()}, {user?.name || 'User'} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">{todayDateStr}</p>
      </div>

      {/* 3. Today's Snapshot */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          Today's Snapshot
        </h2>
        {loading ? (
          <div className="h-24 flex items-center justify-center text-slate-400 text-sm bg-white rounded-xl border border-slate-200 shadow-sm">Loading today's metrics...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium text-xs uppercase tracking-wider">Today's Collections</span>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900">₹{todayStats.collections.toLocaleString('en-IN')}</p>
              <p className="text-xs text-slate-500 font-medium">{todayStats.collectionsCount} receipts</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium text-xs uppercase tracking-wider">Today's Expenses</span>
                <TrendingDown className="h-4 w-4 text-rose-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900">₹{todayStats.expenses.toLocaleString('en-IN')}</p>
              <p className="text-xs text-slate-500 font-medium">{todayStats.expensesCount} bills logged</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium text-xs uppercase tracking-wider">Today's Net</span>
                <Wallet className="h-4 w-4 text-orange-500" />
              </div>
              <p className={`text-2xl font-bold ${todayStats.net >= 0 ? 'text-orange-600' : 'text-rose-600'}`}>
                ₹{todayStats.net.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-slate-500 font-medium">Daily surplus / deficit</p>
            </div>
          </div>
        )}
      </div>

      {/* 4. Quick Actions */}
      {!isViewer && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/receipts?action=create')}
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold py-4 px-6 rounded-xl w-full shadow-sm transition-colors"
          >
            <PlusCircle className="h-6 w-6" /> Issue New Receipt
          </button>
          <button
            onClick={() => navigate('/expenses?action=create')}
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold py-4 px-6 rounded-xl w-full shadow-sm transition-colors"
          >
            <PlusCircle className="h-6 w-6" /> Log New Expense
          </button>
        </div>
      )}

      {/* Lists Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column */}
        <div className="space-y-8">
          {/* 5. Recent Receipts */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800">Recent Receipts</h3>
              <button onClick={() => navigate('/receipts')} className="text-orange-600 hover:text-orange-700 text-xs font-semibold flex items-center gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="overflow-y-auto p-0 flex-1">
              {loading ? (
                <div className="p-4 text-center text-sm text-slate-500">Loading receipts...</div>
              ) : recentReceipts.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">No receipts found.</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-100 hidden md:table-header-group">
                    <tr>
                      <th className="px-4 py-2 font-medium">Receipt No</th>
                      <th className="px-4 py-2 font-medium">Donor</th>
                      <th className="px-4 py-2 font-medium">Amount</th>
                      <th className="px-4 py-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentReceipts.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50 flex flex-col md:table-row py-3 md:py-0 px-4 md:px-0">
                        <td className="md:px-4 md:py-3 font-medium text-slate-900">{r.receipt_number}</td>
                        <td className="md:px-4 md:py-3 text-slate-600 truncate max-w-[120px]">{r.donor_name || r.donor?.name || '-'}</td>
                        <td className="md:px-4 md:py-3 font-semibold text-emerald-600">₹{Number(r.amount).toLocaleString('en-IN')}</td>
                        <td className="md:px-4 md:py-3 text-slate-500 text-xs">{r.receipt_date ? new Date(r.receipt_date).toLocaleDateString('en-IN') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* 6. Recent Expenses */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[184px]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800">Recent Expenses</h3>
              <button onClick={() => navigate('/expenses')} className="text-orange-600 hover:text-orange-700 text-xs font-semibold flex items-center gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="overflow-y-auto p-0 flex-1">
              {loading ? (
                <div className="p-4 text-center text-sm text-slate-500">Loading expenses...</div>
              ) : recentExpenses.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">No expenses found.</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <tbody className="divide-y divide-slate-100">
                    {recentExpenses.map(e => (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900 truncate max-w-[100px]">{e.category}</td>
                        <td className="px-4 py-3 text-slate-600 truncate max-w-[120px]">{e.vendor_name || e.description || '-'}</td>
                        <td className="px-4 py-3 font-semibold text-rose-600">₹{Number(e.amount).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs hidden sm:table-cell">{e.date ? new Date(e.date).toLocaleDateString('en-IN') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* 7. Recent Donors */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[184px]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800">Recent Donors</h3>
              <button onClick={() => navigate('/donors')} className="text-amber-600 hover:text-amber-700 text-xs font-semibold flex items-center gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="overflow-y-auto p-0 flex-1">
              {loading ? (
                <div className="p-4 text-center text-sm text-slate-500">Loading donors...</div>
              ) : recentDonors.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">No donors found.</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <tbody className="divide-y divide-slate-100">
                    {recentDonors.map(d => (
                      <tr key={d.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900 truncate max-w-[120px]">{d.name}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{d.mobile || '-'}</td>
                        <td className="px-4 py-3 font-semibold text-emerald-600">₹{Number(d.total_contribution || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
