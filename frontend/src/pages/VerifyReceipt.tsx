import React, { useState } from 'react';
import { Search, CheckCircle2, XCircle, ArrowLeft, Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface VerifyResult {
  receipt_number: string;
  date: string;
  donor_name: string;
  amount: number;
  organization: string;
  status: string;
}

export const VerifyReceipt: React.FC = () => {
  const { lang, setLanguage } = useLanguage();
  const [receiptNumber, setReceiptNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptNumber.trim()) return;

    setLoading(true);
    setResult(null);
    setError(false);

    try {
      const res = await fetch(`/api/receipts/verify/${encodeURIComponent(receiptNumber.trim())}`);
      if (!res.ok) {
        throw new Error('Receipt not found');
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 shadow-sm py-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🕉️</span>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-amber-700 tracking-wide uppercase leading-tight">
                {lang === 'te' ? 'దుర్గాభవాని యూత్ — గరువుపాలెం' : 'Durga Bhavani Youth — Garuvupalem'}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {lang === 'te' ? '31వ దేవీ శరన్నవరాత్రి మహోత్సవములు' : '31st Devi Sharannavaratri Mahotsavam'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setLanguage(lang === 'te' ? 'en' : 'te')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg border border-amber-200 transition-colors"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{lang === 'te' ? 'English' : 'తెలుగు'}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-slate-900">
                {lang === 'te' ? 'రసీదు ధృవీకరణ' : 'Receipt Verification'}
              </h2>
              <p className="text-sm text-slate-500">
                {lang === 'te' ? 'రసీదు ప్రామాణికతను ధృవీకరించడానికి రసీదు సంఖ్యను నమోదు చేయండి' : 'Enter your receipt number to verify authenticity'}
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {lang === 'te' ? 'రసీదు సంఖ్య' : 'Receipt Number'}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <input 
                    type="text"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. REC-2026-0001"
                    className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 uppercase"
                  />
                </div>
              </div>
              
              <button 
                type="submit"
                disabled={loading || !receiptNumber.trim()}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-colors shadow-sm"
              >
                {loading ? (lang === 'te' ? 'ధృవీకరిస్తోంది...' : 'Verifying...') : (lang === 'te' ? 'ఇప్పుడే ధృవీకరించండి' : 'Verify Now')}
              </button>
            </form>

            {error && (
              <div className="mt-6 p-5 bg-red-50 border border-red-100 rounded-xl text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="font-bold text-red-800 text-lg">
                  {lang === 'te' ? '❌ రసీదు కనుగొనబడలేదు' : '❌ Receipt Not Found'}
                </h3>
                <p className="text-sm text-red-600">
                  {lang === 'te' 
                    ? 'ఆ సంఖ్యతో సరిపోలే రసీదు లభించలేదు. దయచేసి అక్షరదోషాలను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.'
                    : "We couldn't find a receipt matching that number. Please check for typos and try again."}
                </p>
              </div>
            )}

            {result && (
              <div className="mt-6 p-5 bg-emerald-50 border border-emerald-100 rounded-xl space-y-4">
                <div className="text-center space-y-2 mb-4 border-b border-emerald-200/50 pb-4">
                  <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3 shadow-inner">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-emerald-800 text-lg">
                    {lang === 'te' ? '✅ ధృవీకరించబడింది - ప్రామాణిక రసీదు' : '✅ Verified - Authentic Receipt'}
                  </h3>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center pb-2 border-b border-emerald-100">
                    <span className="text-emerald-700 font-medium">{lang === 'te' ? 'రసీదు సంఖ్య' : 'Receipt No.'}</span>
                    <span className="font-bold text-emerald-900">{result.receipt_number}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-emerald-100">
                    <span className="text-emerald-700 font-medium">{lang === 'te' ? 'తేదీ' : 'Date'}</span>
                    <span className="font-semibold text-emerald-900">
                      {new Date(result.date).toLocaleDateString(lang === 'te' ? 'te-IN' : 'en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-emerald-100">
                    <span className="text-emerald-700 font-medium">{lang === 'te' ? 'దాత పేరు' : 'Donor Name'}</span>
                    <span className="font-semibold text-emerald-900">{result.donor_name}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-emerald-100">
                    <span className="text-emerald-700 font-medium">{lang === 'te' ? 'మొత్తం' : 'Amount'}</span>
                    <span className="font-bold text-emerald-900 text-lg">₹{result.amount.toLocaleString(lang === 'te' ? 'te-IN' : 'en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-700 font-medium">{lang === 'te' ? 'స్థితి' : 'Status'}</span>
                    <span className="uppercase font-bold text-emerald-800 text-xs px-2 py-1 bg-emerald-200/50 rounded-md">
                      {result.status}
                    </span>
                  </div>
                </div>
                
                {result.organization && (
                  <div className="mt-4 pt-3 border-t border-emerald-200/50 text-center">
                    <p className="text-xs text-emerald-600 font-medium uppercase tracking-wider">
                      {result.organization}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-6 text-center">
        <a href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-amber-600 font-medium transition-colors">
          <ArrowLeft className="h-4 w-4" /> {lang === 'te' ? 'ప్రధాన పుటకి తిరిగి వెళ్లండి' : 'Return to Main Site'}
        </a>
      </footer>
    </div>
  );
};
