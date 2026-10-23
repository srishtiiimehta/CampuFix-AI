import React, { useState } from 'react';
import { Ticket, TicketCategory } from '../types/ticket';
import { StatusBadge, PriorityBadge, CategoryIcon } from './Badge';
import { 
  Plus, 
  Search, 
  ArrowRight, 
  MapPin, 
  Users,
  Compass,
  Sparkles,
  Wrench,
  CheckCircle2
} from 'lucide-react';

interface StudentDashboardProps {
  tickets: Ticket[];
  currentStudentId: string;
  currentStudentName: string;
  onNewComplaint: () => void;
  onSelectTicket: (ticketId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  tickets,
  currentStudentId,
  currentStudentName,
  onNewComplaint,
  onSelectTicket,
}) => {
  const [activeTab, setActiveTab] = useState<'my_tickets' | 'tracked_tickets' | 'all_campus'>('my_tickets');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | 'All'>('All');
  const firstName = currentStudentName.trim().split(/\s+/)[0] || 'there';
  const initials = currentStudentName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'CF';

  // Filtered views
  const myTickets = tickets.filter((t) => t.reporterId === currentStudentId);
  const trackedTickets = tickets.filter(
    (t) => t.trackedBy?.includes(currentStudentId) && t.reporterId !== currentStudentId
  );

  const displayedList = activeTab === 'my_tickets'
    ? myTickets
    : activeTab === 'tracked_tickets'
    ? trackedTickets
    : tickets;

  const filteredTickets = displayedList.filter((ticket) => {
    const matchesCategory = selectedCategory === 'All' || ticket.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      ticket.issueSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.reportedLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticketId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeCount = myTickets.filter((t) => t.status !== 'Resolved').length;
  const trackedCount = trackedTickets.length;
  const resolvedCount = myTickets.filter((t) => t.status === 'Resolved').length;

  return (
    <div className="space-y-8">
      {/* Personalized welcome and campus impact */}
      <section className="space-y-4">
        <div className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 p-6 text-white shadow-xl shadow-indigo-200/60 sm:p-8">
          <div aria-hidden="true" className="absolute -right-10 -top-16 -z-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div aria-hidden="true" className="absolute bottom-[-5rem] right-1/3 -z-10 h-48 w-48 rounded-full bg-pink-300/20 blur-3xl" />
          <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-center">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-white/95 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                <span>YOUR CAMPUS, YOUR CALL</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Hey, {firstName}! <span aria-hidden="true">👋</span></h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-50 sm:text-base">
                Spot something broken? Drop it here. We’ll get it to the right crew so you can get back to your day.
              </p>
              <button
                onClick={onNewComplaint}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-700 shadow-lg shadow-indigo-950/10 transition hover:-translate-y-0.5 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
              >
                <Plus className="h-4 w-4" />
                <span>Report a problem</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-3.5 backdrop-blur-md sm:self-start">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-extrabold text-indigo-700 shadow-sm">{initials}</div>
              <div>
                <div className="text-sm font-bold">{currentStudentName || 'Student'}</div>
                <div className="mt-0.5 text-xs text-indigo-100">CampusFix student</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm">
            <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-amber-800">In the works</span><span className="rounded-xl bg-amber-100 p-2 text-amber-700"><Wrench className="h-4 w-4" /></span></div>
            <div className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">{activeCount}</div>
            <div className="mt-1 text-xs text-slate-500">Your open or active reports</div>
          </div>
          <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-4 shadow-sm">
            <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-sky-800">Community mode</span><span className="rounded-xl bg-sky-100 p-2 text-sky-700"><Users className="h-4 w-4" /></span></div>
            <div className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">{trackedCount}</div>
            <div className="mt-1 text-xs text-slate-500">Issues you’re following with others</div>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
            <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Fixed up</span><span className="rounded-xl bg-emerald-100 p-2 text-emerald-700"><CheckCircle2 className="h-4 w-4" /></span></div>
            <div className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">{resolvedCount}</div>
            <div className="mt-1 text-xs text-slate-500">Repairs completed for your reports</div>
          </div>
        </div>
      </section>

      {/* 4 Allowed Categories Reference strip */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-teal-300">What can we fix? Pick a lane</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              We route each report to the campus team that can sort it out:
            </p>
          </div>
          <span className="text-xs text-teal-400 font-mono">Straight to the right crew ✨</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80">
            <div className="text-xs font-semibold text-teal-400">1. Plumbing</div>
            <div className="text-xs text-slate-300 mt-1 font-mono">Plumbing / Water Maint.</div>
            <div className="text-[11px] text-slate-400 mt-1">Leaks, low pressure, drainage, sinks, toilets</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80">
            <div className="text-xs font-semibold text-amber-400">2. Electricity</div>
            <div className="text-xs text-slate-300 mt-1 font-mono">Electrical Maintenance</div>
            <div className="text-[11px] text-slate-400 mt-1">Outlets, lighting fixtures, buzzing, breakers</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80">
            <div className="text-xs font-semibold text-emerald-400">3. Cleanliness</div>
            <div className="text-xs text-slate-300 mt-1 font-mono">Housekeeping / Sanitation</div>
            <div className="text-[11px] text-slate-400 mt-1">Spills, trash overflow, restroom sanitizing</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80">
            <div className="text-xs font-semibold text-sky-400">4. Internet Connectivity</div>
            <div className="text-xs text-slate-300 mt-1 font-mono">IT / Network Support</div>
            <div className="text-[11px] text-slate-400 mt-1">Eduroam wifi, latency, drops, ethernet ports</div>
          </div>
        </div>
      </div>

      {/* Ticket List Section with Segmented Tabs and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Segmented Tab Controls */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveTab('my_tickets')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'my_tickets'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Reported Issues ({myTickets.length})
            </button>
            <button
              onClick={() => setActiveTab('tracked_tickets')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'tracked_tickets'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tracked Issues ({trackedTickets.length})
            </button>
            <button
              onClick={() => setActiveTab('all_campus')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'all_campus'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Campus Issues ({tickets.length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search location, ticket ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900"
            />
          </div>
        </div>

        {/* Category Filters (Segmented interactive buttons) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 text-xs font-medium mr-1 shrink-0">Filter:</span>
          {(['All', 'Plumbing', 'Electricity', 'Cleanliness', 'Internet Connectivity'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white font-medium shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Tickets Grid / List */}
        {filteredTickets.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
            <Compass className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No maintenance tickets found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'All'
                ? 'Try broadening your search or resetting category filters.'
                : 'You have not reported or tracked any campus issues in this view.'}
            </p>
            <button
              onClick={onNewComplaint}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Report First Issue</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.ticketId}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-all hover:shadow-xs group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Category & Status */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                      <CategoryIcon category={ticket.category} className="w-4 h-4" />
                      <span>{ticket.category}</span>
                    </div>

                    <span className="text-slate-300" aria-hidden="true">·</span>

                    <span className="text-xs font-mono tabular-nums text-slate-700 font-semibold">
                      {ticket.ticketId}
                    </span>

                    <span className="text-slate-300" aria-hidden="true">·</span>

                    {ticket.isDemo ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        DEMO RECORD
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                        LIVE TICKET
                      </span>
                    )}

                    <span className="text-slate-300" aria-hidden="true">·</span>

                    <StatusBadge status={ticket.status} />

                    <PriorityBadge priority={ticket.priority} />
                  </div>

                  {/* Date & Tracked badge */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    {ticket.trackedBy && ticket.trackedBy.length > 1 && (
                      <span className="inline-flex items-center gap-1 text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>{ticket.trackedBy.length} students tracking</span>
                      </span>
                    )}
                    <span>{new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>

                {/* Summary & Location */}
                <div className="mt-3">
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {ticket.issueSummary}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{ticket.reportedLocation}</span>
                    <span className="text-slate-300" aria-hidden="true">·</span>
                    <span className="text-slate-600 font-medium">{ticket.assignedDepartment}</span>
                  </div>
                </div>

                {/* Optional resolution highlight if resolved */}
                {ticket.status === 'Resolved' && ticket.resolutionNotes && (
                  <div className="mt-3 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-900">
                    <span className="font-semibold text-emerald-950">Resolution Note: </span>
                    {ticket.resolutionNotes}
                  </div>
                )}

                {/* Action footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Reported by {ticket.reporterName}
                  </span>

                  <button
                    onClick={() => onSelectTicket(ticket.ticketId)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors cursor-pointer"
                  >
                    <span>View Tracking & History</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
