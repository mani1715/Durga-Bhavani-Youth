import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Settings as SettingsIcon, Image as ImageIcon, Building2, 
  FileText, MessageCircle, Hash, Sliders, Check, Upload, Shield, Lock
} from 'lucide-react';

type Tab = 'general' | 'branding' | 'organization' | 'receipt' | 'whatsapp' | 'numbering' | 'preferences' | 'security';

export const Settings: React.FC = () => {
  const { lang, setLanguage } = useLanguage();
  const { token } = useAuth();
  
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // LocalStorage-based states
  const [localSettings, setLocalSettings] = useState({
    general_language: localStorage.getItem('settings_language') || 'English',
    general_currency: localStorage.getItem('settings_currency') || 'INR',
    
    brand_logo: localStorage.getItem('settings_logo') || '',
    brand_color: localStorage.getItem('settings_color') || '#D97706',
    
    receipt_prefix: localStorage.getItem('settings_receiptPrefix') || 'VFC-2026-',
    receipt_template: localStorage.getItem('settings_receiptTemplate') || 'default',
    receipt_category: localStorage.getItem('settings_receiptCategory') || 'general',
    receipt_pageSize: localStorage.getItem('settings_pageSize') || 'A4',
    receipt_qr: localStorage.getItem('settings_receiptQr') === 'true',
    
    whatsapp_en: localStorage.getItem('settings_customMsgEn') || 'May Lord Ganesha bless you with health, wealth, and prosperity!',
    whatsapp_te: localStorage.getItem('settings_customMsgTe') || 'శ్రీ వినాయక స్వామి వారి కృపా కటాక్షాలు మీ కుటుంబానికి ఎల్లవేళలా ఉండాలని కోరుకుంటున్నాము!',
    whatsapp_lang: localStorage.getItem('settings_waLang') || 'English',
    whatsapp_template: localStorage.getItem('settings_waTemplate') || 'Dear {donor_name}, thank you for your contribution of ₹{amount} on {date}. Receipt: {receipt_no}',
    
    num_mode: localStorage.getItem('settings_numMode') || 'auto',
    num_expPrefix: localStorage.getItem('settings_expPrefix') || 'EXP-',
    num_reset: localStorage.getItem('settings_numReset') === 'true',
    
    pref_refresh: localStorage.getItem('settings_refresh') || 'Manual',
    pref_payment: localStorage.getItem('settings_payment') || 'CASH',
    pref_voice: localStorage.getItem('settings_voice') === 'true',
  });

  // Organization state (API-based)
  const [orgState, setOrgState] = useState({
    name: '',
    festival_name: '',
    address: '',
    phone: '',
    email: '',
    signature: '',
    upi_qr: '',
    bank_name: '',
    account_number: '',
    ifsc: ''
  });

  const [templates, setTemplates] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch initial data
  useEffect(() => {
    if (!token) return;

    // Fetch org
    fetch('/api/organization', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data && !data.detail) {
          setOrgState({
            name: data.name || '',
            festival_name: data.festival_name || '',
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
            signature: data.signature || '',
            upi_qr: data.upi_qr || '',
            bank_name: data.bank_name || '',
            account_number: data.account_number || '',
            ifsc: data.ifsc || ''
          });
        }
      }).catch(console.error);

    // Fetch templates & categories (mock or real if exists)
    fetch('/api/templates', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setTemplates(data) : setTemplates([]))
      .catch(() => setTemplates([]));

    fetch('/api/settings/donation-categories', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setCategories(data) : setCategories([]))
      .catch(() => setCategories([]));
  }, [token]);

  // Handle local settings change with debounce
  const handleLocalChange = (key: keyof typeof localSettings, value: string | boolean) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));

    if (key === 'general_language') {
      setLanguage(value === 'Telugu' ? 'te' : 'en');
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      // Perform save
      const saveKeyMap: Record<string, string> = {
        general_language: 'settings_language',
        general_currency: 'settings_currency',
        brand_logo: 'settings_logo',
        brand_color: 'settings_color',
        receipt_prefix: 'settings_receiptPrefix',
        receipt_template: 'settings_receiptTemplate',
        receipt_category: 'settings_receiptCategory',
        receipt_pageSize: 'settings_pageSize',
        receipt_qr: 'settings_receiptQr',
        whatsapp_en: 'settings_customMsgEn',
        whatsapp_te: 'settings_customMsgTe',
        whatsapp_lang: 'settings_waLang',
        whatsapp_template: 'settings_waTemplate',
        num_mode: 'settings_numMode',
        num_expPrefix: 'settings_expPrefix',
        num_reset: 'settings_numReset',
        pref_refresh: 'settings_refresh',
        pref_payment: 'settings_payment',
        pref_voice: 'settings_voice'
      };

      const lsKey = saveKeyMap[key];
      if (lsKey) {
        localStorage.setItem(lsKey, String(value));
        // Special case for backward compat
        if (key === 'whatsapp_en') {
          localStorage.setItem('settings_customMsg', String(value));
        }
      }

      showSaveIndicator();
    }, 300);
  };

  // Handle Org change
  const handleOrgChange = (key: keyof typeof orgState, value: string) => {
    setOrgState(prev => ({ ...prev, [key]: value }));
  };

  // Handle Org Save on Blur
  const handleOrgBlur = () => {
    if (!token) return;

    fetch('/api/organization', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(orgState)
    }).then(res => {
      if(res.ok) {
        // Backwards compat
        localStorage.setItem('settings_orgName', orgState.name);
        localStorage.setItem('settings_contact', orgState.phone);
        showSaveIndicator();
      }
    }).catch(console.error);
  };

  const showSaveIndicator = () => {
    setSaveStatus('Saved');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passStatus, setPassStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passLoading, setPassLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setPassStatus({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (newPass.length < 6) {
      setPassStatus({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }
    setPassLoading(true);
    setPassStatus(null);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ old_password: oldPass, new_password: newPass })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to update password');
      setPassStatus({ type: 'success', text: 'Password updated successfully!' });
      setOldPass(''); setNewPass(''); setConfirmPass('');
    } catch (err: any) {
      setPassStatus({ type: 'error', text: err.message });
    } finally {
      setPassLoading(false);
    }
  };

  const tabs: { id: Tab, label: string, icon: React.FC<any> }[] = [
    { id: 'general', label: lang === 'te' ? 'సాధారణ' : 'General', icon: SettingsIcon },
    { id: 'branding', label: lang === 'te' ? 'బ్రాండింగ్' : 'Branding', icon: ImageIcon },
    { id: 'organization', label: lang === 'te' ? 'సంస్థ' : 'Organization', icon: Building2 },
    { id: 'receipt', label: lang === 'te' ? 'రసీదు సెట్టింగ్‌లు' : 'Receipt Settings', icon: FileText },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { id: 'numbering', label: lang === 'te' ? 'క్రమ సంఖ్యలు' : 'Numbering', icon: Hash },
    { id: 'preferences', label: lang === 'te' ? 'ప్రాధాన్యతలు' : 'Preferences', icon: Sliders },
    { id: 'security', label: lang === 'te' ? 'భద్రత & పాస్‌వర్డ్' : 'Security & Password', icon: Shield },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {lang === 'te' ? 'సెట్టింగ్‌లు' : 'Settings'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {lang === 'te' ? 'ప్లాట్‌ఫారమ్ డిఫాల్ట్‌లు మరియు ప్రాధాన్యతలను కాన్ఫిగర్ చేయండి' : 'Configure platform defaults and preferences.'}
          </p>
        </div>
        {saveStatus && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-sm font-medium animate-in fade-in">
            <Check className="h-4 w-4" /> {lang === 'te' ? 'భద్రపరచబడింది' : saveStatus}
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Sidebar / Tabs */}
        <div className="md:w-64 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50 overflow-x-auto md:overflow-x-visible flex md:flex-col">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-3 px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 md:border-b-0 md:border-l-2
                ${activeTab === t.id 
                  ? 'border-amber-600 text-amber-700 bg-amber-50/50' 
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <t.icon className={`h-5 w-5 ${activeTab === t.id ? 'text-amber-600' : 'text-slate-400'}`} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8 bg-white overflow-y-auto">
          
          {/* General */}
          {activeTab === 'general' && (
            <div className="space-y-6 max-w-xl animate-in fade-in">
              <h2 className="text-lg font-bold text-slate-900">General Settings</h2>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Language Preference</label>
                <select 
                  value={localSettings.general_language} 
                  onChange={(e) => handleLocalChange('general_language', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                >
                  <option value="English">English</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Bilingual">Bilingual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                <select 
                  value={localSettings.general_currency} 
                  onChange={(e) => handleLocalChange('general_currency', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                >
                  <option value="INR">Indian Rupee (INR)</option>
                  <option value="USD">US Dollar (USD)</option>
                </select>
              </div>
            </div>
          )}

          {/* Branding */}
          {activeTab === 'branding' && (
            <div className="space-y-6 max-w-xl animate-in fade-in">
              <h2 className="text-lg font-bold text-slate-900">Branding</h2>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Logo Image (Upload from Local Device / Gallery or Enter URL)</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="https://example.com/logo.png or uploaded image Base64"
                      value={localSettings.brand_logo}
                      onChange={(e) => handleLocalChange('brand_logo', e.target.value)}
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <label className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-sm">
                      <Upload className="h-4 w-4" /> Upload
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => handleLocalChange('brand_logo', ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-slate-50 border rounded-lg">
                    <img src={localSettings.brand_logo || '/committee-photo-logo.webp'} alt="Logo Preview" className="h-12 w-12 object-contain rounded-full border border-orange-300 bg-white" />
                    <span className="text-xs text-slate-500">Logo preview ({localSettings.brand_logo ? 'Custom' : 'Official Committee Photo Emblem'})</span>
                    {localSettings.brand_logo && (
                      <button type="button" onClick={() => handleLocalChange('brand_logo', '')} className="ml-auto text-xs text-red-500 hover:underline">Remove</button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Primary Brand Color</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={localSettings.brand_color}
                    onChange={(e) => handleLocalChange('brand_color', e.target.value)}
                    className="h-10 w-10 border-0 p-0 rounded cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={localSettings.brand_color}
                    onChange={(e) => handleLocalChange('brand_color', e.target.value)}
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Organization */}
          {activeTab === 'organization' && (
            <div className="space-y-6 max-w-2xl animate-in fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Organization Details</h2>
                <span className="text-xs text-slate-500">Auto-saves on blur</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Organization Name</label>
                  <input 
                    type="text" 
                    value={orgState.name}
                    onChange={(e) => handleOrgChange('name', e.target.value)}
                    onBlur={handleOrgBlur}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Festival Name</label>
                  <input 
                    type="text" 
                    value={orgState.festival_name}
                    onChange={(e) => handleOrgChange('festival_name', e.target.value)}
                    onBlur={handleOrgBlur}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <textarea 
                    value={orgState.address}
                    onChange={(e) => handleOrgChange('address', e.target.value)}
                    onBlur={handleOrgBlur}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none h-20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input 
                    type="text" 
                    value={orgState.phone}
                    onChange={(e) => handleOrgChange('phone', e.target.value)}
                    onBlur={handleOrgBlur}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={orgState.email}
                    onChange={(e) => handleOrgChange('email', e.target.value)}
                    onBlur={handleOrgBlur}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2 mt-4">
                  <h3 className="font-semibold text-slate-800 border-b pb-2 mb-4">Bank Details & UPI</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
                  <input 
                    type="text" 
                    value={orgState.bank_name}
                    onChange={(e) => handleOrgChange('bank_name', e.target.value)}
                    onBlur={handleOrgBlur}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
                  <input 
                    type="text" 
                    value={orgState.account_number}
                    onChange={(e) => handleOrgChange('account_number', e.target.value)}
                    onBlur={handleOrgBlur}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">IFSC Code</label>
                  <input 
                    type="text" 
                    value={orgState.ifsc}
                    onChange={(e) => handleOrgChange('ifsc', e.target.value)}
                    onBlur={handleOrgBlur}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">UPI QR Code Photo / Image</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={orgState.upi_qr}
                      onChange={(e) => handleOrgChange('upi_qr', e.target.value)}
                      onBlur={handleOrgBlur}
                      placeholder="Image URL or upload from local"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <label className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1 shadow-sm whitespace-nowrap">
                      <Upload className="h-4 w-4" /> Upload
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const b64 = ev.target?.result as string;
                              handleOrgChange('upi_qr', b64);
                              handleOrgBlur();
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="sm:col-span-2 mt-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Authorized Signature Image</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={orgState.signature}
                      onChange={(e) => handleOrgChange('signature', e.target.value)}
                      onBlur={handleOrgBlur}
                      placeholder="Image URL or upload from local"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <label className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1 shadow-sm whitespace-nowrap">
                      <Upload className="h-4 w-4" /> Upload
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const b64 = ev.target?.result as string;
                              handleOrgChange('signature', b64);
                              handleOrgBlur();
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Receipt Settings */}
          {activeTab === 'receipt' && (
            <div className="space-y-6 max-w-xl animate-in fade-in">
              <h2 className="text-lg font-bold text-slate-900">Receipt Settings</h2>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Receipt Prefix</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="text" 
                    value={localSettings.receipt_prefix}
                    onChange={(e) => handleLocalChange('receipt_prefix', e.target.value)}
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <div className="text-sm text-slate-500 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
                    Preview: {localSettings.receipt_prefix}0001
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Default Template</label>
                <select 
                  value={localSettings.receipt_template} 
                  onChange={(e) => handleLocalChange('receipt_template', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="default">Default Standard Template</option>
                  {templates.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Default Donation Category</label>
                <select 
                  value={localSettings.receipt_category} 
                  onChange={(e) => handleLocalChange('receipt_category', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="general">General Donation</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">PDF Page Size</label>
                <select 
                  value={localSettings.receipt_pageSize} 
                  onChange={(e) => handleLocalChange('receipt_pageSize', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="A4">A4 (Standard)</option>
                  <option value="A5">A5 (Half Size)</option>
                  <option value="Custom">Custom Thermal Printer</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="include_qr"
                  checked={localSettings.receipt_qr}
                  onChange={(e) => handleLocalChange('receipt_qr', e.target.checked)}
                  className="h-4 w-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                />
                <label htmlFor="include_qr" className="text-sm font-medium text-slate-700">Include QR Code on Receipt</label>
              </div>
            </div>
          )}

          {/* WhatsApp */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-6 max-w-xl animate-in fade-in">
              <h2 className="text-lg font-bold text-slate-900">WhatsApp & Messaging</h2>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">English Blessing Message</label>
                <textarea 
                  value={localSettings.whatsapp_en}
                  onChange={(e) => handleLocalChange('whatsapp_en', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telugu Blessing Message (తెలుగు)</label>
                <textarea 
                  value={localSettings.whatsapp_te}
                  onChange={(e) => handleLocalChange('whatsapp_te', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Default Share Language</label>
                <select 
                  value={localSettings.whatsapp_lang} 
                  onChange={(e) => handleLocalChange('whatsapp_lang', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="English">English</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Ask">Ask Every Time</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Share Text Template</label>
                <textarea 
                  value={localSettings.whatsapp_template}
                  onChange={(e) => handleLocalChange('whatsapp_template', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none h-24"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Placeholders: {'{donor_name}'}, {'{amount}'}, {'{receipt_no}'}, {'{date}'}
                </p>
              </div>
            </div>
          )}

          {/* Numbering */}
          {activeTab === 'numbering' && (
            <div className="space-y-6 max-w-xl animate-in fade-in">
              <h2 className="text-lg font-bold text-slate-900">Sequence & Numbering</h2>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Receipt Sequence Mode</label>
                <select 
                  value={localSettings.num_mode} 
                  onChange={(e) => handleLocalChange('num_mode', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="auto">Automatic (System Generated)</option>
                  <option value="manual">Manual Entry</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expense Number Prefix</label>
                <input 
                  type="text" 
                  value={localSettings.num_expPrefix}
                  onChange={(e) => handleLocalChange('num_expPrefix', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="reset_per_event"
                  checked={localSettings.num_reset}
                  onChange={(e) => handleLocalChange('num_reset', e.target.checked)}
                  className="h-4 w-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                />
                <label htmlFor="reset_per_event" className="text-sm font-medium text-slate-700">Reset receipt numbering per Event automatically</label>
              </div>
            </div>
          )}

          {/* Preferences */}
          {activeTab === 'preferences' && (
            <div className="space-y-6 max-w-xl animate-in fade-in">
              <h2 className="text-lg font-bold text-slate-900">User Preferences</h2>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dashboard Refresh Interval</label>
                <select 
                  value={localSettings.pref_refresh} 
                  onChange={(e) => handleLocalChange('pref_refresh', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="10s">Every 10 seconds</option>
                  <option value="30s">Every 30 seconds</option>
                  <option value="60s">Every 60 seconds</option>
                  <option value="Manual">Manual Refresh Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Default Payment Method</label>
                <select 
                  value={localSettings.pref_payment} 
                  onChange={(e) => handleLocalChange('pref_payment', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI (GPay/PhonePe)</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="voice_input"
                  checked={localSettings.pref_voice}
                  onChange={(e) => handleLocalChange('pref_voice', e.target.checked)}
                  className="h-4 w-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                />
                <label htmlFor="voice_input" className="text-sm font-medium text-slate-700">Enable Voice Input for forms</label>
              </div>
            </div>
          )}

          {/* Security & Password */}
          {activeTab === 'security' && (
            <div className="space-y-6 max-w-xl animate-in fade-in">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Security & Credentials</h2>
                <p className="text-xs text-slate-500 mt-1">Update your login password and manage account security.</p>
              </div>

              {passStatus && (
                <div className={`p-3.5 rounded-xl text-xs font-semibold ${
                  passStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {passStatus.text}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Current Password</label>
                  <input 
                    type="password" 
                    required
                    value={oldPass}
                    onChange={(e) => setOldPass(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-slate-900"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">New Password</label>
                  <input 
                    type="password" 
                    required
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-slate-900"
                    placeholder="At least 6 characters"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    required
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-slate-900"
                    placeholder="Repeat new password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={passLoading}
                  className="py-2.5 px-5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-2 transition-all"
                >
                  <Lock className="h-4 w-4" />
                  {passLoading ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
