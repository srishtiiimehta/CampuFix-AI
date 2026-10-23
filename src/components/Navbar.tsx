import React from 'react';
import { 
  Building2, 
  RotateCcw, 
  ShieldCheck, 
  GraduationCap
} from 'lucide-react';

export type ActivePage = 
  | 'student_dashboard' 
  | 'new_complaint' 
  | 'clarification' 
  | 'review_confirm' 
  | 'duplicate_review' 
  | 'ticket_tracking' 
  | 'staff_dashboard';

export type UserRole = 'student' | 'staff';

interface NavbarProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  onResetDemoData: () => void;
  isResetting: boolean;
  selectedTicketId: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  setActivePage,
  userRole,
  setUserRole,
  onResetDemoData,
  isResetting,
  selectedTicketId,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActivePage(userRole === 'staff' ? 'staff_dashboard' : 'student_dashboard')}
              className="flex items-center gap-2.5 text-left focus:outline-none group"
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

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            <button
              onClick={() => setActivePage('student_dashboard')}
              className={`transition-colors whitespace-nowrap py-1 ${
                activePage === 'student_dashboard'
                  ? 'text-teal-700 font-semibold border-b-2 border-teal-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Student Portal
            </button>

            <button
              onClick={() => setActivePage('new_complaint')}
              className={`transition-colors whitespace-nowrap py-1 ${
                activePage === 'new_complaint' || activePage === 'clarification' || activePage === 'review_confirm' || activePage === 'duplicate_review'
                  ? 'text-teal-700 font-semibold border-b-2 border-teal-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Report Problem
            </button>

            {selectedTicketId && (
              <button
                onClick={() => setActivePage('ticket_tracking')}
                className={`transition-colors whitespace-nowrap py-1 ${
                  activePage === 'ticket_tracking'
                    ? 'text-teal-700 font-semibold border-b-2 border-teal-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Track Ticket
              </button>
            )}

            <button
              onClick={() => {
                setUserRole('staff');
                setActivePage('staff_dashboard');
              }}
              className={`transition-colors whitespace-nowrap py-1 ${
                activePage === 'staff_dashboard'
                  ? 'text-teal-700 font-semibold border-b-2 border-teal-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Staff Console
            </button>
          </nav>

          {/* Zone 3: Primary Action / Role Switcher */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Quick Demo Reset Button */}
            <button
              onClick={onResetDemoData}
              disabled={isResetting}
              title="Reset demonstration records (Library WiFi, Chem Lab leak, etc.)"
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>{isResetting ? 'Resetting...' : 'Reset Demo Data'}</span>
            </button>

            {/* Role Switcher Segmented Control */}
            <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200/80">
              <button
                onClick={() => {
                  setUserRole('student');
                  if (activePage === 'staff_dashboard') {
                    setActivePage('student_dashboard');
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                  userRole === 'student'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
                <span>Student</span>
              </button>

              <button
                onClick={() => {
                  setUserRole('staff');
                  setActivePage('staff_dashboard');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                  userRole === 'staff'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>Staff</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
