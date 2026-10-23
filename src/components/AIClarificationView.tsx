import React, { useState } from 'react';
import { AnalysisResult, ClarificationMessage } from '../types/ticket';
import { StatusBadge, PriorityBadge, CategoryIcon, HazardNotice } from './Badge';
import { 
  Sparkles, 
  Send, 
  MapPin, 
  CheckCircle2, 
  HelpCircle, 
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  MessageSquare,
  FileText,
  Camera,
  Info
} from 'lucide-react';

interface AIClarificationViewProps {
  currentAnalysis: AnalysisResult;
  messages: ClarificationMessage[];
  originalComplaint?: string;
  imageUrl?: string;
  onSendMessage: (replyText: string) => void;
  isLoading: boolean;
  onProceedToReview: () => void;
  onRestart: () => void;
}

export const AIClarificationView: React.FC<AIClarificationViewProps> = ({
  currentAnalysis,
  messages,
  originalComplaint,
  imageUrl,
  onSendMessage,
  isLoading,
  onProceedToReview,
  onRestart,
}) => {
  const [replyText, setReplyText] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isLoading) return;
    onSendMessage(replyText.trim());
    setReplyText('');
  };

  const handleQuickAnswer = (answer: string) => {
    onSendMessage(answer);
  };

  // Quick suggestion chips based on missing fields
  const quickChips = [
    'Main Library, 2nd Floor East Wing Study Pods',
    'Science Complex B, 1st Floor Lab 104',
    'Engineering Hall, 2nd Floor Room 202',
    'Student Center, 1st Floor South Concourse Entrance',
    'It is active right now and getting worse',
    'Small slow drip, not flooding yet'
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Step Indicator Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 uppercase tracking-wider">
              <span>Step 2 of 4</span>
              <span aria-hidden="true">·</span>
              <span>AI Follow-Up Clarification</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
              {currentAnalysis.isMissingEssentialInfo
                ? 'A Few Additional Details Needed'
                : 'Ticket Details Clarified'}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Gemini analyzed your complaint and identified the category and symptoms.
              {currentAnalysis.isMissingEssentialInfo
                ? ' Please clarify the highlighted questions so maintenance crews know exactly where to dispatch.'
                : ' All essential campus facility details have been captured.'}
            </p>
          </div>

          <button
            onClick={onRestart}
            className="text-xs text-slate-500 hover:text-slate-800 transition-colors p-2 rounded-lg hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Start Over</span>
          </button>
        </div>

        {/* Current Assessment Strip */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block text-[11px]">Category</span>
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 mt-0.5">
              <CategoryIcon category={currentAnalysis.category} className="w-3.5 h-3.5" />
              <span>{currentAnalysis.category}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block text-[11px]">Department</span>
            <div className="font-semibold text-slate-800 mt-0.5 truncate" title={currentAnalysis.assignedDepartment}>
              {currentAnalysis.assignedDepartment}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block text-[11px]">Priority</span>
            <div className="mt-0.5">
              <PriorityBadge priority={currentAnalysis.priority} size="sm" />
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block text-[11px]">Information Status</span>
            <div className="font-semibold mt-0.5">
              {currentAnalysis.isMissingEssentialInfo ? (
                <span className="text-amber-700 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" /> Clarifying
                </span>
              ) : (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Safety Warning if detected */}
        {currentAnalysis.isSafetyHazard && (
          <div className="mt-4">
            <HazardNotice warning={currentAnalysis.safetyWarning} />
          </div>
        )}
      </div>

      {/* Preserved Complaint & Photo Context Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <FileText className="w-4 h-4 text-teal-600" />
            <span>Preserved Intake Context</span>
          </div>
          <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-mono">
            Single Draft Session
          </span>
        </div>

        <div className="mt-3.5 flex flex-col sm:flex-row gap-4 items-start">
          {imageUrl && (
            <div className="shrink-0">
              <img
                src={imageUrl}
                alt="Complaint attachment"
                className="w-24 h-24 object-cover rounded-lg border border-slate-200 shadow-xs"
              />
              <span className="text-[10px] text-slate-400 block text-center mt-1">Uploaded Photo</span>
            </div>
          )}

          <div className="flex-1 space-y-2">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Original Description:
              </span>
              <p className="text-xs sm:text-sm text-slate-800 italic mt-0.5 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                "{originalComplaint || 'Visual defect photo uploaded for facility diagnosis'}"
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>
                Your original complaint, photo, and previous responses remain saved together while we gather missing location specifics.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <MessageSquare className="w-4 h-4 text-teal-600" />
            <span>Clarification Conversation Thread</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">Gemini 3.8 Flash Context</span>
        </div>

        <div className="p-6 space-y-4 max-h-[420px] overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 px-1">
                <span>{msg.role === 'user' ? 'You (Alex Chen)' : 'CampusFix AI'}</span>
                <span aria-hidden="true">·</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div
                className={`max-w-[85%] rounded-xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white font-medium rounded-tr-none'
                    : msg.isQuestion
                    ? 'bg-teal-50 border-2 border-teal-300 text-slate-900 rounded-tl-none shadow-xs'
                    : 'bg-teal-50/70 border border-teal-100 text-slate-900 rounded-tl-none'
                }`}
              >
                {msg.isQuestion && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 mb-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Gemini's Clarification Question</span>
                  </div>
                )}
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-teal-700 bg-teal-50/50 p-3 rounded-lg border border-teal-100 max-w-[80%] animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin text-teal-600" />
              <span>Gemini is evaluating your clarification and updating ticket fields...</span>
            </div>
          )}
        </div>

        {/* Quick Answer Chips */}
        {currentAnalysis.isMissingEssentialInfo && (
          <div className="px-6 py-3 bg-slate-50/60 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Quick Suggestions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickAnswer(chip)}
                  disabled={isLoading}
                  className="px-2.5 py-1 text-xs rounded-md bg-white border border-slate-200 text-slate-700 hover:border-teal-500 hover:text-teal-800 transition-colors cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar or Proceed Banner */}
        <div className="p-4 bg-white border-t border-slate-200">
          {currentAnalysis.isMissingEssentialInfo ? (
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your clarification (e.g. 2nd floor, Room 204 near the water fountain)..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900"
              />
              <button
                type="submit"
                disabled={isLoading || !replyText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium text-xs sm:text-sm transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Location and defect details confirmed. Ready to review ticket.</span>
              </div>
              <button
                type="button"
                onClick={onProceedToReview}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs sm:text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 cursor-pointer"
              >
                <span>Review Structured Ticket</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
