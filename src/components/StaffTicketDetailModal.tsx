import React, { useState } from 'react';
import { Ticket, TicketStatus } from '../types/ticket';
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
  AlertTriangle
} from 'lucide-react';

interface StaffTicketDetailModalProps {
  ticket: Ticket;
  onClose: () => void;
  onUpdateStatus: (
    ticketId: string,
    newStatus: TicketStatus,
    notes: string,
    resolutionNotes?: string
  ) => Promise<void>;
  isUpdating: boolean;
}

export const StaffTicketDetailModal: React.FC<StaffTicketDetailModalProps> = ({
  ticket,
  onClose,
  onUpdateStatus,
  isUpdating,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>(ticket.status);
  const [progressNotes, setProgressNotes] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState(ticket.resolutionNotes || '');
  const [validationError, setValidationError] = useState('');

  const handleApplyUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Strict requirement: Require staff to add resolution notes before marking a ticket resolved
    if (selectedStatus === 'Resolved') {
      if (!resolutionNotes || resolutionNotes.trim().length < 8) {
        setValidationError('Mandatory: Staff must enter detailed resolution notes before marking a ticket as Resolved (minimum 8 characters).');
        return;
      }
    }

    try {
      await onUpdateStatus(
        ticket.ticketId,
        selectedStatus,
        progressNotes || `Staff updated status to ${selectedStatus}`,
        selectedStatus === 'Resolved' ? resolutionNotes.trim() : undefined
      );
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Failed to update status');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <div>
              <div className="text-xs font-mono text-teal-400">STAFF WORK ORDER CONSOLE</div>
              <h2 className="text-base font-bold text-white mt-0.5">{ticket.ticketId}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ticket Summary & Details */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Quick Info Box */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CategoryIcon category={ticket.category} className="w-4 h-4" />
                <span className="text-xs font-bold text-slate-900">{ticket.category}</span>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-600">{ticket.assignedDepartment}</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={ticket.status} size="sm" />
                <PriorityBadge priority={ticket.priority} size="sm" />
              </div>
            </div>

            <h3 className="text-sm font-semibold text-slate-900 leading-snug">
              {ticket.issueSummary}
            </h3>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{ticket.reportedLocation}</span>
              <span className="text-slate-300">·</span>
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Reported by {ticket.reporterName}</span>
            </div>
          </div>

          {/* Safety Hazard Warning if applicable */}
          {ticket.isSafetyHazard && (
            <HazardNotice warning={ticket.safetyWarning} />
          )}

          {/* Attached Photo Preview */}
          {ticket.imageUrl && (
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-4">
              <img
                src={ticket.imageUrl}
                alt="Ticket inspection"
                className="w-20 h-20 object-cover rounded-md border border-slate-300"
              />
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-800 block mb-0.5">Visual Photo Attached:</span>
                {ticket.imageObservations || 'Inspection photo provided by student.'}
              </div>
            </div>
          )}

          {/* Status Update Form */}
          <form onSubmit={handleApplyUpdate} className="pt-2 space-y-4 border-t border-slate-200">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                Update Ticket Status
              </label>

              {/* Status Radio Buttons / Segmented Options */}
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

            {/* General progress notes */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Technician Action Log (Optional)
              </label>
              <input
                type="text"
                value={progressNotes}
                onChange={(e) => setProgressNotes(e.target.value)}
                placeholder="E.g., Dispatched plumber; shut off main riser valve in quadrant 2..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
              />
            </div>

            {/* MANDATORY Resolution Notes when setting to Resolved */}
            {selectedStatus === 'Resolved' && (
              <div className="p-4 rounded-lg bg-emerald-50/80 border border-emerald-200 space-y-2">
                <label className="text-xs font-bold text-emerald-950 flex items-center justify-between">
                  <span>Mandatory Staff Resolution Notes <span className="text-rose-600">*</span></span>
                  <span className="text-[10px] text-emerald-800 font-normal">Displayed to reporting student</span>
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Detail the actions taken to repair this defect (e.g., Replaced blown 20A breaker; tested circuit load; verified voltage stability)..."
                  className="w-full p-2.5 text-xs rounded-md border border-emerald-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-emerald-700 block">
                  Staff confirmation: The physical repair has been tested and meets university standards.
                </span>
              </div>
            )}

            {/* Validation Error Message */}
            {validationError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Submit Action */}
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
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>{isUpdating ? 'Saving Update...' : `Apply Status (${selectedStatus})`}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
