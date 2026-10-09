import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Phone, Calendar, Search, 
  Clock, Heart,
  ChevronRight, X, Image as ImageIcon,
  Menu, Sun, MapPin, CheckCircle2,
  ArrowRight, Sparkles
} from 'lucide-react';
import { 
  type Language, 
  formatFestivalDate, 
  getLocalizedText,
  getPhaseLabels
} from '../utils/translations';
import { DevotionalPetalsOverlay } from '../components/DevotionalPetalsOverlay';

interface ProgrammeActivity {
  id: string;
  time_str?: string;
  time_str_english?: string;
  title_telugu: string;
  title_english?: string;
  activity_type?: string;
  allowed_participation_types?: string;
  who_can_participate_telugu?: string;
  who_can_participate_english?: string;
  participation_instructions_telugu?: string;
  participation_instructions_english?: string;
  what_to_bring_telugu?: string;
  what_to_bring_english?: string;
  arrival_instructions_telugu?: string;
  arrival_instructions_english?: string;
}

interface PoojaCouple {
  id: string;
  programme_activity_id?: string | null;
  participant_type?: string;
  person1_name: string;
  person1_name_telugu?: string;
  person2_name?: string;
  person2_name_telugu?: string;
  family_display_name?: string;
  family_display_name_telugu?: string;
}

interface DayPujaMaterial {
  id: string;
  festival_day_id: string;
  programme_activity_id?: string | null;
  item_name_telugu: string;
  item_name_english?: string | null;
  quantity?: string | null;
  unit?: string | null;
  unit_telugu?: string | null;
  instructions_telugu?: string | null;
  instructions_english?: string | null;
  provided_by: 'DEVOTEES' | 'COMMITTEE';
  display_order: number;
}

interface FestivalDay {
  id: string;
  day_number: number;
  date: string;
  alankaram_name_telugu: string;
  alankaram_name_english?: string;
  description_telugu?: string;
  description_english?: string;
  is_completed?: boolean;
  activities: ProgrammeActivity[];
  pooja_couples: PoojaCouple[];
  puja_materials?: DayPujaMaterial[];
}

interface TodayProgrammeData {
  status_phase?: 'BEFORE_FESTIVAL' | 'DURING_FESTIVAL' | 'AFTER_FESTIVAL';
  message?: string;
  day?: FestivalDay | null;
}

interface PublicCategoryPill {
  id: string;
  name: string;
  name_telugu?: string;
  name_english?: string;
  display_order: number;
}

interface PublicContributionItem {
  id?: string;
  donor_display_name: string;
  donor_display_name_english?: string;
  donor_display_name_telugu?: string;
  type: 'MONEY' | 'MATERIAL';
  amount?: number;
  item_description?: string;
  item_description_telugu?: string;
  quantity?: string;
  unit?: string;
  estimated_value?: number;
  date: string;
  category_name?: string;
  category_name_telugu?: string;
}

interface PublicDonationsResponse {
  total_received: number;
  donors_count: number;
  materials_count: number;
  filtered_received?: number | null;
  filtered_count?: number | null;
  is_filtered: boolean;
  categories: PublicCategoryPill[];
  donations: PublicContributionItem[];
  total_count: number;
  page: number;
  total_pages: number;
  last_updated: string;
}

interface PublicPhoto {
  id: string;
  title: string;
  caption?: string;
  url: string;
  day_number?: number;
  alankaram_tag?: string;
}

interface Album {
  day_id: string;
  day_number: number;
  date: string;
  alankaram_name_telugu: string;
  cover_url: string;
  photo_count: number;
  photos: PublicPhoto[];
}

interface Announcement {
  id: string;
  title_telugu: string;
  title_english?: string;
  content_telugu: string;
  content_english?: string;
  created_at: string;
  announcement_type?: string;
  is_important?: boolean;
}

