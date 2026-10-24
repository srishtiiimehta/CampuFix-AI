import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  RotateCcw, 
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import type { AuthUser } from '../services/api';

export type ActivePage = 
  | 'student_dashboard' 
  | 'student_history'
  | 'new_complaint' 
  | 'clarification' 
  | 'review_confirm' 
  | 'duplicate_review' 
  | 'ticket_tracking' 
  | 'staff_dashboard';

interface NavbarProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  currentUser: AuthUser;
  onLogout: () => void;
  onResetDemoData: () => void;
  isResetting: boolean;
  selectedTicketId: string | null;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  setActivePage,
  currentUser,
  onLogout,
  onResetDemoData,
  isResetting,
  selectedTicketId,
  isDarkMode,
  onToggleTheme,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const updateScroll = () => setIsScrolled(window.scrollY > 12);
    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    return () => window.removeEventListener('scroll', updateScroll);
  }, []);
  const isStaff = currentUser.role === 'staff';
  const initials = currentUser.name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U';

  return (
    <header className={`campusfix-nav sticky top-0 z-40 bg-white border-b border-slate-200 ${isScrolled ? 'is-scrolled' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 min-h-16 py-3">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setActivePage(isStaff ? 'staff_dashboard' : 'student_dashboard')}
              className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-teal-400 font-bold shadow-sm transition-transform group-hover:scale-105">
                <Building2 className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  CampusFix <span className="text-teal-600 font-extrabold">AI</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-400">
                  University Facilities
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Role-Aware Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {!isStaff ? (
              <>
                <button
                  onClick={() => setActivePage('student_dashboard')}
                  className={`transition-colors whitespace-nowrap py-1 cursor-pointer ${
                    activePage === 'student_dashboard'
                      ? 'text-teal-700 font-semibold border-b-2 border-teal-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  My Work Orders
                </button>

                <button
                  onClick={() => setActivePage('student_history')}
                  className={`transition-colors whitespace-nowrap py-1 cursor-pointer ${
                    activePage === 'student_history'
                      ? 'text-teal-700 font-semibold border-b-2 border-teal-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Complaint History
                </button>

                <button
                  onClick={() => setActivePage('new_complaint')}
                  className={`transition-colors whitespace-nowrap py-1 cursor-pointer ${
                    activePage === 'new_complaint' || 
                    activePage === 'clarification' || 
                    activePage === 'review_confirm' || 
                    activePage === 'duplicate_review'
                      ? 'text-teal-700 font-semibold border-b-2 border-teal-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Report Facility Defect
                </button>
              </>
            ) : (
              <button
                onClick={() => setActivePage('staff_dashboard')}
                className={`transition-colors whitespace-nowrap py-1 cursor-pointer ${
                  activePage === 'staff_dashboard'
                    ? 'text-teal-700 font-semibold border-b-2 border-teal-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Facilities Staff Console
              </button>
            )}

            {!isStaff ? (
              <button
                onClick={() => setActivePage('student_history')}
                className={`transition-colors whitespace-nowrap py-1 cursor-pointer ${
                  activePage === 'student_history' || activePage === 'ticket_tracking'
                    ? 'text-teal-700 font-semibold border-b-2 border-teal-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Track a Ticket
              </button>
            ) : selectedTicketId ? (
              <button
                onClick={() => setActivePage('ticket_tracking')}
                className={`transition-colors whitespace-nowrap py-1 cursor-pointer ${
                  activePage === 'ticket_tracking'
                    ? 'text-teal-700 font-semibold border-b-2 border-teal-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Track Ticket
              </button>
            ) : null}
          </nav>

          <nav className="campusfix-mobile-nav md:hidden order-3 flex w-full items-center gap-2 overflow-x-auto pb-1" aria-label="Main navigation">
            {!isStaff ? (
              <>
                <button onClick={() => setActivePage('student_dashboard')} className={activePage === 'student_dashboard' ? 'is-active' : ''}>My Work Orders</button>
                <button onClick={() => setActivePage('student_history')} className={activePage === 'student_history' ? 'is-active' : ''}>Complaint History</button>
                <button onClick={() => setActivePage('new_complaint')} className={['new_complaint', 'clarification', 'review_confirm', 'duplicate_review'].includes(activePage) ? 'is-active' : ''}>Report a Defect</button>
              </>
            ) : (
              <button onClick={() => setActivePage('staff_dashboard')} className={activePage === 'staff_dashboard' ? 'is-active' : ''}>Staff Console</button>
            )}
            {!isStaff ? (
              <button onClick={() => setActivePage('student_history')} className={activePage === 'student_history' || activePage === 'ticket_tracking' ? 'is-active' : ''}>Track a Ticket</button>
            ) : selectedTicketId ? (
              <button onClick={() => setActivePage('ticket_tracking')} className={activePage === 'ticket_tracking' ? 'is-active' : ''}>Track Ticket</button>
            ) : null}
          </nav>

          {/* Zone 3: Authenticated User Badge & Logout */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Resetting the shared demo dataset is restricted to staff. */}
            {isStaff && <button
              onClick={onResetDemoData}
              disabled={isResetting}
              title="Reset demonstration records"
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>{isResetting ? 'Resetting...' : 'Reset Records'}</span>
            </button>}

            {/* Authenticated User Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-[11px] font-extrabold text-white shadow-sm ${isStaff ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-indigo-500 to-fuchsia-500'}`} aria-label={`${currentUser.role} profile`}>
                {initials}
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-900 leading-tight">
                  {currentUser.name.split(' (')[0]}
                </div>
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                  {currentUser.category || currentUser.role}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              title="Sign out of CampusFix AI"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
            <button type="button" onClick={onToggleTheme} aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`} title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-100">
              {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
