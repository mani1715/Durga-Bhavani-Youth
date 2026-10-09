import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, Calendar, HeartHandshake, Wallet, FileSpreadsheet, 
  Settings as SettingsIcon, Users, Database, LogOut, Menu, X, 
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Central language context
  const { lang, setLang, t } = useLanguage();

  const handleLangChange = (newLang: 'te' | 'en') => {
    setLang(newLang);
  };

  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Reorganized navigation according to user specification:
  // MAIN: Overview, Festival Management, Donations, Expenses
  // ADMINISTRATION: Reports, Committee Members, Settings, Backups
  const menuGroups = [
    {
      title: t.portal.mainSection,
      items: [
        { 
          name: t.portal.overview, 
          path: '/home', 
          aliases: ['/overview', '/dashboard'],
          icon: Home, 
          roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'OPERATOR', 'VIEWER'] 
        },
        { 
          name: t.portal.festivalManagement, 
          path: '/festival-management', 
          aliases: [],
          icon: Calendar, 
          roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'OPERATOR'] 
        },
        { 
          name: t.portal.donations, 
          path: '/donations', 
          aliases: ['/receipts', '/donors'],
          icon: HeartHandshake, 
          roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'OPERATOR', 'VIEWER'] 
        },
        { 
          name: t.portal.expenses, 
          path: '/expenses', 
          aliases: [],
          icon: Wallet, 
          roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'OPERATOR', 'VIEWER'] 
        },
      ]
    },
    {
      title: t.portal.adminSection,
      items: [
        { 
          name: t.portal.reports, 
          path: '/reports', 
          aliases: ['/audit'],
          icon: FileSpreadsheet, 
          roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'VIEWER'] 
        },
        { 
          name: t.portal.committeeMembers, 
          path: '/team', 
          aliases: ['/committee'],
          icon: Users, 
          roles: ['SUPER_ADMIN', 'ORG_ADMIN'] 
        },
        { 
          name: t.portal.settings, 
          path: '/settings', 
          aliases: ['/templates', '/categories'],
          icon: SettingsIcon, 
          roles: ['SUPER_ADMIN', 'ORG_ADMIN'] 
        },
        { 
          name: t.portal.backups, 
          path: '/backup', 
          aliases: [],
          icon: Database, 
          roles: ['SUPER_ADMIN', 'ORG_ADMIN'] 
        },
      ]
    }
  ];

  // Derive current page title for top bar
  const getPageTitle = () => {
    const current = location.pathname;
    if (current === '/home' || current === '/overview' || current === '/dashboard') return t.portal.overview;
    if (current.startsWith('/festival-management')) return t.portal.festivalManagement;
    if (current.startsWith('/donations') || current.startsWith('/receipts') || current.startsWith('/donors')) return t.portal.donations;
    if (current.startsWith('/expenses')) return t.portal.expenses;
    if (current.startsWith('/reports') || current.startsWith('/audit')) return t.portal.reports;
    if (current.startsWith('/team') || current.startsWith('/committee')) return t.portal.committeeMembers;
    if (current.startsWith('/settings') || current.startsWith('/templates') || current.startsWith('/categories')) return t.portal.settings;
    if (current.startsWith('/backup')) return t.portal.backups;
    return t.portal.overview;
  };

  const isItemActive = (item: { path: string; aliases: string[] }) => {
    if (location.pathname === item.path) return true;
    return item.aliases.includes(location.pathname);
  };

  const renderNavItems = () => {
    return menuGroups.map((group, i) => {
      const allowedItems = group.items.filter(item => !user || item.roles.includes(user.role));
      if (allowedItems.length === 0) return null;

      return (
        <div key={group.title} className={i !== 0 ? 'mt-6' : ''}>
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider px-3 py-1.5">
            {group.title}
          </h3>
          <div className="space-y-1 mt-1">
            {allowedItems.map(item => {
              const active = isItemActive(item);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all min-h-[44px] ${
                    active 
                      ? 'bg-orange-50 text-orange-700 font-medium border-l-2 border-orange-500 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-normal'
                  }`}
                >
                  <item.icon className={`w-4 h-4 shrink-0 ${active ? 'text-orange-600' : 'text-slate-500'}`} />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="flex h-screen bg-[#FFF7ED] text-slate-800 antialiased overflow-hidden selection:bg-orange-500 selection:text-white">
      {/* Desktop Sidebar (Clean White with #E5E7EB border) */}
      <aside className="hidden md:flex w-64 bg-white flex-col border-r border-slate-200 h-full shrink-0 z-20">
        {/* Compact Committee Identity */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-orange-300 shadow-xs shrink-0 bg-white">
              <img 
                src="/committee-photo-logo.webp" 
                alt={lang === 'te' ? 'దుర్గాభవాని యూత్ లోగో' : 'Durga Bhavani Youth Logo'} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-medium text-slate-900 text-sm leading-tight truncate group-hover:text-orange-600 transition-colors">
                {lang === 'te' ? 'దుర్గాభవాని యూత్' : 'Durga Bhavani Youth'}
              </h1>
              <p className="text-xs text-slate-500 font-normal truncate mt-0.5">
                {lang === 'te' ? 'గరువుపాలెం' : 'Garuvupalem'}
              </p>
            </div>
          </Link>
        </div>
        
        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto p-3.5 custom-scrollbar">
          {renderNavItems()}
        </div>

        {/* User Account & Logout Bottom Area */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-medium text-xs uppercase border border-orange-200 shrink-0">
              {user?.name?.slice(0, 2) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-800 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 uppercase truncate">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-white hover:shadow-xs transition-all cursor-pointer"
            title={t.portal.logout}
            aria-label={t.portal.logout}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Main Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 z-10 px-4 sm:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile menu trigger */}
            <button 
              onClick={() => setMobileDrawerOpen(true)} 
              className="md:hidden text-slate-600 hover:text-slate-900 p-1.5 -ml-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Committee Emblem */}
            <div className="md:hidden w-8 h-8 rounded-full overflow-hidden border border-orange-300 shadow-xs shrink-0 bg-white">
              <img 
                src="/committee-photo-logo.webp" 
                alt="Logo" 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Current Page Title */}
            <div>
              <h2 className="text-base sm:text-lg font-medium text-slate-900 leading-tight">
                {getPageTitle()}
              </h2>
            </div>
          </div>

          {/* Right Action Controls: View Website + Language Selector + User Info */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* View Website Button */}
            <a 
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-700 border border-slate-200 hover:border-orange-200 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-orange-600" />
              <span>{t.portal.viewWebsite}</span>
            </a>

            {/* Telugu / English Language Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
              <button
                type="button"
                onClick={() => handleLangChange('te')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  lang === 'te' 
                    ? 'bg-orange-600 text-white font-medium shadow-xs' 
                    : 'text-slate-600 hover:text-orange-600 font-normal'
                }`}
              >
                తెలుగు
              </button>
              <span className="text-slate-300 mx-0.5">|</span>
              <button
                type="button"
                onClick={() => handleLangChange('en')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  lang === 'en' 
                    ? 'bg-orange-600 text-white font-medium shadow-xs' 
                    : 'text-slate-600 hover:text-orange-600 font-normal'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#FFF7ED] p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={() => setMobileDrawerOpen(false)} />
          <div className="relative w-72 max-w-[80vw] bg-white h-full flex flex-col shadow-2xl overflow-hidden z-10 border-r border-slate-200">
            <div className="p-4 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full overflow-hidden border border-orange-300 shadow-xs shrink-0 bg-white">
                  <img 
                    src="/committee-photo-logo.webp" 
                    alt={lang === 'te' ? 'దుర్గాభవాని యూత్ లోగో' : 'Durga Bhavani Youth Logo'} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="font-medium text-slate-900 text-sm">
                    {lang === 'te' ? 'దుర్గాభవాని యూత్' : 'Durga Bhavani Youth'}
                  </h1>
                  <p className="text-xs text-slate-500 font-normal">
                    {lang === 'te' ? 'గరువుపాలెం' : 'Garuvupalem'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setMobileDrawerOpen(false)} 
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 custom-scrollbar">
              {renderNavItems()}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-3">
              <a 
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 w-full py-2 bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5 text-orange-600" />
                <span>{t.portal.viewWebsite}</span>
              </a>
              <button 
                onClick={handleLogout} 
                className="flex items-center justify-center gap-2 text-red-600 hover:text-red-700 w-full py-2 bg-red-50 hover:bg-red-100 rounded-xl text-xs font-medium cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.portal.logout}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
