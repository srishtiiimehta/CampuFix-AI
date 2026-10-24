import React, { useState } from 'react';
import { Ticket } from '../types/ticket';
import { ScrollReveal } from './ScrollReveal';
import { StatusBadge, PriorityBadge, CategoryIcon, HazardNotice } from './Badge';
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  Send, 
  Users, 
  Camera, 
  ShieldCheck, 
  FileText, 
  Cpu,
  RotateCcw
} from 'lucide-react';

interface TicketTrackingViewProps {
  ticket: Ticket;
  currentUserRole: 'student' | 'staff';
  currentUserName: string;
  onBack: () => void;
  onAddNote: (ticketId: string, message: string) => void;
  isAddingNote: boolean;
  onOpenStaffControls?: () => void;
  onRefreshTicket?: () => void;
  isRefreshing?: boolean;
}

export const TicketTrackingView: React.FC<TicketTrackingViewProps> = ({
  ticket,
  currentUserRole,
  currentUserName,
  onBack,
  onAddNote,
  isAddingNote,
  onOpenStaffControls,
  onRefreshTicket,
  isRefreshing,
}) => {
  const [newNote, setNewNote] = useState('');

  const handlePostNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || isAddingNote) return;
    onAddNote(ticket.ticketId, newNote.trim());
    setNewNote('');
  };

  // Stepper calculations
  const steps = [
    { key: 'Open', label: 'Reported & Queued', desc: 'Ticket logged and assigned to department' },
    { key: 'In Progress', label: 'In Progress', desc: 'Facility crew dispatched & diagnostics underway' },
    { key: 'Resolved', label: 'Resolved', desc: 'Repairs completed and verified by supervisor' },
  ];

  const currentStepIndex = ticket.status === 'Open' ? 0 : ticket.status === 'In Progress' ? 1 : 2;

  return (
    <ScrollReveal className="ticket-tracking max-w-4xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors p-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          {onRefreshTicket && (
            <button
              onClick={onRefreshTicket}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
              title="Fetch latest ticket status from server"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Status'}</span>
            </button>
          )}

          {currentUserRole === 'staff' && onOpenStaffControls && (
            <button
              onClick={onOpenStaffControls}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Open Staff Resolution Controls</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Ticket Card Header */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Navy Header Strip */}
        <div className="bg-slate-900 text-white p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-teal-400 tracking-wider">
                {ticket.ticketId}
              </span>

              {ticket.isDemo ? (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
                  DEMO RECORD
                </span>
              ) : (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-700">
                  LIVE WORK ORDER
                </span>
              )}

              <span className="text-slate-500" aria-hidden="true">·</span>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <CategoryIcon category={ticket.category} className="w-4 h-4" />
                <span>{ticket.category}</span>
              </div>

              <span className="text-slate-500" aria-hidden="true">·</span>

              <StatusBadge status={ticket.status} />

              <PriorityBadge priority={ticket.priority} />
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Created {new Date(ticket.createdAt).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-white mt-4 leading-snug">
            {ticket.issueSummary}
          </h1>

          <div className="flex items-center gap-2 text-xs text-slate-300 mt-2">
            <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="font-medium text-white">{ticket.reportedLocation}</span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className="text-slate-300">Dept: {ticket.assignedDepartment}</span>
          </div>
        </div>

        {/* 3-Step Visual Progress Stepper */}
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {steps.map((step, idx) => {
              const isCompleted = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div
                  key={step.key}
                  className={`ticket-progress-step p-3.5 rounded-lg border transition-all ${
                    isCurrent
                      ? 'bg-white border-teal-500 shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-slate-100/70 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCurrent
                          ? 'bg-teal-600 text-white'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-300 text-slate-700'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span className="text-xs font-bold text-slate-900">{step.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 pl-8 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resolution Banner (if Resolved) */}
        {ticket.status === 'Resolved' && (
          <div className="p-6 bg-emerald-50 border-b border-emerald-200">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Ticket Resolved & Verified by Facilities
                </div>
                <p className="text-sm text-emerald-950 font-medium leading-relaxed">
                  {ticket.resolutionNotes || 'All work completed, verified, and inspected according to university facility standards.'}
                </p>
                <div className="text-xs text-emerald-700 font-mono mt-1">
                  Resolved on: {new Date(ticket.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Safety Warning (if Hazard) */}
        {ticket.isSafetyHazard && (
          <div className="p-6 border-b border-slate-200">
            <HazardNotice warning={ticket.safetyWarning} />
          </div>
        )}

        {/* Observation & Evidence Grid */}
        <div className="p-6 space-y-6">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Diagnostic Record & Observations
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Student Facts */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Student-Reported Facts</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
                {ticket.studentProvidedFacts && ticket.studentProvidedFacts.length > 0 ? (
                  ticket.studentProvidedFacts.map((fact, idx) => <li key={idx}>{fact}</li>)
                ) : (
                  <li>{ticket.issueSummary}</li>
                )}
              </ul>
            </div>

            {/* AI Inferences */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-2">
                <Cpu className="w-4 h-4 text-teal-600" />
                <span>AI Engineering Inferences</span>
              </div>
              <ul className="space-y-1 text-xs text-slate-600">
                {ticket.aiInferences && ticket.aiInferences.length > 0 ? (
                  ticket.aiInferences.map((inf, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-teal-600 font-bold">›</span>
                      <span>{inf}</span>
                    </li>
                  ))
                ) : (
                  <li>Assigned to {ticket.assignedDepartment}.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Optional Photo Attachment */}
          {ticket.imageUrl && (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-3">
                <Camera className="w-4 h-4 text-indigo-600" />
                <span>Attached Photographic Evidence</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <img
                  src={ticket.imageUrl}
                  alt="Inspection Evidence"
                  className="w-48 h-36 object-cover rounded-lg border border-slate-300"
                />
                <div className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-800 block mb-1">Visual Analysis:</span>
                  {ticket.imageObservations || 'Inspection visual data confirms defect matching description.'}
                </div>
              </div>
            </div>
          )}

          {/* Tracked by other students */}
          {ticket.trackedBy && ticket.trackedBy.length > 1 && (
            <div className="p-3.5 rounded-lg bg-slate-100/70 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Users className="w-4 h-4 text-slate-500" />
                <span className="font-semibold">
                  {ticket.trackedBy.length} Students Tracking This Issue
                </span>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">Consolidated Single Work Order</span>
            </div>
          )}
        </div>
      </div>

      {/* Dedicated Staff Updates Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Staff Updates & Facility Dispatches
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {ticket.assignedDepartment}
          </span>
        </div>

        {(() => {
          const staffEvents = (ticket.statusHistory || []).filter(
            (h) => h.role === 'staff' || (h.role === 'system' && h.status !== 'Open')
          );
          const staffNotes = (ticket.notesThread || []).filter((n) => n.role === 'staff');

          const hasStaffUpdates = staffEvents.length > 0 || staffNotes.length > 0;

          if (!hasStaffUpdates) {
            return (
              <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-500 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  No technician notes logged yet. Dispatch is queued with {ticket.assignedDepartment}.
                </span>
              </div>
            );
          }

          return (
            <div className="mt-4 space-y-3">
              {staffEvents.map((evt) => (
                <div key={evt.id} className="p-3.5 rounded-lg bg-teal-50/60 border border-teal-100 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{evt.updatedBy}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                        Facility Staff
                      </span>
                      <StatusBadge status={evt.status} size="sm" />
                    </div>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {new Date(evt.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed font-medium">{evt.notes}</p>
                </div>
              ))}

              {staffNotes.map((note) => (
                <div key={note.id} className="p-3.5 rounded-lg bg-slate-900 text-white text-xs border border-slate-800">
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-teal-300">{note.author}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        Field Note
                      </span>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {new Date(note.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-200 leading-relaxed">{note.message}</p>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Status History Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Status History & Audit Trail
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {ticket.statusHistory?.length || 0} events recorded
          </span>
        </div>

        <div className="mt-6 space-y-6 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200">
          {ticket.statusHistory?.map((hist, idx) => (
            <div key={hist.id || idx} className="relative flex items-start gap-4 pl-2">
              <div className="w-3 h-3 rounded-full bg-teal-600 ring-4 ring-white shrink-0 mt-1" />
              <div className="flex-1 bg-slate-50 rounded-lg p-3.5 border border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={hist.status} size="sm" />
                    <span className="font-bold text-slate-900">{hist.updatedBy}</span>
                    <span className="text-slate-400">({hist.role})</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {new Date(hist.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {hist.notes}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Discussion & Updates Thread */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Ticket Discussion & Field Notes
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            {ticket.notesThread?.length || 0} messages
          </span>
        </div>

        {/* Existing Thread Messages */}
        <div className="space-y-3">
          {ticket.notesThread && ticket.notesThread.length > 0 ? (
            ticket.notesThread.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-lg text-xs leading-relaxed border ${
                  n.role === 'staff'
                    ? 'bg-slate-900 text-slate-100 border-slate-800'
                    : 'bg-slate-50 text-slate-800 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between font-medium mb-1">
                  <span className={n.role === 'staff' ? 'text-teal-400 font-bold' : 'text-slate-900 font-semibold'}>
                    {n.author} {n.role === 'staff' ? '(Staff)' : '(Student)'}
                  </span>
                  <span className="text-[11px] opacity-70 font-mono">
                    {new Date(n.timestamp).toLocaleString()}
                  </span>
                </div>
                <p>{n.message}</p>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-400 text-center py-4">
              No notes or additional comments yet.
            </div>
          )}
        </div>

        {/* Add Note Form */}
        <form onSubmit={handlePostNote} className="pt-2 flex gap-2">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder={`Add a field note or question as ${currentUserName}...`}
            disabled={isAddingNote}
            className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
          />
          <button
            type="submit"
            disabled={isAddingNote || !newNote.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post Note</span>
          </button>
        </form>
      </div>
    </ScrollReveal>
  );
};
