import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, Heart, ImageIcon, Bell, Settings as SettingsIcon,
  Plus, Trash2, Edit2, CheckCircle, Eye, EyeOff, Upload, Phone, Save, AlertCircle,
  ArrowUp, ArrowDown
} from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';

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

  // Edit Existing Activity Modal
  const [editingActivity, setEditingActivity] = useState<any | null>(null);
  
  // Add Couple Modal
  const [addCoupleModal, setAddCoupleModal] = useState(false);
  const [person1, setPerson1] = useState('');
  const [person2, setPerson2] = useState('');
  const [familyDisplay, setFamilyDisplay] = useState('');

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
        if (data.length > 0 && !selectedDayId) {
          setSelectedDayId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [token, selectedDayId]);

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
          time_str_english: editingActivity.time_str_english || undefined
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
    if (!confirm('ఈ కార్యక్రమాన్ని తొలగించాలా?')) return;
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

  // Add Pooja Couple
  const handleAddCouple = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDayId) return;
    try {
      const res = await fetch(`/api/festival-admin/days/${selectedDayId}/pooja-couples`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          person1_name: person1,
          person2_name: person2,
          family_display_name: familyDisplay,
          is_published: true
        })
      });
      if (res.ok) {
        setAddCoupleModal(false);
        setPerson1('');
        setPerson2('');
        setFamilyDisplay('');
        fetchCouples(selectedDayId);
        setMsg({ type: 'success', text: 'పూజా దంపతుల వివరాలు విజయవంతంగా జతచేయబడ్డాయి!' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'దంపతుల నమోదు విఫలమైంది.' });
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
                    onClick={() => setEditDayModal(day)}
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

      {/* TAB 2: POOJA COUPLES */}
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
              onClick={() => setAddCoupleModal(true)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" /> {lang === 'en' ? 'Add Pooja Couple' : 'కొత్త పూజా దంపతులను జతచేయి'}
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-orange-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-orange-50 border-b border-orange-200">
              <h3 className="text-base font-medium text-slate-900">
                {lang === 'en' 
                  ? `Registered Pooja Couples for this day (${poojaCouples.length})` 
                  : `ఈ రోజుకు నమోదైన పూజా దంపతుల జాబితా (${poojaCouples.length})`}
              </h3>
            </div>
            <ul className="divide-y divide-orange-100">
              {poojaCouples.map((c) => (
                <li key={c.id} className="p-4 flex items-center justify-between hover:bg-orange-50/50">
                  <div>
                    <p className="text-sm sm:text-base font-medium text-slate-900 flex items-center gap-1">
                      🌺 {lang === 'en' ? 'Smt. & Sri ' : 'శ్రీమతి & శ్రీ '}{c.person1_name} {c.person2_name ? `& ${c.person2_name}` : ''}
                    </p>
                    {c.family_display_name && (
                      <p className="text-xs sm:text-sm font-normal text-orange-800">{c.family_display_name}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteCouple(c.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
              {poojaCouples.length === 0 && (
                <li className="p-8 text-center text-sm font-normal text-slate-500">
                  {lang === 'en' ? 'No couples registered for this day.' : 'ఈ రోజుకు ఎటువంటి దంపతుల పేర్లు నమోదు కాలేదు.'}
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
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleSaveEditedActivity} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-orange-200">
            <div className="flex items-center justify-between border-b border-orange-100 pb-3">
              <h3 className="text-base sm:text-lg font-medium text-slate-900">
                {lang === 'en' ? 'Edit Activity' : 'కార్యక్రమం సవరణ (Edit Activity)'}
              </h3>
              <button 
                type="button"
                onClick={() => setEditingActivity(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm font-normal text-slate-800">
              <div>
                <label className="block mb-1 font-medium">{lang === 'en' ? 'Activity Name (Telugu) *' : 'కార్యక్రమం పేరు (తెలుగు) *'}</label>
                <input
                  type="text"
                  value={editingActivity.title_telugu || ''}
                  onChange={(e) => setEditingActivity({ ...editingActivity, title_telugu: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-normal"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Title (English)</label>
                <input
                  type="text"
                  value={editingActivity.title_english || ''}
                  onChange={(e) => setEditingActivity({ ...editingActivity, title_english: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-normal"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">{lang === 'en' ? 'Time (Telugu, e.g. ఉదయం 10:00)' : 'సమయం (తెలుగు, e.g. ఉదయం 10:00)'}</label>
                <input
                  type="text"
                  value={editingActivity.time_str || ''}
                  onChange={(e) => setEditingActivity({ ...editingActivity, time_str: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-normal"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Time (English, e.g. 10:00 AM)</label>
                <input
                  type="text"
                  value={editingActivity.time_str_english || ''}
                  onChange={(e) => setEditingActivity({ ...editingActivity, time_str_english: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-normal"
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

      {/* MODAL: ADD COUPLE */}
      {addCoupleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleAddCouple} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-orange-200">
            <h3 className="text-lg font-medium text-slate-900">
              {lang === 'en' ? 'Add New Pooja Couple' : 'కొత్త పూజా దంపతులను జతచేయి'}
            </h3>
            <div className="space-y-3 text-sm font-normal text-slate-800">
              <div>
                <label className="block mb-1 font-medium">
                  {lang === 'en' ? 'Primary Person Name (e.g. Smt. Ramadevi) *' : 'మొదటి వ్యక్తి పేరు (ఉదా: శ్రీమతి రమాదేవి) *'}
                </label>
                <input
                  type="text"
                  required
                  value={person1}
                  onChange={(e) => setPerson1(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-normal"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  {lang === 'en' ? 'Second Person Name (Optional - e.g. Sri Satyanarayana)' : 'రెండో వ్యక్తి పేరు (ఐచ్ఛికం - ఉదా: శ్రీ సత్యనారాయణ)'}
                </label>
                <input
                  type="text"
                  value={person2}
                  onChange={(e) => setPerson2(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-normal"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  {lang === 'en' ? 'Family / Display Name (Optional)' : 'కుటుంబం / ప్రదర్శన పేరు (ఐచ్ఛికం)'}
                </label>
                <input
                  type="text"
                  value={familyDisplay}
                  onChange={(e) => setFamilyDisplay(e.target.value)}
                  placeholder={lang === 'en' ? 'e.g. Satyanarayana Couple, Garuvupalem' : 'ఉదా: సత్యనారాయణ దంపతులు, గరువుపాలెం'}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-normal"
                />
              </div>
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
                className="px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-medium cursor-pointer"
              >
                {lang === 'en' ? 'Register' : 'నమోదు చేయి'}
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
