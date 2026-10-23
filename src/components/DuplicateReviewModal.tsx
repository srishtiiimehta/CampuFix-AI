import React from 'react';
import { DuplicateMatch, Ticket } from '../types/ticket';
import { StatusBadge, PriorityBadge, CategoryIcon } from './Badge';
import { 
  CopyCheck, 
  CheckCircle2, 
  MapPin, 
  Users, 
  ArrowRight, 
  AlertCircle, 
  PlusCircle, 
  ShieldCheck,
  Compass
} from 'lucide-react';

interface DuplicateReviewModalProps {
  duplicates: DuplicateMatch[];
  candidateTicket: {
    category: string;
    issueSummary: string;
    reportedLocation: string;
    priority: string;
  };
  onTrackExisting: (existingTicketId: string) => void;
  onSubmitSeparate: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const DuplicateReviewModal: React.FC<DuplicateReviewModalProps> = ({
  duplicates,
  candidateTicket,
  onTrackExisting,
  onSubmitSeparate,
  onCancel,
  isSubmitting,
}) => {
  const hasDuplicates = duplicates.length > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 uppercase tracking-wider">
          <span>Step 4 of 4</span>
          <span aria-hidden="true">·</span>
          <span>Duplicate Review & Submission</span>
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
          {hasDuplicates ? 'Similar Campus Reports Found' : 'No Duplicates Found'}
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          {hasDuplicates
            ? 'Gemini identified active tickets that may cover your issue. You can subscribe to track an existing repair, or submit a separate work order if this is an independent problem.'
            : 'Your report appears to be a new and unique campus maintenance issue. Ready to create an official work order.'}
        </p>
      </div>

      {/* Your Proposed Ticket Summary */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs">
        <span className="font-semibold text-slate-700 block mb-1">Your Report:</span>
        <div className="text-slate-900 font-medium text-sm">{candidateTicket.issueSummary}</div>
        <div className="flex items-center gap-2 text-slate-500 mt-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>{candidateTicket.reportedLocation}</span>
          <span className="text-slate-300" aria-hidden="true">·</span>
          <span>{candidateTicket.category}</span>
        </div>
      </div>

      {/* List of Matched Tickets */}
      {hasDuplicates ? (
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Matching Active Tickets ({duplicates.length})
          </div>

          {duplicates.map(({ ticket, similarityScore, matchReason }) => (
            <div
              key={ticket.ticketId}
              className="bg-white rounded-xl border-2 border-teal-200/90 p-5 shadow-xs space-y-4"
            >
              {/* Match Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-teal-100 text-teal-900 border border-teal-300 tabular-nums">
                    {similarityScore}% Match
                  </span>
                  <span className="text-xs font-mono text-slate-500 font-medium">
                    {ticket.ticketId}
                  </span>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                </div>

                <div className="text-xs text-slate-400 font-mono">
                  Reported {new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
              </div>

              {/* Match Reason Rationale from Gemini */}
              <div className="p-3 rounded-lg bg-teal-50/60 border border-teal-100 text-xs text-teal-950 flex items-start gap-2">
                <CopyCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Why this matches: </span>
                  {matchReason}
                </div>
              </div>

              {/* Existing Ticket Summary */}
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {ticket.issueSummary}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{ticket.reportedLocation}</span>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <span>{ticket.assignedDepartment}</span>
                </div>
              </div>

              {/* Latest Status Note */}
              {ticket.statusHistory && ticket.statusHistory.length > 0 && (
                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-700">Latest Update: </span>
                  {ticket.statusHistory[ticket.statusHistory.length - 1].notes}
                  <span className="text-slate-400 text-[11px] ml-1">
                    ({ticket.statusHistory[ticket.statusHistory.length - 1].updatedBy})
                  </span>
                </div>
              )}

              {/* Action Buttons for this Duplicate */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{ticket.trackedBy?.length || 1} students subscribed to this ticket</span>
                </div>

                <button
                  type="button"
                  onClick={() => onTrackExisting(ticket.ticketId)}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Track This Existing Issue (Recommended)</span>
                </button>
              </div>
            </div>
          ))}

          {/* Fallback Option: Submit Separate */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-slate-900">Is this a distinct problem?</div>
              <p className="text-xs text-slate-500 mt-0.5">
                If your defect is in a different room, equipment, or separate location, you can submit an independent ticket.
              </p>
            </div>
            <button
              type="button"
              onClick={onSubmitSeparate}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold whitespace-nowrap cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Submit Separate Ticket</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No Existing Duplicates Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Our campus records show no open work orders for this area. Your ticket will be dispatched immediately to {candidateTicket.category} crews.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onSubmitSeparate}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting Ticket...' : 'Confirm & Submit Ticket'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
