import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { 
  HeartHandshake, Wallet, Calendar, ArrowRight, 
  TrendingUp, Plus, Sparkles
} from 'lucide-react';
import { formatFestivalDate } from '../utils/translations';

import { useLanguage } from '../context/LanguageContext';

export const Overview: React.FC = () => {
  const { token } = useAuth();
  const { activeEvent } = useEvent();
  const navigate = useNavigate();
  const { lang, t } = useLanguage();

  const [stats, setStats] = useState({
    totalCollections: 0,
    todayCollections: 0,
    donorsCount: 0,
    todayExpenses: 0,
    totalExpenses: 0,
    netBalance: 0
  });

  const [recentDonations, setRecentDonations] = useState<any[]>([]);
  const [upcomingDays, setUpcomingDays] = useState<any[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !activeEvent) return;

    const fetchOverviewData = async () => {
      setLoading(true);
      try {
        const safeJson = async (res: Response) => {
          if (!res.ok) return [];
          const ct = res.headers.get('content-type') || '';
          if (!ct.includes('application/json')) return [];
          try {
            const data = await res.json();
            return Array.isArray(data) ? data : [];
          } catch {
            return [];
          }
        };

        const reqHeaders = { Authorization: `Bearer ${token}` };

        // 1. Fetch Receipts (Donations)
        const receiptsRes = await fetch(`/api/receipts?event_id=${activeEvent.id}`, { headers: reqHeaders });
        const receipts = await safeJson(receiptsRes);

        // 2. Fetch Expenses
        const expensesRes = await fetch(`/api/expenses?event_id=${activeEvent.id}`, { headers: reqHeaders });
        const expenses = await safeJson(expensesRes);

        // 3. Fetch Donors
        const donorsRes = await fetch(`/api/donors?search=`, { headers: reqHeaders });
        const donors = await safeJson(donorsRes);

        // 4. Fetch Festival Days
        const daysRes = await fetch(`/api/festival-admin/days`, { headers: reqHeaders });
        const daysList = await safeJson(daysRes);

        // Process Calculations
        const todayStr = new Date().toISOString().slice(0, 10);
        let totCol = 0;
        let todayCol = 0;
        receipts.forEach((r: any) => {
          if (r.status !== 'CANCELLED') {
            const amt = Number(r.amount || 0);
            totCol += amt;
            const rDate = r.receipt_date ? r.receipt_date.slice(0, 10) : '';
            if (rDate === todayStr) {
              todayCol += amt;
            }
          }
        });

        let totExp = 0;
        let todayExp = 0;
        expenses.forEach((e: any) => {
          if (e.status !== 'CANCELLED') {
            const amt = Number(e.amount || 0);
            totExp += amt;
            const eDate = e.date ? e.date.slice(0, 10) : '';
            if (eDate === todayStr) {
              todayExp += amt;
            }
          }
        });

        setStats({
          totalCollections: totCol,
          todayCollections: todayCol,
          donorsCount: donors.length > 0 ? donors.length : receipts.length,
          todayExpenses: todayExp,
          totalExpenses: totExp,
          netBalance: totCol - totExp
        });

        // Recent Donations sorted descending
        const sortedDonations = receipts
          .filter(r => r.status !== 'CANCELLED')
          .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
          .slice(0, 6);
        setRecentDonations(sortedDonations);

        // Upcoming Days
        setUpcomingDays(daysList.slice(0, 4));

      } catch (err) {
        console.error('Failed to load overview data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, [token, activeEvent]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
              🌺 {lang === 'te' ? '31వ దేవీ శరన్నవరాత్రులు' : '31st Devi Sharannavaratri'}
            </span>
            <span className="text-xs text-slate-400 font-normal">•</span>
            <span className="text-xs text-slate-500 font-normal">
              {lang === 'te' ? 'గరువుపాలెం గ్రామం' : 'Garuvupalem Village'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-medium text-slate-900 leading-tight">
            {t.portalOverview.title}
          </h1>
          <p className="text-sm text-slate-500 font-normal mt-1">
            {t.portalOverview.subtitle}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate('/donations?action=add')}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs sm:text-sm font-medium shadow-xs shadow-orange-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.portalOverview.btnAddDonation}</span>
          </button>
          <button
            onClick={() => navigate('/expenses')}
            className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 transition-all cursor-pointer"
          >
            <Wallet className="w-4 h-4 text-slate-500" />
            <span>{t.portalOverview.btnLogExpense}</span>
          </button>
          <button
            onClick={() => navigate('/festival-management')}
            className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 transition-all cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>{t.portalOverview.btnManageFestival}</span>
          </button>
        </div>
      </div>

      {/* Financial & Collection Metrics (Consolidated Dashboard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Donations */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">{t.portalOverview.statTotalDonations}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-medium text-slate-900">
            ₹{stats.totalCollections.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {stats.donorsCount} {t.portalDonations.unitDevotees}
          </p>
        </div>

        {/* Today's Donations */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">{t.portalOverview.statTodayDonations}</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-medium text-orange-600">
            ₹{stats.todayCollections.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'te' ? 'నేటి రికార్డు' : 'Today\'s ledger'}
          </p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">{t.portal.expenses}</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-medium text-slate-900">
            ₹{stats.totalExpenses.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'te' ? `నేడు: ₹${stats.todayExpenses.toLocaleString('en-IN')}` : `Today: ₹${stats.todayExpenses.toLocaleString('en-IN')}`}
          </p>
        </div>

        {/* Net Reserve Balance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">{t.portalOverview.statNetBalance}</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-medium ${stats.netBalance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            ₹{stats.netBalance.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'te' ? 'నికర మిగులు' : 'Current reserve'}
          </p>
        </div>
      </div>

      {/* Main Grid: Recent Donations + Festival Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Donations Ledger Preview (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-slate-900">
                {t.portalOverview.recentDonationsTitle}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'te' ? 'భక్తుల నుండి అందిన నూతన విరాళాల జాబితా' : 'Latest records added to donations ledger'}
              </p>
            </div>
            <button
              onClick={() => navigate('/donations')}
              className="text-xs font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
            >
              {t.portalOverview.viewAllDonations}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-medium">
                  <th className="py-2.5 px-3">{t.portalDonations.thDate}</th>
                  <th className="py-2.5 px-3">{t.portalDonations.thDonor}</th>
                  <th className="py-2.5 px-3 text-right">{t.portalDonations.thAmount}</th>
                  <th className="py-2.5 px-3 text-center">{t.portalDonations.thMethod}</th>
                  <th className="py-2.5 px-3 text-center">{t.portalDonations.thStatus}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentDonations.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {formatFestivalDate(item.receipt_date || item.created_at, lang)}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900">
                      <div>
                        <p>{item.donor_name || item.donor?.name || 'Anonymous'}</p>
                        {item.donor_mobile && (
                          <p className="text-xs text-slate-400 font-normal">📱 {item.donor_mobile}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-900 whitespace-nowrap">
                      ₹{Number(item.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-normal">
                        {item.payment_method || 'CASH'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                        {lang === 'te' ? 'నమోదైంది' : 'Recorded'}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentDonations.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                      {t.portalDonations.emptyTitle}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Festival Highlights Card (1 col) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-medium text-slate-900">
                {t.portalOverview.festivalHighlightsTitle}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-medium">
                2026
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              {lang === 'te' 
                ? '10 అక్టోబర్ నుండి 21 అక్టోబర్ 2026 వరకు నవరాత్రుల దినచర్య' 
                : '10 Oct to 21 Oct 2026 12-day festival schedule'}
            </p>

            <div className="space-y-2.5">
              {upcomingDays.map((d: any) => (
                <div key={d.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs text-orange-600 font-medium">
                      {d.day_number === 0 
                        ? (lang === 'te' ? 'ఆగమనం & శోభాయాత్ర' : 'Arrival Procession')
                        : (lang === 'te' ? `రోజు ${d.day_number}` : `Day ${d.day_number}`)
                      } • {formatFestivalDate(d.date, lang)}
                    </p>
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {lang === 'te' ? d.alankaram_name_telugu : (d.alankaram_name_english || d.alankaram_name_telugu)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                    {d.is_published ? (lang === 'te' ? 'ప్రచురితం' : 'Published') : (lang === 'te' ? 'డ్రాఫ్ట్' : 'Draft')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/festival-management')}
            className="w-full mt-4 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{t.portalOverview.btnManageFestival}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
