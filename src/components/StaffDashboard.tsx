import React, { useState, useMemo, useEffect } from 'react';
import { clearAccountFlag, fetchFlaggedAccounts, type FlaggedAccount } from '../services/api';
import { Ticket, TicketCategory, TicketPriority, TicketStatus, DepartmentName } from '../types/ticket';
import { StatusBadge, PriorityBadge, CategoryIcon } from './Badge';
import { ScrollReveal } from './ScrollReveal';
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
  ShieldAlert,
  Link as LinkIcon,
  Users,
  RotateCcw,
  SlidersHorizontal,
  PlayCircle
} from 'lucide-react';

interface StaffDashboardProps {
  tickets: Ticket[];
  currentUserName: string;
  onOpenTicketDetails: (ticket: Ticket) => void;
  onViewStudentTracking: (ticketId: string) => void;
  onRunE2ETest?: () => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  tickets,
  currentUserName,
  onOpenTicketDetails,
  onViewStudentTracking,
  onRunE2ETest,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'All'>('All');
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentName | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'All'>('All');
  const [flaggedAccounts, setFlaggedAccounts] = useState<FlaggedAccount[]>([]);
  const [flagQueueError, setFlagQueueError] = useState('');
  const [clearingFlagId, setClearingFlagId] = useState<string | null>(null);
  useEffect(() => { fetchFlaggedAccounts().then(setFlaggedAccounts).catch((error) => setFlagQueueError(error.message)); }, []);
  const firstName = currentUserName.trim().split(/\s+/)[0] || 'there';

