import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { 
  HeartHandshake, Plus, Search, Eye, Edit2, Trash2, Ban, 
  Users, CheckCircle2, X, Calendar, Package
} from 'lucide-react';
import { formatFestivalDate } from '../utils/translations';

import { useLanguage } from '../context/LanguageContext';

export const Donations: React.FC = () => {
  const { token, user } = useAuth();
  const { activeEvent } = useEvent();
  const [searchParams] = useSearchParams();
  const { lang, t } = useLanguage();

  // View tabs: 'LEDGER' | 'MATERIALS' | 'CATEGORIES' | 'DONORS'
  const [activeTab, setActiveTab] = useState<'LEDGER' | 'MATERIALS' | 'CATEGORIES' | 'DONORS'>(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'materials') return 'MATERIALS';
    if (tabParam === 'categories') return 'CATEGORIES';
    if (tabParam === 'donors') return 'DONORS';
    return 'LEDGER';
  });

  // Data states
  const [donations, setDonations] = useState<any[]>([]);
  const [materialsList, setMaterialsList] = useState<any[]>([]);
  const [donorsList, setDonorsList] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [_loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Ledger Filters & Sorting
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ISSUED' | 'CANCELLED'>('ALL');
  const [ledgerCategoryFilter, setLedgerCategoryFilter] = useState<string>('ALL');
  const [ledgerSort, setLedgerSort] = useState<'highest' | 'newest'>('highest');

  // Modals for Monetary Donations
  const [addModal, setAddModal] = useState(false);
  const [detailModal, setDetailModal] = useState<any | null>(null);
  const [editModal, setEditModal] = useState<any | null>(null);
  const [cancelModal, setCancelModal] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Form State for Monetary Donation with Bilingual Donor Names
  const [donorName, setDonorName] = useState('');
  const [donorNameEnglish, setDonorNameEnglish] = useState('');
  const [donorNameTelugu, setDonorNameTelugu] = useState('');
  const [villageEnglish, setVillageEnglish] = useState('Garuvupalem');
  const [villageTelugu, setVillageTelugu] = useState('గరువుపాలెం');
  const [isTeluguManuallyEdited, setIsTeluguManuallyEdited] = useState(false);
  const [isTransliterating, setIsTransliterating] = useState(false);
  const [transliterationSuggestions, setTransliterationSuggestions] = useState<string[]>([]);
  const [addFormError, setAddFormError] = useState<string | null>(null);

  // Inline Category Creator inside Contribution Form
  const [showInlineAddCategory, setShowInlineAddCategory] = useState(false);
  const [inlineCategoryTelugu, setInlineCategoryTelugu] = useState('');
  const [inlineCategoryEnglish, setInlineCategoryEnglish] = useState('');
  const [inlineCategoryLoading, setInlineCategoryLoading] = useState(false);

  const [amount, setAmount] = useState('');
  const [receivedDate, setReceivedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [village, setVillage] = useState('Garuvupalem');
  const [donorMobile, setDonorMobile] = useState('');
  const [notes, setNotes] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // Modals & Form State for Material Contributions
  const [addMaterialModal, setAddMaterialModal] = useState(false);
  const [editMaterialModal, setEditMaterialModal] = useState<any | null>(null);
  const [materialForm, setMaterialForm] = useState({
    donor_name: '',
    phone: '',
    donation_category_id: '',
    item_description: '',
    item_description_telugu: '',
    quantity: '',
    unit: '',
    estimated_value: '',
    notes: '',
    is_published: true
  });

  // Modals & Form State for Categories
  const [addCategoryModal, setAddCategoryModal] = useState(false);
  const [editCategoryModal, setEditCategoryModal] = useState<any | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    name_telugu: '',
    name_english: '',
    display_order: 1,
    description: '',
    is_active: true
  });

  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Auto-trigger add modal if ?action=add in URL
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setAddModal(true);
    }
  }, [searchParams]);

  // Fetch Donations, Materials & Categories
  const fetchDonations = async () => {
    if (!activeEvent || !token) return;
    setLoading(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch Receipts (Donations) with sort
      let rcptUrl = `/api/receipts?event_id=${activeEvent.id}&sort=${ledgerSort}&search=${encodeURIComponent(search)}`;
      if (ledgerCategoryFilter !== 'ALL') rcptUrl += `&category_id=${encodeURIComponent(ledgerCategoryFilter)}`;

      const res = await fetch(rcptUrl, { headers });
      if (res.ok) {
        const data = await res.json();
        setDonations(Array.isArray(data) ? data : []);
      }

      // 2. Fetch Donors
      const donorsRes = await fetch(`/api/donors?search=${encodeURIComponent(search)}`, { headers });
      if (donorsRes.ok) {
        const donorsData = await donorsRes.json();
        setDonorsList(Array.isArray(donorsData) ? donorsData : []);
      }

      // 3. Fetch Categories (include_inactive for committee)
      const catRes = await fetch('/api/settings/donation-categories?include_inactive=true', { headers });
      if (catRes.ok) {
        const cats = await catRes.json();
        setCategories(cats);
        if (cats.length > 0 && !categoryId) setCategoryId(cats[0].id);
      }

      // 4. Fetch Materials
      const matRes = await fetch(`/api/material-contributions?search=${encodeURIComponent(search)}`, { headers });
      if (matRes.ok) {
        const mats = await matRes.json();
        setMaterialsList(Array.isArray(mats) ? mats : []);
      }
    } catch (err) {
      console.error('Error fetching donations data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [activeEvent, token, search, ledgerSort, ledgerCategoryFilter]);

  // Metrics computation
  const todayStr = new Date().toISOString().slice(0, 10);
  let totalReceived = 0;
  let todayReceived = 0;
  donations.forEach(d => {
    if (d.status !== 'CANCELLED') {
      const amt = Number(d.amount || 0);
      totalReceived += amt;
      const dDate = d.receipt_date ? d.receipt_date.slice(0, 10) : '';
      if (dDate === todayStr) {
        todayReceived += amt;
      }
    }
  });

  const totalDonorsCount = donorsList.length > 0 ? donorsList.length : donations.filter(d => d.status !== 'CANCELLED').length;
  const totalMaterialsCount = materialsList.length;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Debounced Transliteration for English Donor Name
  useEffect(() => {
    if (!addModal || isTeluguManuallyEdited) return;
    const trimmed = donorNameEnglish.trim();
    if (!trimmed) {
      if (!isTeluguManuallyEdited) setDonorNameTelugu('');
      return;
    }

    const timer = setTimeout(async () => {
      setIsTransliterating(true);
      try {
        const res = await fetch('/api/donors/transliterate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ text: trimmed })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.primary_suggestion && !isTeluguManuallyEdited) {
            setDonorNameTelugu(data.primary_suggestion);
            setTransliterationSuggestions(data.suggestions || []);
          }
        }
      } catch {
        // Graceful fallback: user types manually
      } finally {
        setIsTransliterating(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [donorNameEnglish, addModal, isTeluguManuallyEdited, token]);

  const handleRegenerateSuggestion = async () => {
    const trimmed = donorNameEnglish.trim();
    if (!trimmed) return;
    setIsTransliterating(true);
    try {
      const res = await fetch('/api/donors/transliterate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: trimmed })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.primary_suggestion) {
          setDonorNameTelugu(data.primary_suggestion);
          setIsTeluguManuallyEdited(false);
          setTransliterationSuggestions(data.suggestions || []);
        }
      }
    } catch {
      // offline fallback
    } finally {
      setIsTransliterating(false);
    }
  };

  const handleSaveInlineCategory = async () => {
    const teName = inlineCategoryTelugu.trim();
    const enName = inlineCategoryEnglish.trim();
    if (!teName && !enName) {
      alert(lang === 'te' ? 'దయచేసి వర్గం పేరును నమోదు చేయండి' : 'Please enter category name');
      return;
    }

    setInlineCategoryLoading(true);
    try {
      const catPayload = {
        name: teName || enName,
        name_telugu: teName || enName,
        name_english: enName || teName,
        display_order: categories.length + 1,
        description: 'Created inside contribution form',
        is_active: true
      };

      const res = await fetch('/api/settings/donation-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(catPayload)
      });

      if (res.ok) {
        const newCat = await res.json();
        setCategories(prev => [...prev, newCat]);
        setCategoryId(newCat.id);
        setShowInlineAddCategory(false);
        setInlineCategoryTelugu('');
        setInlineCategoryEnglish('');
        showToast(lang === 'te' ? 'నూతన విభాగం విజయవంతంగా చేర్చబడింది!' : 'Category added successfully!');
      } else {
        const errText = await res.text();
        alert(lang === 'te' ? `విభాగం నమోదులో లోపం: ${errText}` : `Error adding category: ${errText}`);
      }
    } catch (e: any) {
      alert(e.message || 'Error connecting to server');
    } finally {
      setInlineCategoryLoading(false);
    }
  };

  // Handle Add Monetary Donation with Resilient Response Handling & Idempotency
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddFormError(null);

    if (!amount || Number(amount) <= 0) {
      setAddFormError(lang === 'te' ? 'దయచేసి సరైన మొత్తాన్ని నమోదు చేయండి.' : 'Please enter a valid amount.');
      return;
    }

    const finalTelugu = donorNameTelugu.trim();
    const finalEnglish = donorNameEnglish.trim();
    if (!finalTelugu && !finalEnglish) {
      setAddFormError(lang === 'te' ? 'దయచేసి దాత పేరును నమోదు చేయండి.' : 'Please enter donor name.');
      return;
    }

    setSubmitting(true);
    try {
      const idempotencyKey = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const payload = {
        event_id: activeEvent?.id,
        donor_name: finalTelugu || finalEnglish,
        donor_name_english: finalEnglish || finalTelugu,
        donor_name_telugu: finalTelugu || finalEnglish,
        village_english: villageEnglish.trim(),
        village_telugu: villageTelugu.trim(),
        donor_mobile: donorMobile.trim(),
        donor_address: villageTelugu.trim() || villageEnglish.trim(),
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        receipt_date: receivedDate,
        donation_category_id: categoryId || (categories[0]?.id || null),
        notes: notes.trim(),
        idempotency_key: idempotencyKey,
        is_anonymous: isAnonymous,
        is_test: false,
        custom_values: {
          is_anonymous: isAnonymous,
          village: villageTelugu.trim() || villageEnglish.trim()
        }
      };

      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let errMsg = '';
        try {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const errJson = await res.json();
            errMsg = typeof errJson.detail === 'string' ? errJson.detail : (errJson.detail?.message || errJson.message || 'విరాళం నమోదు ప్రక్రియలో లోపం ఏర్పడింది.');
          } else {
            const rawText = await res.text();
            errMsg = rawText.slice(0, 150) || `సర్వర్ లోపం (${res.status})`;
          }
        } catch {
          errMsg = `సర్వర్ నుండి చెల్లని ప్రతిస్పందన వచ్చింది (${res.status})`;
        }
        setAddFormError(errMsg);
        return;
      }

      // 100% Confirmed Success: Close modal and reset fields
      setAddModal(false);
      setDonorName('');
      setDonorNameEnglish('');
      setDonorNameTelugu('');
      setIsTeluguManuallyEdited(false);
      setAmount('');
      setDonorMobile('');
      setNotes('');
      setIsAnonymous(false);
      setAddFormError(null);
      showToast(lang === 'te' ? 'విరాళం విజయవంతంగా నమోదైంది!' : 'Donation recorded successfully!');
      fetchDonations();
    } catch (err: any) {
      setAddFormError(err.message || 'నెట్‌వర్క్ కనెక్షన్ లోపం ఏర్పడింది.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit Monetary Donation
  const openEditModal = (item: any) => {
    setEditModal(item);
    setDonorName(item.donor_name || item.donor?.name || '');
    setAmount(item.amount?.toString() || '');
    setReceivedDate(item.receipt_date ? item.receipt_date.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setPaymentMethod(item.payment_method || 'CASH');
    setDonorMobile(item.donor_mobile || item.donor?.mobile || '');
    setVillage(item.custom_values?.village || item.donor_address || 'Garuvupalem');
    setNotes(item.notes || '');
    setCategoryId(item.donation_category_id || (categories[0]?.id || ''));
    setIsAnonymous(item.custom_values?.is_anonymous || item.is_anonymous || false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    if (!amount || Number(amount) <= 0) return alert('Please enter a valid amount');
    if (!donorName.trim()) return alert('Please enter donor name');

    setSubmitting(true);
    try {
      const res = await fetch(`/api/receipts/${editModal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          donor_name: donorName,
          donor_mobile: donorMobile,
          donation_category_id: categoryId,
          payment_method: paymentMethod,
          notes: notes,
          custom_values: {
            is_anonymous: isAnonymous,
            village: village
          }
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update donation');
      }

      setEditModal(null);
      showToast(lang === 'te' ? 'విరాళ వివరాలు నవీకరించబడ్డాయి!' : 'Donation updated successfully!');
      fetchDonations();
    } catch (err: any) {
      alert(err.message || 'Error updating donation');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Cancel / Void Donation
  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModal) return;
    if (!cancelReason.trim()) return alert('Please enter cancellation reason');

    try {
      const res = await fetch(`/api/receipts/${cancelModal.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: cancelReason })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Unable to cancel donation');
      }

      setCancelModal(null);
      setCancelReason('');
      showToast(lang === 'te' ? 'విరాళం రద్దు చేయబడింది.' : 'Donation marked as void.');
      fetchDonations();
    } catch (err: any) {
      alert(err.message || 'Error cancelling donation');
    }
  };

  // Handle Delete Donation
  const handleDeleteDonation = async (id: string, refNo: string) => {
    if (!window.confirm(`Are you sure you want to delete donation ${refNo}? This action is irreversible.`)) return;

    try {
      const res = await fetch(`/api/receipts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      showToast(lang === 'te' ? 'విరాళ రికార్డు తొలగించబడింది.' : 'Donation deleted.');
      fetchDonations();
    } catch (err) {
      alert('Error deleting donation');
    }
  };

  // Material Contributions Handlers
  const openAddMaterial = () => {
    setEditMaterialModal(null);
    setMaterialForm({
      donor_name: '',
      phone: '',
      donation_category_id: categories[0]?.id || '',
      item_description: '',
      item_description_telugu: '',
      quantity: '',
      unit: 'Units',
      estimated_value: '',
      notes: '',
      is_published: true
    });
    setAddMaterialModal(true);
  };

  const openEditMaterial = (item: any) => {
    setEditMaterialModal(item);
    setMaterialForm({
      donor_name: item.donor_name || '',
      phone: item.phone || '',
      donation_category_id: item.donation_category_id || (categories[0]?.id || ''),
      item_description: item.item_description || '',
      item_description_telugu: item.item_description_telugu || '',
      quantity: item.quantity || '',
      unit: item.unit || 'Units',
      estimated_value: item.estimated_value ? item.estimated_value.toString() : '',
      notes: item.notes || '',
      is_published: item.is_published ?? true
    });
    setAddMaterialModal(true);
  };

  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialForm.donor_name.trim()) return alert('Please enter donor name');
    if (!materialForm.item_description.trim()) return alert('Please enter item description');
    if (!materialForm.quantity.trim()) return alert('Please enter quantity');

    setSubmitting(true);
    try {
      const isEditing = Boolean(editMaterialModal);
      const url = isEditing ? `/api/material-contributions/${editMaterialModal.id}` : '/api/material-contributions';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...materialForm,
          event_id: activeEvent?.id,
          estimated_value: materialForm.estimated_value ? parseFloat(materialForm.estimated_value) : null
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to save material contribution');
      }

      setAddMaterialModal(false);
      setEditMaterialModal(null);
      showToast(isEditing ? 'వస్తు రూప సమర్పణ నవీకరించబడింది!' : 'వస్తు రూప సమర్పణ విజయవంతంగా జోడించబడింది!');
      fetchDonations();
    } catch (err: any) {
      alert(err.message || 'Error saving material contribution');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleMaterial = async (id: string) => {
    try {
      const res = await fetch(`/api/material-contributions/${id}/toggle`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('స్టేటస్ విజయవంతంగా మార్చబడింది!');
        fetchDonations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMaterial = async (id: string, itemDesc: string) => {
    if (!window.confirm(`Are you sure you want to delete "${itemDesc}"?`)) return;
    try {
      const res = await fetch(`/api/material-contributions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('వస్తు రూప సమర్పణ తొలగించబడింది.');
        fetchDonations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Category Management Handlers
  const openAddCategory = () => {
    setEditCategoryModal(null);
    setCategoryForm({
      name: '',
      name_telugu: '',
      name_english: '',
      display_order: categories.length + 1,
      description: '',
      is_active: true
    });
    setAddCategoryModal(true);
  };

  const openEditCategory = (cat: any) => {
    setEditCategoryModal(cat);
    setCategoryForm({
      name: cat.name || '',
      name_telugu: cat.name_telugu || '',
      name_english: cat.name_english || '',
      display_order: cat.display_order || 1,
      description: cat.description || '',
      is_active: cat.is_active ?? true
    });
    setAddCategoryModal(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return alert('Please enter category name');

    setSubmitting(true);
    try {
      const isEditing = Boolean(editCategoryModal);
      const url = isEditing ? `/api/settings/donation-categories/${editCategoryModal.id}` : '/api/settings/donation-categories';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(categoryForm)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to save category');
      }

      setAddCategoryModal(false);
      setEditCategoryModal(null);
      showToast(isEditing ? 'విభాగం నవీకరించబడింది!' : 'కొత్త విభాగం జోడించబడింది!');
      fetchDonations();
    } catch (err: any) {
      alert(err.message || 'Error saving category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleCategory = async (catId: string) => {
    try {
      const res = await fetch(`/api/settings/donation-categories/${catId}/toggle`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('విభాగం స్థితి మార్చబడింది!');
        fetchDonations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter donations locally by status
  const filteredDonations = donations.filter(d => {
    if (statusFilter === 'ALL') return true;
    return d.status === statusFilter;
  });

  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'ORG_ADMIN' || user?.role === 'OPERATOR';
  const canDelete = user?.role === 'SUPER_ADMIN' || user?.role === 'ORG_ADMIN';

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Page Title & Add Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium text-slate-900 leading-tight">
            {t.portalDonations.title}
          </h1>
          <p className="text-sm text-slate-500 font-normal mt-1">
            {t.portalDonations.subtitle}
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2 flex-wrap">
            {activeTab === 'LEDGER' && (
              <button
                onClick={() => {
                  setDonorName('');
                  setAmount('');
                  setDonorMobile('');
                  setNotes('');
                  setIsAnonymous(false);
                  setAddModal(true);
                }}
                className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium shadow-xs shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>నగదు విరాళం నమోదు (+)</span>
              </button>
            )}

            {activeTab === 'MATERIALS' && (
              <button
                onClick={openAddMaterial}
                className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium shadow-xs shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>వస్తు రూప సమర్పణ నమోదు (+)</span>
              </button>
            )}

            {activeTab === 'CATEGORIES' && (
              <button
                onClick={openAddCategory}
                className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium shadow-xs shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>కొత్త విభాగం (+)</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Received */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">{t.portalDonations.cardTotal}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-medium text-slate-900">
            ₹{totalReceived.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'te' ? 'ఉత్సవ నిధికి అందిన మొత్తం' : 'Total money received'}
          </p>
        </div>

        {/* Today's Received */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">{t.portalDonations.cardToday}</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-medium text-orange-600">
            ₹{todayReceived.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'te' ? 'ఈ రోజు స్వీకరించిన మొత్తం' : 'Collections recorded today'}
          </p>
        </div>

        {/* Total Donors */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">{t.portalDonations.cardCount}</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-medium text-slate-900">
            {totalDonorsCount}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t.portalDonations.unitDevotees}
          </p>
        </div>

        {/* Material Offerings */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">వస్తు రూప సమర్పణలు</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-medium text-slate-900">
            {totalMaterialsCount}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'te' ? 'ప్రత్యేక సమర్పణలు' : 'Materials / Services'}
          </p>
        </div>
      </div>

      {/* Tabs & Toolbar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs sm:text-sm font-medium self-start flex-wrap">
            <button
              onClick={() => setActiveTab('LEDGER')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'LEDGER'
                  ? 'bg-white text-slate-900 shadow-xs font-medium'
                  : 'text-slate-600 hover:text-slate-900 font-normal'
              }`}
            >
              {t.portalDonations.tabLedger} ({donations.length})
            </button>
            <button
              onClick={() => setActiveTab('MATERIALS')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'MATERIALS'
                  ? 'bg-white text-slate-900 shadow-xs font-medium'
                  : 'text-slate-600 hover:text-slate-900 font-normal'
              }`}
            >
              వస్తు సమర్పణలు ({materialsList.length})
            </button>
            <button
              onClick={() => setActiveTab('CATEGORIES')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'CATEGORIES'
                  ? 'bg-white text-slate-900 shadow-xs font-medium'
                  : 'text-slate-600 hover:text-slate-900 font-normal'
              }`}
            >
              విరాళ విభాగాలు ({categories.length})
            </button>
            <button
              onClick={() => setActiveTab('DONORS')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'DONORS'
                  ? 'bg-white text-slate-900 shadow-xs font-medium'
                  : 'text-slate-600 hover:text-slate-900 font-normal'
              }`}
            >
              {t.portalDonations.tabDonors} ({donorsList.length})
            </button>
          </div>

          {/* Ledger Toolbar: Sort & Filters */}
          {activeTab === 'LEDGER' && (
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Category Filter */}
              <select
                value={ledgerCategoryFilter}
                onChange={(e) => setLedgerCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 text-xs focus:outline-none"
              >
                <option value="ALL">అన్ని విభాగాలు (All Categories)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name_telugu || c.name}</option>
                ))}
              </select>

              {/* Sort Order */}
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                <button
                  onClick={() => setLedgerSort('highest')}
                  className={`px-2 py-0.5 rounded-md ${ledgerSort === 'highest' ? 'bg-white shadow-xs font-medium text-orange-700' : 'text-slate-600'}`}
                >
                  అత్యధిక మొత్తం (Highest)
                </button>
                <button
                  onClick={() => setLedgerSort('newest')}
                  className={`px-2 py-0.5 rounded-md ${ledgerSort === 'newest' ? 'bg-white shadow-xs font-medium text-orange-700' : 'text-slate-600'}`}
                >
                  ఇటీవలి (Newest)
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1">
                {(['ALL', 'ISSUED', 'CANCELLED'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                      statusFilter === s 
                        ? 'bg-orange-50 border-orange-200 text-orange-700 font-medium' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {s === 'ALL' ? (lang === 'te' ? 'అన్నీ' : 'All') : s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Clean Light Search Toolbar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="పేరు, మొబైల్, రశీదు సంఖ్య లేదా వివరాలతో వెతకండి..."
            className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-900 placeholder-slate-400 font-normal transition-all"
          />
        </div>

        {/* TAB 1: DONATIONS LEDGER TABLE */}
        {activeTab === 'LEDGER' && (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                  <th className="py-3 px-4">{t.portalDonations.thDate}</th>
                  <th className="py-3 px-4">{t.portalDonations.thDonor}</th>
                  <th className="py-3 px-4">విభాగం (Category)</th>
                  <th className="py-3 px-4 text-right">{t.portalDonations.thAmount}</th>
                  <th className="py-3 px-4 text-center">{t.portalDonations.thMethod}</th>
                  <th className="py-3 px-4 text-center">{t.portalDonations.thStatus}</th>
                  <th className="py-3 px-4 text-right">{t.portalDonations.thActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredDonations.map((item) => {
                  const isVoid = item.status === 'CANCELLED';
                  const dName = item.is_anonymous 
                    ? (lang === 'te' ? 'అజ్ఞాత దాత' : 'Anonymous Donor')
                    : (lang === 'te' 
                        ? (item.donor_name_telugu || item.donor?.name_telugu || item.donor_name || item.donor?.name || 'అజ్ఞాత దాత')
                        : (item.donor_name_english || item.donor?.name_english || item.donor_name || item.donor?.name || 'Anonymous Devotee'));
                  const dMobile = item.donor_mobile || item.donor?.mobile || '';
                  const dVillage = lang === 'te'
                    ? (item.village_telugu || item.donor?.village_telugu || item.custom_values?.village || item.donor_address || '')
                    : (item.village_english || item.donor?.village_english || item.custom_values?.village || item.donor_address || '');
                  const catObj = categories.find(c => c.id === item.donation_category_id);

                  return (
                    <tr key={item.id} className={`hover:bg-orange-50/20 transition-colors ${isVoid ? 'opacity-50 bg-slate-50/50' : ''}`}>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {formatFestivalDate(item.receipt_date || item.created_at, lang)}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-slate-900">{dName}</p>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 font-normal mt-0.5">
                            {dMobile && <span>📱 {dMobile}</span>}
                            {dVillage && <span>📍 {dVillage}</span>}
                            <span className="text-slate-300">•</span>
                            <span className="text-[11px] text-slate-400 font-mono">{item.receipt_number}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
                          {catObj ? (catObj.name_telugu || catObj.name) : 'సాధారణ నిధి'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className={`font-medium ${isVoid ? 'line-through text-slate-400' : 'text-slate-900 text-base'}`}>
                          ₹{Number(item.amount || 0).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-normal">
                          {item.payment_method || 'CASH'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          isVoid 
                            ? 'bg-rose-50 text-rose-700 border-rose-200' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {isVoid ? (lang === 'te' ? 'రద్దు చేయబడింది' : 'VOID') : (lang === 'te' ? 'నమోదైంది' : 'ISSUED')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDetailModal(item)}
                            title={lang === 'te' ? 'వివరాలు' : 'View Details'}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canManage && !isVoid && (
                            <button
                              onClick={() => openEditModal(item)}
                              title={lang === 'te' ? 'సవరించు' : 'Edit'}
                              className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canManage && !isVoid && (
                            <button
                              onClick={() => {
                                setCancelModal(item);
                                setCancelReason('');
                              }}
                              title={lang === 'te' ? 'రద్దు చేయి' : 'Void'}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteDonation(item.id, item.receipt_number)}
                              title={lang === 'te' ? 'తొలగించు' : 'Delete'}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredDonations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="max-w-sm mx-auto space-y-2">
                        <HeartHandshake className="w-10 h-10 text-slate-300 mx-auto" />
                        <p className="text-base font-medium text-slate-700">{t.portalDonations.emptyTitle}</p>
                        <p className="text-xs text-slate-400">{t.portalDonations.emptySubtitle}</p>
                        {canManage && (
                          <button
                            onClick={() => setAddModal(true)}
                            className="mt-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-medium cursor-pointer"
                          >
                            {t.portalDonations.btnAdd}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: MATERIAL CONTRIBUTIONS TABLE */}
        {activeTab === 'MATERIALS' && (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                  <th className="py-3 px-4">తేదీ</th>
                  <th className="py-3 px-4">దాత పేరు (Donor)</th>
                  <th className="py-3 px-4">విభాగం</th>
                  <th className="py-3 px-4">వస్తు సమర్పణ వివరాలు (Description)</th>
                  <th className="py-3 px-4">పరిమాణం (Qty)</th>
                  <th className="py-3 px-4 text-right">అంచనా విలువ (₹ Est. Value)</th>
                  <th className="py-3 px-4 text-center">వెబ్‌సైట్ ప్రదర్శన</th>
                  <th className="py-3 px-4 text-right">చర్యలు</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {materialsList.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {formatFestivalDate(m.received_date, lang)}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-slate-900">{m.donor_name}</p>
                        {m.phone && <p className="text-xs text-slate-500">📱 {m.phone}</p>}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
                        {m.category_name_telugu || m.category_name || 'సాధారణ'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">{m.item_description_telugu || m.item_description}</p>
                      {m.notes && <p className="text-xs text-slate-500 mt-0.5">{m.notes}</p>}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-900">
                      {m.quantity} {m.unit || ''}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {m.estimated_value ? (
                        <div>
                          <span className="font-medium text-slate-900">₹{Number(m.estimated_value).toLocaleString('en-IN')}</span>
                          <span className="text-[10px] text-slate-400 block">(నగదులో కలవదు)</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleToggleMaterial(m.id)}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-pointer ${
                          m.is_published 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-stone-50 text-stone-600 border-stone-200'
                        }`}
                      >
                        {m.is_published ? 'ప్రదర్శితం (Live)' : 'దాచబడింది (Hidden)'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditMaterial(m)}
                          title="సవరించు"
                          className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMaterial(m.id, m.item_description)}
                          title="తొలగించు"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {materialsList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 text-sm">
                      వస్తు రూప సమర్పణలు ఇంకా నమోదు కాలేదు.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: CATEGORIES TABLE */}
        {activeTab === 'CATEGORIES' && (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                  <th className="py-3 px-4">క్రమ సంఖ్య</th>
                  <th className="py-3 px-4">తెలుగు పేరు (Telugu Name)</th>
                  <th className="py-3 px-4">ఇంగ్లీష్ పేరు (English Name)</th>
                  <th className="py-3 px-4">వివరణ (Description)</th>
                  <th className="py-3 px-4 text-center">స్థితి (Status)</th>
                  <th className="py-3 px-4 text-right">చర్యలు</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-400 text-xs font-mono">
                      #{c.display_order ?? 0}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {c.name_telugu || c.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {c.name_english || c.name}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {c.description || '—'}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleToggleCategory(c.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer ${
                          c.is_active 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-stone-100 text-stone-500 border-stone-200'
                        }`}
                      >
                        {c.is_active ? 'యాక్టివ్ (Active)' : 'నిష్క్రియం (Inactive)'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => openEditCategory(c)}
                        title="సవరించు"
                        className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400 text-sm">
                      విభాగాలు అందుబాటులో లేవు.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: DONOR DIRECTORY */}
        {activeTab === 'DONORS' && (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">{t.portalDonations.thDonor}</th>
                  <th className="py-3 px-4">ఫోన్ నంబర్ (Phone)</th>
                  <th className="py-3 px-4 text-right">మొత్తం విరాళం (Total Contributed)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {donorsList.map((d, index) => (
                  <tr key={d.id || index} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-400 text-xs">{index + 1}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{d.name}</td>
                    <td className="py-3 px-4 text-slate-600">{d.mobile || '—'}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900">
                      ₹{Number(d.total_contribution || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
                {donorsList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-400 text-sm">
                      {lang === 'te' ? 'దాతల వివరాలు నమోదు కాలేదు' : 'No donors registered yet'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD MONETARY DONATION */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xl font-medium text-slate-900">
                {t.portalDonations.modalAddTitle}
              </h3>
              <button
                onClick={() => setAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {/* Form Error Banner */}
              {addFormError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-center justify-between gap-2">
                  <span>⚠️ {addFormError}</span>
                  <button 
                    type="button" 
                    onClick={() => setAddFormError(null)} 
                    className="p-1 rounded text-rose-500 hover:text-rose-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Bilingual Donor Name Fields with Automatic Telugu Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Donor Name — English *
                    </label>
                  </div>
                  <input
                    type="text"
                    value={donorNameEnglish}
                    onChange={(e) => {
                      setDonorNameEnglish(e.target.value);
                    }}
                    placeholder="e.g. Ramesh"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-700 uppercase tracking-wider">
                      దాత పేరు — తెలుగు *
                    </label>
                    <div className="flex items-center gap-1.5">
                      {isTransliterating && (
                        <span className="text-[11px] text-orange-600 animate-pulse font-normal">
                          సూచిస్తోంది...
                        </span>
                      )}
                      {donorNameEnglish.trim() && (
                        <button
                          type="button"
                          onClick={handleRegenerateSuggestion}
                          className="text-[11px] text-orange-600 hover:text-orange-700 underline font-normal cursor-pointer"
                          title="ఇంగ్లీష్ పేరు నుండి తెలుగు సూచనను తిరిగి పొందండి"
                        >
                          {lang === 'te' ? 'మళ్లీ సూచించు' : 'Regenerate'}
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={donorNameTelugu}
                    onChange={(e) => {
                      setDonorNameTelugu(e.target.value);
                      setIsTeluguManuallyEdited(true);
                    }}
                    placeholder="ఉదా: రమేష్"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none"
                  />
                  {transliterationSuggestions.length > 1 && !isTeluguManuallyEdited && (
                    <div className="flex items-center gap-1.5 mt-1 overflow-x-auto text-xs text-slate-500">
                      <span className="text-[10px] text-slate-400">సూచనలు:</span>
                      {transliterationSuggestions.slice(0, 4).map((sug, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setDonorNameTelugu(sug);
                            setIsTeluguManuallyEdited(true);
                          }}
                          className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-orange-100 text-slate-700 hover:text-orange-800 text-[11px] cursor-pointer"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Category Selector with Inline Category Creator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider">
                    {lang === 'te' ? 'విరాళ విభాగం (Donation Category) *' : 'Donation Category *'}
                  </label>
                  {(!user || ['SUPER_ADMIN', 'ORG_ADMIN'].includes(user.role)) && (
                    <button
                      type="button"
                      onClick={() => setShowInlineAddCategory(!showInlineAddCategory)}
                      className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{lang === 'te' ? 'కొత్త విభాగం' : 'Add Category'}</span>
                    </button>
                  )}
                </div>

                {/* Inline Category Creator Form */}
                {showInlineAddCategory && (
                  <div className="p-3 mb-2.5 rounded-2xl bg-orange-50/70 border border-orange-200 space-y-2.5">
                    <p className="text-xs font-medium text-orange-900">
                      {lang === 'te' ? 'కొత్త విరాళ విభాగాన్ని చేర్చండి' : 'Create New Donation Category'}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={inlineCategoryTelugu}
                        onChange={(e) => setInlineCategoryTelugu(e.target.value)}
                        placeholder="విభాగం పేరు — తెలుగు (ఉదా: పుష్పాలంకరణ)"
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={inlineCategoryEnglish}
                        onChange={(e) => setInlineCategoryEnglish(e.target.value)}
                        placeholder="Category Name — English (e.g. Flower Decoration)"
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowInlineAddCategory(false)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-white cursor-pointer"
                      >
                        {lang === 'te' ? 'రద్దు' : 'Cancel'}
                      </button>
                      <button
                        type="button"
                        disabled={inlineCategoryLoading}
                        onClick={handleSaveInlineCategory}
                        className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-medium cursor-pointer disabled:opacity-50"
                      >
                        {inlineCategoryLoading ? 'చేరుస్తోంది...' : (lang === 'te' ? 'విభాగం భద్రపరచు' : 'Save Category')}
                      </button>
                    </div>
                  </div>
                )}

                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none cursor-pointer"
                >
                  {categories.filter(c => c.is_active).map((c) => (
                    <option key={c.id} value={c.id}>{lang === 'te' ? (c.name_telugu || c.name) : (c.name_english || c.name)}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                    {t.portalDonations.lblAmount}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="₹ 1,116"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                    {t.portalDonations.lblDate}
                  </label>
                  <input
                    type="date"
                    required
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                    {t.portalDonations.lblMethod}
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none cursor-pointer"
                  >
                    <option value="CASH">CASH (నగదు)</option>
                    <option value="UPI">UPI (ఫోన్‌పే / గూగుల్‌పే)</option>
                    <option value="ONLINE">ONLINE / BANK TRANSFER</option>
                    <option value="CHEQUE">CHEQUE (చెక్కు)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                    గ్రామం / నివాసం (Village / Town)
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      value={villageTelugu}
                      onChange={(e) => setVillageTelugu(e.target.value)}
                      placeholder="తెలుగు (గరువుపాలెం)"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={villageEnglish}
                      onChange={(e) => setVillageEnglish(e.target.value)}
                      placeholder="English (Garuvupalem)"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                  {t.portalDonations.lblPhone}
                </label>
                <input
                  type="tel"
                  value={donorMobile}
                  onChange={(e) => setDonorMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-50/60 border border-orange-100">
                <input
                  type="checkbox"
                  id="chkAnon"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded border-slate-300 cursor-pointer"
                />
                <label htmlFor="chkAnon" className="text-xs text-slate-700 font-medium cursor-pointer">
                  {t.portalDonations.optAnon}
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                  {t.portalDonations.lblNotes}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. శ్రీ లలితా సహస్రనామ కుంకుమార్చన / కుటుంబ క్షేమం"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {t.portalDonations.btnCancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium transition-colors shadow-xs shadow-orange-500/20 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'సేవ్ అవుతోంది...' : t.portalDonations.btnSave}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT MONETARY DONATION */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono text-slate-400">{editModal.receipt_number}</span>
                <h3 className="text-xl font-medium text-slate-900">
                  {t.portalDonations.modalEditTitle}
                </h3>
              </div>
              <button
                onClick={() => setEditModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                  {t.portalDonations.lblDonorName}
                </label>
                <input
                  type="text"
                  required
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                  విరాళ విభాగం (Category)
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name_telugu || c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                    {t.portalDonations.lblAmount}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                    {t.portalDonations.lblMethod}
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none cursor-pointer"
                  >
                    <option value="CASH">CASH</option>
                    <option value="UPI">UPI</option>
                    <option value="ONLINE">ONLINE / BANK TRANSFER</option>
                    <option value="CHEQUE">CHEQUE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                    {t.portalDonations.lblPhone}
                  </label>
                  <input
                    type="tel"
                    value={donorMobile}
                    onChange={(e) => setDonorMobile(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                    {t.portalDonations.lblVillage}
                  </label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                  {t.portalDonations.lblNotes}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {t.portalDonations.btnCancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  {t.portalDonations.btnSave}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW RECORD DETAILS */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono text-slate-400">{detailModal.receipt_number}</span>
                <h3 className="text-xl font-medium text-slate-900">
                  {t.portalDonations.modalDetailTitle}
                </h3>
              </div>
              <button
                onClick={() => setDetailModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 text-center">
                <span className="text-xs uppercase text-orange-700 font-medium">మొత్తం విరాళం</span>
                <p className="text-3xl font-medium text-slate-900 mt-0.5">
                  ₹{Number(detailModal.amount || 0).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 text-xs">
                <div>
                  <span className="text-slate-400">దాత పేరు:</span>
                  <p className="font-medium text-slate-900 text-sm">{detailModal.donor_name || 'Anonymous'}</p>
                </div>
                <div>
                  <span className="text-slate-400">తేదీ:</span>
                  <p className="font-medium text-slate-900 text-sm">{formatFestivalDate(detailModal.receipt_date || detailModal.created_at, lang)}</p>
                </div>
                <div className="mt-2">
                  <span className="text-slate-400">చెల్లింపు:</span>
                  <p className="font-medium text-slate-900 text-sm">{detailModal.payment_method}</p>
                </div>
                <div className="mt-2">
                  <span className="text-slate-400">స్థితి:</span>
                  <p className="font-medium text-slate-900 text-sm">{detailModal.status}</p>
                </div>
              </div>

              {detailModal.donor_mobile && (
                <p className="text-xs text-slate-600">📱 ఫోన్: {detailModal.donor_mobile}</p>
              )}
              {detailModal.notes && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                  <span className="text-slate-400 block mb-0.5">గమనికలు:</span>
                  {detailModal.notes}
                </div>
              )}
            </div>

            <button
              onClick={() => setDetailModal(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors cursor-pointer"
            >
              ముగించు (Close)
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: CANCEL / VOID CONFIRMATION */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-medium text-rose-700">
              విరాళం రద్దు (Void Donation)
            </h3>
            <p className="text-xs text-slate-600">
              రసీదు సంఖ్య <span className="font-mono font-medium">{cancelModal.receipt_number}</span> (₹{cancelModal.amount}) రద్దు చేయడానికి కారణం నమోదు చేయండి:
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <textarea
                required
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="రద్దు చేయడానికి గల కారణం (e.g. తప్పు మొత్తం లేదా డూప్లికేట్ ఎంట్రీ)..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs focus:outline-none focus:border-rose-500 text-slate-900"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCancelModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  వెనక్కి
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-medium cursor-pointer"
                >
                  రద్దు చేయి (Confirm Void)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD / EDIT MATERIAL CONTRIBUTION */}
      {addMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xl font-medium text-slate-900">
                {editMaterialModal ? 'వస్తు రూప సమర్పణ సవరణ' : 'కొత్త వస్తు రూప సమర్పణ నమోదు'}
              </h3>
              <button
                onClick={() => setAddMaterialModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMaterialSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                  దాత పేరు (Donor Name) *
                </label>
                <input
                  type="text"
                  required
                  value={materialForm.donor_name}
                  onChange={(e) => setMaterialForm({ ...materialForm, donor_name: e.target.value })}
                  placeholder="e.g. రావులపాటి సూర్యనారాయణ"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                    విరాళ విభాగం (Category)
                  </label>
                  <select
                    value={materialForm.donation_category_id}
                    onChange={(e) => setMaterialForm({ ...materialForm, donation_category_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none cursor-pointer"
                  >
                    {categories.filter(c => c.is_active).map((c) => (
                      <option key={c.id} value={c.id}>{c.name_telugu || c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                    ఫోన్ నంబర్ (Phone)
                  </label>
                  <input
                    type="tel"
                    value={materialForm.phone}
                    onChange={(e) => setMaterialForm({ ...materialForm, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                  సమర్పించిన వస్తు వివరాలు (Item Description) *
                </label>
                <input
                  type="text"
                  required
                  value={materialForm.item_description}
                  onChange={(e) => setMaterialForm({ ...materialForm, item_description: e.target.value, item_description_telugu: materialForm.item_description_telugu || e.target.value })}
                  placeholder="e.g. అన్నదానానికి 50 కిలోల బియ్యం బస్తాలు / పూల దండలు"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                    పరిమాణం (Quantity) *
                  </label>
                  <input
                    type="text"
                    required
                    value={materialForm.quantity}
                    onChange={(e) => setMaterialForm({ ...materialForm, quantity: e.target.value })}
                    placeholder="e.g. 2, 50, 10"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                    కొలత యూనిట్ (Unit)
                  </label>
                  <input
                    type="text"
                    value={materialForm.unit}
                    onChange={(e) => setMaterialForm({ ...materialForm, unit: e.target.value })}
                    placeholder="e.g. బస్తాలు, కేజీలు, మీటర్లు, నంబర్లు"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                  అంచనా విలువ (₹ Estimated Value - ఐచ్ఛికం)
                </label>
                <input
                  type="number"
                  step="any"
                  value={materialForm.estimated_value}
                  onChange={(e) => setMaterialForm({ ...materialForm, estimated_value: e.target.value })}
                  placeholder="₹ 5,000 (సమాచారం కొరకు మాత్రమే, నగదు లెక్కల్లో కలవదు)"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  * ఈ అంచనా విలువ గౌరవార్థ సూచన మాత్రమే. అధికారిక నగదు నిధిలో జమ చేయబడదు.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                  గమనికలు (Notes)
                </label>
                <textarea
                  rows={2}
                  value={materialForm.notes}
                  onChange={(e) => setMaterialForm({ ...materialForm, notes: e.target.value })}
                  placeholder="అదనపు వివరాలు..."
                  className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-50/60 border border-orange-100">
                <input
                  type="checkbox"
                  id="chkMatPub"
                  checked={materialForm.is_published}
                  onChange={(e) => setMaterialForm({ ...materialForm, is_published: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded border-slate-300 cursor-pointer"
                />
                <label htmlFor="chkMatPub" className="text-xs text-slate-700 font-medium cursor-pointer">
                  వెబ్‌సైట్‌లో బహిరంగంగా ప్రదర్శించు (Publish on public website)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddMaterialModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  రద్దు చేయి
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'సేవ్ అవుతోంది...' : 'భద్రపరచు (Save)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: ADD / EDIT CATEGORY */}
      {addCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xl font-medium text-slate-900">
                {editCategoryModal ? 'విభాగం సవరణ' : 'కొత్త విరాళ విభాగం'}
              </h3>
              <button
                onClick={() => setAddCategoryModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                  విభాగం పేరు (Telugu Name) *
                </label>
                <input
                  type="text"
                  required
                  value={categoryForm.name_telugu || categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value, name_telugu: e.target.value })}
                  placeholder="e.g. అన్నదానం / పూల దండలు"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                  ఇంగ్లీష్ పేరు (English Name)
                </label>
                <input
                  type="text"
                  value={categoryForm.name_english}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name_english: e.target.value })}
                  placeholder="e.g. Annadanam / Flower Garlands"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                  డిస్‌ప్లే ఆర్డర్ (Display Order)
                </label>
                <input
                  type="number"
                  min="1"
                  value={categoryForm.display_order}
                  onChange={(e) => setCategoryForm({ ...categoryForm, display_order: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                  వివరణ (Description)
                </label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="ఈ విభాగం యొక్క ఉద్దేశం..."
                  className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-50/60 border border-orange-100">
                <input
                  type="checkbox"
                  id="chkCatActive"
                  checked={categoryForm.is_active}
                  onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded border-slate-300 cursor-pointer"
                />
                <label htmlFor="chkCatActive" className="text-xs text-slate-700 font-medium cursor-pointer">
                  యాక్టివ్‌గా ఉంచు (Active)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddCategoryModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  రద్దు చేయి
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'సేవ్ అవుతోంది...' : 'భద్రపరచు (Save)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
