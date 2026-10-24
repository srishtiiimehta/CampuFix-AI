import React, { useEffect, useRef, useState } from 'react';
import { Ticket, TicketCategory } from '../types/ticket';
import { StatusBadge, PriorityBadge, CategoryIcon } from './Badge';
import { ScrollReveal } from './ScrollReveal';
import { 
  Plus, 
  Search, 
  ArrowRight, 
  MapPin, 
  Users,
  Compass,
  Wrench,
  CheckCircle2,
  Building2
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
  const heroSceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = heroSceneRef.current;
    if (!scene || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const updateParallax = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const offset = scene.getBoundingClientRect().top * -0.025;
        scene.style.setProperty('--parallax-y', `${Math.max(-12, Math.min(12, offset))}px`);
      });
    };
    updateParallax();
    window.addEventListener('scroll', updateParallax, { passive: true });
    window.addEventListener('resize', updateParallax);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateParallax);
      window.removeEventListener('resize', updateParallax);
    };
  }, []);
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
      <ScrollReveal className="student-intro-reveal">
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
            <div className="student-hero-aside">
              <div ref={heroSceneRef} className="student-hero-scene" aria-hidden="true">
                <span className="scene-orbit scene-orbit-a" /><span className="scene-orbit scene-orbit-b" />
                <span className="scene-sphere" />
                <svg className="scene-building" viewBox="0 0 360 245" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="m34 93 146-65 146 65v111H34V93Z" fill="#E6F0E5" />
                  <path d="m34 93 146-65 146 65-146 34L34 93Z" fill="#F7F3E9" />
                  <path d="M34 93 180 127v18L34 111V93Zm146 34 146-34v18l-146 34v-18Z" fill="#A8D4D3" />
                  <path d="m60 139 120 27 120-27v65H60v-65Z" fill="#C7DCC7" />
                  <path d="m60 139 120 27v38H60v-65Z" fill="#DDF0E7" />
                  <path d="m180 166 120-27v65H180v-38Z" fill="#B7D5C5" />
                  <path d="M158 169h44v43h-44z" fill="#103E32" />
                  <path d="M76 151h31v24H76zm47 10h23v21h-23zm98 0h23v21h-23zm39-10h27v24h-27z" fill="#A8D4D3" />
                  <path d="M82 156h19v14H82zm47 15h11v6h-11zm98-5h11v11h-11zm39-10h15v14h-15z" fill="#F7F3E9" />
                  <path d="M24 212h312" stroke="#F7F3E9" strokeWidth="5" strokeLinecap="round" />
                </svg>
                <span className="scene-spark scene-spark-a">✦</span><span className="scene-spark scene-spark-b">✳</span>
                <div className="scene-note"><span className="scene-note-icon">↗</span><span><b>Better campus, together</b><small>One clear place to start</small></span></div>
              </div>
              <div className="student-identity-card">
                <div className="student-avatar">{initials}</div>
                <div><div className="text-sm font-bold">{currentStudentName || 'Student'}</div><div className="mt-0.5 text-xs text-white/70">CampusFix student</div></div>
                <span className="identity-status" aria-label="Signed in" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="dashboard-stat"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[.14em] text-slate-600">Open issues</span><span className="rounded-xl bg-amber-100 p-2 text-amber-800"><Wrench className="h-4 w-4" /></span></div><div className="stat-number mt-4">{activeCount}</div><div className="mt-2 text-xs text-slate-500">Your open or active reports</div></div>
          <div className="dashboard-stat"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[.14em] text-slate-600">Issues you follow</span><span className="rounded-xl bg-sky-100 p-2 text-sky-800"><Users className="h-4 w-4" /></span></div><div className="stat-number mt-4">{trackedCount}</div><div className="mt-2 text-xs text-slate-500">Issues you’re following with others</div></div>
          <div className="dashboard-stat"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[.14em] text-slate-600">Repairs completed</span><span className="rounded-xl bg-emerald-100 p-2 text-emerald-800"><CheckCircle2 className="h-4 w-4" /></span></div><div className="stat-number mt-4">{resolvedCount}</div><div className="mt-2 text-xs text-slate-500">Repairs completed for your reports</div></div>
        </div>
      </section>
      </ScrollReveal>

      <ScrollReveal className="workflow-reveal">
        <section className="workflow-story" aria-labelledby="workflow-title">
          <div className="workflow-sticky">
            <span className="workflow-kicker">A simpler way to get things fixed</span>
            <h2 id="workflow-title">From “something’s wrong” to “all fixed.”</h2>
            <p>CampusFix keeps the report, the right facilities team, and the latest update connected in one place.</p>
            <div className="workflow-graphic" aria-hidden="true">
              <div className="workflow-graphic-orbit" />
              <div className="workflow-building"><Building2 /></div>
              <span className="workflow-graphic-spark">✦</span>
              <span className="workflow-graphic-dot" />
              <span className="workflow-graphic-label">CAMPUS / CONNECTED</span>
            </div>
          </div>
          <div className="workflow-steps">
            <article className="workflow-step"><span className="workflow-step-number">01</span><div><h3>Tell us what happened</h3><p>Describe the issue in your own words and add a photo if it helps.</p></div><span className="workflow-step-mark">↗</span></article>
            <article className="workflow-step"><span className="workflow-step-number">02</span><div><h3>Review the details</h3><p>Check the summary and category before your report becomes a work order.</p></div><span className="workflow-step-mark">✳</span></article>
            <article className="workflow-step"><span className="workflow-step-number">03</span><div><h3>Follow the progress</h3><p>See the current status, updates, and notes as the facilities team responds.</p></div><span className="workflow-step-mark">✓</span></article>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={70}>
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
      </ScrollReveal>
      {/* Ticket List Section with Segmented Tabs and Filters */}
      <ScrollReveal delay={100}>
      <div className="space-y-4">
        <div className="student-filter-row flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Segmented Tab Controls */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 student-tabs">
            <button
              onClick={() => setActiveTab('my_tickets')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'my_tickets'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Complaint History ({myTickets.length})
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
                : activeTab === 'my_tickets'
                  ? 'Your reported complaints will appear here with their latest staff status and update history.'
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
                className="ticket-card bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-all hover:shadow-xs group"
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
      </ScrollReveal>
    </div>
  );
};


