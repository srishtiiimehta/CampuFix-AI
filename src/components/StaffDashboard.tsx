import React, { useState } from 'react';
import { Ticket, TicketCategory, TicketPriority, TicketStatus } from '../types/ticket';
import { StatusBadge, PriorityBadge, CategoryIcon } from './Badge';
import { 
  Search, 
  Filter, 
  ShieldCheck, 
  Flame, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Wrench, 
  User, 
  ExternalLink,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface StaffDashboardProps {
  tickets: Ticket[];
  onOpenTicketDetails: (ticket: Ticket) => void;
  onViewStudentTracking: (ticketId: string) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  tickets,
  onOpenTicketDetails,
  onViewStudentTracking,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'All'>('All');

  // Metrics
  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === 'Open').length;
  const inProgressCount = tickets.filter((t) => t.status === 'In Progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'Resolved').length;
  const safetyCount = tickets.filter((t) => t.isSafetyHazard && t.status !== 'Resolved').length;

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;
    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === '' ||
      t.ticketId.toLowerCase().includes(q) ||
      t.issueSummary.toLowerCase().includes(q) ||
      t.reportedLocation.toLowerCase().includes(q) ||
      t.assignedDepartment.toLowerCase().includes(q) ||
      t.reporterName.toLowerCase().includes(q);

    return matchesCategory && matchesPriority && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Staff Header & KPI strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Campus Facility Operations & Work Order Dispatch</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
              Staff Maintenance Dashboard
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Logged in as Marcus Vance (Facility Operations Lead). Triage incoming Gemini-diagnosed reports, dispatch field technicians, and verify resolution notes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              Role: Authorized Staff
            </span>
          </div>
        </div>

        {/* 5 KPI Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-6">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Tickets</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5 tabular-nums font-mono">{totalCount}</div>
            <div className="text-[11px] text-slate-400">All campus departments</div>
          </div>

          <div className="p-3.5 rounded-lg bg-amber-50/60 border border-amber-200">
            <div className="text-[11px] font-semibold text-amber-800 uppercase">Open / Queued</div>
            <div className="text-2xl font-bold text-amber-900 mt-0.5 tabular-nums font-mono">{openCount}</div>
            <div className="text-[11px] text-amber-700">Awaiting technician dispatch</div>
          </div>

          <div className="p-3.5 rounded-lg bg-cyan-50/60 border border-cyan-200">
            <div className="text-[11px] font-semibold text-cyan-800 uppercase">In Progress</div>
            <div className="text-2xl font-bold text-cyan-900 mt-0.5 tabular-nums font-mono">{inProgressCount}</div>
            <div className="text-[11px] text-cyan-700">Crews actively on site</div>
          </div>

          <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-200">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase">Resolved</div>
            <div className="text-2xl font-bold text-emerald-900 mt-0.5 tabular-nums font-mono">{resolvedCount}</div>
            <div className="text-[11px] text-emerald-700">Signed off with notes</div>
          </div>

          <div className="p-3.5 rounded-lg bg-rose-50/60 border border-rose-200 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-semibold text-rose-800 uppercase flex items-center gap-1">
              <Flame className="w-3 h-3 text-rose-600" />
              <span>Safety Alerts</span>
            </div>
            <div className="text-2xl font-bold text-rose-900 mt-0.5 tabular-nums font-mono">{safetyCount}</div>
            <div className="text-[11px] text-rose-700">Urgent physical risk</div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ticket ID, building, keyword, reporter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
            />
          </div>

          {/* Quick filter summary */}
          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="text-slate-900 font-bold tabular-nums">{filteredTickets.length}</span> of {tickets.length} tickets
          </div>
        </div>

        {/* Filter Dropdowns / Segmented selectors */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Category Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 uppercase block mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="All">All Categories (4 Allowed)</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Electricity">Electricity</option>
              <option value="Cleanliness">Cleanliness</option>
              <option value="Internet Connectivity">Internet Connectivity</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 uppercase block mb-1">
              Priority Level
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 uppercase block mb-1">
              Progress Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Table / List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Work Orders & Dispatch Queue
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">
            Sorted by recent updates
          </span>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No maintenance tickets match the selected filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTickets.map((t) => (
              <div
                key={t.ticketId}
                className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Left ticket overview */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-mono font-bold text-slate-900">{t.ticketId}</span>

                    {t.isDemo && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        DEMO
                      </span>
                    )}

                    <span className="text-slate-300">·</span>

                    <div className="flex items-center gap-1 font-semibold text-slate-800">
                      <CategoryIcon category={t.category} className="w-3.5 h-3.5" />
                      <span>{t.category}</span>
                    </div>

                    <span className="text-slate-300">·</span>

                    <StatusBadge status={t.status} size="sm" />

                    <PriorityBadge priority={t.priority} size="sm" />

                    {t.isSafetyHazard && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        <Flame className="w-3 h-3 text-rose-600" />
                        HAZARD
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                    {t.issueSummary}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.reportedLocation}</span>
                    </div>

                    <span className="text-slate-300">·</span>

                    <div className="text-slate-600 font-medium">
                      {t.assignedDepartment}
                    </div>

                    <span className="text-slate-300">·</span>

                    <div className="flex items-center gap-1 text-slate-400">
                      <User className="w-3 h-3" />
                      <span>{t.reporterName}</span>
                    </div>
                  </div>

                  {/* Resolution Notes display if resolved */}
                  {t.status === 'Resolved' && t.resolutionNotes && (
                    <div className="mt-2 text-xs text-emerald-800 bg-emerald-50/60 p-2 rounded border border-emerald-100">
                      <span className="font-semibold">Resolution Note: </span>
                      {t.resolutionNotes}
                    </div>
                  )}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                  <button
                    onClick={() => onViewStudentTracking(t.ticketId)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                    title="View public student tracking page"
                  >
                    Track View
                  </button>

                  <button
                    onClick={() => onOpenTicketDetails(t)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5 text-teal-400" />
                    <span>Manage Status</span>
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
