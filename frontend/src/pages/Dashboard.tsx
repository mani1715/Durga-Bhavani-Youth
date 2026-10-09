import React, { useEffect, useState } from 'react';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, Users, Scale, IndianRupee, RefreshCw, 
  Activity, Wallet, Trophy, Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, Cell, PieChart, Pie, CartesianGrid, Legend
} from 'recharts';

type DateFilter = 'ALL_TIME' | 'LAST_7' | 'LAST_30';

export const Dashboard: React.FC = () => {
  const { activeEvent } = useEvent();
  const { token } = useAuth();
  
  const [metrics, setMetrics] = useState<any>(null);
  const [topDonors, setTopDonors] = useState<any[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL_TIME');

  const fetchAllData = async (showLoadingSpinner = false) => {
    if (!activeEvent || !token) return;
    if (showLoadingSpinner) setLoading(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [summaryRes, donorsRes, catRes] = await Promise.all([
        fetch(`/api/reports/summary?event_id=${activeEvent.id}`, { headers }),
        fetch(`/api/reports/top-donors?event_id=${activeEvent.id}&limit=10`, { headers }),
        fetch(`/api/reports/category-breakdown?event_id=${activeEvent.id}`, { headers })
      ]);

      if (summaryRes.ok) setMetrics(await summaryRes.json());
      if (donorsRes.ok) setTopDonors(await donorsRes.json());
      if (catRes.ok) {
        const catJson = await catRes.json();
        const list = Array.isArray(catJson) ? catJson : (catJson.donations || []);
        setCategoryBreakdown(list);
      }

    } catch (e) {
      console.error("Failed to fetch analytics data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData(true);
  }, [activeEvent, token]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllData(false);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-slate-500 text-sm">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading analytics data...
      </div>
    );
  }

  // Filter daily breakdown data based on dateFilter
  const filterByDateRange = (dataList: any[]) => {
    if (dateFilter === 'ALL_TIME' || !dataList) return dataList || [];
    
    const today = new Date();
    const daysToSubtract = dateFilter === 'LAST_7' ? 7 : 30;
    const cutoffDate = new Date(today.getTime() - (daysToSubtract * 24 * 60 * 60 * 1000));
    const cutoffStr = cutoffDate.toISOString().slice(0, 10);
    
    return dataList.filter(item => item.date >= cutoffStr);
  };

  const filteredDailyBreakdown = filterByDateRange(metrics.daily_breakdown);
  const filteredDailyExpenses = filterByDateRange(metrics.daily_expenses);

  // Format data for Collection Trends Chart
  const collectionTrendsData = filteredDailyBreakdown.map((item: any) => ({
    displayDate: new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    date: item.date,
    Collections: Number(item.amount || 0)
  })).sort((a, b) => a.date.localeCompare(b.date));

  // Format data for Expense Trends Chart
  const expenseTrendsData = filteredDailyExpenses.map((item: any) => ({
    displayDate: new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    date: item.date,
    Expenses: Number(item.amount || 0)
  })).sort((a, b) => a.date.localeCompare(b.date));

  // Payment Breakdown
  const paymentData = Object.entries(metrics.payment_breakdown || {}).map(([key, val]) => ({
    name: key,
    value: Number(val)
  }));
  const PAYMENT_COLORS = ['#f97316', '#f59e0b', '#10b981', '#ea580c', '#fb923c'];

  // Category Analytics
  const categoryData = (Array.isArray(categoryBreakdown) ? categoryBreakdown : []).map(item => ({
    name: item.category_name || item.category || 'General',
    value: Number(item.total_amount || 0)
  }));

  // Monthly Comparison Table Data
  const monthlyMap: Record<string, { month: string; collections: number; expenses: number; net: number }> = {};
  (metrics.daily_breakdown || []).forEach((item: any) => {
    const monthKey = item.date.slice(0, 7); // YYYY-MM
    if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { month: monthKey, collections: 0, expenses: 0, net: 0 };
    monthlyMap[monthKey].collections += Number(item.amount || 0);
  });
  (metrics.daily_expenses || []).forEach((item: any) => {
    const monthKey = item.date.slice(0, 7);
    if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { month: monthKey, collections: 0, expenses: 0, net: 0 };
    monthlyMap[monthKey].expenses += Number(item.amount || 0);
  });
  const monthlyTableData = Object.values(monthlyMap).map(m => {
    m.net = m.collections - m.expenses;
    const dateObj = new Date(m.month + '-01');
    return {
      ...m,
      displayMonth: dateObj.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    };
  }).sort((a, b) => b.month.localeCompare(a.month));


  const totalNet = Number(metrics.total_collections || 0) - Number(metrics.total_expenses || 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* 1. Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-amber-600" /> Analytics Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">Comprehensive financial insights for {activeEvent?.name}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-full sm:w-auto">
            <button 
              onClick={() => setDateFilter('ALL_TIME')}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${dateFilter === 'ALL_TIME' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              All Time
            </button>
            <button 
              onClick={() => setDateFilter('LAST_30')}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${dateFilter === 'LAST_30' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              Last 30 Days
            </button>
            <button 
              onClick={() => setDateFilter('LAST_7')}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${dateFilter === 'LAST_7' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              Last 7 Days
            </button>
          </div>
          <button 
            onClick={handleManualRefresh} 
            className="flex items-center justify-center gap-2 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors w-full sm:w-auto shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* 2. KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Collections</p>
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><IndianRupee className="h-4 w-4" /></div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900">₹{Number(metrics.total_collections || 0).toLocaleString('en-IN')}</h3>
          <p className="text-xs text-slate-500">Lifetime collections</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Expenses</p>
            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg"><Scale className="h-4 w-4" /></div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900">₹{Number(metrics.total_expenses || 0).toLocaleString('en-IN')}</h3>
          <p className="text-xs text-slate-500">Lifetime expenses</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Balance</p>
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Wallet className="h-4 w-4" /></div>
          </div>
          <h3 className={`text-2xl font-extrabold ${totalNet >= 0 ? 'text-orange-600' : 'text-rose-600'}`}>
            ₹{totalNet.toLocaleString('en-IN')}
          </h3>
          <p className="text-xs text-slate-500">Available cash reserve</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Donors</p>
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Users className="h-4 w-4" /></div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900">{metrics.total_donors || 0}</h3>
          <p className="text-xs text-slate-500">Unique contributors</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 3. Collection Trends */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" /> Collection Trends
          </h3>
          <div className="h-72 w-full">
            {collectionTrendsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={collectionTrendsData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="displayDate" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Collections']}
                  />
                  <Bar dataKey="Collections" fill="#d97706" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No collection data for selected period.</div>
            )}
          </div>
        </div>

        {/* 4. Expense Trends */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-rose-500 rotate-180" /> Expense Trends
          </h3>
          <div className="h-72 w-full">
            {expenseTrendsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseTrendsData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="displayDate" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Expenses']}
                  />
                  <Bar dataKey="Expenses" fill="#e11d48" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No expense data for selected period.</div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Payment Method Breakdown */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6">Payment Method Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-64 w-full">
            {paymentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                    {paymentData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No payment data available.</div>
            )}
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {paymentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => `₹${Number(val).toLocaleString('en-IN')}`} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 6. Category Analytics */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">Donation Categories</h3>
          <div className="h-72 w-full">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                  />
                  <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No category data available.</div>
            )}
          </div>
        </div>

        {/* 7. Top 10 Donors Leaderboard */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" /> Top 10 Donors
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 font-medium">Rank</th>
                  <th className="px-6 py-3 font-medium">Donor Name</th>
                  <th className="px-6 py-3 font-medium text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topDonors.length > 0 ? topDonors.map((donor, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold
                        ${idx === 0 ? 'bg-amber-100 text-amber-700' : 
                          idx === 1 ? 'bg-slate-200 text-slate-700' : 
                          idx === 2 ? 'bg-orange-100 text-orange-800' : 'text-slate-500'}`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-900">{donor.name}</td>
                    <td className="px-6 py-3 font-bold text-emerald-600 text-right">₹{Number(donor.total_amount).toLocaleString('en-IN')}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-400">No donor data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 8. Monthly Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-slate-500" /> Monthly Financial Comparison
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50">
              <tr>
                <th className="px-6 py-3 font-medium">Month</th>
                <th className="px-6 py-3 font-medium text-right">Collections</th>
                <th className="px-6 py-3 font-medium text-right">Expenses</th>
                <th className="px-6 py-3 font-medium text-right">Net Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyTableData.length > 0 ? monthlyTableData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{row.displayMonth}</td>
                  <td className="px-6 py-4 text-emerald-600 font-semibold text-right">₹{row.collections.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 text-rose-600 font-semibold text-right">₹{row.expenses.toLocaleString('en-IN')}</td>
                  <td className={`px-6 py-4 font-bold text-right ${row.net >= 0 ? 'text-orange-600' : 'text-rose-600'}`}>
                    ₹{row.net.toLocaleString('en-IN')}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">No monthly data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
