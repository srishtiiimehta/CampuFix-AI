import React, { useState } from 'react';
import { Ticket, TicketStatus, DepartmentName, TicketCategory } from '../types/ticket';
import { StatusBadge, PriorityBadge, CategoryIcon, HazardNotice } from './Badge';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  MapPin, 
  User, 
  ShieldCheck, 
  Camera, 
  FileText,
  Send,
  AlertTriangle,
  Building2,
  Sparkles,
  Link as LinkIcon,
  HelpCircle,
  MessageSquare,
  Users,
  ArrowRight
} from 'lucide-react';

interface StaffTicketDetailModalProps {
  ticket: Ticket;
  onClose: () => void;
  onUpdateStatus: (
    ticketId: string,
    newStatus: TicketStatus,
    notes: string,
    resolutionNotes?: string,
    assignedDepartment?: DepartmentName,
    staffNote?: string
  ) => Promise<void>;
  isUpdating: boolean;
}

const DEPARTMENTS: DepartmentName[] = [
  'Plumbing / Water Maintenance',
  'Electrical Maintenance',
  'Housekeeping / Sanitation',
  'IT / Network Support',
];

export const StaffTicketDetailModal: React.FC<StaffTicketDetailModalProps> = ({
  ticket,
  onClose,
  onUpdateStatus,
  isUpdating,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>(ticket.status);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentName>(ticket.assignedDepartment);
  const [progressNotes, setProgressNotes] = useState('');
  const [staffNote, setStaffNote] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState(ticket.resolutionNotes || '');
  const [validationError, setValidationError] = useState('');

  const handleApplyUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Strict requirement: Require staff to add resolution notes before marking a ticket resolved
    if (selectedStatus === 'Resolved') {
      if (!resolutionNotes || resolutionNotes.trim().length < 5) {
        setValidationError('Mandatory Requirement: Staff must enter concrete resolution notes (minimum 5 characters) before marking a ticket as Resolved.');
        return;
      }
    }

    try {
      await onUpdateStatus(
        ticket.ticketId,
        selectedStatus,
        progressNotes || `Staff updated status to ${selectedStatus}`,
        selectedStatus === 'Resolved' ? resolutionNotes.trim() : undefined,
        selectedDepartment,
        staffNote.trim() || undefined
      );
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Failed to update ticket');
    }
  };

  const hasMissingInfo = 
    (ticket.missingInformation && ticket.missingInformation.trim().length > 0) ||
    (ticket.clarificationQuestion && ticket.clarificationQuestion.trim().length > 0) ||
    ticket.requiresHumanReview;

  const hasLinkedReports = !!ticket.relatedTicketId || (ticket.trackedBy && ticket.trackedBy.length > 1);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-teal-400">STAFF WORK ORDER CONSOLE</span>
                <span className="text-slate-500">·</span>
                <span className="text-xs font-mono text-slate-300">{ticket.ticketId}</span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5 leading-snug">
                {ticket.issueSummary}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Key Metadata Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px] uppercase font-semibold">Category</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-900 mt-1">
                <CategoryIcon category={ticket.category} className="w-3.5 h-3.5" />
                <span>{ticket.category}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px] uppercase font-semibold">Priority</span>
              <div className="mt-1">
                <PriorityBadge priority={ticket.priority} size="sm" />
              </div>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px] uppercase font-semibold">Status</span>
              <div className="mt-1">
                <StatusBadge status={ticket.status} size="sm" />
              </div>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px] uppercase font-semibold">Reported At</span>
              <div className="font-mono text-slate-700 mt-1">
                {new Date(ticket.createdAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>

          {/* Safety Warning (if active hazard) */}
          {ticket.isSafetyHazard && (
            <HazardNotice warning={ticket.safetyWarning} />
          )}

          {/* 1. Original Complaint & Reporter Details */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Original Student Complaint</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-slate-700">{ticket.reporterName}</span>
                <span className="text-slate-400">({ticket.reporterId})</span>
              </div>
            </div>

            <div className="text-xs text-slate-800 space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-600 mb-2 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Reported Physical Location: <strong className="text-slate-900">{ticket.reportedLocation}</strong></span>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1">Student Stated Facts:</span>
                <ul className="list-disc list-inside space-y-1 pl-1 text-slate-700">
                  {ticket.studentProvidedFacts && ticket.studentProvidedFacts.length > 0 ? (
                    ticket.studentProvidedFacts.map((fact, idx) => (
                      <li key={idx}>{fact}</li>
                    ))
                  ) : (
                    <li>{ticket.issueSummary}</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* 2. Review AI-Generated Summary & Diagnostic Inferences */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>AI-Generated Summary & Diagnostics</span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="font-semibold text-slate-700 block">Structured Summary:</span>
                <p className="text-slate-900 font-medium mt-0.5">{ticket.issueSummary}</p>
              </div>

              {ticket.aiInferences && ticket.aiInferences.length > 0 && (
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">AI Engineering Inferences:</span>
                  <ul className="space-y-1 text-slate-700">
                    {ticket.aiInferences.map((inf, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-teal-600 font-bold">›</span>
                        <span>{inf}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* 3. Image Observations & Uploaded Photo (when available) */}
          {ticket.imageUrl && (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-2">
                <Camera className="w-4 h-4 text-indigo-600" />
                <span>Uploaded Defect Photograph & Visual Observations</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="shrink-0">
                  <img
                    src={ticket.imageUrl}
                    alt="Facility defect inspection"
                    className="w-40 h-32 object-cover rounded-lg border border-slate-300 shadow-xs"
                  />
                  <span className="text-[10px] text-slate-400 font-mono block mt-1 text-center">
                    Student inspection photo
                  </span>
                </div>

                <div className="text-xs text-slate-700 space-y-2 flex-1">
                  <div>
                    <span className="font-semibold text-slate-900 block mb-1">Visual Observations:</span>
                    <p className="leading-relaxed text-slate-600">
                      {ticket.imageObservations || 'Inspection photo provided by student for physical defect verification.'}
                    </p>
                  </div>

                  {ticket.visualObservations && ticket.visualObservations.length > 0 && (
                    <ul className="list-disc list-inside space-y-1 text-slate-600 pt-1">
                      {ticket.visualObservations.map((obs, idx) => (
                        <li key={idx}>{obs}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 4. Missing-Information Warnings (if any) */}
          {hasMissingInfo && (
            <div className="p-4 rounded-lg bg-amber-50/80 border border-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900 uppercase tracking-wide">
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Missing-Information & Human Review Warnings</span>
              </div>

              {ticket.missingInformation && (
                <p className="text-amber-900">
                  <span className="font-semibold">Missing Info: </span>
                  {ticket.missingInformation}
                </p>
              )}

              {ticket.clarificationQuestion && (
                <p className="text-amber-800 italic">
                  <span className="font-semibold not-italic">AI Asked Student: </span>
                  &ldquo;{ticket.clarificationQuestion}&rdquo;
                </p>
              )}

              {ticket.requiresHumanReview && (
                <div className="text-[11px] font-semibold text-amber-900 bg-amber-100/70 p-2 rounded border border-amber-300">
                  Notice: This report was flagged for supervisor manual verification due to ambiguity or hazard level.
                </div>
              )}
            </div>
          )}

          {/* 5. Linked Reports & Duplicate Consolidation */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-2">
              <LinkIcon className="w-4 h-4 text-indigo-600" />
              <span>Linked Reports & Duplicate History</span>
            </div>

            {hasLinkedReports ? (
              <div className="space-y-2">
                {ticket.relatedTicketId && (
                  <div className="flex items-center gap-2 text-indigo-900 bg-indigo-50/70 p-2.5 rounded border border-indigo-200">
                    <LinkIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      Linked to master ticket: <strong>{ticket.relatedTicketId}</strong> (Flagged by duplicate detection).
                    </span>
                  </div>
                )}

                {ticket.trackedBy && ticket.trackedBy.length > 1 && (
                  <div className="flex items-center gap-2 text-amber-900 bg-amber-50/70 p-2.5 rounded border border-amber-200">
                    <Users className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {ticket.trackedBy.length} students have consolidated their reports onto this single work order.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500">
                No duplicate or linked reports associated with this ticket.
              </p>
            )}
          </div>

          {/* 6. Staff Controls: Department Reassignment & Status Flow */}
          <form onSubmit={handleApplyUpdate} className="pt-2 space-y-5 border-t border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Staff Ticket Management Controls
            </h3>

            {/* Department Reassignment Dropdown */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Assign / Reassign Department
              </label>
              <div className="relative">
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value as DepartmentName)}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer font-medium"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              {selectedDepartment !== ticket.assignedDepartment && (
                <span className="text-[11px] text-teal-700 font-medium block mt-1">
                  Will reassign from &quot;{ticket.assignedDepartment}&quot; to &quot;{selectedDepartment}&quot;
                </span>
              )}
            </div>

            {/* Status Flow: Open → In Progress → Resolved */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 block">
                  Update Ticket Status
                </label>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                  <span>Open</span>
                  <ArrowRight className="w-3 h-3" />
                  <span>In Progress</span>
                  <ArrowRight className="w-3 h-3" />
                  <span>Resolved</span>
                </div>
              </div>

              {/* Status Radio Buttons */}
              <div className="grid grid-cols-3 gap-2.5">
                {(['Open', 'In Progress', 'Resolved'] as TicketStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setSelectedStatus(st);
                      setValidationError('');
                    }}
                    className={`p-3 rounded-lg border text-xs font-semibold text-center transition-all cursor-pointer ${
                      selectedStatus === st
                        ? st === 'Resolved'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : st === 'In Progress'
                          ? 'bg-cyan-700 text-white border-cyan-700 shadow-sm'
                          : 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Staff Update Notes (Technician Action Log) */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Staff Status Log Note (Recorded in Status Audit Trail)
              </label>
              <input
                type="text"
                value={progressNotes}
                onChange={(e) => setProgressNotes(e.target.value)}
                placeholder="E.g., Dispatched electrical crew; replaced breaker in switchboard 2..."
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 bg-white"
              />
            </div>

            {/* Additional Staff Note for Discussion Thread */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Add Field Note (Posted to Ticket Discussion Thread)
              </label>
              <input
                type="text"
                value={staffNote}
                onChange={(e) => setStaffNote(e.target.value)}
                placeholder="E.g., Parts ordered, inspection scheduled for 2:00 PM today..."
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 bg-white"
              />
            </div>

            {/* MANDATORY Resolution Notes when setting to Resolved */}
            {selectedStatus === 'Resolved' && (
              <div className="p-4 rounded-lg bg-emerald-50/90 border border-emerald-300 space-y-2">
                <label className="text-xs font-bold text-emerald-950 flex items-center justify-between">
                  <span>Mandatory Resolution Notes <span className="text-rose-600">*</span></span>
                  <span className="text-[10px] text-emerald-800 font-normal">Displayed directly to reporting student</span>
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Detail the concrete repair actions taken (e.g., Replaced faulty drain gasket, tested water flow for 10 minutes, verified leak is stopped and floor sanitized)..."
                  className="w-full p-2.5 text-xs rounded-md border border-emerald-400 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-emerald-800 block">
                  Staff sign-off: Recording resolution notes transitions the ticket to verified resolved state in the student portal.
                </span>
              </div>
            )}

            {/* Validation Error Message */}
            {validationError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isUpdating}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>{isUpdating ? 'Saving Changes...' : `Save & Apply (${selectedStatus})`}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
