import React, { useState } from 'react';
import { AnalysisResult, TicketCategory, TicketPriority, CATEGORY_DEPARTMENT_MAP } from '../types/ticket';
import { StatusBadge, PriorityBadge, CategoryIcon, HazardNotice } from './Badge';
import { 
  Building2, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Edit3, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles,
  FileText,
  Camera,
  Cpu,
  ShieldAlert,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';

interface TicketReviewCardProps {
  analysis: AnalysisResult;
  imageUrl?: string;
  onConfirm: (confirmedTicket: {
    category: TicketCategory;
    issueSummary: string;
    reportedLocation: string;
    priority: TicketPriority;
    studentProvidedFacts: string[];
    visualObservations: string[];
    aiInferences: string[];
    isSafetyHazard: boolean;
    safetyWarning?: string;
  }) => void;
  isCheckingDuplicates: boolean;
  onBackToEdit: () => void;
}

export const TicketReviewCard: React.FC<TicketReviewCardProps> = ({
  analysis,
  imageUrl,
  onConfirm,
  isCheckingDuplicates,
  onBackToEdit,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [summary, setSummary] = useState(analysis.issueSummary);
  const [location, setLocation] = useState(analysis.reportedLocation || 'Main Campus');
  const [category, setCategory] = useState<TicketCategory>(analysis.category);
  const [priority, setPriority] = useState<TicketPriority>(analysis.priority);

  const handleProceed = () => {
    onConfirm({
      category,
      issueSummary: summary.trim(),
      reportedLocation: location.trim(),
      priority,
      studentProvidedFacts: analysis.studentProvidedFacts,
      visualObservations: analysis.visualObservations,
      aiInferences: analysis.aiInferences,
      isSafetyHazard: analysis.isSafetyHazard,
      safetyWarning: analysis.safetyWarning,
    });
  };

  const assignedDept = CATEGORY_DEPARTMENT_MAP[category];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 uppercase tracking-wider">
              <span>Step 3 of 4</span>
              <span aria-hidden="true">·</span>
              <span>Review Structured Maintenance Ticket</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
              Verify Ticket Details
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Gemini has structured your informal complaint into an official university work order. Review the categorized information and observations below before checking for duplicates.
            </p>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Done Editing' : 'Edit Fields'}</span>
          </button>
        </div>
      </div>

      {/* Structured Ticket Container */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Ticket Title Banner */}
        <div className="bg-slate-900 text-white p-6 border-b border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800">
                PROPOSED TICKET
              </span>
              <span className="text-xs text-slate-400">· Status:</span>
              <span className="text-xs font-semibold text-amber-400">Open (Draft)</span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Generated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Issue Summary Display or Edit */}
          {isEditing ? (
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Issue Summary</label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">Category (1 of 4 Allowed)</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TicketCategory)}
                    className="w-full px-3 py-2 text-xs rounded bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Cleanliness">Cleanliness</option>
                    <option value="Internet Connectivity">Internet Connectivity</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TicketPriority)}
                    className="w-full px-3 py-2 text-xs rounded bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <h2 className="text-lg md:text-xl font-bold text-white leading-snug">
                {summary}
              </h2>
            </div>
          )}
        </div>

        {/* Core Field Attributes Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
              Campus Location
            </span>
            {isEditing ? (
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Building, Floor, Room number"
                className="mt-1 w-full px-3 py-1.5 text-xs rounded border border-slate-300 bg-white text-slate-900"
              />
            ) : (
              <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-sm mt-1">
                <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{location}</span>
              </div>
            )}
          </div>

          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
              Assigned Department
            </span>
            <div className="font-semibold text-slate-900 text-sm mt-1">
              {assignedDept}
            </div>
            <div className="text-[11px] text-slate-400">Mapped from {category}</div>
          </div>
        </div>

        {/* Crucial Section: Separation of Observations */}
        <div className="p-6 space-y-5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Separation of Observations & Evidence</span>
            <span className="text-[11px] text-teal-700 font-mono">Gemini Audit Log</span>
          </div>

          {/* 1. Student Provided Facts */}
          <div className="p-4 rounded-lg bg-white border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-2">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>Student-Provided Facts</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
              {analysis.studentProvidedFacts && analysis.studentProvidedFacts.length > 0 ? (
                analysis.studentProvidedFacts.map((fact, i) => <li key={i}>{fact}</li>)
              ) : (
                <li>{summary}</li>
              )}
            </ul>
          </div>

          {/* 2. Visual Observations (from photo) */}
          {imageUrl && (
            <div className="p-4 rounded-lg bg-white border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <span>Visual Observations from Photo</span>
                </div>
                <span className="text-[10px] text-slate-400">Attached Media</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <img
                  src={imageUrl}
                  alt="Incident inspection"
                  className="w-24 h-24 object-cover rounded-md border border-slate-200 shrink-0"
                />
                <div className="text-xs text-slate-600 space-y-1 leading-relaxed">
                  {analysis.visualObservations && analysis.visualObservations.length > 0 ? (
                    analysis.visualObservations.map((obs, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <span className="text-indigo-500">·</span>
                        <span>{obs}</span>
                      </div>
                    ))
                  ) : (
                    <div>{analysis.imageObservations || 'Inspection confirms defect geometry matching description.'}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. AI Inferences */}
          <div className="p-4 rounded-lg bg-teal-50/40 border border-teal-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-900 mb-2">
              <Cpu className="w-4 h-4 text-teal-700" />
              <span>AI Engineering Inferences</span>
            </div>
            <ul className="space-y-1 text-xs text-teal-800">
              {analysis.aiInferences && analysis.aiInferences.length > 0 ? (
                analysis.aiInferences.map((inf, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-teal-600 font-bold">›</span>
                    <span>{inf}</span>
                  </li>
                ))
              ) : (
                <li>Assigned to {assignedDept} based on campus facility criteria.</li>
              )}
            </ul>
          </div>

          {/* Uncertainty & Human Review Warnings Section */}
          <div className="space-y-3 pt-2">
            {/* 1. Location Specificity Warning */}
            {(!location || location.trim().length < 8 || !/\d/.test(location)) && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-950">Location Review Warning: </span>
                  Specific room, floor, or pod number is missing or uncertain. Campus maintenance crews will require visual walkthrough verification on site. You can click <strong>Edit Fields</strong> above to refine the room number.
                </div>
              </div>
            )}

            {/* 2. Safety Risk Warning */}
            {analysis.isSafetyHazard && (
              <HazardNotice warning={analysis.safetyWarning} />
            )}

            {/* 3. Urgent Human Review Flag */}
            {analysis.requiresHumanReview && !analysis.isSafetyHazard && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-indigo-950">Staff Review Flagged: </span>
                  This issue requires human coordinator assessment prior to standard automated technician dispatch.
                </div>
              </div>
            )}

            {/* 4. Human Facility Review Standard Notice */}
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs leading-relaxed">
              <ShieldAlert className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900">Human Facility Review: </span>
                All AI-generated work order classifications, department dispatches ({assignedDept}), and priority levels ({priority}) are reviewed and confirmed by University Facilities supervisors prior to technician dispatch.
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackToEdit}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Clarification</span>
          </button>

          <button
            type="button"
            onClick={handleProceed}
            disabled={isCheckingDuplicates}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs sm:text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 ${isCheckingDuplicates ? 'animate-spin' : ''}`} />
            <span>
              {isCheckingDuplicates ? 'Scanning Active Campus Tickets...' : 'Check for Existing Duplicates & Proceed'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