  // Exact metric counts derived directly from live stored ticket data
  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === 'Open').length;
  const inProgressCount = tickets.filter((t) => t.status === 'In Progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'Resolved').length;
  const safetyCount = tickets.filter((t) => t.isSafetyHazard && t.status !== 'Resolved').length;

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;
      const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
      const matchesDepartment = departmentFilter === 'All' || t.assignedDepartment === departmentFilter;
      const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
      
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        t.ticketId.toLowerCase().includes(q) ||
        t.issueSummary.toLowerCase().includes(q) ||
        t.reportedLocation.toLowerCase().includes(q) ||
        t.assignedDepartment.toLowerCase().includes(q) ||
        t.reporterName.toLowerCase().includes(q);

      return matchesCategory && matchesPriority && matchesDepartment && matchesStatus && matchesSearch;
    });
  }, [tickets, categoryFilter, priorityFilter, departmentFilter, statusFilter, searchQuery]);

  const hasActiveFilters = 
    searchQuery !== '' || 
    categoryFilter !== 'All' || 
    priorityFilter !== 'All' || 
    departmentFilter !== 'All' || 
    statusFilter !== 'All';

  const resetAllFilters = () => {
    setSearchQuery('');
    setCategoryFilter('All');
    setPriorityFilter('All');
    setDepartmentFilter('All');
    setStatusFilter('All');
  };

  return (
    <div className="space-y-6">
      {/* Staff Header & KPI strip */}
      <ScrollReveal>
      <div className="staff-overview bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Campus Facility Operations & Work Order Dispatch</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
              Welcome, {firstName}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Your facilities workspace is ready. Triage reports, dispatch the right crew, and keep campus moving.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {onRunE2ETest && (
              <button
                onClick={onRunE2ETest}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-semibold transition-colors cursor-pointer"
                title="Run full 8-step automated verification test"
              >
                <PlayCircle className="w-3.5 h-3.5 text-teal-600" />
                <span>Run E2E Audit Test</span>
              </button>
            )}
            <span className="text-xs font-mono font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              Role: Authorized Staff
            </span>
          </div>
        </div>

        {/* 4 Core Required Metrics + Safety Hazard Monitor */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-6">
          {/* Total Tickets */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Total Tickets
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">
              {totalCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across all facilities</div>
          </div>

          {/* Open Tickets */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
            <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Open Tickets</span>
            </div>
            <div className="text-2xl font-bold text-amber-900 mt-1 tabular-nums font-mono">
              {openCount}
            </div>
            <div className="text-[11px] text-amber-700 mt-0.5">Awaiting crew assignment</div>
          </div>

          {/* In-Progress Tickets */}
          <div className="p-4 rounded-xl bg-cyan-50/70 border border-cyan-200">
            <div className="text-[11px] font-semibold text-cyan-800 uppercase tracking-wide flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-cyan-600" />
              <span>In-Progress Tickets</span>
            </div>
            <div className="text-2xl font-bold text-cyan-900 mt-1 tabular-nums font-mono">
              {inProgressCount}
            </div>
            <div className="text-[11px] text-cyan-700 mt-0.5">Active field dispatch</div>
          </div>

          {/* Resolved Tickets */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Resolved Tickets</span>
            </div>
            <div className="text-2xl font-bold text-emerald-900 mt-1 tabular-nums font-mono">
              {resolvedCount}
            </div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Verified with notes</div>
          </div>

          {/* Safety Alert Tickets */}
          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-semibold text-rose-800 uppercase tracking-wide flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-600" />
              <span>Safety Alerts</span>
            </div>
            <div className="text-2xl font-bold text-rose-900 mt-1 tabular-nums font-mono">
              {safetyCount}
            </div>
            <div className="text-[11px] text-rose-700 mt-0.5">Urgent priority risk</div>
          </div>
        </div>
      </div>
      </ScrollReveal>

      <ScrollReveal delay={45}>
        <section className="bg-rose-50 rounded-xl border border-rose-200 p-5 shadow-xs" aria-labelledby="flagged-accounts-title">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h2 id="flagged-accounts-title" className="flex items-center gap-2 text-sm font-bold text-rose-900"><ShieldAlert className="w-4 h-4" />Flagged accounts</h2>
              <p className="text-xs text-rose-800 mt-1">Review each flag before clearing it. Flagged students cannot sign in.</p>
            </div>
            <span className="rounded-full bg-white border border-rose-200 px-2.5 py-1 text-xs font-bold text-rose-800">{flaggedAccounts.length}</span>
          </div>
          {flagQueueError ? <p className="text-sm text-rose-800">{flagQueueError}</p> : flaggedAccounts.length === 0 ? <p className="text-sm text-slate-600">No accounts are currently flagged.</p> : (
            <ul className="divide-y divide-rose-200">
              {flaggedAccounts.map((account) => <li key={account.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{account.full_name || 'CampusFix student'}</p>
                  <p className="text-xs text-slate-700 mt-0.5">{account.flag_reason || 'Integrity review requested.'}</p>
                  {account.flagged_at && <p className="text-[11px] text-slate-500 mt-1">Flagged {new Date(account.flagged_at).toLocaleString()}</p>}
                </div>
                <button type="button" disabled={clearingFlagId === account.id} onClick={async () => {
                  setClearingFlagId(account.id);
                  try { await clearAccountFlag(account.id); setFlaggedAccounts((items) => items.filter((item) => item.id !== account.id)); }
                  catch (error) { setFlagQueueError(error instanceof Error ? error.message : 'Could not clear account flag.'); }
                  finally { setClearingFlagId(null); }
                }} className="shrink-0 rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-rose-900 hover:bg-rose-100 disabled:opacity-60">
                  {clearingFlagId === account.id ? 'Saving…' : 'Clear flag after review'}
                </button>
              </li>)}
            </ul>
          )}
        </section>
      </ScrollReveal>

      {/* Filters and Search Bar */}
      <ScrollReveal delay={70}>
      <div className="staff-filters bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search box */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ticket ID (e.g. TKT-2025-...), summary, location, department, student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 bg-white"
            />
          </div>

          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="text-slate-900 font-bold tabular-nums">{filteredTickets.length}</span> of {tickets.length} tickets
            </div>
          </div>
        </div>

        {/* 4 Required Filters: Category, Priority, Department, Status */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Category Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 uppercase block mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="All">All Categories (4)</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Electricity">Electricity</option>
              <option value="Cleanliness">Cleanliness</option>
              <option value="Internet Connectivity">Internet Connectivity</option>
            </select>
          </div>

          {/* 2. Priority Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 uppercase block mb-1">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* 3. Department Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 uppercase block mb-1">
              Assigned Department
            </label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="All">All Departments (4)</option>
              <option value="Plumbing / Water Maintenance">Plumbing / Water Maintenance</option>
              <option value="Electrical Maintenance">Electrical Maintenance</option>
              <option value="Housekeeping / Sanitation">Housekeeping / Sanitation</option>
              <option value="IT / Network Support">IT / Network Support</option>
            </select>
          </div>

          {/* 4. Status Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 uppercase block mb-1">
              Current Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>
      </ScrollReveal>

      {/* Main Ticket Table Viewport (Clean administrative table with responsive horizontal scroll) */}
      <ScrollReveal delay={110}>
      <div className="staff-ticket-table bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span>Campus Facility Work Order Table</span>
              <span className="text-[11px] font-mono text-slate-500 font-normal">
                ({filteredTickets.length} records)
              </span>
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Click &quot;Manage&quot; to inspect details, reassign department, or update status
          </span>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-xs text-slate-500 font-medium">
              No tickets match your filter criteria.
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th scope="col" className="py-3 px-4">Ticket ID</th>
                  <th scope="col" className="py-3 px-4">Category</th>
                  <th scope="col" className="py-3 px-4">Issue Summary</th>
                  <th scope="col" className="py-3 px-4">Location</th>
                  <th scope="col" className="py-3 px-4">Priority</th>
                  <th scope="col" className="py-3 px-4">Assigned Department</th>
                  <th scope="col" className="py-3 px-4">Status</th>
                  <th scope="col" className="py-3 px-4">Created Time</th>
                  <th scope="col" className="py-3 px-4">Duplicate / Links</th>
                  <th scope="col" className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((t) => {
                  const hasDuplicateLink = !!t.relatedTicketId;
                  const hasSubscribers = t.trackedBy && t.trackedBy.length > 1;

                  return (
                    <tr
                      key={t.ticketId}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* 1. Ticket ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{t.ticketId}</span>
                          {t.isSafetyHazard && (
                            <span 
                              className="text-rose-600" 
                              title={`Safety Hazard: ${t.safetyWarning || 'Urgent attention required'}`}
                            >
                              <Flame className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <CategoryIcon category={t.category} className="w-4 h-4" />
                          <span>{t.category}</span>
                        </div>
                      </td>

                      {/* 3. Issue Summary */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 line-clamp-2 leading-snug">
                          {t.issueSummary}
                        </div>
                        {t.status === 'Resolved' && t.resolutionNotes && (
                          <div className="text-[11px] text-emerald-700 font-medium line-clamp-1 mt-0.5">
                            ✓ {t.resolutionNotes}
                          </div>
                        )}
                      </td>

                      {/* 4. Location */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium">{t.reportedLocation}</span>
                        </div>
                      </td>

                      {/* 5. Priority */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <PriorityBadge priority={t.priority} size="sm" />
                      </td>

                      {/* 6. Assigned Department */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200/80">
                          {t.assignedDepartment}
                        </span>
                      </td>

                      {/* 7. Current Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={t.status} size="sm" />
                      </td>

                      {/* 8. Creation Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {new Date(t.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        {new Date(t.createdAt).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* 9. Possible Duplicate Indicator */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {hasDuplicateLink ? (
                          <span 
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200"
                            title={`Linked to original ticket: ${t.relatedTicketId}`}
                          >
                            <LinkIcon className="w-3 h-3 text-indigo-500" />
                            <span>Linked ({t.relatedTicketId})</span>
                          </span>
                        ) : hasSubscribers ? (
                          <span 
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200"
                            title={`${t.trackedBy.length} students reported/tracking this same issue`}
                          >
                            <Users className="w-3 h-3 text-amber-600" />
                            <span>Merged ({t.trackedBy.length})</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* 10. Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewStudentTracking(t.ticketId)}
                            className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            title="Open student tracking page"
                          >
                            Student View
                          </button>
                          <button
                            onClick={() => onOpenTicketDetails(t)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold rounded-md bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer"
                          >
                            <Wrench className="w-3 h-3 text-teal-400" />
                            <span>Manage</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mobile-Friendly Cards for smaller screens when viewport is restricted */}
      <div className="staff-mobile-table-note block md:hidden bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700 mb-1">
          Horizontal scroll enabled for administrative table above
        </p>
        <p>Swipe left/right on table to inspect all columns, or select &quot;Manage&quot; to review full details.</p>
      </div>
      </ScrollReveal>
    </div>
  );
};
