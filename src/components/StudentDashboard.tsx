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
        <div className="student-hero">
          <div className="hero-eyebrow mb-5">CampusFix AI / Your campus, better</div>
          <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <h1>YOUR CAMPUS.<br /><span className="hero-accent">LET’S FIX IT.</span></h1>
              <p className="mt-5">Broken lights? Leaky taps? Wi-Fi having a bad day? Tell us what’s up. We’ll get it to the right team.</p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button onClick={onNewComplaint} className="inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide">
                  <span>Report a problem</span><ArrowRight className="h-4 w-4" />
                </button>
                <a href="#campus-issues" className="rounded-full border border-white/35 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">Explore campus issues ↓</a>
              </div>
            </div>
            <div className="relative z-10 flex shrink-0 items-center gap-3 self-start rounded-2xl border border-white/20 bg-white/10 p-3.5 text-white backdrop-blur-md lg:self-end">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--orange)] text-lg font-extrabold text-[var(--ink)] shadow-sm">{initials}</div>
              <div><div className="text-sm font-bold">{currentStudentName || 'Student'}</div><div className="mt-0.5 text-xs text-white/70">CampusFix student</div></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="dashboard-stat"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[.14em] text-slate-600">Open issues</span><span className="rounded-xl bg-amber-100 p-2 text-amber-800"><Wrench className="h-4 w-4" /></span></div><div className="stat-number mt-4">{activeCount}</div><div className="mt-2 text-xs text-slate-500">Your open or active reports</div></div>
          <div className="dashboard-stat"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[.14em] text-slate-600">Issues you follow</span><span className="rounded-xl bg-sky-100 p-2 text-sky-800"><Users className="h-4 w-4" /></span></div><div className="stat-number mt-4">{trackedCount}</div><div className="mt-2 text-xs text-slate-500">Issues you’re following with others</div></div>
          <div className="dashboard-stat"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[.14em] text-slate-600">Repairs completed</span><span className="rounded-xl bg-emerald-100 p-2 text-emerald-800"><CheckCircle2 className="h-4 w-4" /></span></div><div className="stat-number mt-4">{resolvedCount}</div><div className="mt-2 text-xs text-slate-500">Repairs completed for your reports</div></div>
        </div>
      </section>

      <section id="campus-issues" className="category-showcase space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><div className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-[var(--orange)]">The campus fix list</div><h2>WHAT’S GOING ON?</h2><p className="mt-2 text-sm text-white/70">Pick a lane to see matching campus reports.</p></div>
          <span className="text-xs font-mono text-white/60">4 teams · one better campus</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {([
            { category: 'Plumbing', title: 'Water problems', icon: '↘', description: 'Leaks, taps, drains & more', tone: 'text-sky-200' },
            { category: 'Electricity', title: 'Lights & power', icon: 'ϟ', description: 'Flickers, outlets, buzzing', tone: 'text-amber-200' },
            { category: 'Cleanliness', title: 'Cleaning & spills', icon: '✳', description: 'Spills, bins, shared spaces', tone: 'text-emerald-200' },
            { category: 'Internet Connectivity', title: 'Wi-Fi & internet', icon: '⌁', description: 'Dead zones, drops, slow Wi-Fi', tone: 'text-violet-200' },
          ] as const).map((item, index) => (
            <button key={item.category} type="button" onClick={() => { setSelectedCategory(item.category); setActiveTab('all_campus'); }} className="category-tile group text-left text-white focus-visible:outline-offset-4">
              <div className="flex items-start justify-between"><span className="category-number">0{index + 1}</span><span aria-hidden="true" className={`text-4xl leading-none ${item.tone} transition-transform group-hover:-translate-y-1 group-hover:rotate-12`}>{item.icon}</span></div>
              <div className="mt-5 text-base font-extrabold">{item.title}</div><p className="mt-1 text-xs text-white/65">{item.description}</p>
            </button>
          ))}
        </div>
      </section>
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


