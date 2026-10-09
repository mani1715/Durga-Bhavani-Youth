import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, Heart, ImageIcon, Bell, Settings as SettingsIcon,
  Plus, Trash2, Edit2, CheckCircle, Eye, EyeOff, Upload, Phone, Save, AlertCircle,
  ArrowUp, ArrowDown, RefreshCw, Sparkles
} from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';

interface BilingualFieldProps {
  label: string;
  sublabel?: string;
  englishValue: string;
  teluguValue: string;
  onEnglishChange: (val: string) => void;
  onTeluguChange: (val: string) => void;
  englishPlaceholder?: string;
  teluguPlaceholder?: string;
  context?: 'name' | 'material' | 'instruction' | 'general';
  token: string | null;
  required?: boolean;
  isTextArea?: boolean;
  lang: string;
}

const BilingualField: React.FC<BilingualFieldProps> = ({
  label,
  sublabel,
  englishValue,
  teluguValue,
  onEnglishChange,
  onTeluguChange,
  englishPlaceholder,
  teluguPlaceholder,
  context = 'general',
  token,
  required = false,
  isTextArea = false,
  lang
}) => {
  const [isManual, setIsManual] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const fetchSuggestion = useCallback(async (enText: string) => {
    if (!enText.trim() || !token) return;
    setIsSuggesting(true);
    try {
      const res = await fetch('/api/festival-admin/suggest-telugu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: enText.trim(), context })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.suggestion) {
          onTeluguChange(data.suggestion);
        }
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsSuggesting(false);
    }
  }, [token, context, onTeluguChange]);

  useEffect(() => {
    if (isManual || !englishValue.trim()) return;
    const timer = setTimeout(() => {
      fetchSuggestion(englishValue);
    }, 400);
    return () => clearTimeout(timer);
  }, [englishValue, isManual, fetchSuggestion]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-medium text-slate-700">
        <span>{label} {required && <span className="text-red-500">*</span>}</span>
        {sublabel && <span className="text-slate-400 font-normal">{sublabel}</span>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <div>
          <div className="text-[11px] font-medium text-slate-500 mb-1">
            {lang === 'en' ? 'English' : 'ఆంగ్లం (English)'}
          </div>
          {isTextArea ? (
            <textarea
              value={englishValue}
              onChange={(e) => onEnglishChange(e.target.value)}
              placeholder={englishPlaceholder || 'Enter in English...'}
              rows={2}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-base sm:text-sm font-normal focus:outline-none focus:border-orange-500"
            />
          ) : (
            <input
              type="text"
              value={englishValue}
              onChange={(e) => onEnglishChange(e.target.value)}
              placeholder={englishPlaceholder || 'Enter in English...'}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-base sm:text-sm font-normal focus:outline-none focus:border-orange-500"
            />
          )}
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1">
            <span>{lang === 'en' ? 'Telugu (తెలుగు)' : 'తెలుగు'}</span>
            <button
              type="button"
              onClick={() => {
                setIsManual(false);
                fetchSuggestion(englishValue);
              }}
              disabled={isSuggesting || !englishValue.trim()}
              className="text-orange-700 hover:text-orange-900 inline-flex items-center gap-1 font-medium disabled:opacity-40 cursor-pointer text-[11px]"
              title={lang === 'en' ? 'Regenerate Telugu suggestion' : 'తెలుగు సూచనను మళ్ళీ పొందండి'}
            >
              <RefreshCw className={`h-3 w-3 ${isSuggesting ? 'animate-spin' : ''}`} />
              <span>{isSuggesting ? (lang === 'en' ? 'Translating...' : 'అనువదిస్తోంది...') : (lang === 'en' ? 'Regenerate' : 'పునరుద్ధరించు')}</span>
            </button>
          </div>
          {isTextArea ? (
            <textarea
              value={teluguValue}
              onChange={(e) => {
                setIsManual(true);
                onTeluguChange(e.target.value);
              }}
              placeholder={teluguPlaceholder || 'తెలుగులో రాయండి...'}
              rows={2}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-base sm:text-sm font-normal focus:outline-none focus:border-orange-500"
            />
          ) : (
            <input
              type="text"
              value={teluguValue}
              onChange={(e) => {
                setIsManual(true);
                onTeluguChange(e.target.value);
              }}
              placeholder={teluguPlaceholder || 'తెలుగులో రాయండి...'}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-base sm:text-sm font-normal focus:outline-none focus:border-orange-500"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const FestivalManagement: React.FC = () => {
  const { token } = useAuth();
  const { lang } = useLanguage();

  const getDayBadgeLabel = (dayNumber: number) => {
    if (dayNumber === 0) {
      return lang === 'en' ? 'Arrival & Procession' : 'ఆగమనం & శోభాయాత్ర';
    }
    return lang === 'en' ? `Day ${dayNumber}` : `రోజు ${dayNumber}`;
  };

  const [activeTab, setActiveTab] = useState<'DAYS' | 'COUPLES' | 'PHOTOS' | 'ANNOUNCEMENTS' | 'SETTINGS'>('DAYS');
  
  const [days, setDays] = useState<any[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<string>('');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [poojaCouples, setPoojaCouples] = useState<any[]>([]);
  
  // Settings Form State
  const [settings, setSettings] = useState({
    festival_name: '31వ దేవీ శరన్నవరాత్రి మహోత్సవములు',
    address: 'గరువుపాలెం, చేబ్రోలు మండలం, గుంటూరు జిల్లా',
    contact1: '8897557545',
    contact2: '9912844424',
    contact3: '9963397056',
    banner_image_url: '/ammavaru-hero-green.webp',
    logo_url: '/committee-photo-logo.webp'
  });

  // Hero Photo Upload State
  const [heroPhotoFile, setHeroPhotoFile] = useState<File | null>(null);
  const [heroPhotoPreview, setHeroPhotoPreview] = useState<string | null>(null);
  const [uploadingHeroPhoto, setUploadingHeroPhoto] = useState(false);

  // Logo Photo Upload State
  const [logoPhotoFile, setLogoPhotoFile] = useState<File | null>(null);
  const [logoPhotoPreview, setLogoPhotoPreview] = useState<string | null>(null);
  const [uploadingLogoPhoto, setUploadingLogoPhoto] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Day Modal
  const [editDayModal, setEditDayModal] = useState<any | null>(null);
  const [newActivityTitleTe, setNewActivityTitleTe] = useState('');
  const [newActivityTitleEn, setNewActivityTitleEn] = useState('');
  const [newActivityTime, setNewActivityTime] = useState('');
  const [newActivityTimeEn, setNewActivityTimeEn] = useState('');

  // Day Puja Materials State
  const [dayMaterials, setDayMaterials] = useState<any[]>([]);
  const [materialModal, setMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null);
  const [materialForm, setMaterialForm] = useState({
    item_name_english: '',
    item_name_telugu: '',
    quantity: '',
    unit: '',
    unit_telugu: '',
    instructions_english: '',
    instructions_telugu: '',
    provided_by: 'DEVOTEES',
    programme_activity_id: '',
    is_published: true
  });

  // Edit Existing Activity Modal
  const [editingActivity, setEditingActivity] = useState<any | null>(null);
  
  // Add/Edit Couple & Participant Modal
  const [addCoupleModal, setAddCoupleModal] = useState(false);
  const [editingCouple, setEditingCouple] = useState<any | null>(null);
  const [participantType, setParticipantType] = useState<'COUPLE' | 'INDIVIDUAL' | 'FAMILY' | 'OPEN_TO_ALL'>('COUPLE');
  const [person1, setPerson1] = useState('');
  const [person1Telugu, setPerson1Telugu] = useState('');
  const [person2, setPerson2] = useState('');
  const [person2Telugu, setPerson2Telugu] = useState('');
  const [familyDisplay, setFamilyDisplay] = useState('');
  const [familyDisplayTelugu, setFamilyDisplayTelugu] = useState('');
  const [participantActivityId, setParticipantActivityId] = useState('');

  // Photo Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [uploadingProgress, setUploadingProgress] = useState(false);

  // Add Announcement Modal
  const [addAnnModal, setAddAnnModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');

  // Fetch Admin Days
  const fetchDays = useCallback(async () => {
    try {
      const res = await fetch('/api/festival-admin/days', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDays(data);
        setSelectedDayId(prev => prev || (data.length > 0 ? data[0].id : ''));
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  // Fetch Settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/festival-admin/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const contacts = data.contacts || [];
        setSettings({
          festival_name: data.festival_name || '31వ దేవీ శరన్నవరాత్రి మహోత్సవములు',
          address: data.address || 'గరువుపాలెం, చేబ్రోలు మండలం, గుంటూరు జిల్లా',
          contact1: contacts[0]?.phone || '8897557545',
          contact2: contacts[1]?.phone || '9912844424',
          contact3: contacts[2]?.phone || '9963397056',
          banner_image_url: data.banner_image_url || '/ammavaru-hero-green.webp',
          logo_url: data.logo_url || '/committee-photo-logo.webp'
        });
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  // Fetch Pooja Couples for selected day
  const fetchCouples = useCallback(async (dayId: string) => {
    if (!dayId) return;
    try {
      const res = await fetch(`/api/festival-admin/days/${dayId}/pooja-couples`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPoojaCouples(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  // Fetch Puja Materials for day
  const fetchDayMaterials = useCallback(async (dayId: string) => {
    if (!dayId) return;
    try {
      const res = await fetch(`/api/festival-admin/days/${dayId}/materials`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDayMaterials(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  // Fetch Photos for selected day
  const fetchPhotos = useCallback(async (dayId: string) => {
    if (!dayId) return;
    try {
      const res = await fetch(`/api/festival-admin/days/${dayId}/photos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPhotos(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  // Fetch Announcements
  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch('/api/festival-admin/announcements', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchDays();
      fetchSettings();
      fetchAnnouncements();
    }
  }, [token, fetchDays, fetchSettings, fetchAnnouncements]);

  useEffect(() => {
    if (selectedDayId) {
      fetchCouples(selectedDayId);
      fetchPhotos(selectedDayId);
    }
  }, [selectedDayId, fetchCouples, fetchPhotos]);

  useEffect(() => {
    if (editDayModal?.id) {
      fetchDayMaterials(editDayModal.id);
    }
  }, [editDayModal?.id, fetchDayMaterials]);

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const contactStr = `${settings.contact1.trim()}, ${settings.contact2.trim()}, ${settings.contact3.trim()}`;
      const res = await fetch('/api/festival-admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          festival_name: settings.festival_name,
          address: settings.address,
          contact_number: contactStr
        })
      });
      if (res.ok) {
        setMsg({ type: 'success', text: 'కమిటీ సంప్రదింపు ఫోన్ నంబర్లు మరియు వివరాలు భద్రపరచబడ్డాయి!' });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'వివరాలు భద్రపరచడంలో లోపం సంభవించింది.' });
    } finally {
      setLoading(false);
    }
  };

  // Save Day Updates
  const handleSaveDay = async (dayId: string, payload: any) => {
    try {
      const res = await fetch(`/api/festival-admin/days/${dayId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchDays();
        setEditDayModal(null);
        setMsg({ type: 'success', text: 'దినచర్య వివరాలు నవీకరించబడ్డాయి!' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'మార్పులను సేవ్ చేయలేకపోయాము.' });
    }
  };

  // Committee Logo Photograph Upload
  const handleLogoPhotoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logoPhotoFile) return;

    setUploadingLogoPhoto(true);
    setMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', logoPhotoFile);

      const res = await fetch('/api/festival-admin/settings/logo-photo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({
          ...prev,
          logo_url: data.logo_url
        }));
        setLogoPhotoFile(null);
        setLogoPhotoPreview(null);
        setMsg({ type: 'success', text: 'కమిటీ అధికారిక ఫోటో లోగో విజయవంతంగా నవీకరించబడింది!' });
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || 'అప్‌లోడ్ విఫలమైంది');
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'లోగో ఫోటో అప్‌లోడ్ విఫలమైంది' });
    } finally {
      setUploadingLogoPhoto(false);
    }
  };

  // Hero Photograph Upload
  const handleHeroPhotoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroPhotoFile) return;

    setUploadingHeroPhoto(true);
    setMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', heroPhotoFile);

      const res = await fetch('/api/festival-admin/settings/hero-photo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({
          ...prev,
          banner_image_url: data.banner_image_url
        }));
        setHeroPhotoFile(null);
        setHeroPhotoPreview(null);
        setMsg({ type: 'success', text: 'అమ్మవారి ప్రధాన ఫోటో విజయవంతంగా నవీకరించబడింది!' });
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || 'అప్‌లోడ్ విఫలమైంది');
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'హీరో ఫోటో అప్‌లోడ్ విఫలమైంది' });
    } finally {
      setUploadingHeroPhoto(false);
    }
  };

  // Add Activity to Day
  const handleAddActivity = async (dayId: string) => {
    if (!newActivityTitleTe.trim()) {
      alert('కార్యక్రమం పేరు (తెలుగు) తప్పనిసరి.');
      return;
    }
    try {
      const res = await fetch(`/api/festival-admin/days/${dayId}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title_telugu: newActivityTitleTe.trim(),
          title_english: newActivityTitleEn.trim() || undefined,
          time_str: newActivityTime.trim() || undefined,
          time_str_english: newActivityTimeEn.trim() || undefined,
          is_published: true
        })
      });
      if (res.ok) {
        const act = await res.json();
        setNewActivityTitleTe('');
        setNewActivityTitleEn('');
        setNewActivityTime('');
        setNewActivityTimeEn('');
        fetchDays();
        setEditDayModal((prev: any) => prev ? {
          ...prev,
          activities: [...(prev.activities || []), act]
        } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Activity Publish
  const handleToggleActivityPublish = async (actId: string) => {
    try {
      const res = await fetch(`/api/festival-admin/activities/${actId}/toggle-publish`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const updated = await res.json();
        fetchDays();
        setEditDayModal((prev: any) => prev ? {
          ...prev,
          activities: (prev.activities || []).map((a: any) => a.id === actId ? { ...a, is_published: updated.is_published } : a)
        } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Move Activity Up / Down (Reorder)
  const handleMoveActivity = async (dayId: string, index: number, direction: 'UP' | 'DOWN') => {
    if (!editDayModal || !editDayModal.activities) return;
    const activities = [...editDayModal.activities];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activities.length) return;

    const temp = activities[index];
    activities[index] = activities[targetIndex];
    activities[targetIndex] = temp;

    setEditDayModal({
      ...editDayModal,
      activities
    });

    try {
      const activityIds = activities.map(a => a.id);
      await fetch(`/api/festival-admin/days/${dayId}/reorder-activities`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ activity_ids: activityIds })
      });
      fetchDays();
    } catch (err) {
      console.error(err);
    }
  };

  // Save Edited Activity
  const handleSaveEditedActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity) return;
    try {
      const res = await fetch(`/api/festival-admin/activities/${editingActivity.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title_telugu: editingActivity.title_telugu,
          title_english: editingActivity.title_english || undefined,
          time_str: editingActivity.time_str || undefined,
          time_str_english: editingActivity.time_str_english || undefined,
          allowed_participation_types: editingActivity.allowed_participation_types || ['COUPLE'],
          who_can_participate_telugu: editingActivity.who_can_participate_telugu || undefined,
          who_can_participate_english: editingActivity.who_can_participate_english || undefined,
          what_to_bring_telugu: editingActivity.what_to_bring_telugu || undefined,
          what_to_bring_english: editingActivity.what_to_bring_english || undefined,
          participation_instructions_telugu: editingActivity.participation_instructions_telugu || undefined,
          participation_instructions_english: editingActivity.participation_instructions_english || undefined,
          arrival_instructions_telugu: editingActivity.arrival_instructions_telugu || undefined,
          arrival_instructions_english: editingActivity.arrival_instructions_english || undefined
        })
      });
      if (res.ok) {
        const updated = await res.json();
        fetchDays();
        setEditDayModal((prev: any) => prev ? {
          ...prev,
          activities: (prev.activities || []).map((a: any) => a.id === updated.id ? updated : a)
        } : null);
        setEditingActivity(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Activity
  const handleDeleteActivity = async (actId: string) => {
    if (!confirm(lang === 'en' ? 'Delete this activity?' : 'ఈ కార్యక్రమాన్ని తొలగించాలా?')) return;
    try {
      const res = await fetch(`/api/festival-admin/activities/${actId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDays();
        setEditDayModal((prev: any) => prev ? {
          ...prev,
          activities: (prev.activities || []).filter((a: any) => a.id !== actId)
        } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Add Material Modal
  const openAddMaterialModal = () => {
    setEditingMaterial(null);
    setMaterialForm({
      item_name_english: '',
      item_name_telugu: '',
      quantity: '',
      unit: '',
      unit_telugu: '',
      instructions_english: '',
      instructions_telugu: '',
      provided_by: 'DEVOTEES',
      programme_activity_id: '',
      is_published: true
    });
    setMaterialModal(true);
  };

  // Open Edit Material Modal
  const openEditMaterialModal = (m: any) => {
    setEditingMaterial(m);
    setMaterialForm({
      item_name_english: m.item_name_english || '',
      item_name_telugu: m.item_name_telugu || '',
      quantity: m.quantity || '',
      unit: m.unit || '',
      unit_telugu: m.unit_telugu || '',
      instructions_english: m.instructions_english || '',
      instructions_telugu: m.instructions_telugu || '',
      provided_by: m.provided_by || 'DEVOTEES',
      programme_activity_id: m.programme_activity_id || '',
      is_published: m.is_published !== false
    });
    setMaterialModal(true);
  };

  // Save Puja Material (Add or Edit Modal)
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDayModal) return;
    const teName = materialForm.item_name_telugu.trim() || materialForm.item_name_english.trim();
    if (!teName) {
      alert(lang === 'en' ? 'Item name is required.' : 'సామగ్రి పేరు తప్పనిసరి.');
      return;
    }
    try {
      const payload = {
        item_name_telugu: teName,
        item_name_english: materialForm.item_name_english.trim() || undefined,
        quantity: materialForm.quantity.trim() || undefined,
        unit: materialForm.unit.trim() || undefined,
        unit_telugu: materialForm.unit_telugu.trim() || undefined,
        instructions_telugu: materialForm.instructions_telugu.trim() || undefined,
        instructions_english: materialForm.instructions_english.trim() || undefined,
        provided_by: materialForm.provided_by || 'DEVOTEES',
        programme_activity_id: materialForm.programme_activity_id || undefined,
        is_published: materialForm.is_published !== false
      };

      let res;
      if (editingMaterial) {
        res = await fetch(`/api/festival-admin/materials/${editingMaterial.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`/api/festival-admin/days/${editDayModal.id}/materials`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        fetchDayMaterials(editDayModal.id);
        setMaterialModal(false);
        setEditingMaterial(null);
        setMsg({ type: 'success', text: lang === 'en' ? 'Puja material saved successfully!' : 'పూజా సామగ్రి విజయవంతంగా భద్రపరచబడింది!' });
      } else {
        const err = await res.json();
        alert(err.detail || 'Error saving material');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error saving material');
    }
  };

  // Quick Add Puja Material directly from the inline form
  const handleSaveInlineMaterial = async () => {
    if (!editDayModal) return;
    const teName = materialForm.item_name_telugu.trim() || materialForm.item_name_english.trim();
    if (!teName) {
      alert(lang === 'en' ? 'Please enter material name (Telugu or English).' : 'దయచేసి పూజా సామగ్రి పేరును నమోదు చేయండి.');
      return;
    }
    try {
      const payload = {
        item_name_telugu: teName,
        item_name_english: materialForm.item_name_english.trim() || undefined,
        quantity: materialForm.quantity.trim() || undefined,
        unit: materialForm.unit.trim() || undefined,
        unit_telugu: materialForm.unit_telugu.trim() || undefined,
        instructions_telugu: materialForm.instructions_telugu.trim() || undefined,
        instructions_english: materialForm.instructions_english.trim() || undefined,
        provided_by: materialForm.provided_by || 'DEVOTEES',
        programme_activity_id: materialForm.programme_activity_id || undefined,
        is_published: materialForm.is_published !== false
      };

      const res = await fetch(`/api/festival-admin/days/${editDayModal.id}/materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fetchDayMaterials(editDayModal.id);
        setMaterialForm({
          item_name_english: '',
          item_name_telugu: '',
          quantity: '',
          unit: '',
          unit_telugu: '',
          instructions_english: '',
          instructions_telugu: '',
          provided_by: 'DEVOTEES',
          programme_activity_id: '',
          is_published: true
        });
        setMsg({
          type: 'success',
          text: lang === 'en' ? 'Puja material added successfully!' : 'పూజా సామగ్రి విజయవంతంగా జతచేయబడింది!'
        });
      } else {
        const err = await res.json();
        alert(err.detail || 'Error saving material');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error saving material');
    }
  };

  // Move Material Up / Down
  const handleMoveMaterial = async (index: number, direction: 'UP' | 'DOWN') => {
    if (!editDayModal || !dayMaterials) return;
    const items = [...dayMaterials];
    const target = direction === 'UP' ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;

    const temp = items[index];
    items[index] = items[target];
    items[target] = temp;
    setDayMaterials(items);

    try {
      const material_ids = items.map(m => m.id);
      await fetch(`/api/festival-admin/days/${editDayModal.id}/materials/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ material_ids })
      });
      fetchDayMaterials(editDayModal.id);
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Material Publish
  const handleToggleMaterialPublish = async (materialId: string) => {
    try {
      const res = await fetch(`/api/festival-admin/materials/${materialId}/toggle-publish`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok && editDayModal) {
        fetchDayMaterials(editDayModal.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Material
  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm(lang === 'en' ? 'Delete this puja material entry?' : 'ఈ పూజా సామగ్రిని తొలగించాలా?')) return;
    try {
      const res = await fetch(`/api/festival-admin/materials/${materialId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok && editDayModal) {
        fetchDayMaterials(editDayModal.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Add Couple/Participant Modal
  const openAddCoupleModal = () => {
    setEditingCouple(null);
    setParticipantType('COUPLE');
    setPerson1('');
    setPerson1Telugu('');
    setPerson2('');
    setPerson2Telugu('');
    setFamilyDisplay('');
    setFamilyDisplayTelugu('');
    setParticipantActivityId('');
    setAddCoupleModal(true);
  };

  // Open Edit Couple/Participant Modal
  const openEditCoupleModal = (c: any) => {
    setEditingCouple(c);
    setParticipantType(c.participant_type || 'COUPLE');
    setPerson1(c.person1_name || '');
    setPerson1Telugu(c.person1_name_telugu || '');
    setPerson2(c.person2_name || '');
    setPerson2Telugu(c.person2_name_telugu || '');
    setFamilyDisplay(c.family_display_name || '');
    setFamilyDisplayTelugu(c.family_display_name_telugu || '');
    setParticipantActivityId(c.programme_activity_id || '');
    setAddCoupleModal(true);
  };

  // Save Participant / Couple (Add or Edit)
  const handleSaveParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDayId) return;
    try {
      const payload = {
        participant_type: participantType,
        person1_name: person1.trim() || (lang === 'te' ? 'భక్తులు' : 'Devotee'),
        person1_name_telugu: person1Telugu.trim() || undefined,
        person2_name: (participantType === 'COUPLE' && person2.trim()) ? person2.trim() : undefined,
        person2_name_telugu: (participantType === 'COUPLE' && person2Telugu.trim()) ? person2Telugu.trim() : undefined,
        family_display_name: familyDisplay.trim() || undefined,
        family_display_name_telugu: familyDisplayTelugu.trim() || undefined,
        programme_activity_id: participantActivityId || undefined,
        is_published: true
      };

      let res;
      if (editingCouple) {
        res = await fetch(`/api/festival-admin/pooja-couples/${editingCouple.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`/api/festival-admin/days/${selectedDayId}/pooja-couples`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setAddCoupleModal(false);
        setEditingCouple(null);
        setPerson1('');
        setPerson1Telugu('');
        setPerson2('');
        setPerson2Telugu('');
        setFamilyDisplay('');
        setFamilyDisplayTelugu('');
        setParticipantActivityId('');
        fetchCouples(selectedDayId);
        setMsg({ type: 'success', text: lang === 'en' ? 'Participant details saved successfully!' : 'పూజా భాగస్వాముల వివరాలు భద్రపరచబడ్డాయి!' });
      } else {
        const err = await res.json();
        setMsg({ type: 'error', text: err.detail || 'నమోదు విఫలమైంది.' });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'దంపతుల నమోదు విఫలమైంది.' });
    }
  };

  // Delete Pooja Couple
  const handleDeleteCouple = async (coupleId: string) => {
    if (!confirm('ఈ దంపతుల వివరాలను తొలగించాలా?')) return;
    try {
      const res = await fetch(`/api/festival-admin/pooja-couples/${coupleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchCouples(selectedDayId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Upload Day Photo
  const handlePhotoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !selectedDayId) return;

    setUploadingProgress(true);
    setMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      if (photoTitle) formData.append('title', photoTitle);
      if (photoCaption) formData.append('caption', photoCaption);
      formData.append('is_published', 'true');

      const res = await fetch(`/api/festival-admin/days/${selectedDayId}/photos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        setUploadFile(null);
        setPhotoTitle('');
        setPhotoCaption('');
        fetchPhotos(selectedDayId);
        setMsg({ type: 'success', text: 'ఫోటో విజయవంతంగా అప్‌లోడ్ చేయబడింది!' });
      } else {
        const data = await res.json();
        throw new Error(data.detail || 'అప్‌లోడ్ విఫలమైంది');
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'ఫోటో అప్‌లోడ్ విఫలమైంది' });
    } finally {
      setUploadingProgress(false);
    }
  };

  // Toggle Photo Publish
  const handleTogglePhotoPublish = async (photoId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/festival-admin/photos/${photoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_published: !currentStatus })
      });
      if (res.ok) fetchPhotos(selectedDayId);
    } catch (err) {
      console.error(err);
    }
  };

  // Set Cover Photo
  const handleSetCoverPhoto = async (photoId: string) => {
    try {
      const res = await fetch(`/api/festival-admin/photos/${photoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_cover: true })
      });
      if (res.ok) fetchPhotos(selectedDayId);
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Photo
  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('ఈ ఫోటోను తొలగించాలా?')) return;
    try {
      const res = await fetch(`/api/festival-admin/photos/${photoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchPhotos(selectedDayId);
    } catch (err) {
      console.error(err);
    }
  };

  // Create Announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/festival-admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title_telugu: annTitle,
          content_telugu: annContent,
          is_published: true
        })
      });
      if (res.ok) {
        setAddAnnModal(false);
        setAnnTitle('');
        setAnnContent('');
        fetchAnnouncements();
        setMsg({ type: 'success', text: 'ప్రకటన విజయవంతంగా నమోదు చేయబడింది!' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'ప్రకటన నమోదు విఫలమైంది.' });
    }
  };

  // Delete Announcement
  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('ఈ ప్రకటనను తొలగించాలా?')) return;
    try {
      const res = await fetch(`/api/festival-admin/announcements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchAnnouncements();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto selection:bg-orange-500 selection:text-white">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-orange-200 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-medium text-slate-900 flex items-center gap-2">
            🌺 {lang === 'en' ? 'Garuvupalem Devi Navaratri Festival Management' : 'గరువుపాలెం దేవీ నవరాత్రుల నిర్వహణ కేంద్రం'}
          </h1>
          <p className="text-sm font-medium text-orange-800 mt-1">
            {lang === 'en' ? 'Sri Durga Bhavani Youth — 31st Devi Sharannavaratri Mahotsavam 2026' : 'శ్రీ దుర్గాభవాని యూత్ — 31వ దేవీ శరన్నవరాత్రి మహోత్సవములు 2026'}
          </p>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-2xl text-sm font-medium border flex items-center gap-2 ${
          msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300'
        }`}>
          {msg.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {msg.text}
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-orange-200">
        <button
          onClick={() => setActiveTab('DAYS')}
          className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'DAYS' ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-orange-50 border border-orange-200'
          }`}
        >
          <Calendar className="h-4 w-4" /> {lang === 'en' ? '12-Day Schedule & Alankarams' : '12 రోజుల కార్యక్రమాలు & అలంకారాలు'}
        </button>
        <button
          onClick={() => setActiveTab('COUPLES')}
          className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'COUPLES' ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-orange-50 border border-orange-200'
          }`}
        >
          <Heart className="h-4 w-4" /> {lang === 'en' ? 'Pooja Couples' : 'పూజా దంపతులు'}
        </button>
        <button
          onClick={() => setActiveTab('PHOTOS')}
          className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'PHOTOS' ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-orange-50 border border-orange-200'
          }`}
        >
          <ImageIcon className="h-4 w-4" /> {lang === 'en' ? 'Festival Gallery' : 'ఉత్సవ చిత్రమాలిక (Gallery)'}
        </button>
        <button
          onClick={() => setActiveTab('ANNOUNCEMENTS')}
          className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'ANNOUNCEMENTS' ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-orange-50 border border-orange-200'
          }`}
        >
          <Bell className="h-4 w-4" /> {lang === 'en' ? 'Announcements & Notices' : 'ప్రకటనలు & సూచనలు'}
        </button>
        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'SETTINGS' ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-orange-50 border border-orange-200'
          }`}
        >
          <SettingsIcon className="h-4 w-4" /> {lang === 'en' ? 'Phone Numbers & Settings' : 'ఫోన్ నంబర్లు & సెట్టింగ్స్'}
        </button>
      </div>

      {/* TAB 1: DAYS & SCHEDULE */}
      {activeTab === 'DAYS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {days.map((day) => (
              <div key={day.id} className="bg-white p-5 rounded-3xl border border-orange-200 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium px-3 py-1 bg-orange-600 text-white rounded-full">
                    {getDayBadgeLabel(day.day_number)}
                  </span>
                  <span className="text-xs sm:text-sm font-normal text-slate-600">{day.date}</span>
                </div>
                <h3 className="text-lg font-medium text-slate-900">
                  {lang === 'en' ? (day.alankaram_name_english || day.alankaram_name_telugu) : day.alankaram_name_telugu}
                </h3>
                {(day.description_english || day.description_telugu) && (
                  <p className="text-sm text-slate-600 font-normal leading-relaxed">
                    {lang === 'en' ? (day.description_english || day.description_telugu) : day.description_telugu}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium pt-2 border-t border-orange-100">
                  <span className={`px-2.5 py-0.5 rounded-full ${day.is_completed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {day.is_completed 
                      ? (lang === 'en' ? 'Completed' : 'పూర్తయింది') 
                      : (lang === 'en' ? 'Upcoming' : 'రాబోవు రోజు')}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full ${day.is_published ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'}`}>
                    {day.is_published 
                      ? (lang === 'en' ? 'Published' : 'ప్రచురించబడింది') 
                      : (lang === 'en' ? 'Draft' : 'దాచబడింది')}
                  </span>
                </div>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-normal text-slate-500">
                    {day.activities_count} {lang === 'en' ? 'Activities' : 'కార్యక్రమాలు'}
                  </span>
                  <button
                    onClick={() => {
                      setEditDayModal(day);
                      fetchDayMaterials(day.id);
                    }}
                    className="px-3.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-900 rounded-xl text-sm font-medium border border-orange-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> {lang === 'en' ? 'Edit' : 'సవరించు'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: POOJA COUPLES & PARTICIPANTS */}
      {activeTab === 'COUPLES' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-orange-200">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-sm font-medium text-slate-800 shrink-0">
                {lang === 'en' ? 'Select Festival Day:' : 'ఉత్సవ రోజును ఎంచుకోండి:'}
              </label>
              <select
                value={selectedDayId}
                onChange={(e) => setSelectedDayId(e.target.value)}
                className="bg-orange-50 border border-orange-300 rounded-xl px-3 py-2 text-sm font-normal text-slate-900 focus:outline-none"
              >
                {days.map((d) => (
                  <option key={d.id} value={d.id}>
                    {getDayBadgeLabel(d.day_number)} ({d.date}) - {lang === 'en' ? (d.alankaram_name_english || d.alankaram_name_telugu) : d.alankaram_name_telugu}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={openAddCoupleModal}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" /> {lang === 'en' ? 'Add Pooja Couple / Participant' : 'కొత్త పూజా దంపతులు / భాగస్వామిని జతచేయి'}
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-orange-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-orange-50 border-b border-orange-200">
              <h3 className="text-base font-medium text-slate-900">
                {lang === 'en' 
                  ? `Registered Pooja Couples & Participants (${poojaCouples.length})` 
                  : `ఈ రోజుకు నమోదైన పూజా దంపతులు & భాగస్వాముల జాబితా (${poojaCouples.length})`}
              </h3>
            </div>
            <ul className="divide-y divide-orange-100">
              {poojaCouples.map((c) => {
                const isIndiv = c.participant_type === 'INDIVIDUAL';
                const isFamily = c.participant_type === 'FAMILY';
                const isOpen = c.participant_type === 'OPEN_TO_ALL';

                const typeBadge = isIndiv
                  ? { label: lang === 'en' ? 'Individual' : 'వ్యక్తి', bg: 'bg-purple-100 text-purple-800' }
                  : isFamily
                  ? { label: lang === 'en' ? 'Family' : 'కుటుంబం', bg: 'bg-emerald-100 text-emerald-800' }
                  : isOpen
                  ? { label: lang === 'en' ? 'Open to All' : 'అందరికీ', bg: 'bg-blue-100 text-blue-800' }
                  : { label: lang === 'en' ? 'Couple' : 'దంపతులు', bg: 'bg-amber-100 text-amber-800' };

                return (
                  <li key={c.id} className="p-4 flex items-center justify-between hover:bg-orange-50/50 gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${typeBadge.bg}`}>
                          {typeBadge.label}
                        </span>
                        <p className="text-sm sm:text-base font-medium text-slate-900">
                          🌺 {c.participant_type === 'COUPLE' || !c.participant_type
                            ? `${lang === 'en' ? 'Smt. & Sri ' : 'శ్రీమతి & శ్రీ '}${c.person1_name} ${c.person2_name ? `& ${c.person2_name}` : ''}`
                            : (c.person1_name_telugu || c.person1_name)}
                        </p>
                      </div>

                      {c.family_display_name && (
                        <p className="text-xs sm:text-sm font-normal text-orange-900">
                          {c.family_display_name_telugu || c.family_display_name}
                        </p>
                      )}

                      {(c.person1_name_telugu && c.person1_name !== c.person1_name_telugu) && (
                        <p className="text-xs text-slate-500">
                          {c.person1_name} {c.person2_name && `& ${c.person2_name}`}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => openEditCoupleModal(c)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                        title={lang === 'en' ? 'Edit' : 'సవరించు'}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCouple(c.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        title={lang === 'en' ? 'Delete' : 'తొలగించు'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
              {poojaCouples.length === 0 && (
                <li className="p-8 text-center text-sm font-normal text-slate-500">
                  {lang === 'en' ? 'No couples or participants registered for this day.' : 'ఈ రోజుకు ఎటువంటి దంపతులు లేదా భాగస్వాముల పేర్లు నమోదు కాలేదు.'}
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* TAB 3: PHOTOS & GALLERY */}
      {activeTab === 'PHOTOS' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-orange-200">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-sm font-medium text-slate-800 shrink-0">
                {lang === 'en' ? 'Select Festival Day:' : 'ఉత్సవ రోజును ఎంచుకోండి:'}
              </label>
              <select
                value={selectedDayId}
                onChange={(e) => setSelectedDayId(e.target.value)}
                className="bg-orange-50 border border-orange-300 rounded-xl px-3 py-2 text-sm font-normal text-slate-900 focus:outline-none"
              >
                {days.map((d) => (
                  <option key={d.id} value={d.id}>
                    {getDayBadgeLabel(d.day_number)} ({d.date}) - {lang === 'en' ? (d.alankaram_name_english || d.alankaram_name_telugu) : d.alankaram_name_telugu}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Photo Upload Form */}
          <div className="bg-white p-6 rounded-3xl border border-orange-200 shadow-sm space-y-4">
            <h3 className="text-base font-medium text-slate-900 flex items-center gap-2">
              <Upload className="h-4 w-4 text-orange-600" /> {lang === 'en' ? 'Upload New Festival Photo' : 'నూతన ఉత్సవ ఫోటోను అప్‌లోడ్ చేయండి'}
            </h3>
            <form onSubmit={handlePhotoUpload} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm font-normal">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  {lang === 'en' ? 'Photo File (JPG, PNG, WebP)' : 'ఫోటో ఫైల్ (JPG, PNG, WebP)'}
                </label>
                <input 
                  type="file" 
                  required 
                  accept="image/*"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)} 
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 text-sm font-normal"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  {lang === 'en' ? 'Title / Caption' : 'శీర్షిక (Title / Caption)'}
                </label>
                <input 
                  type="text" 
                  value={photoTitle} 
                  onChange={(e) => setPhotoTitle(e.target.value)} 
                  placeholder={lang === 'en' ? 'e.g. Sri Alankara Darshanam' : 'ఉదా: శ్రీ అలంకార దర్శనం'}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm font-normal" 
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={uploadingProgress}
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  {uploadingProgress 
                    ? (lang === 'en' ? 'Uploading...' : 'అప్‌లోడ్ అవుతున్నది...') 
                    : (lang === 'en' ? 'Upload Photo to Gallery' : 'ఫోటోను గ్యాలరీలోకి అప్‌లోడ్ చేయి')}
                </button>
              </div>
            </form>
          </div>

          {/* Photo Album List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((p) => (
              <div key={p.id} className="bg-white rounded-3xl border border-orange-200 overflow-hidden shadow-sm flex flex-col justify-between">
                <div className="h-48 overflow-hidden relative">
                  <img src={p.url} alt={p.title} className="w-full h-full object-cover" />
                  {p.is_cover && (
                    <span className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-medium px-2 py-0.5 rounded-full shadow">
                      {lang === 'en' ? 'Cover Photo' : 'మొదటి ఫోటో (Cover)'}
                    </span>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <p className="text-sm font-medium text-slate-900 truncate">{p.title}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-orange-100">
                    <button
                      onClick={() => handleTogglePhotoPublish(p.id, p.is_published)}
                      className={`p-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 cursor-pointer ${
                        p.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {p.is_published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      {p.is_published 
                        ? (lang === 'en' ? 'Public' : 'బహిరంగం') 
                        : (lang === 'en' ? 'Hidden' : 'రహస్యం')}
                    </button>
                    <button
                      onClick={() => handleSetCoverPhoto(p.id)}
                      className="p-1.5 text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg cursor-pointer"
                    >
                      {lang === 'en' ? 'Set Cover' : 'Coverగా చేయి'}
                    </button>
                    <button
                      onClick={() => handleDeletePhoto(p.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {photos.length === 0 && (
              <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-orange-200 text-sm font-normal text-slate-500">
                {lang === 'en' ? 'No photos uploaded for this day.' : 'ఈ రోజుకు ఎటువంటి ఫోటోలు అప్‌లోడ్ కాలేదు.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ANNOUNCEMENTS */}
      {activeTab === 'ANNOUNCEMENTS' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-orange-200">
            <h3 className="text-base font-medium text-slate-900">
              {lang === 'en' 
                ? `Festival Announcements Management (${announcements.length})` 
                : `ఉత్సవ ప్రకటనల నిర్వహణ (${announcements.length})`}
            </h3>
            <button
              onClick={() => setAddAnnModal(true)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" /> {lang === 'en' ? 'Create New Announcement' : 'కొత్త ప్రకటన రాయండి'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map((ann) => (
              <div key={ann.id} className="bg-white p-5 rounded-3xl border border-orange-200 space-y-2 shadow-sm relative">
                <div className="flex items-center justify-between">
                  <h4 className="text-base sm:text-lg font-medium text-slate-900">
                    {lang === 'en' ? (ann.title_english || ann.title_telugu) : ann.title_telugu}
                  </h4>
                  <button onClick={() => handleDeleteAnnouncement(ann.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-xl cursor-pointer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm sm:text-base text-slate-700 font-normal leading-relaxed whitespace-pre-line">
                  {lang === 'en' ? (ann.content_english || ann.content_telugu) : ann.content_telugu}
                </p>
                <p className="text-xs font-normal text-slate-400 pt-2">{ann.created_at}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: COMMITTEE CONTACTS & SETTINGS */}
      {activeTab === 'SETTINGS' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Section 1: Committee Photo Logo Management */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-orange-200 shadow-sm space-y-5">
            <div className="space-y-1 border-b border-orange-200 pb-3">
              <h3 className="text-lg sm:text-xl font-medium text-slate-900 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-orange-600" /> {lang === 'en' ? 'Committee Photo Logo' : 'కమిటీ అధికారిక ఫోటో లోగో (Committee Photo Logo)'}
              </h3>
              <p className="text-sm font-normal text-slate-600 leading-relaxed">
                {lang === 'en' 
                  ? 'Official circular emblem displayed in the website navigation, footer, login, and portal sidebar.' 
                  : 'వెబ్‌సైట్ నావిగేషన్, ఫుటర్, కమిటీ లాగిన్ మరియు పోర్టల్ సైడ్‌బార్‌లో కనిపించే అమ్మవారి అధికారిక వృత్తాకార చిహ్నం (Circular Emblem).'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-orange-400 bg-orange-50 flex items-center justify-center shadow-md p-0.5">
                  <img 
                    src={logoPhotoPreview || settings.logo_url || '/committee-photo-logo.webp'} 
                    alt="Committee Logo Preview" 
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <span className="text-xs font-medium text-slate-500">
                  {lang === 'en' ? 'Logo Preview' : 'లోగో ప్రివ్యూ'}
                </span>
              </div>

              <form onSubmit={handleLogoPhotoUpload} className="space-y-3 flex-1 w-full text-sm">
                <div>
                  <label className="block mb-1 font-medium text-slate-800">
                    {lang === 'en' ? 'Select New Logo Image (JPG, PNG, WebP)' : 'కొత్త లోగో చిత్రాన్ని ఎంచుకోండి (JPG, PNG, WebP)'}
                  </label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setLogoPhotoFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setLogoPhotoPreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-normal text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!logoPhotoFile || uploadingLogoPhoto}
                  className={`w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    !logoPhotoFile || uploadingLogoPhoto
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm'
                  }`}
                >
                  <Upload className="h-4 w-4" /> 
                  {uploadingLogoPhoto 
                    ? (lang === 'en' ? 'Uploading...' : 'అప్‌లోడ్ అవుతోంది...') 
                    : (lang === 'en' ? 'Save Logo Photo' : 'లోగో ఫోటోను భద్రపరుచు (Save Logo Photo)')}
                </button>
              </form>
            </div>
          </div>

          {/* Section 2: Hero Photograph Management */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-orange-200 shadow-sm space-y-5">
            <div className="space-y-1 border-b border-orange-200 pb-3">
              <h3 className="text-lg sm:text-xl font-medium text-slate-900 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-orange-600" /> {lang === 'en' ? 'Festival Hero Photograph' : 'ఉత్సవ ప్రధాన చిత్రం (Hero Photograph)'}
              </h3>
              <p className="text-sm font-normal text-slate-600 leading-relaxed">
                {lang === 'en' 
                  ? 'Update the Sri Kanaka Durga Ammavari Moolavirat photograph displayed at the top of the homepage.' 
                  : 'హోమ్‌పేజీ పైభాగంలో భక్తులకు కనిపించే శ్రీ కనకదుర్గా అమ్మవారి మూలవిరాట్ / నిజరూప చిత్రపటాన్ని ఇక్కడ అప్‌లోడ్ చేసి మార్చవచ్చు.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-40 h-48 rounded-2xl overflow-hidden border-2 border-orange-200 bg-orange-50 shrink-0 flex items-center justify-center shadow-xs">
                <img 
                  src={heroPhotoPreview || settings.banner_image_url || '/ammavaru-hero-green.webp'} 
                  alt="Hero Deity Preview" 
                  className="w-full h-full object-cover"
                />
              </div>

              <form onSubmit={handleHeroPhotoUpload} className="space-y-3 flex-1 w-full text-sm">
                <div>
                  <label className="block mb-1 font-medium text-slate-800">
                    {lang === 'en' ? 'Select New Deity Photo (JPG, PNG, WebP)' : 'కొత్త చిత్రాన్ని ఎంచుకోండి (JPG, PNG, WebP)'}
                  </label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setHeroPhotoFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setHeroPhotoPreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-normal text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!heroPhotoFile || uploadingHeroPhoto}
                  className={`w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    !heroPhotoFile || uploadingHeroPhoto
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm'
                  }`}
                >
                  <Upload className="h-4 w-4" /> 
                  {uploadingHeroPhoto 
                    ? (lang === 'en' ? 'Uploading...' : 'అప్‌లోడ్ అవుతోంది...') 
                    : (lang === 'en' ? 'Upload Hero Photo' : 'హీరో ఫోటోను భద్రపరుచు (Upload Hero Photo)')}
                </button>
              </form>
            </div>
          </div>

          {/* Section 3: Committee Contacts & Festival Title */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-orange-200 shadow-sm space-y-6">
            <div className="space-y-1 border-b border-orange-200 pb-4">
              <h3 className="text-lg sm:text-xl font-medium text-slate-900 flex items-center gap-2">
                <Phone className="h-5 w-5 text-orange-600" /> {lang === 'en' ? 'Committee Contact Phone Numbers' : 'కమిటీ సంప్రదింపు ఫోన్ నంబర్లు'}
              </h3>
              <p className="text-sm font-normal text-slate-600 leading-relaxed">
                {lang === 'en' 
                  ? 'Configure the 3 Tap-to-Call emergency and committee contact phone numbers shown on the portal and website.' 
                  : 'సందర్శకుల వెబ్‌సైట్‌లో Tap-to-Call ద్వారా సంప్రదించేలా 3 ఫోన్ నంబర్లను ఇక్కడ సవరించవచ్చు.'}
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-sm font-normal text-slate-800">
              <div>
                <label className="block mb-1 font-medium">
                  {lang === 'en' ? 'Festival Title' : 'ఉత్సవ శీర్షిక (Festival Title)'}
                </label>
                <input 
                  type="text" 
                  value={settings.festival_name}
                  onChange={(e) => setSettings({ ...settings, festival_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-orange-500 font-normal text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  {lang === 'en' ? 'Village Address' : 'గ్రామ చిరునామా (Village Address)'}
                </label>
                <input 
                  type="text" 
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-orange-500 font-normal text-sm sm:text-base"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block mb-1 font-medium text-orange-900">
                    {lang === 'en' ? 'Committee Contact 1 (Phone 1)' : 'కమిటీ సంప్రదింపు 1 (Phone 1)'}
                  </label>
                  <input 
                    type="text" 
                    value={settings.contact1}
                    onChange={(e) => setSettings({ ...settings, contact1: e.target.value })}
                    placeholder="8897557545"
                    className="w-full bg-orange-50 border border-orange-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-orange-500 font-normal text-sm"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-orange-900">
                    {lang === 'en' ? 'Committee Contact 2 (Phone 2)' : 'కమిటీ సంప్రదింపు 2 (Phone 2)'}
                  </label>
                  <input 
                    type="text" 
                    value={settings.contact2}
                    onChange={(e) => setSettings({ ...settings, contact2: e.target.value })}
                    placeholder="9912844424"
                    className="w-full bg-orange-50 border border-orange-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-orange-500 font-normal text-sm"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-orange-900">
                    {lang === 'en' ? 'Committee Contact 3 (Phone 3)' : 'కమిటీ సంప్రదింపు 3 (Phone 3)'}
                  </label>
                  <input 
                    type="text" 
                    value={settings.contact3}
                    onChange={(e) => setSettings({ ...settings, contact3: e.target.value })}
                    placeholder="9963397056"
                    className="w-full bg-orange-50 border border-orange-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-orange-500 font-normal text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-base font-medium shadow-md flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                <Save className="h-4 w-4" /> 
                {loading 
                  ? (lang === 'en' ? 'Saving...' : 'భద్రపరుస్తున్నాము...') 
                  : (lang === 'en' ? 'Save Settings' : 'మార్పులను భద్రపరుచు (Save Settings)')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT DAY */}
      {editDayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-orange-200">
            <div className="flex items-center justify-between border-b border-orange-100 pb-3">
              <h3 className="text-lg sm:text-xl font-medium text-slate-900">
                {lang === 'en' 
                  ? `Edit ${getDayBadgeLabel(editDayModal.day_number)} - ${editDayModal.date}` 
                  : `${getDayBadgeLabel(editDayModal.day_number)} సవరణ - ${editDayModal.date}`}
              </h3>
              <button 
                onClick={() => setEditDayModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm font-normal text-slate-800">
              {/* Alankaram Titles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-medium">{lang === 'en' ? 'Alankaram Name (Telugu) *' : 'అలంకారం పేరు (తెలుగు) *'}</label>
                  <input
                    type="text"
                    value={editDayModal.alankaram_name_telugu || ''}
                    onChange={(e) => setEditDayModal({ ...editDayModal, alankaram_name_telugu: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-normal"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Alankaram Name (English)</label>
                  <input
                    type="text"
                    value={editDayModal.alankaram_name_english || ''}
                    onChange={(e) => setEditDayModal({ ...editDayModal, alankaram_name_english: e.target.value })}
                    placeholder="e.g. Sri Bala Tripura Sundari"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-normal"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-medium">{lang === 'en' ? 'Significance / Description (Telugu)' : 'వివరాలు / ప్రాముఖ్యత (తెలుగు)'}</label>
                  <textarea
                    value={editDayModal.description_telugu || ''}
                    onChange={(e) => setEditDayModal({ ...editDayModal, description_telugu: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 h-20 resize-none text-sm font-normal leading-relaxed"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Significance / Notes (English)</label>
                  <textarea
                    value={editDayModal.description_english || ''}
                    onChange={(e) => setEditDayModal({ ...editDayModal, description_english: e.target.value })}
                    placeholder="Significance of this alankaram in English..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 h-20 resize-none text-sm font-normal leading-relaxed"
                  />
                </div>
              </div>

              {/* Status checkboxes */}
              <div className="flex items-center gap-6 pt-1 bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={editDayModal.is_completed}
                    onChange={(e) => setEditDayModal({ ...editDayModal, is_completed: e.target.checked })}
                    className="h-4 w-4 text-orange-600 rounded"
                  />
                  <span>{lang === 'en' ? 'Day Completed' : 'రోజు ముగిసినది (Completed)'}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={editDayModal.is_published}
                    onChange={(e) => setEditDayModal({ ...editDayModal, is_published: e.target.checked })}
                    className="h-4 w-4 text-orange-600 rounded"
                  />
                  <span>{lang === 'en' ? 'Show Publicly (Published)' : 'బహిరంగంగా చూపించు (Published)'}</span>
                </label>
              </div>

              {/* Day Activities List & Add Activity Form */}
              <div className="space-y-3 pt-2 border-t border-orange-100">
                <h4 className="text-sm font-medium text-slate-900 flex items-center justify-between">
                  <span>{lang === 'en' ? 'Pooja & Cultural Activities for this day' : 'ఈ రోజు పూజా & సాంస్కృతిక కార్యక్రమాలు (Activities)'}</span>
                  <span className="text-slate-500 font-normal">({editDayModal.activities?.length || 0})</span>
                </h4>

                {/* Existing activities list */}
                {Array.isArray(editDayModal.activities) && editDayModal.activities.length > 0 ? (
                  <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {editDayModal.activities.map((act: any, idx: number) => (
                      <li key={act.id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm gap-2">
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900 truncate">
                              {lang === 'en' ? (act.title_english || act.title_telugu) : act.title_telugu}
                            </p>
                            {!act.is_published && (
                              <span className="text-xs bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded font-normal shrink-0">
                                {lang === 'en' ? 'Hidden' : 'దాచబడింది'}
                              </span>
                            )}
                          </div>
                          {lang !== 'en' && act.title_english && <p className="text-xs text-slate-500 truncate">{act.title_english}</p>}
                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="text-xs text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded font-medium">
                              {lang === 'en' 
                                ? (act.time_str_english || act.time_str || 'Time TBD') 
                                : (act.time_str || 'సమయం త్వరలో')}
                            </span>
                            {lang !== 'en' && act.time_str_english && (
                              <span className="text-xs text-slate-600 bg-slate-200/80 px-1.5 py-0.5 rounded font-normal">
                                {act.time_str_english}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons: Move Up, Move Down, Toggle Publish, Edit, Delete */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveActivity(editDayModal.id, idx, 'UP')}
                            disabled={idx === 0}
                            className={`p-1.5 rounded-lg ${idx === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-200 cursor-pointer'}`}
                            title={lang === 'en' ? "Move Up" : "పైకి తరలించు (Move Up)"}
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveActivity(editDayModal.id, idx, 'DOWN')}
                            disabled={idx === editDayModal.activities.length - 1}
                            className={`p-1.5 rounded-lg ${idx === editDayModal.activities.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-200 cursor-pointer'}`}
                            title={lang === 'en' ? "Move Down" : "క్రిందికి తరలించు (Move Down)"}
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleActivityPublish(act.id)}
                            className={`p-1.5 rounded-lg cursor-pointer ${act.is_published ? 'text-emerald-700 hover:bg-emerald-50' : 'text-stone-400 hover:bg-stone-200'}`}
                            title={act.is_published ? (lang === 'en' ? "Unpublish" : "దాచు") : (lang === 'en' ? "Publish" : "ప్రకటించు")}
                          >
                            {act.is_published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingActivity(act)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                            title={lang === 'en' ? "Edit Activity" : "సవరించు (Edit Activity)"}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteActivity(act.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                            title={lang === 'en' ? "Delete Activity" : "కార్యక్రమాన్ని తొలగించు (Delete)"}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 italic py-1">
                    {lang === 'en' ? 'No activities recorded yet.' : 'కార్యక్రమాలు ఏవీ నమోదు కాలేదు.'}
                  </p>
                )}

                {/* Add new activity form */}
                <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-2xl space-y-2">
                  <p className="text-xs font-medium text-orange-900">
                    {lang === 'en' ? 'Add New Activity:' : 'కొత్త కార్యక్రమాన్ని జతచేయి:'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder={lang === 'en' ? 'Activity Name (Telugu) *' : 'కార్యక్రమం పేరు (తెలుగు) *'}
                      value={newActivityTitleTe}
                      onChange={(e) => setNewActivityTitleTe(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-normal"
                    />
                    <input
                      type="text"
                      placeholder="Title (English)"
                      value={newActivityTitleEn}
                      onChange={(e) => setNewActivityTitleEn(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-normal"
                    />
                    <input
                      type="text"
                      placeholder={lang === 'en' ? 'Time (Telugu, e.g. ఉదయం 10:00)' : 'సమయం (తెలుగు, ఉదా: ఉదయం 10:00)'}
                      value={newActivityTime}
                      onChange={(e) => setNewActivityTime(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-normal"
                    />
                    <input
                      type="text"
                      placeholder="Time (English, e.g. 10:00 AM)"
                      value={newActivityTimeEn}
                      onChange={(e) => setNewActivityTimeEn(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-normal"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddActivity(editDayModal.id)}
                    className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium cursor-pointer"
                  >
                    {lang === 'en' ? '+ Add Activity' : '+ కార్యక్రమాన్ని జతచేయి'}
                  </button>
                </div>
              </div>

              {/* Day Puja Materials Section */}
              <div className="space-y-3 pt-3 border-t border-orange-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                      <span>🪔 {lang === 'en' ? 'Puja Materials to Bring' : 'తీసుకురావలసిన పూజా సామగ్రి'}</span>
                      <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full font-normal">
                        ({dayMaterials.length})
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      {lang === 'en' 
                        ? 'Items devotees bring or committee provides for this day.' 
                        : 'ఈ రోజు పూజలకు భక్తులు తీసుకురావలసిన లేదా కమిటీ ఇచ్చే పూజా సామగ్రి.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openAddMaterialModal}
                    className="px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-900 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1 border border-orange-200 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{lang === 'en' ? 'Detailed Form' : 'వివరమైన ఫారమ్'}</span>
                  </button>
                </div>

                {/* Inline Add Material Form */}
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2.5">
                  <p className="text-xs font-semibold text-amber-950 flex items-center gap-1.5">
                    <span>🪔</span>
                    <span>{lang === 'en' ? 'Add Puja Material to Bring:' : 'కొత్త పూజా సామగ్రిని జతచేయి:'}</span>
                  </p>
                  
                  {/* Row 1: Item Names */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder={lang === 'en' ? 'Material Name (Telugu, e.g. కొబ్బరికాయలు) *' : 'సామగ్రి పేరు (తెలుగు, ఉదా: కొబ్బరికాయలు) *'}
                      value={materialForm.item_name_telugu}
                      onChange={(e) => setMaterialForm({ ...materialForm, item_name_telugu: e.target.value })}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-normal focus:outline-none focus:border-amber-500"
                    />
                    <input
                      type="text"
                      placeholder={lang === 'en' ? 'Material Name (English, e.g. Coconuts)' : 'సామగ్రి పేరు (ఇంగ్లీష్, e.g. Coconuts)'}
                      value={materialForm.item_name_english}
                      onChange={(e) => setMaterialForm({ ...materialForm, item_name_english: e.target.value })}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-normal focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Row 2: Quantity & Units */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder={lang === 'en' ? 'Quantity (e.g. 2, 100g)' : 'పరిమాణం (ఉదా: 2, 100g)'}
                      value={materialForm.quantity}
                      onChange={(e) => setMaterialForm({ ...materialForm, quantity: e.target.value })}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-normal"
                    />
                    <input
                      type="text"
                      placeholder={lang === 'en' ? 'Unit (Telugu, e.g. కాయలు)' : 'కొలత (తెలుగు, ఉదా: కాయలు)'}
                      value={materialForm.unit_telugu}
                      onChange={(e) => setMaterialForm({ ...materialForm, unit_telugu: e.target.value })}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-normal"
                    />
                    <input
                      type="text"
                      placeholder={lang === 'en' ? 'Unit (English, e.g. pieces)' : 'కొలత (ఇంగ్లీష్, e.g. pieces)'}
                      value={materialForm.unit}
                      onChange={(e) => setMaterialForm({ ...materialForm, unit: e.target.value })}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-normal"
                    />
                  </div>

                  {/* Row 3: Provided by & Associated Activity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                    <div className="flex items-center gap-3 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs">
                      <span className="text-slate-600 font-medium">{lang === 'en' ? 'Provided by:' : 'సమకూర్చాలి:'}</span>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="inlineMatProvided"
                          checked={materialForm.provided_by === 'DEVOTEES'}
                          onChange={() => setMaterialForm({ ...materialForm, provided_by: 'DEVOTEES' })}
                          className="text-amber-600"
                        />
                        <span className="font-medium text-amber-950">{lang === 'en' ? 'Devotees Bring' : 'భక్తులు'}</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer ml-1">
                        <input
                          type="radio"
                          name="inlineMatProvided"
                          checked={materialForm.provided_by === 'COMMITTEE'}
                          onChange={() => setMaterialForm({ ...materialForm, provided_by: 'COMMITTEE' })}
                          className="text-blue-600"
                        />
                        <span className="font-medium text-blue-900">{lang === 'en' ? 'Committee' : 'కమిటీ'}</span>
                      </label>
                    </div>

                    {editDayModal.activities?.length > 0 ? (
                      <select
                        value={materialForm.programme_activity_id}
                        onChange={(e) => setMaterialForm({ ...materialForm, programme_activity_id: e.target.value })}
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                      >
                        <option value="">{lang === 'en' ? '-- Whole Day (All Pujas) --' : '-- రోజంతటికీ (అన్ని పూజలకూ) --'}</option>
                        {editDayModal.activities.map((act: any) => (
                          <option key={act.id} value={act.id}>
                            {act.title_telugu} {act.title_english ? `(${act.title_english})` : ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-xs text-slate-500 italic px-1">
                        {lang === 'en' ? 'Applies to the whole day' : 'రోజంతటికీ వర్తిస్తుంది'}
                      </div>
                    )}
                  </div>

                  {/* Row 4: Optional Instructions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder={lang === 'en' ? 'Instructions (Telugu, optional)' : 'సూచనలు (తెలుగు, ఐచ్ఛికం)'}
                      value={materialForm.instructions_telugu}
                      onChange={(e) => setMaterialForm({ ...materialForm, instructions_telugu: e.target.value })}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-normal"
                    />
                    <input
                      type="text"
                      placeholder={lang === 'en' ? 'Instructions (English, optional)' : 'సూచనలు (ఇంగ్లీష్, ఐచ్ఛికం)'}
                      value={materialForm.instructions_english}
                      onChange={(e) => setMaterialForm({ ...materialForm, instructions_english: e.target.value })}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-normal"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="button"
                    onClick={handleSaveInlineMaterial}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{lang === 'en' ? '+ Add Puja Material' : '+ పూజా సామగ్రిని జతచేయి'}</span>
                  </button>
                </div>

                {/* Materials List */}
                {dayMaterials.length > 0 ? (
                  <ul className="space-y-2 max-h-52 overflow-y-auto">
                    {dayMaterials.map((mat, idx) => (
                      <li key={mat.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs sm:text-sm">
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 truncate">
                              {mat.item_name_telugu} {mat.item_name_english && <span className="text-slate-500 font-normal">({mat.item_name_english})</span>}
                            </span>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                              mat.provided_by === 'COMMITTEE' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-900'
                            }`}>
                              {mat.provided_by === 'COMMITTEE' 
                                ? (lang === 'en' ? 'Committee' : 'కమిటీ') 
                                : (lang === 'en' ? 'Devotees Bring' : 'భక్తులు')}
                            </span>
                            {!mat.is_published && (
                              <span className="text-[10px] bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded font-normal shrink-0">
                                {lang === 'en' ? 'Hidden' : 'దాచబడింది'}
                              </span>
                            )}
                          </div>
                          {mat.quantity && (
                            <p className="text-xs text-amber-950">
                              <span className="font-medium">{lang === 'en' ? 'Qty:' : 'పరిమాణం:'}</span> {mat.quantity} {mat.unit_telugu || mat.unit || ''}
                            </p>
                          )}
                          {(mat.instructions_telugu || mat.instructions_english) && (
                            <p className="text-xs text-slate-600 italic truncate">
                              {mat.instructions_telugu || mat.instructions_english}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveMaterial(idx, 'UP')}
                            disabled={idx === 0}
                            className={`p-1.5 rounded-lg ${idx === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-200 cursor-pointer'}`}
                            title="Move Up"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveMaterial(idx, 'DOWN')}
                            disabled={idx === dayMaterials.length - 1}
                            className={`p-1.5 rounded-lg ${idx === dayMaterials.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-200 cursor-pointer'}`}
                            title="Move Down"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleMaterialPublish(mat.id)}
                            className={`p-1.5 rounded-lg cursor-pointer ${mat.is_published ? 'text-emerald-700 hover:bg-emerald-50' : 'text-stone-400 hover:bg-stone-200'}`}
                            title={mat.is_published ? "Unpublish" : "Publish"}
                          >
                            {mat.is_published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditMaterialModal(mat)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMaterial(mat.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-3 bg-orange-50/40 rounded-xl border border-orange-100 text-center text-xs text-slate-500">
                    {lang === 'en' ? 'No puja materials added for this day yet.' : 'ఈ రోజుకు ఇంకా పూజా సామగ్రి వివరాలు నమోదు కాలేదు.'}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-orange-100">
              <button
                onClick={() => setEditDayModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium cursor-pointer"
              >
                {lang === 'en' ? 'Cancel' : 'రద్దు'}
              </button>
              <button
                onClick={() => handleSaveDay(editDayModal.id, editDayModal)}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium shadow-sm cursor-pointer"
              >
                {lang === 'en' ? 'Save Day' : 'రోజు వివరాలను భద్రపరుచు (Save Day)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SPECIFIC ACTIVITY */}
      {editingActivity && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleSaveEditedActivity} className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] overflow-y-auto p-6 sm:p-7 space-y-5 shadow-2xl border border-orange-200">
            <div className="flex items-center justify-between border-b border-orange-100 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-medium text-slate-900">
                  {lang === 'en' ? 'Edit Activity & Special Puja Guidance' : 'కార్యక్రమం & పూజా సూచనల సవరణ'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'en' 
                    ? 'Configure activity details and participation guidance for devotees.' 
                    : 'కార్యక్రమ వివరాలు మరియు భక్తుల భాగస్వామ్య సూచనలను ఇక్కడ నమోదు చేయండి.'}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setEditingActivity(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm font-normal text-slate-800">
              {/* Activity Name */}
              <BilingualField
                label={lang === 'en' ? 'Activity Name' : 'కార్యక్రమం పేరు'}
                englishValue={editingActivity.title_english || ''}
                teluguValue={editingActivity.title_telugu || ''}
                onEnglishChange={(val) => setEditingActivity({ ...editingActivity, title_english: val })}
                onTeluguChange={(val) => setEditingActivity({ ...editingActivity, title_telugu: val })}
                englishPlaceholder="e.g. Sri Lalitha Sahasranama Kumkumarchana"
                teluguPlaceholder="ఉదా: శ్రీ లలితా సహస్రనామ కుంకుమార్చన"
                context="instruction"
                token={token}
                required
                lang={lang}
              />

              {/* Activity Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-xs font-medium text-slate-700">
                    {lang === 'en' ? 'Time (English)' : 'సమయం (ఆంగ్లం)'}
                  </label>
                  <input
                    type="text"
                    value={editingActivity.time_str_english || ''}
                    onChange={(e) => setEditingActivity({ ...editingActivity, time_str_english: e.target.value })}
                    placeholder="e.g. 10:00 AM onwards"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-normal"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-medium text-slate-700">
                    {lang === 'en' ? 'Time (Telugu)' : 'సమయం (తెలుగు)'}
                  </label>
                  <input
                    type="text"
                    value={editingActivity.time_str || ''}
                    onChange={(e) => setEditingActivity({ ...editingActivity, time_str: e.target.value })}
                    placeholder="ఉదా: ఉదయం 10:00 గం॥ నుండి"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-normal"
                  />
                </div>
              </div>

              {/* Special Puja Participation Guidance Box */}
              <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-200/90 space-y-4">
                <div className="flex items-center gap-2 border-b border-orange-200/70 pb-2">
                  <Sparkles className="h-4 w-4 text-orange-600" />
                  <h4 className="text-sm font-medium text-orange-950">
                    {lang === 'en' ? 'Special Puja Participation Settings' : 'ప్రత్యేక పూజల భక్తుల భాగస్వామ్య వివరాలు'}
                  </h4>
                </div>

                {/* Allowed Participation Types */}
                <div>
                  <label className="block mb-1.5 text-xs font-medium text-slate-800">
                    {lang === 'en' ? 'Who can participate (Participation Types):' : 'ఎవరు పాల్గొనవచ్చు (భాగస్వామ్య వర్గాలు):'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      { key: 'COUPLE', labelEn: 'Couples', labelTe: 'పూజా దంపతులు' },
                      { key: 'INDIVIDUAL', labelEn: 'Individuals', labelTe: 'వ్యక్తులు' },
                      { key: 'FAMILY', labelEn: 'Families', labelTe: 'కుటుంబాలు' },
                      { key: 'OPEN_TO_ALL', labelEn: 'Open to All', labelTe: 'భక్తులందరికీ' },
                    ].map(pt => {
                      const curTypes: string[] = editingActivity.allowed_participation_types || ['COUPLE'];
                      const isChecked = curTypes.includes(pt.key);
                      return (
                        <label key={pt.key} className="flex items-center gap-1.5 p-2 bg-white rounded-xl border border-orange-200/80 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              let next: string[];
                              if (e.target.checked) {
                                next = [...curTypes, pt.key];
                              } else {
                                next = curTypes.filter(x => x !== pt.key);
                                if (next.length === 0) next = ['COUPLE'];
                              }
                              setEditingActivity({ ...editingActivity, allowed_participation_types: next });
                            }}
                            className="h-3.5 w-3.5 text-orange-600 rounded"
                          />
                          <span className="font-medium text-slate-800">{lang === 'en' ? pt.labelEn : pt.labelTe}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Who Can Participate Guidance */}
                <BilingualField
                  label={lang === 'en' ? 'Who Can Participate (Public Guidance)' : 'ఎవరు పాల్గొనవచ్చు (సార్వజనిక సూచనలు)'}
                  englishValue={editingActivity.who_can_participate_english || ''}
                  teluguValue={editingActivity.who_can_participate_telugu || ''}
                  onEnglishChange={(val) => setEditingActivity({ ...editingActivity, who_can_participate_english: val })}
                  onTeluguChange={(val) => setEditingActivity({ ...editingActivity, who_can_participate_telugu: val })}
                  englishPlaceholder="e.g. Couples wishing to perform Kumkumarchana / All devotees"
                  teluguPlaceholder="ఉదా: కుంకుమార్చన చేయదలచిన దంపతులు / భక్తులందరూ"
                  context="instruction"
                  token={token}
                  lang={lang}
                />

                {/* What to Bring Guidance */}
                <BilingualField
                  label={lang === 'en' ? 'What Participants Should Bring' : 'భక్తులు వెంట తీసుకురావలసినవి'}
                  englishValue={editingActivity.what_to_bring_english || ''}
                  teluguValue={editingActivity.what_to_bring_telugu || ''}
                  onEnglishChange={(val) => setEditingActivity({ ...editingActivity, what_to_bring_english: val })}
                  onTeluguChange={(val) => setEditingActivity({ ...editingActivity, what_to_bring_telugu: val })}
                  englishPlaceholder="e.g. Pasupu, Kumkuma, Pooja plate, Fruits"
                  teluguPlaceholder="ఉదా: పసుపు, కుంకుమ, పూజా పళ్లెం, పండ్లు"
                  context="instruction"
                  token={token}
                  lang={lang}
                />

                {/* Participation Instructions */}
                <BilingualField
                  label={lang === 'en' ? 'Pooja Instructions for Participants' : 'పూజా సూచనలు / పాటించవలసిన నియమాలు'}
                  englishValue={editingActivity.participation_instructions_english || ''}
                  teluguValue={editingActivity.participation_instructions_telugu || ''}
                  onEnglishChange={(val) => setEditingActivity({ ...editingActivity, participation_instructions_english: val })}
                  onTeluguChange={(val) => setEditingActivity({ ...editingActivity, participation_instructions_telugu: val })}
                  englishPlaceholder="e.g. Devotees are requested to wear traditional attire."
                  teluguPlaceholder="ఉదా: సంప్రదాయ దుస్తులలో పూజకు హాజరుకావలెను."
                  context="instruction"
                  token={token}
                  isTextArea
                  lang={lang}
                />

                {/* Arrival & Timings */}
                <BilingualField
                  label={lang === 'en' ? 'Arrival Time & Punctuality' : 'హాజరు సమయం / సూచనలు'}
                  englishValue={editingActivity.arrival_instructions_english || ''}
                  teluguValue={editingActivity.arrival_instructions_telugu || ''}
                  onEnglishChange={(val) => setEditingActivity({ ...editingActivity, arrival_instructions_english: val })}
                  onTeluguChange={(val) => setEditingActivity({ ...editingActivity, arrival_instructions_telugu: val })}
                  englishPlaceholder="e.g. Please be seated by 9:30 AM before Sankalpam begins."
                  teluguPlaceholder="ఉదా: సంకల్పం ప్రారంభానికి ముందే ఉదయం 9:30 గంటలకు ఆసనం స్వీకరించాలి."
                  context="instruction"
                  token={token}
                  lang={lang}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-orange-100">
              <button
                type="button"
                onClick={() => setEditingActivity(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium cursor-pointer"
              >
                {lang === 'en' ? 'Cancel' : 'రద్దు'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium shadow-sm cursor-pointer"
              >
                {lang === 'en' ? 'Save Changes' : 'మార్పులను భద్రపరుచు (Save)'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD / EDIT COUPLE & PARTICIPANT */}
      {addCoupleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleSaveParticipant} className="bg-white rounded-3xl max-w-xl w-full max-h-[88vh] overflow-y-auto p-6 sm:p-7 space-y-4 shadow-2xl border border-orange-200">
            <div className="flex items-center justify-between border-b border-orange-100 pb-3">
              <div>
                <h3 className="text-lg font-medium text-slate-900">
                  {editingCouple 
                    ? (lang === 'en' ? 'Edit Pooja Participant / Couple' : 'పూజా భాగస్వామి / దంపతుల వివరాల సవరణ')
                    : (lang === 'en' ? 'Add Pooja Couple / Participant' : 'కొత్త పూజా దంపతులు / భాగస్వామిని జతచేయి')}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'en' 
                    ? 'Enter participant details for public display in the festival programme.' 
                    : 'ఉత్సవ కార్యక్రమంలో ప్రదర్శించేందుకు భాగస్వాముల పేర్లను నమోదు చేయండి.'}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setAddCoupleModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm font-normal text-slate-800">
              {/* Participant Type Selection */}
              <div>
                <label className="block mb-1.5 text-xs font-medium text-slate-700">
                  {lang === 'en' ? 'Participant Category:' : 'భాగస్వామ్య వర్గం:'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { key: 'COUPLE', labelEn: 'Couple', labelTe: 'పూజా దంపతులు' },
                    { key: 'INDIVIDUAL', labelEn: 'Individual', labelTe: 'వ్యక్తి' },
                    { key: 'FAMILY', labelEn: 'Family', labelTe: 'కుటుంబం' },
                    { key: 'OPEN_TO_ALL', labelEn: 'Open Group', labelTe: 'భక్తుల సమూహం' }
                  ].map(t => (
                    <label 
                      key={t.key} 
                      className={`flex items-center gap-1.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                        participantType === t.key 
                          ? 'bg-orange-50 border-orange-500 text-orange-950 font-semibold' 
                          : 'bg-slate-50 border-slate-200 text-slate-700 font-normal'
                      }`}
                    >
                      <input
                        type="radio"
                        name="participantType"
                        value={t.key}
                        checked={participantType === t.key}
                        onChange={() => setParticipantType(t.key as any)}
                        className="text-orange-600"
                      />
                      <span>{lang === 'en' ? t.labelEn : t.labelTe}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Primary Person Name */}
              <BilingualField
                label={participantType === 'COUPLE' 
                  ? (lang === 'en' ? 'Primary Person Name (e.g. Smt. Ramadevi)' : 'మొదటి వ్యక్తి పేరు (ఉదా: శ్రీమతి రమాదేవి)')
                  : (lang === 'en' ? 'Participant Name' : 'భాగస్వామి పేరు')}
                englishValue={person1}
                teluguValue={person1Telugu}
                onEnglishChange={setPerson1}
                onTeluguChange={setPerson1Telugu}
                englishPlaceholder="e.g. Ramadevi"
                teluguPlaceholder="రమాదేవి"
                context="name"
                token={token}
                required
                lang={lang}
              />

              {/* Second Person Name (For Couple) */}
              {participantType === 'COUPLE' && (
                <BilingualField
                  label={lang === 'en' ? 'Spouse / Second Person Name' : 'రెండో వ్యక్తి / భర్త పేరు (ఉదా: శ్రీ సత్యనారాయణ)'}
                  englishValue={person2}
                  teluguValue={person2Telugu}
                  onEnglishChange={setPerson2}
                  onTeluguChange={setPerson2Telugu}
                  englishPlaceholder="e.g. Satyanarayana"
                  teluguPlaceholder="సత్యనారాయణ"
                  context="name"
                  token={token}
                  lang={lang}
                />
              )}

              {/* Family / Public Display Name */}
              <BilingualField
                label={lang === 'en' ? 'Public Display / Family Name (Optional)' : 'కుటుంబం / ప్రదర్శన పేరు (ఐచ్ఛికం)'}
                sublabel={lang === 'en' ? 'Custom title shown publicly' : 'బహిరంగంగా చూపించవలసిన పేరు'}
                englishValue={familyDisplay}
                teluguValue={familyDisplayTelugu}
                onEnglishChange={setFamilyDisplay}
                onTeluguChange={setFamilyDisplayTelugu}
                englishPlaceholder="e.g. Satyanarayana Couple, Garuvupalem"
                teluguPlaceholder="ఉదా: సత్యనారాయణ దంపతులు, గరువుపాలెం"
                context="name"
                token={token}
                lang={lang}
              />

              {/* Associated Activity (Optional) */}
              {days.find(d => d.id === selectedDayId)?.activities?.length > 0 && (
                <div>
                  <label className="block mb-1 text-xs font-medium text-slate-700">
                    {lang === 'en' ? 'Associate with Specific Puja/Activity (Optional):' : 'నిర్దిష్ట పూజకు అనుసంధానించండి (ఐచ్ఛికం):'}
                  </label>
                  <select
                    value={participantActivityId}
                    onChange={(e) => setParticipantActivityId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-normal text-slate-900"
                  >
                    <option value="">{lang === 'en' ? '-- Whole Day / All Activities --' : '-- రోజంతటికీ / అన్ని పూజలకూ --'}</option>
                    {days.find(d => d.id === selectedDayId)?.activities?.map((act: any) => (
                      <option key={act.id} value={act.id}>
                        {act.title_telugu} {act.title_english ? `(${act.title_english})` : ''} - {act.time_str || ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-orange-100">
              <button
                type="button"
                onClick={() => setAddCoupleModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium cursor-pointer"
              >
                {lang === 'en' ? 'Cancel' : 'రద్దు'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium cursor-pointer shadow-xs"
              >
                {editingCouple 
                  ? (lang === 'en' ? 'Save Changes' : 'మార్పులను భద్రపరుచు') 
                  : (lang === 'en' ? 'Register Participant' : 'నమోదు చేయి')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD / EDIT PUJA MATERIAL */}
      {materialModal && editDayModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleSaveMaterial} className="bg-white rounded-3xl max-w-xl w-full max-h-[88vh] overflow-y-auto p-6 sm:p-7 space-y-4 shadow-2xl border border-orange-200">
            <div className="flex items-center justify-between border-b border-orange-100 pb-3">
              <div>
                <h3 className="text-lg font-medium text-slate-900">
                  {editingMaterial 
                    ? (lang === 'en' ? 'Edit Day Puja Material' : 'పూజా సామగ్రి సవరణ') 
                    : (lang === 'en' ? 'Add Puja Material to Bring' : 'తీసుకురావలసిన పూజా సామగ్రిని జతచేయి')}
                </h3>
                <p className="text-xs text-slate-500">
                  {getDayBadgeLabel(editDayModal.day_number)} ({editDayModal.date})
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setMaterialModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm font-normal text-slate-800">
              {/* Item Name */}
              <BilingualField
                label={lang === 'en' ? 'Material Item Name' : 'సామగ్రి పేరు'}
                englishValue={materialForm.item_name_english}
                teluguValue={materialForm.item_name_telugu}
                onEnglishChange={(val) => setMaterialForm({ ...materialForm, item_name_english: val })}
                onTeluguChange={(val) => setMaterialForm({ ...materialForm, item_name_telugu: val })}
                englishPlaceholder="e.g. Coconuts, Turmeric, Kumkum, Flowers"
                teluguPlaceholder="ఉదా: కొబ్బరికాయలు, పసుపు, కుంకుమ, పూలు"
                context="material"
                token={token}
                required
                lang={lang}
              />

              {/* Quantity & Units */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 text-xs font-medium text-slate-700">
                    {lang === 'en' ? 'Quantity (Optional)' : 'పరిమాణం (ఐచ్ఛికం)'}
                  </label>
                  <input
                    type="text"
                    value={materialForm.quantity}
                    onChange={(e) => setMaterialForm({ ...materialForm, quantity: e.target.value })}
                    placeholder="e.g. 2, 100g, 1"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-normal"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-medium text-slate-700">
                    {lang === 'en' ? 'Unit (Telugu)' : 'కొలత యూనిట్ (తెలుగు)'}
                  </label>
                  <input
                    type="text"
                    value={materialForm.unit_telugu}
                    onChange={(e) => setMaterialForm({ ...materialForm, unit_telugu: e.target.value })}
                    placeholder="ఉదా: కాయలు, గ్రాములు, ప్యాకెట్"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-normal"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-medium text-slate-700">
                    Unit (English)
                  </label>
                  <input
                    type="text"
                    value={materialForm.unit}
                    onChange={(e) => setMaterialForm({ ...materialForm, unit: e.target.value })}
                    placeholder="e.g. pieces, grams, packet"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-normal"
                  />
                </div>
              </div>

              {/* Provided By Selection */}
              <div>
                <label className="block mb-1.5 text-xs font-medium text-slate-700">
                  {lang === 'en' ? 'Item Provided / Brought By:' : 'ఎవరు సమకూర్చాలి:'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer ${
                    materialForm.provided_by === 'DEVOTEES' 
                      ? 'bg-amber-50 border-amber-500 font-semibold text-amber-950' 
                      : 'bg-slate-50 border-slate-200 font-normal text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="providedBy"
                      value="DEVOTEES"
                      checked={materialForm.provided_by === 'DEVOTEES'}
                      onChange={() => setMaterialForm({ ...materialForm, provided_by: 'DEVOTEES' })}
                      className="text-amber-600"
                    />
                    <span>{lang === 'en' ? 'Devotees Bring' : 'భక్తులు తీసుకురావాలి'}</span>
                  </label>

                  <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer ${
                    materialForm.provided_by === 'COMMITTEE' 
                      ? 'bg-blue-50 border-blue-500 font-semibold text-blue-950' 
                      : 'bg-slate-50 border-slate-200 font-normal text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="providedBy"
                      value="COMMITTEE"
                      checked={materialForm.provided_by === 'COMMITTEE'}
                      onChange={() => setMaterialForm({ ...materialForm, provided_by: 'COMMITTEE' })}
                      className="text-blue-600"
                    />
                    <span>{lang === 'en' ? 'Provided by Committee' : 'కమిటీ సమకూరుస్తుంది'}</span>
                  </label>
                </div>
              </div>

              {/* Instructions */}
              <BilingualField
                label={lang === 'en' ? 'Special Instructions / Notes (Optional)' : 'సూచనలు / ప్రత్యేక వివరాలు (ఐచ్ఛికం)'}
                englishValue={materialForm.instructions_english}
                teluguValue={materialForm.instructions_telugu}
                onEnglishChange={(val) => setMaterialForm({ ...materialForm, instructions_english: val })}
                onTeluguChange={(val) => setMaterialForm({ ...materialForm, instructions_telugu: val })}
                englishPlaceholder="e.g. Please bring clean fruits and flowers."
                teluguPlaceholder="ఉదా: తాజా పూలు మరియు పండ్లను శుభ్రంగా తీసుకురాగలరు."
                context="instruction"
                token={token}
                isTextArea
                lang={lang}
              />

              {/* Associated Activity Dropdown */}
              {editDayModal.activities?.length > 0 && (
                <div>
                  <label className="block mb-1 text-xs font-medium text-slate-700">
                    {lang === 'en' ? 'Associate with Specific Activity (Optional):' : 'నిర్దిష్ట పూజా కార్యక్రమానికి జతచేయి (ఐచ్ఛికం):'}
                  </label>
                  <select
                    value={materialForm.programme_activity_id}
                    onChange={(e) => setMaterialForm({ ...materialForm, programme_activity_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-normal text-slate-900"
                  >
                    <option value="">{lang === 'en' ? '-- Whole Day (All Pujas) --' : '-- రోజంతటికీ (అన్ని పూజలకూ) --'}</option>
                    {editDayModal.activities.map((act: any) => (
                      <option key={act.id} value={act.id}>
                        {act.title_telugu} {act.title_english ? `(${act.title_english})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Published toggle */}
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800 pt-1">
                <input
                  type="checkbox"
                  checked={materialForm.is_published}
                  onChange={(e) => setMaterialForm({ ...materialForm, is_published: e.target.checked })}
                  className="h-4 w-4 text-orange-600 rounded"
                />
                <span>{lang === 'en' ? 'Show publicly on website schedule & details modal' : 'వెబ్‌సైట్‌లో భక్తులకు బహిరంగంగా చూపించు (Published)'}</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-orange-100">
              <button
                type="button"
                onClick={() => setMaterialModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium cursor-pointer"
              >
                {lang === 'en' ? 'Cancel' : 'రద్దు'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium shadow-xs cursor-pointer"
              >
                {editingMaterial 
                  ? (lang === 'en' ? 'Save Changes' : 'మార్పులను భద్రపరుచు') 
                  : (lang === 'en' ? 'Save Material' : 'సామగ్రిని భద్రపరుచు')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD ANNOUNCEMENT */}
      {addAnnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleCreateAnnouncement} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-orange-200">
            <h3 className="text-lg font-medium text-slate-900">
              {lang === 'en' ? 'New Festival Announcement' : 'కొత్త ఉత్సవ ప్రకటన'}
            </h3>
            <div className="space-y-3 text-sm font-normal text-slate-800">
              <div>
                <label className="block mb-1 font-medium">
                  {lang === 'en' ? 'Announcement Title' : 'ప్రకటన శీర్షిక (Title)'}
                </label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder={lang === 'en' ? 'e.g. Bhajan Schedule Info' : 'ఉదా: భజన సంకీర్తనల సమాచారం'}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-normal"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  {lang === 'en' ? 'Announcement Details (Content)' : 'ప్రకటన వివరాలు (Content)'}
                </label>
                <textarea
                  required
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder={lang === 'en' ? 'Enter announcement details here...' : 'ప్రకటన సమాచారం ఇక్కడ రాయండి...'}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 h-28 resize-none text-sm font-normal leading-relaxed"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-orange-100">
              <button
                type="button"
                onClick={() => setAddAnnModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium cursor-pointer"
              >
                {lang === 'en' ? 'Cancel' : 'రద్దు'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-medium cursor-pointer"
              >
                {lang === 'en' ? 'Publish Announcement' : 'ప్రచురించు'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
