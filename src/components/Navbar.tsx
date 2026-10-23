import React from 'react';
import { 
  Building2, 
  RotateCcw, 
  ShieldCheck, 
  GraduationCap,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import type { AuthUser } from '../services/api';

export type ActivePage = 
  | 'student_dashboard' 
  | 'new_complaint' 
  | 'clarification' 
  | 'review_confirm' 
  | 'duplicate_review' 
  | 'ticket_tracking' 
  | 'staff_dashboard';

export type UserRole = 'student' | 'staff';

export interface NavbarProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  currentUser?: AuthUser | null;
  userRole?: UserRole;
  setUserRole?: (role: UserRole) => void;
  onLogout?: () => void;
  onResetDemoData: () => void;
  isResetting: boolean;
  selectedTicketId: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  setActivePage,
  currentUser,
  userRole = 'student',
  setUserRole,
  onLogout,
  onResetDemoData,
  isResetting,
  selectedTicketId,
}) => {
  const currentRole = currentUser?.role || userRole;
  const isStaff = currentRole === 'staff';
  const displayName = currentUser?.name ? currentUser.name.split(' (')[0] : (isStaff ? 'Marcus Vance' : 'Alex Chen');

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
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

            {selectedTicketId && (
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
            )}
          </nav>

          {/* Zone 3: Authenticated User Badge & Logout */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Quick Demo Reset Button */}
            <button
              onClick={onResetDemoData}
              disabled={isResetting}
              title="Reset demonstration records"
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>{isResetting ? 'Resetting...' : 'Reset Records'}</span>
            </button>

            {/* Authenticated User Pill with Role Switcher */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-white shadow-xs">
                {isStaff ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                ) : (
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                )}
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-900 leading-tight">
                  {displayName}
                </div>
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                  {currentRole}
                </div>
              </div>
              {setUserRole && (
                <button
                  type="button"
                  onClick={() => {
                    const nextRole = isStaff ? 'student' : 'staff';
                    setUserRole(nextRole);
                    setActivePage(nextRole === 'staff' ? 'staff_dashboard' : 'student_dashboard');
                  }}
                  title={`Switch to ${isStaff ? 'Student' : 'Staff'} view`}
                  className="ml-1 text-[10px] font-semibold text-teal-700 hover:text-teal-900 bg-white hover:bg-teal-50 px-1.5 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
                >
                  Switch
                </button>
              )}
            </div>

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                title="Sign out of CampusFix AI"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
