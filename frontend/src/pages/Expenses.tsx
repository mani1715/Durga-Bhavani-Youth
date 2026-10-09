import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { Plus, Eye, Trash2, Search, Camera, Image, X } from 'lucide-react';
import { formatFestivalDate } from '../utils/translations';

import { useLanguage } from '../context/LanguageContext';

export const Expenses: React.FC = () => {
  const { token, user } = useAuth();
  const { activeEvent } = useEvent();
  const { lang } = useLanguage();

  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);
  const [search, setSearch] = useState('');

  // Form State
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCatInput, setShowCatInput] = useState(false);
  const [receiptImage, setReceiptImage] = useState('');

  // Dual File Inputs for Camera vs Gallery / Drive
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const fetchExpenses = async () => {
    if (!activeEvent) return;
    setLoading(true);

    let apiExpenses: any[] = [];
    if (token) {
      try {
        const res = await fetch(`/api/expenses?event_id=${activeEvent.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          apiExpenses = await res.json();
        }
      } catch (e) {}
    }

    const localExpStr = localStorage.getItem(`expenses_${activeEvent.id}`);
    const localExpenses: any[] = localExpStr ? JSON.parse(localExpStr) : [];

    const mergedMap = new Map<string, any>();
    for (const e of apiExpenses) {
      mergedMap.set(e.id, e);
    }
    for (const le of localExpenses) {
      if (!mergedMap.has(le.id)) {
        mergedMap.set(le.id, le);
      }
    }

    const list = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime()
    );
    setExpenses(list);
    setLoading(false);
  };

  const fetchCategories = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/settings/expense-categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data = await res.json();
          setCategories(Array.isArray(data) ? data : []);
          if (data.length > 0) {
            setCategoryId((prev) => prev || data[0].id);
          }
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, [activeEvent, token]);

  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const handleFileSelect = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setReceiptImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch(`/api/settings/expense-categories?name=${encodeURIComponent(newCategoryName.trim())}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const cat = await res.json();
        setCategories([...categories, cat]);
        setCategoryId(cat.id);
        setNewCategoryName('');
        setShowCatInput(false);
      }
    } catch (e) {}
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      return alert(lang === 'te' ? 'దయచేసి సరైన మొత్తాన్ని నమోదు చేయండి' : 'Please enter valid amount');
    }
    if (!vendorName.trim()) {
      return alert(lang === 'te' ? 'దయచేసి వ్యాపారి లేదా దుకాణం పేరు నమోదు చేయండి' : 'Please enter vendor name');
    }

    const effectiveEventId = activeEvent?.id;
    if (!effectiveEventId) {
      return alert(lang === 'te' ? 'ఉత్సవ ఈవెంట్ అందుబాటులో లేదు. దయచేసి పేజీని రీఫ్రెష్ చేయండి.' : 'No active festival event found. Please refresh.');
    }

    const effectiveCatId = categoryId || (categories.length > 0 ? categories[0].id : '');
    if (!effectiveCatId) {
      return alert(lang === 'te' ? 'దయచేసి ఖర్చు వర్గాన్ని ఎంచుకోండి లేదా కొత్త వర్గాన్ని జోడించండి' : 'Please select or add an expense category');
    }

    const payload = {
      event_id: effectiveEventId,
      amount: parseFloat(amount),
      vendor_name: vendorName.trim(),
      description: description.trim(),
      category_id: effectiveCatId,
      payment_method: paymentMethod,
      date: expenseDate,
      receipt_image: receiptImage || null
    };

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || (lang === 'te' ? 'ఖర్చు నమోదు విఫలమైంది' : 'Failed to record expense'));
      }

      setCreateModal(false);
      setAmount('');
      setVendorName('');
      setDescription('');
      setReceiptImage('');
      fetchExpenses();
    } catch (err: any) {
      alert(err.message || (lang === 'te' ? 'ఖర్చు నమోదు చేయడంలో లోపం సంభవించింది' : 'Error recording expense'));
    }
  };

  const handleCancelExpense = async (id: string) => {
    const confirmMsg = lang === 'te' ? 'ఈ ఖర్చును రద్దు చేయాలనుకుంటున్నారా?' : 'Are you sure you want to void this expense?';
    if (!confirm(confirmMsg)) return;
    try {
      const res = await fetch(`/api/expenses/${id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchExpenses();
      }
    } catch (e) {}
  };

  const handleDeleteExpense = async (id: string, expNo?: string) => {
    const confirmMsg = lang === 'te'
      ? `${expNo ? `${expNo} ` : ''}ఖర్చు రికార్డును శాశ్వతంగా తొలగించాలనుకుంటున్నారా?`
      : `Are you sure you want to permanently delete expense ${expNo || ''}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        if (selectedExpense?.id === id) {
          setSelectedExpense(null);
        }
        fetchExpenses();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || (lang === 'te' ? 'ఖర్చును తొలగించలేకపోయాము.' : 'Failed to delete expense'));
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting expense');
    }
  };

  const openExpenseDetailsModal = async (item: any) => {
    setSelectedExpense(item);
    if (!item.receipt_image && token) {
      try {
        const res = await fetch(`/api/expenses/${item.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const detail = await res.json();
          setSelectedExpense(detail);
        }
      } catch (e) {}
    }
  };

  const getCategoryName = (catId: string) => {
    const c = categories.find(cat => cat.id === catId);
    return c ? c.name : 'General Expense';
  };

  const filteredExpenses = expenses.filter(item => {
    if (!search || search.trim() === '') return true;
    const q = search.toLowerCase();
    const vendor = (item.vendor_name || '').toLowerCase();
    const desc = (item.description || '').toLowerCase();
    const expNum = (item.expense_number || '').toLowerCase();
    const cat = getCategoryName(item.category_id).toLowerCase();
    return vendor.includes(q) || desc.includes(q) || expNum.includes(q) || cat.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium text-slate-900 leading-tight">
            {lang === 'te' ? 'ఖర్చుల నిర్వహణ (Expenses)' : 'Expense Registry'}
          </h1>
          <p className="text-sm text-slate-500 font-normal mt-1">
            {lang === 'te' 
              ? 'ఉత్సవ కొనుగోళ్లు, అలంకరణ బిల్లులు మరియు ఇతర ఖర్చుల రికార్డు.' 
              : 'Record outgoing invoices, vendor bills & festival purchases.'}
          </p>
        </div>

        <button
          onClick={() => setCreateModal(true)}
          className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium shadow-xs shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'te' ? 'నూతన ఖర్చు నమోదు (+)' : 'Record New Expense'}</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={lang === 'te' ? 'ఖర్చు సంఖ్య, వ్యాపారి పేరు లేదా వివరణ ద్వారా శోధించండి...' : 'Search by vendor, expense number, or description...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none text-slate-900 placeholder-slate-400 font-normal"
          />
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <th className="py-3 px-4">తేదీ (Date)</th>
                <th className="py-3 px-4">ఖర్చు నంబర్</th>
                <th className="py-3 px-4">వ్యాపారి & వివరణ</th>
                <th className="py-3 px-4">వర్గం (Category)</th>
                <th className="py-3 px-4 text-right">మొత్తం (₹)</th>
                <th className="py-3 px-4 text-center">విధానం</th>
                <th className="py-3 px-4 text-center">స్థితి</th>
                <th className="py-3 px-4 text-right">చర్యలు</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredExpenses.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                    {formatFestivalDate(item.date, lang)}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                    {item.expense_number}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-medium text-slate-900">{item.vendor_name || 'N/A'}</p>
                    {item.description && (
                      <p className="text-xs text-slate-400 truncate max-w-xs">{item.description}</p>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-normal">
                      {getCategoryName(item.category_id)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-rose-600 whitespace-nowrap">
                    ₹{Number(item.amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs">
                      {item.payment_method}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      item.status === 'RECORDED' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openExpenseDetailsModal(item)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title={lang === 'te' ? 'వివరాలు చూడండి' : 'View Details'}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {item.status === 'RECORDED' && (user?.role === 'SUPER_ADMIN' || user?.role === 'ORG_ADMIN') && (
                        <button
                          onClick={() => handleCancelExpense(item.id)}
                          className="px-2 py-1 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                          title={lang === 'te' ? 'ఖర్చును రద్దు చేయండి' : 'Void'}
                        >
                          Void
                        </button>
                      )}
                      {(user?.role === 'SUPER_ADMIN' || user?.role === 'ORG_ADMIN') && (
                        <button
                          onClick={() => handleDeleteExpense(item.id, item.expense_number)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title={lang === 'te' ? 'ఖర్చును తొలగించండి' : 'Delete Expense'}
                          aria-label="delete-expense-btn"
                          data-testid="delete-expense-btn"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 text-sm">
                    {lang === 'te' ? 'ఇంతవరకు ఎటువంటి ఖర్చులు నమోదు కాలేదు.' : 'No registered expenses found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE EXPENSE MODAL */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xl font-medium text-slate-900">
                {lang === 'te' ? 'నూతన ఖర్చు నమోదు' : 'Record New Expense'}
              </h3>
              <button onClick={() => setCreateModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                    ఖర్చు తేదీ *
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                    మొత్తం (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 2500"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                  వ్యాపారి / దుకాణం పేరు *
                </label>
                <input
                  type="text"
                  required
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="e.g. పూల డెకరేటర్ / మైక్ సెట్ / ఎలక్ట్రికల్స్"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-slate-700 uppercase tracking-wider">ఖర్చు వర్గం</label>
                    <button type="button" onClick={() => setShowCatInput(!showCatInput)} className="text-[11px] text-orange-600 hover:underline">
                      {showCatInput ? 'ఎంచుకోండి' : '+ కొత్తది'}
                    </button>
                  </div>
                  {showCatInput ? (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="కొత్త వర్గం"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                      />
                      <button type="button" onClick={handleAddCategory} className="px-3 bg-orange-600 text-white rounded-xl text-xs font-medium">Add</button>
                    </div>
                  ) : (
                    <select
                      value={categoryId || (categories.length > 0 ? categories[0].id : '')}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none cursor-pointer"
                    >
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                    చెల్లింపు విధానం
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none cursor-pointer"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                  వివరణ / గమనికలు
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ఖర్చుకు సంబంధించిన వివరాలు..."
                  className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none"
                />
              </div>

              {/* Attach Bill Photo */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="block text-xs font-medium text-slate-700 flex items-center justify-between">
                  <span>బిల్లు / రసీదు ఫోటో జతచేయండి</span>
                  <span className="text-[10px] text-slate-400">ఐచ్ఛికం (Optional)</span>
                </label>

                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={(e) => handleFileSelect(e.target.files?.[0])} className="hidden" />
                <input ref={galleryInputRef} type="file" accept="image/*,.pdf" onChange={(e) => handleFileSelect(e.target.files?.[0])} className="hidden" />

                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => cameraInputRef.current?.click()} className="py-2 px-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer">
                    <Camera className="w-3.5 h-3.5 text-orange-600" /> కెమెరా (Camera)
                  </button>
                  <button type="button" onClick={() => galleryInputRef.current?.click()} className="py-2 px-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer">
                    <Image className="w-3.5 h-3.5 text-orange-600" /> గ్యాలరీ (Gallery)
                  </button>
                </div>

                {receiptImage && (
                  <div className="relative w-full h-28 rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
                    <img src={receiptImage} alt="Preview" className="w-full h-full object-contain" />
                    <button type="button" onClick={() => setReceiptImage('')} className="absolute top-1.5 right-1.5 bg-rose-600 text-white p-1 rounded-lg text-xs cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setCreateModal(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 cursor-pointer">
                  రద్దు చేయండి
                </button>
                <button type="submit" className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium transition-colors shadow-xs shadow-orange-500/20 cursor-pointer">
                  నమోదు చేయండి
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono text-slate-400">{selectedExpense.expense_number}</span>
                <h3 className="text-xl font-medium text-slate-900">ఖర్చు వివరాలు</h3>
              </div>
              <button onClick={() => setSelectedExpense(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-center">
                <span className="text-xs uppercase text-rose-700 font-medium">చెల్లించిన మొత్తం</span>
                <p className="text-3xl font-medium text-rose-700 mt-0.5">
                  ₹{Number(selectedExpense.amount || 0).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 text-xs">
                <div>
                  <span className="text-slate-400">వ్యాపారి:</span>
                  <p className="font-medium text-slate-900 text-sm">{selectedExpense.vendor_name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400">తేదీ:</span>
                  <p className="font-medium text-slate-900 text-sm">{formatFestivalDate(selectedExpense.date, lang)}</p>
                </div>
                <div className="mt-2">
                  <span className="text-slate-400">వర్గం:</span>
                  <p className="font-medium text-slate-900 text-sm">{getCategoryName(selectedExpense.category_id)}</p>
                </div>
                <div className="mt-2">
                  <span className="text-slate-400">విధానం:</span>
                  <p className="font-medium text-slate-900 text-sm">{selectedExpense.payment_method}</p>
                </div>
              </div>

              {selectedExpense.description && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                  <span className="text-slate-400 block mb-0.5">వివరణ:</span>
                  {selectedExpense.description}
                </div>
              )}

              {selectedExpense.receipt_image && (
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-medium">బిల్లు ఫోటో:</span>
                  <div className="max-h-56 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center p-1">
                    <img src={selectedExpense.receipt_image} alt="Bill attachment" className="max-h-52 object-contain rounded-lg" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              {(user?.role === 'SUPER_ADMIN' || user?.role === 'ORG_ADMIN') && (
                <button
                  type="button"
                  onClick={() => handleDeleteExpense(selectedExpense.id, selectedExpense.expense_number)}
                  className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{lang === 'te' ? 'తొలగించు (Delete)' : 'Delete Expense'}</span>
                </button>
              )}
              <button
                onClick={() => setSelectedExpense(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors cursor-pointer"
              >
                {lang === 'te' ? 'ముగించు (Close)' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