import { useLanguage } from '../context/LanguageContext';
import { buildApiUrl } from '../services/api';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // Central shared language state
  const { lang, setLang, t } = useLanguage();

  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
  };

  // In-flight request cancel controllers
  const publicAbortRef = React.useRef<AbortController | null>(null);
  const donationsAbortRef = React.useRef<AbortController | null>(null);

  // State
  const [todayData, setTodayData] = useState<TodayProgrammeData | null>(null);
  const [allDays, setAllDays] = useState<FestivalDay[]>([]);
  const [donationsData, setDonationsData] = useState<PublicDonationsResponse>({
    total_received: 0,
    donors_count: 0,
    materials_count: 0,
    is_filtered: false,
    categories: [],
    donations: [],
    total_count: 0,
    page: 1,
    total_pages: 1,
    last_updated: ''
  });
  const [albums, setAlbums] = useState<Album[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [_bannerImageUrl, setBannerImageUrl] = useState<string | null>(null);
  
  // UI Controls
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedDayModal, setSelectedDayModal] = useState<FestivalDay | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PublicPhoto | null>(null);
  const [activeGalleryTab, setActiveGalleryTab] = useState<number | 'ALL'>('ALL');
  
  // Donation Search, Category Filter, Type Filter & Pagination
  const [donationSearch, setDonationSearch] = useState('');
  const [donationCategoryFilter, setDonationCategoryFilter] = useState('ALL');
  const [donationTypeFilter, setDonationTypeFilter] = useState<'MONEY' | 'MATERIAL' | 'ALL'>('MONEY');
  const [donationSort, setDonationSort] = useState<'highest' | 'newest'>('highest');
  const [donationPage, setDonationPage] = useState(1);
  const [loadingDonations, setLoadingDonations] = useState(false);

  // Fetch Public Info & Today's Schedule
  const fetchPublicData = useCallback(async () => {
    if (publicAbortRef.current) {
      publicAbortRef.current.abort();
    }
    const controller = new AbortController();
    publicAbortRef.current = controller;
    const signal = controller.signal;

    try {
      // 0. Public Info
      fetch(buildApiUrl('/api/public/info'), { signal })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.banner_image_url) setBannerImageUrl(data.banner_image_url);
        })
        .catch(() => {});

      // 1. Today Programme
      fetch(buildApiUrl('/api/public/programme/today'), { signal })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setTodayData(data);
        })
        .catch(() => {});

      // 2. All Days Schedule
      fetch(buildApiUrl('/api/public/programme/all'), { signal })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (Array.isArray(data)) setAllDays(data);
        })
        .catch(() => {});

      // 3. Gallery Albums
      fetch(buildApiUrl('/api/public/gallery'), { signal })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (Array.isArray(data)) setAlbums(data);
        })
        .catch(() => {});

      // 4. Announcements
      fetch(buildApiUrl('/api/public/announcements'), { signal })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && Array.isArray(data.announcements)) {
            setAnnouncements(data.announcements);
          }
        })
        .catch(() => {});
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Failed to fetch public data:', err);
      }
    }
  }, []);

  // Fetch Public Donations with Filtering & Sorting
  const fetchDonations = useCallback(async (
    search = donationSearch,
    page = donationPage,
    category = donationCategoryFilter,
    cType = donationTypeFilter,
    sortOrder = donationSort
  ) => {
    if (donationsAbortRef.current) {
      donationsAbortRef.current.abort();
    }
    const controller = new AbortController();
    donationsAbortRef.current = controller;

    setLoadingDonations(true);
    try {
      let url = buildApiUrl(`/api/public/donations?page=${page}&limit=20&sort=${sortOrder}&contribution_type=${cType}`);
      if (search && search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
      if (category && category !== 'ALL') url += `&category_id=${encodeURIComponent(category)}`;

      const res = await fetch(url, { signal: controller.signal });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          setDonationsData({
            total_received: data.total_received || 0,
            donors_count: data.donors_count || 0,
            materials_count: data.materials_count || 0,
            filtered_received: data.filtered_received,
            filtered_count: data.filtered_count,
            is_filtered: Boolean(data.is_filtered),
            categories: Array.isArray(data.categories) ? data.categories : [],
            donations: Array.isArray(data.donations) ? data.donations : [],
            total_count: data.total_count || 0,
            page: data.page || 1,
            total_pages: data.total_pages || 1,
            last_updated: data.last_updated || ''
          });
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Failed to fetch donations:', err);
      }
    } finally {
      setLoadingDonations(false);
    }
  }, [donationSearch, donationPage, donationCategoryFilter, donationTypeFilter, donationSort]);

  // Initial Load + Staggered Polling (15s - 23s randomized per visitor session) + Window Focus Refresh
  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let isCancelled = false;

    fetchPublicData();
    fetchDonations(donationSearch, donationPage, donationCategoryFilter, donationTypeFilter, donationSort);

    const scheduleNextPoll = () => {
      if (isCancelled) return;
      // Stagger visitors across 15s to 23s to prevent synchronized traffic spikes (thundering herd)
      const jitteredDelay = 15000 + Math.floor(Math.random() * 8000);
      timerId = setTimeout(async () => {
        if (isCancelled) return;
        if (document.visibilityState === 'visible') {
          await Promise.allSettled([
            fetchPublicData(),
            fetchDonations(donationSearch, donationPage, donationCategoryFilter, donationTypeFilter, donationSort)
          ]);
        }
        scheduleNextPoll();
      }, jitteredDelay);
    };

    scheduleNextPoll();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isCancelled) {
        fetchPublicData();
        fetchDonations(donationSearch, donationPage, donationCategoryFilter, donationTypeFilter, donationSort);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isCancelled = true;
      if (timerId) clearTimeout(timerId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (publicAbortRef.current) publicAbortRef.current.abort();
      if (donationsAbortRef.current) donationsAbortRef.current.abort();
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [fetchPublicData, fetchDonations, donationSearch, donationPage, donationCategoryFilter, donationTypeFilter, donationSort]);

  const searchDebounceRef = React.useRef<any>(null);

  // Search input change (debounced for smooth typing and fast responses)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDonationSearch(val);
    setDonationPage(1);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchDonations(val, 1, donationCategoryFilter, donationTypeFilter, donationSort);
    }, 280);
  };

  // Category filter change
  const handleCategoryChange = (catId: string) => {
    setDonationCategoryFilter(catId);
    setDonationPage(1);
    fetchDonations(donationSearch, 1, catId, donationTypeFilter, donationSort);
  };

  // Contribution type filter change
  const handleTypeChange = (cType: 'MONEY' | 'MATERIAL' | 'ALL') => {
    setDonationTypeFilter(cType);
    setDonationPage(1);
    fetchDonations(donationSearch, 1, donationCategoryFilter, cType, donationSort);
  };

  // Sort order change
  const handleSortChange = (newSort: 'highest' | 'newest') => {
    setDonationSort(newSort);
    setDonationPage(1);
    fetchDonations(donationSearch, 1, donationCategoryFilter, donationTypeFilter, newSort);
  };

  // Reset all donation filters
  const handleResetFilters = () => {
    setDonationSearch('');
    setDonationCategoryFilter('ALL');
    setDonationTypeFilter('MONEY');
    setDonationSort('highest');
    setDonationPage(1);
    fetchDonations('', 1, 'ALL', 'MONEY', 'highest');
  };

  // Flatten photo list for gallery view safely
  const allPhotos: PublicPhoto[] = [];
  if (Array.isArray(albums)) {
    albums.forEach(album => {
      if (album && Array.isArray(album.photos)) {
        if (activeGalleryTab === 'ALL' || album.day_number === activeGalleryTab) {
          album.photos.forEach(photo => {
            if (photo && photo.url) {
              allPhotos.push({
                ...photo,
                day_number: album.day_number,
                alankaram_tag: album.alankaram_name_telugu
              });
            }
          });
        }
      }
    });
  }

  const phaseLabels = getPhaseLabels(todayData?.status_phase, lang);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-800 font-sans selection:bg-amber-600 selection:text-white w-full overflow-x-clip relative">


      {/* =========================================================================
          SUBTLE INTERACTIVE FLOWER PETALS OVERLAY (z-0: above deity, behind content panels)
          Clock-driven, scroll-velocity boosted, downwards only, sacred face exclusion zone
          ========================================================================= */}
      <DevotionalPetalsOverlay />

      {/* =========================================================================
          SECTION 1: HEADER & TOP NAVIGATION (3 Distinct Regions)
          Left: Committee emblem & name | Center: Single-line English/Telugu nav | Right: Language switch
          ========================================================================= */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/95 border-b border-amber-200/80 shadow-xs w-full">
        <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Region 1: Left - Committee Photo Logo & Village Identity */}
          <div 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none shrink min-w-0" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-orange-300 shadow-xs shrink-0 bg-white">
              <img 
                src="/committee-photo-logo.webp" 
                alt={lang === 'te' ? 'దుర్గాభవాని యూత్ లోగో' : 'Durga Bhavani Youth Logo'} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-xs sm:text-base text-slate-900 truncate">
                  {lang === 'te' ? 'దుర్గాభవాని యూత్' : 'Durga Bhavani Youth'}
                </span>
                <span className="hidden sm:inline-block text-[11px] sm:text-xs font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200 shrink-0">
                  {lang === 'te' ? 'గరువుపాలెం' : 'Garuvupalem'}
                </span>
              </div>
              <p className="block sm:hidden text-[10px] text-amber-800 font-medium leading-none truncate mt-0.5">
                {lang === 'te' ? 'గరువుపాలెం' : 'Garuvupalem'}
              </p>
              <p className="hidden md:block text-xs text-amber-900 font-normal leading-normal mt-0.5 truncate">
                {t.header.festivalTitle}
              </p>
            </div>
          </div>

          {/* Region 2: Centre / Right - Desktop Navigation Links (strictly 1 line, concise labels) */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-sm xl:text-[15px] font-medium text-slate-700 whitespace-nowrap">
            <a href="#hero" className="hover:text-amber-700 transition-colors py-1">{t.header.navHome}</a>
            <a href="#today" className="hover:text-amber-700 transition-colors py-1">{t.header.navSchedule}</a>
            <a href="#donations" className="hover:text-amber-700 transition-colors py-1">{t.header.navDonations}</a>
            <a href="#gallery" className="hover:text-amber-700 transition-colors py-1">{t.header.navGallery}</a>
            <a href="#announcements" className="hover:text-amber-700 transition-colors py-1">{t.header.navAnnouncements}</a>
            <a href="#contact" className="hover:text-amber-700 transition-colors py-1">{t.header.navContact}</a>
          </nav>

          {/* Region 3: Far Right - Language Switcher (తెలుగు | English) & Mobile Drawer Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="flex items-center bg-stone-100 p-0.5 sm:p-1 rounded-xl border border-stone-200 text-xs sm:text-sm font-medium">
              <button
                onClick={() => handleLangChange('te')}
                className={`px-1.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  lang === 'te' 
                    ? 'bg-white text-amber-800 font-medium shadow-xs' 
                    : 'text-stone-600 hover:text-stone-900 font-normal'
                }`}
                aria-label="Switch to Telugu"
              >
                తెలుగు
              </button>
              <span className="text-stone-400 text-xs sm:text-sm px-0.5 select-none">|</span>
              <button
                onClick={() => handleLangChange('en')}
                className={`px-1.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  lang === 'en' 
                    ? 'bg-white text-amber-800 font-medium shadow-xs' 
                    : 'text-stone-600 hover:text-stone-900 font-normal'
                }`}
                aria-label="Switch to English"
              >
                English
              </button>
            </div>

            {/* Mobile Drawer Button (visible below lg) */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-stone-700 hover:text-amber-700 rounded-lg border border-stone-200 cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white/98 backdrop-blur-md border-b border-amber-200/80 px-4 pt-3 pb-6 space-y-1 shadow-xl">
            <a 
              href="#hero" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3.5 py-3 rounded-xl text-slate-800 hover:bg-amber-50 font-medium text-base min-h-[44px] flex items-center"
            >
              {t.header.navHome}
            </a>
            <a 
              href="#today" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3.5 py-3 rounded-xl text-slate-800 hover:bg-amber-50 font-medium text-base min-h-[44px] flex items-center"
            >
              {t.header.navSchedule}
            </a>
            <a 
              href="#donations" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3.5 py-3 rounded-xl text-slate-800 hover:bg-amber-50 font-medium text-base min-h-[44px] flex items-center"
            >
              {t.header.navDonations}
            </a>
            <a 
              href="#gallery" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3.5 py-3 rounded-xl text-slate-800 hover:bg-amber-50 font-medium text-base min-h-[44px] flex items-center"
            >
              {t.header.navGallery}
            </a>
            <a 
              href="#announcements" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3.5 py-3 rounded-xl text-slate-800 hover:bg-amber-50 font-medium text-base min-h-[44px] flex items-center"
            >
              {t.header.navAnnouncements}
            </a>
            <a 
              href="#contact" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3.5 py-3 rounded-xl text-slate-800 hover:bg-amber-50 font-medium text-base min-h-[44px] flex items-center"
            >
              {t.header.navContact}
            </a>
          </div>
        )}
      </header>

      {/* =========================================================================
          SECTION 2: CLEAN FOREGROUND HERO (DEITY & FESTIVAL IDENTITY)
          - Plain warm-white/cream page background
          - Separate responsive foreground deity image with object-fit: contain
          - Desktop: Festival identity card on the left, complete deity image on the right
          - Mobile: Deity image first (order-1), compact festival identity below (order-2)
          - Zero overlap between text card and Ammavari
          - Complete crown and tiger mount visible with comfortable margins
          ========================================================================= */}
      <section 
        id="hero" 
        className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12 scroll-mt-24"
      >
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 xl:gap-16">
          
          {/* Mobile: Order 1 (Deity First) | Desktop: Order 2 (Right Column) */}
          <div className="order-1 lg:order-2 w-full lg:w-1/2 flex justify-center items-center">
            <picture className="w-full flex justify-center items-center">
              <source srcSet="/ammavaru-transparent.webp" type="image/webp" />
              <img 
                src="/ammavaru-transparent.png" 
                alt={lang === 'te' ? 'శ్రీ దుర్గా భవాని అమ్మవారు' : 'Sri Durga Bhavani Ammavaru'} 
                className="w-full max-w-[340px] sm:max-w-[420px] md:max-w-[480px] lg:max-w-[540px] xl:max-w-[580px] h-auto max-h-[50vh] sm:max-h-[60vh] lg:max-h-[75vh] object-contain drop-shadow-md select-none transition-transform duration-300"
                loading="eager"
                decoding="async"
              />
            </picture>
          </div>

          {/* Mobile: Order 2 (Content Below) | Desktop: Order 1 (Left Column) */}
          <div className="order-2 lg:order-1 w-full lg:w-1/2 max-w-[560px]">
            <div className="bg-white/95 border border-amber-200/90 rounded-3xl p-5 sm:p-8 shadow-sm space-y-4">
              
              {/* Village & Committee Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs sm:text-sm font-medium">
                <Sparkles className="h-3.5 w-3.5 text-amber-700" />
                <span>{lang === 'te' ? 'దుర్గాభవాని యూత్ — గరువుపాలెం' : 'Durga Bhavani Youth — Garuvupalem'}</span>
              </div>

              {/* Festival Title */}
              <h1 className="text-2xl sm:text-3xl md:text-[34px] font-medium text-slate-900 leading-tight">
                {lang === 'te' ? '31వ దేవీ శరన్నవరాత్రి మహోత్సవములు' : '31st Devi Sharannavaratri Mahotsavam'}
              </h1>

              {/* Festival Dates & Description */}
              <p className="text-sm sm:text-base text-slate-700 font-normal leading-relaxed">
                {t.hero.dates}
              </p>

              {/* Primary Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <a 
                  href="#today" 
                  className="px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-medium text-sm sm:text-base transition-colors shadow-sm inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>{lang === 'te' ? 'కార్యక్రమ వివరాలు' : 'View Programme'}</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a 
                  href="#donations" 
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 font-medium text-sm sm:text-base transition-colors shadow-xs inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>{lang === 'te' ? 'విరాళాలు' : 'View Donations'}</span>
                </a>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 3: TODAY'S / UPCOMING PROGRAMME (Readable Warm-White Panel)
          ========================================================================= */}
      <section id="today" className="py-10 md:py-16 relative z-10 scroll-mt-24">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="bg-warm-panel rounded-3xl border border-amber-200/80 shadow-lg p-6 sm:p-10 space-y-8">
            
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-sm font-medium border border-amber-200/80">
                <Sun className="h-3.5 w-3.5 text-amber-600" />
                <span>{phaseLabels.sectionBadge}</span>
              </div>
              
              <h2 className="text-2xl sm:text-[26px] font-medium text-slate-900 leading-snug">
                {phaseLabels.sectionTitle}
              </h2>
              
              <p className="text-base text-slate-600 font-normal leading-relaxed">
                {phaseLabels.sectionSubtitle}
              </p>
            </div>

            {todayData && (
              <div className="max-w-4xl mx-auto">
                {todayData.day ? (
                  <div className="p-6 sm:p-8 rounded-3xl bg-white border border-amber-200 shadow-xs space-y-6">
                    
                    {/* Header Badge */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-amber-200/60">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium px-3.5 py-1 bg-amber-700 text-white rounded-full">
                            {todayData.day.day_number === 0
                              ? (lang === 'en' ? 'Arrival & Procession' : 'ఆగమనం & శోభాయాత్ర')
                              : `${t.today.dayPrefix} ${todayData.day.day_number}`} ({formatFestivalDate(todayData.day.date, lang)})
                          </span>
                          {todayData.day.is_completed && (
                            <span className="text-sm font-medium px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {lang === 'te' ? 'పూర్తయింది' : 'Completed'}
                            </span>
                          )}
                        </div>

                        <h3 className="text-[22px] sm:text-[24px] font-medium text-slate-900 pt-1 leading-snug">
                          {lang === 'en'
                            ? (todayData.day.alankaram_name_english || todayData.day.alankaram_name_telugu)
                            : (todayData.day.day_number === 0
                                ? (todayData.day.alankaram_name_telugu.startsWith('శ్రీ') ? todayData.day.alankaram_name_telugu : `శ్రీ ${todayData.day.alankaram_name_telugu}`)
                                : `శ్రీ ${todayData.day.alankaram_name_telugu} అలంకారం`)}
                        </h3>
                        
                        {todayData.day.description_telugu && (
                          <p className="text-base text-amber-950 font-normal leading-[1.75]">
                            {getLocalizedText(lang, todayData.day.description_telugu, todayData.day.description_english)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Two Column Grid: Activities Schedule vs Pooja Couples / Participants */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Column 1: Activities Schedule & Special Puja Instructions */}
                      <div className="space-y-3 bg-[#FFFDF9] p-5 rounded-2xl border border-stone-200/80 shadow-xs">
                        <h4 className="text-base font-medium text-slate-900 flex items-center gap-2 border-b border-stone-200/70 pb-2.5">
                          <Clock className="h-4 w-4 text-amber-700" />
                          {t.today.activitiesHeading}
                        </h4>
                        {Array.isArray(todayData.day.activities) && todayData.day.activities.length > 0 ? (
                          <ul className="space-y-3">
                            {todayData.day.activities.map(act => (
                              <li key={act.id} className="p-3 bg-amber-50/40 rounded-xl border border-amber-200/60 space-y-2">
                                <div className="flex items-start gap-2.5 text-base">
                                  <span className="font-medium text-amber-900 bg-amber-100/70 border border-amber-200/80 px-2 py-1 rounded-md shrink-0 text-sm">
                                    {(lang === 'en' ? (act.time_str_english || act.time_str) : act.time_str) || t.today.timePending}
                                  </span>
                                  <div className="pt-0.5">
                                    <p className="font-medium text-slate-900 leading-relaxed">
                                      {getLocalizedText(lang, act.title_telugu, act.title_english)}
                                    </p>
                                  </div>
                                </div>

                                {/* Special Puja Participation Guidance */}
                                {(act.who_can_participate_telugu || act.what_to_bring_telugu || act.participation_instructions_telugu || act.arrival_instructions_telugu) && (
                                  <div className="mt-2 text-xs sm:text-sm bg-white/90 border border-amber-200/90 rounded-xl p-3 space-y-1.5 text-slate-800">
                                    {(act.who_can_participate_telugu || act.who_can_participate_english) && (
                                      <div>
                                        <span className="font-semibold text-amber-950">{t.today.whoCanParticipateHeading}: </span>
                                        <span>{getLocalizedText(lang, act.who_can_participate_telugu, act.who_can_participate_english)}</span>
                                      </div>
                                    )}
                                    {(act.what_to_bring_telugu || act.what_to_bring_english) && (
                                      <div>
                                        <span className="font-semibold text-amber-950">{t.today.whatToBringHeading}: </span>
                                        <span>{getLocalizedText(lang, act.what_to_bring_telugu, act.what_to_bring_english)}</span>
                                      </div>
                                    )}
                                    {(act.participation_instructions_telugu || act.participation_instructions_english) && (
                                      <div>
                                        <span className="font-semibold text-amber-950">{lang === 'en' ? 'Instructions: ' : 'పూజా సూచనలు: '}</span>
                                        <span>{getLocalizedText(lang, act.participation_instructions_telugu, act.participation_instructions_english)}</span>
                                      </div>
                                    )}
                                    {(act.arrival_instructions_telugu || act.arrival_instructions_english) && (
                                      <div>
                                        <span className="font-semibold text-amber-950">{lang === 'en' ? 'Arrival & Timings: ' : 'సమయ పాలన: '}</span>
                                        <span>{getLocalizedText(lang, act.arrival_instructions_telugu, act.arrival_instructions_english)}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-slate-500 py-3 text-center">
                            {t.today.noActivitiesMsg}
                          </p>
                        )}
                      </div>

                      {/* Column 2: Pooja Couples / Participants */}
                      <div className="space-y-3 bg-[#FFFDF9] p-5 rounded-2xl border border-stone-200/80 shadow-xs">
                        <h4 className="text-base font-medium text-slate-900 flex items-center gap-2 border-b border-stone-200/70 pb-2.5">
                          <Heart className="h-4 w-4 text-amber-700" />
                          {todayData.day.pooja_couples?.some(p => p.participant_type && p.participant_type !== 'COUPLE')
                            ? t.today.participantsHeading
                            : t.today.couplesHeading}
                        </h4>
                        {Array.isArray(todayData.day.pooja_couples) && todayData.day.pooja_couples.length > 0 ? (
                          <ul className="space-y-2.5">
                            {todayData.day.pooja_couples.map(pc => {
                              const displayName = lang === 'te'
                                ? (pc.family_display_name_telugu || pc.family_display_name || (pc.person2_name ? `శ్రీమతి & శ్రీ ${pc.person1_name_telugu || pc.person1_name} & ${pc.person2_name_telugu || pc.person2_name}` : (pc.person1_name_telugu || pc.person1_name)))
                                : (pc.family_display_name || (pc.person2_name ? `Smt & Sri ${pc.person1_name} & ${pc.person2_name}` : pc.person1_name));
                              return (
                                <li key={pc.id} className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl space-y-0.5">
                                  <p className="text-base font-medium text-slate-900 leading-relaxed">
                                    🌺 {displayName}
                                  </p>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-500 py-3 text-center">
                            {t.today.noCouplesMsg}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Puja Materials to Bring Section for Today */}
                    {Array.isArray(todayData.day.puja_materials) && todayData.day.puja_materials.length > 0 && (
                      <div className="space-y-4 pt-4 border-t border-amber-200/60">
                        <h4 className="text-base sm:text-lg font-medium text-slate-900 flex items-center gap-2">
                          <span>🪔 {t.today.materialsHeading}</span>
                          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full font-normal">
                            ({todayData.day.puja_materials.length})
                          </span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {todayData.day.puja_materials.map(mat => (
                            <div 
                              key={mat.id}
                              className={`p-3.5 rounded-2xl border text-sm space-y-1.5 ${
                                mat.provided_by === 'COMMITTEE'
                                  ? 'bg-blue-50/60 border-blue-200 text-slate-800'
                                  : 'bg-amber-50/70 border-amber-200 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-slate-900">
                                  {getLocalizedText(lang, mat.item_name_telugu, mat.item_name_english)}
                                </span>
                                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                  mat.provided_by === 'COMMITTEE'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-amber-100 text-amber-900'
                                }`}>
                                  {mat.provided_by === 'COMMITTEE'
                                    ? t.today.committeeMaterialsHeading
                                    : t.today.whatToBringHeading}
                                </span>
                              </div>

                              {mat.quantity && (
                                <p className="text-xs font-medium text-amber-950">
                                  {lang === 'en' ? 'Quantity: ' : 'పరిమాణం: '} 
                                  {mat.quantity} {getLocalizedText(lang, mat.unit_telugu, mat.unit)}
                                </p>
                              )}

                              {(mat.instructions_telugu || mat.instructions_english) && (
                                <p className="text-xs text-slate-600 italic">
                                  {getLocalizedText(lang, mat.instructions_telugu, mat.instructions_english)}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="p-8 rounded-3xl bg-stone-50 border border-stone-200 text-center space-y-3 shadow-xs">
                    <h3 className="text-lg font-medium text-slate-900">
                      {t.today.titleConcluded}
                    </h3>
                    <p className="text-sm text-stone-600 max-w-lg mx-auto">
                      {todayData.message || t.today.concludedMsg}
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: 12-DAY PROGRAMME SCHEDULE (Readable Warm-White Panel)
          ========================================================================= */}
      <section id="schedule" className="py-10 md:py-16 relative z-10 scroll-mt-24">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="bg-warm-panel rounded-3xl border border-amber-200/80 shadow-lg p-6 sm:p-10 space-y-8">
            
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-sm font-medium uppercase text-amber-800 bg-amber-50 border border-amber-200/80 px-3.5 py-1 rounded-full">
                {t.schedule.badge}
              </span>
              <h2 className="text-2xl sm:text-[26px] font-medium text-slate-900 leading-snug">
                {t.schedule.heading}
              </h2>
              <p className="text-base text-slate-600 font-normal leading-relaxed">
                {t.schedule.subheading}
              </p>
            </div>

            {/* 12 Days Responsive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allDays.map((day) => {
                const isArrival = day.day_number === 0;
                const isGramotsavam = day.day_number === 11;
                const badgeLabel = isArrival 
                  ? t.schedule.arrivalBadge 
                  : (isGramotsavam ? t.schedule.gramotsavamBadge : `${t.schedule.dayPrefix} ${day.day_number}`);

                return (
                  <div 
                    key={day.id} 
                    className="bg-white rounded-3xl border border-stone-200/90 hover:border-amber-400 p-6 sm:p-7 transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs sm:text-sm font-medium px-3 py-0.5 rounded-full ${
                          isArrival || isGramotsavam 
                            ? 'bg-amber-800 text-white' 
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}>
                          {badgeLabel}
                        </span>
                        <span className="text-xs sm:text-sm font-normal text-stone-500 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-amber-700" />
                          {formatFestivalDate(day.date, lang)}
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-[19px] font-medium text-slate-900 pt-1 leading-snug">
                        శ్రీ {getLocalizedText(lang, day.alankaram_name_telugu, day.alankaram_name_english)}
                      </h3>

                      {day.description_telugu && (
                        <p className="text-sm sm:text-[15px] text-slate-600 font-normal leading-[1.75]">
                          {getLocalizedText(lang, day.description_telugu, day.description_english)}
                        </p>
                      )}

                      {/* Preview of activities */}
                      <div className="pt-2.5 space-y-2 border-t border-stone-100">
                        {Array.isArray(day.activities) && day.activities.length > 0 ? (
                          day.activities.slice(0, 3).map((act) => (
                            <div key={act.id} className="text-sm flex items-start gap-2 text-slate-700">
                              <span className="font-medium text-amber-800 shrink-0">
                                {(lang === 'en' ? (act.time_str_english || act.time_str) : act.time_str) || t.today.timePending}:
                              </span>
                              <span className="font-normal leading-relaxed">
                                {getLocalizedText(lang, act.title_telugu, act.title_english)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs sm:text-sm text-stone-500 italic">
                            {t.today.noActivitiesMsg}
                          </p>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={() => setSelectedDayModal(day)}
                      className="mt-5 w-full py-2.5 bg-amber-50 hover:bg-amber-100/70 border border-amber-200/80 text-amber-900 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {t.schedule.btnViewDetails} <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: DONATIONS RECEIVED (Readable Warm-White Panel)
          ========================================================================= */}
      <section id="donations" className="py-10 md:py-16 relative z-10 scroll-mt-24">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="bg-warm-panel rounded-3xl border border-amber-200/80 shadow-lg p-6 sm:p-10 space-y-8">
            
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-sm font-medium uppercase text-amber-800 bg-amber-50 border border-amber-200/80 px-3.5 py-1 rounded-full">
                {t.donations.badge}
              </span>
              <h2 className="text-2xl sm:text-[26px] font-medium text-slate-900 leading-snug">
                {t.donations.heading}
              </h2>
              <p className="text-base text-slate-600 font-normal leading-relaxed">
                {t.donations.subheading}
              </p>
            </div>

            {/* Three Honest Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {/* Card 1: Monetary Received */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-stone-200/90 text-center shadow-xs space-y-1">
                <p className="text-xs sm:text-sm font-medium text-slate-600">{t.donations.statTotal}</p>
                <p className="text-2xl sm:text-3xl font-medium text-amber-800">
                  ₹ {Number(donationsData?.total_received || 0).toLocaleString('en-IN')}
                </p>
                {donationsData?.is_filtered && donationsData?.filtered_received !== null && donationsData?.filtered_received !== undefined && (
                  <p className="text-xs font-normal text-amber-900 bg-amber-50 rounded-full px-2.5 py-0.5 inline-block border border-amber-200">
                    {t.donations.filteredTotal}: ₹ {Number(donationsData.filtered_received).toLocaleString('en-IN')}
                  </p>
                )}
              </div>

              {/* Card 2: Monetary Donors */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-stone-200/90 text-center shadow-xs space-y-1">
                <p className="text-xs sm:text-sm font-medium text-slate-600">{t.donations.statDonors}</p>
                <p className="text-2xl sm:text-3xl font-medium text-amber-800">
                  {donationsData?.donors_count || 0} <span className="text-sm font-normal text-slate-500">{t.donations.donorsUnit}</span>
                </p>
                {donationsData?.is_filtered && donationsData?.filtered_count !== null && (
                  <p className="text-xs font-normal text-amber-900 bg-amber-50 rounded-full px-2.5 py-0.5 inline-block border border-amber-200">
                    {t.donations.filteredCount}: {donationsData.filtered_count}
                  </p>
                )}
              </div>

              {/* Card 3: Material Offerings */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-stone-200/90 text-center shadow-xs space-y-1">
                <p className="text-xs sm:text-sm font-medium text-slate-600">{t.donations.statMaterials}</p>
                <p className="text-2xl sm:text-3xl font-medium text-amber-800">
                  {donationsData?.materials_count || 0} <span className="text-sm font-normal text-slate-500">{t.donations.materialsUnit}</span>
                </p>
                <p className="text-[11px] text-stone-500 font-normal">
                  {lang === 'te' ? 'ప్రత్యేక సమర్పణలు' : 'Special Offerings'}
                </p>
              </div>
            </div>

            {/* Contribution Type Toggle */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={() => handleTypeChange('MONEY')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  donationTypeFilter === 'MONEY'
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
                }`}
              >
                {t.donations.filterMoney}
              </button>
              <button
                onClick={() => handleTypeChange('MATERIAL')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  donationTypeFilter === 'MATERIAL'
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
                }`}
              >
                {t.donations.filterMaterial}
              </button>
              <button
                onClick={() => handleTypeChange('ALL')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  donationTypeFilter === 'ALL'
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
                }`}
              >
                {t.donations.filterAll}
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="w-full max-w-4xl mx-auto overflow-x-auto py-1 px-1 flex items-center sm:flex-wrap sm:justify-center gap-2 scrollbar-none">
              <button
                onClick={() => handleCategoryChange('ALL')}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  donationCategoryFilter === 'ALL'
                    ? 'bg-amber-800 text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {t.donations.allCategories}
              </button>
              {donationsData.categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    donationCategoryFilter === cat.id
                      ? 'bg-amber-800 text-white shadow-xs'
                      : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  {getLocalizedText(lang, cat.name_telugu || cat.name, cat.name_english || cat.name)}
                </button>
              ))}
            </div>

            {/* Search Bar + Sort Selector + Reset Button */}
            <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                <input 
                  type="text"
                  value={donationSearch}
                  onChange={handleSearchChange}
                  placeholder={t.donations.searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-stone-300 focus:border-amber-600 rounded-xl text-sm font-normal text-slate-900 focus:outline-hidden transition-all placeholder-stone-400"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200 text-xs sm:text-sm font-medium">
                  <button
                    onClick={() => handleSortChange('highest')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      donationSort === 'highest'
                        ? 'bg-white text-amber-800 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {t.donations.sortHighest}
                  </button>
                  <button
                    onClick={() => handleSortChange('newest')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      donationSort === 'newest'
                        ? 'bg-white text-amber-800 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {t.donations.sortNewest}
                  </button>
                </div>

                {(donationSearch || donationCategoryFilter !== 'ALL' || donationTypeFilter !== 'MONEY' || donationSort !== 'highest') && (
                  <button
                    onClick={handleResetFilters}
                    className="px-3 py-1.5 text-xs text-amber-900 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {t.donations.resetFilters}
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Table View (hidden on small screens) */}
            <div className="hidden md:block max-w-4xl mx-auto overflow-x-auto bg-white rounded-2xl border border-stone-200/90 shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-800 text-sm font-medium">
                    <th className="py-3 px-4">{t.donations.thDonor}</th>
                    <th className="py-3 px-4">{t.donations.thCategory}</th>
                    <th className="py-3 px-4">{t.donations.thDetails}</th>
                    <th className="py-3 px-4">{t.donations.thDate}</th>
                    <th className="py-3 px-4 text-right">{t.donations.thAmount}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm font-normal text-slate-800">
                  {loadingDonations && donationsData.donations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-stone-500 font-medium">
                        {t.donations.loading}
                      </td>
                    </tr>
                  ) : donationsData.donations.length > 0 ? (
                    donationsData.donations.map((d, i) => (
                      <tr key={d.id || i} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          {lang === 'te' 
                            ? (d.donor_display_name_telugu || d.donor_display_name) 
                            : (d.donor_display_name_english || d.donor_display_name)}
                        </td>
                        <td className="py-3.5 px-4 text-stone-600">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
                            {lang === 'te' ? (d.category_name_telugu || d.category_name) : (d.category_name || d.category_name_telugu)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-stone-700">
                          {d.type === 'MATERIAL' ? (
                            <span>
                              {lang === 'te' ? (d.item_description_telugu || d.item_description) : d.item_description}
                              {d.quantity ? ` (${d.quantity} ${d.unit || ''})` : ''}
                            </span>
                          ) : (
                            <span className="text-stone-500">{lang === 'te' ? 'నగదు సమర్పణ' : 'Cash Contribution'}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-stone-600">{formatFestivalDate(d.date, lang)}</td>
                        <td className="py-3.5 px-4 text-right font-medium text-amber-800">
                          {d.type === 'MONEY' && d.amount !== null && d.amount !== undefined ? (
                            <span>₹ {Number(d.amount).toLocaleString('en-IN')}</span>
                          ) : d.estimated_value ? (
                            <span className="text-xs text-stone-600">
                              ₹ {Number(d.estimated_value).toLocaleString('en-IN')} <span className="text-[10px] text-stone-400">({lang === 'te' ? 'అంచనా' : 'est.'})</span>
                            </span>
                          ) : (
                            <span className="text-xs text-stone-500">{d.quantity} {d.unit || ''}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-stone-500 font-medium">
                        {t.donations.noResults}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (visible below md) */}
            <div className="md:hidden max-w-xl mx-auto space-y-3">
              {loadingDonations && donationsData.donations.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 font-medium">
                  {t.donations.loading}
                </div>
              ) : donationsData.donations.length > 0 ? (
                donationsData.donations.map((d, i) => (
                  <div key={d.id || i} className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 text-base leading-snug">
                          {lang === 'te' 
                            ? (d.donor_display_name_telugu || d.donor_display_name) 
                            : (d.donor_display_name_english || d.donor_display_name)}
                        </p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-200">
                          {lang === 'te' ? (d.category_name_telugu || d.category_name) : (d.category_name || d.category_name_telugu)}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        {d.type === 'MONEY' && d.amount !== null && d.amount !== undefined ? (
                          <span className="text-base font-medium text-amber-800">
                            ₹ {Number(d.amount).toLocaleString('en-IN')}
                          </span>
                        ) : d.estimated_value ? (
                          <div className="text-right">
                            <span className="text-sm font-medium text-amber-800">₹ {Number(d.estimated_value).toLocaleString('en-IN')}</span>
                            <p className="text-[10px] text-stone-400">({lang === 'te' ? 'అంచనా' : 'est.'})</p>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-amber-800">{d.quantity} {d.unit || ''}</span>
                        )}
                      </div>
                    </div>

                    {d.type === 'MATERIAL' && (
                      <p className="text-xs text-stone-700 bg-stone-50 p-2 rounded-lg border border-stone-100">
                        📦 {lang === 'te' ? (d.item_description_telugu || d.item_description) : d.item_description} {d.quantity ? `— ${d.quantity} ${d.unit || ''}` : ''}
                      </p>
                    )}

                    <div className="pt-1 flex items-center justify-between text-xs text-stone-500 border-t border-stone-100">
                      <span>{d.type === 'MONEY' ? (lang === 'te' ? 'నగదు విరాళం' : 'Monetary') : (lang === 'te' ? 'వస్తు సమర్పణ' : 'Material')}</span>
                      <span>{formatFestivalDate(d.date, lang)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 font-medium">
                  {t.donations.noResults}
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {donationsData.total_pages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  disabled={donationPage <= 1}
                  onClick={() => {
                    const p = Math.max(1, donationPage - 1);
                    setDonationPage(p);
                    fetchDonations(donationSearch, p, donationCategoryFilter, donationTypeFilter, donationSort);
                  }}
                  className="px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-xl border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {lang === 'te' ? 'మునుపటి పేజీ' : 'Previous'}
                </button>
                <span className="text-xs sm:text-sm text-stone-600 font-medium">
                  {donationPage} / {donationsData.total_pages}
                </span>
                <button
                  disabled={donationPage >= donationsData.total_pages}
                  onClick={() => {
                    const p = Math.min(donationsData.total_pages, donationPage + 1);
                    setDonationPage(p);
                    fetchDonations(donationSearch, p, donationCategoryFilter, donationTypeFilter, donationSort);
                  }}
                  className="px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-xl border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {lang === 'te' ? 'తదుపరి పేజీ' : 'Next'}
                </button>
              </div>
            )}

            <div className="text-center">
              <p className="text-xs sm:text-sm text-stone-500 font-normal">
                {t.donations.privacyNote}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: PHOTO GALLERIES (Readable Warm-White Panel)
          ========================================================================= */}
      <section id="gallery" className="py-10 md:py-16 relative z-10 scroll-mt-24">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="bg-warm-panel rounded-3xl border border-amber-200/80 shadow-lg p-6 sm:p-10 space-y-8">
            
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-sm font-medium uppercase text-amber-800 bg-amber-50 border border-amber-200/80 px-3.5 py-1 rounded-full">
                {t.gallery.badge}
              </span>
              <h2 className="text-2xl sm:text-[26px] font-medium text-slate-900 leading-snug">
                {t.gallery.heading}
              </h2>
              <p className="text-base text-slate-600 font-normal leading-relaxed">
                {t.gallery.subheading}
              </p>
            </div>

            {/* SPECIAL DEVOTIONAL HIGHLIGHT: మన అమ్మవారు / OUR AMMAVARU (Red & Gold Saree) */}
            <div className="bg-gradient-to-r from-orange-50/90 via-amber-50/70 to-orange-50/90 rounded-3xl border border-orange-200/90 p-5 sm:p-7 shadow-xs">
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                <div className="w-full sm:w-64 md:w-72 shrink-0 rounded-2xl overflow-hidden bg-white border border-orange-200 shadow-sm flex items-center justify-center p-2">
                  <img 
                    src="/ammavaru-red-gold.webp" 
                    alt={lang === 'te' ? 'శ్రీ కనకదుర్గా అమ్మవారు (ఎరుపు మరియు స్వర్ణ అలంకరణ)' : 'Sri Kanaka Durga Ammavaru (Sacred Red & Gold Form)'}
                    className="w-full max-h-[320px] object-contain rounded-xl hover:scale-102 transition-transform duration-300"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== '/ammavaru-red-gold.jpg') target.src = '/ammavaru-red-gold.jpg';
                    }}
                  />
                </div>
                <div className="space-y-3 text-center md:text-left flex-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs sm:text-sm font-medium border border-orange-200">
                    <span>✨</span>
                    <span>{lang === 'te' ? 'మన గ్రామ దేవత - దివ్య స్వరూపం' : 'Our Village Deity - Sacred Form'}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-medium text-slate-900 leading-snug">
                    {lang === 'te' ? 'మన అమ్మవారు — శ్రీ కనకదుర్గా దేవి' : 'Our Ammavaru — Sri Kanaka Durga Devi'}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-700 font-normal leading-relaxed">
                    {lang === 'te' 
                      ? 'గరువుపాలెం గ్రామ దేవత శ్రీ కనకదుర్గా అమ్మవారి దివ్య దర్శనం. సింహవాహనంపై కొలువుదీరిన జగన్మాత ఆశీస్సులు భక్తులకు, గ్రామ ప్రజలందరికీ ఎల్లవేళలా ఉండాలని కోరుకుంటున్నాము.'
                      : 'The authentic sacred portrait of Sri Kanaka Durga Ammavaru seated gracefully upon her tiger mount. May the divine Mother shower peace, prosperity, and health upon all devotees and villagers.'}
                  </p>
                  <div className="pt-1 flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs sm:text-sm text-stone-600">
                    <span className="px-3 py-1 bg-white rounded-lg border border-orange-200 font-medium text-orange-800 shadow-xs">
                      {lang === 'te' ? 'గరువుపాలెం గ్రామం' : 'Garuvupalem Village'}
                    </span>
                    <span className="px-3 py-1 bg-white rounded-lg border border-orange-200 font-medium text-orange-800 shadow-xs">
                      {lang === 'te' ? 'దుర్గాభవాని యూత్' : 'Durga Bhavani Youth'}
                    </span>
                    <span className="px-3 py-1 bg-white rounded-lg border border-orange-200 font-medium text-orange-800 shadow-xs">
                      {lang === 'te' ? '31వ వార్షిక మహోత్సవాలు' : '31st Navaratri Mahotsavam'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button 
                onClick={() => setActiveGalleryTab('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeGalleryTab === 'ALL'
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
                }`}
              >
                {t.gallery.tabAll}
              </button>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(dayNum => (
                <button 
                  key={dayNum}
                  onClick={() => setActiveGalleryTab(dayNum)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    activeGalleryTab === dayNum
                      ? 'bg-amber-700 text-white shadow-xs'
                      : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
                  }`}
                >
                  {t.gallery.tabDayPrefix} {dayNum}
                </button>
              ))}
            </div>

            {/* Photo Grid */}
            {allPhotos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {allPhotos.map((photo) => (
                  <div 
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className="group relative bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <div className="h-52 overflow-hidden relative">
                      <img 
                        src={photo.url} 
                        alt={photo.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <span className="text-white text-sm font-medium flex items-center gap-1">
                          <ImageIcon className="h-3.5 w-3.5" /> {t.gallery.btnEnlarge}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-white">
                      <p className="text-sm font-medium text-slate-900 truncate">{photo.title}</p>
                      {photo.alankaram_tag && (
                        <p className="text-xs sm:text-sm text-amber-800 font-normal mt-0.5">{photo.alankaram_tag}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center bg-white rounded-2xl border border-stone-200 max-w-md mx-auto">
                <ImageIcon className="h-8 w-8 text-stone-400 mx-auto mb-2" />
                <p className="text-sm font-normal text-stone-600">{t.gallery.emptyMsg}</p>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: ANNOUNCEMENTS & NOTICES (Readable Warm-White Panel)
          ========================================================================= */}
      <section id="announcements" className="py-10 md:py-16 relative z-10 scroll-mt-24">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="bg-warm-panel rounded-3xl border border-amber-200/80 shadow-lg p-6 sm:p-10 space-y-8">
            
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-sm font-medium uppercase text-amber-800 bg-amber-50 border border-amber-200/80 px-3.5 py-1 rounded-full">
                {t.announcements.badge}
              </span>
              <h2 className="text-2xl sm:text-[26px] font-medium text-slate-900 leading-snug">
                {t.announcements.heading}
              </h2>
              <p className="text-base text-slate-600 font-normal leading-relaxed">
                {t.announcements.subheading}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
              {announcements.length > 0 ? (
                announcements.map((ann) => (
                  <div 
                    key={ann.id} 
                    className="p-6 rounded-2xl border border-stone-200/90 bg-white space-y-2.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full uppercase bg-amber-100 text-amber-900 border border-amber-200/70">
                        {t.announcements.tagNotice}
                      </span>
                      <span className="text-xs sm:text-sm font-normal text-stone-500">
                        {formatFestivalDate(ann.created_at, lang)}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">
                      {getLocalizedText(lang, ann.title_telugu, ann.title_english)}
                    </h3>
                    <p className="text-base text-slate-700 font-normal leading-relaxed whitespace-pre-line">
                      {getLocalizedText(lang, ann.content_telugu, ann.content_english)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-8 text-center bg-stone-50 rounded-2xl border border-stone-200">
                  <p className="text-sm font-normal text-stone-600">{t.announcements.emptyMsg}</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7.5: DEVOTIONAL DARSHAN & BLESSINGS (Photo 1 - Authentic Close-up)
          ========================================================================= */}
      <section className="py-10 md:py-16 relative z-10">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="bg-warm-panel rounded-3xl border border-orange-200/90 p-6 sm:p-10 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Photo 1: Natural Close-up without artificial glow */}
              <div className="md:col-span-5 flex justify-center">
                <div className="w-full max-w-[320px] rounded-2xl overflow-hidden border border-orange-200 shadow-md bg-stone-50">
                  <img 
                    src="/ammavaru-closeup-orange.webp" 
                    alt={lang === 'te' ? 'శ్రీ కనకదుర్గా అమ్మవారి ముఖారవిందం - గరువుపాలెం' : 'Sri Kanaka Durga Ammavaru Close-up Darshan'} 
                    className="w-full h-auto object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== '/ammavaru-closeup-orange.jpg') target.src = '/ammavaru-closeup-orange.jpg';
                    }}
                  />
                  <div className="p-3 bg-orange-50/70 border-t border-orange-200/60 text-center">
                    <p className="text-xs sm:text-sm font-medium text-orange-950">
                      {lang === 'te' ? 'అమ్మవారి దివ్య ముఖారవిందం (నిజరూపం)' : 'Divine Face & Crown Darshan (Authentic Photo)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Devotional Message & Invitation */}
              <div className="md:col-span-7 space-y-4 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-800 text-xs sm:text-sm font-medium border border-orange-200">
                  <span>🙏</span>
                  <span>{lang === 'te' ? 'భక్తులకు సాదర ఆహ్వానం' : 'Cordially Inviting All Devotees'}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-medium text-slate-900 leading-snug">
                  {lang === 'te' 
                    ? 'శ్రీ కనకదుర్గా అమ్మవారి దివ్య కృపాకటాక్షములు' 
                    : 'Divine Blessings of Sri Kanaka Durga Devi'}
                </h3>
                <p className="text-base text-slate-700 font-normal leading-relaxed">
                  {lang === 'te' 
                    ? '31వ దేవీ శరన్నవరాత్రి మహోత్సవముల సందర్భంగా గరువుపాలెం గ్రామ దేవత శ్రీ కనకదుర్గా అమ్మవారిని దర్శించి, తీర్థప్రసాదాలు స్వీకరించి, అమ్మవారి కృపకు పాత్రులు కావలసిందిగా భక్తులందరికీ దుర్గాభవాని యూత్ కమిటీ తరపున సాదర ఆహ్వానం.'
                    : 'On the auspicious occasion of the 31st Devi Sharannavaratri Mahotsavam, the Durga Bhavani Youth committee cordially invites all devotees and families to visit Garuvupalem village, partake in sacred rituals, receive teertha prasadam, and seek the divine grace of Ammavaru.'}
                </p>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
                  <a 
                    href="#contact" 
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-medium text-sm transition-colors text-center shadow-xs cursor-pointer"
                  >
                    {lang === 'te' ? 'కమిటీని సంప్రదించండి' : 'Contact Committee'}
                  </a>
                  <a 
                    href="#donations" 
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-orange-50 text-orange-900 font-medium text-sm border border-orange-200 transition-colors text-center cursor-pointer"
                  >
                    {lang === 'te' ? 'విరాళం అందించండి' : 'Offer Donation'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 8: CONTACT & FOOTER
          ========================================================================= */}
      <footer id="contact" className="relative z-10 mt-14 bg-slate-900 text-white pt-16 pb-10 border-t-2 border-amber-600">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Org Title & Info */}
            <div className="md:col-span-5 space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-orange-400/80 shadow-md shrink-0 bg-white">
                  <img 
                    src="/committee-photo-logo.webp" 
                    alt={lang === 'te' ? 'దుర్గాభవాని యూత్ లోగో' : 'Durga Bhavani Youth Logo'} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">{lang === 'te' ? 'దుర్గాభవాని యూత్' : 'Durga Bhavani Youth'}</h3>
                  <p className="text-sm text-amber-400 font-medium">{lang === 'te' ? 'గరువుపాలెం' : 'Garuvupalem'}</p>
                </div>
              </div>
              <p className="text-sm text-stone-300 font-normal leading-relaxed max-w-sm">
                {t.footer.orgDesc}
              </p>
              <div className="flex items-center gap-2 text-sm text-stone-400 pt-1">
                <MapPin className="h-4 w-4 text-amber-400 shrink-0" />
                <span>{lang === 'te' ? 'చేబ్రోలు మండలం, గుంటూరు జిల్లా' : 'Chebrolu Mandal, Guntur District'}</span>
              </div>
            </div>

            {/* Committee Contact Numbers (Tap to Call) */}
            <div className="md:col-span-7 space-y-4 bg-slate-800/80 p-5 sm:p-6 rounded-2xl border border-slate-700">
              <h4 className="text-sm font-medium text-amber-400 uppercase tracking-normal flex items-center gap-2">
                <Phone className="h-4 w-4 text-amber-400" />
                {t.footer.contactHeading}
              </h4>
              <p className="text-sm text-stone-300 font-normal">
                {t.footer.contactDesc}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <a 
                  href="tel:+918897557545" 
                  className="p-3 bg-slate-900/90 hover:bg-amber-950/40 border border-slate-700 hover:border-amber-600 rounded-xl transition-all flex flex-col items-center justify-center text-center cursor-pointer"
                >
                  <Phone className="h-4 w-4 text-amber-400 mb-1" />
                  <span className="text-sm font-medium text-white">8897557545</span>
                  <span className="text-xs text-stone-400 font-normal">{t.footer.contactRole}</span>
                </a>

                <a 
                  href="tel:+919912844424" 
                  className="p-3 bg-slate-900/90 hover:bg-amber-950/40 border border-slate-700 hover:border-amber-600 rounded-xl transition-all flex flex-col items-center justify-center text-center cursor-pointer"
                >
                  <Phone className="h-4 w-4 text-amber-400 mb-1" />
                  <span className="text-sm font-medium text-white">9912844424</span>
                  <span className="text-xs text-stone-400 font-normal">{t.footer.contactRole}</span>
                </a>

                <a 
                  href="tel:+919963397056" 
                  className="p-3 bg-slate-900/90 hover:bg-amber-950/40 border border-slate-700 hover:border-amber-600 rounded-xl transition-all flex flex-col items-center justify-center text-center cursor-pointer"
                >
                  <Phone className="h-4 w-4 text-amber-400 mb-1" />
                  <span className="text-sm font-medium text-white">9963397056</span>
                  <span className="text-xs text-stone-400 font-normal">{t.footer.contactRole}</span>
                </a>
              </div>
            </div>

          </div>

          {/* Discreet Footer Bottom Bar with Committee Login */}
          <div className="pt-8 border-t border-slate-800 text-center flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-stone-400 font-normal">
            <p>{t.footer.rights}</p>
            
            <div className="flex items-center gap-4">
              <span className="text-amber-400">{t.footer.blessing}</span>
              <span className="text-slate-600">•</span>
              <button 
                onClick={() => navigate('/login')}
                className="text-stone-400 hover:text-amber-300 text-sm font-medium transition-colors underline cursor-pointer"
              >
                {t.footer.committeeLogin}
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* =========================================================================
          MODAL 1: DAY SCHEDULE & POOJA COUPLES DETAIL
          ========================================================================= */}
      {selectedDayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[88vh] overflow-y-auto p-6 sm:p-7 space-y-5 shadow-xl border border-stone-200 relative">
            <button 
              onClick={() => setSelectedDayModal(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-1">
              <span className="text-xs sm:text-sm font-medium px-3 py-0.5 bg-amber-700 text-white rounded-full">
                {t.modal.dayPrefix} {selectedDayModal.day_number} ({formatFestivalDate(selectedDayModal.date, lang)})
              </span>
              <h3 className="text-xl font-medium text-slate-900 pt-1 leading-snug">
                శ్రీ {getLocalizedText(lang, selectedDayModal.alankaram_name_telugu, selectedDayModal.alankaram_name_english)} {t.modal.alankaramSuffix}
              </h3>
              {selectedDayModal.description_telugu && (
                <p className="text-sm sm:text-base text-amber-900 font-normal leading-relaxed">
                  {getLocalizedText(lang, selectedDayModal.description_telugu, selectedDayModal.description_english)}
                </p>
              )}
            </div>

            {/* Activities Schedule & Special Puja Instructions */}
            <div className="space-y-2.5 pt-1">
              <h4 className="text-sm font-medium text-slate-900 border-b border-stone-200 pb-1.5 uppercase tracking-normal">
                {t.modal.activitiesHeading}
              </h4>
              {Array.isArray(selectedDayModal.activities) && selectedDayModal.activities.length > 0 ? (
                <ul className="space-y-2.5">
                  {selectedDayModal.activities.map(act => (
                    <li key={act.id} className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/70 space-y-2">
                      <div className="flex items-start gap-2.5 text-sm sm:text-base">
                        <span className="font-medium text-amber-800 bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded-md shrink-0 text-xs sm:text-sm">
                          {(lang === 'en' ? (act.time_str_english || act.time_str) : act.time_str) || t.modal.timePending}
                        </span>
                        <div className="pt-0.5">
                          <p className="font-medium text-slate-900 leading-relaxed">
                            {getLocalizedText(lang, act.title_telugu, act.title_english)}
                          </p>
                        </div>
                      </div>

                      {/* Special Puja Participation Guidance */}
                      {(act.who_can_participate_telugu || act.what_to_bring_telugu || act.participation_instructions_telugu || act.arrival_instructions_telugu) && (
                        <div className="text-xs sm:text-sm bg-white/95 border border-amber-200 rounded-lg p-2.5 space-y-1 text-slate-800">
                          {(act.who_can_participate_telugu || act.who_can_participate_english) && (
                            <div>
                              <span className="font-semibold text-amber-950">{t.modal.whoCanParticipateHeading}: </span>
                              <span>{getLocalizedText(lang, act.who_can_participate_telugu, act.who_can_participate_english)}</span>
                            </div>
                          )}
                          {(act.what_to_bring_telugu || act.what_to_bring_english) && (
                            <div>
                              <span className="font-semibold text-amber-950">{t.modal.whatToBringHeading}: </span>
                              <span>{getLocalizedText(lang, act.what_to_bring_telugu, act.what_to_bring_english)}</span>
                            </div>
                          )}
                          {(act.participation_instructions_telugu || act.participation_instructions_english) && (
                            <div>
                              <span className="font-semibold text-amber-950">{lang === 'en' ? 'Instructions: ' : 'పూజా సూచనలు: '}</span>
                              <span>{getLocalizedText(lang, act.participation_instructions_telugu, act.participation_instructions_english)}</span>
                            </div>
                          )}
                          {(act.arrival_instructions_telugu || act.arrival_instructions_english) && (
                            <div>
                              <span className="font-semibold text-amber-950">{lang === 'en' ? 'Arrival & Timings: ' : 'సమయ పాలన: '}</span>
                              <span>{getLocalizedText(lang, act.arrival_instructions_telugu, act.arrival_instructions_english)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs sm:text-sm text-stone-500 italic">{t.modal.timePending}</p>
              )}
            </div>

            {/* Puja Materials to Bring */}
            {Array.isArray(selectedDayModal.puja_materials) && selectedDayModal.puja_materials.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <h4 className="text-sm font-medium text-slate-900 border-b border-stone-200 pb-1.5 uppercase tracking-normal flex items-center justify-between">
                  <span>🪔 {t.modal.materialsHeading}</span>
                  <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full font-normal">
                    {selectedDayModal.puja_materials.length}
                  </span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedDayModal.puja_materials.map(mat => (
                    <div 
                      key={mat.id}
                      className={`p-2.5 rounded-xl border text-xs sm:text-sm space-y-1 ${
                        mat.provided_by === 'COMMITTEE'
                          ? 'bg-blue-50/60 border-blue-200 text-slate-800'
                          : 'bg-amber-50/70 border-amber-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-semibold text-slate-900">
                          {getLocalizedText(lang, mat.item_name_telugu, mat.item_name_english)}
                        </span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${
                          mat.provided_by === 'COMMITTEE'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          {mat.provided_by === 'COMMITTEE'
                            ? t.modal.committeeMaterialsHeading
                            : t.modal.whatToBringHeading}
                        </span>
                      </div>
                      {mat.quantity && (
                        <p className="text-[11px] font-medium text-amber-950">
                          {lang === 'en' ? 'Qty: ' : 'పరిమాణం: '} 
                          {mat.quantity} {getLocalizedText(lang, mat.unit_telugu, mat.unit)}
                        </p>
                      )}
                      {(mat.instructions_telugu || mat.instructions_english) && (
                        <p className="text-[11px] text-slate-600 italic">
                          {getLocalizedText(lang, mat.instructions_telugu, mat.instructions_english)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pooja Couples / Participants */}
            <div className="space-y-2.5 pt-1">
              <h4 className="text-sm font-medium text-slate-900 border-b border-stone-200 pb-1.5 uppercase tracking-normal">
                {selectedDayModal.pooja_couples?.some(p => p.participant_type && p.participant_type !== 'COUPLE')
                  ? t.modal.participantsHeading
                  : t.modal.couplesHeading}
              </h4>
              {Array.isArray(selectedDayModal.pooja_couples) && selectedDayModal.pooja_couples.length > 0 ? (
                <ul className="space-y-2">
                  {selectedDayModal.pooja_couples.map(pc => {
                    const displayName = lang === 'te'
                      ? (pc.family_display_name_telugu || pc.family_display_name || (pc.person2_name ? `శ్రీమతి & శ్రీ ${pc.person1_name_telugu || pc.person1_name} & ${pc.person2_name_telugu || pc.person2_name}` : (pc.person1_name_telugu || pc.person1_name)))
                      : (pc.family_display_name || (pc.person2_name ? `Smt & Sri ${pc.person1_name} & ${pc.person2_name}` : pc.person1_name));
                    return (
                      <li key={pc.id} className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 space-y-0.5">
                        <p className="text-sm font-medium text-slate-900 leading-relaxed">
                          🌺 {displayName}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-xs sm:text-sm text-stone-500 italic">{t.modal.couplesPending}</p>
              )}
            </div>

            <button
              onClick={() => setSelectedDayModal(null)}
              className="w-full py-2.5 bg-amber-700 text-white rounded-xl text-sm font-medium hover:bg-amber-800 transition-colors cursor-pointer"
            >
              {t.modal.btnClose}
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: LIGHTBOX PHOTO VIEWER
          ========================================================================= */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs cursor-pointer"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-3xl w-full p-2" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-2 p-1.5 text-white hover:text-amber-400 bg-slate-800/80 rounded-full cursor-pointer"
              aria-label="Close image"
            >
              <X className="h-5 w-5" />
            </button>
            <img 
              src={selectedPhoto.url} 
              alt={selectedPhoto.title} 
              className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />
            <div className="mt-3 text-center text-white space-y-0.5">
              <h4 className="text-base font-medium">{selectedPhoto.title}</h4>
              {selectedPhoto.alankaram_tag && (
                <p className="text-sm font-normal text-amber-400">{selectedPhoto.alankaram_tag}</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
